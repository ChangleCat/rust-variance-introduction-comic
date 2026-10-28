// 角色：Claude（光芒）、Ferris（螃蟹）、rustc（齿轮头机器人）、猫、狗。
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
  V.Claude = function (parent, opts) {
    opts = opts || {};
    const root = V.A(parent);
    const bob = V.g(root);
    const shadow = V.el('ellipse', { cx: 0, cy: 150, rx: 70, ry: 12, fill: '#000', opacity: 0.08 }, root);
    const raysG = V.g(bob);
    const N = 12, rays = [];
    for (let i = 0; i < N; i++) rays.push(V.el('path', { fill: C.claude }, raysG));
    V.el('circle', { r: 58, fill: C.claude }, bob);
    V.el('circle', { r: 50, fill: '#E58B6C', opacity: 0.55 }, bob);
    const face = V.g(bob);
    const cheekL = V.el('ellipse', { cx: -30, cy: 10, rx: 9, ry: 6, fill: '#FF9C8A', opacity: 0.5 }, face);
    const cheekR = V.el('ellipse', { cx: 30, cy: 10, rx: 9, ry: 6, fill: '#FF9C8A', opacity: 0.5 }, face);
    const eyeL = V.el('ellipse', { cx: -18, cy: -8, rx: 7, ry: 10, fill: '#3A2016' }, face);
    const eyeR = V.el('ellipse', { cx: 18, cy: -8, rx: 7, ry: 10, fill: '#3A2016' }, face);
    const glintL = V.el('circle', { cx: -16, cy: -12, r: 2.5, fill: '#fff' }, face);
    const glintR = V.el('circle', { cx: 20, cy: -12, r: 2.5, fill: '#fff' }, face);
    const happyEyes = V.el('path', { d: 'M-26 -6 Q-18 -18 -10 -6 M10 -6 Q18 -18 26 -6', stroke: '#3A2016', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, face);
    const mouth = V.el('path', { fill: '#3A2016', stroke: '#3A2016', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, face);
    const seed = opts.seed || 0.7;

    function rayPath(a, r0, r1, w0, w1) {
      const c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
      const bx = c * r0, by = s * r0, tx = c * r1, ty = s * r1;
      return `M${(bx + px * w0).toFixed(1)} ${(by + py * w0).toFixed(1)} L${(tx + px * w1).toFixed(1)} ${(ty + py * w1).toFixed(1)} A${w1} ${w1} 0 0 0 ${(tx - px * w1).toFixed(1)} ${(ty - py * w1).toFixed(1)} L${(bx - px * w0).toFixed(1)} ${(by - py * w0).toFixed(1)}Z`;
    }

    function update(t, o) {
      o = o || {};
      const talk = o.talk || 0, mood = o.mood || 'neutral';
      const float = o.still ? 0 : V.osc(t, 0.45, seed) * 8;
      bob.setAttribute('transform', `translate(0 ${float.toFixed(1)}) rotate(${(o.tilt || 0) + V.osc(t, 0.3, seed) * 2})`);
      V.set(shadow, { rx: 70 - float * 0.8 });
      const spin = t * 4 + (o.spin || 0);
      raysG.setAttribute('transform', `rotate(${spin.toFixed(1)})`);
      const pa = o.point !== undefined && o.point !== null ? (o.point * Math.PI) / 180 : null;
      const burst = o.burst || 0;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        let len = (i % 2 ? 92 : 112) * (1 + 0.05 * Math.sin(i * 1.7));
        len *= 1 + 0.035 * V.osc(t, 0.4, i) + talk * 0.07 * Math.sin(t * 13 + i * 0.9) + burst * 0.35;
        if (pa !== null) {
          let da = Math.atan2(Math.sin(a + (spin * Math.PI) / 180 - pa), Math.cos(a + (spin * Math.PI) / 180 - pa));
          len *= 1 + (o.pointAmt === undefined ? 1 : o.pointAmt) * 0.45 * Math.max(0, 1 - Math.abs(da) / 0.45);
        }
        rays[i].setAttribute('d', rayPath(a, 30, len, 15, 9));
      }
      // 表情
      const look = o.look || [0, 0];
      face.setAttribute('transform', `translate(${look[0] * 8} ${look[1] * 6})`);
      const bl = blinkAmt(t, seed * 5);
      const happy = mood === 'happy';
      const sur = mood === 'surprised' ? 1 : 0;
      [eyeL, eyeR, glintL, glintR].forEach((e) => V.op(e, happy ? 0 : 1));
      V.op(happyEyes, happy ? 1 : 0);
      const ry = (10 + sur * 4) * (1 - bl * 0.9);
      V.set(eyeL, { ry, rx: 7 + sur * 2 });
      V.set(eyeR, { ry, rx: 7 + sur * 2 });
      V.op(cheekL, 0.4 + (happy ? 0.3 : 0));
      V.op(cheekR, 0.4 + (happy ? 0.3 : 0));
      let m;
      if (talk > 0.01) {
        const open = 3 + 11 * talk * Math.abs(Math.sin(t * 12.5)) * (0.6 + 0.4 * Math.abs(Math.sin(t * 5.3)));
        m = `M-11 14 Q0 ${14 + open * 1.6} 11 14 Q0 ${14 + open * 0.3} -11 14Z`;
      } else if (sur) m = 'M-6 18 Q0 8 6 18 Q0 28 -6 18Z';
      else if (mood === 'think') m = 'M-10 18 Q0 14 10 20 Q0 17 -10 18Z';
      else m = 'M-13 13 Q0 26 13 13 Q0 19 -13 13Z';
      mouth.setAttribute('d', m);
    }
    return { root, update };
  };

  // ---------------- Ferris ----------------
  V.Ferris = function (parent, opts) {
    opts = opts || {};
    const root = V.A(parent);
    const shadow = V.el('ellipse', { cx: 0, cy: 95, rx: 130, ry: 14, fill: '#000', opacity: 0.09 }, root);
    const bob = V.g(root);
    const legs = [];
    const legG = V.g(bob);
    for (let side = -1; side <= 1; side += 2) {
      for (let k = 0; k < 3; k++) legs.push({ side, k, el: V.el('path', { stroke: C.rustDark, 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, legG) });
    }
    // 钳子
    const claws = [];
    for (let side = -1; side <= 1; side += 2) {
      const arm = V.el('path', { stroke: C.rust, 'stroke-width': 16, fill: 'none', 'stroke-linecap': 'round' }, bob);
      const cg = V.g(bob);
      const lower = V.el('path', { d: 'M0 0 C 10 22, 48 26, 58 4 C 40 12, 18 10, 0 0Z', fill: C.rust, stroke: C.rust, 'stroke-width': 6, 'stroke-linejoin': 'round' }, cg);
      const upperG = V.g(cg);
      V.el('path', { d: 'M0 0 C 6 -30, 52 -36, 62 -6 C 40 -16, 20 -12, 0 0Z', fill: C.rust, stroke: C.rust, 'stroke-width': 6, 'stroke-linejoin': 'round' }, upperG);
      V.el('circle', { r: 17, fill: C.rust }, cg);
      claws.push({ side, arm, cg, upperG, lower });
    }
    // 身体：带锯齿的壳
    let d = '';
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i / 18) * Math.PI;
      const r = i % 2 === 0 ? 1 : 0.84;
      pts.push([Math.cos(a) * 128 * r, Math.sin(a) * 74 * r + 8]);
    }
    d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    d += ' C 120 50, 60 70, 0 70 C -60 70, -120 50, -128 8Z';
    V.el('path', { d, fill: C.rust, stroke: C.rust, 'stroke-width': 12, 'stroke-linejoin': 'round' }, bob);
    V.el('path', { d: 'M-100 30 C -60 58, 60 58, 100 30', stroke: '#FF7A33', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 }, bob);
    // 眼睛
    const eyes = [];
    for (let side = -1; side <= 1; side += 2) {
      const stalk = V.el('path', { stroke: '#2B1A12', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, bob);
      const ball = V.g(bob);
      V.el('circle', { r: 17, fill: '#fff', stroke: '#2B1A12', 'stroke-width': 4 }, ball);
      const pupil = V.el('circle', { r: 8, fill: '#1A0F0A' }, ball);
      const glint = V.el('circle', { r: 2.5, fill: '#fff' }, ball);
      const cid = 'eyeclip' + V.uid++;
      V.el('circle', { r: 15 }, V.el('clipPath', { id: cid }, ball));
      const lid = V.el('rect', { x: -19, y: -19, width: 38, height: 0, fill: C.rust, 'clip-path': `url(#${cid})` }, ball);
      eyes.push({ side, stalk, ball, pupil, glint, lid });
    }
    const mouth = V.el('path', { fill: '#2B1A12', stroke: '#2B1A12', 'stroke-width': 4, 'stroke-linejoin': 'round' }, bob);
    const blush = [V.el('ellipse', { cx: -52, cy: 4, rx: 13, ry: 7, fill: '#FF9C8A', opacity: 0.55 }, bob), V.el('ellipse', { cx: 52, cy: 4, rx: 13, ry: 7, fill: '#FF9C8A', opacity: 0.55 }, bob)];
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
        const bx = l.side * (70 + l.k * 24), by = 40 - l.k * 8;
        const lift = walk * Math.max(0, Math.sin(t * 14 + i * 2.1)) * 14;
        const kx = l.side * (110 + l.k * 22), ky = 60 - lift - l.k * 4;
        const fx = l.side * (118 + l.k * 26), fy = 92 - lift * 0.4;
        l.el.setAttribute('d', `M${bx} ${by} Q${kx} ${ky - 30} ${fx} ${fy}`);
      });
      const excited = mood === 'happy' || mood === 'surprised' ? 1 : 0;
      claws.forEach((c, i) => {
        const raise = (o.raise !== undefined ? o.raise : 0) + excited * 0.6 + talk * 0.25 * Math.sin(t * 4 + i);
        const sx = c.side * 118, sy = -4;
        const cx = c.side * (175 + raise * 10), cy = -52 - raise * 40 + Math.sin(t * 2 + i) * 4;
        c.arm.setAttribute('d', `M${sx} ${sy} Q${c.side * 165} ${sy + 10} ${cx} ${cy}`);
        const ang = c.side < 0 ? 200 - raise * 25 : -20 + raise * 25;
        c.cg.setAttribute('transform', `translate(${cx} ${cy}) rotate(${ang}) scale(1 ${c.side < 0 ? -1 : 1})`);
        const snap = o.snap ? Math.abs(Math.sin(t * 9 + i)) : 0.35 + talk * 0.4 * Math.abs(Math.sin(t * 7 + i));
        c.upperG.setAttribute('transform', `rotate(${(-snap * 28).toFixed(1)})`);
      });
      const bl = blinkAmt(t, seed * 3, 4.1);
      const look = o.look || [0, 0];
      const sur = mood === 'surprised' || mood === 'scared';
      eyes.forEach((e) => {
        const bx = e.side * 32, by = -50;
        const ex = e.side * (40 + (sur ? 6 : 0)) + Math.sin(t * 1.6 + e.side) * 3, ey = -102 - (sur ? 16 : 0) + Math.cos(t * 1.3 + e.side) * 3;
        e.stalk.setAttribute('d', `M${bx} ${by} Q${bx + e.side * 2} ${(by + ey) / 2} ${ex} ${ey}`);
        e.ball.setAttribute('transform', `translate(${ex.toFixed(1)} ${ey.toFixed(1)}) scale(${sur ? 1.15 : 1})`);
        const px = look[0] * 7, py = look[1] * 6;
        V.set(e.pupil, { cx: px, cy: py, r: sur ? 6 : 8 });
        V.set(e.glint, { cx: px + 3, cy: py - 3 });
        const lidH = mood === 'happy' ? 18 : mood === 'worried' ? 12 : bl * 38;
        V.set(e.lid, { height: lidH });
      });
      let m;
      if (talk > 0.01) {
        const open = 4 + 14 * talk * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.abs(Math.sin(t * 4.7)));
        m = `M-16 8 Q0 ${8 + open * 1.5} 16 8 Q0 ${8 + open * 0.2} -16 8Z`;
      } else if (sur) m = 'M-9 14 Q0 0 9 14 Q0 28 -9 14Z';
      else if (mood === 'worried' || mood === 'scared') m = 'M-16 18 Q0 6 16 18 Q0 12 -16 18Z';
      else m = 'M-18 6 Q0 26 18 6 Q0 14 -18 6Z';
      mouth.setAttribute('d', m);
      V.op(sweat, mood === 'worried' || mood === 'scared' ? 1 : 0);
      blush.forEach((b) => V.op(b, mood === 'happy' ? 0.8 : 0.45));
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
