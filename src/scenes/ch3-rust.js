// 第三章：Rust 登场。没有继承 → 生命周期才是子类型关系。
(function () {
  const V = window.V, C = V.C;

  V.defScene('rust_noinherit', {
    pauses: { 0: 1.2 },
    tail: 1.8,
    sfx: (S) => {
      const { L } = S;
      return [[0.3, 'step'], [L[0] + 0.5, 'gear'], [L[0] + 0.9, 'pop'], [L[0] + 1.3, 'pop2'], [L[0] + 1.7, 'pop'], [L[0] + 2.1, 'pop2'], [L[0] + 3.3, 'boing'], [L[1] + 0.3, 'whoosh'], [L[1] + 2.4, 'scroll'], [L[1] + 3.2, 'sparkle'], [L[1] + 3.6, 'hum']];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 41 });
      const tag = V.sceneTag(S, 'Rust 登场', C.rust);
      const g = V.g(S.root);
      // 箱子
      const box = V.A(g);
      V.el('path', { d: 'M-190 -40 L190 -40 L170 150 L-170 150Z', fill: '#C8955B', stroke: '#8A6136', 'stroke-width': 6, 'stroke-linejoin': 'round' }, box);
      V.el('path', { d: 'M-190 -40 L-150 -100 L150 -100 L190 -40Z', fill: '#E0B07A', stroke: '#8A6136', 'stroke-width': 6, 'stroke-linejoin': 'round' }, box);
      V.text(box, '找找 class……', { y: 60, 'font-size': 38, fill: '#fff', 'font-weight': 800 });
      const items = ['struct', 'enum', 'trait', 'impl'].map((s) => V.Pill(g, s, { fs: 34, mono: true, fill: C.rust }));
      const none = V.Stamp(g, '没有 class，也没有继承', { color: C.inv, fs: 44 });
      // 幕布 + 光带
      const reveal = V.g(g);
      const bands = [
        [V.Band(reveal, { label: "'a", color: C.claude, h: 54, fs: 34 }), 520, 900],
        [V.Band(reveal, { label: "'b", color: C.contra, h: 54, fs: 34 }), 700, 560],
        [V.Band(reveal, { label: "'static", color: C.gold, h: 54, fs: 34 }), 380, 1160],
      ];
      const lifeTitle = V.A(reveal);
      V.text(lifeTitle, '生命周期  Lifetime', { 'font-size': 64, 'font-weight': 900 });
      const curtainL = V.el('path', { fill: '#B3261E' }, g), curtainR = V.el('path', { fill: '#B3261E' }, g);
      const valance = V.el('rect', { x: 0, y: 0, width: V.W, height: 70, fill: '#8E1B15' }, g);
      const cast = V.cast(S);

      return (t) => {
        bg.update(t);
        tag(t);
        const o0 = V.fout(t, L[1] + 0.2, 0.4);
        const shake = t > L[0] + 0.4 && t < L[0] + 2.4 ? Math.sin(t * 40) * 4 : 0;
        box.at(960, 480, V.inn(t, 0.3), shake, o0);
        items.forEach((it, i) => {
          const at = L[0] + 0.9 + i * 0.4;
          const k = V.ep(t, at, at + 0.7, 'out');
          const x = 960 + (i - 1.5) * 260 * k, y = 440 - Math.sin(k * Math.PI) * 260 - k * 40 + k * 0;
          it.at(x, y - k * 60, V.inn(t, at, 0.3), (i - 1.5) * 10 * k, o0);
        });
        V.stampAt(none, 960, 760, t, L[0] + 3.2, -6);
        V.op(none, V.p(t, L[0] + 3.2, L[0] + 3.3) * o0);

        // 幕布：先合上，再拉开
        const close = V.ep(t, L[1] + 0.1, L[1] + 0.6), open = V.ep(t, L[1] + 2.2, L[1] + 3.4);
        const cw = (V.W / 2 + 40) * close * (1 - open);
        const wav = (side) => {
          const x0 = side < 0 ? 0 : V.W, x1 = side < 0 ? cw : V.W - cw;
          let d = `M${x0} 0 L${x1} 0`;
          for (let y = 0; y <= V.H; y += 90) d += ` Q${x1 + side * -20 * Math.sin(y + t)} ${y + 45} ${x1} ${y + 90}`;
          return d + ` L${x0} ${V.H}Z`;
        };
        curtainL.setAttribute('d', wav(-1));
        curtainR.setAttribute('d', wav(1));
        V.op(curtainL, close > 0 && open < 1 ? 1 : 0);
        V.op(curtainR, close > 0 && open < 1 ? 1 : 0);
        V.op(valance, close > 0 ? 1 - open : 0);
        V.op(reveal, open > 0 ? 1 : 0);
        lifeTitle.at(960, 250, V.inn(t, L[1] + 3.0));
        bands.forEach(([b, x, w], i) => {
          b.at(x, 420 + i * 110, 1, 0, 1);
          b.grow(w * V.ep(t, L[1] + 3.0 + i * 0.25, L[1] + 4.2 + i * 0.25, 'out'));
        });

        const fx = V.lerp(1690, 1450, V.ep(t, 0, 0.8));
        cast.update(t, {
          ferris: { pos: [t < L[1] ? fx : 1690, 860], mood: t > L[0] + 3.2 && t < L[1] + 2 ? 'worried' : t > L[1] + 3 ? 'surprised' : 'neutral', look: [-1, -0.3], walk: t < 0.8 ? 1 : 0, raise: t > L[0] && t < L[0] + 2.5 ? 0.9 : 0, snap: t > L[0] && t < L[0] + 2.5 },
          claude: { mood: t > L[1] + 3 ? 'happy' : 'neutral', look: [1, -0.3], burst: t > L[1] + 3 && t < L[1] + 3.6 ? 0.4 : 0 },
        });
      };
    },
  });

  V.defScene('rust_lifetimes', {
    pauses: { 0: 0.6, 1: 1.0, 2: 1.0, 3: 0.6, 4: 0.6 },
    tail: 1.8,
    sfx: (S) => {
      const { L } = S;
      return [
        [L[0] + 0.3, 'whoosh'], [L[0] + 0.9, 'hum'],
        [L[1] + 0.3, 'whoosh'], [L[1] + 1.4, 'click'], [L[1] + 2.4, 'pop'],
        [L[2] + 0.4, 'pop'], [L[2] + 1.6, 'swish'], [L[2] + 2.4, 'lock'], [L[2] + 2.6, 'ok'],
        [L[3] + 0.3, 'rise'], [L[3] + 1.3, 'sparkle'],
        [L[4] + 0.4, 'pop'], [L[4] + 1.6, 'pop'], [L[4] + 2.8, 'ding'],
        [L[5] + 0.6, 'stamp'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 42 });
      const tag = V.sceneTag(S, "生命周期：'long <: 'short", C.gold);
      const g = V.g(S.root);
      const AX0 = 300, AX1 = 1640;
      // 时间轴
      const axis = V.A(g);
      V.el('line', { x1: AX0, y1: 0, x2: AX1, y2: 0, stroke: C.soft, 'stroke-width': 4 }, axis);
      V.el('path', { d: `M${AX1} -10 L${AX1 + 20} 0 L${AX1} 10Z`, fill: C.soft }, axis);
      V.text(axis, '程序运行的时间 →', { x: AX1 - 10, y: 34, 'font-size': 26, fill: C.soft, 'text-anchor': 'end' });
      V.text(axis, 'main 开始', { x: AX0, y: 34, 'font-size': 24, fill: C.soft });

      const bStatic = V.Band(g, { label: "'static", color: C.gold, h: 52, fs: 32 });
      const bLong = V.Band(g, { label: "'long", color: C.claude, h: 52, fs: 32 });
      const bShort = V.Band(g, { label: "'short", color: C.contra, h: 52, fs: 32 });
      const LONG = [420, 1100], SHORT = [720, 560];
      const guides = [V.el('line', { stroke: C.contra, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g), V.el('line', { stroke: C.contra, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g)];
      const refCard = V.Pill(g, '&T', { fs: 34, mono: true, fill: C.ink });
      const valid = V.Pill(g, '保证有效的区间', { fs: 26, fill: '#fff', color: C.claude, stroke: C.claude, sw: 3 });

      const outl = V.A(g);
      V.text(outl, "'long: 'short", { 'font-size': 56, 'font-family': V.MONO, 'font-weight': 800 });
      V.text(outl, '读作：long 比 short 活得久（outlives）', { y: 58, 'font-size': 28, fill: C.soft });
      const sub = V.A(g);
      V.text(sub, "&'long T  <:  &'short T", { 'font-size': 56, 'font-family': V.MONO, 'font-weight': 800, fill: C.co });
      const slot = V.A(g);
      V.el('rect', { x: -110, y: -36, width: 220, height: 72, rx: 36, fill: 'none', stroke: C.contra, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, slot);
      V.text(slot, "要 &'short", { y: -60, 'font-size': 26, fill: C.contra, 'font-weight': 700 });
      const mover = V.Pill(g, "&'long", { fs: 32, mono: true, fill: C.claude });
      const ok = V.Check(g, { r: 30 });
      const lit = V.A(g);
      V.text(lit, '"hello" 的类型就是 &\'static str', { 'font-size': 30, 'font-family': V.MONO, fill: '#8A5A00' });

      // Ferris 的类比
      const ana = V.A(g);
      V.el('rect', { x: -420, y: -110, width: 840, height: 220, rx: 26, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, ana);
      V.text(ana, 'Cat', { x: -230, y: -45, 'font-size': 46, 'font-family': V.MONO, 'font-weight': 800, fill: C.claude });
      V.text(ana, '<:', { x: 0, y: -45, 'font-size': 46, 'font-family': V.MONO, 'font-weight': 800 });
      V.text(ana, 'Animal', { x: 230, y: -45, 'font-size': 46, 'font-family': V.MONO, 'font-weight': 800, fill: C.soft });
      const row2 = V.g(ana);
      V.text(row2, "'long", { x: -230, y: 45, 'font-size': 46, 'font-family': V.MONO, 'font-weight': 800, fill: C.claude });
      V.text(row2, '<:', { x: 0, y: 45, 'font-size': 46, 'font-family': V.MONO, 'font-weight': 800 });
      V.text(row2, "'short", { x: 230, y: 45, 'font-size': 46, 'font-family': V.MONO, 'font-weight': 800, fill: C.contra });
      V.text(ana, '更具体 / 更长寿', { x: -230, y: 145, 'font-size': 26, fill: C.soft });
      V.text(ana, '更宽泛 / 更短命', { x: 230, y: 145, 'font-size': 26, fill: C.soft });
      const stamp = V.Stamp(g, 'Rust 的子类型 ≈ 生命周期', { color: C.rust, fs: 44 });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        const sum = V.ep(t, L[4], L[4] + 0.6);
        const top = 1 - sum;
        const Y0 = 560;
        axis.at(0, Y0, 1, 0, V.fin(t, 0.2) * top);
        bLong.at(LONG[0], 450, 1, 0, top);
        bLong.grow(LONG[1] * V.ep(t, L[0] + 0.3, L[0] + 1.6, 'out'));
        refCard.at(LONG[0] - 70, 450, V.inn(t, L[0] + 0.2), 0, top * V.fout(t, L[1], 0.3));
        valid.at(LONG[0] + LONG[1] / 2, 380, V.inn(t, L[0] + 1.5), 0, V.fout(t, L[1], 0.3) * top);

        bShort.at(SHORT[0], 520, 1, 0, V.fin(t, L[1] + 0.3) * top);
        bShort.grow(SHORT[1] * V.ep(t, L[1] + 0.3, L[1] + 1.2, 'out'));
        const gk = V.ep(t, L[1] + 1.2, L[1] + 1.8);
        V.set(guides[0], { x1: SHORT[0], x2: SHORT[0], y1: 520, y2: 520 - 70 * gk });
        V.set(guides[1], { x1: SHORT[0] + SHORT[1], x2: SHORT[0] + SHORT[1], y1: 520, y2: 520 - 70 * gk });
        guides.forEach((e) => V.op(e, gk * top));
        outl.at(960, 210, V.inn(t, L[1] + 2.2), 0, top * V.fout(t, L[2], 0.3));

        sub.at(960, 210, V.inn(t, L[2] + 0.3), 0, top);
        slot.at(1100, 690, V.inn(t, L[2] + 0.8), 0, top * V.fout(t, L[3], 0.3));
        const mv = V.ep(t, L[2] + 1.4, L[2] + 2.3, 'inOut');
        mover.at(V.lerp(560, 1100, mv), V.lerp(450, 690, mv) - Math.sin(mv * Math.PI) * 60, V.inn(t, L[2] + 1.2), 0, top * V.fout(t, L[3], 0.3));
        ok.at(1260, 690, V.inn(t, L[2] + 2.4), 0, top * V.fout(t, L[3], 0.3));

        bStatic.at(AX0, 330, 1, 0, V.fin(t, L[3] + 0.2) * top);
        bStatic.grow((AX1 - AX0) * V.ep(t, L[3] + 0.3, L[3] + 1.4, 'out'));
        lit.at(960, 680, 1, 0, V.fin(t, L[3] + 1.5) * top);
        if (t > L[3]) sub.at(960, V.lerp(210, 160, V.ep(t, L[3], L[3] + 0.5)), 1, 0, top);

        ana.at(960, 420, V.inn(t, L[4] + 0.3, 0.6));
        V.op(row2, V.fin(t, L[4] + 1.5));
        V.stampAt(stamp, 960, 720, t, L[5] + 0.5, -4);

        cast.update(t, {
          ferris: { mood: t > L[4] ? 'happy' : 'neutral', look: [-1, -0.5], snap: t > L[4] && t < L[4] + 2 },
          claude: { look: [1, -0.5], mood: t > L[5] ? 'happy' : 'neutral' },
        });
      };
    },
  });
})();
