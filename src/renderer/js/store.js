import { uid, debounce, plainText } from './util.js';
import { t, getLang } from './i18n.js';
import { webApi } from './webapi.js';
import { seedPage } from './seed.js';

export const api = window.api || webApi;

export let index = null;
export const settings = {
  theme: 'system', accent: 'blue', zoom: 1, lang: 'system', weekStart: 'auto',
  sidebarWidth: 260, sidebarCollapsed: false, closeToTray: true, autostart: false, sound: true, autoBackup: true,
  defaultFont: 'sans', defaultFullWidth: false, hideDone: true, lastRoute: null,
};
export let info = {};

const pages = new Map();   // id -> { blocks, cover, fullWidth, small, font } — кэш страниц
const dirty = new Set();
let indexDirty = false;
let light = null;          // id -> [{ id, type, text, checked, remind }] для поиска и задач
let currentId = null;
let saving = 0;
let frozen = false;

/* ───────────── События ───────────── */

const listeners = {};
export function on(ev, fn) {
  (listeners[ev] ||= []).push(fn);
  return () => { listeners[ev] = listeners[ev].filter((f) => f !== fn); };
}
function emit(ev, ...args) { (listeners[ev] || []).forEach((fn) => fn(...args)); }

/* ───────────── Загрузка и сохранение ───────────── */

export function init(data) {
  info = data;
  Object.assign(settings, data.settings || {});
  index = data.index;
  if (!index || !index.pages || !Array.isArray(index.root)) {
    index = { version: 1, pages: {}, root: [], trash: [], reminders: [] };
    const seed = seedPage(getLang());
    createPage(null, seed.meta, seed.page);
  }
  index.trash ||= [];
  index.reminders ||= [];
  // Чиним возможные «висячие» ссылки в дереве
  index.root = index.root.filter((id) => index.pages[id]);
  for (const m of Object.values(index.pages)) m.children = (m.children || []).filter((id) => index.pages[id]);
}

const saveSoon = debounce(() => flush(), 450);

export async function flush() {
  saveSoon.cancel();
  if (frozen) return;
  const jobs = [];
  for (const id of dirty) {
    const page = pages.get(id);
    if (!page) continue;
    syncDerived(id, page);
    jobs.push(api.savePage(id, page));
  }
  dirty.clear();
  if (indexDirty) { indexDirty = false; jobs.push(api.saveIndex(index)); }
  if (!jobs.length) return;
  saving++;
  emit('status', 'saving');
  try { await Promise.all(jobs); } catch (err) { console.error(err); saving--; emit('status', 'error'); return; }
  saving--;
  if (!saving && !dirty.size && !indexDirty) emit('status', 'saved');
}

// Синхронный сброс перед закрытием окна
export function flushSync() {
  saveSoon.cancel();
  if (frozen || (!dirty.size && !indexDirty)) return;
  const list = [];
  for (const id of dirty) {
    const page = pages.get(id);
    if (page) { syncDerived(id, page); list.push({ id, data: page }); }
  }
  dirty.clear();
  indexDirty = false;
  api.saveSync({ index, pages: list });
}

// Перед восстановлением из копии: больше ничего не записываем
export function freeze() { saveSoon.cancel(); frozen = true; }

export function touch(id, page) {
  if (page) pages.set(id, page);
  dirty.add(id);
  const m = index.pages[id];
  if (m) m.updated = Date.now();
  indexDirty = true;
  emit('status', 'dirty');
  saveSoon();
}

export function touchIndex() {
  indexDirty = true;
  saveSoon();
}

export function setSettings(patch) {
  Object.assign(settings, patch);
  api.setSettings(patch);
  emit('settings', patch);
}

export function weekStart() {
  if (settings.weekStart === 1 || settings.weekStart === 0) return settings.weekStart;
  return getLang() === 'ru' ? 1 : 0;
}

export async function loadPage(id) {
  if (pages.has(id)) return pages.get(id);
  const data = (await api.loadPage(id)) || {};
  if (!Array.isArray(data.blocks)) data.blocks = [];
  if (pages.has(id)) return pages.get(id); // могла загрузиться параллельно
  pages.set(id, data);
  if (pages.size > 40) {
    for (const key of pages.keys()) {
      if (pages.size <= 30) break;
      if (key !== id && key !== currentId && !dirty.has(key)) pages.delete(key);
    }
  }
  return data;
}

