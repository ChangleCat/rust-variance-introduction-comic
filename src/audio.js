// 声音：全部音效和背景音乐都用 WebAudio 现场合成，没有任何外部素材。
// 每个合成器的签名都是 (ctx, out, t0)，所以既能实时播放，也能用 OfflineAudioContext 导出视频音轨。
(function () {
  const V = (window.V = window.V || {});

  // ---------- 小工具 ----------
  function env(ctx, g, t0, a, peak, d, sustain) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain || 0.0001), t0 + a + d);
  }
  function osc(ctx, out, type, f, t0, dur, peak, a) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    env(ctx, g, t0, a || 0.005, peak, dur);
    o.connect(g).connect(out);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  }
  const noiseCache = new WeakMap();
  function noiseBuf(ctx) {
    if (noiseCache.has(ctx)) return noiseCache.get(ctx);
    const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x7fffffff) * 2 - 1; }
    noiseCache.set(ctx, b);
    return b;
  }
  function noise(ctx, out, t0, dur, peak, filterType, f0, f1, q) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf(ctx);
    f.type = filterType || 'bandpass';
    f.frequency.setValueAtTime(f0 || 1000, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    f.Q.value = q || 1;
    env(ctx, g, t0, Math.min(0.02, dur / 4), peak, dur);
    src.connect(f).connect(g).connect(out);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.05);
  }
  function sweep(ctx, out, type, f0, f1, t0, dur, peak) {
    const o = osc(ctx, out, type, f0, t0, dur, peak, 0.01);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    return o;
  }

  // ---------- 音效库 ----------
  const SFX = {
    pop: (c, o, t) => { sweep(c, o, 'sine', 420, 1100, t, 0.09, 0.35); },
    pop2: (c, o, t) => { sweep(c, o, 'sine', 700, 1500, t, 0.07, 0.3); },
    click: (c, o, t) => { noise(c, o, t, 0.025, 0.25, 'highpass', 3000); },
    type: (c, o, t) => { for (let i = 0; i < 6; i++) noise(c, o, t + i * 0.075 + (i % 2) * 0.012, 0.02, 0.12, 'bandpass', 2500 + (i % 3) * 600, null, 3); },
    whoosh: (c, o, t) => { noise(c, o, t, 0.55, 0.35, 'bandpass', 300, 2400, 1.2); },
    swish: (c, o, t) => { noise(c, o, t, 0.3, 0.25, 'bandpass', 1800, 500, 1.5); },
    ding: (c, o, t) => { osc(c, o, 'sine', 1318.5, t, 1.1, 0.22); osc(c, o, 'sine', 2637, t, 0.6, 0.06); },
    ok: (c, o, t) => { osc(c, o, 'triangle', 880, t, 0.18, 0.2); osc(c, o, 'triangle', 1318.5, t + 0.09, 0.4, 0.2); },
    chime: (c, o, t) => { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => osc(c, o, 'sine', f, t + i * 0.07, 0.8, 0.13)); },
    sparkle: (c, o, t) => { for (let i = 0; i < 7; i++) osc(c, o, 'sine', 2000 + ((i * 377) % 1500), t + i * 0.045, 0.25, 0.07); },
    boing: (c, o, t) => {
      const x = osc(c, o, 'sine', 180, t, 0.5, 0.3, 0.01), l = c.createOscillator(), lg = c.createGain();
      x.frequency.exponentialRampToValueAtTime(420, t + 0.35);
      l.frequency.value = 18; lg.gain.value = 40; l.connect(lg).connect(x.frequency); l.start(t); l.stop(t + 0.55);
    },
    error: (c, o, t) => {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(o);
      osc(c, lp, 'sawtooth', 110, t, 0.45, 0.22, 0.01); osc(c, lp, 'sawtooth', 116.5, t, 0.45, 0.22, 0.01);
    },
    alarm: (c, o, t) => { for (let i = 0; i < 4; i++) osc(c, o, 'square', i % 2 ? 660 : 880, t + i * 0.16, 0.14, 0.08); },
    boom: (c, o, t) => { noise(c, o, t, 1.1, 0.6, 'lowpass', 1400, 120, 0.7); sweep(c, o, 'sine', 120, 35, t, 0.8, 0.5); },
    crack: (c, o, t) => { for (let i = 0; i < 5; i++) noise(c, o, t + i * 0.05, 0.06, 0.3, 'highpass', 1500 + i * 300); },
    stamp: (c, o, t) => { sweep(c, o, 'sine', 160, 60, t, 0.25, 0.6); noise(c, o, t, 0.12, 0.3, 'lowpass', 600); },
    snap: (c, o, t) => { noise(c, o, t, 0.03, 0.4, 'highpass', 2500); osc(c, o, 'square', 300, t, 0.04, 0.08); },
    clank: (c, o, t) => { [523, 1187, 1851, 2630].forEach((f, i) => osc(c, o, 'sine', f, t, 0.5 - i * 0.08, 0.09)); },
    gear: (c, o, t) => { for (let i = 0; i < 8; i++) noise(c, o, t + i * 0.09, 0.03, 0.12, 'bandpass', 900, null, 6); },
    rise: (c, o, t) => { sweep(c, o, 'triangle', 300, 1200, t, 0.5, 0.18); },
    fall: (c, o, t) => { sweep(c, o, 'triangle', 1000, 220, t, 0.5, 0.18); },
    tada: (c, o, t) => { [523.25, 659.25, 783.99].forEach((f, i) => osc(c, o, 'triangle', f, t + i * 0.08, 1.4, 0.12)); osc(c, o, 'triangle', 1046.5, t + 0.26, 1.6, 0.12); },
    step: (c, o, t) => { for (let i = 0; i < 6; i++) noise(c, o, t + i * 0.11, 0.035, 0.18, 'bandpass', 700 + (i % 2) * 300, null, 4); },
    beep: (c, o, t) => { osc(c, o, 'square', 1200, t, 0.08, 0.07); },
    scan: (c, o, t) => { for (let i = 0; i < 3; i++) osc(c, o, 'sine', 1500 + i * 250, t + i * 0.1, 0.08, 0.1); },
    lock: (c, o, t) => { noise(c, o, t, 0.05, 0.4, 'highpass', 2000); osc(c, o, 'square', 220, t + 0.05, 0.08, 0.12); },
    ghost: (c, o, t) => {
      const x = osc(c, o, 'sine', 300, t, 1.0, 0.16, 0.2), l = c.createOscillator(), lg = c.createGain();
      x.frequency.linearRampToValueAtTime(520, t + 0.9); l.frequency.value = 6; lg.gain.value = 18; l.connect(lg).connect(x.frequency); l.start(t); l.stop(t + 1.05);
    },
    cork: (c, o, t) => { sweep(c, o, 'sine', 900, 300, t, 0.08, 0.4); noise(c, o, t, 0.04, 0.2, 'highpass', 3000); },
    bug: (c, o, t) => { const x = osc(c, o, 'sawtooth', 210, t, 0.6, 0.05, 0.05); const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 30; lg.gain.value = 25; l.connect(lg).connect(x.frequency); l.start(t); l.stop(t + 0.65); },
    hiss: (c, o, t) => { noise(c, o, t, 0.7, 0.2, 'highpass', 4000); },
    rewind: (c, o, t) => { sweep(c, o, 'sawtooth', 200, 1600, t, 0.6, 0.06); noise(c, o, t, 0.6, 0.12, 'bandpass', 800, 3000, 2); },
    hum: (c, o, t) => { osc(c, o, 'sine', 55, t, 1.6, 0.25, 0.3); osc(c, o, 'sine', 82.4, t, 1.6, 0.12, 0.3); },
    shield: (c, o, t) => { [392, 784, 1175].forEach((f) => osc(c, o, 'triangle', f, t, 1.2, 0.12)); },
    scroll: (c, o, t) => { noise(c, o, t, 0.6, 0.18, 'bandpass', 600, 1500, 0.8); },
    flip: (c, o, t) => { noise(c, o, t, 0.12, 0.25, 'bandpass', 1500, 4000, 1); },
    tick: (c, o, t) => { osc(c, o, 'square', 2000, t, 0.02, 0.06); },
    meow: (c, o, t) => {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4; bp.connect(o);
      bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(1600, t + 0.25); bp.frequency.linearRampToValueAtTime(800, t + 0.6);
      const x = osc(c, bp, 'sawtooth', 520, t, 0.65, 0.35, 0.06);
      x.frequency.linearRampToValueAtTime(760, t + 0.2); x.frequency.linearRampToValueAtTime(560, t + 0.6);
    },
    woof: (c, o, t) => {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(o);
      for (let i = 0; i < 2; i++) { const x = osc(c, lp, 'sawtooth', 260, t + i * 0.22, 0.14, 0.4, 0.01); x.frequency.exponentialRampToValueAtTime(140, t + i * 0.22 + 0.14); noise(c, lp, t + i * 0.22, 0.1, 0.2, 'bandpass', 600, null, 1); }
    },
    scale4: (c, o, t) => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => osc(c, o, 'triangle', f, t + i * 0.9, 0.6, 0.12)); },
  };
  V.SFX_NAMES = Object.keys(SFX);

  // ---------- 背景音乐：轻柔的 I–vi–IV–V，紧张场景换成小调 ----------
  const BPM = 84, BEAT = 60 / BPM, BAR = BEAT * 4;
  const MOODS = {
    calm: [[48, 55, 64, 67], [45, 52, 60, 64], [41, 48, 57, 60], [43, 50, 59, 62]],
    tense: [[45, 52, 60, 64], [41, 48, 57, 60], [44, 51, 59, 63], [40, 47, 56, 59]],
    tech: [[50, 57, 62, 65], [46, 53, 62, 65], [48, 55, 64, 67], [45, 52, 61, 64]],
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function bgmBar(ctx, out, t0, barIndex, mood) {
    const prog = MOODS[mood] || MOODS.calm, ch = prog[barIndex % prog.length];
    // 垫音
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = mood === 'tense' ? 700 : 1100; lp.connect(out);
    ch.slice(1).forEach((m) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = (m % 3) * 3;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.05, t0 + 0.6);
      g.gain.linearRampToValueAtTime(0.04, t0 + BAR - 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t0 + BAR + 0.2);
      o.connect(g).connect(lp); o.start(t0); o.stop(t0 + BAR + 0.3);
    });
    // 低音
    osc(ctx, out, 'sine', mtof(ch[0] - 12 + 12), t0, BAR * 0.9, 0.09, 0.05);
    // 琶音
    const pat = mood === 'tense' ? [0, 2, 1, 2, 0, 2, 1, 3] : mood === 'tech' ? [0, 1, 2, 3, 2, 1, 2, 3] : [0, 1, 2, 3, 2, 1, 3, 2];
    pat.forEach((k, i) => {
      if (mood === 'tense' && i % 2) return;
      osc(ctx, out, 'sine', mtof(ch[k] + 12), t0 + i * (BEAT / 2), 0.5, 0.035, 0.005);
    });
  }

  // ---------- 实时音频 ----------
  const A = (V.Audio = {
    ctx: null,
    enabled: { sfx: true, bgm: true, voice: true },
    mood: 'calm',
    init() {
      if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      A.ctx = new Ctx();
      A.master = A.ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.ctx.destination);
      A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = 0.8; A.sfxBus.connect(A.master);
      A.bgmBus = A.ctx.createGain(); A.bgmBus.gain.value = 0.55; A.bgmBus.connect(A.master);
    },
    sfx(name) {
      if (!A.ctx || !A.enabled.sfx || !SFX[name]) return;
      SFX[name](A.ctx, A.sfxBus, A.ctx.currentTime + 0.01);
    },
    _bgmNext: 0, _bar: 0, _timer: null,
    bgmStart() {
      if (!A.ctx || A._timer) return;
      A._bgmNext = A.ctx.currentTime + 0.1;
      A._timer = setInterval(() => {
        if (!A.enabled.bgm) return;
        while (A._bgmNext < A.ctx.currentTime + 1.2) {
          bgmBar(A.ctx, A.bgmBus, A._bgmNext, A._bar++, A.mood);
          A._bgmNext += BAR;
        }
      }, 300);
    },
    bgmStop() {
      clearInterval(A._timer); A._timer = null;
    },
    duck(on) {
      if (!A.ctx) return;
      const target = A.enabled.bgm ? (on ? 0.22 : 0.55) : 0;
      A.bgmBus.gain.setTargetAtTime(target, A.ctx.currentTime, 0.25);
    },
  });

  // ---------- 配音 ----------
  // 优先播放 voice/*.mp3（tools/gen-voice.mjs 生成，manifest 写在 voice/manifest.js），否则用浏览器朗读。
  const VO = (V.Voice = {
    manifest: null,
    current: null,
    pitch: { claude: 1.0, ferris: 1.35, rustc: 0.75 },
    rate: { claude: 1.05, ferris: 1.15, rustc: 0.95 },
    zhVoice: null,
    load() {
      VO.manifest = window.VOICE_MANIFEST || null;
      if ('speechSynthesis' in window) {
        const pick = () => {
          const vs = speechSynthesis.getVoices();
          VO.zhVoice = vs.find((v) => /zh[-_]CN/i.test(v.lang) && /Tingting|婷婷|Xiaoxiao|Google/i.test(v.name)) || vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
        };
        pick();
        speechSynthesis.onvoiceschanged = pick;
      }
    },
    has(id) { return !!(VO.manifest && VO.manifest.lines && VO.manifest.lines[id]); },
    play(line, offset, speed) {
      VO.stop();
      if (!A.enabled.voice) return;
      if (VO.has(line.id)) {
        const a = new Audio(`voice/${line.id}.mp3`);
        a.playbackRate = speed || 1;
        a.currentTime = Math.max(0, offset || 0);
        a.play().catch(() => {});
        VO.current = a;
      } else if ('speechSynthesis' in window && (offset || 0) < 0.6) {
        const u = new SpeechSynthesisUtterance(line.speak);
        u.lang = 'zh-CN';
        if (VO.zhVoice) u.voice = VO.zhVoice;
        u.pitch = VO.pitch[line.who] || 1;
        u.rate = (VO.rate[line.who] || 1) * (speed || 1);
        speechSynthesis.speak(u);
        VO.current = u;
      }
    },
    stop() {
      if (VO.current instanceof Audio) VO.current.pause();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      VO.current = null;
    },
  });

  // ---------- 离线渲染（视频导出用） ----------
  // events: [{t, name}]; moods: [{t, mood}]; 返回 WAV 的 base64。
  // opts.from / opts.to 只渲染一段（全片几十 MB，分段传输更稳）；段与段之间的时间轴与整片一致。
  V.renderAudioOffline = async function (duration, events, moods, opts) {
    opts = opts || {};
    const from = opts.from || 0, to = Math.min(duration + 1, opts.to === undefined ? duration + 1 : opts.to);
    const sr = 44100, ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(sr * (to - from))), sr);
    const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    const sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    const bgmGain = opts.bgmGain || 0.3;
    const bgm = ctx.createGain(); bgm.gain.value = bgmGain; bgm.connect(master);
    for (const e of events) if (SFX[e.name] && e.t >= from && e.t < to) SFX[e.name](ctx, sfx, e.t - from);
    if (opts.bgm !== false) {
      let bar = 0;
      for (let t = 0; t < duration; t += BAR, bar++) {
        if (t < from || t >= to) continue;
        let mood = 'calm';
        for (const m of moods) if (m.t <= t + 0.01) mood = m.mood;
        bgmBar(ctx, bgm, t - from, bar, mood);
      }
      // 结尾淡出
      const fadeAt = duration - 3 - from;
      if (fadeAt < to - from) {
        bgm.gain.setValueAtTime(bgmGain, Math.max(0, fadeAt));
        bgm.gain.linearRampToValueAtTime(0.0001, Math.max(0.01, duration + 0.5 - from));
      }
    }
    const buf = await ctx.startRendering();
    return encodeWav(buf);
  };
  function encodeWav(buf) {
    const ch = buf.numberOfChannels, len = buf.length, bytes = 44 + len * ch * 2, ab = new ArrayBuffer(bytes), dv = new DataView(ab);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true); dv.setUint32(24, buf.sampleRate, true);
    dv.setUint32(28, buf.sampleRate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, len * ch * 2, true);
    const data = [];
    for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2; }
    let bin = '';
    const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  }
})();
