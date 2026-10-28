# Rust 四种型变介绍动画

一部约 12 分钟的中文动画：从“一笼猫是不是一笼动物”讲起，经过 Java 数组的教训、各门语言的演进，来到 Rust 的生命周期，逐一拆解**协变、逆变、不变、双变**在代码里的样子，最后走进 rustc，看编译器如何推断型变。

主演：**Claude**（讲解）与 **Ferris**（Rust 吉祥物，提问），客串：**rustc** 机器人、猫、狗和一只幽灵。

## 观看

**直接看视频：** [video/rust-variance.mp4](video/rust-variance.mp4)（1080p，11 分 57 秒，带字幕、配音、音效和音乐）

**或者在浏览器里交互播放**（纯静态网页，无需构建、无第三方依赖）：

- 直接双击打开 `index.html`，或
- 在仓库目录运行 `python3 -m http.server`，访问 <http://localhost:8000>

播放器支持：章节跳转、拖动进度条、0.75×–1.5× 倍速、字幕/配音/音效/音乐开关、全屏。
快捷键：`空格` 播放/暂停，`←/→` 快退/快进 5 秒，`[ / ]` 上一个/下一个场景，`F` 全屏。
URL 参数：`?t=120` 从第 120 秒开始，`?scene=v_invariant` 直接跳到某个场景（场景 id 见 [docs/script.md](docs/script.md)）。

### 声音

- **音效与背景音乐**：全部用 WebAudio 现场合成（`src/audio.js`），没有任何外部素材。
- **配音**：`voice/` 里是用 [IndexTTS 2.5](https://github.com/index-tts/index-tts) 生成的 89 句配音，三个角色各用一个官方示例音色（Claude：`voice_09`，Ferris：`voice_03`，rustc：`voice_10` 并加了一点电子回声）。缺少配音文件时，播放器会退回浏览器自带的中文朗读。

  修改文案后重新生成配音：

  ```bash
  # 1. 导出任务
  node tools/gen-voice.mjs --export-jobs jobs.json --ref claude=examples/voice_09.wav --ref ferris=examples/voice_03.wav --ref rustc=examples/voice_10.wav
  # 2. 在装有 IndexTTS 2.5 的机器上，于其 src 目录运行（模型只加载一次）
  python indextts_batch.py --model_dir ../models/IndexTeam_IndexTTS-2.5 --jobs jobs.json --out wavs --fp16
  # 3. 把 wavs 拷回来，转成 mp3 并写入 voice/manifest.js
  node tools/gen-voice.mjs --from-wavs wavs
  ```

  没有 IndexTTS 时，也可以在 macOS 上用系统语音快速生成：`node tools/gen-voice.mjs`（音色较机械）。

### 导出视频

```bash
node tools/render-video.mjs            # 输出 out/variance.mp4（1080p30，含字幕、配音、音效、音乐）
node tools/render-video.mjs --crf 26 --out video/rust-variance.mp4   # 仓库里那份视频的导出参数
node tools/render-video.mjs --from 290 --to 400 --out out/part.mp4   # 只导出一段
```

需要 Node 22+、Google Chrome 和 ffmpeg。每一帧都是时间 `t` 的纯函数，导出结果与网页播放完全一致。

## 文档

动画按“先定文档结构和配音文案，再做动画”的顺序完成：

- [docs/storyboard.md](docs/storyboard.md)：分镜与文档结构，包括章节、节奏原则、每个场景的画面与音效。
- [docs/script.md](docs/script.md)：逐句配音文案，由 `node tools/export-script.mjs` 从 `src/script.js` 生成。

## 章节

| 章节 | 内容 |
| --- | --- |
| 开场 | Ferris 发现 `&'static str` 能传、`&mut` 却不行 |
| 第一章 · 起源 | Simula 与子类型、Liskov 替换原则、类型构造器、Java 数组的 `ArrayStoreException`、Cardelli 的函数子类型 |
| 第二章 · 发展 | Java 通配符（使用处型变）、C# / Kotlin / Scala（声明处型变）、TypeScript 的双变、四种态度 |
| 第三章 · Rust 登场 | 没有继承的 Rust；生命周期就是子类型关系，`'long <: 'short` |
| 第四章 · 四种型变 | `&'a T` 协变、`&'a mut T` 不变（悬垂引用慢动作）、`fn(T)` 逆变、双变与 `PhantomData`、口诀与速查表 |
| 第五章 · 走进 rustc | 型变之格、逐字段收集约束、位置的乘法（xform）、递归类型的不动点、型变表如何参与类型比较与借用检查 |
| 尾声 | 回顾 |

片中出现的 Rust 代码和编译器报错都用 rustc 1.94 实际编译验证过。

## 目录结构

```text
index.html              播放器页面
src/script.js           全片唯一的文案来源（字幕 / 配音 / 文档）
src/engine.js           时间轴、缓动、SVG 工具
src/audio.js            合成音效、背景音乐、配音播放、离线音轨渲染
src/characters.js       Claude、Ferris、rustc、猫、狗
src/widgets.js          代码面板（Rust 高亮 + 打字机）、箭头、徽章、笼子、光带……
src/scenes/*.js         各章节场景
src/player.js           播放器与控制条
tools/                  文案导出、配音生成、视频导出脚本
docs/                   分镜与配音文案
```

## 原始需求

<details>
<summary>第一轮提示词</summary>

/goal 我现在要你制作一个对 Rust 四种型变（协变、逆变、不变、双变）进行生动形象直观的介绍的动画。内容上，从型变的起源讲起，当时遇到了什么问题，型变后来发展，再是到Rust的登场，生命周期也是一种关系，然后开始重点介绍 Rust 中的四种型变以及具体在代码中的体现，最后进入 Rust 编译器，讲编译器是如何判断型变的。以上的内容介绍是粗略的，未经过动画视频节奏验证的，需要你进行积极地补充或添加内容，让内容饱满，让最终的动画节奏变得舒服。动画中需要出现但不仅仅需要出现主要的两个形象：Claude的形象和Rust吉祥物的形象。其他形象按需补充。音效自己配。先确定文档结构和配音文案，再制作动画。请不要吝啬你制作动画的才华，代码是一部分，动画才是关键。

</details>
