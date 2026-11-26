import { h, $, clamp, fmtAgo, nextOccurrence } from './util.js';
import { icon } from './icons.js';
import { t, tn, setLang, resolveLang } from './i18n.js';
import * as store from './store.js';
import { mountSidebar } from './sidebar.js';
import { mountEditor } from './editor.js';
import { openSearch, renderReminders, renderTasks, openTrash, openSettings } from './views.js';
import { openFind, closeFind } from './find.js';
import { renderGraph } from './graph.js';
import { menu, toast, closePopovers, confirmBox } from './ui.js';

const api = store.api;
const scrollEl = $('#scroll');
const topbar = $('#topbar');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const narrowQuery = matchMedia('(max-width: 760px)');
let sidebar = null;
let navToken = 0;
let narrowOpen = false;
let settingsView = null;

const app = {
  route: { type: 'none' },
  editor: null,
  view: null,
  navigate,
  newPage,
  trashPage,
  renamePage,
  toggleSidebar,
  setTheme,
  setAccent,
  setZoom,
  zoomStep,
  setLang: changeLang,
  restoreBackup,
  openSearch: () => openSearch(app),
  openSettings: (section) => { settingsView = openSettings(app, section); },
  openTrash: (anchor) => openTrash(anchor, app),
};

/* ───────────── Тема, акцент, масштаб, язык ───────────── */

const isDark = () => store.settings.theme === 'dark' || (store.settings.theme !== 'light' && darkQuery.matches);

function applyTheme() {
  const dark = isDark();
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.accent = store.settings.accent || 'blue';
  root.style.colorScheme = dark ? 'dark' : 'light';
  api.setTheme({ dark, zoom: store.settings.zoom });
  dispatchEvent(new Event('themechange'));
}

function setTheme(theme) {
  store.setSettings({ theme });
  applyTheme();
}

function setAccent(accent) {
  store.setSettings({ accent });
  applyTheme();
}

// Отступ под системные кнопки окна (свернуть/развернуть/закрыть)
function applyWindowControls() {
  const root = document.documentElement.style;
  const z = store.settings.zoom || 1;
  const wco = navigator.windowControlsOverlay;
  let l = 0, r = 0;
  if (api.isDesktop) {
    const rect = wco?.visible ? wco.getTitlebarAreaRect() : null;
    if (rect && rect.width > 0) { l = rect.x; r = Math.max(0, innerWidth - rect.x - rect.width); }
    else r = Math.ceil(142 / z);
  }
  root.setProperty('--wc-l', Math.round(l) + 'px');
  root.setProperty('--wc-r', Math.round(r) + 'px');
  document.body.classList.toggle('wco-l', l > 0);
  document.body.classList.toggle('wco-r', r > 0);
}

function applyZoom() {
  api.setZoom(store.settings.zoom || 1);
  requestAnimationFrame(applyWindowControls);
}

// Шаги масштаба как в браузере: мелкие около 100 %, крупнее по краям
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

function setZoom(z) {
  z = clamp(Math.round(z * 100) / 100, 0.5, 2);
  if (z === store.settings.zoom) { showZoom(); return; }
  store.setSettings({ zoom: z });
  applyZoom();
  api.setTheme({ dark: isDark(), zoom: z });
  showZoom();
  dispatchEvent(new Event('zoomchange'));
}

function zoomStep(dir) {
  const cur = store.settings.zoom || 1;
  const next = dir > 0 ? ZOOM_STEPS.find((s) => s > cur + 0.001) : [...ZOOM_STEPS].reverse().find((s) => s < cur - 0.001);
  setZoom(next ?? cur);
}

