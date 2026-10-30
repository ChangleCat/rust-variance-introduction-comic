// 开场：Ferris 的困惑，引出“型变”。
(function () {
  const V = window.V, C = V.C;

  V.defScene('op_hook', {
    pauses: { 2: 0.3, 4: 0.45 },
    sfx: (S) => {
      const { L, E } = S, d4 = E[4] - L[4];
      return [
        [0.1, 'step'], [0.75, 'step'], [L[0] - 0.1, 'snap'],
        [L[1] + 0.2, 'pop'], [L[1] + 0.9, 'swish'], [L[1] + 1.9, 'ok'],
        [L[2] + 0.2, 'pop'], [L[2] + 0.9, 'swish'], [L[2] + 1.5, 'error'],
        [L[3] - 0.3, 'whoosh'], [L[3] + 0.6, 'sparkle'], [L[3] + (E[3] - L[3]) * 0.72, 'ding'],
        ...[0, 1, 2, 3].map((i) => [L[4] + d4 * (0.2 + i * 0.12), 'pop2']),
        [E[4] + 0.2, 'chime'],
        [L[5] + 0.2, 'step'], [L[5] + 1.6, 'meow'],
      ];
    },
    build(S) {
      const { L, E } = S;
      const bg = V.Background(S.root, { seed: 1 });
      const stage = V.g(S.root);

      // 两行“现象”
      function row(y, left, right) {
        const g = V.A(stage);
        const a = V.Pill(g, left, { fs: 36, mono: true, fill: C.gold, color: C.ink });
        const b = V.Pill(g, right, { fs: 36, mono: true, fill: '#fff', color: C.ink, stroke: C.ink, sw: 3 });
        const arrow = V.Arrow(g, { color: C.ink, width: 6 });
        return { g, a, b, arrow, y };
      }
      const r1 = row(300, "&'static str", "需要 &'a str");
      const r2 = row(470, "&mut &'static str", "需要 &mut &'a str");
      const ok = V.Check(stage, { r: 42 }), bad = V.Cross(stage, { r: 42 });
      const huh = V.text(stage, '？！', { 'font-size': 80, fill: C.inv, 'font-weight': 800 });

      // 标题
      const title = V.A(stage);
      V.text(title, '型变', { 'font-size': 190, 'font-weight': 900, fill: C.ink, 'letter-spacing': 20 });
      V.text(title, 'V A R I A N C E', { y: 125, 'font-size': 40, fill: C.claude, 'font-weight': 700, 'letter-spacing': 6, 'font-family': V.MONO });
      const halo = V.el('circle', { cx: 960, cy: 360, r: 10, fill: 'none', stroke: C.claude, 'stroke-width': 6 }, stage);
      const sparks = V.Burst(stage, { n: 26, seed: 5, spread: 380, gravity: 90 });
      const kinds = ['co', 'contra', 'inv', 'bi'];
      const badges = kinds.map((k) => V.Badge(stage, k, { r: 46, label: true, labelFs: 32 }));

      const cast = V.cast(S, { claudePos: [330, 660] });
      const cat = V.Cat(S.root, { seed: 3 });

      const tag = V.sceneTag(S, '开场 · 一个怪现象', C.rust);

      return (t) => {
        bg.update(t);
        tag(t);
        const d4 = E[4] - L[4];
        // 行 1
        const rowOut = V.fout(t, L[3] + 0.2, 0.5);
        [[r1, L[1]], [r2, L[2]]].forEach(([r, at], i) => {
          const k = V.inn(t, at + 0.1);
          r.g.at(0, r.y + (1 - rowOut) * -60, 1, 0, Math.min(1, k * 2) * rowOut);
          r.a.at(V.lerp(200, 520, V.ep(t, at + 0.1, at + 0.6, 'out')) + (i ? -40 : 0), 0, k);
          const kb = V.inn(t, at + 0.7);
          r.b.at(1150 + (i ? 40 : 0), 0, kb);
          const ka = V.ep(t, at + 0.7, at + 1.3);
          r.arrow.set(i ? 760 : 700, 0, i ? 880 : 900, 0, ka);
        });
        ok.at(1460, r1.y, V.inn(t, L[1] + 1.8), 0, rowOut);
        bad.at(1500, r2.y, V.inn(t, L[2] + 1.4), V.osc(t, 6) * 6 * V.p(t, L[2] + 1.4, L[2] + 1.8) * (1 - V.p(t, L[2] + 1.8, L[2] + 2.4)), rowOut);
        V.set(huh, { x: 1500, y: 600 });
        V.op(huh, V.win(t, L[2] + 1.6, L[3] - 0.2, 0.2));

        // 标题出现
        const tk = V.inn(t, L[3] + 0.6, 0.7);
        const up = V.ep(t, L[5], L[5] + 1, 'inOut');
        title.at(960, V.lerp(380, 300, up), V.lerp(1, 0.78, up) * tk, 0, Math.min(1, tk * 2));
        const hk = V.p(t, L[3] + 0.5, L[3] + 1.4);
        V.set(halo, { r: 60 + hk * 420, 'stroke-width': 10 * (1 - hk) + 0.1, cy: 380 });
        V.op(halo, hk > 0 && hk < 1 ? 1 - hk : 0);
        sparks.at(960, 380);
        sparks.update(V.p(t, L[3] + 0.6, L[3] + 2));
        badges.forEach((b, i) => {
          const at = L[4] + d4 * (0.2 + i * 0.12);
          const k = V.inn(t, at, 0.5);
          b.at(960 + (i - 1.5) * 250, V.lerp(640, 560, up) + Math.sin(t * 2 + i) * 4, k * V.lerp(1, 0.85, up), 0, Math.min(1, k * 3));
        });

        // 猫
        const ck = V.ep(t, L[5] + 0.2, L[5] + 1.6, 'out');
        cat.root.at(V.lerp(-120, 820, ck), 860, 1.15, 0, V.p(t, L[5] + 0.1, L[5] + 0.3));
        cat.update(t, { hop: ck > 0 && ck < 1 ? 0.6 : 0, tilt: ck >= 1 ? 8 : 0 });

        // 角色
        const fin = V.ep(t, 0, 1.3, 'out');
        const ferrisScared = t > L[2] + 1.4 && t < L[3] + 0.5;
        const cIn = V.ep(t, L[3] - 0.4, L[3] + 0.6, 'outBack');
        cast.update(t, {
          ferris: {
            pos: [V.lerp(2150, 1560, fin), 830],
            walk: fin < 1 ? 1 : 0,
            mood: ferrisScared ? 'scared' : t > L[5] + 1 ? 'surprised' : t > L[2] && t < L[3] ? 'worried' : 'neutral',
            look: t > L[5] ? [-1, 0.6] : t > L[3] - 0.5 ? [-1, -0.2] : [-0.8, -0.8],
          },
          claude: {
            pos: [V.lerp(-220, 330, cIn), V.lerp(260, 680, cIn)],
            o: V.p(t, L[3] - 0.4, L[3] - 0.2),
            burst: Math.max(0, 1 - Math.abs(t - (L[3] + 0.6)) * 1.5) * 0.7,
            mood: t > L[3] + 0.3 && t < L[3] + 1.5 ? 'happy' : 'neutral',
            look: t > L[5] + 0.8 ? [0.8, 0.8] : [0.8, -0.2],
          },
        });
      };
    },
  });
})();
