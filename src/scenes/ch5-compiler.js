// 第五章：走进 rustc。型变推断 = 格 + 约束收集 + 位置组合（xform）+ 不动点；推断结果用于类型比较与借用检查。
(function () {
  const V = window.V, C = V.C;

  // 蓝图风格的“车间”背景
  V.Workshop = function (root, seed) {
    const g = V.g(root);
    V.el('rect', { width: V.W, height: V.H, fill: '#EEF2F7' }, g);
    const grid = V.g(g, { opacity: 0.55 });
    for (let x = 0; x <= V.W; x += 48) V.el('line', { x1: x, y1: 0, x2: x, y2: V.H, stroke: '#D5DEEA', 'stroke-width': x % 240 ? 1 : 2 }, grid);
    for (let y = 0; y <= V.H; y += 48) V.el('line', { x1: 0, y1: y, x2: V.W, y2: y, stroke: '#D5DEEA', 'stroke-width': y % 240 ? 1 : 2 }, grid);
    const rnd = V.rng(seed || 9);
    const gears = [[90, 980, 130, 12], [1860, 120, 110, 10], [1760, 1010, 80, 9], [60, 90, 70, 8]].map(([x, y, r, n]) => ({ el: V.el('path', { d: V.gearPath(r, n, r * 0.22), fill: '#C9D4E3', opacity: 0.7 }, g), x, y, sp: (rnd() > 0.5 ? 1 : -1) * (20 + rnd() * 20) }));
    g.update = (t) => gears.forEach((q) => q.el.setAttribute('transform', `translate(${q.x} ${q.y}) rotate(${(t * q.sp).toFixed(1)})`));
    return g;
  };

  // 型变之格
  V.Lattice = function (parent, o) {
    o = o || {};
    const s = o.s || 230, r = o.r || 54;
    const root = V.A(parent);
    const P = { inv: [0, -s], co: [-s, 0], contra: [s, 0], bi: [0, s] };
    root.P = P;
    const edges = V.g(root);
    [['bi', 'co'], ['bi', 'contra'], ['co', 'inv'], ['contra', 'inv']].forEach(([a, b]) => V.el('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: '#9AA8BC', 'stroke-width': 8, 'stroke-linecap': 'round' }, edges));
    root.nodes = {};
    Object.keys(P).forEach((k) => {
      const b = V.Badge(root, k, { r });
      b.at(P[k][0], P[k][1]);
      const info = V.VAR[k];
      const lx = k === 'co' ? -r - 20 : k === 'contra' ? r + 20 : 0, ly = k === 'inv' ? -r - 30 : k === 'bi' ? r + 34 : 0;
      V.text(root, `${info.name} ${info.sym}`, { x: P[k][0] + lx, y: P[k][1] + ly, 'font-size': 32, 'font-weight': 800, fill: info.color, 'text-anchor': k === 'co' ? 'end' : k === 'contra' ? 'start' : 'middle' });
      root.nodes[k] = b;
    });
    return root;
  };

  const DEMO = `struct Demo<'a, 'b, T, U> {
    a: &'a T,
    b: &'b mut U,
    f: fn(T),
}`;

  // ---------- 推断，而不是标注 ----------
  V.defScene('c_intro', {
    mood: 'tech',
    pauses: { 0: 0.6, 1: 1.6 },
    tail: 1.8,
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.3, 'pop'], [L[0] + 1.2, 'boing'], [L[1] + 0.2, 'gear'], [L[1] + 1.0, 'clank'], [L[1] + 2.6, 'hiss'], [L[1] + 3.2, 'whoosh'], [L[2] - 0.2, 'hum'], [L[2] + 0.2, 'chime']];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 61 });
      const shop = V.Workshop(S.root, 3);
      const g = V.g(S.root);
      const code = V.Code(g, { title: 'my_struct.rs', fs: 32, code: DEMO });
      const qs = [0, 1, 2, 3].map(() => V.text(g, '?', { 'font-size': 56, 'font-weight': 900, fill: C.claude }));
      const qcols = [12, 16, 20, 23];
      const bot = V.Rustc(g);
      const doors = [V.el('rect', { x: -60, y: 50, width: 60, height: 60, rx: 6, fill: '#2C3446' }, bot.root), V.el('rect', { x: 0, y: 50, width: 60, height: 60, rx: 6, fill: '#2C3446' }, bot.root)];
      const glow = V.el('rect', { x: -60, y: 50, width: 120, height: 60, fill: '#FFF3B0' }, bot.root);
      bot.root.insertBefore(glow, doors[0]);
      const flash = V.el('rect', { width: V.W, height: V.H, fill: '#FFFBEA' }, g);
      const sign = V.A(g);
      V.el('rect', { x: -470, y: -80, width: 940, height: 160, rx: 26, fill: '#1F2A44', stroke: C.gold, 'stroke-width': 6 }, sign);
      V.text(sign, '型变推断车间', { y: -18, 'font-size': 64, 'font-weight': 900, fill: '#FFE7A3' });
      V.text(sign, 'rustc_hir_analysis::variance', { y: 46, 'font-size': 28, 'font-family': V.MONO, fill: '#9FB3D9' });
      const small = V.Rustc(g);
      const cast = V.cast(S);

      return (t) => {
        bg.update(t);
        shop.update(t);
        const inside = t > L[1] + 3.0;
        V.op(shop, inside ? 1 : 0);
        // 代码与问号
        const o0 = V.fout(t, L[1] + 0.8, 0.4);
        code.root.at(960 - code.w / 2, 170, 1, 0, V.fin(t, L[0] + 0.1) * o0);
        qs.forEach((q, i) => {
          V.set(q, { x: 960 - code.w / 2 + code.colX(0, qcols[i]) + 10, y: 120 - Math.abs(Math.sin(t * 4 + i)) * 12 });
          V.op(q, V.fin(t, L[0] + 1.0 + i * 0.15) * o0);
        });
        // rustc 驶入，镜头推进胸口
        const roll = V.ep(t, L[1] + 0.1, L[1] + 1.2, 'out');
        const zoom = V.ep(t, L[1] + 1.8, L[1] + 3.1, 'in');
        const s = V.lerp(1.2, 14, zoom);
        bot.root.at(V.lerp(2200, 960, roll), V.lerp(640, 540 - 80 * s, zoom), s, 0, inside ? 0 : V.fin(t, L[1]));
        bot.update(t, { roll: roll * 3 });
        const open = V.ep(t, L[1] + 1.4, L[1] + 2.0);
        V.set(doors[0], { x: -60 - open * 58 });
        V.set(doors[1], { x: 0 + open * 58 });
        V.op(flash, V.win(t, L[1] + 2.8, L[1] + 3.2, 0.25));
        sign.at(960, 420, V.inn(t, L[2] - 0.2, 0.6));
        small.root.at(960, 760, 0.8, 0, V.fin(t, L[2] - 0.3));
        small.update(t, { talk: S.talk('rustc', t), wave: 1, mood: 'happy' });
        cast.update(t, {
          ferris: { mood: t > L[1] + 1 && !inside ? 'surprised' : 'neutral', look: [-1, -0.5], o: 1 },
          claude: { look: [1, -0.4] },
        });
      };
    },
  });

  // ---------- 型变之格 ----------
  V.defScene('c_lattice', {
    mood: 'tech',
    pauses: { 0: 0.6, 1: 1.4 },
    tail: 1.6,
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.5, 'pop'], [L[0] + 1.6, 'pop'], [L[0] + 2.4, 'pop'], [L[0] + 3.4, 'pop'], [L[1] + 0.3, 'rise'], [L[1] + 2.4, 'swish'], [L[1] + 3.4, 'ding'], [L[2] + 0.6, 'fall'], [L[2] + 1.4, 'lock']];
    },
    build(S) {
      const { L, E } = S;
      const shop = V.Workshop(S.root, 4);
      const tag = V.sceneTag(S, '型变之格', C.bi);
      const g = V.g(S.root);
      const lat = V.Lattice(g, { s: 230 });
      const strong = V.A(g);
      const sa = V.Arrow(strong, { color: C.soft, width: 6, head: 20 });
      sa.set(0, 220, 0, -220);
      V.text(strong, '约束更强', { x: 0, y: -260, 'font-size': 30, fill: C.soft, 'font-weight': 700 });
      const tokCo = V.Badge(g, 'co', { r: 30 }), tokContra = V.Badge(g, 'contra', { r: 30 });
      const join = V.A(g);
      V.text(join, '协变 ⊔ 逆变 = 不变', { 'font-size': 46, 'font-weight': 900, fill: C.inv });
      V.text(join, '（⊔：在格上取上界）', { y: 56, 'font-size': 28, fill: C.soft });
      const params = ["'a", "'b", 'T', 'U'].map((s) => V.Pill(g, s, { fs: 32, mono: true, fill: C.bi }));
      const startNote = V.Pill(g, '起点：全部是双变（还没有任何约束）', { fs: 30, fill: '#fff', color: C.bi, stroke: C.bi, sw: 3 });
      const cast = V.cast(S, { claudePos: [180, 860], claudeScale: 0.65, ferrisPos: [1750, 900], ferrisScale: 0.6 });
      return (t) => {
        shop.update(t);
        tag(t);
        const CX = 960, CY = 500;
        lat.at(CX, CY, 1, 0, 1);
        const order = ['bi', 'co', 'contra', 'inv'];
        order.forEach((k, i) => lat.nodes[k].at(lat.P[k][0], lat.P[k][1], V.inn(t, L[0] + 0.5 + [0, 1.1, 1.9, 2.9][i])));
        strong.at(CX - 470, CY, 1, 0, V.fin(t, L[1] + 0.2));
        // 两个记号沿边上升并在顶部汇合
        const m = V.ep(t, L[1] + 1.4, L[1] + 2.6, 'inOut');
        const P = lat.P;
        const mv = (from) => [V.lerp(from[0], P.inv[0], m), V.lerp(from[1], P.inv[1], m)];
        const vis = V.win(t, L[1] + 0.9, L[2] - 0.2);
        const a = mv(P.co), b = mv(P.contra);
        tokCo.at(CX + a[0] - 70 * (1 - m), CY + a[1] - 70 * (1 - m), V.inn(t, L[1] + 0.9) * (1 - m * 0.6), 0, vis);
        tokContra.at(CX + b[0] + 70 * (1 - m), CY + b[1] - 70 * (1 - m), V.inn(t, L[1] + 1.0) * (1 - m * 0.6), 0, vis);
        join.at(CX + 520, CY - 230, V.inn(t, L[1] + 3.2), 0, V.fout(t, L[2], 0.3));
        // 参数落在底部
        params.forEach((p, i) => {
          const at = L[2] + 0.5 + i * 0.15;
          const k = V.ep(t, at, at + 0.6, 'outBounce');
          p.at(CX + (i - 1.5) * 100, V.lerp(CY - 600, CY + P.bi[1] + 165, k), 1, 0, k > 0 ? 1 : 0);
        });
        startNote.at(CX + 560, CY + 180, V.inn(t, L[2] + 1.4));
        cast.update(t, { ferris: { look: [-1, -0.4] }, claude: { look: [1, -0.4] } });
      };
    },
  });

  // ---------- 逐个字段收集约束 ----------
  V.defScene('c_walk', {
    mood: 'tech',
    pauses: { 0: 0.6, 1: 0.8, 2: 0.8, 3: 0.8 },
    tail: 2.0,
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.3, 'gear'], [L[0] + 1.2, 'pop'], [L[1] + 0.2, 'scan'], [L[1] + 1.6, 'pop2'], [L[1] + 2.1, 'pop2'], [L[2] + 0.2, 'scan'], [L[2] + 1.6, 'pop2'], [L[2] + 2.1, 'pop2'], [L[3] + 0.2, 'scan'], [L[3] + 1.8, 'pop2'], [L[4] + 0.3, 'swish'], [L[4] + 1.2, 'clank'], [L[4] + 1.6, 'pop'], [L[4] + 2.4, 'tada']];
    },
    build(S) {
      const { L } = S;
      const shop = V.Workshop(S.root, 5);
      const tag = V.sceneTag(S, '收集约束', C.contra);
      const g = V.g(S.root);
      const code = V.Code(g, { title: 'demo.rs', fs: 34, code: DEMO });
      const beam = V.el('rect', { height: 0, rx: 6, fill: C.gold, opacity: 0.35 }, code.overlay);
      // 约束表
      const tab = V.A(g);
      const cols = [1220, 1360, 1500, 1640], names = ["'a", "'b", 'T', 'U'];
      const rows = [['初始', 300], ["a: &'a T", 410], ["b: &'b mut U", 510], ['f: fn(T)', 610], ['合并 ⊔', 740]];
      V.el('rect', { x: 940, y: 200, width: 790, height: 620, rx: 26, fill: '#fff', stroke: '#9AA8BC', 'stroke-width': 4 }, tab);
      names.forEach((n, i) => V.text(tab, n, { x: cols[i], y: 240, 'font-size': 36, 'font-family': V.MONO, 'font-weight': 800 }));
      rows.forEach(([n, y], i) => {
        if (i === 4) V.el('line', { x1: 960, x2: 1710, y1: y - 62, y2: y - 62, stroke: C.ink, 'stroke-width': 3 }, tab);
        V.text(tab, n, { x: 970, y, 'font-size': 28, 'font-family': i && i < 4 ? V.MONO : V.FONT, 'font-weight': 700, 'text-anchor': 'start', fill: i === 4 ? C.ink : C.soft });
      });
      const cell = (kind) => V.Badge(tab, kind, { r: 26 });
      const init = names.map(() => cell('bi'));
      const ra = [cell('co'), cell('co')], rb = [cell('co'), cell('inv')], rf = cell('contra');
      const res = [cell('co'), cell('co'), cell('inv'), cell('inv')];
      const flyCo = cell('co'), flyContra = cell('contra');
      const note = V.Pill(g, '+ ⊔ − = o', { fs: 34, mono: true, fill: C.inv });

      const cast = V.cast(S, { claudePos: [170, 880], claudeScale: 0.6, ferrisPos: [1800, 950], ferrisScale: 0.5 });
      return (t) => {
        shop.update(t);
        tag(t);
        code.root.at(90, 300, 1, 0, V.fin(t, 0.2));
        tab.at(0, 0, 1, 0, V.fin(t, L[0] + 0.4));
        // 扫描光束
        const line = t < L[1] ? -1 : t < L[2] ? 1 : t < L[3] ? 2 : t < L[4] ? 3 : -1;
        if (line > 0) V.set(beam, { x: 12, y: code.lineY(line) - code.lh / 2 + 2, width: code.w - 24, height: code.lh - 4 });
        V.op(beam, line > 0 ? 0.35 + 0.2 * Math.sin(t * 8) : 0);
        init.forEach((b, i) => b.at(cols[i], 300, V.inn(t, L[0] + 1.2 + i * 0.1)));
        ra[0].at(cols[0], 410, V.inn(t, L[1] + 1.6));
        ra[1].at(cols[2], 410, V.inn(t, L[1] + 2.1));
        rb[0].at(cols[1], 510, V.inn(t, L[2] + 1.6));
        rb[1].at(cols[3], 510, V.inn(t, L[2] + 2.1));
        rf.at(cols[2], 610, V.inn(t, L[3] + 1.8));
        // 合并：T 列的 + 和 − 飞到结果行相撞
        const m = V.ep(t, L[4] + 0.3, L[4] + 1.2, 'in');
        flyCo.at(V.lerp(cols[2], cols[2] - 30, m), V.lerp(410, 740, m), 1, 0, m > 0 && m < 1 ? 1 : 0);
        flyContra.at(V.lerp(cols[2], cols[2] + 30, m), V.lerp(610, 740, m), 1, 0, m > 0 && m < 1 ? 1 : 0);
        res.forEach((b, i) => b.at(cols[i], 740, V.inn(t, i === 2 ? L[4] + 1.2 : L[4] + 1.5 + i * 0.1) * (i === 2 ? 1.25 : 1)));
        note.at(cols[2], 860, V.inn(t, L[4] + 1.4));
        cast.update(t, { ferris: { look: [-1, -0.5], mood: t > L[4] + 2 ? 'happy' : 'neutral' }, claude: { look: [1, -0.5] } });
      };
    },
  });

  // ---------- 位置的乘法 ----------
  V.defScene('c_xform', {
    mood: 'tech',
    pauses: { 0: 0.6, 1: 1.0 },
    tail: 2.2,
    sfx: (S) => {
      const { L, E } = S, d1 = E[1] - L[1];
      return [[L[0] + 0.3, 'pop'], ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [L[1] + d1 * (Math.floor(i / 3) * 0.33) + (i % 3) * 0.15, 'tick']), [L[2] + 0.5, 'type'], [L[2] + 2.0, 'swish'], [L[2] + 2.8, 'ding']];
    },
    build(S) {
      const { L, E } = S;
      const shop = V.Workshop(S.root, 6);
      const tag = V.sceneTag(S, '位置的乘法 xform', C.co);
      const g = V.g(S.root);
      const grid = V.A(g);
      const ks = ['co', 'contra', 'inv'];
      const table = { co: { co: 'co', contra: 'contra', inv: 'inv' }, contra: { co: 'contra', contra: 'co', inv: 'inv' }, inv: { co: 'inv', contra: 'inv', inv: 'inv' } };
      const G = 150;
      V.el('rect', { x: -G * 2 + 10, y: -G * 2 + 10, width: G * 4 - 20, height: G * 4 - 20, rx: 26, fill: '#fff', stroke: '#9AA8BC', 'stroke-width': 4 }, grid);
      V.text(grid, '×', { x: -G * 1.5, y: -G * 1.5, 'font-size': 64, 'font-weight': 900, fill: C.soft });
      V.text(grid, '外层位置', { x: -G * 1.5 - 120, y: 0, 'font-size': 26, fill: C.soft, transform: `rotate(-90 ${-G * 1.5 - 120} 0)` });
      V.text(grid, '内层型变', { x: 0, y: -G * 2 - 30, 'font-size': 26, fill: C.soft });
      ks.forEach((k, i) => {
        V.Badge(grid, k, { r: 34 }).at(-G * 0.5 + i * G, -G * 1.5);
        V.Badge(grid, k, { r: 34 }).at(-G * 1.5, -G * 0.5 + i * G);
      });
      const cells = [];
      ks.forEach((o, i) => ks.forEach((n, j) => {
        const b = V.Badge(grid, table[o][n], { r: 40 });
        b.px = -G * 0.5 + j * G;
        b.py = -G * 0.5 + i * G;
        b.row = i;
        b.col = j;
        cells.push(b);
      }));
      // fn(fn(T))
      const expr = V.A(g);
      const parts = [['fn(', 0], ['fn(', 1], ['T', 2], [')', 1], [')', 0]];
      let x = -V.textW('fn(fn(T))', 80, true) / 2;
      const segs = parts.map(([s, lvl]) => {
        const w = V.textW(s, 80, true);
        const e = V.text(expr, s, { x: x + w / 2, 'font-size': 80, 'font-family': V.MONO, 'font-weight': 900, fill: lvl === 2 ? C.ink : lvl ? C.contra : '#6B8FD6' });
        const r = { e, x: x + w / 2, w };
        x += w;
        return r;
      });
      const m1 = V.Badge(g, 'contra', { r: 32 }), m2 = V.Badge(g, 'contra', { r: 32 }), res = V.Badge(g, 'co', { r: 46 });
      const eq = V.A(g);
      V.text(eq, '− × − = +', { 'font-size': 56, 'font-family': V.MONO, 'font-weight': 900, fill: C.co });
      V.text(eq, 'T 被翻转两次 → 协变', { y: 62, 'font-size': 32, fill: C.soft, 'font-weight': 700 });
      const cast = V.cast(S, { claudePos: [170, 880], claudeScale: 0.6, ferrisPos: [1800, 950], ferrisScale: 0.5 });
      return (t) => {
        shop.update(t);
        tag(t);
        const d1 = E[1] - L[1];
        const side = V.ep(t, L[2], L[2] + 0.6);
        grid.at(V.lerp(960, 560, side), 520, V.lerp(1, 0.8, side) * V.inn(t, L[0] + 0.2, 0.6));
        cells.forEach((b) => b.at(b.px, b.py, V.inn(t, L[1] + d1 * (b.row * 0.33) + b.col * 0.15)));
        const ex = 1370;
        expr.at(ex, 360, 1, 0, V.fin(t, L[2] + 0.4));
        const fly = V.ep(t, L[2] + 1.8, L[2] + 2.6, 'in');
        const p1 = [ex + segs[0].x, 260], p2 = [ex + segs[1].x, 260], target = [ex + segs[2].x, 260];
        m1.at(V.lerp(p1[0], target[0], fly), p1[1] - Math.sin(fly * Math.PI) * 50, V.inn(t, L[2] + 0.9), 0, fly < 1 ? 1 : 0);
        m2.at(V.lerp(p2[0], target[0], fly), p2[1] - Math.sin(fly * Math.PI) * 30, V.inn(t, L[2] + 1.3), 0, fly < 1 ? 1 : 0);
        res.at(target[0], 250, V.inn(t, L[2] + 2.6));
        V.set(segs[2].e, { fill: t > L[2] + 2.6 ? C.co : C.ink });
        eq.at(ex, 560, V.inn(t, L[2] + 2.9));
        cast.update(t, { ferris: { look: [-1, -0.5], mood: t > L[2] + 2.8 ? 'surprised' : 'neutral' }, claude: { look: [1, -0.5] } });
      };
    },
  });

  // ---------- 不动点 ----------
  V.defScene('c_fixpoint', {
    mood: 'tech',
    pauses: { 0: 1.6 },
    tail: 2.6,
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.3, 'type'], [L[0] + 1.6, 'rise'], [L[0] + 2.6, 'tick'], [L[0] + 3.6, 'tick'], [L[0] + 4.6, 'tick'], [L[1] + 0.6, 'lock'], [L[1] + 2.4, 'beep'], [L[1] + 2.6, 'error']];
    },
    build(S) {
      const { L } = S;
      const shop = V.Workshop(S.root, 7);
      const tag = V.sceneTag(S, '不动点 fixpoint', C.gold);
      const g = V.g(S.root);
      const code = V.Code(g, {
        title: 'list.rs', fs: 30,
        code: `struct List<'a, T, U> {
    head: &'a T,
    next: Option<Box<List<'a, T, U>>>,
}`,
      });
      const loop = V.Arrow(g, { color: C.gold, width: 7, head: 22 });
      // 迭代表
      const tab = V.A(g);
      const cols = [1320, 1460, 1600], names = ["'a", 'T', 'U'];
      const rows = [['初始', 'bi', 'bi', 'bi'], ['第 1 轮', 'co', 'co', 'bi'], ['第 2 轮', 'co', 'co', 'bi'], ['第 3 轮', 'co', 'co', 'bi']];
      V.el('rect', { x: 1050, y: 300, width: 660, height: 470, rx: 26, fill: '#fff', stroke: '#9AA8BC', 'stroke-width': 4 }, tab);
      names.forEach((n, i) => V.text(tab, n, { x: cols[i], y: 345, 'font-size': 34, 'font-family': V.MONO, 'font-weight': 800 }));
      const rowEls = rows.map((r, i) => {
        const rg = V.A(tab);
        const y = 430 + i * 90;
        V.text(rg, r[0], { x: 1080, y, 'font-size': 28, 'text-anchor': 'start', fill: C.soft, 'font-weight': 700 });
        [1, 2, 3].forEach((c) => V.Badge(rg, r[c], { r: 26 }).at(cols[c - 1], y));
        return rg;
      });
      const lockIcon = V.A(g);
      V.el('rect', { x: -26, y: -6, width: 52, height: 40, rx: 8, fill: C.gold }, lockIcon);
      V.el('path', { d: 'M-16 -6 V-18 A16 16 0 0 1 16 -18 V-6', stroke: C.gold, 'stroke-width': 7, fill: 'none' }, lockIcon);
      const stable = V.Pill(g, '结果不再变化 = 不动点', { fs: 30, fill: C.gold, color: C.ink });
      const uBox = V.el('rect', { x: cols[2] - 50, y: 380, width: 100, height: 380, rx: 18, fill: 'none', stroke: C.inv, 'stroke-width': 5 }, g);
      const err = V.ErrorPanel(g, [
        'error: type parameter `U` is only used recursively',
        '  = note: all type parameters must be used in a non-recursive way',
        '          in order to constrain their variance',
      ], { fs: 22 });
      const cast = V.cast(S, { claudePos: [170, 880], claudeScale: 0.6, ferrisPos: [1800, 950], ferrisScale: 0.5 });
      return (t) => {
        shop.update(t);
        tag(t);
        code.root.at(80, 300, 1, 0, V.fin(t, L[0] + 0.2));
        // 递归引用：从 List<'a, T, U> 指回 struct List
        const x0 = 80 + code.colX(2, 25), y0 = 300 + code.lineY(2) + 22, x1 = 80 + code.colX(0, 10), y1 = 300 + code.lineY(0) - 26;
        loop.set(x0, y0, x1, y1, V.ep(t, L[0] + 1.4, L[0] + 2.2), -0.55);
        V.op(loop, V.fin(t, L[0] + 1.4));
        tab.at(0, 0, 1, 0, V.fin(t, L[0] + 1.8));
        rowEls.forEach((r, i) => r.at(0, 0, 1, 0, V.fin(t, L[0] + 2.0 + i * 1.0, 0.3)));
        lockIcon.at(1740, 700, V.inn(t, L[1] + 0.5));
        stable.at(1380, 840, V.inn(t, L[1] + 0.6));
        V.op(uBox, V.fin(t, L[1] + 2.2) * (0.6 + 0.4 * Math.sin(t * 6)));
        err.at(80, 640, 1, 0, V.fin(t, L[1] + 2.5));
        cast.update(t, { ferris: { look: [-1, -0.5], mood: t > L[1] + 2.5 ? 'surprised' : 'neutral' }, claude: { look: [1, -0.5] } });
      };
    },
  });

  // ---------- 型变表的用途 ----------
  V.defScene('c_use', {
    mood: 'tech',
    pauses: { 0: 0.6, 1: 1.0, 2: 1.0 },
    tail: 2.4,
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.3, 'pop'], [L[0] + 1.6, 'gear'], [L[1] + 0.3, 'swish'], [L[1] + 1.2, 'swish'], [L[1] + 2.1, 'swish'], [L[1] + 3.0, 'swish'], [L[2] + 0.6, 'whoosh'], [L[2] + 1.8, 'shield'], [L[2] + 4.0, 'error'], [L[3] + 0.4, 'type'], [L[3] + 2.6, 'chime']];
    },
    build(S) {
      const { L } = S;
      const shop = V.Workshop(S.root, 8);
      const tag = V.sceneTag(S, '型变表的用途', C.claude);
      const g = V.g(S.root);
      // 型变表卡片
      const card = V.A(g);
      V.el('rect', { x: -330, y: -70, width: 660, height: 140, rx: 22, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, card);
      V.text(card, 'Demo', { x: -270, y: 0, 'font-size': 36, 'font-family': V.MONO, 'font-weight': 800, 'text-anchor': 'start' });
      [["'a", 'co'], ["'b", 'co'], ['T', 'inv'], ['U', 'inv']].forEach(([n, k], i) => {
        V.text(card, n, { x: -60 + i * 100, y: -30, 'font-size': 28, 'font-family': V.MONO, 'font-weight': 800 });
        V.Badge(card, k, { r: 22 }).at(-60 + i * 100, 22);
      });
      const cmp = V.A(g);
      V.text(cmp, "Demo<'x, 'y, A, B>   <:   Demo<'p, 'q, C, D>  ?", { 'font-size': 40, 'font-family': V.MONO, 'font-weight': 800, style: 'white-space:pre' });
      const lanes = [
        ['co', "'x: 'p", "（'x 活得比 'p 久）", "'a"],
        ['co', "'y: 'q", "（'y 活得比 'q 久）", "'b"],
        ['inv', 'A == C', '（必须完全相等）', 'T'],
        ['inv', 'B == D', '（必须完全相等）', 'U'],
      ].map(([k, req, note, p]) => {
        const l = V.A(g);
        V.el('rect', { x: -520, y: -42, width: 1040, height: 84, rx: 42, fill: '#fff', stroke: V.VAR[k].color, 'stroke-width': 4 }, l);
        V.text(l, p, { x: -470, 'font-size': 32, 'font-family': V.MONO, 'font-weight': 800 });
        V.Badge(l, k, { r: 24 }).at(-400, 0);
        V.text(l, req, { x: -330, 'font-size': 36, 'font-family': V.MONO, 'font-weight': 800, 'text-anchor': 'start', fill: V.VAR[k].color });
        V.text(l, note, { x: 0, 'font-size': 28, 'text-anchor': 'start', fill: C.soft });
        l.k = k;
        return l;
      });
      const contraNote = V.Pill(g, '若是逆变参数：方向反过来（\'p: \'x）', { fs: 28, fill: C.contra });
      // 借用检查器
      const shield = V.A(g);
      V.el('path', { d: 'M0 -150 L130 -105 Q130 60 0 150 Q-130 60 -130 -105Z', fill: '#2F6FDE', stroke: '#1C4BA3', 'stroke-width': 8 }, shield);
      V.text(shield, '借用', { y: -24, 'font-size': 44, fill: '#fff', 'font-weight': 900 });
      V.text(shield, '检查器', { y: 30, 'font-size': 44, fill: '#fff', 'font-weight': 900 });
      V.text(shield, 'NLL', { y: 84, 'font-size': 26, fill: '#BFD3FF', 'font-family': V.MONO });
      const envs = [0, 1].map((i) => V.Pill(g, i ? "'y: 'q" : "'x: 'p", { fs: 28, mono: true, fill: C.gold, color: C.ink }));
      const verdict = V.A(g);
      V.Check(verdict, { r: 30 }).at(-60, 0);
      V.Cross(verdict, { r: 30 }).at(60, 0);
      V.text(verdict, '解得出 → 通过；解不出 → 报错', { y: 66, 'font-size': 28, fill: C.soft, 'font-weight': 700 });
      // rustc_variance
      const bot = V.Rustc(g);
      const nightly = V.Code(g, {
        title: 'nightly', fs: 28,
        code: `#![feature(rustc_attrs)]

#[rustc_variance]
struct Demo<'a, 'b, T, U> { /* … */ }

// rustc: ['a: +, 'b: +, T: o, U: o]`,
      });
      const fmtNote = V.text(g, '内部调试属性，输出格式可能随版本变化', { 'font-size': 24, fill: C.soft });
      const cast = V.cast(S, { claudePos: [170, 880], claudeScale: 0.6, ferrisPos: [1800, 950], ferrisScale: 0.5 });

      return (t) => {
        shop.update(t);
        tag(t);
        const o12 = V.fout(t, L[2], 0.4);
        card.at(960, 180, V.inn(t, L[0] + 0.2), 0, V.fout(t, L[3], 0.4));
        cmp.at(960, 330, 1, 0, V.fin(t, L[0] + 1.4) * o12);
        lanes.forEach((l, i) => l.at(960, 450 + i * 100, V.inn(t, L[1] + 0.3 + i * 0.9), 0, o12));
        contraNote.at(960, 860, V.inn(t, L[1] + 3.6), 0, o12);
        // 打包送往借用检查器
        const o2 = V.fin(t, L[2] + 0.2) * V.fout(t, L[3], 0.4);
        shield.at(1220, 560, V.inn(t, L[2] + 1.6), 0, o2);
        envs.forEach((e, i) => {
          const k = V.ep(t, L[2] + 0.6 + i * 0.4, L[2] + 1.8 + i * 0.4, 'inOut');
          e.at(V.lerp(560, 1080, k), V.lerp(470 + i * 100, 560, k) - Math.sin(k * Math.PI) * 120, V.inn(t, L[2] + 0.3) * (1 - V.p(t, L[2] + 1.7 + i * 0.4, L[2] + 1.9 + i * 0.4)), 0, o2);
        });
        verdict.at(1220, 800, V.inn(t, L[2] + 3.6), 0, o2);
        // rustc 展示
        const o3 = V.fin(t, L[3]);
        bot.root.at(V.lerp(2100, 1560, V.ep(t, L[3] - 0.4, L[3] + 0.4, 'outBack')), 620, 0.75, 0, o3);
        bot.update(t, { talk: S.talk('rustc', t), mood: 'happy' });
        nightly.root.at(220, 260, 1, 0, o3);
        nightly.reveal(V.p(t, L[3] + 0.3, L[3] + 2.6), true);
        nightly.hl(5, V.fin(t, L[3] + 2.6), C.co);
        V.set(fmtNote, { x: 220 + nightly.w / 2, y: 260 + nightly.h + 40 });
        V.op(fmtNote, V.fin(t, L[3] + 3.0));
        cast.update(t, { ferris: { look: [-1, -0.5], mood: t > L[3] + 2.6 ? 'happy' : 'neutral' }, claude: { look: [1, -0.5] } });
      };
    },
  });
})();
