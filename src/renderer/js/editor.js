// Блочный редактор страницы: каждый блок — отдельный элемент, текстовые блоки редактируются на месте.
import { h, uid, plainText, escapeHtml, fmtRemind, clamp, isRtlDoc } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';
import * as store from './store.js';
import { menu, popover, datePicker, emojiPicker, popoverOpen, toast } from './ui.js';
import { createDrawing } from './draw.js';
import { linkHtml, pagePicker, pageChoices, choiceList, hoverCard, hideCard } from './links.js';

const api = store.api;
const TEXT = new Set(['p', 'h1', 'h2', 'h3', 'todo', 'bullet', 'num', 'toggle', 'quote', 'callout', 'code']);
const LIST = new Set(['todo', 'bullet', 'num']);
const MAX_INDENT = 8;
export const COLORS = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];
export const COVERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const BLOCKS = [
  { type: 'p', icon: 'text', kw: 'text paragraph текст абзац טקסט פסקה' },
  { type: 'h1', icon: 'h1', kw: 'h1 heading title заголовок כותרת' },
  { type: 'h2', icon: 'h2', kw: 'h2 heading subtitle заголовок כותרת' },
  { type: 'h3', icon: 'h3', kw: 'h3 heading заголовок כותרת' },
  { type: 'todo', icon: 'todo', kw: 'todo task check checkbox задача задачи чекбокс галочка туду дела משימה משימות' },
  { type: 'bullet', icon: 'bullet', kw: 'bullet list список маркер רשימה תבליטים' },
  { type: 'num', icon: 'num', kw: 'number numbered list нумерованный список רשימה ממוספרת מספרים' },
  { type: 'toggle', icon: 'toggle', kw: 'toggle collapse fold details раскрывающийся свернуть спойлер מתקפלת קיפול' },
  { type: 'quote', icon: 'quote', kw: 'quote цитата ציטוט' },
  { type: 'callout', icon: 'bulb', kw: 'callout note highlight выноска заметка важно הערה בולטת' },
  { type: 'code', icon: 'code', kw: 'code snippet код קוד' },
  { type: 'divider', icon: 'divider', kw: 'divider line hr separator разделитель линия קו מפריד' },
  { type: 'image', icon: 'image', kw: 'image picture photo картинка изображение фото תמונה' },
  { type: 'draw', icon: 'pen', kw: 'draw drawing canvas sketch рисунок холст рисовать ציור קנבס' },
  { type: 'remind', icon: 'bell', kw: 'remind reminder date due alarm напоминание дата срок будильник תזכורת תאריך' },
  { type: 'page', icon: 'page', kw: 'page subpage страница вложенная דף' },
];

const PLACEHOLDER = {
  p: 'ph.p', h1: 'ph.h1', h2: 'ph.h2', h3: 'ph.h3', todo: 'ph.todo', bullet: 'ph.list', num: 'ph.list',
  toggle: 'ph.toggle', quote: 'ph.quote', callout: 'ph.callout', code: 'ph.code',
};

const TEXT_COLORS = [
  ['', 'color.default'], ['#8a8984', 'color.gray'], ['#a0715a', 'color.brown'], ['#d9730d', 'color.orange'], ['#c29a2e', 'color.yellow'],
  ['#4a9068', 'color.green'], ['#3b82b8', 'color.blue'], ['#9a6bbd', 'color.purple'], ['#c9568f', 'color.pink'], ['#d9534f', 'color.red'],
];
const BG_COLORS = [
  ['rgba(140,140,140,.25)', 'gray'], ['rgba(166,104,63,.22)', 'brown'], ['rgba(245,93,0,.22)', 'orange'], ['rgba(255,212,0,.3)', 'yellow'],
  ['rgba(0,135,107,.22)', 'green'], ['rgba(0,120,223,.22)', 'blue'], ['rgba(103,36,222,.2)', 'purple'], ['rgba(221,0,129,.2)', 'pink'], ['rgba(255,0,26,.2)', 'red'],
];

const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR_CHAR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;
function strongDir(text) {
  for (const ch of text) {
    if (RTL_CHAR.test(ch)) return 'rtl';
    if (LTR_CHAR.test(ch)) return 'ltr';
  }
  return null;
}
const textIsRtl = (el) => (strongDir(el.textContent) || (isRtlDoc() ? 'rtl' : 'ltr')) === 'rtl';

// Направление абзаца по первой «сильной» букве; пустой текст следует направлению интерфейса
function syncDir(el) {
  const d = strongDir(el.textContent);
  if (d) { if (el.getAttribute('dir') !== d) el.setAttribute('dir', d); } else el.removeAttribute('dir');
}

// Ссылки на удалённые страницы показываем приглушёнными
function markLinks(el) {
  for (const a of el.querySelectorAll('a[data-page]')) {
    const id = a.dataset.page;
    const dead = !store.meta(id) || store.isTrashed(id);
    if (dead) a.className = 'dead'; else a.removeAttribute('class');
  }
}

/* ───────────── Каретка ───────────── */

function caretOffset(el) {
  const s = getSelection();
  if (!s.rangeCount || !el.contains(s.focusNode)) return 0;
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setEnd(s.focusNode, s.focusOffset);
  return r.toString().length;
}

function rangeAt(el, from, to) {
  const r = document.createRange();
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n, pos = 0, started = false;
  r.selectNodeContents(el);
  r.collapse(false);
  while ((n = w.nextNode())) {
    const end = pos + n.length;
    if (!started && from <= end) { r.setStart(n, from - pos); started = true; }
    if (started && to <= end) { r.setEnd(n, to - pos); return r; }
    pos = end;
  }
  if (!started) { r.selectNodeContents(el); r.collapse(false); } else r.setEnd(el, el.childNodes.length);
  return r;
}

function setCaret(el, where) {
  el.focus({ preventScroll: true });
  let r;
  if (where === 'end') { r = document.createRange(); r.selectNodeContents(el); r.collapse(false); }
  else r = rangeAt(el, where, where);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
  el.closest('.block, .page-title')?.scrollIntoView({ block: 'nearest' });
}

function edgeState(el) {
  const s = getSelection();
  if (!s.rangeCount || !s.isCollapsed || !el.contains(s.focusNode)) return { start: false, end: false };
  const before = document.createRange();
  before.selectNodeContents(el);
  before.setEnd(s.focusNode, s.focusOffset);
  const after = document.createRange();
  after.selectNodeContents(el);
  after.setStart(s.focusNode, s.focusOffset);
  return {
    start: before.toString() === '' && !before.cloneContents().querySelector('br'),
    end: after.toString().replace(/\n$/, '') === '',
  };
}

function caretRect() {
  const s = getSelection();
  if (!s.rangeCount) return null;
  const r = s.getRangeAt(0).cloneRange();
  r.collapse(false);
  const rects = r.getClientRects();
  return rects.length ? rects[rects.length - 1] : null;
}

/* ───────────── Markdown ───────────── */

function inlineMd(html) {
  if (!html) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node) => {
    let out = '';
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out += n.nodeValue; continue; }
      if (n.nodeType !== 1) continue;
      const inner = walk(n);
      const tag = n.tagName;
      if (tag === 'BR') out += '\n';
      else if (!inner) continue;
      else if (tag === 'B' || tag === 'STRONG') out += `**${inner}**`;
      else if (tag === 'I' || tag === 'EM') out += `*${inner}*`;
      else if (tag === 'S' || tag === 'STRIKE') out += `~~${inner}~~`;
      else if (tag === 'CODE') out += '`' + inner + '`';
      else if (tag === 'A' && n.dataset.page) {
        const title = store.titleOf(n.dataset.page);
        out += title === inner ? `[[${title}]]` : `[[${title}|${inner}]]`;
      } else if (tag === 'A') out += `[${inner}](${n.getAttribute('href') || ''})`;
      else out += inner;
    }
    return out;
  };
  return walk(tpl.content);
}

export function toMarkdown(blocks, opts = {}) {
  const assets = opts.assetPrefix ?? 'assets/';
  const out = [];
  const counts = [];
  for (const b of blocks) {
    const d = b.indent || 0;
    const pad = '  '.repeat(d);
    const text = b.type === 'code' ? plainText(b.html) : inlineMd(b.html);
    if (b.type === 'num') { counts.length = d + 1; counts[d] = (counts[d] || 0) + 1; } else counts.length = Math.min(counts.length, d);
    const remind = b.remind ? ` (⏰ ${fmtRemind(b.remind.at)})` : '';
    switch (b.type) {
      case 'h1': out.push('# ' + text, ''); break;
      case 'h2': out.push('## ' + text, ''); break;
      case 'h3': out.push('### ' + text, ''); break;
      case 'todo': out.push(`${pad}- [${b.checked ? 'x' : ' '}] ${text}${remind}`); break;
      case 'bullet': out.push(`${pad}- ${text}${remind}`); break;
      case 'num': out.push(`${pad}${counts[d]}. ${text}${remind}`); break;
      case 'toggle': out.push(`${pad}- ▸ ${text}${remind}`); break;
      case 'quote': out.push(pad + '> ' + text.replace(/\n/g, '\n> '), ''); break;
      case 'callout': out.push(pad + `> ${b.icon || '💡'} ` + text.replace(/\n/g, '\n> '), ''); break;
      case 'code': out.push('```', text, '```', ''); break;
      case 'divider': out.push('---', ''); break;
      case 'image': out.push(`${pad}![${b.caption || ''}](${assets}${b.src})`, ''); break;
      case 'draw': out.push(pad + '*' + t('md.drawing') + '*', ''); break;
      case 'page': out.push(`${pad}[[${store.titleOf(b.page)}]]`, ''); break;
      default: out.push(pad + text + remind, '');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// [[Название]] и [[Название|текст]] при вставке становятся ссылками, если такая страница есть
function withLinks(text) {
  let html = '', last = 0;
  for (const mm of text.matchAll(/\[\[([^[\]|\n]+)(?:\|([^[\]\n]+))?\]\]/g)) {
    const p = store.pageByTitle(mm[1]);
    if (!p) continue;
    html += escapeHtml(text.slice(last, mm.index)) + linkHtml(p.id, mm[2] || mm[1]);
    last = mm.index + mm[0].length;
  }
  return html + escapeHtml(text.slice(last));
}

function fromText(text) {
  const out = [];
  const lines = text.replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const indent = Math.min(MAX_INDENT, Math.floor((raw.match(/^[ \t]*/)[0].replace(/\t/g, '  ').length) / 2));
    const line = raw.trim();
    const mk = (type, body, extra) => out.push({ id: uid(), type, html: withLinks(body), ...(indent && { indent }), ...extra });
    let m;
    if (line.startsWith('```')) {
      const buf = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) buf.push(lines[i]);
      out.push({ id: uid(), type: 'code', html: escapeHtml(buf.join('\n')) });
    } else if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) out.push({ id: uid(), type: 'h' + m[1].length, html: escapeHtml(m[2]) });
    else if ((m = /^(?:[-*]\s+)?\[( |x|X)?\]\s+(.*)$/.exec(line))) mk('todo', m[2], /x/i.test(m[1] || '') ? { checked: true } : null);
    else if ((m = /^[-*•]\s+▸\s+(.*)$/.exec(line))) mk('toggle', m[1]);
    else if ((m = /^[-*•]\s+(.*)$/.exec(line))) mk('bullet', m[1]);
    else if ((m = /^\d+[.)]\s+(.*)$/.exec(line))) mk('num', m[1]);
    else if ((m = /^>\s?(.*)$/.exec(line))) mk('quote', m[1]);
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) out.push({ id: uid(), type: 'divider' });
    else mk('p', line);
  }
  return out;
}

