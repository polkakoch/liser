// Граф связей между страницами: силовая раскладка на canvas, масштаб, перетаскивание, фильтр.
import { h, clamp, debounce } from './util.js';
import { icon } from './icons.js';
import { t, tn } from './i18n.js';
import * as store from './store.js';

const DEFAULTS = { tree: true, orphans: true, labels: true, depth: 2 };

// Псевдослучайное, но стабильное число по id — чтобы раскладка была похожей при каждом открытии
function hash(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return ((x >>> 0) % 10000) / 10000;
}

export function renderGraph(scrollEl, app, route, data) {
  const opts = { ...DEFAULTS, ...(store.settings.graph || {}) };
  const focusId = route.id && store.meta(route.id) && !store.isTrashed(route.id) ? route.id : null;
  const currentId = focusId || (app.lastPageId && store.meta(app.lastPageId) ? app.lastPageId : null);

  const canvas = h('canvas', { class: 'graph-canvas' });
  const filter = h('input', { class: 'input graph-filter', type: 'search', placeholder: t('graph.filter'), spellcheck: 'false' });
  const tools = h('div', { class: 'graph-tools' });
  const stats = h('div', { class: 'graph-stats' });
  const hint = h('div', { class: 'graph-hint' }, t('graph.hint'));
  const empty = h('div', { class: 'graph-empty', hidden: true },
    h('div', { class: 'empty-ico', html: icon('graph', 26) }),
    h('div', { class: 'empty-title' }, t('graph.emptyTitle')),
    h('div', { class: 'empty-text' }, t('graph.emptyText')));
  const wrap = h('div', { class: 'graph' }, canvas, h('div', { class: 'graph-bar' }, filter, tools), empty, stats, hint);
  scrollEl.replaceChildren(wrap);
  scrollEl.classList.add('no-scroll');
  const ctx2 = canvas.getContext('2d');

  /* ── Данные ── */

  let nodes = [], edges = [], byId = new Map(), adj = new Map();
  const prevPos = new Map();

  function build() {
    for (const n of nodes) prevPos.set(n.id, n);
    const pair = (l) => (l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a);
    const real = new Set(data.links.filter((l) => !l.tree).map(pair));
    const links = data.links.filter((l) => !l.tree || (opts.tree && !real.has(pair(l))));
    const fullAdj = new Map();
    const link = (a, b) => { (fullAdj.get(a) || fullAdj.set(a, new Set()).get(a)).add(b); };
    for (const l of links) { link(l.a, l.b); link(l.b, l.a); }

    let keep;
    if (focusId) {
      // Локальный граф: страницы на расстоянии не больше depth
      keep = new Set([focusId]);
      let ring = [focusId];
      for (let d = 0; d < opts.depth; d++) {
        const next = [];
        for (const id of ring) for (const x of fullAdj.get(id) || []) if (!keep.has(x)) { keep.add(x); next.push(x); }
        ring = next;
      }
    } else keep = new Set(data.nodes.map((m) => m.id));
    if (!opts.orphans && !focusId) for (const id of [...keep]) if (!fullAdj.get(id)?.size) keep.delete(id);

    byId = new Map();
    nodes = data.nodes.filter((m) => keep.has(m.id)).map((m, i) => {
      const old = prevPos.get(m.id);
      const a = hash(m.id) * Math.PI * 2, rr = 40 + Math.sqrt(i + 1) * 34;
      const n = {
        id: m.id, m, title: m.title || t('untitled'), icon: m.icon || '',
        x: old ? old.x : Math.cos(a) * rr, y: old ? old.y : Math.sin(a) * rr, vx: 0, vy: 0, deg: 0, r: 5, fixed: false,
      };
      const short = n.title.length > 32 ? n.title.slice(0, 31) + '…' : n.title;
      n.label = (n.icon ? n.icon + ' ' : '') + short;
      n.rtl = /^[^A-Za-zÀ-ɏЀ-ӿ֐-ࣿ]*[֐-ࣿ]/.test(n.title);
      byId.set(m.id, n);
      return n;
    });
    edges = links.filter((l) => byId.has(l.a) && byId.has(l.b)).map((l) => ({ a: byId.get(l.a), b: byId.get(l.b), tree: !!l.tree }));
    adj = new Map(nodes.map((n) => [n, new Set()]));
    for (const e of edges) { e.a.deg++; e.b.deg++; adj.get(e.a).add(e.b); adj.get(e.b).add(e.a); }
    for (const n of nodes) n.r = 4.5 + Math.min(10, Math.sqrt(n.deg) * 2.2);
    const linkCount = edges.filter((e) => !e.tree).length;
    stats.textContent = `${tn('graph.pages', nodes.length)} · ${tn('graph.links', linkCount)}`;
    empty.hidden = data.links.some((l) => !l.tree);
  }

  /* ── Физика ── */

  let alpha = 1;
  const GRID = 140;

  function tick() {
    const n = nodes.length;
    const rep = 1400 * alpha;
    if (n <= 450) {
      for (let i = 0; i < n; i++) {
        const p = nodes[i];
        for (let j = i + 1; j < n; j++) {
          const q = nodes[j];
          let dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
          if (d2 > 250000) continue;
          const f = rep / d2;
          p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f;
        }
      }
    } else {
      // Много страниц: отталкиваются только соседи по сетке
      const cells = new Map();
      for (const p of nodes) {
        const k = Math.floor(p.x / GRID) + ',' + Math.floor(p.y / GRID);
        (cells.get(k) || cells.set(k, []).get(k)).push(p);
      }
      for (const p of nodes) {
        const cx = Math.floor(p.x / GRID), cy = Math.floor(p.y / GRID);
        for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
          for (const q of cells.get(gx + ',' + gy) || []) {
            if (q === p) continue;
            const dx = p.x - q.x, dy = p.y - q.y, d2 = Math.max(1, dx * dx + dy * dy);
            const f = rep / d2 / 2;
            p.vx += dx * f; p.vy += dy * f;
          }
        }
      }
    }
    for (const e of edges) {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const len = e.tree ? 62 : 80;
      const f = ((d - len) / d) * (e.tree ? 0.05 : 0.07) * alpha;
      e.a.vx += dx * f; e.a.vy += dy * f; e.b.vx -= dx * f; e.b.vy -= dy * f;
    }
    for (const p of nodes) {
      p.vx -= p.x * 0.008 * alpha;
      p.vy -= p.y * 0.008 * alpha;
      if (p.fixed) { p.vx = p.vy = 0; continue; }
      p.vx *= 0.58; p.vy *= 0.58;
      p.x += clamp(p.vx, -40, 40);
      p.y += clamp(p.vy, -40, 40);
    }
    alpha *= 0.986;
  }

  /* ── Вид и цвета ── */

  const view = { x: 0, y: 0, k: 1 };
  let W = 0, H = 0, dpr = 1, colors = {};
  let hover = null, drag = null, userMoved = false;
  let match = null;

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name) => cs.getPropertyValue(name).trim();
    colors = { bg: v('--bg'), text: v('--text'), text2: v('--text2'), text3: v('--text3'), line: v('--border2'), accent: v('--accent'), font: v('--sans') };
  }

  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = devicePixelRatio || 1;
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    draw();
  }

  function fit(animate) {
    if (!nodes.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of nodes) { x0 = Math.min(x0, n.x - n.r); y0 = Math.min(y0, n.y - n.r); x1 = Math.max(x1, n.x + n.r); y1 = Math.max(y1, n.y + n.r); }
    const k = clamp(Math.min((W - 120) / (x1 - x0 || 1), (H - 160) / (y1 - y0 || 1)), 0.2, 1.6);
    const target = { k, x: -(x0 + x1) / 2, y: -(y0 + y1) / 2 + 10 / k };
    if (!animate) { Object.assign(view, target); return draw(); }
    const from = { ...view }, start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 320), e = 1 - (1 - p) ** 3;
      view.k = from.k + (target.k - from.k) * e;
      view.x = from.x + (target.x - from.x) * e;
      view.y = from.y + (target.y - from.y) * e;
      draw();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const sx = (x) => (x + view.x) * view.k + W / 2;
  const sy = (y) => (y + view.y) * view.k + H / 2;
  const wx = (px) => (px - W / 2) / view.k - view.x;
  const wy = (py) => (py - H / 2) / view.k - view.y;

  function draw() {
    const c = ctx2;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const focus = hover || (drag?.node ?? null);
    const near = focus ? adj.get(focus) : null;
    const lit = (n) => (match ? match.has(n) : focus ? n === focus || near.has(n) : true);

    c.lineWidth = Math.max(0.6, Math.min(1.4, view.k));
    for (const e of edges) {
      const on = focus && (e.a === focus || e.b === focus);
      const dim = (focus && !on) || (match && !(match.has(e.a) && match.has(e.b)));
      c.globalAlpha = dim ? 0.12 : e.tree ? 0.55 : 0.9;
      c.strokeStyle = on ? colors.accent : colors.line;
      c.setLineDash(e.tree ? [3, 4] : []);
      c.beginPath();
      c.moveTo(sx(e.a.x), sy(e.a.y));
      c.lineTo(sx(e.b.x), sy(e.b.y));
      c.stroke();
    }
    c.setLineDash([]);

    const showLabels = opts.labels;
    const labelAlpha = clamp((view.k - 0.45) / 0.35, 0, 1);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = `${12}px ${colors.font}`;
    for (const n of nodes) {
      const x = sx(n.x), y = sy(n.y), r = n.r * Math.sqrt(view.k);
      if (x < -60 || y < -60 || x > W + 60 || y > H + 60) continue;
      const on = lit(n);
      const isCur = n.id === currentId;
      c.globalAlpha = on ? 1 : 0.18;
      c.fillStyle = n === focus || isCur ? colors.accent : near?.has(n) ? colors.text : colors.text2;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      if (isCur) {
        c.strokeStyle = colors.accent;
        c.lineWidth = 1.5;
        c.globalAlpha = on ? 0.35 : 0.1;
        c.beginPath();
        c.arc(x, y, r + 4, 0, Math.PI * 2);
        c.stroke();
      }
      const force = n === focus || near?.has(n) || (match && match.has(n));
      const a = force ? 1 : showLabels ? labelAlpha * (on ? 1 : 0.25) : 0;
      if (a > 0.02) {
        c.globalAlpha = a;
        c.fillStyle = n === focus ? colors.text : colors.text2;
        c.direction = n.rtl ? 'rtl' : 'ltr';
        c.fillText(n.label, x, y + r + 4);
      }
    }
    c.globalAlpha = 1;
  }

  /* ── Анимация: только пока граф «остывает» ── */

  let raf = 0;
  const loop = () => {
    raf = 0;
    tick();
    if (!userMoved && alpha > 0.3) fit(false);
    draw();
    if (alpha > 0.004 || drag?.node) raf = requestAnimationFrame(loop);
  };
  const heat = (a) => { alpha = Math.max(alpha, a); if (!raf) raf = requestAnimationFrame(loop); };

  /* ── Мышь ── */

  function hit(px, py) {
    const x = wx(px), y = wy(py);
    let best = null, bd = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      const r = (n.r * Math.sqrt(view.k) + 5) / view.k;
      if (d < r && d < bd) { best = n; bd = d; }
    }
    return best;
  }
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const [px, py] = local(e);
    const node = hit(px, py);
    canvas.setPointerCapture(e.pointerId);
    drag = { node, px, py, vx: view.x, vy: view.y, moved: false };
    if (node) { node.fixed = true; heat(0.25); }
    canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    const [px, py] = local(e);
    if (drag) {
      if (Math.hypot(px - drag.px, py - drag.py) > 4) drag.moved = true;
      if (drag.node) { drag.node.x = wx(px); drag.node.y = wy(py); heat(0.12); }
      else { view.x = drag.vx + (px - drag.px) / view.k; view.y = drag.vy + (py - drag.py) / view.k; userMoved = true; draw(); }
      return;
    }
    const n = hit(px, py);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : ''; draw(); }
  });
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    canvas.classList.remove('grabbing');
    if (d.node) { d.node.fixed = false; if (d.moved) userMoved = true; }
    if (d.node && !d.moved && e.type === 'pointerup') app.navigate({ type: 'page', id: d.node.id });
    draw();
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; draw(); } });
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // Ctrl+колесо — масштаб всего приложения
    e.preventDefault();
    const [px, py] = local(e);
    const x = wx(px), y = wy(py);
    view.k = clamp(view.k * Math.exp(-e.deltaY * 0.0015), 0.15, 4);
    view.x = (px - W / 2) / view.k - x;
    view.y = (py - H / 2) / view.k - y;
    userMoved = true;
    draw();
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => { if (!hit(...local(e))) { userMoved = true; fit(true); } });

  /* ── Панель управления ── */

  const save = () => store.setSettings({ graph: { tree: opts.tree, orphans: opts.orphans, labels: opts.labels, depth: opts.depth } });
  const toggleBtn = (key, label) => {
    const btn = h('button', { class: 'graph-opt' + (opts[key] ? ' on' : ''), 'aria-pressed': String(!!opts[key]) }, h('span', { class: 'switch' + (opts[key] ? ' on' : '') }), h('span', null, label));
    btn.addEventListener('click', () => {
      opts[key] = !opts[key];
      btn.classList.toggle('on', opts[key]);
      btn.querySelector('.switch').classList.toggle('on', opts[key]);
      btn.setAttribute('aria-pressed', String(opts[key]));
      save();
      if (key === 'labels') draw(); else { build(); applyFilter(); heat(0.5); }
    });
    return btn;
  };
  function renderTools() {
    tools.replaceChildren();
    if (focusId) {
      const m = store.meta(focusId);
      const depthSel = h('select', { class: 'select graph-depth', title: t('graph.depth') },
        [1, 2, 3].map((d) => h('option', { value: d, ...(d === opts.depth && { selected: true }) }, t('graph.depthN', { n: d }))));
      depthSel.addEventListener('change', () => { opts.depth = +depthSel.value; save(); build(); applyFilter(); heat(0.6); });
      tools.append(
        h('span', { class: 'graph-chip' }, h('span', { class: 'graph-chip-ico', html: m.icon ? '' : icon('page', 14) }, m.icon || ''), h('span', { class: 'graph-chip-title' }, m.title || t('untitled'))),
        depthSel,
        h('button', { class: 'graph-opt', onclick: () => app.navigate({ type: 'graph' }) }, h('span', { html: icon('graph', 15) }), h('span', null, t('graph.global'))));
    } else if (currentId) {
      tools.append(h('button', { class: 'graph-opt', onclick: () => app.navigate({ type: 'graph', id: currentId }) }, h('span', { html: icon('page', 15) }), h('span', null, t('graph.local'))));
    }
    tools.append(toggleBtn('tree', t('graph.tree')));
    if (!focusId) tools.append(toggleBtn('orphans', t('graph.orphans')));
    tools.append(toggleBtn('labels', t('graph.labels')),
      h('button', { class: 'icon-btn', title: t('graph.fit'), html: icon('fit', 18), onclick: () => { userMoved = true; fit(true); } }));
  }

  function applyFilter() {
    const q = filter.value.trim().toLowerCase();
    match = q ? new Set(nodes.filter((n) => n.title.toLowerCase().includes(q))) : null;
    draw();
  }
  filter.addEventListener('input', debounce(applyFilter, 60));
  filter.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && match?.size) {
      const n = [...match][0];
      app.navigate({ type: 'page', id: n.id });
    } else if (e.key === 'Escape' && filter.value) { e.stopPropagation(); filter.value = ''; applyFilter(); }
  });

  /* ── Запуск ── */

  readColors();
  build();
  renderTools();
  // Предварительный прогон: граф появляется уже почти разложенным
  const warm = nodes.length > 800 ? 60 : 140;
  for (let i = 0; i < warm; i++) tick();
  const ro = new ResizeObserver(() => resize());
  ro.observe(wrap);
  resize();
  fit(false);
  heat(alpha);
  const onTheme = () => { readColors(); draw(); };
  addEventListener('themechange', onTheme);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('themechange', onTheme);
      scrollEl.classList.remove('no-scroll');
    },
  };
}
