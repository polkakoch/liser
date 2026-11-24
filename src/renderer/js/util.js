import { t, getLocale } from './i18n.js';

export const $ = (sel, root = document) => root.querySelector(sel);

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const p in v) (p.startsWith('--') ? el.style.setProperty(p, v[p]) : (el.style[p] = v[p]));
      } else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

export const uid = () => {
  const a = crypto.getRandomValues(new Uint32Array(2));
  return (a[0].toString(36) + a[1].toString(36)).padStart(12, '0').slice(0, 12);
};

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const isRtlDoc = () => document.documentElement.dir === 'rtl';

export function debounce(fn, ms) {
  let timer = 0;
  const run = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; fn(...args); }, ms);
  };
  run.flush = () => { if (timer) { clearTimeout(timer); timer = 0; fn(); } };
  run.cancel = () => { clearTimeout(timer); timer = 0; };
  run.pending = () => !!timer;
  return run;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ESC[c]);

const stripper = document.createElement('template');
export function plainText(html) {
  if (!html) return '';
  if (!/[<&]/.test(html)) return html;
  stripper.innerHTML = html.replace(/<br\s*\/?>/gi, '\n');
  return stripper.content.textContent || '';
}

/* ───────────── Даты (форматтеры пересоздаются при смене языка) ───────────── */

let fmtCache = { locale: null };
function fmts() {
  const locale = getLocale();
  if (fmtCache.locale !== locale) {
    fmtCache = {
      locale,
      time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
      day: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
      dayYear: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      rel: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
      month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      dow: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    };
  }
  return fmtCache;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const dayDiff = (ts) => Math.round((startOfDay(ts) - startOfDay(Date.now())) / 86400000);

export function fmtDay(ts) {
  const d = dayDiff(ts);
  const f = fmts();
  if (Math.abs(d) <= 1) return cap(f.rel.format(d, 'day'));
  const date = new Date(ts);
  return (date.getFullYear() === new Date().getFullYear() ? f.day : f.dayYear).format(date).replace(/\s?г\.$/, '');
}

export const fmtTime = (ts) => fmts().time.format(new Date(ts));
export const fmtRemind = (ts) => `${fmtDay(ts)}, ${fmtTime(ts)}`;
export const fmtMonth = (d) => cap(fmts().month.format(d).replace(/\s?г\.$/, ''));
export const fmtWeekday = (d) => fmts().dow.format(d).replace('.', '');

export function fmtAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return t('ago.now');
  if (s < 3600) return fmts().rel.format(-Math.floor(s / 60), 'minute');
  if (dayDiff(ts) === 0) return t('ago.today', { time: fmtTime(ts) });
  return fmtRemind(ts);
}

// Следующее срабатывание повторяющегося напоминания
export function nextOccurrence(at, repeat, now = Date.now()) {
  const d = new Date(at);
  const day = d.getDate();
  for (let guard = 0; +d <= now && guard < 5000; guard++) {
    if (repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (repeat === 'monthly') { d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
    else if (repeat === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else return null;
  }
  return +d;
}
