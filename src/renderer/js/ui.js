import { h, clamp, fmtRemind, fmtMonth, fmtWeekday, startOfDay, isRtlDoc } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

const layer = () => document.getElementById('layer');
const stack = [];

/* ───────────── Поповеры ───────────── */

document.addEventListener('mousedown', (e) => {
  if (!stack.length) return;
  const inside = e.target.closest?.('.pop');
  const i = inside ? stack.findIndex((p) => p.el === inside) : -1;
  stack.slice(i + 1).reverse().forEach((p) => p.close());
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stack.length) {
    e.preventDefault();
    e.stopPropagation();
    stack[stack.length - 1].close();
  }
}, true);

addEventListener('resize', () => stack.forEach((p) => p.place()));

export function closePopovers() {
  stack.slice().reverse().forEach((p) => p.close());
}

export const popoverOpen = () => stack.length > 0;

export const rectOf = (x) => (x instanceof Element ? x.getBoundingClientRect() : x);
export const pointRect = (x, y) => ({ left: x, right: x, top: y, bottom: y });

// align: 'start' | 'end' — логическое выравнивание (в RTL зеркалится); side: 'end' — сбоку от якоря
export function popover(anchor, content, opts = {}) {
  if (!opts.keep) closePopovers();
  const el = h('div', { class: 'pop ' + (opts.class || '') }, content);
  layer().append(el);
  const entry = { el };
  const place = () => {
    const r = rectOf(anchor);
    const rtl = isRtlDoc();
    const w = el.offsetWidth, hh = el.offsetHeight;
    let x, y;
    if (opts.side === 'end') {
      x = rtl ? r.left - w - 6 : r.right + 6;
      if (x < 8 || x + w > innerWidth - 8) x = rtl ? r.right + 6 : r.left - w - 6;
      y = r.top - 4;
      if (y + hh > innerHeight - 8) y = innerHeight - hh - 8;
    } else {
      const toEnd = (opts.align === 'end') !== rtl;
      x = toEnd ? r.right - w : r.left;
      y = r.bottom + 4;
      if (y + hh > innerHeight - 8) y = Math.max(8, r.top - hh - 4);
    }
    el.style.left = clamp(x, 8, Math.max(8, innerWidth - w - 8)) + 'px';
    el.style.top = Math.max(8, y) + 'px';
  };
  entry.place = place;
  entry.close = () => {
    const i = stack.indexOf(entry);
    if (i < 0) return;
    stack.splice(i, 1);
    el.remove();
    opts.onClose?.();
  };
  stack.push(entry);
  place();
  return entry;
}

/* ───────────── Меню ───────────── */

export function menu(anchor, items, opts = {}) {
  const box = h('div', { class: 'menu' });
  let pop;
  const render = (list, back) => {
    box.replaceChildren();
    if (back) {
      box.append(h('button', { class: 'menu-item menu-back', onclick: () => { render(items); pop.place(); } },
        h('span', { class: 'mi-ico flip', html: icon('back') }), h('span', { class: 'mi-label' }, back)));
      box.append(h('div', { class: 'menu-sep' }));
    }
    for (const it of list) {
      if (!it) continue;
      if (it.sep) { box.append(h('div', { class: 'menu-sep' })); continue; }
      if (it.header) { box.append(h('div', { class: 'menu-head' }, it.header)); continue; }
      if (it.custom) { box.append(it.custom); continue; }
      const btn = h('button', { class: 'menu-item' + (it.danger ? ' danger' : '') },
        h('span', { class: 'mi-ico', html: it.emoji || it.swatch ? '' : icon(it.icon || '') },
          it.emoji || '', it.swatch && h('span', { class: 'swatch ' + it.swatch })),
        h('span', { class: 'mi-label' }, it.label),
        it.toggle != null && h('span', { class: 'switch' + (it.toggle ? ' on' : '') }),
        it.checked && h('span', { class: 'mi-hint', html: icon('check', 14) }),
        it.hint && h('span', { class: 'mi-hint kbd-text' }, it.hint),
        it.sub && h('span', { class: 'mi-hint flip', html: icon('chev', 14) }));
      btn.addEventListener('click', () => {
        if (it.sub) { render(it.sub, it.label); pop.place(); return; }
        if (it.toggle != null) {
          it.toggle = !it.toggle;
          btn.querySelector('.switch').classList.toggle('on', it.toggle);
          it.onClick?.(it.toggle);
          return;
        }
        pop.close();
        it.onClick?.();
      });
      box.append(btn);
    }
  };
  render(items);
  pop = popover(anchor, box, opts);
  return pop;
}

