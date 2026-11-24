import { h, debounce, fmtRemind, fmtAgo, dayDiff, escapeHtml } from './util.js';
import { icon } from './icons.js';
import { t, tn, LANGS } from './i18n.js';
import * as store from './store.js';
import { modal, popover, datePicker, confirmBox, toast } from './ui.js';
import { toMarkdown } from './editor.js';

const pageIcon = (m) => h('span', { class: 'row-ico', html: m?.icon ? '' : icon('page', 16) }, m?.icon || '');
const pageTitle = (m) => m?.title || t('untitled');
const remindChip = (r, cls = '') => h('span', {
  class: 'chip remind ' + cls,
  html: icon(r.repeat ? 'repeat' : 'bell', 12) + `<span>${escapeHtml(fmtRemind(r.at))}</span>`,
});

/* ───────────── Поиск ───────────── */

export function openSearch(app) {
  const input = h('input', { class: 'search-input', type: 'text', placeholder: t('search.ph'), spellcheck: 'false' });
  const list = h('div', { class: 'search-list' });
  let results = [], cur = 0, token = 0;

  const go = (r) => { m.close(); app.navigate({ type: 'page', id: r.id }, { blockId: r.blockId }); };
  const mark = (text, q) => {
    const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' + escapeHtml(text.slice(i + q.length));
  };
  const draw = (q) => {
    list.replaceChildren();
    if (!results.length) { list.append(h('div', { class: 'empty-note' }, q ? t('search.none') : t('search.empty'))); return; }
    if (!q) list.append(h('div', { class: 'menu-head' }, t('search.recent')));
    results.forEach((r, i) => {
      const meta = store.meta(r.id);
      const trail = store.pathOf(r.id).slice(0, -1).map(pageTitle).join(' / ');
      list.append(h('button', { class: 'search-row' + (i === cur ? ' on' : ''), onclick: () => go(r), onmousemove: () => { if (cur !== i) { cur = i; hl(); } } },
        pageIcon(meta),
        h('span', { class: 'search-main' },
          h('span', { class: 'search-title', html: mark(pageTitle(meta), q) }),
          (r.snippet || trail) && h('span', { class: 'search-sub', html: r.snippet ? mark(r.snippet, q) : escapeHtml(trail) })),
        h('span', { class: 'search-time' }, fmtAgo(meta.updated))));
    });
  };
  const hl = () => [...list.querySelectorAll('.search-row')].forEach((el, i) => el.classList.toggle('on', i === cur));

  const run = async () => {
    const q = input.value.trim();
    const mine = ++token;
    const res = q ? await store.search(q) : store.recentPages(8).map((p) => ({ id: p.id }));
    if (mine !== token) return;
    results = res;
    cur = 0;
    draw(q);
  };
  input.addEventListener('input', debounce(run, 90));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      cur = (cur + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
      hl();
      list.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && results[cur]) { e.preventDefault(); go(results[cur]); }
  });

  const m = modal([h('div', { class: 'search-head' }, h('span', { class: 'search-ico', html: icon('search', 18) }), input, h('kbd', null, 'Esc')), list], { class: 'search' });
  run();
  input.focus();
}

/* ───────────── Общая оболочка экранов ───────────── */

function viewShell(scrollEl, ic, title, subtitle) {
  const body = h('div', { class: 'view-body' });
  const tools = h('div', { class: 'view-tools' });
  scrollEl.replaceChildren(h('div', { class: 'page view' },
    h('div', { class: 'view-head' },
      h('div', { class: 'view-icon', html: icon(ic, 30) }),
      h('h1', { class: 'view-title' }, title),
      h('div', { class: 'view-sub' }, subtitle), tools),
    body));
  scrollEl.scrollTop = 0;
  return { body, tools };
}

const emptyState = (ic, title, text) => h('div', { class: 'empty-state' },
  h('div', { class: 'empty-ico', html: icon(ic, 26) }), h('div', { class: 'empty-title' }, title), h('div', { class: 'empty-text' }, text));