// Плашка с текущим масштабом и кнопкой сброса — видна пару секунд после изменения
let zoomPill = null, zoomTimer = 0;
function showZoom() {
  const z = store.settings.zoom || 1;
  if (!zoomPill) {
    zoomPill = h('div', { class: 'zoom-pill', role: 'status' }, h('span', { class: 'zoom-val' }),
      h('button', { class: 'zoom-reset', onclick: () => setZoom(1) }, t('zoom.reset')));
    zoomPill.addEventListener('mouseenter', () => clearTimeout(zoomTimer));
    zoomPill.addEventListener('mouseleave', () => { zoomTimer = setTimeout(() => zoomPill.classList.remove('show'), 900); });
    $('#layer').append(zoomPill);
  }
  zoomPill.querySelector('.zoom-val').textContent = Math.round(z * 100) + '%';
  zoomPill.querySelector('.zoom-reset').hidden = z === 1;
  zoomPill.classList.add('show');
  clearTimeout(zoomTimer);
  zoomTimer = setTimeout(() => zoomPill.classList.remove('show'), 1600);
}

function applyLang() {
  setLang(resolveLang(store.settings.lang, store.info.systemLang));
}

// Смена языка: перерисовываем всё без перезагрузки окна
async function changeLang(lang) {
  const section = settingsView?.section();
  store.setSettings({ lang });
  applyLang();
  closePopovers();
  closeFind();
  sidebar.destroy();
  sidebar = mountSidebar($('#sidebar'), app);
  const route = app.route;
  app.route = { type: 'none' };
  await navigate(route, { keepScroll: true });
  if (section) app.openSettings(section);
}

/* ───────────── Боковая панель ───────────── */

function applySidebar() {
  document.documentElement.style.setProperty('--side-w', clamp(store.settings.sidebarWidth || 260, 220, 440) + 'px');
  const narrow = narrowQuery.matches;
  document.body.classList.toggle('narrow', narrow);
  document.body.classList.toggle('side-collapsed', narrow ? !narrowOpen : !!store.settings.sidebarCollapsed);
}

function toggleSidebar() {
  if (narrowQuery.matches) narrowOpen = !narrowOpen;
  else store.setSettings({ sidebarCollapsed: !store.settings.sidebarCollapsed });
  applySidebar();
}

/* ───────────── Навигация ───────────── */

async function navigate(route, opts = {}) {
  closePopovers();
  closeFind();
  if (route.type === 'page' && (!store.meta(route.id) || store.isTrashed(route.id))) {
    const first = store.firstPageId();
    route = first ? { type: 'page', id: first } : { type: 'empty' };
  }
  if (!['page', 'reminders', 'tasks', 'graph', 'empty'].includes(route.type)) {
    const first = store.firstPageId();
    route = first ? { type: 'page', id: first } : { type: 'empty' };
  }
  if (route.type === 'page' && app.route.type === 'page' && app.route.id === route.id && app.editor) {
    if (opts.blockId) app.editor.flash(opts.blockId);
    return;
  }
  const token = ++navToken;
  const scrollTop = opts.keepScroll ? scrollEl.scrollTop : 0;
  let page = null, graph = null;
  if (route.type === 'page') {
    await store.flush();
    page = await store.loadPage(route.id);
    if (token !== navToken) return;
  } else if (route.type === 'graph') {
    graph = await store.linkGraph();
    if (token !== navToken) return;
  }
  app.editor?.destroy();
  app.view?.destroy?.();
  app.editor = null;
  app.view = null;
  if (app.route.type === 'page') app.lastPageId = app.route.id;
  app.route = route;
  store.setCurrent(route.type === 'page' ? route.id : null);
  if (narrowQuery.matches && narrowOpen) { narrowOpen = false; applySidebar(); }

  if (route.type === 'page') {
    app.editor = mountEditor(scrollEl, route.id, page, { navigate: (id, blockId) => navigate({ type: 'page', id }, { blockId }), blockId: opts.blockId });
    document.title = store.titleOf(route.id) + ' — Liser';
  } else if (route.type === 'reminders') {
    app.view = renderReminders(scrollEl, app);
    document.title = t('rem.title') + ' — Liser';
  } else if (route.type === 'tasks') {
    app.view = await renderTasks(scrollEl, app);
    document.title = t('tasks.title') + ' — Liser';
  } else if (route.type === 'graph') {
    app.view = renderGraph(scrollEl, app, route, graph);
    document.title = t('side.graph') + ' — Liser';
  } else {
    document.title = 'Liser';
    scrollEl.replaceChildren(h('div', { class: 'page view' }, h('div', { class: 'empty-state big' },
      h('div', { class: 'empty-ico', html: icon('page', 26) }),
      h('div', { class: 'empty-title' }, t('empty.title')),
      h('div', { class: 'empty-text' }, t('empty.text')),
      h('button', { class: 'btn btn-primary', onclick: () => newPage() }, t('side.new')))));
  }
  if (scrollTop) scrollEl.scrollTop = scrollTop;
  renderTopbar();
  sidebar.render();
  if (route.type !== 'empty') store.setSettings({ lastRoute: route });
}

