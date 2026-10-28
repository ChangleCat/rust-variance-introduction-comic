// 动画引擎：SVG 工具、缓动、场景注册。
// 约定：场景的 build() 只创建元素，返回 update(t)；update 必须是 t 的纯函数，
// 这样进度条可以任意拖动，视频导出也能逐帧复现。
(function () {
  const V = (window.V = window.V || {});
  const NS = 'http://www.w3.org/2000/svg';

  V.uid = 1;
  V.W = 1920;
  V.H = 1080;

  V.C = {
    paper: '#FBF6EE',
    paper2: '#F3EADB',
    ink: '#2B2522',
    soft: '#6B5F57',
    line: '#D9CDBD',
    claude: '#D97757',
    claudeDark: '#B05A3C',
    rust: '#F74C00',
    rustDark: '#A63300',
    co: '#22A06B',
    contra: '#3B82F6',
    inv: '#E5484D',
    bi: '#8E4EC6',
    gold: '#E8A93B',
    code: '#1F1D2B',
    codeLine: '#2C2940',
    white: '#FFFFFF',
  };
  V.FONT = '"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';
  V.MONO = '"JetBrains Mono","SF Mono",Menlo,Consolas,"PingFang SC",monospace';

  // ---------- DOM ----------
  V.el = function (tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) V.set(e, attrs);
    if (parent) parent.appendChild(e);
    return e;
  };
  V.set = function (e, attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined) continue;
      if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    return e;
  };
  V.g = (parent, attrs) => V.el('g', attrs, parent);
  V.text = function (parent, str, attrs) {
    const a = Object.assign({ 'font-family': V.FONT, fill: V.C.ink, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, attrs);
    const t = V.el('text', a, parent);
    const lines = String(str).split('\n');
    if (lines.length === 1) t.textContent = str;
    else {
      const lh = (a['line-height'] || 1.3) * parseFloat(a['font-size'] || 32);
      lines.forEach((ln, i) => {
        V.el('tspan', { x: a.x || 0, dy: i === 0 ? -((lines.length - 1) * lh) / 2 : lh, text: ln }, t);
      });
    }
    return t;
  };

  // 可动画的“演员”：每帧调用 at(x, y, s, r, o)
  V.A = function (parent, attrs) {
    const g = V.el('g', attrs, parent);
    g._o = -1;
    g.at = function (x, y, s, r, o) {
      s = s === undefined ? 1 : s;
      r = r || 0;
      o = o === undefined ? 1 : o;
      let tf = `translate(${x.toFixed(2)} ${y.toFixed(2)})`;
      if (r) tf += ` rotate(${r.toFixed(2)})`;
      if (s !== 1) tf += ` scale(${Math.max(0.0001, s).toFixed(4)})`;
      g.setAttribute('transform', tf);
      V.op(g, o);
      return g;
    };
    return g;
  };
  V.op = function (e, o) {
    o = V.clamp(o, 0, 1);
    if (e._o === o) return;
    e._o = o;
    e.setAttribute('opacity', o.toFixed(3));
    e.style.display = o <= 0.001 ? 'none' : '';
  };

  // ---------- 数学 ----------
  V.clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  V.lerp = (a, b, k) => a + (b - a) * k;
  V.p = (t, a, b) => (b <= a ? (t >= a ? 1 : 0) : V.clamp((t - a) / (b - a), 0, 1));
  V.E = {
    linear: (k) => k,
    in: (k) => k * k * k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outBack: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
    inBack: (k) => 2.70158 * k * k * k - 1.70158 * k * k,
    outElastic: (k) => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    outBounce: (k) => {
      const n1 = 7.5625, d1 = 2.75;
      if (k < 1 / d1) return n1 * k * k;
      if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75;
      if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375;
      return n1 * (k -= 2.625 / d1) * k + 0.984375;
    },
  };
  V.ep = (t, a, b, e) => V.E[e || 'inOut'](V.p(t, a, b));
  // 出现（带回弹）与消失
  V.inn = (t, at, d) => V.ep(t, at, at + (d || 0.45), 'outBack');
  V.fin = (t, at, d) => V.ep(t, at, at + (d || 0.4), 'out');
  V.fout = (t, at, d) => 1 - V.ep(t, at, at + (d || 0.4), 'inOut');
  V.win = (t, a, b, d) => V.fin(t, a, d) * V.fout(t, b, d); // a 出现、b 消失
  V.osc = (t, f, ph) => Math.sin(t * Math.PI * 2 * (f || 1) + (ph || 0));
  V.mix = function (c1, c2, k) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(V.lerp(a >> 16, b >> 16, k)), g = Math.round(V.lerp((a >> 8) & 255, (b >> 8) & 255, k)), bl = Math.round(V.lerp(a & 255, b & 255, k));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  };
  V.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------- 场景注册 ----------
  V.sceneDefs = {};
  V.defScene = function (id, def) {
    V.sceneDefs[id] = def;
  };

  // 一次性挂到场景根上的工具：节拍点、说话检测
  V.makeCtx = function (root, scene) {
    const S = {
      root,
      scene,
      L: scene.lineStarts,
      E: scene.lineEnds,
      dur: scene.dur,
      lines: scene.lines,
      // 当前 t 时谁在说话（返回 0..1 的说话强度，便于口型平滑）
      talk(who, t) {
        for (let i = 0; i < scene.lines.length; i++) {
          if (scene.lines[i].who !== who) continue;
          const a = S.L[i], b = S.E[i];
          if (t >= a && t <= b) return V.p(t, a, a + 0.15) * (1 - V.p(t, b - 0.15, b));
        }
        return 0;
      },
    };
    return S;
  };
})();