/* ───────────── Напоминания ───────────── */

export function renderReminders(scrollEl, app) {
  const { body } = viewShell(scrollEl, 'bell', t('rem.title'), t('rem.sub'));

  const draw = () => {
    const now = Date.now();
    const all = store.activeReminders().slice().sort((a, b) => a.at - b.at);
    const groups = [
      [t('rem.overdue'), all.filter((r) => !r.done && r.at <= now), 'late'],
      [t('rem.today'), all.filter((r) => !r.done && r.at > now && dayDiff(r.at) === 0)],
      [t('rem.tomorrow'), all.filter((r) => !r.done && r.at > now && dayDiff(r.at) === 1)],
      [t('rem.later'), all.filter((r) => !r.done && dayDiff(r.at) > 1)],
      [t('rem.done'), all.filter((r) => r.done).reverse(), 'done'],
    ];
    body.replaceChildren();
    if (!all.length) {
      body.append(emptyState('bell', t('rem.emptyTitle'), t('rem.emptyText')));
      return;
    }
    for (const [title, items, cls] of groups) {
      if (!items.length) continue;
      body.append(h('div', { class: 'group-head ' + (cls || '') }, title, h('span', { class: 'group-count' }, String(items.length))));
      for (const r of items) {
        const meta = store.meta(r.pageId);
        const chip = remindChip(r, cls);
        chip.setAttribute('role', 'button');
        chip.title = t('rem.change');
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          datePicker(chip, r, async (v) => {
            await store.updateBlock(r.pageId, r.id, { remind: v || undefined });
            await store.flush();
            draw();
          }, { align: 'end', weekStart: store.weekStart() });
        });
        body.append(h('div', { class: 'list-row', onclick: () => app.navigate({ type: 'page', id: r.pageId }, { blockId: r.id }) },
          h('span', { class: 'list-dot ' + (cls || '') }),
          h('span', { class: 'list-main' },
            h('span', { class: 'list-text' }, r.text || t('rem.noText')),
            h('span', { class: 'list-sub' }, pageIcon(meta), pageTitle(meta))),
          chip));
      }
    }
  };
  draw();
  return { refresh: draw };
}

/* ───────────── Задачи ───────────── */

export async function renderTasks(scrollEl, app) {
  const { body, tools } = viewShell(scrollEl, 'todo', t('tasks.title'), t('tasks.sub'));
  let hideDone = store.settings.hideDone !== false;
  const toggle = h('button', { class: 'pill-btn' });
  tools.append(toggle);

  const draw = async () => {
    toggle.textContent = hideDone ? t('tasks.showDone') : t('tasks.hideDone');
    const groups = await store.allTodos();
    body.replaceChildren();
    let shown = 0, total = 0, done = 0;
    for (const g of groups) {
      total += g.items.length;
      done += g.items.filter((x) => x.checked).length;
      const items = hideDone ? g.items.filter((x) => !x.checked) : g.items;
      if (!items.length) continue;
      shown += items.length;
      body.append(h('button', { class: 'group-head link', onclick: () => app.navigate({ type: 'page', id: g.page.id }) },
        pageIcon(g.page), pageTitle(g.page), h('span', { class: 'group-count' }, String(items.length))));
      for (const item of items) {
        const late = item.remind && !item.checked && item.remind.at < Date.now();
        const rowEl = h('div', { class: 'list-row task' + (item.checked ? ' checked' : '') },
          h('div', { class: 'check', role: 'checkbox', 'aria-checked': String(item.checked), html: icon('check', 14) }),
          h('span', { class: 'list-main', onclick: () => app.navigate({ type: 'page', id: g.page.id }, { blockId: item.id }) },
            h('span', { class: 'list-text' }, item.text)),
          item.remind && remindChip(item.remind, item.checked ? 'done' : late ? 'late' : ''));
        rowEl.querySelector('.check').addEventListener('click', async () => {
          item.checked = !item.checked;
          rowEl.classList.toggle('checked', item.checked);
          await store.updateBlock(g.page.id, item.id, { checked: item.checked || undefined });
          if (hideDone && item.checked) setTimeout(draw, 350);
        });
        body.append(rowEl);
      }
    }
    if (!total) body.append(emptyState('todo', t('tasks.emptyTitle'), t('tasks.emptyText')));
    else if (!shown) body.append(emptyState('check', t('tasks.allDone'), tn('tasks.allDoneText', done)));
  };
  toggle.addEventListener('click', () => { hideDone = !hideDone; store.setSettings({ hideDone }); draw(); });
  await draw();
  return { refresh: draw };
}

