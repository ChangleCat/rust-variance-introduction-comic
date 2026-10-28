// 场景公共部件：章节卡、标准“讲解员 + 提问者”站位。
(function () {
  const V = window.V, C = V.C;

  // 标准站位：Claude 左下、Ferris 右下。返回 update(t, overrides)
  V.cast = function (S, o) {
    o = o || {};
    const layer = V.g(S.root);
    const ferris = o.ferris === false ? null : V.Ferris(layer);
    const claude = o.claude === false ? null : V.Claude(layer);
    const cpos = o.claudePos || [230, 770], fpos = o.ferrisPos || [1690, 860];
    const api = { claude, ferris, layer };
    api.update = function (t, ov) {
      ov = ov || {};
      if (claude) {
        const c = ov.claude || {};
        const p = c.pos || cpos;
        claude.root.at(p[0], p[1], c.s || o.claudeScale || 0.85, 0, c.o === undefined ? 1 : c.o);
        claude.update(t, Object.assign({ talk: S.talk('claude', t), look: [0.6, 0] }, c));
      }
      if (ferris) {
        const f = ov.ferris || {};
        const p = f.pos || fpos;
        ferris.root.at(p[0], p[1], f.s || o.ferrisScale || 0.72, f.r || 0, f.o === undefined ? 1 : f.o);
        ferris.update(t, Object.assign({ talk: S.talk('ferris', t), look: [-0.6, 0] }, f));
      }
    };
    return api;
  };

  // 角落里的场景小标题
  V.sceneTag = function (S, text, color) {
    const tag = V.Corner(S.root, text, color);
    return (t) => tag.at(48, 40, 1, 0, V.fin(t, 0.2, 0.5) * V.fout(t, S.dur - 0.6, 0.4));
  };

  // ---------- 章节卡 ----------
  V.cardDef = {
    mood: 'calm',
    sfx: () => [[0.15, 'whoosh'], [0.9, 'ding']],
    build(S) {
      const ch = S.scene.chapter;
      const bg = V.Background(S.root, { seed: ch.id.charCodeAt(2) });
      const colors = [C.claude, C.rust, C.co, C.contra, C.bi, C.inv, C.gold];
      const col = colors[(ch.id.charCodeAt(2) - 48) % colors.length];
      const ribbon = V.el('path', { fill: col, opacity: 0.9 }, S.root);
      const ribbon2 = V.el('path', { fill: C.ink, opacity: 0.9 }, S.root);
      const parts = ch.title.split(' · ');
      const numText = parts.length > 1 ? parts[0] : '';
      const titleText = parts.length > 1 ? parts[1] : parts[0];
      const num = V.A(S.root);
      V.text(num, numText, { 'font-size': 54, fill: '#fff', 'font-weight': 700, 'letter-spacing': 8 });
      const title = V.A(S.root);
      V.text(title, titleText, { 'font-size': 124, fill: '#fff', 'font-weight': 800 });
      const sub = V.A(S.root);
      V.text(sub, ch.subtitle, { 'font-size': 46, fill: '#fff', opacity: 0.9 });
      const claude = V.Claude(S.root, { seed: 2 });
      const ferris = V.Ferris(S.root, { seed: 4 });
      const sparks = V.Burst(S.root, { n: 22, seed: 11, colors: ['#fff', C.gold, col], spread: 420, gravity: 60 });
      return (t) => {
        bg.update(t);
        const k = V.ep(t, 0, 0.6, 'out'), ko = V.ep(t, S.dur - 0.5, S.dur, 'in');
        const x0 = V.lerp(-400, 0, k) + ko * 2400;
        const tilt = 60;
        ribbon.setAttribute('d', `M${x0 - 200} ${330 + tilt} L${x0 + 2120} ${330 - tilt} L${x0 + 2120} ${760 - tilt} L${x0 - 200} ${760 + tilt}Z`);
        const k2 = V.ep(t, 0.12, 0.75, 'out');
        const x1 = V.lerp(2300, 0, k2) - ko * 2400;
        ribbon2.setAttribute('d', `M${x1 - 200} ${720 + tilt} L${x1 + 2120} ${720 - tilt} L${x1 + 2120} ${790 - tilt} L${x1 - 200} ${790 + tilt}Z`);
        num.at(960, 395, 1, -1.8, V.fin(t, 0.35) * (1 - ko));
        title.at(960 + (1 - V.ep(t, 0.4, 1.0, 'out')) * 120 - ko * 300, 525, 1, -1.8, V.fin(t, 0.4) * (1 - ko));
        sub.at(960, 650, 1, -1.8, V.fin(t, 0.75) * (1 - ko));
        sparks.at(960, 540);
        sparks.update(V.p(t, 0.85, 2.0));
        claude.root.at(V.lerp(-200, 250, V.ep(t, 0.5, 1.2, 'outBack')) - ko * 500, 220, 0.6);
        claude.update(t, { mood: 'happy', burst: Math.max(0, 1 - Math.abs(t - 1.1) * 2) * 0.6 });
        ferris.root.at(V.lerp(2150, 1680, V.ep(t, 0.7, 1.4, 'outBack')) + ko * 600, 900, 0.6);
        ferris.update(t, { mood: 'happy', walk: V.p(t, 0.7, 1.4) < 1 ? 1 : 0 });
      };
    },
  };
})();
