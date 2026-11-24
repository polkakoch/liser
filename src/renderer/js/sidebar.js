import { h, clamp, isRtlDoc } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';
import * as store from './store.js';
import { menu, toast, pointRect } from './ui.js';

export function mountSidebar(root, app) {
  const favBox = h('div', { class: 'side-section' });
  const tree = h('div', { class: 'tree', role: 'tree' });
  const badge = h('span', { class: 'badge', hidden: true });
  const navRow = (id, ic, label, hint, onclick, extra) => h('button', { class: 'side-item', 'data-nav': id, onclick },
    h('span', { class: 'side-ico', html: icon(ic, 18) }), h('span', { class: 'side-label' }, label), extra,
    hint && h('span', { class: 'side-hint kbd-text' }, hint));

  root.replaceChildren(
    h('div', { class: 'side-top' },
      h('div', { class: 'ws' }, h('span', { class: 'ws-logo' }, 'L'), h('span', { class: 'ws-name' }, 'Liser')),
      h('button', { class: 'icon-btn', title: t('side.hide') + ' · Ctrl+\\', html: icon('sidebar', 18), onclick: () => app.toggleSidebar() }),
      h('button', { class: 'icon-btn', title: t('side.new') + ' · Ctrl+N', html: icon('plus', 18), onclick: () => app.newPage() })),
    h('nav', { class: 'side-nav' },
      navRow('search', 'search', t('side.search'), 'Ctrl+P', () => app.openSearch()),
      navRow('reminders', 'bell', t('side.reminders'), '', () => app.navigate({ type: 'reminders' }), badge),
      navRow('tasks', 'todo', t('side.tasks'), '', () => app.navigate({ type: 'tasks' })),
      navRow('graph', 'graph', t('side.graph'), 'Ctrl+G', () => app.navigate({ type: 'graph' }))),
    h('div', { class: 'side-scroll' },
      favBox,
      h('div', { class: 'side-section' },
        h('div', { class: 'side-head' }, h('span', null, t('side.pages')),
          h('button', { class: 'icon-btn small', title: t('side.new'), html: icon('plus', 14), onclick: () => app.newPage() })),
        tree)),
    h('div', { class: 'side-bottom' },
      navRow('trash', 'trash', t('side.trash'), '', (e) => app.openTrash(e.currentTarget)),
      navRow('settings', 'sliders', t('side.settings'), 'Ctrl+,', () => app.openSettings())),
    h('div', { class: 'side-resizer' }));

  /* ── Дерево ── */

  function row(m, depth, fav) {
    const kids = m.children?.length > 0;
    return h('div', {
      class: 'row' + (app.route.type === 'page' && app.route.id === m.id ? ' active' : ''),
      'data-id': m.id, role: 'treeitem', style: { paddingInlineStart: 6 + depth * 14 + 'px' }, ...(fav && { 'data-fav': '1' }),
    },
      h('button', { class: 'row-tw' + (m.open ? ' open' : '') + (kids || fav ? '' : ' leaf'), html: icon('chev', 14), 'data-act': 'toggle' }),
      h('span', { class: 'row-ico', html: m.icon ? '' : icon('page', 16) }, m.icon || ''),
      h('span', { class: 'row-title' }, m.title || t('untitled')),
      h('span', { class: 'row-acts' },
        h('button', { class: 'icon-btn small', title: t('side.more'), html: icon('dots', 14), 'data-act': 'menu' }),
        h('button', { class: 'icon-btn small', title: t('side.addChild'), html: icon('plus', 14), 'data-act': 'add' })));
  }

  function build(ids, depth, out) {
    for (const id of ids) {
      const m = store.meta(id);
      if (!m) continue;
      out.append(row(m, depth));
      if (m.open) {
        if (m.children?.length) build(m.children, depth + 1, out);
        else out.append(h('div', { class: 'row-empty', style: { paddingInlineStart: 30 + depth * 14 + 'px' } }, t('side.noChildren')));
      }
    }
  }

  let frame = 0;
  function render() {
    frame = 0;
    const frag = document.createDocumentFragment();
    build(store.index.root, 0, frag);
    if (!frag.childNodes.length) frag.append(h('div', { class: 'row-empty' }, t('side.noPages')));
    tree.replaceChildren(frag);

    const favs = [];
    store.walk((m) => { if (m.fav) favs.push(m); });
    favBox.hidden = !favs.length;
    favBox.replaceChildren(h('div', { class: 'side-head' }, h('span', null, t('side.favorites'))), ...favs.map((m) => row(m, 0, true)));

    root.querySelectorAll('[data-nav]').forEach((el) => el.classList.toggle('active', el.dataset.nav === app.route.type));
    const now = Date.now();
    const due = store.activeReminders().filter((r) => !r.done && r.at <= now).length;
    badge.hidden = !due;
    badge.textContent = due > 99 ? '99+' : due;
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };

  const offs = [
    store.on('tree', schedule),
    store.on('reminders', schedule),
    store.on('title', (id) => {
      const title = store.titleOf(id);
      root.querySelectorAll(`.row[data-id="${id}"] .row-title`).forEach((el) => { el.textContent = title; });
    }),
  ];

  function pageMenu(id, anchor) {
    const m = store.meta(id);
    menu(anchor, [
      { icon: 'star', label: m.fav ? t('pm.unfav') : t('pm.fav'), onClick: () => store.setMeta(id, { fav: !m.fav }) },
      { icon: 'text', label: t('pm.rename'), onClick: () => app.renamePage(id) },
      { icon: 'plus', label: t('pm.child'), onClick: () => app.newPage(id) },
      { icon: 'copy', label: t('pm.duplicate'), onClick: async () => { const nid = await store.duplicatePage(id); if (nid) app.navigate({ type: 'page', id: nid }); } },
      { sep: true },
      { icon: 'trash', label: t('pm.trash'), danger: true, onClick: () => app.trashPage(id) },
    ]);
  }

  let suppressClick = false;
  root.addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (!r) return;
    if (suppressClick) { suppressClick = false; return; }
    const id = r.dataset.id;
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'toggle') {
      if (r.dataset.fav) return app.navigate({ type: 'page', id });
      store.setMeta(id, { open: !store.meta(id).open });
    } else if (act === 'add') app.newPage(id);
    else if (act === 'menu') pageMenu(id, e.target.closest('[data-act]'));
    else app.navigate({ type: 'page', id });
  });
  root.addEventListener('contextmenu', (e) => {
    const r = e.target.closest('.row');
    if (r) { e.preventDefault(); pageMenu(r.dataset.id, pointRect(e.clientX, e.clientY)); }
  });

  /* ── Перетаскивание страниц ── */

  tree.addEventListener('pointerdown', (e) => {
    const r = e.target.closest('.row');
    if (!r || e.button !== 0 || e.target.closest('[data-act]')) return;
    const id = r.dataset.id;
    const sx = e.clientX, sy = e.clientY;
    let started = false, target = null, pos = null, mark = null;
    const clear = () => { mark?.classList.remove('drop-before', 'drop-after', 'drop-in'); mark = null; };
    const move = (ev) => {
      if (!started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        started = true;
        r.classList.add('dragging');
        document.body.classList.add('grabbing');
      }
      clear();
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.tree .row');
      target = null;
      if (!over || over === r) return;
      const rect = over.getBoundingClientRect();
      const f = (ev.clientY - rect.top) / rect.height;
      pos = f < 0.28 ? 'before' : f > 0.72 ? 'after' : 'in';
      target = over.dataset.id;
      mark = over;
      over.classList.add('drop-' + pos);
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      if (!started) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      clear();
      r.classList.remove('dragging');
      document.body.classList.remove('grabbing');
      if (target && !store.movePage(id, target, pos)) toast(t('side.cantMove'));
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  });

  /* ── Ширина панели ── */

  const resizer = root.querySelector('.side-resizer');
  resizer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    resizer.setPointerCapture(e.pointerId);
    document.body.classList.add('resizing');
    const move = (ev) => {
      const x = isRtlDoc() ? innerWidth - ev.clientX : ev.clientX;
      const w = clamp(Math.round(x), 220, 440);
      document.documentElement.style.setProperty('--side-w', w + 'px');
      store.settings.sidebarWidth = w;
    };
    const up = () => {
      resizer.removeEventListener('pointermove', move);
      resizer.removeEventListener('pointerup', up);
      document.body.classList.remove('resizing');
      store.setSettings({ sidebarWidth: store.settings.sidebarWidth });
    };
    resizer.addEventListener('pointermove', move);
    resizer.addEventListener('pointerup', up);
  });
  resizer.addEventListener('dblclick', () => {
    document.documentElement.style.setProperty('--side-w', '260px');
    store.setSettings({ sidebarWidth: 260 });
  });

  render();
  return { render: schedule, destroy: () => offs.forEach((off) => off()) };
}