/* ───────────── Корзина ───────────── */

export function openTrash(anchor, app) {
  const list = h('div', { class: 'trash-list' });
  const foot = h('div', { class: 'trash-foot' });
  let pop;
  const draw = () => {
    const ids = store.index.trash.filter((id) => store.meta(id));
    list.replaceChildren();
    foot.replaceChildren();
    if (!ids.length) { list.append(h('div', { class: 'empty-note' }, t('trash.empty'))); pop?.place(); return; }
    for (const id of ids) {
      const m = store.meta(id);
      list.append(h('div', { class: 'trash-row' },
        pageIcon(m), h('span', { class: 'row-title' }, pageTitle(m)),
        h('span', { class: 'trash-when' }, fmtAgo(m.trashed)),
        h('button', { class: 'icon-btn small', title: t('trash.restore'), html: icon('undo', 14), onclick: () => { store.restorePage(id); draw(); app.navigate({ type: 'page', id }); } }),
        h('button', { class: 'icon-btn small', title: t('trash.purge'), html: icon('trash', 14), onclick: async () => {
          if (await confirmBox(t('trash.confirm', { title: pageTitle(m) }))) { store.purgePage(id); toast(t('trash.purged')); }
        } })));
    }
    foot.append(h('button', { class: 'btn btn-ghost danger-text', html: icon('trash', 14) + `<span>${t('trash.emptyAll')}</span>`, onclick: async () => {
      if (await confirmBox(t('trash.confirmAll'))) { store.emptyTrash(); toast(t('trash.purged')); }
    } }));
    pop?.place();
  };
  draw();
  pop = popover(anchor, h('div', { class: 'trash' }, h('div', { class: 'menu-head' }, t('trash.title')), list, foot), { side: 'end' });
}

/* ───────────── Экспорт всех страниц ───────────── */

const safeName = (s) => (s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80).replace(/[. ]+$/, '') || t('untitled');

export async function exportAll() {
  await store.flush();
  const files = [];
  const assets = new Set();
  const used = new Set();
  const uniq = (dir, base) => {
    let n = base;
    for (let k = 2; used.has((dir + n).toLowerCase()); k++) n = `${base} (${k})`;
    used.add((dir + n).toLowerCase());
    return n;
  };
  async function visit(ids, dir, depth) {
    for (const id of ids) {
      const m = store.meta(id);
      if (!m) continue;
      const page = await store.loadPage(id);
      const base = uniq(dir, safeName(m.title));
      for (const b of page.blocks) { if (b.type === 'image') assets.add(b.src); if (b.bg) assets.add(b.bg); }
      if (page.cover?.kind === 'img') assets.add(page.cover.src);
      const md = `# ${m.icon ? m.icon + ' ' : ''}${pageTitle(m)}\n\n` + toMarkdown(page.blocks, { assetPrefix: '../'.repeat(depth) + 'assets/' });
      files.push({ path: dir + base + '.md', content: md });
      if (m.children?.length) await visit(m.children, dir + base + '/', depth + 1);
    }
  }
  await visit(store.index.root, '', 0);
  const ok = await store.api.exportAll({ files, assets: [...assets] });
  if (ok) toast(tn('set.exported', files.length), { icon: 'check' });
}