export function setCurrent(id) { currentId = id; }

/* ───────────── Производные данные: напоминания и поисковый кэш ───────────── */

const LINK_RE = /data-page="([^"]+)"/g;
export function linksIn(b) {
  const out = [];
  if (b.type === 'page' && b.page) out.push(b.page);
  if (b.html && b.html.includes('data-page')) for (const mm of b.html.matchAll(LINK_RE)) out.push(mm[1]);
  return out;
}

const toLight = (blocks) => (blocks || []).map((b) => {
  const links = linksIn(b);
  return {
    id: b.id, type: b.type, checked: !!b.checked, remind: b.remind,
    text: plainText(b.html) || b.caption || '',
    ...(links.length && { links }),
  };
});

function syncDerived(id, page) {
  if (light) light.set(id, toLight(page.blocks));
  const old = new Map();
  const rest = [];
  for (const r of index.reminders) (r.pageId === id ? old.set(r.id, r) : rest.push(r));
  const mine = [];
  for (const b of page.blocks) {
    if (!b.remind?.at) continue;
    const prev = old.get(b.id);
    mine.push({
      id: b.id, pageId: id, at: b.remind.at,
      ...(b.remind.repeat && { repeat: b.remind.repeat }),
      text: (plainText(b.html) || '').slice(0, 140),
      fired: !!(prev && prev.at === b.remind.at && prev.fired),
      done: b.type === 'todo' && !!b.checked && !b.remind.repeat,
    });
  }
  if (JSON.stringify(mine) !== JSON.stringify([...old.values()])) {
    index.reminders = rest.concat(mine);
    indexDirty = true;
    emit('reminders');
  }
}

async function ensureLight() {
  if (light) return;
  const all = await api.allPages();
  light = new Map(all.map((p) => [p.id, toLight(p.blocks)]));
  for (const [id, page] of pages) light.set(id, toLight(page.blocks));
}

export function markFired(ids) {
  const set = new Set(ids);
  const hit = index.reminders.filter((r) => set.has(r.id) && !r.fired);
  hit.forEach((r) => { r.fired = true; });
  if (hit.length) { touchIndex(); emit('reminders'); }
  return hit;
}

export const activeReminders = () => index.reminders.filter((r) => index.pages[r.pageId] && !isTrashed(r.pageId));

/* ───────────── Дерево страниц ───────────── */

export const meta = (id) => index.pages[id];
export const childrenOf = (id) => (id ? index.pages[id]?.children || [] : index.root);
export const titleOf = (id) => index.pages[id]?.title || t('untitled');

export function isTrashed(id) {
  for (let m = index.pages[id], guard = 0; m && guard < 100; m = index.pages[m.parent], guard++) {
    if (m.trashed) return true;
  }
  return !index.pages[id];
}

export function pathOf(id) {
  const out = [];
  for (let m = index.pages[id], guard = 0; m && guard < 100; m = index.pages[m.parent], guard++) out.unshift(m);
  return out;
}

export function walk(fn, ids = index.root, depth = 0) {
  for (const id of ids) {
    const m = index.pages[id];
    if (!m) continue;
    fn(m, depth);
    if (m.children?.length) walk(fn, m.children, depth + 1);
  }
}

export function firstPageId() {
  return index.root.find((id) => index.pages[id]) || null;
}

function detach(id) {
  const m = index.pages[id];
  const list = childrenOf(m.parent && index.pages[m.parent] ? m.parent : null);
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
}

export function createPage(parentId = null, props = {}, data = null) {
  const id = uid();
  const now = Date.now();
  const m = { id, title: '', icon: '', parent: parentId, children: [], created: now, updated: now, ...props };
  index.pages[id] = m;
  if (parentId && index.pages[parentId]) {
    index.pages[parentId].children.push(id);
    index.pages[parentId].open = true;
  } else {
    m.parent = null;
    index.root.push(id);
  }
  const page = data || { blocks: [{ id: uid(), type: 'p', html: '' }] };
  if (!data) {
    if (settings.defaultFont && settings.defaultFont !== 'sans') page.font = settings.defaultFont;
    if (settings.defaultFullWidth) page.fullWidth = true;
  }
  pages.set(id, page);
  dirty.add(id);
  touchIndex();
  emit('tree');
  return id;
}

