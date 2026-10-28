// 第二章：发展。使用处型变（Java 通配符）、声明处型变（C#/Kotlin/Scala）、双变（TypeScript），四种态度。
(function () {
  const V = window.V, C = V.C;

  // 一条“型变关系”小图：下方 Cat → Animal，上方 F<Cat> ? F<Animal>
  function relation(parent, kind, w, fs) {
    const g = V.g(parent);
    const info = V.VAR[kind];
    w = w || 120;
    fs = fs || 30;
    const half = (s) => V.textW(s, fs, true) / 2 + 12;
    const T = (s, x, y, fill) => V.text(g, s, { x, y, 'font-size': fs, 'font-family': V.MONO, 'font-weight': 700, fill: fill || C.ink });
    T('Cat', -w, 70);
    T('Animal', w, 70);
    T('F<Cat>', -w, -40, info.color);
    T('F<Animal>', w, -40, info.color);
    const a0 = -w + half('F<Cat>'), a1 = w - half('F<Animal>');
    V.Arrow(g, { color: C.ink, width: 4, head: 14 }).set(-w + half('Cat'), 70, w - half('Animal'), 70);
    if (kind === 'co') V.Arrow(g, { color: info.color, width: 5, head: 16 }).set(a0, -40, a1, -40);
    if (kind === 'contra') V.Arrow(g, { color: info.color, width: 5, head: 16 }).set(a1, -40, a0, -40);
    if (kind === 'bi') {
      V.Arrow(g, { color: info.color, width: 5, head: 16 }).set(a0, -50, a1, -50);
      V.Arrow(g, { color: info.color, width: 5, head: 16 }).set(a1, -30, a0, -30);
    }
    if (kind === 'inv') {
      const m = (a0 + a1) / 2;
      V.el('path', { d: `M${a0} -40 H${m - 18} M${m + 18} -40 H${a1}`, stroke: info.color, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      V.el('path', { d: 'M-12 -52 L12 -28 M12 -52 L-12 -28', stroke: info.color, 'stroke-width': 6, 'stroke-linecap': 'round', transform: `translate(${m} 0)` }, g);
    }
    return g;
  }
  V.relation = relation;

  // ---------- 使用处与声明处 ----------
  V.defScene('dev_langs', {
    pauses: { 1: 0.6, 2: 0.8, 3: 0.8 },
    sfx: (S) => {
      const { L } = S;
      return [
        [L[0] + 0.2, 'scroll'], [L[0] + 1.6, 'tick'], [L[0] + 1.9, 'tick'], [L[0] + 2.2, 'tick'],
        [L[1] + 0.2, 'swish'], [L[1] + 1.5, 'pop'], [L[1] + 2.2, 'pop'], [L[1] + 3.0, 'error'],
        [L[2] + 0.5, 'click'], [L[2] + 1.6, 'rise'], [L[2] + 3.0, 'click'], [L[2] + 4.0, 'fall'],
        [L[3] + 0.2, 'swish'], [L[3] + 0.8, 'flip'], [L[3] + 1.6, 'flip'], [L[3] + 2.4, 'flip'],
        [L[4] + 0.3, 'snap'], [L[4] + 1.2, 'snap'], [L[4] + 2.0, 'ding'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 31 });
      const tag = V.sceneTag(S, '驯服型变', C.co);
      const g = V.g(S.root);

      // 时间轴
      const tl = V.A(g);
      const X0 = 260, X1 = 1660, Y = 150;
      const yx = (y) => X0 + ((y - 1995) / (2018 - 1995)) * (X1 - X0);
      const axis = V.el('line', { x1: X0, y1: Y, x2: X0, y2: Y, stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, tl);
      const events = [[1996, 'Java 数组'], [2004, 'Java 5 泛型'], [2004.6, 'Scala'], [2010, 'C# 4.0'], [2016, 'Kotlin 1.0']];
      const evs = events.map(([y, name], i) => {
        const e = V.A(tl);
        V.el('circle', { r: 11, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, e);
        V.text(e, String(Math.floor(y)), { y: -32, 'font-size': 24, fill: C.soft, 'font-family': V.MONO });
        V.text(e, name, { y: i % 2 ? 44 : 44, 'font-size': 26, 'font-weight': 700 });
        e.x = yx(y);
        return e;
      });
      evs[2].lastChild.setAttribute('y', 78);
      evs[2].children[1].setAttribute('opacity', 0);
      const marker = V.A(tl);
      V.el('path', { d: 'M0 -56 L14 -76 H-14Z', fill: C.claude }, marker);

      // Java 5：不变
      const inv = V.A(g);
      const pa = V.Pill(inv, 'List<Cat>', { fs: 44, mono: true, fill: C.claude });
      pa.at(-330, 0);
      const pb = V.Pill(inv, 'List<Animal>', { fs: 44, mono: true, fill: C.soft });
      pb.at(330, 0);
      const neq = V.text(inv, '≠', { 'font-size': 100, fill: C.inv, 'font-weight': 800 });
      const invBadge = V.Badge(inv, 'inv', { r: 40, label: true });
      invBadge.at(0, 120);

      // 通配符阀门
      function valve(label, readOk) {
        const v = V.A(g);
        V.el('rect', { x: -260, y: -80, width: 520, height: 160, rx: 28, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, v);
        V.text(v, label, { y: -10, 'font-size': 32, 'font-family': V.MONO, 'font-weight': 700 });
        V.text(v, readOk ? '只出不进' : '只进不出', { y: 40, 'font-size': 28, fill: readOk ? C.co : C.contra, 'font-weight': 700 });
        v.out = V.Arrow(v, { color: readOk ? C.co : '#bbb', width: 10, head: 26, dash: readOk ? null : '6 10' });
        v.inn = V.Arrow(v, { color: readOk ? '#bbb' : C.contra, width: 10, head: 26, dash: readOk ? '6 10' : null });
        v.x1 = V.Cross(v, { r: 24 });
        v.readOk = readOk;
        return v;
      }
      const vExt = valve('List<? extends Animal>', true), vSup = valve('List<? super Cat>', false);
      const ext = V.Pill(g, '读：拿到的一定是 Animal', { fs: 28, fill: C.co });
      const sup = V.Pill(g, '写：放进去 Cat 一定安全', { fs: 28, fill: C.contra });

      // 三种语言卡片
      const cards = [
        ['C#', 'IEnumerable<out T>', 'IComparer<in T>', '#7B5BD6'],
        ['Kotlin', 'interface List<out E>', 'Comparable<in T>', '#E0703A'],
        ['Scala', 'List[+A]', 'Function1[-T, +R]', '#DC322F'],
      ].map(([name, a, b, col]) => {
        const c = V.A(g);
        const face = V.g(c);
        V.el('rect', { x: -250, y: -150, width: 500, height: 300, rx: 26, fill: '#fff', stroke: col, 'stroke-width': 5 }, face);
        V.el('rect', { x: -250, y: -150, width: 500, height: 70, rx: 26, fill: col }, face);
        V.el('rect', { x: -250, y: -100, width: 500, height: 20, fill: col }, face);
        V.text(face, name, { y: -114, 'font-size': 36, fill: '#fff', 'font-weight': 800 });
        V.text(face, a, { y: -10, 'font-size': 30, 'font-family': V.MONO, fill: C.co, 'font-weight': 700 });
        V.text(face, b, { y: 70, 'font-size': 30, 'font-family': V.MONO, fill: C.contra, 'font-weight': 700 });
        c.face = face;
        return c;
      });
      const declNote = V.Pill(g, '声明处标注：一次写好，处处生效', { fs: 30, fill: C.ink });

      // Ferris 的 out / in 手势
      const outTag = V.Pill(g, 'out → 拿出来', { fs: 30, fill: C.co });
      const inTag = V.Pill(g, 'in ← 放进去', { fs: 30, fill: C.contra });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        // 时间轴
        const ax = V.ep(t, L[0] + 0.1, L[0] + 1.4, 'out');
        V.set(axis, { x2: V.lerp(X0, X1, ax) });
        tl.at(0, 0, 1, 0, 1);
        evs.forEach((e, i) => e.at(e.x, Y, V.inn(t, L[0] + 1.5 + i * 0.25)));
        const year = t < L[1] ? 1996 : t < L[3] ? 2004 : 2010 + V.ep(t, L[4], L[4] + 1) * 6;
        const my = V.lerp(1996, 2004, V.ep(t, L[1], L[1] + 0.8)) + (t > L[3] ? V.ep(t, L[3], L[3] + 0.8) * 6 : 0) + (t > L[4] ? V.ep(t, L[4], L[4] + 0.8) * 6 : 0);
        marker.at(yx(year > 2004 ? my : my), Y, 1, 0, V.fin(t, L[0] + 1.6));

        // 不变
        const o1 = V.fout(t, L[2], 0.4);
        inv.at(960, 450, 1, 0, V.fin(t, L[1] + 1.2) * o1);
        pa.at(V.lerp(-200, -330, V.ep(t, L[1] + 1.2, L[1] + 1.8)), 0, V.inn(t, L[1] + 1.2));
        pb.at(V.lerp(200, 330, V.ep(t, L[1] + 1.9, L[1] + 2.5)), 0, V.inn(t, L[1] + 1.9));
        V.set(neq, { opacity: V.fin(t, L[1] + 2.9) });
        invBadge.at(0, 140, V.inn(t, L[1] + 3.0));

        // 阀门
        const o2 = V.fout(t, L[3], 0.4);
        [[vExt, 380, L[2] + 0.4], [vSup, 610, L[2] + 2.9]].forEach(([v, y, at]) => {
          v.at(820, y, V.inn(t, at), 0, o2);
          const flow = V.ep(t, at + 1.0, at + 1.6);
          if (v.readOk) {
            v.out.set(265, 0, 360, 0, flow);
            v.inn.set(-380, 0, -270, 0, 1);
            v.x1.at(-330, 0, V.inn(t, at + 1.0));
          } else {
            v.inn.set(-380, 0, -270, 0, flow);
            v.out.set(270, 0, 360, 0, 1);
            v.x1.at(330, 0, V.inn(t, at + 1.0));
          }
        });
        ext.at(1390, 380, V.inn(t, L[2] + 1.6), 0, o2);
        sup.at(1390, 610, V.inn(t, L[2] + 4.0), 0, o2);

        // 卡片翻开
        cards.forEach((c, i) => {
          const at = L[3] + 0.7 + i * 0.8;
          const k = V.ep(t, at, at + 0.5);
          c.at(440 + i * 520, 480, 1, 0, V.fin(t, at - 0.1, 0.2));
          c.face.setAttribute('transform', `scale(${Math.max(0.01, Math.abs(Math.cos((1 - k) * Math.PI / 2)))} 1)`);
        });
        declNote.at(960, 700, V.inn(t, L[3] + 3.2));

        // Ferris
        outTag.at(1330, 740, V.inn(t, L[4] + 0.2), -4, V.fout(t, S.dur - 0.5));
        inTag.at(1330, 820, V.inn(t, L[4] + 1.1), 4, V.fout(t, S.dur - 0.5));
        cast.update(t, {
          ferris: { mood: t > L[4] ? 'happy' : 'neutral', snap: t > L[4] && t < L[4] + 2.5, raise: t > L[4] ? 0.6 : 0, look: [-1, -0.4] },
          claude: { look: [1, -0.4] },
        });
      };
    },
  });

  // ---------- 双变 ----------
  V.defScene('dev_bivariant', {
    pauses: { 0: 1.0 },
    tail: 2.6,
    sfx: (S) => {
      const { L, E } = S;
      return [[L[0] + 0.3, 'whoosh'], [L[0] + 1.2, 'ok'], [L[0] + 1.8, 'ok'], [L[1] + 0.2, 'type'], [L[1] + 1.2, 'type'], [L[1] + 2.4, 'type'], [L[1] + 3.6, 'ok'], [E[1] + 0.2, 'bug'], [E[1] + 1.0, 'error']];
    },
    build(S) {
      const { L, E } = S;
      const bg = V.Background(S.root, { seed: 32 });
      const tag = V.sceneTag(S, '双变 · bivariant', C.bi);
      const g = V.g(S.root);
      const big = V.A(g);
      const rel = relation(big, 'bi', 230);
      rel.setAttribute('transform', 'scale(1.6)');
      const badge = V.Badge(g, 'bi', { r: 50, label: true, labelFs: 32 });
      const oks = [V.Check(g, { r: 30 }), V.Check(g, { r: 30 })];

      const code = V.Code(g, {
        title: 'shelter.ts', fs: 28, revealed: false,
        code: `interface Shelter {
  adopt(a: Animal): void;     // 方法参数：双变
}
const cats: Shelter = {
  adopt(c: Cat) { c.meow(); } // ✓ 类型检查通过
};
cats.adopt(new Dog());        // 运行时：狗不会喵`,
      });
      const bug = V.A(g);
      V.el('ellipse', { rx: 22, ry: 16, fill: '#3A2A1A' }, bug);
      V.el('circle', { cx: 22, cy: 0, r: 10, fill: '#3A2A1A' }, bug);
      V.el('path', { d: 'M-10 -14 L-18 -28 M4 -16 L0 -30 M-10 14 L-18 28 M4 16 L0 30 M28 -6 L40 -16 M28 6 L40 16', stroke: '#3A2A1A', 'stroke-width': 4, 'stroke-linecap': 'round' }, bug);
      V.el('path', { d: 'M-22 0 H18', stroke: '#6B5A48', 'stroke-width': 2 }, bug);
      const sq = code.squiggle(6, 0, 21);

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        const up = V.ep(t, L[1], L[1] + 0.7);
        big.at(960, V.lerp(450, 260, up), V.lerp(1, 0.6, up) * V.inn(t, L[0] + 0.2, 0.6));
        badge.at(V.lerp(960, 1450, up), V.lerp(760, 240, up), V.inn(t, L[0] + 0.6) * V.lerp(1, 0.8, up));
        oks[0].at(960 + 380 * (1 - up * 0.4), V.lerp(355, 200, up), V.inn(t, L[0] + 1.2) * (1 - up * 0.4));
        oks[1].at(960 + 380 * (1 - up * 0.4), V.lerp(430, 245, up), V.inn(t, L[0] + 1.8) * (1 - up * 0.4));
        code.root.at(960 - code.w / 2, 380, 1, 0, V.fin(t, L[1] + 0.1));
        code.reveal(V.p(t, L[1] + 0.2, L[1] + 3.4), true);
        code.hl(4, V.win(t, L[1] + 3.5, S.dur, 0.3), C.co);
        code.hl(6, V.fin(t, E[1] + 0.9), C.inv);
        V.op(sq, V.fin(t, E[1] + 0.9));
        const bk = V.ep(t, E[1] + 0.1, E[1] + 1.4, 'inOut');
        const bx = code.colX(6, 0) + bk * (code.colX(6, 21) - code.colX(6, 0));
        bug.at(960 - code.w / 2 + bx, 380 + code.lineY(6) + 34, 0.9, Math.sin(t * 20) * 8, V.fin(t, E[1]));
        cast.update(t, {
          ferris: { mood: t > E[1] + 0.8 ? 'worried' : 'neutral', look: [-1, -0.2] },
          claude: { look: [1, -0.3] },
        });
      };
    },
  });

  // ---------- 四种态度 ----------
  V.defScene('dev_summary', {
    pauses: { 0: 0.4 },
    tail: 2.4,
    sfx: (S) => {
      const { L, E } = S, d = E[1] - L[1];
      return [[L[0] + 0.3, 'pop'], [L[0] + 0.5, 'pop'], [L[0] + 0.7, 'pop'], [L[0] + 0.9, 'pop'], ...[0, 1, 2, 3].map((i) => [L[1] + d * (0.02 + i * 0.25), 'flip']), [E[1] + 0.3, 'scale4']];
    },
    build(S) {
      const { L, E } = S;
      const bg = V.Background(S.root, { seed: 33 });
      const tag = V.sceneTag(S, '型变的四种态度', C.claude);
      const g = V.g(S.root);
      const head = V.A(g);
      V.text(head, '外层类型  F<_>  怎样对待  Cat <: Animal ？', { 'font-size': 46, 'font-weight': 800 });
      const kinds = ['co', 'contra', 'inv', 'bi'];
      const words = ['方向保持', '方向翻转', '互不相认', '来者不拒'];
      const cards = kinds.map((k, i) => {
        const c = V.A(g);
        const info = V.VAR[k];
        const back = V.g(c);
        V.el('rect', { x: -190, y: -230, width: 380, height: 460, rx: 30, fill: info.color }, back);
        V.text(back, '?', { 'font-size': 160, fill: '#fff', 'font-weight': 900, opacity: 0.7 });
        const face = V.g(c);
        V.el('rect', { x: -190, y: -230, width: 380, height: 460, rx: 30, fill: '#fff', stroke: info.color, 'stroke-width': 6 }, face);
        const b = V.Badge(face, k, { r: 44 });
        b.at(0, -150);
        V.text(face, info.name, { y: -60, 'font-size': 52, 'font-weight': 900, fill: info.color });
        V.text(face, info.en, { y: -12, 'font-size': 24, fill: C.soft, 'font-family': V.MONO });
        const r = relation(face, k, 105, 26);
        r.setAttribute('transform', 'translate(0 90)');
        V.text(face, words[i], { y: 200, 'font-size': 34, 'font-weight': 800, fill: C.ink });
        c.back = back;
        c.face = face;
        return c;
      });
      const cast = V.cast(S, { claudePos: [140, 880], ferrisPos: [1790, 920], claudeScale: 0.6, ferrisScale: 0.55 });
      return (t) => {
        bg.update(t);
        tag(t);
        head.at(960, 150, 1, 0, V.fin(t, L[0] + 0.1));
        const d = E[1] - L[1];
        cards.forEach((c, i) => {
          c.at(960 + (i - 1.5) * 420, 560 + Math.sin(t * 1.5 + i) * 5, V.inn(t, L[0] + 0.3 + i * 0.2));
          const at = L[1] + d * (0.02 + i * 0.25);
          const k = V.ep(t, at, at + 0.5);
          const sx = Math.abs(Math.cos(k * Math.PI));
          c.back.setAttribute('transform', `scale(${Math.max(0.01, sx)} 1)`);
          c.face.setAttribute('transform', `scale(${Math.max(0.01, sx)} 1)`);
          V.op(c.back, k < 0.5 ? 1 : 0);
          V.op(c.face, k >= 0.5 ? 1 : 0);
        });
        cast.update(t, { ferris: { mood: t > E[1] ? 'happy' : 'neutral', look: [-1, -0.5] }, claude: { look: [1, -0.5] } });
      };
    },
  });
})();