/* ───────────── Настройки ───────────── */

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'pink', 'red', 'gray'];
const SECTIONS = [
  ['appearance', 'palette', 'set.appearance'], ['language', 'globe', 'set.language'], ['editor', 'text', 'set.editor'],
  ['notifications', 'bell', 'set.notifications'], ['data', 'archive', 'set.data'], ['keys', 'keyboard', 'set.keys'], ['about', 'info', 'set.about'],
];
const KEYS = [
  ['Ctrl+N', 'keys.new'], ['Ctrl+P', 'keys.search'], ['Ctrl+F', 'keys.find'], ['Ctrl+S', 'keys.save'], ['Ctrl+\\', 'keys.sidebar'],
  ['Ctrl+Z / Ctrl+Y', 'keys.undo'], ['Ctrl+B / I / U', 'keys.format'], ['Ctrl+E', 'keys.code'], ['Ctrl+K', 'keys.link'], ['Ctrl+D', 'keys.dup'],
  ['Ctrl+Enter', 'keys.check'], ['Ctrl+Shift+↑ / ↓', 'keys.move'], ['Tab / Shift+Tab', 'keys.indent'], ['Ctrl + / − / 0', 'keys.zoom'],
  ['Ctrl+Shift+L', 'keys.theme'], ['Ctrl+,', 'keys.settings'], ['/', 'keys.slash'],
  ['Ctrl+Shift+K', 'keys.pageLink'], ['[[', 'keys.wiki'], ['Ctrl+G', 'keys.graph'],
];

