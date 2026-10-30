// 尾声：回顾三幅画面，Ferris 举起 invariant 盾牌，彩带与片尾字幕。
(function () {
  const V = window.V, C = V.C;

  V.defScene('end_recap', {
    pauses: { 2: 0.3, 3: 0.3 },
    tail: 7.0,
    sfx: (S) => {
      const { L, E } = S;
      return [[L[0] + 0.3, 'flip'], [L[1] + 0.3, 'flip'], [L[2] + 0.3, 'flip'], [L[3] + 0.4, 'shield'], [L[4] + 0.3, 'whoosh'], [E[4] - 0.6, 'tada'], [E[4] - 0.4, 'sparkle'], [E[4] + 1.5, 'chime']];
    },
    build(S) {
      const { L, E } = S;
      const bg = V.Background(S.root, { seed: 71 });
      const g = V.g(S.root);
      // 三张“拍立得”
      function polaroid(title) {
        const p = V.A(g);
        V.el('rect', { x: -230, y: -200, width: 460, height: 400, rx: 10, fill: '#fff', stroke: '#E2D8C9', 'stroke-width': 3 }, p);
        V.el('rect', { x: -200, y: -170, width: 400, height: 280, fill: C.paper2 }, p);
        V.text(p, title, { y: 160, 'font-size': 32, 'font-weight': 800 });
        p.pic = V.g(p);
        return p;
      }
      const p1 = polaroid('一笼猫 ≟ 一笼动物');
      const cg = V.Cage(p1.pic, { w: 160, h: 150, bars: 6 });
      cg.at(-70, -20, 1);
      V.Cat(cg.inside).root.at(0, 20, 0.7);
      V.text(p1.pic, '?', { x: 110, y: -30, 'font-size': 120, 'font-weight': 900, fill: C.claude });
      const p2 = polaroid('区分读和写');
      V.Arrow(p2.pic, { color: C.co, width: 12, head: 30 }).set(-80, 60, -80, -120);
      V.Arrow(p2.pic, { color: C.contra, width: 12, head: 30 }).set(80, -120, 80, 60);
      V.text(p2.pic, '读', { x: -130, y: -30, 'font-size': 40, 'font-weight': 900, fill: C.co });
      V.text(p2.pic, '写', { x: 130, y: -30, 'font-size': 40, 'font-weight': 900, fill: C.contra });
      const p3 = polaroid('生命周期 + 型变');
      const b1 = V.Band(p3.pic, { label: "'static", color: C.gold, h: 40, fs: 24 });
      b1.at(-180, -90); b1.grow(360);
      const b2 = V.Band(p3.pic, { label: "'a", color: C.claude, h: 40, fs: 24 });
      b2.at(-100, -20); b2.grow(220);
      ['co', 'contra', 'inv', 'bi'].forEach((k, i) => V.Badge(p3.pic, k, { r: 24 }).at(-120 + i * 80, 60));
      const pols = [p1, p2, p3];

      // invariant 盾牌
      const shield = V.A(g);
      V.el('path', { d: 'M0 -120 L100 -85 Q100 50 0 120 Q-100 50 -100 -85Z', fill: C.inv, stroke: '#A3262A', 'stroke-width': 8 }, shield);
      V.text(shield, 'invariant', { y: -6, 'font-size': 27, 'font-family': V.MONO, 'font-weight': 900, fill: '#fff' });
      V.text(shield, 'o', { y: 50, 'font-size': 44, 'font-family': V.MONO, 'font-weight': 900, fill: '#fff' });

      const thanks = V.A(g);
      V.text(thanks, '谢谢收看', { 'font-size': 120, 'font-weight': 900 });
      V.text(thanks, '型变 Variance · 协变 逆变 不变 双变', { y: 100, 'font-size': 36, fill: C.soft });
      const credits = V.A(g);
      V.text(credits, '文案 · 动画 · 音效：Claude      主演：Claude & Ferris（Rust 吉祥物）      客串：rustc', { 'font-size': 26, fill: C.soft });
      V.text(credits, '参考：The Rustonomicon · Subtyping and Variance   |   rustc-dev-guide · Variance of type and lifetime parameters', { y: 44, 'font-size': 22, fill: C.soft });
      const confetti = [0, 1, 2].map((i) => V.Burst(g, { n: 40, seed: 30 + i, shape: 'rect', colors: [C.claude, C.rust, C.co, C.contra, C.bi, C.gold], spread: 700, gravity: 700 }));

      const claude = V.Claude(g, { seed: 3 });
      const ferris = V.Ferris(g, { seed: 5 });
      return (t) => {
        bg.update(t);
        const out = V.fout(t, L[3], 0.5);
        pols.forEach((p, i) => {
          const at = L[i] + 0.2;
          const k = V.ep(t, at, at + 0.7, 'outBack');
          p.at(V.lerp(960, 420 + i * 540, k), V.lerp(1300, 430 + (i === 1 ? -20 : 20), k), 1, V.lerp(30, [-6, 3, 7][i], k), out);
        });
        // 角色
        const center = V.ep(t, L[3], L[3] + 0.8);
        const fin = V.ep(t, L[4], L[4] + 0.8);
        ferris.root.at(V.lerp(1700, V.lerp(1080, 1180, fin), center), V.lerp(870, V.lerp(700, 760, fin), center), V.lerp(0.72, 1.0, center));
        ferris.update(t, { talk: S.talk('ferris', t), mood: t > L[3] ? 'happy' : 'neutral', raise: t > L[3] && t < L[4] ? 1 : 0.3, look: [-0.7, -0.3], snap: t > E[4] - 0.8 });
        claude.root.at(V.lerp(230, V.lerp(230, 760, fin), 1), V.lerp(770, V.lerp(770, 720, fin), 1), V.lerp(0.85, 1.0, fin));
        claude.update(t, { talk: S.talk('claude', t), mood: t > E[4] - 1 ? 'happy' : 'neutral', look: [0.7, -0.2], burst: Math.max(0, 1 - Math.abs(t - (E[4] - 0.5)) * 1.5) * 0.6 });
        shield.at(V.lerp(1700, 1180, center), V.lerp(870, 420, center) + Math.sin(t * 2) * 6, V.inn(t, L[3] + 0.3) * (1 - fin), -6, 1);
        thanks.at(960, 290, V.inn(t, E[4] - 0.7, 0.7));
        credits.at(960, 960, 1, 0, V.fin(t, E[4] + 1.2, 0.8));
        confetti.forEach((c, i) => {
          c.at(460 + i * 500, 120);
          c.update(V.p(t, E[4] - 0.6 + i * 0.25, E[4] + 3.4 + i * 0.25));
        });
      };
    },
  });
})();