function newPage(parentId = null) {
  const id = store.createPage(typeof parentId === 'string' ? parentId : null);
  navigate({ type: 'page', id });
}

async function renamePage(id) {
  await navigate({ type: 'page', id });
  app.editor?.rename();
}

function trashPage(id) {
  const title = store.titleOf(id);
  const affectsCurrent = app.route.type === 'page' && store.pathOf(app.route.id).some((p) => p.id === id);
  store.trashPage(id);
  if (affectsCurrent) navigate({ type: 'page', id: store.firstPageId() });
  toast(t('toast.trashed', { title }), { action: t('undoAction'), onAction: () => { store.restorePage(id); navigate({ type: 'page', id }); }, ms: 6000 });
}

async function restoreBackup() {
  const dir = await api.pickBackup();
  if (!dir) return;
  if (dir.error) { toast(t('set.restoreBad'), { icon: 'info' }); return; }
  if (!(await confirmBox(t('set.restoreConfirm'), t('set.restoreBtnOk'), false))) return;
  await store.flush();
  store.freeze();
  let ok = false;
  try { ok = await api.restore(dir.path); } catch (err) { console.error(err); }
  // При успехе окно перезагрузится само; при ошибке снова разрешаем сохранение, иначе правки будут теряться
  if (!ok) { store.unfreeze(); toast(t('set.restoreFailed'), { icon: 'info' }); }
}

/* ───────────── Верхняя панель ───────────── */

const statusEl = h('span', { class: 'status' });
const VIEW_TITLES = { reminders: ['bell', 'rem.title'], tasks: ['todo', 'tasks.title'], graph: ['graph', 'side.graph'] };

function renderTopbar() {
  const r = app.route;
  const crumbs = h('div', { class: 'crumbs' });
  if (r.type === 'page') {
    const path = store.pathOf(r.id);
    const shown = path.length > 3 ? [path[0], null, ...path.slice(-2)] : path;
    shown.forEach((m, i) => {
      if (i) crumbs.append(h('span', { class: 'crumb-sep' }, '/'));
      if (!m) { crumbs.append(h('span', { class: 'crumb-sep' }, '…')); return; }
      crumbs.append(h('button', { class: 'crumb', 'data-id': m.id, onclick: () => navigate({ type: 'page', id: m.id }) },
        m.icon && h('span', { class: 'crumb-ico' }, m.icon), h('span', { class: 'crumb-title' }, m.title || t('untitled'))));
    });
  } else if (VIEW_TITLES[r.type]) {
    const [ic, key] = VIEW_TITLES[r.type];
    crumbs.append(h('span', { class: 'crumb static' }, h('span', { class: 'crumb-ico', html: icon(ic, 16) }), h('span', { class: 'crumb-title' }, t(key))));
  }
  const right = [];
  if (r.type === 'page') {
    const m = store.meta(r.id);
    right.push(statusEl,
      h('button', { class: 'icon-btn' + (m.fav ? ' fav' : ''), title: m.fav ? t('pm.unfav') : t('pm.fav'), html: icon('star', 18), onclick: () => { store.setMeta(r.id, { fav: !m.fav }); renderTopbar(); } }),
      h('button', { class: 'icon-btn', title: t('top.options'), html: icon('dots', 18), onclick: (e) => pageMenu(e.currentTarget) }));
  }
  topbar.replaceChildren(
    h('button', { class: 'icon-btn side-open', title: t('side.show') + ' · Ctrl+\\', html: icon('sidebar', 18), onclick: toggleSidebar }),
    crumbs, h('div', { class: 'top-space' }), ...right);
}