export function openSettings(app, section = 'appearance') {
  const s = store.settings;
  const desktop = store.api.isDesktop;
  const nav = h('nav', { class: 'set-nav' });
  const body = h('div', { class: 'set-body' });

  const seg = (options, value, onPick) => {
    const box = h('div', { class: 'seg' });
    const draw = (v) => box.replaceChildren(...options.map(([val, label, ic]) => h('button', {
      class: 'seg-btn' + (String(val) === String(v) ? ' on' : ''), html: (ic ? icon(ic, 15) : '') + `<span>${escapeHtml(label)}</span>`,
      onclick: () => { draw(val); onPick(val); },
    })));
    draw(value);
    return box;
  };
  const sw = (key, onChange) => {
    const el = h('button', { class: 'switch' + (s[key] ? ' on' : ''), role: 'switch', 'aria-checked': String(!!s[key]) });
    el.addEventListener('click', () => {
      const v = !s[key];
      el.classList.toggle('on', v);
      el.setAttribute('aria-checked', String(v));
      store.setSettings({ [key]: v });
      onChange?.(v);
    });
    return el;
  };
  const line = (title, desc, control, wide) => h('div', { class: 'set-row' + (wide ? ' wide' : '') },
    h('div', { class: 'set-text' }, h('div', { class: 'set-title' }, title), desc && h('div', { class: 'set-desc' }, desc)), control);
  const btn = (ic, label, onclick) => h('button', { class: 'btn', html: icon(ic, 15) + `<span>${escapeHtml(label)}</span>`, onclick });

  const render = {
    appearance() {
      const zoomLabel = h('span', { class: 'zoom-value' }, Math.round(s.zoom * 100) + '%');
      const zoomBy = (d) => { app.setZoom(d === 0 ? 1 : s.zoom + d); zoomLabel.textContent = Math.round(s.zoom * 100) + '%'; };
      const accents = h('div', { class: 'accents' }, ACCENTS.map((a) => h('button', {
        class: 'accent-dot' + (s.accent === a ? ' on' : ''), 'data-accent': a, title: t('color.' + a),
        onclick: (e) => { accents.querySelector('.on')?.classList.remove('on'); e.currentTarget.classList.add('on'); app.setAccent(a); },
      })));
      return [
        line(t('set.theme'), t('set.themeDesc'), seg([['system', t('theme.system'), 'monitor'], ['light', t('theme.light'), 'sun'], ['dark', t('theme.dark'), 'moon']], s.theme, (v) => app.setTheme(v)), true),
        line(t('set.accent'), t('set.accentDesc'), accents),
        line(t('set.zoom'), t('set.zoomDesc'), h('div', { class: 'zoom' },
          h('button', { class: 'icon-btn', html: icon('minus', 16), title: t('zoom.out'), onclick: () => zoomBy(-0.1) }), zoomLabel,
          h('button', { class: 'icon-btn', html: icon('plus', 16), title: t('zoom.in'), onclick: () => zoomBy(0.1) }),
          h('button', { class: 'btn btn-ghost', onclick: () => zoomBy(0) }, t('reset')))),
      ];
    },
    language() {
      return [
        line(t('set.lang'), t('set.langDesc'), seg([['system', t('lang.system')], ...LANGS], s.lang, (v) => app.setLang(v)), true),
        line(t('set.weekStart'), null, seg([['auto', t('week.auto')], [1, t('week.mon')], [0, t('week.sun')]], s.weekStart, (v) => store.setSettings({ weekStart: v }))),
      ];
    },
    editor() {
      const fonts = h('div', { class: 'font-row wide-fonts' }, [['sans', 'font.sans'], ['serif', 'font.serif'], ['mono', 'font.mono']].map(([f, key]) => {
        const b = h('button', { class: 'font-btn' + (s.defaultFont === f ? ' on' : ''), 'data-font': f }, h('span', { class: 'font-aa' }, 'Аа'), h('span', null, t(key)));
        b.addEventListener('click', () => { fonts.querySelector('.on')?.classList.remove('on'); b.classList.add('on'); store.setSettings({ defaultFont: f }); });
        return b;
      }));
      return [
        line(t('set.font'), null, fonts),
        line(t('set.fullWidth'), t('set.fullWidthDesc'), sw('defaultFullWidth')),
      ];
    },
    notifications() {
      return [
        line(t('set.sound'), null, sw('sound')),
        desktop && line(t('set.tray'), t('set.trayDesc'), sw('closeToTray')),
        desktop && line(t('set.autostart'), t('set.autostartDesc'), sw('autostart')),
      ];
    },
    data() {
      return [
        line(t('set.folder'), store.info.dataDir || '', desktop && btn('folder', t('set.openFolder'), () => store.api.openDataDir())),
        line(t('set.exportAll'), t('set.exportAllDesc'), btn('download', t('set.export'), () => exportAll())),
        desktop && line(t('set.backup'), t('set.backupDesc'), btn('archive', t('set.backupCreate'), async () => {
          await store.flush();
          if (await store.api.backup()) toast(t('set.backupDone'), { icon: 'check' });
        })),
        desktop && line(t('set.autoBackup'), t('set.autoBackupDesc'), sw('autoBackup')),
        desktop && line(t('set.restore'), t('set.restoreDesc'), btn('upload', t('set.restoreBtn'), () => app.restoreBackup())),
      ];
    },
    keys() {
      return [h('div', { class: 'keys' }, KEYS.map(([k, key]) => h('div', { class: 'key-row' }, h('span', null, t(key)), h('kbd', null, k))))];
    },
    about() {
      return [h('div', { class: 'about' },
        h('img', { class: 'about-logo', src: 'img/icon.png', alt: '' }),
        h('div', { class: 'about-name' }, 'Liser'),
        h('div', { class: 'about-ver' }, t('set.version', { v: store.info.version || '—' })),
        h('div', { class: 'about-text' }, t('set.aboutText')))];
    },
  };

  function show(id) {
    section = id;
    nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.sec === id));
    const [, , key] = SECTIONS.find((x) => x[0] === id);
    body.replaceChildren(h('h2', { class: 'set-h' }, t(key)), ...render[id]());
    body.scrollTop = 0;
  }

  nav.append(h('div', { class: 'set-nav-title' }, t('set.title')),
    ...SECTIONS.map(([id, ic, key]) => h('button', { class: 'set-nav-item', 'data-sec': id, html: icon(ic, 16) + `<span>${t(key)}</span>`, onclick: () => show(id) })));

  const m = modal([nav, body], { class: 'settings' });
  show(section);
  return { close: () => m.close(), section: () => section };
}
