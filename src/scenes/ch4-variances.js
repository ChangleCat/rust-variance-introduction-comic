// 第四章：Rust 的四种型变，以及它们在代码里的样子。
(function () {
  const V = window.V, C = V.C;

  // 类型表达式标题：parts = [[文本, 型变种类或 null], ...]，带型变的部分上方弹出徽章
  V.typeHeader = function (parent, parts, fs) {
    fs = fs || 72;
    const root = V.A(parent);
    const total = parts.reduce((a, [s]) => a + V.textW(s, fs, true), 0);
    let x = -total / 2;
    root.badges = [];
    parts.forEach(([s, kind]) => {
      const w = V.textW(s, fs, true);
      const info = kind ? V.VAR[kind] : null;
      V.text(root, s, { x: x + w / 2, 'font-size': fs, 'font-family': V.MONO, 'font-weight': 800, fill: info ? info.color : C.ink, style: 'white-space:pre' });
      if (kind) {
        const b = V.Badge(root, kind, { r: fs * 0.32 });
        b.bx = x + w / 2;
        b.by = -fs * 1.05;
        root.badges.push(b);
      }
      x += w;
    });
    root.show = function (t, at, gap) {
      root.badges.forEach((b, i) => b.at(b.bx, b.by, V.inn(t, at + i * (gap || 0.5))));
    };
    return root;
  };

  // 编译器报错面板
  V.ErrorPanel = function (parent, lines, o) {
    o = o || {};
    const fs = o.fs || 24, lh = fs * 1.5;
    const w = o.w || Math.max(...lines.map((l) => V.textW(l, fs, true))) + 60, h = lines.length * lh + 40;
    const root = V.A(parent);
    V.el('rect', { x: 6, y: 10, width: w, height: h, rx: 18, fill: '#000', opacity: 0.15 }, root);
    V.el('rect', { width: w, height: h, rx: 18, fill: '#1B1418', stroke: o.color || C.inv, 'stroke-width': 4 }, root);
    lines.forEach((l, i) => {
      const isHead = i === 0, isNote = /^\s*(=|help|note)/.test(l), isCaret = /\^/.test(l);
      V.text(root, l, { x: 30, y: 20 + lh * i + lh / 2, 'text-anchor': 'start', 'font-size': fs, 'font-family': V.MONO, fill: isHead ? (o.headColor || '#FF6B6B') : isCaret ? '#FF6B6B' : isNote ? '#89DCEB' : '#E8E3F3', 'font-weight': isHead ? 700 : 400, style: 'white-space:pre' });
    });
    root.w = w;
    root.h = h;
    return root;
  };

  // 小幽灵（未使用的类型参数）
  V.Ghost = function (parent, o) {
    o = o || {};
    const root = V.A(parent);
    const col = o.color || C.bi;
    const body = V.el('path', { fill: col, opacity: 0.85 }, root);
    V.el('ellipse', { cx: -14, cy: -12, rx: 7, ry: 10, fill: '#fff' }, root);
    V.el('ellipse', { cx: 14, cy: -12, rx: 7, ry: 10, fill: '#fff' }, root);
    V.el('circle', { cx: -12, cy: -10, r: 4, fill: '#2B2522' }, root);
    V.el('circle', { cx: 16, cy: -10, r: 4, fill: '#2B2522' }, root);
    if (o.label) V.text(root, o.label, { y: 22, 'font-size': 30, 'font-family': V.MONO, 'font-weight': 800, fill: '#fff' });
    root.update = function (t) {
      let d = 'M-46 50 L-46 -10 C-46 -70 46 -70 46 -10 L46 50';
      for (let i = 0; i < 4; i++) {
        const x0 = 46 - i * 23, w = Math.sin(t * 6 + i) * 6;
        d += ` Q${x0 - 11} ${62 + w} ${x0 - 23} ${50}`;
      }
      body.setAttribute('d', d + 'Z');
    };
    return root;
  };

  // 罐子（PhantomData）
  function jar(parent, label, kind) {
    const root = V.A(parent);
    const info = V.VAR[kind];
    V.el('rect', { x: -120, y: -150, width: 240, height: 300, rx: 40, fill: 'rgba(200,230,255,0.35)', stroke: '#8FB3C9', 'stroke-width': 6 }, root);
    V.el('rect', { x: -90, y: -185, width: 180, height: 44, rx: 12, fill: '#B88A5A' }, root);
    root.ghost = V.Ghost(root, { color: info.color, label: 'T' });
    V.el('path', { d: 'M-90 -110 Q-100 0 -90 110', stroke: '#fff', 'stroke-width': 8, fill: 'none', opacity: 0.6, 'stroke-linecap': 'round' }, root);
    const p = V.Pill(root, label, { fs: 26, mono: true, fill: '#fff', color: C.ink, stroke: C.ink, sw: 3 });
    p.at(0, 200);
    const b = V.Badge(root, kind, { r: 30 });
    b.at(110, -150);
    root.badge = b;
    return root;
  }

  // ======================= 协变 =======================
  V.defScene('v_covariant', {
    pauses: { 0: 0.8, 1: 1.2, 2: 1.0 },
    sfx: (S) => {
      const { L } = S;
      return [
        [L[0] + 0.2, 'whoosh'], [L[0] + 1.6, 'pop'], [L[0] + 2.1, 'pop2'],
        [L[1] + 0.3, 'type'], [L[1] + 1.1, 'type'], [L[1] + 1.9, 'type'], [L[1] + 3.4, 'swish'], [L[1] + 4.2, 'lock'], [L[1] + 4.4, 'ok'],
        [L[2] + 0.4, 'pop'], [L[2] + 1.0, 'pop'], [L[2] + 1.6, 'pop'], [L[2] + 3.0, 'sparkle'], [L[2] + 4.2, 'pop2'], [L[2] + 4.5, 'pop2'], [L[2] + 4.8, 'pop2'],
        [L[3] + 0.4, 'ding'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 51, blobs: [C.co, C.claude] });
      const tag = V.sceneTag(S, '第一种 · 协变', C.co);
      const g = V.g(S.root);
      const head = V.typeHeader(g, [['&', null], ["'a", 'co'], [' ', null], ['T', 'co']], 84);
      const title = V.Pill(g, '协变 covariant', { fs: 32, fill: C.co });
      const code = V.Code(g, {
        title: 'covariant.rs', fs: 28, revealed: false,
        code: `fn print_it<'a>(s: &'a str) {
    println!("{s}");
}

let hello: &'static str = "hello";
print_it(hello); // ✓ 'static 缩成 'a`,
      });
      // 右侧：插槽动画
      const slot = V.A(g);
      V.el('rect', { x: -150, y: -50, width: 300, height: 100, rx: 50, fill: 'rgba(34,160,107,0.08)', stroke: C.co, 'stroke-width': 4, 'stroke-dasharray': '12 8' }, slot);
      V.text(slot, "需要 &'a str", { y: -80, 'font-size': 30, fill: C.co, 'font-weight': 700 });
      const card = V.Pill(g, "&'static str", { fs: 34, mono: true, fill: C.gold, color: C.ink });
      const ok = V.Check(g, { r: 34 });
      // Vec 箱子
      const crate = V.A(g);
      V.el('rect', { x: -230, y: -110, width: 460, height: 220, rx: 22, fill: '#E7C79A', stroke: '#9A6B3A', 'stroke-width': 6 }, crate);
      V.el('path', { d: 'M-230 -40 H230 M-230 40 H230', stroke: '#9A6B3A', 'stroke-width': 3, opacity: 0.4 }, crate);
      const cards = [0, 1, 2].map(() => V.el('rect', { width: 120, height: 70, rx: 14, fill: C.gold, stroke: C.ink, 'stroke-width': 2 }, crate));
      const crateLabel = V.el('text', { y: 160, 'font-size': 36, 'font-family': V.MONO, 'font-weight': 800, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, crate);
      const chips = ['Box<T>', 'Vec<T>', 'Option<T>'].map((s) => {
        const c = V.A(g);
        V.Pill(c, s, { fs: 30, mono: true, fill: '#fff', color: C.ink, stroke: C.co, sw: 3 });
        V.Badge(c, 'co', { r: 20 }).at(V.textW(s, 30, true) / 2 + 36, -22);
        return c;
      });
      const ro = V.Stamp(g, '只读 → 安全', { color: C.co, fs: 40 });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        const up = V.ep(t, L[1], L[1] + 0.6);
        head.at(960, V.lerp(400, 150, up), V.lerp(1.4, 0.8, up) * V.inn(t, L[0] + 0.2, 0.6));
        head.show(t, L[0] + 1.5);
        title.at(960, V.lerp(560, 240, up), V.inn(t, L[0] + 0.9) * V.lerp(1, 0.85, up), 0, 1);
        code.root.at(110, 300, 1, 0, V.fin(t, L[1] + 0.1));
        code.reveal(V.p(t, L[1] + 0.2, L[1] + 2.6), true);
        code.hl(5, V.win(t, L[1] + 2.8, L[2], 0.3), C.co);

        const o1 = V.fout(t, L[2], 0.4);
        slot.at(1400, 420, V.inn(t, L[1] + 2.6), 0, o1);
        const mv = V.ep(t, L[1] + 3.3, L[1] + 4.2, 'inOut');
        card.at(V.lerp(1400, 1400, mv), V.lerp(640, 420, mv), V.inn(t, L[1] + 2.9) * V.lerp(1, 0.92, mv), 0, o1);
        ok.at(1600, 330, V.inn(t, L[1] + 4.3), 0, o1);

        const ck = V.inn(t, L[2] + 0.2, 0.5);
        crate.at(1400, 470, ck, 0, 1);
        cards.forEach((c, i) => {
          const k = V.ep(t, L[2] + 0.4 + i * 0.6, L[2] + 0.8 + i * 0.6, 'outBounce');
          V.set(c, { x: -200 + i * 140, y: V.lerp(-260, -35, k), fill: V.mix(C.gold, C.claude, V.ep(t, L[2] + 2.8, L[2] + 3.4)) });
          V.op(c, k > 0 ? 1 : 0);
        });
        const shrunk = t > L[2] + 3.0;
        crateLabel.textContent = shrunk ? "Vec<&'a str>" : "Vec<&'static str>";
        V.set(crateLabel, { fill: shrunk ? C.co : C.ink });
        chips.forEach((c, i) => c.at(1400 + (i - 1) * 270, 760, V.inn(t, L[2] + 4.2 + i * 0.3)));
        V.stampAt(ro, 1400, 270, t, L[3] + 0.3, -6);

        cast.update(t, {
          ferris: { mood: t > L[3] ? 'happy' : 'neutral', look: [-1, -0.4] },
          claude: { look: [1, -0.4], mood: t > L[1] + 4.3 && t < L[2] ? 'happy' : 'neutral' },
        });
      };
    },
  });

  // ======================= 不变 =======================
  V.defScene('v_invariant', {
    mood: 'tense',
    pauses: { 0: 0.6, 1: 0.6, 2: 1.0, 3: 1.6, 4: 1.4, 5: 1.0, 6: 0.8 },
    tail: 1.6,
    sfx: (S) => {
      const { L } = S;
      return [
        [L[0] + 0.2, 'whoosh'], [L[0] + 1.4, 'pop'], [L[0] + 1.9, 'stamp'],
        [L[1] + 0.2, 'type'], [L[1] + 1.0, 'type'], [L[1] + 1.8, 'type'], [L[1] + 2.6, 'type'],
        [L[2] + 0.2, 'alarm'], [L[2] + 2.4, 'swish'],
        [L[3] + 0.6, 'whoosh'], [L[3] + 1.6, 'lock'],
        [L[4] + 0.4, 'hum'], [L[4] + 1.0, 'crack'], [L[4] + 1.2, 'boom'],
        [L[5] + 0.2, 'rewind'], [L[5] + 3.2, 'shield'],
        [L[6] - 0.3, 'beep'], [L[6] + 0.1, 'error'],
        [L[7] + 0.4, 'pop'], [L[7] + 0.9, 'pop'], [L[7] + 1.4, 'pop'], [L[7] + 1.9, 'pop'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 52, blobs: [C.inv, C.claude] });
      const tag = V.sceneTag(S, '第二种 · 不变', C.inv);
      const g = V.g(S.root);
      const head = V.typeHeader(g, [['&', null], ["'a", 'co'], [' mut ', null], ['T', 'inv']], 84);
      const code = V.Code(g, {
        title: 'invariant.rs', fs: 25, revealed: false,
        code: `fn assign<T>(input: &mut T, val: T) {
    *input = val;
}

fn main() {
    let mut hello: &'static str = "hello";
    {
        let world = String::from("world");
        assign(&mut hello, &world);
    }
    println!("{hello}");
}`,
      });
      const sq = code.squiggle(8, 27, 33);
      const boxWorld = code.box(8, 27, 33, C.gold);

      // 内存视图
      const mem = V.A(g);
      const MX = 1290;
      V.text(mem, '内存里发生了什么', { x: MX, y: 230, 'font-size': 30, fill: C.soft, 'font-weight': 700 });
      const helloBox = V.A(mem);
      V.el('rect', { x: -170, y: -60, width: 340, height: 120, rx: 18, fill: '#FFF8E8', stroke: C.gold, 'stroke-width': 6 }, helloBox);
      V.text(helloBox, 'hello', { x: -150, y: -30, 'text-anchor': 'start', 'font-size': 30, 'font-family': V.MONO, 'font-weight': 800 });
      const helloType = V.text(helloBox, "&'static str", { x: -150, y: 20, 'text-anchor': 'start', 'font-size': 26, 'font-family': V.MONO, fill: '#8A5A00' });
      V.text(helloBox, '∞ 永生', { x: 160, y: -30, 'text-anchor': 'end', 'font-size': 24, fill: '#8A5A00', 'font-weight': 700 });
      helloBox.at(MX - 160, 330);
      const strStatic = V.Box(mem, { w: 190, h: 80, text: '"hello"', mono: true, fs: 28, fill: '#FFF2CC', stroke: C.gold });
      strStatic.at(MX + 250, 330);
      const scope = V.A(mem);
      const scopeRect = V.el('rect', { x: -330, y: -110, width: 660, height: 220, rx: 24, fill: 'rgba(59,130,246,0.06)', stroke: C.contra, 'stroke-width': 4, 'stroke-dasharray': '14 10' }, scope);
      V.text(scope, '内层作用域 { … }', { x: -310, y: -82, 'text-anchor': 'start', 'font-size': 24, fill: C.contra, 'font-weight': 700 });
      scope.at(MX, 610);
      const worldBox = V.Box(mem, { w: 220, h: 90, text: 'world: String', mono: true, fs: 26, fill: '#EAF2FF', stroke: C.contra });
      worldBox.at(MX - 140, 630);
      const worldData = V.Box(mem, { w: 170, h: 80, text: '"world"', mono: true, fs: 28, fill: '#EAF2FF', stroke: C.contra });
      worldData.at(MX + 190, 630);
      const ruin = V.A(mem);
      V.el('rect', { x: -85, y: -40, width: 170, height: 80, rx: 14, fill: '#D5D0CA', stroke: '#8C857E', 'stroke-width': 4, 'stroke-dasharray': '6 6' }, ruin);
      V.el('path', { d: 'M-60 -30 L-20 0 L-40 30 M20 -36 L0 0 L40 20 M60 -20 L30 10', stroke: '#8C857E', 'stroke-width': 3, fill: 'none' }, ruin);
      V.text(ruin, '已释放', { 'font-size': 26, fill: '#6B645E', 'font-weight': 800 });
      ruin.at(MX + 190, 630);
      const shards = V.Burst(mem, { n: 24, seed: 4, shape: 'shard', colors: [C.contra, '#EAF2FF', C.ink], spread: 260 });
      const ptr = V.Arrow(mem, { color: C.ink, width: 6, head: 20 });
      const ptrCard = V.Pill(mem, '&world', { fs: 28, mono: true, fill: C.contra });
      const banner = V.A(mem);
      V.el('rect', { x: -380, y: -38, width: 760, height: 76, rx: 16, fill: '#FFF4CC', stroke: C.gold, 'stroke-width': 4 }, banner);
      V.text(banner, '⚠ 假设：&mut T 对 T 是协变的', { 'font-size': 32, 'font-weight': 800, fill: '#8A5A00' });
      const typeMorph = V.A(mem);
      const tmA = V.text(typeMorph, "&mut &'static str", { 'font-size': 32, 'font-family': V.MONO, 'font-weight': 800, fill: '#8A5A00' });
      const tmB = V.text(typeMorph, "&mut &'world str", { 'font-size': 32, 'font-family': V.MONO, 'font-weight': 800, fill: C.contra });
      const tmArrow = V.text(typeMorph, '当作 ↓', { y: 42, 'font-size': 24, fill: C.soft });
      const dangling = V.Stamp(mem, '悬垂引用！', { color: C.inv, fs: 40 });

      // 回忆：Java 对比
      const cmp = V.A(g);
      const mkCard = (x, title, sub, color) => {
        const c = V.g(cmp, { transform: `translate(${x} 0)` });
        V.el('rect', { x: -230, y: -150, width: 460, height: 300, rx: 24, fill: '#fff', stroke: color, 'stroke-width': 6 }, c);
        V.text(c, title, { y: -100, 'font-size': 34, 'font-weight': 900, fill: color });
        V.text(c, sub, { y: 110, 'font-size': 26, fill: C.soft, 'font-weight': 700 });
        return c;
      };
      const javaCard = mkCard(-250, 'Java 数组', '运行时才抛异常', C.soft);
      const rustCard = mkCard(250, 'Rust &mut', '编译期直接拒绝', C.rust);
      const jCage = V.Cage(javaCard, { w: 150, h: 130, bars: 6 });
      jCage.at(-40, 10, 1);
      const jDog = V.Dog(javaCard);
      jDog.root.at(110, 30, 0.7);
      V.Cross(javaCard, { r: 26 }).at(110, -40);
      const shield = V.A(rustCard);
      V.el('path', { d: 'M0 -80 L70 -55 Q70 30 0 80 Q-70 30 -70 -55Z', fill: C.rust, stroke: C.rustDark, 'stroke-width': 6 }, shield);
      V.el('path', { d: 'M-28 0 L-6 24 L32 -22', stroke: '#fff', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, shield);
      shield.at(0, 10, 0.95);

      // rustc 报错
      const bot = V.Rustc(g);
      const err = V.ErrorPanel(g, [
        'error[E0597]: `world` does not live long enough',
        '  |     let world = String::from("world");',
        '  |         ----- binding `world` declared here',
        '  |     assign(&mut hello, &world);',
        '  |                        ^^^^^^ borrowed value does not live long enough',
        '  | }',
        '  | - `world` dropped here while still borrowed',
      ], { fs: 21 });

      const chips = ['Cell<T>', 'RefCell<T>', 'UnsafeCell<T>', '*mut T'].map((s) => {
        const c = V.A(g);
        V.Pill(c, s, { fs: 30, mono: true, fill: '#fff', color: C.ink, stroke: C.inv, sw: 3 });
        V.Badge(c, 'inv', { r: 20 }).at(V.textW(s, 30, true) / 2 + 36, -22);
        return c;
      });

      const cast = V.cast(S, { claudePos: [1810, 170], claudeScale: 0.55, ferrisPos: [1730, 910], ferrisScale: 0.6 });
      return (t) => {
        bg.update(t);
        tag(t);
        // 标题：先居中，后缩到右上
        const up = V.ep(t, L[1], L[1] + 0.6);
        head.at(V.lerp(960, 1290, up), V.lerp(420, 130, up), V.lerp(1.4, 0.7, up) * V.inn(t, L[0] + 0.2, 0.6));
        head.show(t, L[0] + 1.3);
        // 代码
        const endFade = V.fout(t, L[7] - 0.2, 0.5);
        code.root.at(60, 170, 1, 0, V.fin(t, L[1] + 0.1) * (0.35 + 0.65 * endFade));
        code.reveal(V.p(t, L[1] + 0.2, L[1] + 3.4), true);
        code.hl(0, V.win(t, L[1] + 3.0, L[2], 0.3), C.gold);
        code.hl(1, V.win(t, L[1] + 3.0, L[2], 0.3), C.gold);
        code.hl(8, V.win(t, L[2] + 0.1, L[4], 0.3), C.contra);
        code.hl(9, V.win(t, L[4], L[5], 0.3), C.inv);
        code.hl(10, V.win(t, L[4] + 0.8, L[5], 0.3), C.inv);
        V.op(boxWorld, V.win(t, L[3], L[4], 0.3));
        V.op(sq, V.fin(t, L[6]) * endFade);

        // 内存视图
        const memIn = V.fin(t, L[1] + 3.2, 0.5);
        mem.at(0, 0, 1, 0, memIn * V.fout(t, L[5] + 0.2, 0.4) + V.fin(t, L[5] + 3.4, 0.4) * V.fout(t, L[6] - 0.4, 0.4));
        banner.at(MX, 210 + 20, V.inn(t, L[2] + 0.2), 0, V.fout(t, L[5], 0.3));
        typeMorph.at(MX - 160, 460, 1, 0, V.fin(t, L[2] + 1.2) * V.fout(t, L[3] + 0.4, 0.3));
        const morph = V.ep(t, L[2] + 2.2, L[2] + 2.9);
        V.op(tmA, 1 - morph);
        V.op(tmB, morph);
        V.op(tmArrow, 0);
        V.set(helloType, { text: t > L[2] + 2.6 && t < L[5] + 0.6 ? "&'world str ?!" : "&'static str" });

        // 指针：hello → "hello"；被改写后 → "world"
        const rewound = t > L[5] + 0.6;
        const fly = rewound ? 0 : V.ep(t, L[3] + 0.6, L[3] + 1.6, 'inOut');
        const died = rewound ? 0 : V.p(t, L[4] + 1.0, L[4] + 1.15);
        ptrCard.at(V.lerp(MX + 190, MX - 160, fly), V.lerp(560, 330, fly) - Math.sin(fly * Math.PI) * 80, V.inn(t, L[3] + 0.3) * (1 - V.p(t, L[3] + 1.6, L[3] + 1.8)), 0, rewound ? 0 : 1);
        if (fly < 1) ptr.set(MX + 10, 330, MX + 150, 330, 1, 0, C.ink);
        else ptr.set(MX + 10, 345, MX + 160, 600, 1, -0.15, died ? C.inv : C.contra);
        // 作用域结束
        const scopeK = rewound ? 0 : V.p(t, L[4] + 0.2, L[4] + 1.0);
        V.set(scopeRect, { stroke: scopeK > 0 ? C.inv : C.contra });
        scope.at(MX, 610, 1, 0, 1 - died * 0.7);
        worldBox.at(MX - 140, 630, 1, died ? 0 : Math.sin(scopeK * 60) * 4 * scopeK, 1 - died);
        worldData.at(MX + 190, 630, 1, died ? 0 : Math.sin(scopeK * 60) * 4 * scopeK, 1 - died);
        ruin.at(MX + 190, 630, 1, 0, died);
        shards.at(MX + 100, 630);
        shards.update(rewound ? 0 : V.p(t, L[4] + 1.0, L[4] + 2.2));
        V.stampAt(dangling, MX + 120, 470, t, L[4] + 1.4, -6);
        V.op(dangling, rewound ? 0 : V.p(t, L[4] + 1.4, L[4] + 1.5));

        // 对比卡片
        cmp.at(MX, 500, V.inn(t, L[5] + 0.4, 0.6), 0, V.fout(t, L[5] + 3.2, 0.4));
        jCage.at(-40, 10, 1);
        jDog.update(t);
        // 重新出现的内存视图上：护盾挡住 &world
        // （第 5 句后段）
        // rustc
        const botIn = V.ep(t, L[6] - 0.5, L[6] + 0.2, 'outBack');
        bot.root.at(V.lerp(2150, 1600, botIn), 640, 0.6, 0, V.fout(t, L[7] - 0.2, 0.4));
        bot.update(t, { mood: 'error', talk: S.talk('rustc', t) });
        err.at(V.lerp(1650, 820, botIn) , 300, 1, 0, V.fin(t, L[6]) * V.fout(t, L[7] - 0.2, 0.4));

        chips.forEach((c, i) => c.at(1290 + ((i % 2) - 0.5) * 420, 420 + Math.floor(i / 2) * 140, V.inn(t, L[7] + 0.4 + i * 0.5)));

        const scared = t > L[4] + 0.8 && t < L[5] + 0.6;
        cast.update(t, {
          ferris: { mood: scared ? 'scared' : t > L[2] && t < L[5] ? 'worried' : t > L[5] + 3 ? 'happy' : 'neutral', look: [-1, -0.6] },
          claude: { look: [-1, 0.3], mood: t > L[2] && t < L[5] ? 'think' : 'neutral' },
        });
      };
    },
  });

  // ======================= 逆变 =======================
  function funnel(parent, label, wide) {
    const m = V.A(parent);
    const mw = wide ? 150 : 46;
    V.el('path', { d: `M${-260} ${-mw} L-150 -40 L-150 40 L-260 ${mw}Z`, fill: wide ? 'rgba(59,130,246,0.15)' : 'rgba(229,72,77,0.12)', stroke: wide ? C.contra : C.inv, 'stroke-width': 5, 'stroke-linejoin': 'round' }, m);
    V.el('rect', { x: -150, y: -80, width: 300, height: 160, rx: 26, fill: '#fff', stroke: C.ink, 'stroke-width': 5 }, m);
    m.gear = V.el('path', { d: V.gearPath(36, 9, 8), fill: wide ? C.contra : C.inv, opacity: 0.8 }, m);
    V.text(m, label, { y: -112, 'font-size': 34, 'font-family': V.MONO, 'font-weight': 800 });
    V.text(m, wide ? '任何活过 \'short 的都收' : "只收 'static", { y: 120, 'font-size': 26, fill: wide ? C.contra : C.inv, 'font-weight': 700 });
    return m;
  }
  V.defScene('v_contravariant', {
    pauses: { 0: 0.6, 1: 1.4, 2: 1.2, 3: 0.8 },
    tail: 1.6,
    sfx: (S) => {
      const { L } = S;
      return [
        [L[0] + 0.2, 'whoosh'], [L[0] + 1.4, 'pop'],
        [L[1] + 0.3, 'clank'], [L[1] + 1.4, 'swish'], [L[1] + 2.2, 'gear'], [L[1] + 2.6, 'ok'], [L[1] + 3.4, 'swish'], [L[1] + 4.2, 'gear'], [L[1] + 4.6, 'ok'],
        [L[2] + 0.4, 'type'], [L[2] + 1.6, 'rise'], [L[2] + 3.0, 'fall'],
        [L[3] + 0.4, 'clank'], [L[3] + 1.8, 'swish'], [L[3] + 2.5, 'boing'],
        [L[4] - 0.2, 'beep'], [L[4] + 0.1, 'error'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 53, blobs: [C.contra, C.claude] });
      const tag = V.sceneTag(S, '第三种 · 逆变', C.contra);
      const g = V.g(S.root);
      const head = V.typeHeader(g, [['fn(', null], ['T', 'contra'], [')', null]], 84);
      const code = V.Code(g, {
        title: 'contravariant.rs', fs: 25, revealed: false,
        code: `fn call_static(f: fn(&'static str)) {
    f("I live forever");
}

fn demo<'short>(f: fn(&'short str)) {
    call_static(f);   // ✓ 逆变
}

fn widen<'short>(f: fn(&'static str))
    -> fn(&'short str) {
    f                 // ✗ 反过来不行
}`,
      });
      const sq = code.squiggle(10, 4, 5);
      const mA = funnel(g, "fn(&'short str)", true), mB = funnel(g, "fn(&'static str)", false);
      const cardsA = ["&'static str", "&'short str"].map((s, i) => V.Pill(g, s, { fs: 28, mono: true, fill: i ? C.contra : C.gold, color: i ? '#fff' : C.ink }));
      const oksA = [V.Check(g, { r: 26 }), V.Check(g, { r: 26 })];
      const cardB = V.Pill(g, "&'short str", { fs: 28, mono: true, fill: C.contra });
      const xB = V.Cross(g, { r: 30 });
      // 关系图
      const rel = V.A(g);
      const T = (s, x, y, c) => V.text(rel, s, { x, y, 'font-size': 32, 'font-family': V.MONO, 'font-weight': 800, fill: c || C.ink });
      T("&'static str", -230, 70);
      T("&'short str", 230, 70);
      T("fn(&'static str)", -260, -50, C.contra);
      T("fn(&'short str)", 260, -50, C.contra);
      const aLo = V.Arrow(rel, { color: C.ink, width: 5, head: 16 }), aHi = V.Arrow(rel, { color: C.contra, width: 6, head: 18 });
      V.text(rel, '<:', { x: 0, y: 40, 'font-size': 26, fill: C.soft, 'font-family': V.MONO });
      V.text(rel, ':>', { x: 0, y: -80, 'font-size': 26, fill: C.contra, 'font-family': V.MONO });
      const flipLbl = V.Pill(g, '方向翻转！', { fs: 30, fill: C.contra });
      const bot = V.Rustc(g);
      const err = V.ErrorPanel(g, [
        'error: lifetime may not live long enough',
        "  | fn widen<'short>(f: fn(&'static str))",
        "  |          ------ lifetime `'short` defined here",
        '  |     f',
        "  |     ^ requires that `'short` must outlive `'static`",
      ], { fs: 22 });

      const cast = V.cast(S, { claudePos: [1810, 170], claudeScale: 0.55, ferrisPos: [1730, 910], ferrisScale: 0.6 });
      return (t) => {
        bg.update(t);
        tag(t);
        const up = V.ep(t, L[1], L[1] + 0.6);
        head.at(V.lerp(960, 1290, up), V.lerp(420, 130, up), V.lerp(1.5, 0.75, up) * V.inn(t, L[0] + 0.2, 0.6));
        head.show(t, L[0] + 1.3);
        code.root.at(60, 200, 1, 0, V.fin(t, L[1] + 0.1));
        const nA = code.lines.slice(0, 7).join('').length, nAll = code.lines.join('').length;
        code.reveal(t < L[3] ? (V.p(t, L[2] + 0.2, L[2] + 2.0) * nA) / nAll : (nA + V.p(t, L[3] + 0.2, L[3] + 1.6) * (nAll - nA)) / nAll, true);
        code.hl(5, V.win(t, L[2] + 2.0, L[3], 0.3), C.contra);
        code.hl(10, V.fin(t, L[4] - 0.2), C.inv);
        V.op(sq, V.fin(t, L[4]));

        const MX = 1290;
        const oA = V.fout(t, L[3], 0.4);
        mA.at(MX + 60, 420, V.inn(t, L[1] + 0.3), 0, oA);
        mA.gear.setAttribute('transform', `rotate(${t * 90})`);
        cardsA.forEach((c, i) => {
          const at = L[1] + 1.3 + i * 2.0;
          const k = V.ep(t, at, at + 0.9, 'inOut');
          c.at(V.lerp(MX - 420, MX - 60, k), 420 + (i ? 30 : -30) * (1 - k), V.inn(t, at - 0.3) * (1 - V.p(t, at + 0.8, at + 1.0)), 0, oA);
          oksA[i].at(MX + 60 + 230, 340 + i * 90, V.inn(t, at + 1.1), 0, oA);
        });
        rel.at(MX, 700, 1, 0, V.fin(t, L[2] + 1.2) * oA);
        aLo.set(-230 + 110, 70, 230 - 110, 70, V.ep(t, L[2] + 1.4, L[2] + 1.9));
        aHi.set(260 - 130, -50, -260 + 140, -50, V.ep(t, L[2] + 2.8, L[2] + 3.4));
        flipLbl.at(MX + 300, 610, V.inn(t, L[2] + 3.4), -4, oA);

        const oB = V.fin(t, L[3] + 0.2) * V.fout(t, L[4] + 0.2, 0.4);
        mB.at(MX + 60, 470, V.inn(t, L[3] + 0.3), 0, oB);
        mB.gear.setAttribute('transform', `rotate(${t * 90})`);
        const kb = V.ep(t, L[3] + 1.6, L[3] + 2.5, 'in');
        const bounce = V.ep(t, L[3] + 2.5, L[3] + 3.2, 'out');
        cardB.at(V.lerp(MX - 460, MX - 300, kb) - bounce * 140, 470 - Math.sin(bounce * Math.PI) * 90, V.inn(t, L[3] + 1.2), bounce * -40, oB);
        xB.at(MX - 200, 380, V.inn(t, L[3] + 2.5), 0, oB);

        const botIn = V.ep(t, L[4] - 0.5, L[4] + 0.2, 'outBack');
        bot.root.at(V.lerp(2150, 1600, botIn), 640, 0.6);
        bot.update(t, { mood: 'error', talk: S.talk('rustc', t) });
        err.at(800, 330, 1, 0, V.fin(t, L[4]));

        cast.update(t, {
          ferris: { mood: t > L[3] + 2.4 ? 'worried' : 'neutral', look: [-1, -0.6], raise: t > L[3] && t < L[3] + 2 ? 0.8 : 0 },
          claude: { look: [-1, 0.3], mood: t > L[2] + 3.4 && t < L[3] ? 'happy' : 'neutral' },
        });
      };
    },
  });

  // ======================= 双变 =======================
  V.defScene('v_bivariant', {
    pauses: { 0: 0.4, 1: 0.8, 2: 1.2, 3: 1.0 },
    sfx: (S) => {
      const { L, E } = S;
      const d3 = E[3] - L[3];
      return [
        [L[0] + 0.2, 'whoosh'], [L[0] + 1.2, 'pop'],
        [L[1] + 0.3, 'type'], [L[1] + 1.4, 'ghost'],
        [L[2] + 0.3, 'beep'], [L[2] + 0.5, 'error'], [L[2] + 3.4, 'swish'], [L[2] + 4.2, 'cork'],
        ...[0, 1, 2].map((i) => [L[3] + d3 * (0.05 + i * 0.33), 'cork']),
        [L[4] + 0.4, 'flip'], [L[4] + 1.0, 'ding'],
      ];
    },
    build(S) {
      const { L, E } = S;
      const bg = V.Background(S.root, { seed: 54, blobs: [C.bi, C.claude] });
      const tag = V.sceneTag(S, '第四种 · 双变', C.bi);
      const g = V.g(S.root);
      const head = V.Pill(g, '双变 bivariant', { fs: 40, fill: C.bi });
      const code = V.Code(g, { title: 'phantom.rs', fs: 34, revealed: false, code: 'struct Foo<T> {\n    x: i32,\n}' });
      const ghost = V.Ghost(g, { label: 'T' });
      const nouse = V.Pill(g, 'T 从没被用到 → 对子类型毫无约束', { fs: 30, fill: '#fff', color: C.bi, stroke: C.bi, sw: 3 });
      const bot = V.Rustc(g);
      const err = V.ErrorPanel(g, [
        'error[E0392]: type parameter `T` is never used',
        '  | struct Foo<T> {',
        '  |            ^ unused type parameter',
        '  = help: consider removing `T`, referring to it in a field,',
        '          or using a marker such as `PhantomData`',
      ], { fs: 22 });
      const jars = [['PhantomData<T>', 'co'], ['PhantomData<fn(T)>', 'contra'], ['PhantomData<fn(T) -> T>', 'inv']].map(([s, k]) => jar(g, s, k));
      const book = V.A(g);
      V.el('rect', { x: -110, y: -70, width: 220, height: 140, rx: 10, fill: C.bi, stroke: '#5E2E8F', 'stroke-width': 5 }, book);
      V.el('rect', { x: -96, y: -58, width: 192, height: 116, rx: 6, fill: '#F3E8FF' }, book);
      V.text(book, '型变说明书', { y: -12, 'font-size': 30, 'font-weight': 900, fill: '#5E2E8F' });
      V.text(book, 'for rustc', { y: 28, 'font-size': 22, 'font-family': V.MONO, fill: '#5E2E8F' });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        head.at(960, 140, V.inn(t, L[0] + 0.2));
        const o12 = V.fout(t, L[3], 0.4);
        code.root.at(960 - code.w / 2, 230, 1, 0, V.fin(t, L[1] + 0.1) * o12);
        code.reveal(V.p(t, L[1] + 0.2, L[1] + 1.2), true);
        // 幽灵从 T 飘出，然后被装进罐子
        const gx0 = 960 - code.w / 2 + code.colX(0, 11) + 10, gy0 = 230 + code.lineY(0);
        const flo = V.ep(t, L[1] + 1.3, L[1] + 2.4, 'out');
        const toJar = V.ep(t, L[2] + 3.2, L[2] + 4.2, 'inOut');
        const gx = V.lerp(V.lerp(gx0, 1450, flo), 960, toJar), gy = V.lerp(V.lerp(gy0, 330, flo), 640, toJar) + Math.sin(t * 2.5) * 14 * (1 - toJar);
        ghost.at(gx, gy, V.lerp(0.4, 1.2, flo) * V.lerp(1, 0.8, toJar), Math.sin(t * 2) * 6, V.fin(t, L[1] + 1.3) * o12);
        ghost.update(t);
        nouse.at(960, 540, V.inn(t, L[1] + 2.0), 0, V.fout(t, L[2], 0.3));
        const botIn = V.ep(t, L[2] - 0.2, L[2] + 0.5, 'outBack');
        bot.root.at(V.lerp(-200, 260, botIn), 640, 0.6, 0, V.fout(t, L[3], 0.4));
        bot.update(t, { mood: 'error', talk: S.talk('rustc', t) });
        err.at(560, 470, 1, 0, V.fin(t, L[2] + 0.4) * V.fout(t, L[2] + 3.0, 0.4));
        // 罐子
        const d3 = E[3] - L[3];
        jars.forEach((j, i) => {
          // 第一个罐子先在中间装下幽灵，再让出位置给另外两个
          const at = i === 0 ? L[2] + 3.0 : L[3] + d3 * (0.05 + i * 0.33);
          const x = i === 0 ? V.lerp(960, 520, V.ep(t, L[3], L[3] + 0.6)) : 960 + (i - 1) * 440;
          const s = 0.95 * V.inn(t, at);
          j.at(x, 560, s, 0, s > 0 ? 1 : 0);
          j.ghost.at(0, 10 + Math.sin(t * 2 + i) * 10, 1, 0, i === 0 ? V.fin(t, L[2] + 4.1, 0.2) : 1);
          j.ghost.update(t + i);
          j.badge.at(110, -150, V.inn(t, (i === 0 ? L[3] + d3 * 0.05 : at) + 0.4));
        });
        V.op(ghost, t > L[2] + 4.1 ? 0 : V.fin(t, L[1] + 1.3) * o12);
        book.at(1640, 330, V.inn(t, L[4] + 0.4), -8);

        cast.update(t, {
          ferris: { mood: t > L[4] ? 'happy' : t > L[1] + 1.3 && t < L[2] ? 'surprised' : 'neutral', look: [-1, -0.5] },
          claude: { look: [1, -0.4], mood: t > L[3] ? 'happy' : 'neutral', pos: t > L[2] - 0.5 && t < L[3] ? [140, 880] : undefined, s: t > L[2] - 0.5 && t < L[3] ? 0.6 : undefined },
        });
      };
    },
  });

  // ======================= 口诀与速查表 =======================
  V.defScene('v_cheatsheet', {
    pauses: { 0: 1.4 },
    tail: 5.0,
    sfx: (S) => {
      const { L, E } = S, d = E[0] - L[0];
      return [...[0, 1, 2, 3].map((i) => [L[0] + d * (i * 0.25) + 0.1, 'ding']), [L[1] + 0.2, 'whoosh'], ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [L[1] + 0.8 + i * 0.25, 'tick']), [L[1] + 3.2, 'click'], [L[1] + 3.3, 'sparkle']];
    },
    build(S) {
      const { L, E } = S;
      const bg = V.Background(S.root, { seed: 55 });
      const tag = V.sceneTag(S, '口诀 & 速查表', C.claude);
      const g = V.g(S.root);
      const rhymes = [['只读可协变', 'co'], ['只写可逆变', 'contra'], ['又读又写必不变', 'inv'], ['从未使用是双变', 'bi']].map(([s, k]) => {
        const r = V.A(g);
        V.Badge(r, k, { r: 40 }).at(-260, 0);
        V.text(r, s, { x: -200, 'font-size': 60, 'font-weight': 900, 'text-anchor': 'start', fill: V.VAR[k].color });
        return r;
      });
      // 速查表
      const rows = [
        ["&'a T", 'co', 'co', ''],
        ["&'a mut T", 'co', 'inv', ''],
        ['Box<T> · Vec<T> · Option<T>', '', 'co', ''],
        ['Cell<T> · RefCell<T> · UnsafeCell<T>', '', 'inv', ''],
        ['fn(T) -> U', '', 'contra', 'co'],
        ['*const T', '', 'co', ''],
        ['*mut T', '', 'inv', ''],
        ['PhantomData<T>', '', 'co', ''],
      ];
      const table = V.A(g);
      const TW = 1320, RH = 74, cols = [-TW / 2 + 40, 300, 450, 600];
      V.el('rect', { x: -TW / 2, y: -40, width: TW, height: RH * rows.length + 90, rx: 26, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, table);
      V.el('rect', { x: -TW / 2, y: -40, width: TW, height: 80, rx: 26, fill: C.ink }, table);
      V.el('rect', { x: -TW / 2, y: 10, width: TW, height: 30, fill: C.ink }, table);
      [['类型', 0, 'start'], ["'a", 1], ['T', 2], ['U', 3]].forEach(([s, i, anc]) => V.text(table, s, { x: cols[i], y: 0, 'font-size': 32, fill: '#fff', 'font-weight': 800, 'font-family': i ? V.MONO : V.FONT, 'text-anchor': anc || 'middle' }));
      const rowEls = rows.map((r, i) => {
        const y = 40 + RH * i + RH / 2 + 4;
        const rg = V.A(table);
        if (i % 2) V.el('rect', { x: -TW / 2 + 4, y: y - RH / 2, width: TW - 8, height: RH, fill: C.paper, opacity: 0.8 }, rg);
        V.text(rg, r[0], { x: cols[0], y, 'font-size': 32, 'font-family': V.MONO, 'font-weight': 700, 'text-anchor': 'start', style: 'white-space:pre' });
        rg.badges = [];
        [1, 2, 3].forEach((c) => { if (r[c]) { const b = V.Badge(rg, r[c], { r: 24 }); b.px = cols[c]; b.py = y; rg.badges.push(b); } });
        return rg;
      });
      const legend = V.A(g);
      ['co', 'contra', 'inv', 'bi'].forEach((k, i) => {
        V.Badge(legend, k, { r: 18 }).at(i * 230 - 345, 0);
        V.text(legend, V.VAR[k].name, { x: i * 230 - 310, 'font-size': 28, 'text-anchor': 'start', fill: V.VAR[k].color, 'font-weight': 700 });
      });
      const flash = V.el('rect', { width: V.W, height: V.H, fill: '#fff' }, S.root);
      const cast = V.cast(S, { claudePos: [140, 900], claudeScale: 0.55, ferrisPos: [1800, 940], ferrisScale: 0.5 });
      return (t) => {
        bg.update(t);
        tag(t);
        const d = E[0] - L[0];
        const out = V.fout(t, L[1], 0.4);
        rhymes.forEach((r, i) => r.at(860, 260 + i * 160, V.inn(t, L[0] + d * i * 0.25, 0.5), 0, out));
        table.at(960, 150, V.inn(t, L[1] + 0.3, 0.5));
        rowEls.forEach((r, i) => {
          r.at(0, 0, 1, 0, V.fin(t, L[1] + 0.6 + i * 0.25, 0.3));
          r.badges.forEach((b, j) => b.at(b.px, b.py, V.inn(t, L[1] + 0.8 + i * 0.25 + j * 0.1)));
        });
        legend.at(960, 900, 1, 0, V.fin(t, L[1] + 2.8));
        V.op(flash, V.win(t, L[1] + 3.2, L[1] + 3.3, 0.08) * 0.8);
        cast.update(t, { ferris: { mood: t > L[1] + 3 ? 'happy' : 'neutral', look: [-1, -0.6] }, claude: { look: [1, -0.6] } });
      };
    },
  });
})();
