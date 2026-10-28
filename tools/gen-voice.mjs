#!/usr/bin/env node
// 生成全部配音，写入 voice/*.mp3 与 voice/manifest.js。播放器检测到 manifest 后会改用真实配音。
//
// 两种来源：
// A. IndexTTS 2.5（推荐，音色自然；需要一台装好 IndexTTS 的机器，见 tools/indextts_batch.py）
//    node tools/gen-voice.mjs --export-jobs jobs.json --ref claude=examples/voice_09.wav --ref ferris=examples/voice_03.wav --ref rustc=examples/voice_10.wav
//    （在 IndexTTS 机器上运行 indextts_batch.py 得到一批 wav）
//    node tools/gen-voice.mjs --from-wavs <wav 目录>
// B. macOS 自带的 say（无需额外环境，音色较机械）
//    node tools/gen-voice.mjs [--voice Tingting] [--only op_hook_0,op_hook_1] [--force]
//
// 依赖：ffmpeg、ffprobe（B 还需要 macOS）
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
const lines = flatten();

// ---------- A1. 导出 IndexTTS 任务 ----------
if (opt('export-jobs')) {
  const refs = {};
  args.forEach((a, i) => { if (a === '--ref') { const [who, p] = args[i + 1].split('='); refs[who] = p; } });
  for (const who of new Set(lines.map((l) => l.who))) if (!refs[who]) throw new Error(`缺少 --ref ${who}=参考音频`);
  const jobs = { lang: 'ZH', refs, lines: lines.map((l) => ({ id: l.id, who: l.who, text: l.speak })) };
  fs.writeFileSync(opt('export-jobs'), JSON.stringify(jobs, null, 1));
  console.log(`导出 ${jobs.lines.length} 句 → ${opt('export-jobs')}`);
  process.exit(0);
}

// 统一的后期：去掉首尾静音、统一响度；rustc 额外加一点电子回声
const TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse';
const LOUD = 'loudnorm=I=-18:TP=-2:LRA=11';
const outDir = path.join(root, 'voice');
fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, 'manifest.js');
let old = {};
if (fs.existsSync(manifestPath)) {
  const m = fs.readFileSync(manifestPath, 'utf8').match(/=\s*(\{[\s\S]*\});?\s*$/);
  if (m) old = JSON.parse(m[1]).lines || {};
}
const toMp3 = (input, filter, mp3) => {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-af', `${filter},${TRIM},${LOUD}`, '-ar', '44100', '-ac', '1', '-b:a', '64k', mp3]);
  return Math.round(parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString()) * 1000) / 1000;
};
const result = {};
let generator;

if (opt('from-wavs')) {
  // ---------- A2. 导入 IndexTTS 生成的 wav ----------
  const dir = path.resolve(opt('from-wavs'));
  const POST = { claude: 'aresample=44100', ferris: 'aresample=44100', rustc: 'aresample=44100,aecho=0.8:0.5:30:0.2' };
  for (const l of lines) {
    const wav = path.join(dir, `${l.id}.wav`);
    if (!fs.existsSync(wav)) {
      console.warn(`缺少 ${l.id}.wav`);
      continue;
    }
    result[l.id] = toMp3(wav, POST[l.who], path.join(outDir, `${l.id}.mp3`));
    process.stdout.write(`${l.id.padEnd(22)} ${result[l.id].toFixed(2)}s  ${l.text}\n`);
  }
  generator = 'IndexTTS 2.5';
} else {
  // ---------- B. macOS say ----------
  const VOICE = opt('voice', 'Tingting');
  const ONLY = opt('only', '') ? new Set(opt('only').split(',')) : null;
  const FORCE = args.includes('--force');
  // 每个角色的语速与声音处理：Ferris 音调更高、更快；rustc 音调更低，带一点金属回声
  const STYLE = {
    claude: { rate: 190, filter: 'aresample=44100' },
    ferris: { rate: 200, filter: 'aresample=44100,asetrate=51156,aresample=44100,atempo=0.94' },
    rustc: { rate: 185, filter: 'aresample=44100,asetrate=38808,aresample=44100,atempo=1.1,aecho=0.8:0.5:35:0.25' },
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'variance-voice-'));
  for (const l of lines) {
    const mp3 = path.join(outDir, `${l.id}.mp3`);
    if ((ONLY && !ONLY.has(l.id)) || (!FORCE && !ONLY && old[l.id] && fs.existsSync(mp3))) {
      if (old[l.id] && fs.existsSync(mp3)) result[l.id] = old[l.id];
      continue;
    }
    const aiff = path.join(tmp, `${l.id}.aiff`);
    execFileSync('say', ['-v', VOICE, '-r', String(STYLE[l.who].rate), '-o', aiff, l.speak]);
    result[l.id] = toMp3(aiff, STYLE[l.who].filter, mp3);
    process.stdout.write(`${l.id.padEnd(22)} ${result[l.id].toFixed(2)}s  ${l.text}\n`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  generator = `macOS say -v ${VOICE}`;
}

const manifest = { generator, lines: result };
fs.writeFileSync(manifestPath, `// 由 tools/gen-voice.mjs 生成\nwindow.VOICE_MANIFEST = ${JSON.stringify(manifest, null, 1)};\n`);
const total = Object.values(result).reduce((a, b) => a + b, 0);
console.log(`\n共 ${Object.keys(result).length} 句，配音总长 ${(total / 60).toFixed(1)} 分钟 → voice/manifest.js`);