/* ───────────── Редактор ───────────── */

export function mountEditor(scrollEl, pageId, page, ctx) {
  const ac = new AbortController();
  const signal = ac.signal;
  const m = store.meta(pageId);
  let blocks = page.blocks;
  if (!blocks.length) blocks.push({ id: uid(), type: 'p', html: '' });

  const byId = new Map();
  const els = new Map();
  const selected = new Set();
  const hidden = new Set();
  let selAnchor = null, selFocus = null;
  let dragging = false;

  const titleEl = h('h1', { class: 'page-title', contenteditable: 'plaintext-only', spellcheck: 'false', 'data-ph': t('untitled') }, m.title || '');
  const iconEl = h('button', { class: 'page-icon', title: t('ed.changeIcon') });
  const ctlEl = h('div', { class: 'page-ctl' });
  const blocksEl = h('div', { class: 'blocks' });
  const plusBtn = h('button', { class: 'handle-btn', title: t('ed.addBelow'), html: icon('plus', 18) });
  const gripBtn = h('button', { class: 'handle-btn grip', title: t('ed.dragHint'), html: icon('grip', 18) });
  const handle = h('div', { class: 'handle' }, plusBtn, gripBtn);
  const dropLine = h('div', { class: 'drop-line', hidden: true });
  const coverEl = h('div', { class: 'cover', hidden: true },
    h('div', { class: 'cover-ctl' },
      h('button', { class: 'cover-btn', onclick: (e) => pickCover(e.currentTarget) }, t('ed.changeCover')),
      h('button', { class: 'cover-btn', onclick: () => setCover(null) }, t('ed.removeCover'))));
  const backEl = h('section', { class: 'backlinks', hidden: true });
  const pageEl = h('div', { class: 'page' }, h('div', { class: 'page-head' }, iconEl, ctlEl), titleEl, blocksEl, backEl, handle, dropLine);
  const band = h('div', { class: 'band', hidden: true });
  const fmtBar = h('div', { class: 'fmt-bar', hidden: true });
  const slashEl = h('div', { class: 'pop slash', hidden: true });
  const wikiEl = h('div', { class: 'pop slash pl-pop', hidden: true });
  const layer = document.getElementById('layer');
  layer.append(band, fmtBar, slashEl, wikiEl);

  const isText = (b) => TEXT.has(b.type);
  const indexOf = (id) => blocks.findIndex((b) => b.id === id);
  const textOf = (id) => els.get(id)?.querySelector('.text');
  const blockOf = (node) => { const el = node?.closest?.('.block'); return el && blocksEl.contains(el) ? byId.get(el.dataset.id) : null; };
  const newP = (extra) => ({ id: uid(), type: 'p', html: '', ...extra });
  const isEmpty = (b) => isText(b) && !plainText(b.html).trim();
  const depth = (b) => b?.indent || 0;
  const visible = (b) => b && !hidden.has(b.id);

  function applyPageStyle() {
    pageEl.classList.toggle('full', !!page.fullWidth);
    pageEl.classList.toggle('small', !!page.small);
    pageEl.dataset.font = page.font || 'sans';
  }

  /* ── Шапка: иконка и обложка ── */

  function renderHead() {
    iconEl.textContent = m.icon || '';
    iconEl.hidden = !m.icon;
    ctlEl.replaceChildren(h('span', { class: 'page-ctl-in' },
      !m.icon && h('button', { class: 'ghost-btn', html: icon('star', 14) + `<span>${t('ed.addIcon')}</span>`, onclick: (e) => pickIcon(e.currentTarget) }),
      !page.cover && h('button', { class: 'ghost-btn', html: icon('image', 14) + `<span>${t('ed.addCover')}</span>`, onclick: () => setCover({ kind: 'grad', value: COVERS[Math.floor(Math.random() * COVERS.length)] }) })));
  }
  const pickIcon = (anchor) => emojiPicker(anchor, (v) => { store.setMeta(pageId, { icon: v }); renderHead(); });
  iconEl.addEventListener('click', () => pickIcon(iconEl));

  function renderCover() {
    const c = page.cover;
    coverEl.hidden = !c;
    pageEl.classList.toggle('has-cover', !!c);
    if (!c) return;
    if (c.kind === 'img') {
      coverEl.style.backgroundImage = `url("${api.assetUrl(c.src)}")`;
      delete coverEl.dataset.g;
    } else {
      coverEl.style.backgroundImage = '';
      coverEl.dataset.g = c.value;
    }
  }
  function setCover(c) {
    if (c) page.cover = c; else delete page.cover;
    renderCover();
    renderHead();
    store.touch(pageId, page);
  }
  function pickCover(anchor) {
    let pop;
    const body = h('div', { class: 'cover-pick' },
      h('div', { class: 'menu-head' }, t('cover.gradients')),
      h('div', { class: 'cover-grid' }, COVERS.map((g) => h('button', { class: 'cover-sw', 'data-g': g, onclick: () => { pop.close(); setCover({ kind: 'grad', value: g }); } }))),
      h('div', { class: 'menu-sep' }),
      h('button', { class: 'menu-item', onclick: async () => {
        pop.close();
        const [src] = await api.pickImages(false);
        if (src) setCover({ kind: 'img', src });
      } }, h('span', { class: 'mi-ico', html: icon('upload') }), h('span', { class: 'mi-label' }, t('cover.upload'))));
    pop = popover(anchor, body, { align: 'end' });
  }

  /* ── Построение блоков ── */

  function remindChip(b) {
    const done = b.type === 'todo' && b.checked && !b.remind.repeat;
    const late = !done && b.remind.at < Date.now();
    return h('button', {
      class: 'chip remind' + (done ? ' done' : late ? ' late' : ''), contenteditable: 'false', title: t('ed.editRemind'),
      html: icon(b.remind.repeat ? 'repeat' : 'bell', 12) + `<span>${escapeHtml(fmtRemind(b.remind.at))}</span>`,
    });
  }

  function buildBlock(b) {
    const el = h('div', { class: 'block', 'data-id': b.id, 'data-type': b.type });
    if (b.indent) el.style.setProperty('--indent', b.indent);
    if (b.color) el.dataset.color = b.color;
    if (isText(b)) {
      if (b.type === 'todo') {
        el.append(h('div', { class: 'check', role: 'checkbox', 'aria-checked': String(!!b.checked), html: icon('check', 14) }));
        if (b.checked) el.classList.add('checked');
      } else if (b.type === 'bullet') el.append(h('div', { class: 'marker bullet' }));
      else if (b.type === 'num') el.append(h('div', { class: 'marker num' }));
      else if (b.type === 'toggle') {
        el.append(h('button', { class: 'marker tg', html: icon('tri', 14), 'aria-expanded': String(!!b.open) }));
        if (b.open) el.classList.add('open');
      } else if (b.type === 'callout') el.append(h('button', { class: 'callout-ico' }, b.icon || '💡'));
      const code = b.type === 'code';
      const tx = h(code ? 'pre' : 'div', {
        class: 'text', contenteditable: code ? 'plaintext-only' : 'true', spellcheck: 'false', 'data-ph': t(PLACEHOLDER[b.type]),
      });
      tx.innerHTML = b.html || '';
      if (!code) { syncDir(tx); markLinks(tx); }
      el.append(tx);
      if (b.remind) el.append(remindChip(b));
      if (b.type === 'toggle') el.append(h('div', { class: 'toggle-empty' }, t('ed.emptyToggle')));
    } else if (b.type === 'divider') {
      el.append(h('div', { class: 'divider' }));
    } else if (b.type === 'image') {
      const fig = h('figure', { class: 'img' },
        h('img', { src: api.assetUrl(b.src), draggable: 'false', loading: 'lazy', decoding: 'async', alt: b.caption || '' }),
        h('div', { class: 'img-resize', title: t('ed.resize') }));
      if (b.w) fig.style.width = b.w + 'px';
      const cap = h('div', { class: 'caption', contenteditable: 'plaintext-only', spellcheck: 'false', 'data-ph': t('ed.caption') }, b.caption || '');
      syncDir(cap);
      el.append(h('div', { class: 'img-wrap' }, fig, cap));
    } else if (b.type === 'draw') {
      el.append(createDrawing(b, { onChange: () => changed(), assetUrl: api.assetUrl, signal }));
    } else if (b.type === 'page') {
      const pm = store.meta(b.page);
      const alive = pm && !store.isTrashed(b.page);
      el.append(h('button', { class: 'page-link' + (alive ? '' : ' dead') },
        h('span', { class: 'page-link-ico', html: alive && pm.icon ? '' : icon('page', 18) }, alive ? pm.icon || '' : ''),
        h('span', { class: 'page-link-title' }, alive ? pm.title || t('untitled') : t('ed.pageDeleted'))));
    }
    return el;
  }

  // Нумерация списков, сворачивание раскрывающихся блоков
  function relayout() {
    const counts = [];
    let hideAt = -1;
    hidden.clear();
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i], d = depth(b), el = els.get(b.id);
      let hid = false;
      if (hideAt >= 0 && d > hideAt) hid = true; else hideAt = -1;
      if (hid) hidden.add(b.id);
      el.classList.toggle('folded', hid);
      if (!hid && b.type === 'toggle' && !b.open) hideAt = d;
      if (b.type === 'num') {
        counts.length = d + 1;
        counts[d] = (counts[d] || 0) + 1;
        el.firstElementChild.textContent = counts[d] + '.';
      } else counts.length = Math.min(counts.length, d);
      if (b.type === 'toggle') el.classList.toggle('no-kids', !(blocks[i + 1] && depth(blocks[i + 1]) > d));
    }
  }

  function setIndentRaw(b, d) {
    if (d) b.indent = d; else delete b.indent;
    els.get(b.id)?.style.setProperty('--indent', d);
  }

  // Отступ не может быть глубже, чем у предыдущего блока + 1
  function fixIndents() {
    let prev = -1;
    for (const b of blocks) {
      if (depth(b) > prev + 1) setIndentRaw(b, prev + 1);
      prev = depth(b);
    }
  }

  function mountAll() {
    byId.clear();
    els.clear();
    const frag = document.createDocumentFragment();
    for (const b of blocks) {
      byId.set(b.id, b);
      const el = buildBlock(b);
      els.set(b.id, el);
      frag.append(el);
    }
    blocksEl.replaceChildren(frag);
    relayout();
  }

  function insertAt(i, list) {
    const ref = blocks[i] ? els.get(blocks[i].id) : null;
    blocks.splice(i, 0, ...list);
    for (const b of list) {
      byId.set(b.id, b);
      const el = buildBlock(b);
      els.set(b.id, el);
      blocksEl.insertBefore(el, ref);
    }
    relayout();
  }

  function removeBlocks(ids) {
    for (const id of ids) {
      const i = indexOf(id);
      if (i < 0) continue;
      blocks.splice(i, 1);
      els.get(id)?.remove();
      els.delete(id);
      byId.delete(id);
      selected.delete(id);
    }
    if (!blocks.length) insertAt(0, [newP()]);
    fixIndents();
    relayout();
    placeHandle(null);
  }

  function refresh(b) {
    const el = buildBlock(b);
    els.get(b.id).replaceWith(el);
    els.set(b.id, el);
    if (selected.has(b.id)) el.classList.add('selected');
    relayout();
  }

  function ensureTail() {
    const last = blocks[blocks.length - 1];
    if (!isText(last) || depth(last) > 0) insertAt(blocks.length, [newP()]);
  }

  // Конец «поддерева» блока: все следующие блоки с большим отступом
  function descEnd(i) {
    const d = depth(blocks[i]);
    let j = i + 1;
    while (j < blocks.length && depth(blocks[j]) > d) j++;
    return j;
  }

  function withKids(ids, all) {
    const set = new Set(ids);
    for (const id of ids) {
      const i = indexOf(id);
      const b = blocks[i];
      if (i < 0 || !(all || (b.type === 'toggle' && !b.open))) continue;
      for (let j = i + 1, end = descEnd(i); j < end; j++) set.add(blocks[j].id);
    }
    return blocks.filter((b) => set.has(b.id)).map((b) => b.id);
  }

  function neighbor(i, dir) {
    for (let j = i + dir; j >= 0 && j < blocks.length; j += dir) if (visible(blocks[j])) return blocks[j];
    return null;
  }

  // Раскрыть свёрнутые родительские блоки, чтобы блок стал виден
  function reveal(id) {
    let i = indexOf(id);
    if (i < 0 || !hidden.has(id)) return;
    let d = depth(blocks[i]);
    for (let j = i - 1; j >= 0 && d > 0; j--) {
      const b = blocks[j];
      if (depth(b) < d) {
        if (b.type === 'toggle' && !b.open) { b.open = true; els.get(b.id).classList.add('open'); }
        d = depth(b);
      }
    }
    relayout();
    store.touch(pageId, page);
  }

  function toggleFold(b) {
    b.open = !b.open;
    if (!b.open) delete b.open;
    const el = els.get(b.id);
    el.classList.toggle('open', !!b.open);
    el.querySelector('.tg')?.setAttribute('aria-expanded', String(!!b.open));
    relayout();
    const active = blockOf(document.activeElement);
    if (active && hidden.has(active.id)) focusBlock(b);
    store.touch(pageId, page);
  }

  /* ── История (отмена и повтор) ── */

  const hist = { stack: [], i: -1, timer: 0 };

  function focusState() {
    const tx = document.activeElement?.closest?.('.text');
    const b = tx && blockOf(tx);
    return b ? { id: b.id, off: caretOffset(tx) } : null;
  }
  function record() {
    clearTimeout(hist.timer);
    hist.timer = 0;
    hist.stack.length = hist.i + 1;
    hist.stack.push({ blocks: blocks.map((b) => ({ ...b })), cover: page.cover, focus: focusState() });
    if (hist.stack.length > 200) hist.stack.shift();
    hist.i = hist.stack.length - 1;
  }
  function pre() { if (hist.timer) record(); }
  function changed(typing) {
    store.touch(pageId, page);
    if (typing) { clearTimeout(hist.timer); hist.timer = setTimeout(record, 700); } else record();
  }
  function restore(s) {
    blocks = page.blocks = s.blocks.map((b) => ({ ...b }));
    if (s.cover) page.cover = s.cover; else delete page.cover;
    selected.clear();
    mountAll();
    renderCover();
    renderHead();
    placeHandle(null);
    const tx = s.focus && textOf(s.focus.id);
    if (tx && visible(byId.get(s.focus.id))) setCaret(tx, s.focus.off);
    store.touch(pageId, page);
  }
  function undo() { pre(); if (hist.i > 0) restore(hist.stack[--hist.i]); }
  function redo() { if (!hist.timer && hist.i < hist.stack.length - 1) restore(hist.stack[++hist.i]); }

  /* ── Выделение блоков ── */

  function select(ids, anchor, focus) {
    for (const id of selected) els.get(id)?.classList.remove('selected');
    selected.clear();
    for (const id of ids) { selected.add(id); els.get(id)?.classList.add('selected'); }
    selAnchor = anchor ?? ids[0] ?? null;
    selFocus = focus ?? ids[ids.length - 1] ?? null;
    if (ids.length) {
      getSelection().removeAllRanges();
      if (pageEl.contains(document.activeElement)) document.activeElement.blur();
    }
  }
  const clearSel = () => { if (selected.size) select([]); };
  function selectRange(a, b) {
    const i = indexOf(a), j = indexOf(b);
    if (i < 0 || j < 0) return;
    const lo = Math.min(i, j), hi = Math.max(i, j);
    select(blocks.slice(lo, hi + 1).filter(visible).map((x) => x.id), a, b);
  }
  const selectedList = () => blocks.filter((b) => selected.has(b.id));

  function focusBlock(b, where = 'end') {
    reveal(b.id);
    const tx = textOf(b.id);
    if (!tx) { select([b.id]); els.get(b.id)?.scrollIntoView({ block: 'nearest' }); return; }
    clearSel();
    setCaret(tx, where);
  }

  /* ── Операции над блоками ── */

  function syncText(tx, b) {
    if (!tx.textContent && !tx.querySelector('img')) { if (tx.firstChild) tx.replaceChildren(); b.html = ''; } else b.html = tx.innerHTML;
  }

  function setType(b, type, keepCaret = true) {
    if (b.type === type) return;
    const tx = textOf(b.id);
    const off = keepCaret && tx && document.activeElement === tx ? caretOffset(tx) : null;
    if (type === 'code') b.html = escapeHtml(plainText(b.html));
    else if (b.type === 'code') b.html = (b.html || '').replace(/\n/g, '<br>');
    if (type !== 'todo') delete b.checked;
    if (type === 'toggle') b.open = true; else delete b.open;
    b.type = type;
    refresh(b);
    if (off != null) setCaret(textOf(b.id), off);
  }

  function setIndent(b, dir) {
    const i = blocks.indexOf(b);
    const pv = neighbor(i, -1);
    const cur = depth(b);
    const max = pv ? Math.min(MAX_INDENT, depth(pv) + 1) : 0;
    const next = clamp(cur + dir, 0, dir > 0 ? max : MAX_INDENT);
    if (next === cur) return false;
    if (dir > 0 && pv?.type === 'toggle' && !pv.open && depth(pv) === cur) { pv.open = true; els.get(pv.id).classList.add('open'); }
    const end = descEnd(i);
    for (let j = i; j < end; j++) setIndentRaw(blocks[j], clamp(depth(blocks[j]) + next - cur, 0, MAX_INDENT));
    fixIndents();
    relayout();
    changed();
    return true;
  }

  function setColor(ids, color) {
    pre();
    for (const id of ids) {
      const b = byId.get(id);
      if (!b) continue;
      if (color) b.color = color; else delete b.color;
      const el = els.get(id);
      if (color) el.dataset.color = color; else delete el.dataset.color;
    }
    changed();
  }

  // Куда вставлять блоки после ref и с каким отступом
  function slotAfter(ref) {
    if (!ref) return { at: blocks.length, base: 0 };
    const i = blocks.indexOf(ref);
    if (ref.type === 'toggle') return ref.open ? { at: i + 1, base: depth(ref) + 1 } : { at: descEnd(i), base: depth(ref) };
    return { at: i + 1, base: depth(ref) };
  }

  // Вставляет блоки после ref; пустой абзац при этом заменяется
  function place(list, ref) {
    if (!list.length) return;
    pre();
    const { at, base } = slotAfter(ref);
    const min = Math.min(...list.map(depth));
    for (const b of list) setIndentRaw(b, clamp(depth(b) - min + base, 0, MAX_INDENT));
    insertAt(at, list);
    if (ref && ref.type === 'p' && isEmpty(ref) && !ref.remind && blocks.length > list.length) removeBlocks([ref.id]);
    ensureTail();
    fixIndents();
    relayout();
    changed();
  }

  function duplicate(ids) {
    pre();
    const full = withKids(ids, true);
    const list = blocks.filter((b) => full.includes(b.id));
    if (!list.length) return;
    const copies = list.map((b) => ({ ...b, id: uid() }));
    insertAt(blocks.indexOf(list[list.length - 1]) + 1, copies);
    changed();
    if (selected.size) select(copies.filter((b) => ids.length > 1 || b === copies[0]).map((b) => b.id));
  }

  function moveBlocks(ids, index) {
    const set = new Set(ids);
    const moving = blocks.filter((b) => set.has(b.id));
    const before = blocks.slice(0, index).filter((b) => !set.has(b.id)).length;
    const rest = blocks.filter((b) => !set.has(b.id));
    rest.splice(before, 0, ...moving);
    blocks = page.blocks = rest;
    const ref = rest[before + moving.length] ? els.get(rest[before + moving.length].id) : null;
    for (const b of moving) blocksEl.insertBefore(els.get(b.id), ref);
    fixIndents();
    relayout();
    changed();
  }

  function shiftBlock(b, dir) {
    const i = blocks.indexOf(b);
    const group = withKids([b.id], true);
    const other = neighbor(dir < 0 ? i : i + group.length - 1, dir);
    if (!other) return;
    const tx = textOf(b.id);
    const off = tx ? caretOffset(tx) : 0;
    const oi = blocks.indexOf(other);
    moveBlocks(group, dir < 0 ? oi : descEnd(oi));
    if (tx) setCaret(textOf(b.id), off);
  }

  function pickRemind(b) {
    const el = els.get(b.id);
    datePicker(el.querySelector('.remind') || el.querySelector('.text') || el, b.remind, (v) => {
      pre();
      if (v) b.remind = v; else delete b.remind;
      refresh(b);
      changed();
    }, { weekStart: store.weekStart() });
  }

  async function filesToBlocks(files) {
    const out = [];
    for (const f of files) {
      const ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      const name = await api.saveAsset(new Uint8Array(await f.arrayBuffer()), ext);
      out.push({ id: uid(), type: 'image', src: name });
    }
    return out;
  }

  function drawOver(b) {
    const img = els.get(b.id).querySelector('img');
    const w = img.clientWidth || 640, hh = img.clientHeight || 400;
    pre();
    insertAt(blocks.indexOf(b) + 1, [{ id: uid(), type: 'draw', bg: b.src, bw: w, h: hh, strokes: [], ...(b.indent && { indent: b.indent }) }]);
    removeBlocks([b.id]);
    changed();
  }

  function currentBlock() {
    return blockOf(document.activeElement) || selectedList().pop() || blocks[blocks.length - 1];
  }

  /* ── Слэш-меню ── */

  const slash = { open: false, items: [], i: 0, blockId: null, query: '' };

  function closeSlash() {
    if (!slash.open) return;
    slash.open = false;
    slashEl.hidden = true;
  }

  function updateSlash(b, tx) {
    if (b.type === 'code') return closeSlash();
    const before = tx.textContent.slice(0, caretOffset(tx));
    const mm = /(?:^|\s)\/([^\s/]{0,24})$/.exec(before);
    if (!mm) return closeSlash();
    const q = mm[1].toLowerCase();
    const items = BLOCKS.filter((d) => !q || t('block.' + d.type).toLowerCase().includes(q) || d.kw.includes(q));
    if (!items.length) return closeSlash();
    Object.assign(slash, { open: true, items, i: 0, blockId: b.id, query: mm[1] });
    renderSlash();
    const r = caretRect() || tx.getBoundingClientRect();
    slashEl.hidden = false;
    const w = slashEl.offsetWidth, hh = slashEl.offsetHeight;
    slashEl.style.left = clamp(isRtlDoc() ? r.right - w : r.left, 8, innerWidth - w - 8) + 'px';
    slashEl.style.top = (r.bottom + hh + 12 > innerHeight ? Math.max(8, r.top - hh - 6) : r.bottom + 6) + 'px';
  }

  function renderSlash() {
    slashEl.replaceChildren(h('div', { class: 'menu-head' }, t('ed.blocksHead')), ...slash.items.map((d, i) => {
      const row = h('button', { class: 'slash-item' + (i === slash.i ? ' on' : '') },
        h('span', { class: 'slash-ico', html: icon(d.icon, 20) }),
        h('span', { class: 'slash-text' }, h('span', { class: 'slash-label' }, t('block.' + d.type)), h('span', { class: 'slash-desc' }, t('block.' + d.type + '.d'))));
      row.addEventListener('mousedown', (e) => e.preventDefault());
      row.addEventListener('click', () => pickSlash(d));
      row.addEventListener('mousemove', () => { if (slash.i !== i) { slash.i = i; slashEl.querySelector('.on')?.classList.remove('on'); row.classList.add('on'); } });
      return row;
    }));
  }

  function slashKey(e) {
    const n = slash.items.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      slash.i = (slash.i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      renderSlash();
      slashEl.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') pickSlash(slash.items[slash.i]);
    else if (e.key === 'Escape') closeSlash();
    else return false;
    e.preventDefault();
    return true;
  }

  async function pickSlash(def) {
    const b = byId.get(slash.blockId);
    const tx = b && textOf(b.id);
    closeSlash();
    if (!tx) return;
    pre();
    const off = caretOffset(tx);
    rangeAt(tx, off - slash.query.length - 1, off).deleteContents();
    syncText(tx, b);
    await applyDef(def, b);
  }

  async function applyDef(def, b) {
    const empty = isEmpty(b);
    if (TEXT.has(def.type)) {
      if (empty) { setType(b, def.type, false); changed(); focusBlock(b, 0); } else {
        const nb = { id: uid(), type: def.type, html: '', ...(def.type === 'toggle' && { open: true }) };
        const { at, base } = slotAfter(b);
        if (base) nb.indent = base;
        insertAt(at, [nb]);
        changed();
        focusBlock(nb, 0);
      }
    } else if (def.type === 'remind') {
      if (empty && b.type === 'p') setType(b, 'todo', false);
      changed();
      focusBlock(b);
      pickRemind(b);
    } else if (def.type === 'image') {
      const names = await api.pickImages(true);
      if (!names.length) { changed(); return focusBlock(b); }
      place(names.map((src) => ({ id: uid(), type: 'image', src })), b);
    } else if (def.type === 'page') {
      const id = store.createPage(pageId);
      place([{ id: uid(), type: 'page', page: id }], b);
      ctx.navigate(id);
    } else {
      const nb = def.type === 'draw' ? { id: uid(), type: 'draw', h: 300, strokes: [] } : { id: uid(), type: 'divider' };
      place([nb], b);
      const next = neighbor(blocks.indexOf(nb), 1);
      if (next && isText(next)) focusBlock(next, 0);
    }
  }

  /* ── Ссылки на страницы: «[[» и кнопка на панели форматирования ── */

  const wiki = { open: false, blockId: null, query: '' };
  const wikiList = choiceList(wikiEl, (q) => pageChoices(q, pageId), (it) => pickWiki(it));

  function closeWiki() {
    if (!wiki.open) return;
    wiki.open = false;
    wikiEl.hidden = true;
  }

  const targetOf = (it) => (it.create ? store.createPage(pageId, { title: it.create }) : it.id);

  // Вставка ссылки вместо диапазона r внутри tx
  function insertLink(tx, r, id, text) {
    tx.focus({ preventScroll: true });
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    const lead = /^\s*/.exec(text)[0], trail = /\s*$/.exec(text)[0];
    const core = text.trim() || store.titleOf(id);
    document.execCommand('insertHTML', false, escapeHtml(lead) + linkHtml(id, core) + escapeHtml(trail) + '​');
    // Невидимый символ после ссылки нужен, чтобы дальнейший ввод шёл уже не внутрь ссылки — убираем его сразу
    const b = blockOf(tx);
    const w = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const i = n.nodeValue.indexOf('​');
      if (i < 0 || n.parentElement.closest('a')) continue;
      const after = n.nextSibling;
      if (n.nodeValue.length === 1 && !after) {
        // Ссылка в конце строки: пробел после неё, чтобы печатать дальше обычным текстом
        const sp = document.createTextNode(' ');
        n.replaceWith(sp);
        const rr = document.createRange();
        rr.setStart(sp, 1); rr.collapse(true);
        s.removeAllRanges(); s.addRange(rr);
      } else if (n.nodeValue.length === 1) {
        n.remove();
        const rr = document.createRange();
        if (after.nodeType === 3) rr.setStart(after, 0); else rr.setStartBefore(after);
        rr.collapse(true);
        s.removeAllRanges(); s.addRange(rr);
      } else {
        n.deleteData(i, 1);
        const rr = document.createRange();
        rr.setStart(n, i); rr.collapse(true);
        s.removeAllRanges(); s.addRange(rr);
      }
      break;
    }
    if (b) { syncText(tx, b); changed(); }
  }

  function updateWiki(b, tx) {
    if (b.type === 'code') return closeWiki();
    const off = caretOffset(tx);
    const before = tx.textContent.slice(0, off);
    // Готовая запись [[Название]] сразу превращается в ссылку
    if (WIKI_DONE.test(before)) {
      closeWiki();
      // Браузер не выполняет команды редактирования внутри события ввода — откладываем на тик
      setTimeout(() => finishWiki(b.id), 0);
      return true;
    }
    const mm = /\[\[([^[\]\n]{0,60})$/.exec(before);
    if (!mm) return closeWiki();
    Object.assign(wiki, { open: true, blockId: b.id, query: mm[1] });
    wikiList.update(mm[1]);
    const r = caretRect() || tx.getBoundingClientRect();
    wikiEl.hidden = false;
    const w = wikiEl.offsetWidth, hh = wikiEl.offsetHeight;
    wikiEl.style.left = clamp(isRtlDoc() ? r.right - w : r.left, 8, innerWidth - w - 8) + 'px';
    wikiEl.style.top = (r.bottom + hh + 12 > innerHeight ? Math.max(8, r.top - hh - 6) : r.bottom + 6) + 'px';
  }

  const WIKI_DONE = /\[\[([^[\]\n]{1,80})\]\]$/;

  function finishWiki(blockId) {
    const tx = textOf(blockId);
    if (!tx || document.activeElement !== tx) return;
    const off = caretOffset(tx);
    const done = WIKI_DONE.exec(tx.textContent.slice(0, off));
    if (!done) return;
    const title = done[1].trim();
    if (!title) return;
    const p = store.pageByTitle(title);
    pre();
    const id = p ? p.id : store.createPage(pageId, { title });
    insertLink(tx, rangeAt(tx, off - done[0].length, off), id, title);
  }

  function pickWiki(it) {
    const b = byId.get(wiki.blockId);
    const tx = b && textOf(b.id);
    const q = wiki.query;
    closeWiki();
    if (!tx) return;
    pre();
    const off = caretOffset(tx);
    const id = targetOf(it);
    insertLink(tx, rangeAt(tx, off - q.length - 2, off), id, it.create || store.titleOf(id));
  }

  function wikiKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeWiki(); return true; }
    return wikiList.key(e);
  }

  function askPageLink() {
    const s = getSelection();
    if (!s.rangeCount) return;
    const range = s.getRangeAt(0).cloneRange();
    const anc = range.commonAncestorContainer;
    const tx = (anc.nodeType === 1 ? anc : anc.parentElement)?.closest('.text');
    if (!tx || !blocksEl.contains(tx) || tx.tagName === 'PRE') return;
    const existing = (anc.nodeType === 1 ? anc : anc.parentElement).closest('a[data-page]');
    const raw = range.toString();
    fmtBar.hidden = true;
    const rect = range.getBoundingClientRect();
    pagePicker(rect.width || rect.height ? rect : tx.getBoundingClientRect(), {
      query: existing ? '' : raw.trim(),
      exclude: pageId,
      onUnlink: existing && (() => {
        pre();
        existing.replaceWith(document.createTextNode(existing.textContent));
        tx.normalize();
        const b = blockOf(tx);
        if (b) { syncText(tx, b); changed(); }
      }),
      onPick: (it) => {
        pre();
        const id = targetOf(it);
        if (existing) {
          existing.dataset.page = id;
          markLinks(tx);
          const b = blockOf(tx);
          if (b) { syncText(tx, b); changed(); }
          return;
        }
        insertLink(tx, range, id, raw.trim() ? raw : store.titleOf(id));
      },
    });
  }

  /* ── Ввод текста ── */

  const MD = [
    [/^#$/, 'h1'], [/^##$/, 'h2'], [/^###$/, 'h3'], [/^[-*+]$/, 'bullet'], [/^\[\s?\]$/, 'todo'], [/^\[[xXхХ]\]$/, 'todo', true],
    [/^1[.)]$/, 'num'], [/^[>"״]$/, 'quote'], [/^>>$/, 'toggle'], [/^!$/, 'callout'], [/^```$/, 'code'],
  ];

  function tryMarkdown(b, tx) {
    if (b.type !== 'p') return false;
    const off = caretOffset(tx);
    const before = tx.textContent.slice(0, off).replace(/ /g, ' ');
    if (off > 6 || !before.endsWith(' ')) return false;
    const rule = MD.find(([re]) => re.test(before.slice(0, -1)));
    if (!rule) return false;
    pre();
    rangeAt(tx, 0, off).deleteContents();
    syncText(tx, b);
    if (rule[2]) b.checked = true;
    setType(b, rule[1], false);
    changed();
    focusBlock(b, 0);
    return true;
  }

  blocksEl.addEventListener('input', (e) => {
    const cap = e.target.closest('.caption');
    if (cap) {
      syncDir(cap);
      const b = blockOf(cap);
      if (b) { b.caption = cap.textContent.trim() ? cap.textContent : ''; if (!b.caption) cap.replaceChildren(); changed(true); }
      return;
    }
    const tx = e.target.closest('.text');
    const b = tx && blockOf(tx);
    if (!b) return;
    syncText(tx, b);
    if (b.type !== 'code') syncDir(tx);
    if (b.type === 'p' && tx.textContent === '---') {
      pre();
      b.html = '';
      insertAt(blocks.indexOf(b), [{ id: uid(), type: 'divider', ...(b.indent && { indent: b.indent }) }]);
      tx.replaceChildren();
      changed();
      return;
    }
    if (e.inputType === 'insertText' && tryMarkdown(b, tx)) return;
    if (e.inputType === 'insertText' && b.type === 'p' && tx.textContent === '```') {
      pre(); b.html = ''; setType(b, 'code', false); changed(); focusBlock(b, 0); return;
    }
    if (updateWiki(b, tx) === true) { changed(true); return; }
    updateSlash(b, tx);
    changed(true);
  }, { signal });

  function splitBlock(b, tx) {
    const s = getSelection();
    const r = s.getRangeAt(0);
    r.deleteContents();
    const edge = edgeState(tx);
    const hasText = !!tx.textContent;
    const i = blocks.indexOf(b);
    const d = depth(b);
    if (!hasText && (LIST.has(b.type) || ['quote', 'callout', 'toggle'].includes(b.type))) {
      syncText(tx, b);
      if (d && b.type !== 'toggle') setIndent(b, -1); else { setType(b, 'p', false); changed(); focusBlock(b, 0); }
      return;
    }
    let cont, at;
    if (b.type === 'toggle') {
      cont = b.open ? { type: 'p', indent: d + 1 } : { type: 'toggle', indent: d };
      at = b.open ? i + 1 : descEnd(i);
    } else {
      cont = { type: LIST.has(b.type) ? b.type : 'p', indent: d };
      at = i + 1;
    }
    if (!cont.indent) delete cont.indent;
    if (edge.start && hasText && b.type !== 'toggle') {
      insertAt(i, [{ id: uid(), html: '', ...cont }]);
      changed();
      return;
    }
    const tail = document.createRange();
    tail.selectNodeContents(tx);
    tail.setStart(r.endContainer, r.endOffset);
    const box = document.createElement('div');
    box.append(tail.extractContents());
    const nb = { id: uid(), html: box.textContent ? box.innerHTML : '', ...cont };
    syncText(tx, b);
    insertAt(at, [nb]);
    changed();
    focusBlock(nb, 0);
  }

  function mergeInto(prev, b) {
    const pt = textOf(prev.id);
    const off = pt.textContent.length;
    prev.html = (prev.html || '') + (prev.type === 'code' ? escapeHtml(plainText(b.html)) : b.html || '');
    if (b.remind && !prev.remind) prev.remind = b.remind;
    removeBlocks([b.id]);
    refresh(prev);
    setCaret(textOf(prev.id), off);
    changed();
  }

  function moveVertical(b, tx, dir) {
    const rect = caretRect();
    const tr = tx.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(tx).lineHeight) || 24;
    const onEdge = !rect || (dir < 0 ? rect.top - tr.top < lh * 0.9 : tr.bottom - rect.bottom < lh * 0.9);
    if (!onEdge) return false;
    const target = neighbor(blocks.indexOf(b), dir);
    if (!target) { if (dir < 0) { titleEl.focus(); return true; } return false; }
    const tt = textOf(target.id);
    if (!tt) { select([target.id]); els.get(target.id).scrollIntoView({ block: 'nearest' }); return true; }
    tt.closest('.block').scrollIntoView({ block: 'nearest' });
    const r2 = tt.getBoundingClientRect();
    const x = rect ? rect.left : tr.left + 2;
    const y = dir < 0 ? r2.bottom - lh / 2 - 2 : r2.top + lh / 2 + 2;
    const range = document.caretRangeFromPoint?.(clamp(x, r2.left + 1, r2.right - 1), y);
    clearSel();
    if (range && tt.contains(range.startContainer)) {
      tt.focus({ preventScroll: true });
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(range);
    } else setCaret(tt, dir < 0 ? 'end' : 0);
    return true;
  }

  function toggleInlineCode() {
    const s = getSelection();
    if (s.isCollapsed || !s.rangeCount) return;
    const anc = s.getRangeAt(0).commonAncestorContainer;
    const code = (anc.nodeType === 1 ? anc : anc.parentElement).closest('code');
    if (code) {
      const tx = code.closest('.text');
      code.replaceWith(document.createTextNode(code.textContent));
      tx.normalize();
      const b = blockOf(tx);
      if (b) { syncText(tx, b); changed(); }
    } else document.execCommand('insertHTML', false, `<code>${escapeHtml(s.toString())}</code>`);
  }

  blocksEl.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    placeHandle(null);
    const tx = e.target.closest('.text');
    if (!tx) {
      if (e.target.closest('.caption') && e.key === 'Enter') {
        e.preventDefault();
        const n = neighbor(blocks.indexOf(blockOf(e.target)), 1);
        if (n) focusBlock(n, 0);
      }
      return;
    }
    const b = blockOf(tx);
    if (!b) return;
    if (slash.open && slashKey(e)) return;
    if (wiki.open && wikiKey(e)) return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.key.length > 1 || mod) pre();
    const i = blocks.indexOf(b);
    const sel = getSelection();

    if (e.key === 'Enter') {
      if (mod && b.type === 'todo') { e.preventDefault(); toggleCheck(b); return; }
      if (mod && b.type === 'toggle') { e.preventDefault(); toggleFold(b); return; }
      if (b.type === 'code') {
        if (!mod) return;
        e.preventDefault();
        const nb = newP(b.indent ? { indent: b.indent } : null);
        insertAt(i + 1, [nb]); changed(); focusBlock(nb, 0);
        return;
      }
      if (e.shiftKey) return;
      e.preventDefault();
      splitBlock(b, tx);
      return;
    }
    if (e.key === 'Backspace' && sel.isCollapsed && edgeState(tx).start) {
      e.preventDefault();
      if (b.type !== 'p') { setType(b, 'p', false); changed(); focusBlock(b, 0); return; }
      if (b.indent) { setIndent(b, -1); return; }
      const prev = neighbor(i, -1);
      if (!prev) {
        if (isEmpty(b) && blocks.length > 1) { removeBlocks([b.id]); changed(); }
        setCaret(titleEl, 'end');
        return;
      }
      if (isText(prev)) mergeInto(prev, b);
      else { if (isEmpty(b)) { removeBlocks([b.id]); changed(); } select([prev.id]); }
      return;
    }
    if (e.key === 'Delete' && sel.isCollapsed && edgeState(tx).end) {
      const next = neighbor(i, 1);
      if (!next) return;
      e.preventDefault();
      if (isText(next)) { const off = caretOffset(tx); mergeInto(b, next); setCaret(textOf(b.id), off); }
      else { removeBlocks([next.id]); changed(); }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (b.type === 'code') document.execCommand('insertText', false, '  ');
      else setIndent(b, e.shiftKey ? -1 : 1);
      return;
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.altKey) {
      const dir = e.key === 'ArrowUp' ? -1 : 1;
      if (mod && e.shiftKey) { e.preventDefault(); shiftBlock(b, dir); return; }
      if (e.shiftKey || mod) return;
      if (sel.isCollapsed && moveVertical(b, tx, dir)) e.preventDefault();
      return;
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.shiftKey && !mod && sel.isCollapsed) {
      const backKey = textIsRtl(tx) ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === backKey && edgeState(tx).start) {
        const prev = neighbor(i, -1);
        if (prev && isText(prev)) { e.preventDefault(); focusBlock(prev, 'end'); }
      } else if (e.key !== backKey && edgeState(tx).end) {
        const next = neighbor(i, 1);
        if (next && isText(next)) { e.preventDefault(); focusBlock(next, 0); }
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); select([b.id]); return; }
    if (!mod) return;
    if (e.code === 'KeyA') {
      if (!tx.textContent || sel.toString().length >= tx.textContent.length) { e.preventDefault(); select(blocks.filter(visible).map((x) => x.id)); }
    } else if (e.code === 'KeyE') { e.preventDefault(); toggleInlineCode(); }
    else if (e.code === 'KeyS' && e.shiftKey) { e.preventDefault(); document.execCommand('strikeThrough'); }
    else if (e.code === 'KeyK') { e.preventDefault(); if (e.shiftKey) askPageLink(); else askLink(); }
    else if (e.code === 'KeyD') { e.preventDefault(); duplicate([b.id]); }
  }, { signal });

  function toggleCheck(b) {
    pre();
    b.checked = !b.checked;
    if (!b.checked) delete b.checked;
    const el = els.get(b.id);
    el.classList.toggle('checked', !!b.checked);
    el.querySelector('.check')?.setAttribute('aria-checked', String(!!b.checked));
    const chip = el.querySelector('.remind');
    if (chip) chip.replaceWith(remindChip(b));
    changed();
  }

  blocksEl.addEventListener('click', (e) => {
    const b = blockOf(e.target);
    if (!b) return;
    if (e.target.closest('.check')) return toggleCheck(b);
    if (e.target.closest('.tg')) return toggleFold(b);
    if (e.target.closest('.toggle-empty')) {
      pre();
      const nb = newP({ indent: depth(b) + 1 });
      insertAt(blocks.indexOf(b) + 1, [nb]);
      changed();
      return focusBlock(nb, 0);
    }
    if (e.target.closest('.remind')) return pickRemind(b);
    if (e.target.closest('.callout-ico')) {
      return emojiPicker(e.target.closest('.callout-ico'), (v) => { pre(); b.icon = v || undefined; if (!v) delete b.icon; refresh(b); changed(); }, { removable: false });
    }
    if (e.target.closest('.page-link')) { if (store.meta(b.page) && !store.isTrashed(b.page)) ctx.navigate(b.page); return; }
    const pl = e.target.closest('a[data-page]');
    if (pl) {
      e.preventDefault();
      if (!getSelection().isCollapsed) return;
      hideCard();
      const id = pl.dataset.page;
      if (store.meta(id) && !store.isTrashed(id)) ctx.navigate(id); else toast(t('ed.pageDeleted'), { icon: 'info' });
      return;
    }
    const a = e.target.closest('a');
    if (a) { e.preventDefault(); api.openExternal(a.getAttribute('href')); return; }
    if (e.target.tagName === 'IMG') select([b.id]);
  }, { signal });

  blocksEl.addEventListener('dblclick', (e) => {
    if (e.target.tagName !== 'IMG') return;
    const box = h('div', { class: 'lightbox', onclick: () => box.remove() }, h('img', { src: e.target.src, alt: '' }));
    layer.append(box);
  }, { signal });

  blocksEl.addEventListener('focusin', (e) => { if (e.target.closest('.text, .caption')) clearSel(); }, { signal });
  blocksEl.addEventListener('focusout', () => setTimeout(() => { if (!blocksEl.contains(document.activeElement)) { closeSlash(); closeWiki(); } }, 0), { signal });

  blocksEl.addEventListener('mouseover', (e) => {
    const a = e.target.closest?.('a[data-page]');
    if (a) hoverCard(a);
  }, { signal });
  blocksEl.addEventListener('mouseout', (e) => {
    const a = e.target.closest?.('a[data-page]');
    if (a && !a.contains(e.relatedTarget)) hideCard();
  }, { signal });

  /* ── Изменение размера картинки ── */

  blocksEl.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('.img-resize');
    if (!grip) return;
    const b = blockOf(grip);
    const fig = grip.parentElement;
    const rtl = isRtlDoc();
    e.preventDefault();
    pre();
    grip.setPointerCapture(e.pointerId);
    const startX = e.clientX, startW = fig.offsetWidth, max = fig.parentElement.clientWidth;
    const move = (ev) => { fig.style.width = clamp(startW + (rtl ? startX - ev.clientX : ev.clientX - startX), 80, max) + 'px'; };
    const up = () => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', up);
      b.w = fig.offsetWidth;
      changed();
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
  }, { signal });

  /* ── Заголовок ── */

  syncDir(titleEl);
  titleEl.addEventListener('input', () => {
    if (!titleEl.textContent.trim()) titleEl.replaceChildren();
    syncDir(titleEl);
    store.setTitle(pageId, titleEl.textContent.replace(/\s+/g, ' ').trim());
  }, { signal });
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.key === 'Enter' && !isEmpty(blocks[0])) { pre(); insertAt(0, [newP()]); changed(); }
      focusBlock(blocks.find(visible) || blocks[0], 0);
    }
  }, { signal });

  /* ── Ручка блока: «+», меню и перетаскивание ── */

  let hoverId = null;

  function placeHandle(el) {
    if (!el) { handle.classList.remove('show'); hoverId = null; return; }
    hoverId = el.dataset.id;
    const pr = pageEl.getBoundingClientRect();
    const r = (el.firstElementChild || el).getBoundingClientRect();
    const tx = el.querySelector('.text');
    let top = r.top - pr.top + 2;
    if (tx) {
      const cs = getComputedStyle(tx);
      top = tx.getBoundingClientRect().top - pr.top + parseFloat(cs.paddingTop) + ((parseFloat(cs.lineHeight) || 24) - 24) / 2;
    }
    const x = isRtlDoc() ? r.right - pr.left + 4 : r.left - pr.left - 48;
    handle.style.transform = `translate(${Math.round(x)}px, ${Math.round(top)}px)`;
    handle.classList.add('show');
  }

  scrollEl.addEventListener('mousemove', (e) => {
    if (dragging || handle.contains(e.target)) return;
    let el = e.target.closest?.('.block');
    if (!el || !blocksEl.contains(el)) {
      const br = blocksEl.getBoundingClientRect();
      const inside = e.clientY >= br.top && e.clientY <= br.bottom;
      el = inside ? document.elementFromPoint(br.left + br.width / 2, e.clientY)?.closest('.block') : null;
    }
    if (!el) placeHandle(null);
    else if (el.dataset.id !== hoverId || !handle.classList.contains('show')) placeHandle(el);
  }, { signal });
  scrollEl.addEventListener('mouseleave', () => { if (!dragging) placeHandle(null); }, { signal });
  scrollEl.addEventListener('scroll', () => { placeHandle(null); closeSlash(); closeWiki(); hideCard(); fmtBar.hidden = true; }, { signal, passive: true });

  plusBtn.addEventListener('click', () => {
    const b = byId.get(hoverId);
    if (!b) return;
    pre();
    let target = b;
    if (!(b.type === 'p' && isEmpty(b))) {
      const { at, base } = slotAfter(b);
      target = newP(base ? { indent: base } : null);
      insertAt(at, [target]);
      changed();
    }
    focusBlock(target, 0);
    document.execCommand('insertText', false, '/');
  }, { signal });

  function openBlockMenu(id) {
    const b = byId.get(id);
    if (!b) return;
    if (!selected.has(id)) select([id]);
    const ids = selectedList().map((x) => x.id);
    const items = [];
    if (isText(b)) {
      items.push({
        icon: 'text', label: t('ed.turnInto'),
        sub: BLOCKS.filter((d) => TEXT.has(d.type)).map((d) => ({
          icon: d.icon, label: t('block.' + d.type), checked: d.type === b.type,
          onClick: () => { pre(); ids.forEach((x) => { const bb = byId.get(x); if (bb && isText(bb)) setType(bb, d.type, false); }); changed(); },
        })),
      });
      items.push({
        icon: 'palette', label: t('ed.color'),
        sub: [
          { header: t('color.textHead') },
          { swatch: 'sw', label: t('color.default'), checked: !b.color, onClick: () => setColor(ids, null) },
          ...COLORS.map((c) => ({ swatch: 'sw t-' + c, label: t('color.' + c), checked: b.color === c, onClick: () => setColor(ids, c) })),
          { header: t('color.bgHead') },
          ...COLORS.map((c) => ({ swatch: 'sw b-' + c, label: t('color.bg', { color: t('color.' + c) }), checked: b.color === 'bg-' + c, onClick: () => setColor(ids, 'bg-' + c) })),
        ],
      });
      items.push({ icon: 'bell', label: b.remind ? t('ed.editRemind') : t('ed.remind'), onClick: () => pickRemind(b) });
    }
    if (b.type === 'image') items.push({ icon: 'pen', label: t('ed.drawOver'), onClick: () => drawOver(b) });
    items.push({ icon: 'copy', label: t('ed.duplicate'), hint: 'Ctrl+D', onClick: () => duplicate(ids) });
    items.push({ sep: true });
    items.push({ icon: 'trash', label: t('ed.delete'), hint: 'Del', danger: true, onClick: () => { pre(); removeBlocks(withKids(ids)); changed(); } });
    menu(gripBtn.getBoundingClientRect(), items);
  }

  gripBtn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !hoverId) return;
    e.preventDefault();
    const id = hoverId;
    const sx = e.clientX, sy = e.clientY;
    const ids = withKids(selected.has(id) ? selectedList().map((b) => b.id) : [id], true);
    let started = false, drop = -1;
    const move = (ev) => {
      if (!started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        started = dragging = true;
        pre();
        ids.forEach((x) => els.get(x)?.classList.add('dragging'));
        dropLine.hidden = false;
        document.body.classList.add('grabbing');
      }
      const sr = scrollEl.getBoundingClientRect();
      if (ev.clientY < sr.top + 50) scrollEl.scrollTop -= 16; else if (ev.clientY > sr.bottom - 50) scrollEl.scrollTop += 16;
      drop = blocks.length;
      let lastVis = null;
      for (let i = 0; i < blocks.length; i++) {
        if (!visible(blocks[i])) continue;
        lastVis = blocks[i];
        const r = els.get(blocks[i].id).getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { drop = i; break; }
      }
      const pr = pageEl.getBoundingClientRect();
      const anchorB = drop < blocks.length ? blocks[drop] : lastVis;
      const rr = els.get(anchorB.id).getBoundingClientRect();
      const y = drop < blocks.length ? rr.top : rr.bottom;
      dropLine.style.transform = `translate(${rr.left - pr.left}px, ${y - pr.top - 2}px)`;
      dropLine.style.width = rr.width + 'px';
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      if (!started) return openBlockMenu(id);
      dragging = false;
      dropLine.hidden = true;
      document.body.classList.remove('grabbing');
      ids.forEach((x) => els.get(x)?.classList.remove('dragging'));
      if (drop >= 0) moveBlocks(ids, drop);
      select(ids.filter((x) => visible(byId.get(x))));
      placeHandle(null);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }, { signal });

  /* ── Мышь: рамка выделения, выделение через несколько блоков, клик по пустому месту ── */

  function clickBackground(ev) {
    const vis = blocks.filter(visible);
    const last = els.get(vis[vis.length - 1].id).getBoundingClientRect();
    if (ev.clientY > last.bottom) {
      const tail = blocks[blocks.length - 1];
      if (tail.type === 'p' && isEmpty(tail) && visible(tail)) return focusBlock(tail, 0);
      pre();
      const nb = newP();
      insertAt(blocks.length, [nb]);
      changed();
      return focusBlock(nb, 0);
    }
    const br = blocksEl.getBoundingClientRect();
    const b = blockOf(document.elementFromPoint(br.left + br.width / 2, ev.clientY));
    const atStart = isRtlDoc() ? ev.clientX > br.right : ev.clientX < br.left;
    if (b && isText(b)) focusBlock(b, atStart ? 0 : 'end');
  }

  function startBand(e) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY + scrollEl.scrollTop;
    let active = false, last = '';
    const move = (ev) => {
      const cy = ev.clientY + scrollEl.scrollTop;
      if (!active) {
        if (Math.hypot(ev.clientX - sx, cy - sy) < 6) return;
        active = true;
        band.hidden = false;
      }
      const top = Math.min(sy, cy) - scrollEl.scrollTop, bottom = Math.max(sy, cy) - scrollEl.scrollTop;
      Object.assign(band.style, {
        left: Math.min(sx, ev.clientX) + 'px', top: top + 'px',
        width: Math.abs(ev.clientX - sx) + 'px', height: bottom - top + 'px',
      });
      const ids = [];
      for (const b of blocks) {
        if (!visible(b)) continue;
        const r = els.get(b.id).getBoundingClientRect();
        if (r.bottom > top && r.top < bottom) ids.push(b.id);
      }
      if (ids.join() !== last) { last = ids.join(); select(ids); }
    };
    const up = (ev) => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      band.hidden = true;
      if (!active) { clearSel(); clickBackground(ev); }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  function startTextDrag(startEl) {
    let multi = false;
    const move = (ev) => {
      if (!(ev.buttons & 1)) return up();
      const over = ev.target.closest?.('.block');
      if (!over || !blocksEl.contains(over)) return;
      if (!multi) {
        if (over === startEl) return;
        multi = true;
        pageEl.classList.add('selecting');
      }
      selectRange(startEl.dataset.id, over.dataset.id);
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      pageEl.classList.remove('selecting');
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  scrollEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const tg = e.target;
    if (slash.open && !slashEl.contains(tg)) closeSlash();
    if (tg.closest('.cover')) return;
    if (tg === scrollEl || tg === pageEl || tg === blocksEl || tg.classList.contains('block') || tg.classList.contains('page-head')) return startBand(e);
    const text = tg.closest('.text');
    if (text && blocksEl.contains(text)) startTextDrag(text.closest('.block'));
    else if (!handle.contains(tg) && tg.tagName !== 'IMG') clearSel();
  }, { signal });

  /* ── Панель форматирования ── */

  let savedRange = null, mouseDown = false;

  function exec(cmd, value) {
    document.execCommand(cmd, false, value);
    updateFmtBar();
  }
  function restoreRange() {
    if (!savedRange) return false;
    const tx = (savedRange.startContainer.nodeType === 1 ? savedRange.startContainer : savedRange.startContainer.parentElement)?.closest('.text');
    if (!tx || !tx.isConnected) return false;
    tx.focus({ preventScroll: true });
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(savedRange);
    return true;
  }
  function askLink() {
    const s = getSelection();
    if (s.isCollapsed || !s.rangeCount) return;
    savedRange = s.getRangeAt(0).cloneRange();
    const anc = savedRange.commonAncestorContainer;
    const existing = (anc.nodeType === 1 ? anc : anc.parentElement).closest('a')?.getAttribute('href') || '';
    const input = h('input', { class: 'input', type: 'text', placeholder: 'https://…', value: existing, dir: 'ltr' });
    const pop = popover(savedRange.getBoundingClientRect(), h('div', { class: 'link-box' }, input));
    input.focus();
    input.select();
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      let url = input.value.trim();
      pop.close();
      if (!restoreRange()) return;
      if (!url) return exec('unlink');
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = (url.includes('@') && !url.includes('/') ? 'mailto:' : 'https://') + url;
      if (!/^(https?:|mailto:)/i.test(url)) return;
      exec('createLink', url);
    });
  }
  function askColor(anchor) {
    const s = getSelection();
    if (!s.rangeCount) return;
    savedRange = s.getRangeAt(0).cloneRange();
    const apply = (cmd, value) => {
      pop.close();
      if (!restoreRange()) return;
      document.execCommand('styleWithCSS', false, true);
      if (cmd === 'reset') { exec('removeFormat'); } else exec(cmd, value);
      document.execCommand('styleWithCSS', false, false);
    };
    const box = h('div', { class: 'color-box' },
      h('div', { class: 'menu-head' }, t('color.textHead')),
      h('div', { class: 'color-grid' }, TEXT_COLORS.map(([c, key]) => h('button', {
        class: 'color-cell', title: t(key), style: { color: c || 'inherit' }, onclick: () => apply(c ? 'foreColor' : 'reset', c),
      }, 'A'))),
      h('div', { class: 'menu-head' }, t('color.bgHead')),
      h('div', { class: 'color-grid' }, BG_COLORS.map(([c, key]) => h('button', {
        class: 'color-cell', title: t('color.bg', { color: t('color.' + key) }), style: { background: c }, onclick: () => apply('hiliteColor', c),
      }, 'A'))));
    const pop = popover(anchor, box);
  }

  const fmtBtn = (label, title, fn, cls = '') => {
    const btn = h('button', { class: 'fmt-btn ' + cls, title, html: label });
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => fn(btn));
    return btn;
  };
  fmtBar.append(
    fmtBtn('B', t('fmt.bold') + ' · Ctrl+B', () => exec('bold'), 'b'),
    fmtBtn('I', t('fmt.italic') + ' · Ctrl+I', () => exec('italic'), 'i'),
    fmtBtn('U', t('fmt.underline') + ' · Ctrl+U', () => exec('underline'), 'u'),
    fmtBtn('S', t('fmt.strike') + ' · Ctrl+Shift+S', () => exec('strikeThrough'), 's'),
    fmtBtn(icon('code', 16), t('fmt.code') + ' · Ctrl+E', toggleInlineCode),
    fmtBtn(icon('pagelink', 16) + `<span>${t('fmt.pageLinkShort')}</span>`, t('fmt.pageLink') + ' · Ctrl+Shift+K', askPageLink, 'wide'),
    fmtBtn(icon('link', 16), t('fmt.link') + ' · Ctrl+K', askLink),
    fmtBtn('A', t('fmt.color'), askColor, 'color'));

  function updateFmtBar() {
    const s = getSelection();
    const node = (n) => (n?.nodeType === 1 ? n : n?.parentElement)?.closest?.('.text');
    const tx = !s.isCollapsed && s.rangeCount ? node(s.anchorNode) : null;
    if (!tx || mouseDown || !blocksEl.contains(tx) || tx.tagName === 'PRE' || node(s.focusNode) !== tx) { fmtBar.hidden = true; return; }
    const r = s.getRangeAt(0).getBoundingClientRect();
    if (!r.width && !r.height) { fmtBar.hidden = true; return; }
    fmtBar.hidden = false;
    const w = fmtBar.offsetWidth, hh = fmtBar.offsetHeight;
    fmtBar.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
    fmtBar.style.top = (r.top - hh - 8 < 48 ? r.bottom + 8 : r.top - hh - 8) + 'px';
  }
  let fmtFrame = 0;
  document.addEventListener('selectionchange', () => {
    if (!fmtFrame) fmtFrame = requestAnimationFrame(() => { fmtFrame = 0; updateFmtBar(); });
  }, { signal });
  document.addEventListener('mousedown', (e) => { if (!fmtBar.contains(e.target)) mouseDown = true; }, { signal, capture: true });
  document.addEventListener('mouseup', () => { mouseDown = false; updateFmtBar(); }, { signal, capture: true });

  /* ── Глобальные клавиши страницы ── */

  document.addEventListener('keydown', (e) => {
    if (popoverOpen()) return;
    const mod = e.ctrlKey || e.metaKey;
    const field = e.target.closest?.('input, textarea, select, .page-title');
    if (mod && !field && !e.altKey && (e.code === 'KeyZ' || e.code === 'KeyY')) {
      e.preventDefault();
      if (e.code === 'KeyY' || e.shiftKey) redo(); else undo();
      return;
    }
    if (!selected.size || field || e.target.closest?.('[contenteditable]')) return;
    const list = selectedList();
    const first = blocks.indexOf(list[0]), lastI = blocks.indexOf(list[list.length - 1]);
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      pre();
      const before = neighbor(first, -1);
      removeBlocks(withKids(list.map((b) => b.id)));
      changed();
      const next = (e.key === 'Delete' ? null : before) || blocks.filter(visible)[0];
      if (next) (isText(next) ? focusBlock(next, e.key === 'Delete' ? 0 : 'end') : select([next.id]));
    } else if (e.key === 'Escape') { clearSel(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (isText(list[0])) focusBlock(list[0]); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? -1 : 1;
      if (e.shiftKey) {
        const f = neighbor(indexOf(selFocus), dir);
        if (f) { selectRange(selAnchor, f.id); els.get(f.id).scrollIntoView({ block: 'nearest' }); }
      } else {
        const target = neighbor(dir < 0 ? first : lastI, dir) || list[dir < 0 ? 0 : list.length - 1];
        select([target.id]);
        els.get(target.id).scrollIntoView({ block: 'nearest' });
      }
    } else if (mod && e.code === 'KeyA') { e.preventDefault(); select(blocks.filter(visible).map((b) => b.id)); }
    else if (mod && e.code === 'KeyD') { e.preventDefault(); duplicate(list.map((b) => b.id)); }
  }, { signal });

  /* ── Буфер обмена и перетаскивание файлов ── */

  const inPage = (target) => pageEl.contains(target) || target === document.body;

  function onCopy(e, cut) {
    if (!selected.size || !inPage(e.target)) return;
    const ids = withKids(selectedList().map((b) => b.id));
    const list = blocks.filter((b) => ids.includes(b.id));
    e.clipboardData.setData('text/plain', toMarkdown(list));
    e.clipboardData.setData('application/x-liser', JSON.stringify(list));
    e.preventDefault();
    if (cut) { pre(); removeBlocks(ids); changed(); }
  }
  document.addEventListener('copy', (e) => onCopy(e, false), { signal });
  document.addEventListener('cut', (e) => onCopy(e, true), { signal });

  document.addEventListener('paste', async (e) => {
    const cd = e.clipboardData;
    if (!cd || !inPage(e.target) || e.target.closest?.('.page-title, .caption, input, textarea')) return;
    const tx = e.target.closest?.('.text');
    if (!tx && !selected.size && e.target !== document.body) return;
    const text = cd.getData('text/plain');
    const files = [...cd.files].filter((f) => f.type.startsWith('image/'));
    const ref = currentBlock();
    if (files.length && !text) {
      e.preventDefault();
      const list = await filesToBlocks(files);
      place(list, ref);
      select([list[list.length - 1].id]);
      els.get(list[list.length - 1].id)?.scrollIntoView({ block: 'nearest' });
      return;
    }
    const json = cd.getData('application/x-liser');
    if (json) {
      e.preventDefault();
      try {
        const list = JSON.parse(json).map((b) => ({ ...b, id: uid() }));
        place(list, ref);
        select(list.map((b) => b.id).filter((id) => visible(byId.get(id))));
      } catch {}
      return;
    }
    if (!text) return;
    e.preventDefault();
    const b = tx && blockOf(tx);
    if (b && (b.type === 'code' || !text.trim().includes('\n'))) {
      document.execCommand('insertText', false, b.type === 'code' ? text.replace(/\r/g, '') : text.trim());
      return;
    }
    const list = fromText(text);
    if (!list.length) return;
    place(list, ref);
    const lastB = list[list.length - 1];
    if (isText(lastB)) focusBlock(lastB); else select([lastB.id]);
  }, { signal });

  scrollEl.addEventListener('dragover', (e) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); }, { signal });
  scrollEl.addEventListener('drop', async (e) => {
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    const br = blocksEl.getBoundingClientRect();
    const ref = blockOf(document.elementFromPoint(br.left + br.width / 2, e.clientY)) || blocks[blocks.length - 1];
    place(await filesToBlocks(files), ref);
  }, { signal });

  /* ── Обратные ссылки внизу страницы ── */

  let unlinkedOpen = false;

  function snippetEl(text, type) {
    if (type === 'page' || !text.trim()) return h('span', { class: 'bl-snip muted' }, t('bl.asBlock'));
    const s = text.replace(/\s+/g, ' ').trim();
    return h('span', { class: 'bl-snip' }, s.length > 180 ? s.slice(0, 180) + '…' : s);
  }

  function blGroup(list, mention) {
    return list.map(({ page: pm, hits }) => h('div', { class: 'bl-page' },
      h('button', { class: 'bl-title', onclick: () => ctx.navigate(pm.id) },
        h('span', { class: 'bl-ico', html: pm.icon ? '' : icon('page', 16) }, pm.icon || ''),
        h('span', { class: 'bl-name' }, pm.title || t('untitled'))),
      ...hits.map((hit) => h('div', { class: 'bl-hit' },
        h('button', { class: 'bl-go', onclick: () => ctx.navigate(pm.id, hit.blockId) }, snippetEl(hit.text, hit.type)),
        mention && h('button', { class: 'pill-btn small', onclick: async (e) => {
          e.currentTarget.disabled = true;
          if (await store.linkMention(pm.id, hit.blockId, pageId)) { toast(t('bl.linked'), { icon: 'check', ms: 1600 }); renderBacklinks(); }
        } }, t('bl.link'))))));
  }

  async function renderBacklinks() {
    const { linked, unlinked } = await store.backlinks(pageId);
    if (signal.aborted) return;
    const open = store.settings.backlinksOpen !== false;
    const count = linked.reduce((n, g) => n + g.hits.length, 0);
    const mentions = unlinked.reduce((n, g) => n + g.hits.length, 0);
    backEl.hidden = !count && !mentions;
    if (backEl.hidden) return;
    const head = (label, n, isOpen, onToggle) => h('button', { class: 'bl-head' + (isOpen ? ' open' : ''), 'aria-expanded': String(isOpen), onclick: onToggle },
      h('span', { class: 'bl-tw flip', html: icon('chev', 14) }), h('span', null, label), h('span', { class: 'bl-count' }, n));
    backEl.replaceChildren(...[
      count && h('div', { class: 'bl-sec' },
        head(t('bl.title'), count, open, () => { store.setSettings({ backlinksOpen: !open }); renderBacklinks(); }),
        open && h('div', { class: 'bl-list' }, blGroup(linked, false))),
      mentions && h('div', { class: 'bl-sec' },
        head(t('bl.unlinked'), mentions, unlinkedOpen, () => { unlinkedOpen = !unlinkedOpen; renderBacklinks(); }),
        unlinkedOpen && h('div', { class: 'bl-list' }, blGroup(unlinked, true))),
    ].filter(Boolean));
  }

  /* ── Запуск ── */

  applyPageStyle();
  renderHead();
  renderCover();
  mountAll();
  record();
  scrollEl.replaceChildren(coverEl, pageEl);
  scrollEl.scrollTop = 0;

  function flash(blockId) {
    if (!els.has(blockId)) return;
    reveal(blockId);
    const el = els.get(blockId);
    el.scrollIntoView({ block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1600);
  }

  // Внешнее изменение блока (из списка задач или напоминаний)
  const offBlock = store.on('block', (pid, bid) => {
    if (pid !== pageId || !byId.has(bid)) return;
    if (document.activeElement && els.get(bid)?.contains(document.activeElement)) return;
    refresh(byId.get(bid));
  });

  renderBacklinks();
  if (ctx.blockId) requestAnimationFrame(() => flash(ctx.blockId));
  else if (!m.title && blocks.length === 1 && isEmpty(blocks[0])) titleEl.focus();

  return {
    pageId,
    flash,
    applyPageStyle,
    undo,
    redo,
    rename() { setCaret(titleEl, 'end'); getSelection().selectAllChildren(titleEl); },
    stats: () => {
      const text = blocks.map((b) => plainText(b.html)).join(' ').trim();
      return { words: text ? text.split(/\s+/).length : 0, chars: text.length, blocks: blocks.length };
    },
    markdown: () => `# ${m.title || t('untitled')}\n\n` + toMarkdown(blocks),
    destroy() {
      ac.abort();
      offBlock();
      hideCard();
      clearTimeout(hist.timer);
      band.remove();
      fmtBar.remove();
      slashEl.remove();
      wikiEl.remove();
    },
  };
}
