// 第一章：起源。子类型 → 类型构造器 → Java 数组翻车 → 函数子类型（协变/逆变得名）。
(function () {
  const V = window.V, C = V.C;

  // ---------- 子类型与替换原则 ----------
  V.defScene('origin_subtype', {
    pauses: { 0: 0.3, 1: 0.3, 3: 0.2 },
    sfx: (S) => {
      const { L } = S;
      return [
        [0.3, 'pop'], [L[0] + 0.4, 'type'], [L[0] + 1.2, 'type'], [L[0] + 2.0, 'type'], [L[0] + 2.8, 'ding'],
        [L[1] + 0.3, 'whoosh'], [L[1] + 0.9, 'fall'], [L[1] + 1.5, 'pop'], [L[1] + 3.2, 'stamp'],
        [L[2] + 0.2, 'chime'], [L[3] + 0.2, 'step'], [L[3] + 2.3, 'ok'], [L[4] + 0.6, 'stamp'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 21 });
      const tag = V.sceneTag(S, '1967 · 子类型', C.claude);
      const g = V.g(S.root);

      // 复古终端
      const term = V.A(g);
      V.el('rect', { x: -330, y: -230, width: 660, height: 420, rx: 34, fill: '#E9DCC6', stroke: '#BBA98C', 'stroke-width': 6 }, term);
      V.el('rect', { x: -290, y: -195, width: 580, height: 330, rx: 22, fill: '#14231A' }, term);
      V.el('rect', { x: -120, y: 190, width: 240, height: 60, fill: '#D6C7AE' }, term);
      V.el('rect', { x: -200, y: 245, width: 400, height: 26, rx: 10, fill: '#BBA98C' }, term);
      V.el('circle', { cx: 260, cy: 160, r: 9, fill: C.co }, term);
      const lines = ['SIMULA 67', 'CLASS Animal;', 'Animal CLASS Cat;'];
      const tl = lines.map((s, i) => V.text(term, '', { x: -250, y: -130 + i * 80, 'text-anchor': 'start', 'font-size': i ? 42 : 52, fill: '#7CFF9B', 'font-family': V.MONO, 'font-weight': i ? 400 : 700 }));
      const year = V.Pill(g, '1967', { fs: 40, fill: C.claude });

      // Animal 容器 + 猫
      const box = V.Box(g, { w: 620, h: 360, fill: 'rgba(255,255,255,0.7)', stroke: C.soft, dash: '14 10', sw: 4 });
      const boxLabel = V.Pill(g, 'Animal', { fs: 34, mono: true, fill: C.soft });
      const cat = V.Cat(g, { seed: 1 });
      const catLabel = V.Pill(g, 'Cat', { fs: 30, mono: true, fill: C.claude });
      const formula = V.A(g);
      V.text(formula, 'Cat  <:  Animal', { 'font-size': 66, 'font-family': V.MONO, 'font-weight': 700, fill: C.ink });
      V.text(formula, '读作：Cat 是 Animal 的子类型', { y: 70, 'font-size': 30, fill: C.soft });

      // Liskov 铭牌 + 插槽
      const plaque = V.A(g);
      V.el('rect', { x: -470, y: -70, width: 940, height: 140, rx: 20, fill: '#FFF8E8', stroke: C.gold, 'stroke-width': 6 }, plaque);
      V.text(plaque, 'Liskov 替换原则 · 1987', { y: -22, 'font-size': 44, 'font-weight': 800, fill: '#8A5A00' });
      V.text(plaque, '需要 T 的地方，可以放心地交给 T 的任何子类型', { y: 32, 'font-size': 30, fill: C.soft });
      const slot = V.A(g);
      V.el('rect', { x: -170, y: -120, width: 340, height: 240, rx: 26, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, slot);
      V.el('rect', { x: -110, y: -70, width: 220, height: 150, rx: 18, fill: C.paper2, stroke: C.line, 'stroke-width': 3, 'stroke-dasharray': '10 8' }, slot);
      V.text(slot, '需要一只 Animal', { y: -150, 'font-size': 32, 'font-weight': 700 });
      const lamp = V.el('circle', { cx: 0, cy: 150, r: 18, fill: '#ccc' }, slot);
      const ok = V.Check(g, { r: 40 });
      const okText = V.text(g, '照常工作', { 'font-size': 34, fill: C.co, 'font-weight': 700 });
      const stamp = V.Stamp(g, '子类型 = 能顶替', { color: C.co, fs: 44 });
      g.appendChild(cat.root);
      g.appendChild(catLabel);

      const cast = V.cast(S);

      return (t) => {
        bg.update(t);
        tag(t);
        // 终端
        const termOut = V.fout(t, L[1] + 0.1, 0.5);
        term.at(960, 430 - (1 - termOut) * 80, V.inn(t, 0.2, 0.6) * (0.85 + 0.15 * termOut), 0, termOut);
        const typed = V.p(t, L[0] + 0.3, L[0] + 2.6);
        const total = lines.join('').length;
        let n = Math.floor(typed * total);
        tl.forEach((e, i) => {
          const m = Math.max(0, Math.min(lines[i].length, n));
          const s = lines[i].slice(0, m) + (n >= 0 && n < lines[i].length && Math.floor(t * 3) % 2 ? '█' : '');
          if (e.textContent !== s) e.textContent = s;
          n -= lines[i].length;
        });
        year.at(1380, 230, V.inn(t, L[0] + 2.7), -8, termOut);

        // Animal 盒 + 猫
        const bIn = V.inn(t, L[1] + 0.3, 0.5), bOut = V.fout(t, L[2], 0.5);
        box.at(960, 400, bIn, 0, Math.min(1, bIn * 2) * bOut);
        boxLabel.at(740, 245, V.inn(t, L[1] + 0.5), 0, bOut);
        const drop = V.ep(t, L[1] + 0.8, L[1] + 1.4, 'outBounce');
        // 第 3 句开始，猫走向插槽
        const walk = V.ep(t, L[3] + 0.1, L[3] + 2.2, 'inOut');
        const catX = walk > 0 ? V.lerp(560, 960, walk) : 960, catY = walk > 0 ? V.lerp(690, 560, walk) : V.lerp(-120, 420, drop);
        cat.root.at(catX, catY, 1.3, 0, t > L[1] + 0.8 ? (t < L[2] + 0.3 || walk > 0 ? 1 : V.fout(t, L[2], 0.3)) : 0);
        if (walk <= 0 && t > L[2] + 0.3) cat.root.at(560, 690, 1.3, 0, V.fin(t, L[2] + 1.6, 0.4));
        cat.update(t, { hop: walk > 0 && walk < 1 ? 0.7 : 0 });
        catLabel.at(catX, catY + 90, V.inn(t, L[1] + 1.5) * (walk > 0 ? 1 - walk : 1), 0, t < L[2] + 0.3 || walk > 0 ? 1 : 0);
        formula.at(960, V.lerp(720, 860, V.ep(t, L[2], L[2] + 0.6)), V.inn(t, L[1] + 3.0), 0, V.fout(t, L[3], 0.4));

        // 铭牌与插槽
        plaque.at(960, 190, V.inn(t, L[2] + 0.1, 0.6));
        slot.at(960, 560, V.inn(t, L[2] + 1.2, 0.5));
        const lit = V.p(t, L[3] + 2.2, L[3] + 2.4);
        V.set(lamp, { fill: lit ? C.co : '#ccc' });
        ok.at(1220, 560, V.inn(t, L[3] + 2.2));
        V.set(okText, { x: 1340, y: 560 });
        V.op(okText, V.fin(t, L[3] + 2.4));
        V.stampAt(stamp, 960, 880, t, L[4] + 0.5, -5);

        cast.update(t, {
          ferris: { mood: t > L[4] ? 'happy' : 'neutral', look: [-1, -0.3] },
          claude: { look: t > L[3] ? [1, 0] : [1, -0.4], mood: t > L[3] + 2.3 && t < L[4] ? 'happy' : 'neutral' },
        });
      };
    },
  });

  // ---------- 类型构造器 ----------
  V.defScene('origin_question', {
    pauses: { 0: 0.4, 1: 0.3 },
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.2, 'pop'], [L[0] + 1.6, 'pop2'], [L[0] + 2.8, 'boing'], [L[1] + 0.2, 'whoosh'], [L[1] + 1.0, 'pop'], [L[1] + 1.6, 'pop'], [L[1] + 2.2, 'pop'], [L[2] + 0.3, 'rise'], [L[2] + 1.6, 'ding']];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 22 });
      const tag = V.sceneTag(S, '一笼猫 vs 一笼动物', C.claude);
      const g = V.g(S.root);

      const top = V.A(g);
      V.text(top, 'Cat  <:  Animal', { 'font-size': 52, 'font-family': V.MONO, 'font-weight': 700 });
      const topOk = V.Check(top, { r: 28 });
      topOk.at(290, 0);

      const cageA = V.Cage(g, { w: 300, h: 260, label: 'Cage<Cat>', mono: true, labelFill: C.claude });
      const catA = V.Cat(cageA.inside, { seed: 2 });
      const cageB = V.Cage(g, { w: 300, h: 260, label: 'Cage<Animal>', mono: true, labelFill: C.soft });
      const catB = V.Cat(cageB.inside, { seed: 5, color: '#9AA5B1', dark: '#6B7785' });
      const dogB = V.Dog(cageB.inside, { seed: 3 });
      const q = V.A(g);
      V.text(q, '?', { 'font-size': 220, 'font-weight': 900, fill: C.claude });
      const bottom = V.A(g);
      V.text(bottom, 'Cage<Cat>  <:  Cage<Animal>  ?', { 'font-size': 46, 'font-family': V.MONO, 'font-weight': 700, fill: C.claude });

      // 三种“外壳”
      const shells = [['Cage<', '>'], ['List<', '>'], ['fn(', ')']].map(([a, b], i) => {
        const s = V.A(g);
        const w = 400, off = i === 2 ? 30 : 50;
        V.el('rect', { x: -w / 2, y: -80, width: w, height: 160, rx: 26, fill: '#fff', stroke: C.ink, 'stroke-width': 4 }, s);
        const inner = V.g(s, { transform: `translate(${off} 0)` });
        V.text(inner, a, { x: -40, 'font-size': 52, 'font-family': V.MONO, 'font-weight': 700, 'text-anchor': 'end' });
        V.text(inner, b, { x: 52, 'font-size': 52, 'font-family': V.MONO, 'font-weight': 700, 'text-anchor': 'start' });
        s.hole = V.el('rect', { x: -32, y: -34, width: 76, height: 68, rx: 12, fill: C.claude, opacity: 0.25, stroke: C.claude, 'stroke-width': 3, 'stroke-dasharray': '8 6' }, inner);
        V.text(inner, 'T', { x: 6, 'font-size': 40, 'font-family': V.MONO, fill: C.claudeDark, 'font-weight': 700 });
        return s;
      });
      const ctorTitle = V.A(g);
      V.text(ctorTitle, '类型构造器  Type Constructor', { 'font-size': 50, 'font-weight': 800 });
      V.text(ctorTitle, '给它一个类型 T，它造出一个新类型', { y: 58, 'font-size': 30, fill: C.soft });

      // 关系传递图
      const inner = V.A(g);
      V.text(inner, 'Cat', { x: -170, 'font-size': 50, 'font-family': V.MONO, 'font-weight': 700 });
      V.text(inner, 'Animal', { x: 170, 'font-size': 50, 'font-family': V.MONO, 'font-weight': 700 });
      const innerArrow = V.Arrow(inner, { color: C.ink });
      V.text(inner, '<:', { y: -40, 'font-size': 32, 'font-family': V.MONO, fill: C.soft });
      const outer = V.A(g);
      V.text(outer, 'F<Cat>', { x: -210, 'font-size': 50, 'font-family': V.MONO, 'font-weight': 700, fill: C.claude });
      V.text(outer, 'F<Animal>', { x: 210, 'font-size': 50, 'font-family': V.MONO, 'font-weight': 700, fill: C.claude });
      const outerQ = V.text(outer, '?', { y: -10, 'font-size': 64, 'font-weight': 900, fill: C.claude });
      const lift = V.Arrow(g, { color: C.claude, width: 8, dash: '4 14', head: 24 });
      const liftLabel = V.Pill(g, '型变：关系怎么“传出去”', { fs: 34, fill: C.claude });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        const out0 = V.fout(t, L[1], 0.5);
        top.at(960, 170, V.inn(t, 0.3), 0, out0);
        const kA = V.inn(t, L[0] + 0.1, 0.5), kB = V.inn(t, L[0] + 1.5, 0.5);
        cageA.at(560, 470, kA, 0, out0);
        catA.root.at(0, 30, 1.1);
        catA.update(t);
        cageB.at(1360, 470, kB, 0, out0);
        catB.root.at(-60, 40, 0.9);
        catB.update(t);
        dogB.root.at(60, 40, 0.9);
        dogB.update(t);
        const qk = V.inn(t, L[0] + 2.7, 0.6);
        q.at(960, 450 + Math.abs(Math.sin(t * 4)) * -24 * qk, qk, Math.sin(t * 3) * 8, out0);
        bottom.at(960, 790, V.inn(t, L[0] + 2.9), 0, out0);

        const in1 = V.fin(t, L[1] + 0.4), out1 = V.fout(t, L[2], 0.5);
        ctorTitle.at(960, 230, in1, 0, out1);
        shells.forEach((s, i) => {
          s.at(520 + i * 440, 500, V.inn(t, L[1] + 0.9 + i * 0.6), 0, out1);
          V.op(s.hole, 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t * 5 + i)));
        });

        const in2 = V.fin(t, L[2] + 0.2);
        inner.at(960, 700, 1, 0, in2);
        innerArrow.set(-90, 0, 70, 0, V.ep(t, L[2] + 0.3, L[2] + 0.8));
        outer.at(960, 330, 1, 0, V.fin(t, L[2] + 0.9));
        V.op(outerQ, V.fin(t, L[2] + 0.9) * (0.6 + 0.4 * Math.sin(t * 6)));
        lift.set(960, 650, 960, 400, V.ep(t, L[2] + 0.4, L[2] + 1.2));
        V.op(lift, in2);
        liftLabel.at(1330, 520, V.inn(t, L[2] + 1.5), -3);

        cast.update(t, {
          ferris: { mood: t > L[0] + 2.7 && t < L[1] ? 'surprised' : 'neutral', look: [-1, -0.4] },
          claude: { look: [1, -0.3], mood: t > L[0] + 2.7 && t < L[1] ? 'think' : 'neutral' },
        });
      };
    },
  });

  // ---------- Java 数组 ----------
  V.defScene('origin_java', {
    mood: 'calm',
    pauses: { 1: 0.25, 2: 0.6, 3: 0.4 },
    sfx: (S) => {
      const { L } = S;
      return [
        [L[0] + 0.2, 'type'], [L[0] + 1.2, 'type'], [L[0] + 2.6, 'stamp'],
        [L[1] + 0.3, 'beep'], [L[1] + 0.9, 'beep'], [L[1] + 1.5, 'beep'], [L[1] + 2.0, 'ok'],
        [L[2] + 0.2, 'type'], [L[2] + 1.6, 'woof'], [L[2] + 2.0, 'step'],
        [L[2] + 3.6, 'alarm'], [L[3] + 0.2, 'boom'], [L[3] + 0.9, 'crack'], [L[3] + 2.4, 'stamp'],
        [L[4] + 0.6, 'rise'], [L[4] + 2.2, 'fall'],
      ];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 23 });
      const tag = V.sceneTag(S, '1996 · Java 数组', C.inv);
      const g = V.g(S.root);
      const code = V.Code(g, {
        title: 'Zoo.java', fs: 30, revealed: false,
        code: `Cat[] cats = new Cat[3];
Animal[] animals = cats;   // 编译通过
animals[2] = new Dog();    // 也编译通过……`,
      });
      const SX = [640, 900, 1160], SY = 640;
      const arr = V.A(g);
      SX.forEach((x) => V.el('rect', { x: x - 120, y: SY - 120, width: 240, height: 240, rx: 18, fill: '#fff', stroke: C.ink, 'stroke-width': 5 }, arr));
      [0, 1, 2].forEach((i) => V.text(arr, `[${i}]`, { x: SX[i], y: SY + 150, 'font-size': 30, 'font-family': V.MONO, fill: C.soft }));
      const labelCat = V.Pill(g, 'Cat[]', { fs: 36, mono: true, fill: C.claude });
      const labelAnimal = V.Pill(g, 'Animal[]', { fs: 36, mono: true, fill: C.soft });
      const cats = [0, 1, 2].map((i) => V.Cat(g, { seed: i * 3 + 1, color: ['#F2A65A', '#A9A9A9', '#E8C07D'][i] }));
      const reads = [0, 1, 2].map(() => V.Pill(g, 'Animal ✓', { fs: 26, fill: C.co }));
      const dog = V.Dog(g, { seed: 4 });
      const flash = V.el('rect', { x: SX[2] - 130, y: SY - 130, width: 260, height: 260, rx: 22, fill: C.inv }, g);
      const shards = V.Burst(g, { n: 26, seed: 9, shape: 'shard', colors: [C.inv, '#fff', C.ink, C.gold], spread: 340 });
      const exc = V.Stamp(g, 'java.lang.ArrayStoreException', { color: C.inv, fs: 40, mono: true });
      const when = V.A(g);
      V.text(when, '编译期：✓ 没发现', { x: -230, 'font-size': 34, fill: C.co, 'font-weight': 700 });
      V.text(when, '运行时：✗ 才爆炸', { x: 230, 'font-size': 34, fill: C.inv, 'font-weight': 700 });
      const readA = V.Arrow(g, { color: C.co, width: 14, head: 36 }), writeA = V.Arrow(g, { color: C.contra, width: 14, head: 36 });
      const readL = V.Pill(g, '读：取出 Cat 当 Animal 用 —— 安全', { fs: 32, fill: C.co });
      const writeL = V.Pill(g, '写：放进 Animal 当 Cat 存 —— 危险', { fs: 32, fill: C.contra });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        const sum = V.ep(t, L[4], L[4] + 0.6);
        // 代码
        code.root.at(960 - code.w / 2, 70 - sum * 400, 1, 0, V.fin(t, 0.2) * (1 - sum));
        const total = code.lines.reduce((a, l) => a + l.length, 0), l01 = code.lines[0].length + code.lines[1].length;
        const k = t < L[2] ? (V.p(t, L[0] + 0.1, L[0] + 2.2) * l01) / total : (l01 + V.p(t, L[2] + 0.1, L[2] + 1.4) * code.lines[2].length) / total;
        code.reveal(k, true);
        code.hl(1, V.win(t, L[0] + 2.3, L[1], 0.3), C.co);
        code.hl(2, V.win(t, L[2] + 1.4, L[4], 0.3), C.inv);

        // 数组
        const arrO = 1 - sum * 0.75;
        arr.at(0, 0, 1, 0, V.fin(t, 0.4) * arrO);
        labelCat.at(380, SY - 50, V.inn(t, 0.6), 0, arrO);
        labelAnimal.at(395, SY + 15, V.inn(t, L[0] + 2.5, 0.35), -10 + Math.sin(V.p(t, L[0] + 2.5, L[0] + 3) * 9) * 4, arrO);
        const boom = L[3] + 0.2;
        cats.forEach((c, i) => {
          const rd = V.p(t, L[1] + 0.2 + i * 0.6, L[1] + 0.5 + i * 0.6) * (1 - V.p(t, L[1] + 0.8 + i * 0.6, L[1] + 1.2 + i * 0.6));
          const shake = i === 2 && t > boom && t < boom + 0.8 ? Math.sin(t * 70) * 8 : 0;
          c.root.at(SX[i] + shake, SY + 30 - rd * 40, 1.25, 0, V.fin(t, 0.6 + i * 0.2) * arrO);
          c.update(t);
          reads[i].at(SX[i], SY - 170, V.inn(t, L[1] + 0.3 + i * 0.6), 0, V.fout(t, L[2], 0.3));
        });
        // 狗
        // 狗被推向 [2]，撞上去后被弹回（存储被拒绝）
        const push = V.ep(t, L[2] + 1.8, L[2] + 3.5, 'inOut');
        const back = V.ep(t, boom, boom + 0.9, 'out');
        const dogX = V.lerp(1560, SX[2] + 150, push) + back * 330, dogY = SY + 30 - Math.sin(back * Math.PI) * 140;
        dog.root.at(dogX, dogY, 1.25, -back * 360, V.fin(t, L[2] + 1.4) * arrO);
        dog.update(t, { hop: push > 0 && push < 1 ? 0.6 : 0 });
        const alarm = t > L[2] + 3.5 && t < boom + 1.2;
        V.set(flash, {});
        V.op(flash, alarm ? (0.25 + 0.35 * (Math.floor(t * 8) % 2)) * arrO : 0);
        shards.at(SX[2] + 130, SY);
        shards.update(V.p(t, boom, boom + 1.6));
        V.stampAt(exc, 960, 420, t, L[3] + 2.3, -4);
        V.op(exc, V.p(t, L[3] + 2.3, L[3] + 2.4) * (1 - sum));
        when.at(960, 860, 1, 0, V.fin(t, L[3] + 3.2) * (1 - sum));

        // 读写方向
        readA.set(700, 560, 700, 220, V.ep(t, L[4] + 0.5, L[4] + 1.1));
        V.op(readA, V.fin(t, L[4] + 0.5));
        writeA.set(1220, 220, 1220, 560, V.ep(t, L[4] + 2.0, L[4] + 2.6));
        V.op(writeA, V.fin(t, L[4] + 2.0));
        readL.at(700, 160, V.inn(t, L[4] + 1.0));
        writeL.at(1220, 620, V.inn(t, L[4] + 2.5));

        const scared = t > L[2] + 3.5 && t < L[3] + 2.5;
        cast.update(t, {
          ferris: { mood: scared ? 'scared' : t > L[2] && t < L[2] + 3.5 ? 'happy' : 'neutral', look: [-1, -0.2], raise: t > L[2] + 1.6 && t < L[2] + 3.5 ? 0.8 : 0 },
          claude: { mood: scared ? 'surprised' : 'neutral', look: [1, -0.2] },
        });
      };
    },
  });

  // ---------- 函数的子类型 ----------
  function machine(parent, input, output, color) {
    const m = V.A(parent);
    m.inP = V.Pill(m, input, { fs: 34, mono: true, fill: '#fff', color: C.ink, stroke: C.ink, sw: 3 });
    m.inP.at(-330, 0);
    m.outP = V.Pill(m, output, { fs: 34, mono: true, fill: '#fff', color: C.ink, stroke: C.ink, sw: 3 });
    m.outP.at(330, 0);
    V.el('path', { d: 'M-230 -10 H-140 M140 0 H230', stroke: C.ink, 'stroke-width': 5 }, m);
    V.el('path', { d: 'M222 -12 L240 0 L222 12Z M-148 -22 L-128 -10 L-148 2Z', fill: C.ink }, m);
    V.el('rect', { x: -130, y: -70, width: 260, height: 140, rx: 26, fill: color, stroke: C.ink, 'stroke-width': 4 }, m);
    m.gear = V.el('path', { d: V.gearPath(34, 8, 8), fill: 'rgba(255,255,255,0.65)' }, m);
    m.label = V.text(m, '', { y: -100, 'font-size': 30, 'font-weight': 700 });
    return m;
  }
  V.defScene('origin_function', {
    pauses: { 0: 0.2, 1: 0.4, 2: 0.3 },
    sfx: (S) => {
      const { L } = S;
      return [[L[0] + 0.2, 'scroll'], [L[1] + 0.2, 'clank'], [L[1] + 1.0, 'gear'], [L[1] + 1.4, 'clank'], [L[2] + 0.4, 'rise'], [L[2] + 2.4, 'fall'], [L[3] + 0.3, 'chime']];
    },
    build(S) {
      const { L } = S;
      const bg = V.Background(S.root, { seed: 24 });
      const tag = V.sceneTag(S, '1984 · 函数的子类型', C.contra);
      const g = V.g(S.root);
      // 卷轴
      const scroll = V.A(g);
      const paper = V.el('rect', { x: -420, y: -10, width: 840, height: 20, fill: '#F6E7C8', stroke: '#C9A96E', 'stroke-width': 3 }, scroll);
      const rollT = V.el('rect', { x: -450, y: -22, width: 900, height: 34, rx: 17, fill: '#C9A96E' }, scroll);
      const rollB = V.el('rect', { x: -450, y: -12, width: 900, height: 34, rx: 17, fill: '#C9A96E' }, scroll);
      const scText = V.g(scroll);
      V.text(scText, 'A Semantics of Multiple Inheritance', { y: -26, 'font-size': 40, 'font-style': 'italic', fill: '#5A4220', 'font-family': 'Georgia,serif' });
      V.text(scText, 'Luca Cardelli · 1984', { y: 28, 'font-size': 30, fill: '#7A6040', 'font-family': 'Georgia,serif' });

      const m1 = machine(g, 'Cat', 'Animal', '#F3D9C9');
      m1.label.textContent = '原函数   fn(Cat) -> Animal';
      const m2 = machine(g, 'Animal', 'Cat', '#D7EEDF');
      m2.label.textContent = '替换者   fn(Animal) -> Cat';
      const subLab = V.Pill(g, '替换者 <: 原函数', { fs: 30, fill: C.ink });
      const aOut = V.Arrow(g, { color: C.co, width: 9, head: 26 }), aIn = V.Arrow(g, { color: C.contra, width: 9, head: 26 });
      const tagOut = V.Pill(g, '返回值：同向 → 协变', { fs: 30, fill: C.co });
      const tagIn = V.Pill(g, '参数：反向 → 逆变', { fs: 30, fill: C.contra });
      const notes = V.A(g);
      V.text(notes, '返回值更具体（Cat 是 Animal）', { x: 330, y: 80, 'font-size': 26, fill: C.co });
      V.text(notes, '参数更宽容（Animal 都能收）', { x: -330, y: 80, 'font-size': 26, fill: C.contra });

      // 数学小图：保持 / 翻转
      const math = V.A(g);
      const mk = (x, flip, color, title) => {
        const p = V.g(math, { transform: `translate(${x} 0)` });
        V.el('rect', { x: -260, y: -170, width: 520, height: 340, rx: 26, fill: '#fff', stroke: color, 'stroke-width': 5 }, p);
        V.text(p, title, { y: -125, 'font-size': 38, 'font-weight': 800, fill: color });
        V.text(p, 'A', { x: -120, y: 90, 'font-size': 44, 'font-family': V.MONO, 'font-weight': 700 });
        V.text(p, 'B', { x: 120, y: 90, 'font-size': 44, 'font-family': V.MONO, 'font-weight': 700 });
        V.text(p, 'F(A)', { x: -120, y: -40, 'font-size': 40, 'font-family': V.MONO, 'font-weight': 700, fill: color });
        V.text(p, 'F(B)', { x: 120, y: -40, 'font-size': 40, 'font-family': V.MONO, 'font-weight': 700, fill: color });
        p.lo = V.Arrow(p, { color: C.ink, width: 6 });
        p.hi = V.Arrow(p, { color, width: 6 });
        p.flip = flip;
        return p;
      };
      const pa = mk(-300, false, C.co, '协变 · 方向保持'), pb = mk(300, true, C.contra, '逆变 · 方向翻转');
      const covText = V.text(g, 'covariant / contravariant —— 借自数学的名字', { 'font-size': 32, fill: C.soft });

      const cast = V.cast(S);
      return (t) => {
        bg.update(t);
        tag(t);
        const outA = V.fout(t, L[3], 0.5);
        const open = V.ep(t, L[0] + 0.1, L[0] + 1.0, 'out');
        const h = 20 + open * 180;
        V.set(paper, { y: -h / 2, height: h });
        V.set(rollT, { y: -h / 2 - 17 });
        V.set(rollB, { y: h / 2 - 17 });
        V.op(scText, V.p(t, L[0] + 0.7, L[0] + 1.1));
        const scUp = V.ep(t, L[1], L[1] + 0.6);
        scroll.at(960, V.lerp(400, 140, scUp), V.lerp(1, 0.6, scUp) * V.inn(t, L[0], 0.4), 0, outA);

        m1.at(960, 400, V.inn(t, L[1] + 0.1), 0, outA);
        m2.at(960, 700, V.inn(t, L[1] + 1.3), 0, outA);
        m1.gear.setAttribute('transform', `rotate(${t * 60})`);
        m2.gear.setAttribute('transform', `rotate(${-t * 60})`);
        subLab.at(960, 550, V.inn(t, L[1] + 2.4), 0, outA);
        // 子类型箭头：从子类型指向父类型
        aOut.set(1290, 650, 1290, 450, V.ep(t, L[2] + 0.3, L[2] + 0.9));
        V.op(aOut, V.fin(t, L[2] + 0.3) * outA);
        aIn.set(630, 450, 630, 650, V.ep(t, L[2] + 2.3, L[2] + 2.9));
        V.op(aIn, V.fin(t, L[2] + 2.3) * outA);
        tagOut.at(1580, 550, V.inn(t, L[2] + 0.8), 0, outA);
        tagIn.at(340, 550, V.inn(t, L[2] + 2.8), 0, outA);
        notes.at(960, 700, 1, 0, V.fin(t, L[1] + 2.8) * outA);

        math.at(960, 470, V.inn(t, L[3] + 0.3, 0.6));
        [pa, pb].forEach((p, i) => {
          const k1 = V.ep(t, L[3] + 0.8 + i * 0.3, L[3] + 1.3 + i * 0.3), k2 = V.ep(t, L[3] + 1.6 + i * 0.3, L[3] + 2.2 + i * 0.3);
          p.lo.set(-70, 90, 70, 90, k1);
          if (p.flip) p.hi.set(70, -40, -50, -40, k2);
          else p.hi.set(-50, -40, 70, -40, k2);
        });
        V.set(covText, { x: 960, y: 720 });
        V.op(covText, V.fin(t, L[3] + 2.5));

        cast.update(t, { ferris: { look: [-1, -0.3] }, claude: { look: [1, -0.3] } });
      };
    },
  });
})();
