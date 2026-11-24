// Блок-холст: перо, маркер и ластик. Штрихи хранятся векторно и перерисовываются под любой масштаб.
import { h } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

const COLORS = [
  ['ink', 'draw.ink'], ['#e03e3e', 'color.red'], ['#d9730d', 'color.orange'], ['#dfab01', 'color.yellow'],
  ['#0f9d58', 'color.green'], ['#2383e2', 'color.blue'], ['#9065b0', 'color.purple'],
];
const SIZES = [2, 4, 8];
const MARKER_ALPHA = 0.35;
const state = { tool: 'pen', color: 'ink', size: 1 }; // общий выбор инструмента для всех холстов

function trace(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  if (p.length === 2) { ctx.lineTo(p[0] + 0.01, p[1] + 0.01); }
  for (let i = 2; i < p.length - 2; i += 2) {
    ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
  }
  if (p.length > 2) ctx.lineTo(p[p.length - 2], p[p.length - 1]);
  ctx.stroke();
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

export function createDrawing(block, { onChange, assetUrl, signal }) {
  block.strokes ||= [];
  block.h ||= 280;

  const base = h('canvas', { class: 'draw-base' });
  const live = h('canvas', { class: 'draw-live' });
  const stage = h('div', { class: 'draw-stage' }, base, live, h('div', { class: 'draw-hint' }, t('draw.hint')));
  const bar = h('div', { class: 'draw-bar' });
  const resizer = h('div', { class: 'draw-resize', title: t('draw.resize') });
  const root = h('div', { class: 'draw' }, bar, stage, resizer);
  const bctx = base.getContext('2d');
  const lctx = live.getContext('2d');
  let k = 1, dpr = 1, lastW = 0, ink = '#37352f';

  if (block.bg) {
    stage.style.backgroundImage = `url("${assetUrl(block.bg)}")`;
    stage.classList.add('has-bg');
  }

  const colorOf = (c) => (c === 'ink' ? ink : c);

  function paint(ctx, s) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colorOf(s.c);
    ctx.lineWidth = s.w;
    trace(ctx, s.p);
  }

  function redraw() {
    ink = block.bg ? '#1f1f1f' : getComputedStyle(root).color;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, base.width, base.height);
    bctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    for (const s of block.strokes) {
      bctx.globalAlpha = s.t === 'm' ? MARKER_ALPHA : 1;
      paint(bctx, s);
    }
    bctx.globalAlpha = 1;
    stage.classList.toggle('empty', !block.strokes.length && !block.bg);
  }

  function layout(force) {
    const w = stage.clientWidth;
    if (!w || (!force && w === lastW && dpr === devicePixelRatio)) return;
    lastW = w;
    dpr = devicePixelRatio || 1;
    if (!block.bw) block.bw = w;
    k = w / block.bw;
    const hh = Math.round(block.h * k);
    stage.style.height = hh + 'px';
    for (const c of [base, live]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(hh * dpr);
    }
    redraw();
  }

  const ro = new ResizeObserver(() => layout());
  ro.observe(stage);
  addEventListener('resize', () => layout(), { signal });
  addEventListener('themechange', () => redraw(), { signal });
  signal?.addEventListener('abort', () => ro.disconnect());

  /* ── Рисование ── */

  let cur = null, erasing = false, erased = false, frame = 0;

  const local = (e) => {
    const r = stage.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / k) * 10) / 10, Math.round(((e.clientY - r.top) / k) * 10) / 10];
  };

  function renderLive() {
    frame = 0;
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.clearRect(0, 0, live.width, live.height);
    if (!cur) return;
    lctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    paint(lctx, cur);
  }

  function eraseAt([x, y]) {
    const r = 9 / k;
    const keep = block.strokes.filter((s) => {
      const p = s.p, reach = r + s.w / 2;
      if (p.length === 2) return Math.hypot(p[0] - x, p[1] - y) > reach;
      for (let i = 0; i < p.length - 2; i += 2) {
        if (distToSegment(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= reach) return false;
      }
      return true;
    });
    if (keep.length !== block.strokes.length) { block.strokes = keep; erased = true; redraw(); }
  }

  live.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    live.setPointerCapture(e.pointerId);
    root.classList.add('drawing');
    if (state.tool === 'eraser') { erasing = true; erased = false; eraseAt(local(e)); return; }
    const marker = state.tool === 'marker';
    cur = { t: marker ? 'm' : 'p', c: state.color, w: SIZES[state.size] * (marker ? 4 : 1), p: local(e) };
    live.style.opacity = marker ? MARKER_ALPHA : 1;
    renderLive();
  });

  live.addEventListener('pointermove', (e) => {
    if (erasing) { eraseAt(local(e)); return; }
    if (!cur) return;
    for (const ev of e.getCoalescedEvents?.() || [e]) {
      const [x, y] = local(ev);
      const n = cur.p.length;
      if (Math.hypot(x - cur.p[n - 2], y - cur.p[n - 1]) >= 0.8) cur.p.push(x, y);
    }
    if (!frame) frame = requestAnimationFrame(renderLive);
  });

  const finish = () => {
    root.classList.remove('drawing');
    if (erasing) { erasing = false; if (erased) onChange(); return; }
    if (!cur) return;
    const stroke = cur;
    cur = null;
    block.strokes = [...block.strokes, stroke];
    bctx.globalAlpha = stroke.t === 'm' ? MARKER_ALPHA : 1;
    paint(bctx, stroke);
    bctx.globalAlpha = 1;
    stage.classList.remove('empty');
    cancelAnimationFrame(frame);
    renderLive();
    onChange();
  };
  live.addEventListener('pointerup', finish);
  live.addEventListener('pointercancel', finish);

  /* ── Панель инструментов ── */

  function buildBar() {
    const tool = (name, ic, title) => h('button', {
      class: 'draw-btn' + (state.tool === name ? ' on' : ''), title, html: icon(ic, 16),
      onclick: () => { state.tool = name; buildBar(); },
    });
    bar.replaceChildren(
      tool('pen', 'pen', t('draw.pen')), tool('marker', 'marker', t('draw.marker')), tool('eraser', 'eraser', t('draw.eraser')),
      h('span', { class: 'draw-sep' }),
      ...COLORS.map(([c, key]) => h('button', {
        class: 'draw-color' + (state.color === c ? ' on' : ''), title: t(key),
        style: { '--c': c === 'ink' ? 'var(--text-solid)' : c },
        onclick: () => { state.color = c; if (state.tool === 'eraser') state.tool = 'pen'; buildBar(); },
      })),
      h('span', { class: 'draw-sep' }),
      ...SIZES.map((s, i) => h('button', {
        class: 'draw-btn draw-size' + (state.size === i ? ' on' : ''), title: t('draw.size', { n: i + 1 }),
        onclick: () => { state.size = i; buildBar(); },
      }, h('span', { style: { width: 4 + i * 4 + 'px', height: 4 + i * 4 + 'px' } }))),
      h('span', { class: 'draw-sep' }),
      h('button', {
        class: 'draw-btn', title: t('draw.undo'), html: icon('undo', 16),
        onclick: () => { if (block.strokes.length) { block.strokes = block.strokes.slice(0, -1); redraw(); onChange(); } },
      }),
      h('button', {
        class: 'draw-btn', title: t('draw.clear'), html: icon('trash', 16),
        onclick: () => { if (block.strokes.length) { block.strokes = []; redraw(); onChange(); } },
      }));
    stage.dataset.tool = state.tool;
  }
  buildBar();
  root.addEventListener('pointerenter', buildBar);

  /* ── Изменение высоты ── */

  resizer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    resizer.setPointerCapture(e.pointerId);
    const startY = e.clientY, startH = block.h;
    const move = (ev) => { block.h = Math.max(100, Math.round(startH + (ev.clientY - startY) / k)); layout(true); };
    const up = () => {
      resizer.removeEventListener('pointermove', move);
      resizer.removeEventListener('pointerup', up);
      if (block.h !== startH) onChange();
    };
    resizer.addEventListener('pointermove', move);
    resizer.addEventListener('pointerup', up);
  });

  return root;
}