/* ───────────── Тосты ───────────── */

export function toast(text, opts = {}) {
  let host = document.getElementById('toasts');
  if (!host) { host = h('div', { id: 'toasts' }); layer().append(host); }
  const el = h('div', { class: 'toast', role: 'status' },
    opts.icon && h('span', { class: 'toast-ico', html: icon(opts.icon, 16) }),
    h('span', { class: 'toast-text' }, text));
  let timer = 0;
  const close = () => { clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), 180); };
  const actions = opts.actions || (opts.action ? [{ label: opts.action, onClick: opts.onAction }] : []);
  for (const a of actions) el.append(h('button', { class: 'toast-btn', onclick: () => { close(); a.onClick?.(); } }, a.label));
  host.append(el);
  while (host.children.length > 4) host.firstChild.remove();
  const arm = () => { timer = setTimeout(close, opts.ms || 3200); };
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', arm);
  arm();
  return close;
}

/* ───────────── Модальные окна ───────────── */

export function modal(content, opts = {}) {
  closePopovers();
  const box = h('div', { class: 'pop modal ' + (opts.class || ''), role: 'dialog', 'aria-modal': 'true' }, content);
  const back = h('div', { class: 'modal-back' }, box);
  back.addEventListener('mousedown', (e) => { if (e.target === back) entry.close(); });
  const entry = { el: box };
  entry.close = () => {
    const i = stack.indexOf(entry);
    if (i < 0) return;
    stack.splice(i, 1);
    back.remove();
    opts.onClose?.();
  };
  entry.place = () => {};
  stack.push(entry);
  layer().append(back);
  return entry;
}

export function confirmBox(text, okLabel = t('delete'), danger = true) {
  return new Promise((resolve) => {
    let result = false;
    const ok = h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), onclick: () => { result = true; m.close(); } }, okLabel);
    const m = modal([
      h('div', { class: 'confirm-text' }, text),
      h('div', { class: 'confirm-row' }, h('button', { class: 'btn', onclick: () => m.close() }, t('cancel')), ok),
    ], { class: 'confirm', onClose: () => resolve(result) });
    ok.focus();
  });
}

/* ───────────── Выбор даты и времени ───────────── */

const pad = (n) => String(n).padStart(2, '0');
export const REPEATS = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

