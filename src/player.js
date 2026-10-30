// 播放器：把文案和场景拼成一条时间轴，负责渲染、字幕、配音、音效和控制条。
(function () {
  const V = window.V, C = V.C;
  const { SCRIPT, SPEAKERS, estimateDuration } = window.VARIANCE;
  const LEAD = 0.6, GAP = 0.3, TAIL = 1.0, CARD = 2.6;
  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');

  // ---------- 时间轴 ----------
  V.Voice.load();
  const manifest = V.Voice.manifest;
  const scenes = [];
  let T0 = 0;
  SCRIPT.forEach((ch, ci) => {
    if (ci > 0) scenes.push({ id: 'card_' + ch.id, kind: 'card', chapter: ch, title: ch.title, lines: [], lineStarts: [], lineEnds: [], dur: CARD, def: V.cardDef });
    ch.scenes.forEach((sc) => {
      let def = V.sceneDefs[sc.id];
      if (!def) {
        console.warn('缺少场景实现：' + sc.id);
        def = { build: (S) => { V.Background(S.root); V.text(S.root, sc.title, { x: 960, y: 500, 'font-size': 80 }); } };
      }
      const lines = sc.lines.map((l, i) => {
        const id = `${sc.id}_${i}`, speak = l[2] || l[1];
        const real = manifest && manifest.lines && manifest.lines[id];
        // 有真实配音时按实测时长排，句与句之间只留 GAP；估算时长普遍比配音长 1~3 秒，
        // 用它会在每句后面留下一大段空白。没有配音时才退回估算（浏览器朗读）。
        return { id, who: l[0], text: l[1], speak, dur: real ? real + 0.1 : estimateDuration(speak) };
      });
      let t = def.lead === undefined ? LEAD : def.lead;
      const ls = [], le = [];
      lines.forEach((l, i) => {
        ls.push(t);
        le.push(t + l.dur);
        t += l.dur + GAP + ((def.pauses && def.pauses[i]) || 0);
      });
      const dur = t - GAP + (def.tail === undefined ? TAIL : def.tail);
      scenes.push({ id: sc.id, kind: 'scene', chapter: ch, title: sc.title, lines, lineStarts: ls, lineEnds: le, dur, def });
    });
  });
  scenes.forEach((s) => {
    s.start = T0;
    T0 += s.dur;
    const S = { L: s.lineStarts, E: s.lineEnds, dur: s.dur };
    s.sfx = (s.def.sfx ? s.def.sfx(S) : []).map(([t, name]) => ({ t, name })).filter((e) => e.t >= 0 && e.t <= s.dur).sort((a, b) => a.t - b.t);
  });
  const TOTAL = T0;

  // ---------- DOM ----------
  const svg = document.getElementById('stage');
  V.el('rect', { width: V.W, height: V.H, fill: C.paper }, svg);
  const layer = V.g(svg);
  const subEl = document.getElementById('subtitle');
  const ui = {
    play: document.getElementById('btn-play'),
    time: document.getElementById('time'),
    bar: document.getElementById('seek'),
    fill: document.getElementById('seek-fill'),
    knob: document.getElementById('seek-knob'),
    marks: document.getElementById('seek-marks'),
    tip: document.getElementById('seek-tip'),
    chapters: document.getElementById('chapters'),
    speed: document.getElementById('speed'),
    start: document.getElementById('start'),
    toggles: document.querySelectorAll('[data-toggle]'),
    fs: document.getElementById('btn-fs'),
    wrap: document.getElementById('stage-wrap'),
    sceneTitle: document.getElementById('scene-title'),
  };
  if (RENDER) document.body.classList.add('render');
  if (params.has('nosub')) document.body.classList.add('no-sub');

  // ---------- 场景生命周期 ----------
  let cur = -1, curUpdate = null, curRoot = null, curCtx = null;
  function activate(i) {
    if (cur === i) return;
    if (curRoot) curRoot.remove();
    cur = i;
    const s = scenes[i];
    curRoot = V.A(layer);
    curCtx = V.makeCtx(curRoot, s);
    curUpdate = s.def.build(curCtx) || (() => {});
    V.Audio.mood = s.def.mood || 'calm';
    if (ui.sceneTitle) ui.sceneTitle.textContent = `${s.chapter.title}${s.kind === 'scene' ? ' · ' + s.title : ''}`;
  }
  function sceneAt(t) {
    let lo = 0, hi = scenes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (scenes[mid].start <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  }
  function render(t) {
    t = V.clamp(t, 0, TOTAL - 0.001);
    const i = sceneAt(t);
    activate(i);
    const s = scenes[i], lt = t - s.start;
    const fade = Math.min(V.p(lt, 0, 0.35), 1 - V.p(lt, s.dur - 0.3, s.dur));
    curRoot.at(0, 0, 1, 0, i === 0 ? Math.max(fade, V.p(lt, 0, 0.01)) : fade);
    curUpdate(lt);
    // 字幕
    let line = null;
    for (let k = 0; k < s.lines.length; k++) if (lt >= s.lineStarts[k] && lt <= s.lineEnds[k] + 0.25) line = s.lines[k];
    const key = line ? line.id : '';
    if (subEl._key !== key) {
      subEl._key = key;
      if (line) {
        const sp = SPEAKERS[line.who];
        subEl.innerHTML = `<span class="who" style="background:${sp.color}">${sp.name}</span><span class="txt"></span>`;
        subEl.querySelector('.txt').textContent = line.text;
        subEl.classList.add('on');
      } else subEl.classList.remove('on');
    }
    return { s, lt, line };
  }

  // ---------- 播放控制 ----------
  let T = 0, playing = false, speed = 1, lastNow = 0, needResync = true;
  const startParam = params.get('t'), sceneParam = params.get('scene');
  if (startParam) T = parseFloat(startParam) || 0;
  if (sceneParam) { const s = scenes.find((x) => x.id === sceneParam); if (s) T = s.start; }

  function activeLine(t) {
    const s = scenes[sceneAt(t)], lt = t - s.start;
    for (let k = 0; k < s.lines.length; k++) if (lt >= s.lineStarts[k] && lt < s.lineEnds[k]) return { line: s.lines[k], off: lt - s.lineStarts[k] };
    return null;
  }
  function tick(now) {
    const dt = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    if (playing) {
      const prev = T;
      T = Math.min(TOTAL, T + dt * speed);
      if (needResync) {
        needResync = false;
        const a = activeLine(T);
        if (a) V.Voice.play(a.line, a.off, speed);
      }
      fireEvents(prev, T);
      if (T >= TOTAL) pause();
    }
    const r = render(T);
    V.Audio.duck(!!r.line);
    updateUI();
    requestAnimationFrame(tick);
  }
  function fireEvents(a, b) {
    if (b <= a) return;
    const i0 = sceneAt(a), i1 = sceneAt(b);
    for (let i = i0; i <= i1; i++) {
      const s = scenes[i];
      for (const e of s.sfx) { const at = s.start + e.t; if (at > a && at <= b) V.Audio.sfx(e.name); }
      s.lines.forEach((l, k) => { const at = s.start + s.lineStarts[k]; if (at > a && at <= b) V.Voice.play(l, 0, speed); });
    }
  }
  function play() {
    V.Audio.init();
    V.Audio.bgmStart();
    if (T >= TOTAL - 0.05) T = 0;
    playing = true;
    needResync = true;
    ui.play.classList.add('playing');
    ui.start.classList.add('hidden');
  }
  function pause() {
    playing = false;
    V.Voice.stop();
    V.Audio.bgmStop();
    ui.play.classList.remove('playing');
  }
  function seek(t) {
    T = V.clamp(t, 0, TOTAL - 0.01);
    V.Voice.stop();
    needResync = true;
  }
  V.player = { play, pause, seek, scenes, get t() { return T; }, total: TOTAL };

  // ---------- UI ----------
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  function updateUI() {
    const k = T / TOTAL;
    ui.fill.style.width = k * 100 + '%';
    ui.knob.style.left = k * 100 + '%';
    ui.time.textContent = `${fmt(T)} / ${fmt(TOTAL)}`;
    const ci = SCRIPT.indexOf(scenes[sceneAt(T)].chapter);
    if (ui.chapters.selectedIndex !== ci) ui.chapters.selectedIndex = ci;
  }
  SCRIPT.forEach((ch) => {
    const first = scenes.find((s) => s.chapter === ch);
    const m = document.createElement('div');
    m.className = 'mark';
    m.style.left = (first.start / TOTAL) * 100 + '%';
    ui.marks.appendChild(m);
    const op = document.createElement('option');
    op.textContent = ch.title;
    op.value = first.start;
    ui.chapters.appendChild(op);
  });
  ui.chapters.onchange = () => seek(parseFloat(ui.chapters.value));
  ui.play.onclick = () => (playing ? pause() : play());
  ui.start.onclick = play;
  ui.speed.onchange = () => { speed = parseFloat(ui.speed.value); needResync = playing; V.Voice.stop(); };
  ui.toggles.forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.toggle;
      b.classList.toggle('off');
      const on = !b.classList.contains('off');
      if (k === 'sub') document.body.classList.toggle('no-sub', !on);
      else {
        V.Audio.enabled[k] = on;
        if (k === 'voice' && !on) V.Voice.stop();
        if (k === 'bgm') V.Audio.duck(false);
      }
    };
  });
  ui.fs.onclick = () => {
    const el = document.getElementById('app');
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen && el.requestFullscreen();
  };
  let dragging = false;
  const seekFromEvent = (e) => {
    const r = ui.bar.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * TOTAL);
  };
  ui.bar.addEventListener('pointerdown', (e) => { dragging = true; ui.bar.setPointerCapture(e.pointerId); seekFromEvent(e); });
  ui.bar.addEventListener('pointermove', (e) => {
    const r = ui.bar.getBoundingClientRect(), t = V.clamp(((e.clientX - r.left) / r.width) * TOTAL, 0, TOTAL);
    const s = scenes[sceneAt(t)];
    ui.tip.textContent = `${fmt(t)}  ${s.kind === 'card' ? s.title : s.title}`;
    ui.tip.style.left = ((e.clientX - r.left) / r.width) * 100 + '%';
    if (dragging) seekFromEvent(e);
  });
  ui.bar.addEventListener('pointerup', () => (dragging = false));
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    else if (e.code === 'ArrowRight') seek(T + 5);
    else if (e.code === 'ArrowLeft') seek(T - 5);
    else if (e.key === ']') { const i = sceneAt(T); if (i < scenes.length - 1) seek(scenes[i + 1].start); }
    else if (e.key === '[') { const i = sceneAt(T); seek(scenes[Math.max(0, T - scenes[i].start < 1 ? i - 1 : i)].start); }
    else if (e.key === 'f' || e.key === 'F') ui.fs.click();
  });

  // ---------- 渲染模式（tools/render-video.mjs 使用） ----------
  if (RENDER) {
    window.__TL = {
      total: TOTAL,
      lines: scenes.flatMap((s) => s.lines.map((l, k) => ({ id: l.id, who: l.who, text: l.text, t: s.start + s.lineStarts[k], dur: l.dur }))),
      sfx: scenes.flatMap((s) => s.sfx.map((e) => ({ t: s.start + e.t, name: e.name }))),
      moods: scenes.map((s) => ({ t: s.start, mood: s.def.mood || 'calm' })),
    };
    window.__seek = (t) => { render(t); return true; };
    // 调试用：跳到某场景第 i 句开始后 off 秒
    window.__at = (id, i, off) => { const s = scenes.find((x) => x.id === id); const t = s.start + (i < 0 ? 0 : s.lineStarts[i]) + (off || 0); render(t); return t; };
    window.__renderAudio = (opts) => V.renderAudioOffline(TOTAL, window.__TL.sfx, window.__TL.moods, opts);
    render(T);
  } else {
    requestAnimationFrame((n) => { lastNow = n; tick(n); });
  }
})();