export function setTitle(id, title) {
  const m = index.pages[id];
  if (!m || m.title === title) return;
  m.title = title;
  m.updated = Date.now();
  touchIndex();
  emit('title', id);
}

export function setMeta(id, patch) {
  const m = index.pages[id];
  if (!m) return;
  Object.assign(m, patch);
  touchIndex();
  emit('tree');
}

export function trashPage(id) {
  const m = index.pages[id];
  if (!m || m.trashed) return;
  detach(id);
  m.trashed = Date.now();
  index.trash.unshift(id);
  touchIndex();
  emit('tree');
  emit('reminders');
}

export function restorePage(id) {
  const m = index.pages[id];
  if (!m || !m.trashed) return;
  delete m.trashed;
  index.trash = index.trash.filter((x) => x !== id);
  if (m.parent && index.pages[m.parent] && !isTrashed(m.parent)) index.pages[m.parent].children.push(id);
  else { m.parent = null; index.root.push(id); }
  touchIndex();
  emit('tree');
  emit('reminders');
}

export function purgePage(id) {
  const m = index.pages[id];
  if (!m) return;
  const drop = [];
  const collect = (pid) => { drop.push(pid); (index.pages[pid]?.children || []).forEach(collect); };
  collect(id);
  if (!m.trashed) detach(id);
  const gone = new Set(drop);
  for (const pid of drop) {
    delete index.pages[pid];
    pages.delete(pid);
    dirty.delete(pid);
    light?.delete(pid);
    api.deletePage(pid);
  }
  index.trash = index.trash.filter((x) => !gone.has(x));
  index.reminders = index.reminders.filter((r) => !gone.has(r.pageId));
  touchIndex();
  emit('tree');
  emit('reminders');
}

export function emptyTrash() {
  for (const id of [...index.trash]) purgePage(id);
}

export function movePage(id, targetId, pos) {
  const m = index.pages[id];
  const target = index.pages[targetId];
  if (!m || !target || id === targetId) return false;
  if (pathOf(targetId).some((p) => p.id === id)) return false; // нельзя вложить страницу в саму себя
  detach(id);
  if (pos === 'in') {
    m.parent = targetId;
    target.children.push(id);
    target.open = true;
  } else {
    m.parent = target.parent || null;
    const list = childrenOf(m.parent);
    const i = list.indexOf(targetId);
    list.splice(pos === 'before' ? i : i + 1, 0, id);
  }
  touchIndex();
  emit('tree');
  return true;
}

export async function duplicatePage(id) {
  const m = index.pages[id];
  if (!m) return null;
  const src = await loadPage(id);
  const copy = JSON.parse(JSON.stringify(src));
  copy.blocks.forEach((b) => { b.id = uid(); delete b.remind; });
  const newId = createPage(m.parent, { title: (m.title || t('untitled')) + t('pm.copySuffix'), icon: m.icon }, copy);
  movePage(newId, id, 'after');
  return newId;
}

/* ───────────── Точечные правки блоков (из списков задач и напоминаний) ───────────── */

export async function updateBlock(pageId, blockId, patch) {
  const page = await loadPage(pageId);
  const b = page.blocks.find((x) => x.id === blockId);
  if (!b) return false;
  for (const k in patch) (patch[k] === undefined ? delete b[k] : (b[k] = patch[k]));
  touch(pageId, page);
  emit('block', pageId, blockId);
  return true;
}

/* ───────────── Поиск и задачи ───────────── */

function snippet(text, i, len) {
  const from = Math.max(0, i - 30);
  return (from > 0 ? '…' : '') + text.slice(from, i + len + 60).replace(/\s+/g, ' ');
}

export async function search(query) {
  await flush();
  await ensureLight();
  const q = query.trim().toLowerCase();
  const out = [];
  walk((m) => {
    const title = (m.title || '').toLowerCase();
    const inTitle = title.includes(q);
    let blockId = null, snip = '';
    for (const b of light.get(m.id) || []) {
      const i = b.text.toLowerCase().indexOf(q);
      if (i >= 0) { blockId = b.id; snip = snippet(b.text, i, q.length); break; }
    }
    if (inTitle || blockId) {
      out.push({ id: m.id, blockId: inTitle ? null : blockId, snippet: snip, score: inTitle ? (title.startsWith(q) ? 3 : 2) : 1, updated: m.updated });
    }
  });
  return out.sort((a, b) => b.score - a.score || b.updated - a.updated).slice(0, 40);
}