// initial: { at, repeat } | null; onPick({ at, repeat }) или onPick(null) — убрать
export function datePicker(anchor, initial, onPick, opts = {}) {
  const weekStart = opts.weekStart ?? 1;
  let sel = initial?.at ? new Date(initial.at) : (() => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d; })();
  let view = new Date(sel.getFullYear(), sel.getMonth(), 1);
  const grid = h('div', { class: 'cal-grid' });
  const title = h('div', { class: 'cal-title' });
  const time = h('input', { type: 'time', class: 'cal-time', value: `${pad(sel.getHours())}:${pad(sel.getMinutes())}` });
  const repeat = h('select', { class: 'select' }, REPEATS.map((r) => h('option', { value: r }, t('repeat.' + r))));
  repeat.value = initial?.repeat || 'none';
  const summary = h('div', { class: 'cal-summary' });

  const dows = [];
  for (let i = 0; i < 7; i++) dows.push(fmtWeekday(new Date(2024, 0, 7 + ((weekStart + i) % 7)))); // 7 янв 2024 — воскресенье

  const draw = () => {
    title.textContent = fmtMonth(view);
    grid.replaceChildren(...dows.map((d) => h('div', { class: 'cal-dow' }, d)));
    const first = new Date(view);
    first.setDate(1 - ((view.getDay() - weekStart + 7) % 7));
    const today = +startOfDay(Date.now()), chosen = +startOfDay(sel);
    for (let i = 0; i < 42; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
      const cls = 'cal-day' + (d.getMonth() !== view.getMonth() ? ' off' : '') + (+d === today ? ' today' : '') + (+d === chosen ? ' sel' : '');
      grid.append(h('button', { class: cls, onclick: () => { sel.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); draw(); } }, String(d.getDate())));
    }
    summary.textContent = fmtRemind(+sel);
    summary.classList.toggle('past', +sel < Date.now() && repeat.value === 'none');
  };
  const shift = (n) => { view = new Date(view.getFullYear(), view.getMonth() + n, 1); draw(); };
  const setTo = (d) => {
    sel = d;
    view = new Date(d.getFullYear(), d.getMonth(), 1);
    time.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    draw();
  };
  time.addEventListener('input', () => {
    const [hh, mm] = time.value.split(':').map(Number);
    if (Number.isFinite(hh)) { sel.setHours(hh, mm || 0, 0, 0); draw(); }
  });
  repeat.addEventListener('change', draw);

  const preset = (label, make) => h('button', { class: 'chip-btn', onclick: () => setTo(make()) }, label);
  const at = (days, hours) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hours, 0, 0, 0); return d; };
  let pop;
  const done = (value) => { pop.close(); onPick(value); };
  const result = () => ({ at: +sel, ...(repeat.value !== 'none' && { repeat: repeat.value }) });
  time.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(result()); });

  const body = h('div', { class: 'cal' },
    h('div', { class: 'cal-presets' },
      preset(t('cal.inHour'), () => { const d = new Date(Date.now() + 3600000); d.setSeconds(0, 0); return d; }),
      preset(t('cal.evening'), () => at(new Date().getHours() >= 19 ? 1 : 0, 19)),
      preset(t('cal.tomorrow'), () => at(1, 9)),
      preset(t('cal.nextWeek'), () => at(7, 9))),
    h('div', { class: 'cal-head' }, title,
      h('button', { class: 'icon-btn flip', title: t('cal.prev'), html: icon('chev'), style: { rotate: '180deg' }, onclick: () => shift(-1) }),
      h('button', { class: 'icon-btn flip', title: t('cal.next'), html: icon('chev'), onclick: () => shift(1) })),
    grid,
    h('div', { class: 'cal-row first' }, h('span', { class: 'cal-label' }, t('cal.time')), time),
    h('div', { class: 'cal-row' }, h('span', { class: 'cal-label' }, t('cal.repeat')), repeat),
    h('div', { class: 'cal-foot' }, summary,
      initial?.at && h('button', { class: 'btn btn-ghost', onclick: () => done(null) }, t('remove')),
      h('button', { class: 'btn btn-primary', onclick: () => done(result()) }, t('done'))));
  draw();
  pop = popover(anchor, body, { class: 'cal-pop', ...opts });
  return pop;
}

/* ───────────── Эмодзи ───────────── */

const EMOJI = '📄 📝 📒 📓 📔 📕 📗 📘 📙 📚 🗒️ 🗂️ 📁 📌 📎 ✏️ 🖊️ 🖍️ 🎨 💡 ⭐ 🔥 ✨ ⚡ ❤️ 💙 💚 💛 🧡 💜 ✅ ☑️ ❗ ❓ 🔔 ⏰ 📅 🗓️ 🎯 🚀 🏠 🏢 💼 💰 🛒 🎁 🎉 🎓 🧠 💪 🏃 🍎 🍕 ☕ 🍵 🌱 🌳 🌸 🌍 ☀️ 🌙 ⛅ 🌧️ ❄️ 🐱 🐶 🦊 🐼 🦉 🐝 🎵 🎬 🎮 📷 💻 📱 🔧 ⚙️ 🔑 🔒 🧩 🧪 ✈️ 🚗 🚲 🗺️ 🏖️ ⛰️ 👋 👍 🙏 😀 😎 🤔 😴 🥳 📊 📈 🧾 🏷️ 💬 📣 🕯️ ✡️ 🕎 🇮🇱 🇷🇺 🇬🇧'.split(' ');

export function emojiPicker(anchor, onPick, opts = {}) {
  let pop;
  const pick = (v) => { pop.close(); onPick(v); };
  const body = h('div', { class: 'emoji' },
    h('div', { class: 'emoji-head' }, h('span', null, t('emoji.title')),
      h('span', { class: 'emoji-acts' },
        h('button', { class: 'btn btn-ghost', html: icon('shuffle', 14) + `<span>${t('emoji.random')}</span>`, onclick: () => pick(EMOJI[Math.floor(Math.random() * EMOJI.length)]) }),
        opts.removable !== false && h('button', { class: 'btn btn-ghost', onclick: () => pick('') }, t('remove')))),
    h('div', { class: 'emoji-grid' }, EMOJI.map((e) => h('button', { class: 'emoji-btn', onclick: () => pick(e) }, e))));
  pop = popover(anchor, body, opts);
  return pop;
}
