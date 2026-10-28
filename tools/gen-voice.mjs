#!/usr/bin/env node
// 用 macOS 自带的 say（默认“婷婷”）+ ffmpeg 生成全部配音，写入 voice/*.mp3 与 voice/manifest.js。
// 播放器检测到 manifest 后会改用真实配音，并按实测时长重新排时间轴。
//
// 用法：node tools/gen-voice.mjs [--voice Tingting] [--only op_hook_0,op_hook_1] [--force]
// 依赖：macOS 的 say、ffmpeg、ffprobe
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { flatten } = require(path.join(root, 'src/script.js'));

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : def;
};
const VOICE = opt('voice', 'Tingting');
const ONLY = opt('only', '') ? new Set(opt('only').split(',')) : null;
const FORCE = args.includes('--force');

// 每个角色的语速与声音处理：Ferris 音调更高、更快；rustc 音调更低，带一点金属回声
const STYLE = {
  claude: { rate: 190, filter: 'aresample=44100' },
  ferris: { rate: 200, filter: 'aresample=44100,asetrate=51156,aresample=44100,atempo=0.94' },
  rustc: { rate: 185, filter: 'aresample=44100,asetrate=38808,aresample=44100,atempo=1.1,aecho=0.8:0.5:35:0.25' },
};
const TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse';

const outDir = path.join(root, 'voice');
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'variance-voice-'));
const manifestPath = path.join(outDir, 'manifest.js');
let old = {};
if (fs.existsSync(manifestPath)) {
  const m = fs.readFileSync(manifestPath, 'utf8').match(/=\s*(\{[\s\S]*\});?\s*$/);
  if (m) old = JSON.parse(m[1]).lines || {};
}

const lines = flatten();
const result = {};
for (const l of lines) {
  const mp3 = path.join(outDir, `${l.id}.mp3`);
  if (ONLY && !ONLY.has(l.id)) {
    if (old[l.id] && fs.existsSync(mp3)) result[l.id] = old[l.id];
    continue;
  }
  if (!FORCE && !ONLY && old[l.id] && fs.existsSync(mp3)) {
    result[l.id] = old[l.id];
    continue;
  }
  const st = STYLE[l.who];
  const aiff = path.join(tmp, `${l.id}.aiff`);
  execFileSync('say', ['-v', VOICE, '-r', String(st.rate), '-o', aiff, l.speak]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-af', `${st.filter},${TRIM}`, '-ac', '1', '-b:a', '64k', mp3]);
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString());
  result[l.id] = Math.round(dur * 1000) / 1000;
  process.stdout.write(`${l.id.padEnd(22)} ${result[l.id].toFixed(2)}s  ${l.text}\n`);
}
fs.rmSync(tmp, { recursive: true, force: true });

const manifest = { generator: `macOS say -v ${VOICE}`, lines: result };
fs.writeFileSync(manifestPath, `// 由 tools/gen-voice.mjs 生成\nwindow.VOICE_MANIFEST = ${JSON.stringify(manifest, null, 1)};\n`);
const total = Object.values(result).reduce((a, b) => a + b, 0);
console.log(`\n共 ${Object.keys(result).length} 句，配音总长 ${(total / 60).toFixed(1)} 分钟 → voice/manifest.js`);
