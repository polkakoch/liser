// Ссылки между страницами: список выбора страницы и карточка-превью при наведении.
import { h, escapeHtml, clamp, plainText } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';
import * as store from './store.js';
import { popover } from './ui.js';

export const linkHtml = (id, text) => `<a data-page="${escapeHtml(id)}">${escapeHtml(text)}</a>`;

const pathLine = (m) => store.pathOf(m.id).slice(0, -1).map((p) => p.title || t('untitled')).join(' / ');

// Пункты: подходящие страницы и «создать» — если точного совпадения нет
export function pageChoices(query, exclude) {
  const q = query.trim();
  const items = store.findPages(q, 8, exclude).map((m) => ({ id: m.id, m }));
  if (q && !items.some((x) => (x.m.title || '').trim().toLowerCase() === q.toLowerCase())) items.push({ create: q });
  return items;
}

export function choiceRow(item, on) {
  if (item.create) {
    return h('button', { class: 'pl-row' + (on ? ' on' : '') },
      h('span', { class: 'pl-ico new', html: icon('plus', 16) }),
      h('span', { class: 'pl-main' },
        h('span', { class: 'pl-title' }, t('link.create', { title: item.create })),
        h('span', { class: 'pl-sub' }, t('link.createHint'))));
  }
  const m = item.m;
  const path = pathLine(m);
  return h('button', { class: 'pl-row' + (on ? ' on' : '') },
    h('span', { class: 'pl-ico', html: m.icon ? '' : icon('page', 16) }, m.icon || ''),
    h('span', { class: 'pl-main' },
      h('span', { class: 'pl-title' }, m.title || t('untitled')),
      path && h('span', { class: 'pl-sub' }, path)));
}

// Список с клавиатурой: стрелки, Enter; для поповера и для меню «[[»
export function choiceList(box, getItems, onPick) {
  let items = [], cur = 0;
  const draw = () => {
    box.replaceChildren(h('div', { class: 'menu-head' }, t('fmt.pageLink')));
    if (!items.length) { box.append(h('div', { class: 'empty-note small' }, t('link.none'))); return; }
    items.forEach((it, i) => {
      const row = choiceRow(it, i === cur);
      row.addEventListener('mousedown', (e) => e.preventDefault());
      row.addEventListener('click', () => onPick(it));
      row.addEventListener('mousemove', () => { if (cur !== i) { cur = i; box.querySelectorAll('.pl-row').forEach((el, j) => el.classList.toggle('on', j === i)); } });
      box.append(row);
    });
  };
  return {
    update(q) { items = getItems(q); cur = 0; draw(); return items.length; },
    key(e) {
      const n = items.length;
      if (!n) return false;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        cur = (cur + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        draw();
        box.querySelector('.pl-row.on')?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' || e.key === 'Tab') onPick(items[cur]);
      else return false;
      e.preventDefault();
      return true;
    },
  };
}

export function pagePicker(anchor, { query = '', exclude, onPick, onUnlink }) {
  const input = h('input', { class: 'input', type: 'text', placeholder: t('link.ph'), value: query, spellcheck: 'false' });
  const list = h('div', { class: 'pl-list' });
  let pop;
  const pick = (it) => { pop.close(); onPick(it); };
  const ctl = choiceList(list, (q) => pageChoices(q, exclude), pick);
  const body = h('div', { class: 'pl-box' }, input, list,
    onUnlink && h('button', { class: 'menu-item', onclick: () => { pop.close(); onUnlink(); } },
      h('span', { class: 'mi-ico', html: icon('x') }), h('span', { class: 'mi-label' }, t('link.remove'))));
  pop = popover(anchor, body);
  ctl.update(query);
  pop.place();
  input.addEventListener('input', () => { ctl.update(input.value); pop.place(); });
  input.addEventListener('keydown', (e) => ctl.key(e));
  input.focus();
  input.select();
  return pop;
}

/* ── Превью страницы при наведении на ссылку ── */

let card = null, timer = 0, cardFor = null;

export function hideCard() {
  clearTimeout(timer);
  card?.remove();
  card = null;
  cardFor = null;
}

export function hoverCard(a) {
  if (cardFor === a) return;
  hideCard();
  cardFor = a;
  timer = setTimeout(async () => {
    const id = a.dataset.page;
    const m = store.meta(id);
    if (!m || store.isTrashed(id) || !a.isConnected) return;
    const page = await store.loadPage(id);
    if (cardFor !== a) return;
    const lines = [];
    for (const b of page.blocks) {
      const text = plainText(b.html).trim();
      if (text) lines.push(h('div', { class: 'pc-line', 'data-type': b.type }, text.length > 140 ? text.slice(0, 140) + '…' : text));
      if (lines.length >= 4) break;
    }
    const path = pathLine(m);
    card = h('div', { class: 'pop page-card' },
      h('div', { class: 'pc-head' },
        h('span', { class: 'pc-ico', html: m.icon ? '' : icon('page', 18) }, m.icon || ''),
        h('span', { class: 'pc-title' }, m.title || t('untitled'))),
      path && h('div', { class: 'pc-path' }, path),
      h('div', { class: 'pc-body' }, lines.length ? lines : h('div', { class: 'pc-empty' }, t('link.emptyPage'))));
    document.getElementById('layer').append(card);
    const r = a.getBoundingClientRect();
    const w = card.offsetWidth, hh = card.offsetHeight;
    card.style.left = clamp(r.left, 8, innerWidth - w - 8) + 'px';
    card.style.top = (r.bottom + hh + 10 > innerHeight ? r.top - hh - 6 : r.bottom + 6) + 'px';
  }, 450);
}
