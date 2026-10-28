// 可复用的画面部件：代码面板、箭头、型变徽章、盒子、笼子、印章、粒子、背景。
(function () {
  const V = window.V, C = V.C;

  V.VAR = {
    co: { sym: '+', name: '协变', en: 'covariant', color: C.co },
    contra: { sym: '−', name: '逆变', en: 'contravariant', color: C.contra },
    inv: { sym: 'o', name: '不变', en: 'invariant', color: C.inv },
    bi: { sym: '*', name: '双变', en: 'bivariant', color: C.bi },
  };

  // ---------- 文本宽度（等宽字体近似） ----------
  V.textW = function (str, fs, mono) {
    let w = 0;
    for (const ch of str) w += /[⺀-￿]/.test(ch) ? fs : mono ? fs * 0.602 : fs * 0.56;
    return w;
  };

  // ---------- 代码高亮 ----------
  const KW = new Set('fn let mut struct impl pub use for where return if else match enum trait type const static self Self as in unsafe mod dyn move ref class new extends super public void interface function private'.split(' '));
  const COL = { comment: '#8E88A8', string: '#A6E3A1', life: '#FFB86C', kw: '#FF8FB1', type: '#89DCEB', macro: '#CBA6F7', num: '#F9E2AF', punct: '#BAB5D0', id: '#F2EFFF', attr: '#F9E2AF', err: '#FF6B6B' };
  V.tokenize = function (line) {
    const RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|('[a-zA-Z_]\w*)|(#!?\[[^\]]*\])|([A-Za-z_]\w*!)|([A-Za-z_]\w*)|(\d+)|(\s+)|([\s\S])/g;
    const out = [];
    let m;
    while ((m = RE.exec(line))) {
      const s = m[0];
      let k;
      if (m[1]) k = 'comment';
      else if (m[2]) k = 'string';
      else if (m[3]) k = 'life';
      else if (m[4]) k = 'attr';
      else if (m[5]) k = 'macro';
      else if (m[6]) k = KW.has(s) ? 'kw' : /^[A-Z]/.test(s) || /^(str|i32|u8|usize|bool|String|Vec|Box|Option)$/.test(s) ? 'type' : 'id';
      else if (m[7]) k = 'num';
      else if (m[8]) k = 'ws';
      else k = 'punct';
      out.push([s, k]);
    }
    return out;
  };

  V.Code = function (parent, o) {
    const fs = o.fs || 30, lh = fs * 1.55, pad = 34, top = o.title === false ? 26 : 70;
    const lines = o.code.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const maxCols = Math.max(...lines.map((l) => V.textW(l, fs, true)));
    const w = o.w || maxCols + pad * 2 + 10, h = top + lines.length * lh + 26;
    const root = V.A(parent);
    V.el('rect', { x: 6, y: 10, width: w, height: h, rx: 22, fill: '#000', opacity: 0.12 }, root);
    V.el('rect', { width: w, height: h, rx: 22, fill: C.code }, root);
    if (o.title !== false) {
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => V.el('circle', { cx: 32 + i * 26, cy: 34, r: 8, fill: c }, root));
      V.text(root, o.title || 'main.rs', { x: w / 2, y: 34, 'font-size': 22, fill: '#8E88A8', 'font-family': V.MONO });
    }
    const hlG = V.g(root), textG = V.g(root), overG = V.g(root);
    const hls = lines.map((_, i) => V.el('rect', { x: 10, y: top + i * lh - 4, width: w - 20, height: lh, rx: 8, fill: '#fff', opacity: 0 }, hlG));
    const els = lines.map((_, i) => V.el('text', { x: pad, y: top + i * lh + lh / 2, 'font-size': fs, 'font-family': V.MONO, 'dominant-baseline': 'central', style: 'white-space:pre' }, textG));
    const toks = lines.map(V.tokenize);
    const shown = lines.map(() => -1);
    const total = lines.reduce((a, l) => a + l.length, 0);
    const cursor = V.el('rect', { width: fs * 0.55, height: fs * 1.1, fill: C.claude, opacity: 0 }, overG);

    function renderLine(i, n) {
      if (shown[i] === n) return;
      shown[i] = n;
      const e = els[i];
      while (e.firstChild) e.removeChild(e.firstChild);
      let left = n;
      for (const [s, k] of toks[i]) {
        if (left <= 0) break;
        const part = s.slice(0, left);
        left -= s.length;
        const sp = V.el('tspan', { fill: COL[k] || COL.id }, e);
        if (k === 'comment') sp.setAttribute('font-style', 'italic');
        sp.textContent = part;
      }
    }
    const api = {
      root, w, h, lh, fs, top, pad, lines,
      lineY: (i) => top + i * lh + lh / 2,
      colX: (i, col) => pad + V.textW(lines[i].slice(0, col), fs, true),
      // 打字机：k ∈ [0,1]
      reveal(k, showCursor) {
        let n = Math.round(k * total);
        let cx = pad, cy = top, curLine = 0;
        for (let i = 0; i < lines.length; i++) {
          const m = Math.max(0, Math.min(lines[i].length, n));
          renderLine(i, m);
          if (n > 0 || i === 0) { curLine = i; cx = pad + V.textW(lines[i].slice(0, m), fs, true); }
          n -= lines[i].length;
        }
        V.set(cursor, { x: cx + 2, y: top + curLine * lh + (lh - fs * 1.1) / 2 });
        V.op(cursor, showCursor && k < 1 ? 1 : 0);
      },
      hl(i, amt, color) {
        V.set(hls[i], { fill: color || '#fff' });
        V.op(hls[i], amt * (color ? 0.22 : 0.08));
      },
      // 在第 i 行 [c0, c1) 列下方画波浪线
      squiggle(i, c0, c1, color) {
        const x0 = api.colX(i, c0), x1 = api.colX(i, c1), y = api.lineY(i) + fs * 0.62;
        let d = `M${x0} ${y}`;
        for (let x = x0; x < x1; x += 8) d += ` q2 -5 4 0 q2 5 4 0`;
        const p = V.el('path', { d, stroke: color || COL.err, 'stroke-width': 2.5, fill: 'none' }, overG);
        V.op(p, 0);
        return p;
      },
      box(i, c0, c1, color) {
        const x0 = api.colX(i, c0) - 6, x1 = api.colX(i, c1) + 6;
        const r = V.el('rect', { x: x0, y: api.lineY(i) - lh / 2 + 2, width: x1 - x0, height: lh - 4, rx: 8, fill: 'none', stroke: color || C.gold, 'stroke-width': 3 }, overG);
        V.op(r, 0);
        return r;
      },
      overlay: overG,
    };
    api.reveal(o.revealed === false ? 0 : 1);
    return api;
  };

  // ---------- 盒子 / 标签 ----------
  V.Box = function (parent, o) {
    const root = V.A(parent);
    const w = o.w || 200, h = o.h || 80;
    if (o.shadow !== false) V.el('rect', { x: -w / 2 + 5, y: -h / 2 + 8, width: w, height: h, rx: o.rx || 18, fill: '#000', opacity: 0.08 }, root);
    const rect = V.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: o.rx === undefined ? 18 : o.rx, fill: o.fill || '#fff', stroke: o.stroke || C.ink, 'stroke-width': o.sw === undefined ? 3 : o.sw, 'stroke-dasharray': o.dash || null }, root);
    let label = null;
    if (o.text !== undefined) label = V.text(root, o.text, { 'font-size': o.fs || 32, fill: o.color || C.ink, 'font-weight': o.weight || 600, 'font-family': o.mono ? V.MONO : V.FONT, 'line-height': 1.35 });
    root.rect = rect;
    root.label = label;
    return root;
  };

  V.Pill = function (parent, text, o) {
    o = o || {};
    const fs = o.fs || 28, w = o.w || V.textW(text, fs, o.mono) + fs * 1.4, h = o.h || fs * 1.8;
    return V.Box(parent, Object.assign({ w, h, rx: h / 2, text, fs, fill: o.fill || C.ink, color: o.color || '#fff', sw: 0, stroke: 'none' }, o, { w, h }));
  };

  // 型变徽章
  V.Badge = function (parent, kind, o) {
    o = o || {};
    const r = o.r || 34, info = V.VAR[kind];
    const root = V.A(parent);
    V.el('circle', { r: r + 4, fill: '#fff', opacity: 0.9 }, root);
    root.circle = V.el('circle', { r, fill: info.color }, root);
    root.sym = V.text(root, info.sym, { 'font-size': r * 1.35, fill: '#fff', 'font-weight': 800, 'font-family': V.MONO, y: kind === 'bi' ? r * 0.18 : 0 });
    if (o.label) V.text(root, info.name, { y: r + 30, 'font-size': o.labelFs || 26, fill: info.color, 'font-weight': 700 });
    return root;
  };

  // ---------- 箭头 ----------
  V.Arrow = function (parent, o) {
    o = o || {};
    const root = V.A(parent);
    const path = V.el('path', { fill: 'none', stroke: o.color || C.ink, 'stroke-width': o.width || 6, 'stroke-linecap': 'round', 'stroke-dasharray': o.dash || null }, root);
    const head = V.el('path', { fill: o.color || C.ink }, root);
    const hs = o.head || 18;
    root.set = function (x1, y1, x2, y2, k, bend, color) {
      k = k === undefined ? 1 : k;
      bend = bend || 0;
      const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
      const pt = (u) => [(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2];
      let d = '';
      const n = 28;
      for (let i = 0; i <= n; i++) {
        const p = pt((i / n) * k);
        d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      }
      path.setAttribute('d', d);
      const e = pt(k), b = pt(Math.max(0, k - 0.02));
      const a = Math.atan2(e[1] - b[1], e[0] - b[0]);
      const p1 = [e[0] - Math.cos(a - 0.5) * hs, e[1] - Math.sin(a - 0.5) * hs], p2 = [e[0] - Math.cos(a + 0.5) * hs, e[1] - Math.sin(a + 0.5) * hs];
      head.setAttribute('d', `M${e[0].toFixed(1)} ${e[1].toFixed(1)} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z`);
      V.op(head, k > 0.03 ? 1 : 0);
      if (color) { path.setAttribute('stroke', color); head.setAttribute('fill', color); }
      return root;
    };
    return root;
  };

  // ---------- 勾 / 叉 ----------
  V.Check = function (parent, o) {
    o = o || {};
    const root = V.A(parent), r = o.r || 40;
    V.el('circle', { r, fill: o.color || C.co }, root);
    V.el('path', { d: `M${-r * 0.45} 0 L${-r * 0.1} ${r * 0.35} L${r * 0.5} ${-r * 0.35}`, stroke: '#fff', 'stroke-width': r * 0.2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    return root;
  };
  V.Cross = function (parent, o) {
    o = o || {};
    const root = V.A(parent), r = o.r || 40;
    V.el('circle', { r, fill: o.color || C.inv }, root);
    V.el('path', { d: `M${-r * 0.35} ${-r * 0.35} L${r * 0.35} ${r * 0.35} M${r * 0.35} ${-r * 0.35} L${-r * 0.35} ${r * 0.35}`, stroke: '#fff', 'stroke-width': r * 0.2, 'stroke-linecap': 'round' }, root);
    return root;
  };

  // ---------- 印章 ----------
  V.Stamp = function (parent, text, o) {
    o = o || {};
    const fs = o.fs || 46, color = o.color || C.inv, w = V.textW(text, fs, o.mono) + fs * 1.2, h = fs * 1.9;
    const root = V.A(parent);
    V.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: o.fill || 'rgba(255,255,255,0.85)', stroke: color, 'stroke-width': 7 }, root);
    V.el('rect', { x: -w / 2 + 9, y: -h / 2 + 9, width: w - 18, height: h - 18, rx: 8, fill: 'none', stroke: color, 'stroke-width': 2.5 }, root);
    V.text(root, text, { 'font-size': fs, fill: color, 'font-weight': 800, 'font-family': o.mono ? V.MONO : V.FONT });
    return root;
  };
  // 印章砸下：k 从 0→1
  V.stampAt = function (st, x, y, t, at, rot) {
    const k = V.p(t, at, at + 0.22);
    const s = k < 1 ? V.lerp(2.4, 1, V.E.in(k)) : 1 + Math.sin(V.p(t, at + 0.22, at + 0.5) * Math.PI) * 0.06;
    st.at(x, y, s, rot === undefined ? -8 : rot, k > 0 ? Math.min(1, k * 2) : 0);
  };

  // ---------- 笼子 ----------
  V.Cage = function (parent, o) {
    o = o || {};
    const w = o.w || 260, h = o.h || 220;
    const root = V.A(parent);
    root.inside = V.g(root);
    const bars = V.g(root);
    V.el('rect', { x: -w / 2, y: h / 2 - 16, width: w, height: 22, rx: 8, fill: o.base || '#8A6A4F' }, bars);
    V.el('path', { d: `M${-w / 2} ${-h / 2 + 30} Q0 ${-h / 2 - 40} ${w / 2} ${-h / 2 + 30}`, stroke: o.bar || '#6B5F57', 'stroke-width': 8, fill: 'none' }, bars);
    V.el('circle', { cx: 0, cy: -h / 2 - 14, r: 12, fill: 'none', stroke: o.bar || '#6B5F57', 'stroke-width': 6 }, bars);
    const n = o.bars || 7;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 10 + (i * (w - 20)) / (n - 1);
      const yTop = -h / 2 + 30 - Math.sin(((i / (n - 1)) * Math.PI)) * 34;
      V.el('path', { d: `M${x} ${yTop} V${h / 2 - 16}`, stroke: o.bar || '#6B5F57', 'stroke-width': 6, 'stroke-linecap': 'round' }, bars);
    }
    if (o.label) {
      root.tag = V.Pill(root, o.label, { fs: o.labelFs || 26, fill: o.labelFill || C.ink, mono: o.mono });
      root.tag.at(0, h / 2 + 40);
    }
    return root;
  };

  // ---------- 粒子爆发（确定性） ----------
  V.Burst = function (parent, o) {
    o = o || {};
    const n = o.n || 18, rnd = V.rng(o.seed || 7), cols = o.colors || [C.claude, C.rust, C.gold, C.co];
    const root = V.A(parent);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, sp = (o.spread || 220) * (0.4 + rnd() * 0.6);
      const shape = o.shape === 'shard' ? V.el('path', { d: `M0 ${-8 - rnd() * 10} L${6 + rnd() * 8} ${4} L${-6 - rnd() * 6} ${6}Z`, fill: cols[i % cols.length] }, root) : V.el(o.shape === 'rect' ? 'rect' : 'circle', o.shape === 'rect' ? { width: 14, height: 8, x: -7, y: -4, fill: cols[i % cols.length] } : { r: 4 + rnd() * 7, fill: cols[i % cols.length] }, root);
      parts.push({ el: shape, dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, rot: (rnd() - 0.5) * 720, g: o.gravity === undefined ? 260 : o.gravity });
    }
    root.update = function (k) {
      V.op(root, k > 0 && k < 1 ? 1 : 0);
      const e = V.E.out(k);
      parts.forEach((p) => {
        p.el.setAttribute('transform', `translate(${(p.dx * e).toFixed(1)} ${(p.dy * e + p.g * k * k).toFixed(1)}) rotate(${(p.rot * k).toFixed(0)})`);
        p.el.setAttribute('opacity', (1 - k).toFixed(2));
      });
    };
    return root;
  };

  // ---------- 背景 ----------
  V.Background = function (root, o) {
    o = o || {};
    const g = V.g(root);
    V.el('rect', { width: V.W, height: V.H, fill: o.fill || C.paper }, g);
    const dots = V.g(g, { opacity: 0.5 });
    for (let x = 40; x < V.W; x += 60) for (let y = 40; y < V.H; y += 60) V.el('circle', { cx: x, cy: y, r: 1.8, fill: o.dot || C.line }, dots);
    const blobs = [];
    const rnd = V.rng(o.seed || 3);
    const cols = o.blobs || [C.claude, C.rust, C.co, C.contra];
    for (let i = 0; i < 5; i++) blobs.push({ el: V.el('circle', { r: 120 + rnd() * 160, fill: cols[i % cols.length], opacity: 0.035 }, g), x: rnd() * V.W, y: rnd() * V.H, ph: rnd() * 6 });
    g.update = function (t) {
      blobs.forEach((b) => V.set(b.el, { cx: b.x + Math.sin(t * 0.15 + b.ph) * 60, cy: b.y + Math.cos(t * 0.12 + b.ph) * 40 }));
    };
    return g;
  };

  // 场景标题角标
  V.Corner = function (root, text, color) {
    const g = V.A(root);
    V.el('rect', { x: 0, y: 0, width: V.textW(text, 26) + 64, height: 52, rx: 26, fill: '#fff', stroke: color || C.ink, 'stroke-width': 2.5 }, g);
    V.el('circle', { cx: 28, cy: 26, r: 8, fill: color || C.claude }, g);
    V.text(g, text, { x: 46, y: 27, 'font-size': 26, 'text-anchor': 'start', fill: C.ink, 'font-weight': 600 });
    return g;
  };

  // 生命周期光带
  V.Band = function (parent, o) {
    const root = V.A(parent);
    const h = o.h || 46, color = o.color || C.gold;
    const glow = V.el('rect', { x: 0, y: -h / 2 - 8, height: h + 16, rx: (h + 16) / 2, fill: color, opacity: 0.18 }, root);
    const bar = V.el('rect', { x: 0, y: -h / 2, height: h, rx: h / 2, fill: color }, root);
    const lab = V.text(root, o.label || '', { x: 26, y: 1, 'font-size': o.fs || 30, 'text-anchor': 'start', fill: '#fff', 'font-weight': 700, 'font-family': V.MONO });
    root.grow = function (w) {
      V.set(bar, { width: Math.max(h, w) });
      V.set(glow, { width: Math.max(h, w) + 0, x: 0 });
      V.op(lab, V.clamp((w - 120) / 80, 0, 1));
    };
    return root;
  };
})();
