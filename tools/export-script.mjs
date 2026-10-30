#!/usr/bin/env node
// 把 src/script.js 导出成 docs/script.md（配音文案），保证文档与动画永远一致。
// 用法：node tools/export-script.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { SCRIPT, SPEAKERS, estimateDuration } = require(path.join(root, 'src/script.js'));
// 有配音时用 voice/manifest.js 的实测时长，否则用估算
globalThis.window = globalThis;
try { require(path.join(root, 'voice/manifest.js')); } catch {}
const real = (globalThis.VOICE_MANIFEST && globalThis.VOICE_MANIFEST.lines) || {};

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
let out = `# 配音文案

> 本文件由 \`node tools/export-script.mjs\` 从 \`src/script.js\` 自动生成，请勿手改。
> 画面与音效设计见 [storyboard.md](storyboard.md)。
>
> 说话人：**Claude**（讲解）、**Ferris**（提问）、**rustc**（编译器）。
> “朗读”一栏只在字幕含代码符号时出现，是给配音引擎读的版本。

`;
let total = 0, count = 0;
const toc = [];
let body = '';
for (const ch of SCRIPT) {
  toc.push(`- [${ch.title}：${ch.subtitle}](#${ch.id})`);
  body += `\n<a id="${ch.id}"></a>\n## ${ch.title}：${ch.subtitle}\n`;
  for (const sc of ch.scenes) {
    const secs = sc.lines.reduce((a, l, i) => a + (real[`${sc.id}_${i}`] || estimateDuration(l[2] || l[1])), 0);
    body += `\n### ${sc.title} \`${sc.id}\`（约 ${Math.round(secs)} 秒配音）\n\n| # | 角色 | 台词 | 朗读 |\n| --- | --- | --- | --- |\n`;
    sc.lines.forEach((l, i) => {
      const esc = (s) => s.replace(/\|/g, '\\|');
      body += `| ${i + 1} | ${SPEAKERS[l[0]].name} | ${esc(l[1])} | ${l[2] ? esc(l[2]) : ''} |\n`;
    });
    total += secs;
    count += sc.lines.length;
  }
}
out += `共 ${count} 句，纯配音约 ${fmt(total)}（加上句间停顿、章节卡与动画留白，成片约 9 分钟）。\n\n## 目录\n\n${toc.join('\n')}\n${body}`;
fs.writeFileSync(path.join(root, 'docs/script.md'), out);
console.log(`docs/script.md：${count} 句，配音约 ${fmt(total)}`);
