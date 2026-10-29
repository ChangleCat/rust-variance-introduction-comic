#!/usr/bin/env node
// 把动画逐帧导出成 MP4：画面（含字幕）+ 配音 + 音效 + 背景音乐。
// 每一帧都是 t 的纯函数，所以导出结果与浏览器里看到的一模一样。
//
// 用法：node tools/render-video.mjs [--fps 30] [--from 0] [--to 秒] [--out out/variance.mp4] [--crf 18] [--nosub]
//       --crf 越大文件越小（仓库里的 video/ 用 26）
// 依赖：Node 22+（自带 WebSocket）、Google Chrome（可用 CHROME 环境变量指定路径）、ffmpeg
// 建议先运行 node tools/gen-voice.mjs 生成配音，否则视频没有人声。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : def;
};
const FPS = parseFloat(opt('fps', '30'));
const OUT = path.resolve(opt('out', path.join(root, 'out/variance.mp4')));
const NOSUB = args.includes('--nosub');
const CRF = opt('crf', '18');
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('找不到 Chrome，请用 CHROME=/path/to/chrome 指定');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'variance-render-'));

// ---------- 静态服务器 ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

// ---------- 启动 Chrome 并连上 DevTools 协议 ----------
const dport = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${path.join(tmp, 'profile')}`, '--window-size=1920,1080', '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 100 && !target; i++) {
  await new Promise((r) => setTimeout(r, 100));
  try {
    target = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: 'PUT' })).json();
  } catch {}
}
if (!target) throw new Error('Chrome 没有启动');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0;
const pending = new Map(), waiters = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === msg.method) { waiters[i].resolve(msg.params); waiters.splice(i, 1); }
  }
};
const send = (method, params) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
const loaded = once('Page.loadEventFired');
await send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?render${NOSUB ? '&nosub' : ''}` });
await loaded;
await evaluate('document.fonts.ready.then(() => true)');
const TL = JSON.parse(await evaluate('JSON.stringify(window.__TL)'));
const FROM = parseFloat(opt('from', '0')), TO = Math.min(TL.total, parseFloat(opt('to', String(TL.total))));
console.log(`时间轴 ${TL.total.toFixed(1)}s，导出 ${FROM}s–${TO.toFixed(1)}s @ ${FPS}fps`);

// ---------- 画面 ----------
const videoPath = path.join(tmp, 'video.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', CRF, '-preset', 'slow', videoPath], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((r) => ff.on('close', r));
const frames = Math.round((TO - FROM) * FPS);
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await evaluate(`__seek(${(FROM + i / FPS).toFixed(4)})`);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  if (!ff.stdin.write(Buffer.from(shot.data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 60 === 0 || i === frames - 1) {
    const el = (Date.now() - t0) / 1000, eta = (el / (i + 1)) * (frames - i - 1);
    process.stdout.write(`\r画面 ${i + 1}/${frames}  已用 ${el.toFixed(0)}s  剩余约 ${eta.toFixed(0)}s   `);
  }
}
ff.stdin.end();
await ffDone;
console.log('\n画面完成');

// ---------- 音效 + 背景音乐（分段离线渲染，段首多渲染 3 秒再裁掉，避免接缝） ----------
const PAD = 3, CHUNK = 60;
const chunks = [];
for (let cs = FROM; cs < TO; cs += CHUNK) {
  const rf = Math.max(0, cs - PAD), to = Math.min(TO, cs + CHUNK);
  const b64 = await evaluate(`__renderAudio({ from: ${rf}, to: ${to} })`);
  const f = path.join(tmp, `fx_${chunks.length}.wav`);
  fs.writeFileSync(f, Buffer.from(b64, 'base64'));
  chunks.push({ f, trim: cs - rf });
}
const fxPath = path.join(tmp, 'fx.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...chunks.flatMap((c) => ['-i', c.f]), '-filter_complex', chunks.map((c, i) => `[${i}:a]atrim=start=${c.trim},asetpts=PTS-STARTPTS[a${i}]`).join(';') + ';' + chunks.map((_, i) => `[a${i}]`).join('') + `concat=n=${chunks.length}:v=0:a=1[out]`, '-map', '[out]', fxPath]);
console.log('音效与音乐完成');

// ---------- 配音 ----------
const voiced = TL.lines.filter((l) => l.t >= FROM && l.t < TO && fs.existsSync(path.join(root, 'voice', `${l.id}.mp3`)));
if (!voiced.length) console.warn('没有找到配音文件（voice/*.mp3），视频将没有人声。先运行：node tools/gen-voice.mjs');
const mixPath = path.join(tmp, 'mix.wav');
if (voiced.length) {
  const inputs = ['-i', fxPath, ...voiced.flatMap((l) => ['-i', path.join(root, 'voice', `${l.id}.mp3`)])];
  const fc = voiced.map((l, i) => { const ms = Math.round((l.t - FROM) * 1000); return `[${i + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=1.15[v${i}]`; }).join(';') + ';[0:a]' + voiced.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${voiced.length + 1}:normalize=0:duration=first,alimiter=limit=0.95[out]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', fc, '-map', '[out]', mixPath]);
} else fs.copyFileSync(fxPath, mixPath);

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoPath, '-i', mixPath, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT]);
console.log(`完成：${path.relative(process.cwd(), OUT)}（${voiced.length} 句配音）`);

ws.close();
const exited = new Promise((r) => chrome.on('exit', r));
chrome.kill();
await exited;
server.close();
fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