export function recentPages(limit = 8) {
  const out = [];
  walk((m) => out.push(m));
  return out.sort((a, b) => b.updated - a.updated).slice(0, limit);
}

/* ───────────── Связи между страницами ───────────── */

const alive = (id) => !!index.pages[id] && !isTrashed(id);

// Страницы для выбора ссылки: сначала точное совпадение, потом начало названия, потом вхождение
export function findPages(query, limit = 8, exclude = null) {
  const q = query.trim().toLowerCase();
  const out = [];
  walk((m) => {
    if (m.id === exclude) return;
    const title = (m.title || '').toLowerCase();
    if (!q) out.push({ m, s: 0 });
    else if (title === q) out.push({ m, s: 3 });
    else if (title.startsWith(q)) out.push({ m, s: 2 });
    else if (title.includes(q)) out.push({ m, s: 1 });
  });
  return out.sort((a, b) => b.s - a.s || b.m.updated - a.m.updated).slice(0, limit).map((x) => x.m);
}

export function pageByTitle(title) {
  const q = title.trim().toLowerCase();
  let hit = null;
  if (q) walk((m) => { if (!hit && (m.title || '').trim().toLowerCase() === q) hit = m; });
  return hit;
}

// Все связи: ссылки из текста и блоки-страницы, плюс вложенность
export async function linkGraph() {
  await flush();
  await ensureLight();
  const nodes = [];
  const links = [];
  const seen = new Set();
  walk((m) => {
    nodes.push(m);
    if (m.parent && alive(m.parent)) links.push({ a: m.parent, b: m.id, tree: true });
    for (const b of light.get(m.id) || []) {
      for (const to of b.links || []) {
        if (to === m.id || !alive(to)) continue;
        const key = m.id < to ? m.id + '|' + to : to + '|' + m.id;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ a: m.id, b: to });
      }
    }
  });
  return { nodes, links };
}

// Кто ссылается на страницу и где ещё встречается её название без ссылки
export async function backlinks(id) {
  await flush();
  await ensureLight();
  const title = (index.pages[id]?.title || '').trim().toLowerCase();
  const linked = [];
  const unlinked = [];
  walk((m) => {
    if (m.id === id) return;
    const hits = [];
    const mentions = [];
    for (const b of light.get(m.id) || []) {
      if (b.links?.includes(id)) hits.push({ blockId: b.id, text: b.text, type: b.type });
      else if (title.length >= 3 && b.type !== 'code') {
        const i = b.text.toLowerCase().indexOf(title);
        if (i >= 0) mentions.push({ blockId: b.id, text: snippet(b.text, i, title.length) });
      }
    }
    if (hits.length) linked.push({ page: m, hits });
    if (mentions.length) unlinked.push({ page: m, hits: mentions });
  });
  return { linked, unlinked };
}

// Превратить первое упоминание названия в блоке другой страницы в ссылку
export async function linkMention(pageId, blockId, targetId) {
  const page = await loadPage(pageId);
  const b = page.blocks.find((x) => x.id === blockId);
  const title = (index.pages[targetId]?.title || '').trim();
  if (!b || !b.html || !title) return false;
  const tpl = document.createElement('template');
  tpl.innerHTML = b.html;
  const w = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
  const q = title.toLowerCase();
  let n;
  while ((n = w.nextNode())) {
    if (n.parentElement?.closest('a, code')) continue;
    const i = n.nodeValue.toLowerCase().indexOf(q);
    if (i < 0) continue;
    const mid = n.splitText(i);
    mid.splitText(title.length);
    const a = document.createElement('a');
    a.dataset.page = targetId;
    a.textContent = mid.nodeValue;
    mid.replaceWith(a);
    b.html = tpl.innerHTML;
    touch(pageId, page);
    emit('block', pageId, blockId);
    return true;
  }
  return false;
}

export async function allTodos() {
  await flush();
  await ensureLight();
  const out = [];
  walk((m) => {
    const items = (light.get(m.id) || []).filter((b) => b.type === 'todo' && b.text.trim());
    if (items.length) out.push({ page: m, items });
  });
  return out;
}