async function exportPdf() {
  const id = app.route.id;
  for (const img of scrollEl.querySelectorAll('img')) { img.loading = 'eager'; await img.decode().catch(() => {}); }
  const name = store.titleOf(id).replace(/[\\/:*?"<>|]/g, ' ').trim() || 'Liser';
  if (await api.exportPdf(name + '.pdf')) toast(t('pm.exported'), { icon: 'check' });
}

async function pageMenu(anchor) {
  const id = app.route.id;
  const m = store.meta(id);
  const page = await store.loadPage(id);
  const set = (patch) => { Object.assign(page, patch); store.touch(id, page); app.editor?.applyPageStyle(); };
  const fonts = h('div', { class: 'font-row' }, [['sans', 'font.sans'], ['serif', 'font.serif'], ['mono', 'font.mono']].map(([f, key]) => {
    const btn = h('button', { class: 'font-btn' + ((page.font || 'sans') === f ? ' on' : ''), 'data-font': f },
      h('span', { class: 'font-aa' }, 'Аа'), h('span', null, t(key)));
    btn.addEventListener('click', () => { set({ font: f }); fonts.querySelector('.on')?.classList.remove('on'); btn.classList.add('on'); });
    return btn;
  }));
  const st = app.editor?.stats() || { words: 0 };
  menu(anchor, [
    { custom: fonts },
    { sep: true },
    { icon: 'text', label: t('pm.smallText'), toggle: !!page.small, onClick: (v) => set({ small: v }) },
    { icon: 'width', label: t('pm.fullWidth'), toggle: !!page.fullWidth, onClick: (v) => set({ fullWidth: v }) },
    { sep: true },
    { icon: 'search', label: t('pm.find'), hint: 'Ctrl+F', onClick: () => openFind(scrollEl) },
    { icon: 'graph', label: t('graph.local'), onClick: () => navigate({ type: 'graph', id }) },
    { icon: 'star', label: m.fav ? t('pm.unfav') : t('pm.fav'), onClick: () => { store.setMeta(id, { fav: !m.fav }); renderTopbar(); } },
    { icon: 'copy', label: t('pm.duplicate'), onClick: async () => { const nid = await store.duplicatePage(id); if (nid) navigate({ type: 'page', id: nid }); } },
    { icon: 'download', label: t('pm.exportMd'), onClick: async () => {
      const name = store.titleOf(id).replace(/[\\/:*?"<>|]/g, ' ').trim() + '.md';
      if (await api.saveFile({ name, content: app.editor.markdown() })) toast(t('pm.exported'), { icon: 'check' });
    } },
    { icon: 'file', label: t('pm.exportPdf'), onClick: exportPdf },
    { sep: true },
    { icon: 'trash', label: t('pm.trash'), danger: true, onClick: () => trashPage(id) },
    { sep: true },
    { custom: h('div', { class: 'menu-foot' }, `${tn('words', st.words)} · ${t('pm.edited', { when: fmtAgo(m.updated) })}`) },
  ], { align: 'end' });
}

/* ───────────── Напоминания ───────────── */

function onReminders(ids) {
  const fired = store.markFired(ids);
  for (const r of fired) {
    const open = () => navigate({ type: 'page', id: r.pageId }, { blockId: r.id });
    toast(r.text || t('rem.fallback'), {
      icon: 'bell', ms: 12000,
      actions: [
        { label: t('open'), onClick: open },
        { label: t('rem.snooze'), onClick: () => store.updateBlock(r.pageId, r.id, { remind: { at: Date.now() + 600000, ...(r.repeat && { repeat: r.repeat }) } }) },
      ],
    });
    if (r.repeat) {
      const next = nextOccurrence(r.at, r.repeat);
      if (next) store.updateBlock(r.pageId, r.id, { remind: { at: next, repeat: r.repeat } });
    }
  }
  store.flush();
}

/* ───────────── Запуск ───────────── */

async function boot() {
  const data = await api.load();
  store.info.systemLang = data.systemLang;
  Object.assign(store.settings, data.settings || {});
  setLang(resolveLang(store.settings.lang, data.systemLang));
  store.init(data);
  applyLang();
  applyZoom();
  applyTheme();
  applySidebar();
  sidebar = mountSidebar($('#sidebar'), app);

  const labels = { dirty: 'saving', saving: 'saving', saved: 'saved', error: 'saveError' };
  store.on('status', (s) => { statusEl.textContent = t(labels[s]); statusEl.dataset.state = s; });
  store.on('title', (id) => {
    const el = topbar.querySelector(`.crumb[data-id="${id}"] .crumb-title`);
    if (el) el.textContent = store.titleOf(id);
    if (app.route.id === id) document.title = store.titleOf(id) + ' — Liser';
  });
  store.on('tree', () => { if (app.route.type === 'page' && store.meta(app.route.id)) renderTopbar(); });
  store.on('reminders', () => { if (app.route.type === 'reminders') app.view?.refresh(); });

  darkQuery.addEventListener('change', applyTheme);
  narrowQuery.addEventListener('change', () => { narrowOpen = false; applySidebar(); });
  navigator.windowControlsOverlay?.addEventListener('geometrychange', applyWindowControls);
  addEventListener('resize', applyWindowControls);
  applyWindowControls();

  $('#scrim').addEventListener('click', () => { narrowOpen = false; applySidebar(); });

  const last = store.settings.lastRoute;
  await navigate(last && last.type ? last : { type: 'page', id: store.firstPageId() });
  requestAnimationFrame(() => document.body.classList.add('ready'));

  // Первый запуск после обновления
  const ver = store.info.version;
  if (ver && store.info.packaged) {
    const prev = store.settings.lastVersion;
    if (prev && prev !== ver) toast(t('app.updated', { v: ver }), { icon: 'check', ms: 6000 });
    if (prev !== ver) store.setSettings({ lastVersion: ver });
  }

  /* Горячие клавиши приложения (по физическим клавишам — работают в любой раскладке) */
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    switch (e.code) {
      case 'KeyN': newPage(); break;
      case 'KeyP': openSearch(app); break;
      case 'KeyF': {
        const sel = getSelection().toString().trim();
        openFind(scrollEl, sel.length < 60 ? sel : '');
        break;
      }
      case 'KeyS':
        if (e.shiftKey) return;
        store.flush().then(() => toast(t('saved'), { icon: 'check', ms: 1400 }));
        break;
      case 'Comma': app.openSettings(); break;
      case 'KeyG': if (e.shiftKey) return; navigate({ type: 'graph' }); break;
      case 'Backslash': toggleSidebar(); break;
      case 'KeyL': if (!e.shiftKey) return; setTheme(isDark() ? 'light' : 'dark'); break;
      // Ctrl+Shift+цифры заняты сменой типа блока, поэтому масштаб — только без Shift (кроме «+», который на Shift+=)
      case 'Equal': case 'NumpadAdd': zoomStep(1); break;
      case 'Minus': case 'NumpadSubtract': if (e.shiftKey) return; zoomStep(-1); break;
      case 'Digit0': case 'Numpad0': if (e.shiftKey) return; setZoom(1); break;
      default: return;
    }
    e.preventDefault();
  });

  // Ctrl+колесо и жест тачпада: мелкие сдвиги копятся, один щелчок колеса — один шаг масштаба
  let wheelAcc = 0, wheelAt = 0;
  addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const now = performance.now();
    if (now - wheelAt > 250) wheelAcc = 0;
    wheelAt = now;
    wheelAcc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
    if (Math.abs(wheelAcc) >= 60) {
      zoomStep(wheelAcc < 0 ? 1 : -1);
      wheelAcc = 0;
    }
  }, { passive: false });

  addEventListener('beforeunload', () => store.flushSync());
  addEventListener('blur', () => store.flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) store.flush(); });

  api.on('flush', () => store.flush());
  api.on('new-page', () => newPage());
  api.on('navigate', ({ pageId, blockId }) => navigate({ type: 'page', id: pageId }, { blockId }));
  api.on('reminder', onReminders);

  setInterval(() => sidebar.updateBadge(), 60000);
}

boot().catch((err) => {
  console.error(err);
  document.body.append(h('pre', { class: 'fatal' }, t('app.failed') + '\n' + (err?.stack || err)));
});
