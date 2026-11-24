// Поиск по открытой странице (Ctrl+F) — подсветка через CSS Custom Highlight API, DOM не меняется.
import { h, debounce } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

const supported = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';
let bar = null;

export function openFind(scrollEl, initial = '') {
  if (bar) { bar.focus(initial); return bar; }
  const input = h('input', { class: 'find-input', type: 'text', placeholder: t('find.ph'), spellcheck: 'false' });
  const count = h('span', { class: 'find-count' });
  const el = h('div', { class: 'find-bar', role: 'search' },
    h('span', { class: 'find-ico', html: icon('search', 15) }), input, count,
    h('button', { class: 'icon-btn small', title: t('find.prev') + ' · Shift+Enter', html: icon('chev', 14), style: { rotate: '-90deg' }, onclick: () => go(-1) }),
    h('button', { class: 'icon-btn small', title: t('find.next') + ' · Enter', html: icon('chev', 14), style: { rotate: '90deg' }, onclick: () => go(1) }),
    h('button', { class: 'icon-btn small', title: t('find.close') + ' · Esc', html: icon('x', 14), onclick: () => close() }));
  document.getElementById('main').append(el);

  let ranges = [], cur = -1, stale = false;
  const mo = new MutationObserver(() => { stale = true; });
  mo.observe(scrollEl, { subtree: true, childList: true, characterData: true });

  function collect() {
    stale = false;
    ranges = [];
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const walker = document.createTreeWalker(scrollEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest('.folded, .handle, .draw-bar, .cover-ctl, [hidden]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n; (n = walker.nextNode());) {
      const text = n.nodeValue.toLowerCase();
      for (let i = text.indexOf(q); i >= 0; i = text.indexOf(q, i + q.length)) {
        const r = new Range();
        r.setStart(n, i);
        r.setEnd(n, i + q.length);
        ranges.push(r);
      }
    }
  }

  function paint() {
    if (supported) {
      CSS.highlights.set('find', new Highlight(...ranges));
      if (ranges[cur]) CSS.highlights.set('find-cur', new Highlight(ranges[cur])); else CSS.highlights.delete('find-cur');
    }
    count.textContent = !input.value.trim() ? '' : ranges.length ? t('find.count', { i: cur + 1, n: ranges.length }) : t('find.none');
    count.classList.toggle('none', !!input.value.trim() && !ranges.length);
    const r = ranges[cur];
    if (!r) return;
    r.startContainer.parentElement?.closest('.block, .page-title, .list-row')?.scrollIntoView({ block: 'center' });
    if (!supported) { const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  }

  function run() {
    collect();
    cur = ranges.length ? 0 : -1;
    paint();
  }

  function go(dir) {
    if (stale) { const keep = cur; collect(); cur = Math.min(keep, ranges.length - 1); }
    if (!ranges.length) return paint();
    cur = (cur + dir + ranges.length) % ranges.length;
    paint();
  }

  function close() {
    mo.disconnect();
    if (supported) { CSS.highlights.delete('find'); CSS.highlights.delete('find-cur'); }
    el.remove();
    bar = null;
  }

  input.addEventListener('input', debounce(run, 120));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); go(e.shiftKey ? -1 : 1); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  });

  bar = {
    close,
    focus(text) {
      if (text) { input.value = text; run(); }
      input.focus();
      input.select();
    },
  };
  bar.focus(initial);
  return bar;
}

export function closeFind() { bar?.close(); }
