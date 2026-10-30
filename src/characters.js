// 角色：Claude（Claude Code 的像素吉祥物 Clawd）、Ferris（Rust 吉祥物螃蟹）、rustc（齿轮头机器人）、猫、狗。
// 每个角色返回 { root, update(t, o) }；root 是 V.A 演员，用 root.at(x, y, s, r, o) 摆位。
(function () {
  const V = window.V, C = V.C;

  const blinkAmt = (t, seed, period) => {
    const ph = (t + seed) % (period || 3.7);
    return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0;
  };

  V.gearPath = function (r, teeth, depth) {
    let d = '';
    const n = teeth * 4;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = i % 4 < 2 ? r : r - depth;
      d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  };

  // ---------------- Claude ----------------
  // Claude Code 的像素吉祥物 Clawd：方块身体、两只竖长的黑眼睛、两侧短手、底下四条小腿。
  // 网格单位 U，原点在眼睛附近，脚底约在 y = 120。
  V.Claude = function (parent, opts) {
    opts = opts || {};
    const U = 18, OY = 30; // 身体：x ∈ [-6U, 6U]，y ∈ [OY - 3U, OY + 3U]
    const root = V.A(parent);
    const shadow = V.el('ellipse', { cx: 0, cy: OY + 5 * U + 4, rx: 100, ry: 12, fill: '#000', opacity: 0.09 }, root);
    const bob = V.g(root);
    const sparks = V.g(bob);
    const sparkEls = [];
    for (let i = 0; i < 10; i++) sparkEls.push(V.el('rect', { width: U * 0.5, height: U * 0.5, fill: i % 3 ? C.claude : C.gold }, sparks));
    const legEls = [-5, -3, 2, 4].map((x) => ({ x, el: V.el('rect', { x: x * U, width: U, fill: C.claude, 'shape-rendering': 'crispEdges' }, bob) }));
    const armEls = [-1, 1].map((side) => ({ side, el: V.el('rect', { height: 2 * U, fill: C.claude, 'shape-rendering': 'crispEdges' }, bob) }));
    const body = V.g(bob);
    V.el('rect', { x: -6 * U, y: OY - 3 * U, width: 12 * U, height: 6 * U, fill: C.claude, 'shape-rendering': 'crispEdges' }, body);
    const face = V.g(body);
    const eyes = [-4, 3].map((x) => V.el('rect', { x: x * U, width: U, fill: '#141414', 'shape-rendering': 'crispEdges' }, face));
    // 开心时眼睛变成像素“^”
    const happyEyes = [-4, 3].map((x) => V.el('path', {
      d: `M${x * U - 4} ${OY - U * 0.4} L${x * U + U / 2} ${OY - U * 1.5} L${x * U + U + 4} ${OY - U * 0.4}`,
      stroke: '#141414', 'stroke-width': U * 0.5, fill: 'none', 'stroke-linejoin': 'miter', 'stroke-linecap': 'square',
    }, face));
    const seed = opts.seed || 0.7;

    function update(t, o) {
      o = o || {};
      const talk = o.talk || 0, mood = o.mood || 'neutral', burst = o.burst || 0, walk = o.walk || 0;
      // 说话时一跳一跳；闲着时轻轻上下
      const hopTalk = talk * Math.abs(Math.sin(t * 6.5 + seed)) * 7;
      const idle = o.still ? 0 : (V.osc(t, 0.45, seed) * 0.5 + 0.5) * 4;
      const lift = idle + hopTalk + walk * Math.abs(Math.sin(t * 12)) * 8;
      const squash = 1 - talk * 0.035 * Math.sin(t * 13 + seed) + burst * 0.06;
      bob.setAttribute('transform', `translate(0 ${(-lift).toFixed(1)}) rotate(${(o.tilt || 0).toFixed(1)} 0 ${OY}) translate(0 ${OY + 3 * U}) scale(${(2 - squash).toFixed(3)} ${squash.toFixed(3)}) translate(0 ${-(OY + 3 * U)})`);
      V.set(shadow, { rx: 100 - lift * 1.2 });
      // 腿：走路时交替抬起
      legEls.forEach((l, i) => {
        const up = walk ? Math.max(0, Math.sin(t * 12 + (i % 2) * Math.PI)) * U * 0.6 : 0;
        V.set(l.el, { y: OY + 3 * U - 1, height: 2 * U + 1 - up });
      });
      // 手：说话时上下摆动；point 时朝那边伸长
      const pa = o.point !== undefined && o.point !== null ? (o.point * Math.PI) / 180 : null;
      armEls.forEach((a, i) => {
        let len = 2 * U, dy = 0;
        if (talk > 0.01) dy = Math.round(Math.sin(t * 7 + i * Math.PI) * talk * 1.2) * (U / 2);
        if (mood === 'happy' || mood === 'surprised') dy -= U / 2;
        if (pa !== null && Math.sign(Math.cos(pa)) === a.side) {
          len += U * 1.5 * (o.pointAmt === undefined ? 1 : o.pointAmt);
          dy = Math.round(Math.sin(pa) * 2) * (U / 2);
        }
        V.set(a.el, { x: a.side < 0 ? -6 * U - len + 1 : 6 * U - 1, y: OY - U + dy, width: len });
      });
      // 眼睛
      const look = o.look || [0, 0];
      const think = mood === 'think';
      const fx = Math.round(look[0] * 2) * (U / 4), fy = Math.round((look[1] - (think ? 1 : 0)) * 2) * (U / 4);
      face.setAttribute('transform', `translate(${fx} ${fy})`);
      const happy = mood === 'happy', sur = mood === 'surprised';
      const bl = blinkAmt(t, seed * 5, 3.9);
      const eh = (sur ? 2.5 : 2) * U * (1 - bl * 0.8);
      eyes.forEach((e, i) => {
        V.op(e, happy ? 0 : 1);
        V.set(e, { y: OY - U * (sur ? 2.25 : 2) + (2 * U - eh) * (sur ? 0 : 0.5), height: eh, width: sur ? U * 1.25 : U, x: (i ? 3 : -4) * U - (sur ? U * 0.125 : 0) });
      });
      happyEyes.forEach((e) => V.op(e, happy ? 1 : 0));
      // 像素火花
      sparkEls.forEach((s, i) => {
        const a = (i / sparkEls.length) * Math.PI * 2 + 0.3;
        const r = 130 + burst * 70 + (i % 2) * 20;
        V.set(s, { x: Math.cos(a) * r - U / 4, y: OY + Math.sin(a) * r * 0.75 - U / 4 });
        V.op(s, burst * 1.6);
      });
    }
    return { root, update };
  };

  // ---------------- Ferris ----------------
  // Rust 官方吉祥物 Ferris：橙红色的扁圆身体、一圈尖刺边、两只高举的大钳子、
  // 直接长在身上的黑眼睛（带白色高光）和一张张开的黑色笑嘴。
  V.Ferris = function (parent, opts) {
    opts = opts || {};
    const root = V.A(parent);
    const shadow = V.el('ellipse', { cx: 0, cy: 95, rx: 130, ry: 14, fill: '#000', opacity: 0.09 }, root);
    const bob = V.g(root);
    // 腿：深红色、短而尖
    const legs = [];
    const legG = V.g(bob);
    for (let side = -1; side <= 1; side += 2) {
      for (let k = 0; k < 3; k++) legs.push({ side, k, el: V.el('path', { fill: C.rustDark, stroke: C.rustDark, 'stroke-width': 3, 'stroke-linejoin': 'round' }, legG) });
    }
    // 钳子
    const claws = [];
    for (let side = -1; side <= 1; side += 2) {
      const arm = V.el('path', { stroke: C.rust, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' }, bob);
      const cg = V.g(bob);
      const lower = V.el('path', { d: 'M-6 6 C -10 40, 54 46, 68 6 C 50 18, 22 16, 6 -4 Z', fill: C.rust, stroke: C.rust, 'stroke-width': 6, 'stroke-linejoin': 'round' }, cg);
      const upperG = V.g(cg);
      V.el('path', { d: 'M0 -4 C 2 -40, 58 -44, 70 -8 C 48 -20, 24 -16, 6 2 Z', fill: C.rust, stroke: C.rust, 'stroke-width': 6, 'stroke-linejoin': 'round' }, upperG);
      V.el('circle', { r: 22, fill: C.rust }, cg);
      claws.push({ side, arm, cg, upperG, lower });
    }
    // 身体：上缘一圈尖刺，下缘平缓
    const pts = [];
    const NS = 26;
    for (let i = 0; i <= NS; i++) {
      const a = Math.PI + (i / NS) * Math.PI;
      const r = i % 2 === 0 ? 0.86 : 1;
      pts.push([Math.cos(a) * 132 * r, Math.sin(a) * 78 * r + 14]);
    }
    let d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    d += ' C 112 44, 70 66, 0 66 C -70 66, -112 44, -113.5 14Z';
    V.el('path', { d, fill: C.rust, stroke: C.rust, 'stroke-width': 7, 'stroke-linejoin': 'round' }, bob);
    // 眼睛：黑色，带白色高光
    const eyes = [];
    for (let side = -1; side <= 1; side += 2) {
      const ball = V.g(bob);
      const iris = V.el('ellipse', { rx: 15, ry: 17, fill: '#0F0A08' }, ball);
      const glint = V.el('circle', { r: 5.5, fill: '#fff' }, ball);
      const brow = V.el('path', { stroke: '#2B1A12', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, ball);
      eyes.push({ side, ball, iris, glint, brow });
    }
    const mouth = V.el('path', { fill: '#0F0A08', stroke: '#0F0A08', 'stroke-width': 3, 'stroke-linejoin': 'round' }, bob);
    const sweat = V.el('path', { d: 'M150 -70 Q 160 -50 150 -42 Q 140 -50 150 -70Z', fill: '#7CC7FF' }, bob);
    const seed = opts.seed || 1.3;

    function update(t, o) {
      o = o || {};
      const talk = o.talk || 0, mood = o.mood || 'neutral', walk = o.walk || 0;
      const hop = o.still ? 0 : Math.abs(V.osc(t, 0.5, seed)) * 4 + walk * Math.abs(Math.sin(t * 14)) * 8;
      const shake = mood === 'scared' ? Math.sin(t * 60) * 3 : 0;
      bob.setAttribute('transform', `translate(${shake.toFixed(1)} ${(-hop).toFixed(1)})`);
      V.set(shadow, { rx: 130 - hop });
      legs.forEach((l, i) => {
        const bx = l.side * (58 + l.k * 26), by = 46 - l.k * 8;
        const lift = walk * Math.max(0, Math.sin(t * 14 + i * 2.1)) * 12;
        const tx = l.side * (104 + l.k * 22), ty = 96 - lift * 0.6 - l.k * 4;
        // 一条尖腿：基部宽，向外下方收成尖
        l.el.setAttribute('d', `M${bx - l.side * 12} ${by + 4} Q${tx - l.side * 18} ${ty - 34 - lift} ${tx} ${ty} Q${tx + l.side * 2} ${ty - 50 - lift} ${bx + l.side * 14} ${by - 10}Z`);
      });
      const excited = mood === 'happy' || mood === 'surprised' ? 1 : 0;
      claws.forEach((c, i) => {
        const raise = (o.raise !== undefined ? o.raise : 0) + excited * 0.6 + talk * 0.25 * Math.sin(t * 4 + i);
        const sx = c.side * 112, sy = 0;
        const cx = c.side * (168 + raise * 10), cy = -58 - raise * 40 + Math.sin(t * 2 + i) * 4;
        c.arm.setAttribute('d', `M${sx} ${sy} Q${c.side * 162} ${sy + 8} ${cx} ${cy}`);
        const ang = c.side < 0 ? 205 - raise * 25 : -25 + raise * 25;
        c.cg.setAttribute('transform', `translate(${cx} ${cy}) rotate(${ang}) scale(1 ${c.side < 0 ? -1 : 1})`);
        const snap = o.snap ? Math.abs(Math.sin(t * 9 + i)) : 0.35 + talk * 0.4 * Math.abs(Math.sin(t * 7 + i));
        c.upperG.setAttribute('transform', `rotate(${(-snap * 26).toFixed(1)})`);
      });
      const bl = blinkAmt(t, seed * 3, 4.1);
      const look = o.look || [0, 0];
      const sur = mood === 'surprised' || mood === 'scared';
      const sad = mood === 'worried' || mood === 'scared';
      eyes.forEach((e) => {
        const ex = e.side * 36 + look[0] * 5, ey = -24 + look[1] * 4 - (sur ? 4 : 0);
        e.ball.setAttribute('transform', `translate(${ex.toFixed(1)} ${ey.toFixed(1)}) scale(${sur ? 1.18 : 1})`);
        V.set(e.iris, { ry: 17 * (1 - bl * 0.88) });
        V.set(e.glint, { cx: -4 + look[0] * 2, cy: -6 + look[1] * 2 });
        V.op(e.glint, bl > 0.5 ? 0 : 1);
        // 担心时出现八字眉
        V.set(e.brow, { d: `M${e.side * 14} -26 L${-e.side * 10} -36` });
        V.op(e.brow, sad ? 1 : 0);
      });
      let m;
      if (talk > 0.01) {
        const open = 6 + 18 * talk * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.abs(Math.sin(t * 4.7)));
        m = `M-24 4 Q0 9 24 4 Q22 ${8 + open} 0 ${10 + open} Q-22 ${8 + open} -24 4Z`;
      } else if (sur) m = 'M-11 14 Q-11 0 0 0 Q11 0 11 14 Q11 28 0 28 Q-11 28 -11 14Z';
      else if (sad) m = 'M-18 20 Q0 4 18 20 Q0 12 -18 20Z';
      else if (mood === 'happy') m = 'M-30 2 Q0 9 30 2 Q28 34 0 36 Q-28 34 -30 2Z';
      else m = 'M-25 4 Q0 10 25 4 Q22 28 0 30 Q-22 28 -25 4Z';
      mouth.setAttribute('d', m);
      V.op(sweat, sad ? 1 : 0);
    }
    return { root, update };
  };

  // ---------------- rustc 机器人 ----------------
  V.Rustc = function (parent, opts) {
    opts = opts || {};
    const root = V.A(parent);
    V.el('ellipse', { cx: 0, cy: 180, rx: 110, ry: 14, fill: '#000', opacity: 0.1 }, root);
    const bob = V.g(root);
    // 履带
    V.el('rect', { x: -95, y: 140, width: 190, height: 40, rx: 20, fill: '#2C3446' }, bob);
    const wheels = [];
    for (let i = 0; i < 4; i++) {
      const w = V.g(bob, { transform: `translate(${-66 + i * 44} 160)` });
      const wi = V.g(w);
      V.el('circle', { r: 14, fill: '#56607A' }, wi);
      V.el('path', { d: 'M-10 0 H10 M0 -10 V10', stroke: '#2C3446', 'stroke-width': 4 }, wi);
      wheels.push(wi);
    }
    // 身体
    V.el('rect', { x: -85, y: 20, width: 170, height: 125, rx: 22, fill: '#4A5873' }, bob);
    V.el('rect', { x: -60, y: 50, width: 120, height: 60, rx: 12, fill: '#36415A' }, bob);
    V.text(bob, 'rustc', { x: 0, y: 80, 'font-size': 30, 'font-family': V.MONO, 'font-weight': 700, fill: C.rust });
    // 手臂
    const arms = [-1, 1].map((s) => V.el('path', { stroke: '#56607A', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, bob));
    // 头
    const head = V.g(bob);
    const gear = V.el('path', { d: V.gearPath(40, 10, 9), fill: '#8892A8' }, head);
    V.el('circle', { cx: 0, cy: -120, r: 14, fill: '#56607A' }, head);
    V.el('rect', { x: -110, y: -120, width: 220, height: 140, rx: 28, fill: '#5A6886' }, head);
    const screen = V.el('rect', { x: -92, y: -104, width: 184, height: 108, rx: 18, fill: '#0F1626' }, head);
    const eyeL = V.el('rect', { x: -52, y: -78, width: 26, height: 34, rx: 9, fill: '#5EEAD4' }, head);
    const eyeR = V.el('rect', { x: 26, y: -78, width: 26, height: 34, rx: 9, fill: '#5EEAD4' }, head);
    const xEyes = V.el('path', { d: 'M-52 -76 L-26 -46 M-26 -76 L-52 -46 M26 -76 L52 -46 M52 -76 L26 -46', stroke: '#FF6B6B', 'stroke-width': 7, 'stroke-linecap': 'round' }, head);
    const wave = V.el('polyline', { fill: 'none', stroke: '#5EEAD4', 'stroke-width': 4, 'stroke-linejoin': 'round' }, head);
    const ant = V.el('circle', { cx: 0, cy: -168, r: 9, fill: C.rust }, head);
    V.el('path', { d: 'M0 -120 V-160', stroke: '#8892A8', 'stroke-width': 5 }, head);
    gear.setAttribute('transform', 'translate(0 -120)');

    function update(t, o) {
      o = o || {};
      const talk = o.talk || 0, mood = o.mood || 'neutral';
      const err = mood === 'error';
      const b = o.still ? 0 : V.osc(t, 0.6) * 3;
      bob.setAttribute('transform', `translate(0 ${b.toFixed(1)})`);
      wheels.forEach((w, i) => w.setAttribute('transform', `rotate(${((o.roll || 0) * 360 + i * 20).toFixed(1)})`));
      gear.setAttribute('transform', `translate(0 -120) rotate(${(t * 40).toFixed(1)})`);
      head.setAttribute('transform', `rotate(${(err ? Math.sin(t * 40) * 2 : V.osc(t, 0.4) * 1.5).toFixed(2)})`);
      arms.forEach((a, i) => {
        const s = i ? 1 : -1, w = (o.wave || 0) * Math.sin(t * 8) * 20;
        a.setAttribute('d', `M${s * 85} 50 Q${s * 125} ${80 + w} ${s * 120} ${110 - (o.armsUp || 0) * 90 + w}`);
      });
      V.set(screen, { fill: err ? '#3A0F14' : '#0F1626' });
      const bl = blinkAmt(t, 2.2, 3.3);
      V.op(eyeL, err ? 0 : 1); V.op(eyeR, err ? 0 : 1); V.op(xEyes, err ? 1 : 0);
      const eh = mood === 'happy' ? 10 : 34 * (1 - bl * 0.9);
      V.set(eyeL, { height: eh, y: -61 - eh / 2 }); V.set(eyeR, { height: eh, y: -61 - eh / 2 });
      let pts = '';
      for (let i = 0; i <= 24; i++) {
        const x = -40 + i * (80 / 24);
        const y = -22 + (talk > 0.01 ? Math.sin(i * 0.9 + t * 20) * 10 * talk * Math.sin((i / 24) * Math.PI) : 0);
        pts += `${x.toFixed(1)},${y.toFixed(1)} `;
      }
      V.set(wave, { points: pts, stroke: err ? '#FF6B6B' : '#5EEAD4' });
      V.set(ant, { fill: (Math.floor(t * 2) % 2 ? C.rust : '#FFB27A') });
    }
    return { root, update };
  };

  // ---------------- 猫 ----------------
  V.Cat = function (parent, opts) {
    opts = opts || {};
    const col = opts.color || '#F2A65A', dark = opts.dark || '#C9783A';
    const root = V.A(parent);
    const b = V.g(root);
    const tail = V.el('path', { stroke: col, 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }, b);
    V.el('ellipse', { cx: 0, cy: 18, rx: 34, ry: 26, fill: col }, b);
    V.el('ellipse', { cx: 0, cy: 26, rx: 18, ry: 14, fill: '#FFE7CC' }, b);
    const head = V.g(b);
    V.el('path', { d: 'M-30 -38 L-24 -66 L-8 -46Z M30 -38 L24 -66 L8 -46Z', fill: col, stroke: col, 'stroke-width': 4, 'stroke-linejoin': 'round' }, head);
    V.el('path', { d: 'M-24 -44 L-22 -58 L-14 -48Z M24 -44 L22 -58 L14 -48Z', fill: '#FFB3A7' }, head);
    V.el('circle', { cx: 0, cy: -26, r: 32, fill: col }, head);
    V.el('path', { d: 'M-8 -56 L-6 -46 M0 -58 V-47 M8 -56 L6 -46', stroke: dark, 'stroke-width': 3, 'stroke-linecap': 'round' }, head);
    const eyes = [V.el('ellipse', { cx: -12, cy: -28, rx: 4.5, ry: 6, fill: '#2B2522' }, head), V.el('ellipse', { cx: 12, cy: -28, rx: 4.5, ry: 6, fill: '#2B2522' }, head)];
    V.el('path', { d: 'M-3 -18 L3 -18 L0 -15Z', fill: '#E46A6A' }, head);
    V.el('path', { d: 'M0 -15 Q-5 -9 -9 -12 M0 -15 Q5 -9 9 -12', stroke: '#2B2522', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, head);
    V.el('path', { d: 'M-16 -18 H-36 M-16 -14 L-34 -8 M16 -18 H36 M16 -14 L34 -8', stroke: '#2B2522', 'stroke-width': 1.5, opacity: 0.6 }, head);
    const seed = opts.seed || Math.random() * 10;
    function update(t, o) {
      o = o || {};
      const w = Math.sin(t * 3 + seed);
      tail.setAttribute('d', `M26 30 Q ${58 + w * 6} 20 ${50 + w * 10} ${-8 + w * 4}`);
      head.setAttribute('transform', `rotate(${(V.osc(t, 0.35, seed) * 4 + (o.tilt || 0)).toFixed(1)} 0 -20)`);
      const bl = blinkAmt(t, seed, 3.1);
      eyes.forEach((e) => V.set(e, { ry: 6 * (1 - bl * 0.9) }));
      b.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * (o.hop ? 9 : 0))) * (o.hop || 0) * 16).toFixed(1)})`);
    }
    return { root, update };
  };

  // ---------------- 狗 ----------------
  V.Dog = function (parent, opts) {
    opts = opts || {};
    const col = opts.color || '#B9814F';
    const root = V.A(parent);
    const b = V.g(root);
    const tail = V.el('path', { stroke: col, 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round' }, b);
    V.el('ellipse', { cx: 0, cy: 18, rx: 38, ry: 27, fill: col }, b);
    V.el('ellipse', { cx: 0, cy: 26, rx: 18, ry: 14, fill: '#F1D7B8' }, b);
    const head = V.g(b);
    const ears = [V.el('path', { d: 'M-26 -48 Q-48 -40 -40 -6 Q-28 -16 -20 -38Z', fill: '#7A4E2C' }, head), V.el('path', { d: 'M26 -48 Q48 -40 40 -6 Q28 -16 20 -38Z', fill: '#7A4E2C' }, head)];
    V.el('circle', { cx: 0, cy: -28, r: 32, fill: col }, head);
    V.el('ellipse', { cx: 0, cy: -14, rx: 17, ry: 12, fill: '#F1D7B8' }, head);
    V.el('ellipse', { cx: 0, cy: -20, rx: 6, ry: 4.5, fill: '#2B2522' }, head);
    const eyes = [V.el('circle', { cx: -12, cy: -34, r: 4.5, fill: '#2B2522' }, head), V.el('circle', { cx: 12, cy: -34, r: 4.5, fill: '#2B2522' }, head)];
    const tongue = V.el('path', { d: 'M-5 -7 Q0 8 5 -7Z', fill: '#E46A6A' }, head);
    const seed = opts.seed || 2.2;
    function update(t, o) {
      o = o || {};
      const w = Math.sin(t * 12 + seed);
      tail.setAttribute('d', `M-32 14 Q ${-56 + w * 6} 4 ${-58 + w * 10} ${-18}`);
      head.setAttribute('transform', `rotate(${(V.osc(t, 0.5, seed) * 4).toFixed(1)} 0 -20)`);
      ears.forEach((e, i) => e.setAttribute('transform', `rotate(${Math.sin(t * 6 + i) * 5} ${i ? 26 : -26} -46)`));
      const bl = blinkAmt(t, seed, 2.9);
      eyes.forEach((e) => V.set(e, { r: 4.5 * (1 - bl * 0.8) }));
      V.op(tongue, o.pant === false ? 0 : 1);
      b.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * 9)) * (o.hop || 0) * 16).toFixed(1)})`);
    }
    return { root, update };
  };
})();
