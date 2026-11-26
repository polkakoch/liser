// Блок-таблица: ячейки с простым текстом. Удобна для словаря:
// Tab — следующая ячейка, Enter — следующая строка (в последней строке — новая), Ctrl+Enter — выйти из таблицы.
import { h, clamp } from './util.js';
import { icon } from './icons.js';
import { t, tn } from './i18n.js';
import { menu, pointRect } from './ui.js';

export const MAX_COLS = 12;

// Прямоугольная сетка строк из чего угодно: лишнее отбрасываем, недостающее заполняем пустыми ячейками
export function normRows(rows) {
  const list = Array.isArray(rows) ? rows.filter(Array.isArray) : [];
  const cols = clamp(Math.max(1, ...list.map((r) => r.length)), 1, MAX_COLS);
  const out = list.map((r) => Array.from({ length: cols }, (_, i) => (r[i] == null ? '' : String(r[i]))));
  return out.length ? out : [Array(cols).fill('')];
}

// Текст таблицы для поиска, счётчика слов и превью
export const tableText = (b) => (b.rows || []).map((r) => r.filter((x) => x && x.trim()).join(' — ')).filter(Boolean).join('\n');

export function newTable(kind) {
  if (kind === 'vocab') return { type: 'table', rows: [[t('table.word'), t('table.translation')], ['', ''], ['', ''], ['', '']] };
  return { type: 'table', rows: [['', '', ''], ['', '', ''], ['', '', '']] };
}

// Вставленный текст из Excel / Google Таблиц: строки — переводы строки, ячейки — табуляция
export function parseGrid(text) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  while (lines.length && !lines[0].trim()) lines.shift();
  return lines.map((l) => l.split('\t').map((c) => c.trim()));
}

// Таблица Markdown: | a | b | … с необязательной строкой-разделителем | --- | --- |
const MD_SEP = /^:?-{2,}:?$/;
export function parseMdTable(lines) {
  const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  const rows = lines.map(cells);
  const head = rows.length > 1 && rows[1].every((c) => MD_SEP.test(c));
  if (head) rows.splice(1, 1);
  return { rows: normRows(rows), head };
}

export function tableMarkdown(b) {
  const rows = normRows(b.rows);
  const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const line = (r) => '| ' + r.map(esc).join(' | ') + ' |';
  const body = b.head === false ? rows : rows.slice(1);
  const top = b.head === false ? rows[0].map(() => '') : rows[0];
  return [line(top), '| ' + top.map(() => '---').join(' | ') + ' |', ...body.map(line)].join('\n');
}

function caretOffset(el) {
  const s = getSelection();
  if (!s.rangeCount || !el.contains(s.focusNode)) return 0;
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setEnd(s.focusNode, s.focusOffset);
  return r.toString().length;
}

/**
 * opts.before() — перед изменением структуры (для истории отмены);
 * opts.onChange(typing) — данные изменились; opts.onExit(dir) — уйти из таблицы: -1 вверх, 1 вниз, 0 выделить блок;
 * opts.syncDir(el) — направление текста ячейки по первой букве (ячейки на разных языках).
 */
export function createTable(block, opts) {
  block.rows = normRows(block.rows);
  const body = h('tbody');
  const table = h('table', { class: 'tbl-table' }, body);
  const addColBtn = h('button', { class: 'tbl-add-col', title: t('table.addCol'), html: icon('plus', 14) });
  const addRowBtn = h('button', { class: 'tbl-add-row', title: t('table.addRowHint'), html: icon('plus', 14) + `<span>${t('table.addRow')}</span>` });
  const count = h('span', { class: 'tbl-count' });
  const optBtn = h('button', { class: 'icon-btn small tbl-opt', title: t('table.options'), html: icon('dots', 14) });
  const root = h('div', { class: 'tbl' },
    h('div', { class: 'tbl-wrap' }, h('div', { class: 'tbl-scroll' }, table), addColBtn),
    h('div', { class: 'tbl-foot' }, addRowBtn, count, optBtn));

  let last = { r: 0, c: 0 };
  let tabStart = null; // столбец, с которого начали идти по строке через Tab
  const head = () => block.head !== false;
  const nRows = () => block.rows.length;
  const nCols = () => block.rows[0].length;
  const cellAt = (r, c) => body.rows[r]?.cells[c]?.firstElementChild || null;
  const posOf = (cell) => ({ r: +cell.dataset.r, c: +cell.dataset.c });

  function updateCount() {
    const filled = block.rows.slice(head() ? 1 : 0).filter((r) => r.some((x) => x.trim())).length;
    count.textContent = filled ? tn('table.rows', filled) : '';
  }

  const widths = () => (Array.isArray(block.widths) && block.widths.length === nCols() ? block.widths : null);

  function applyWidths(list) {
    const cols = table.querySelectorAll('col');
    if (list) {
      list.forEach((w, i) => { if (cols[i]) cols[i].style.width = w + 'px'; });
      table.style.width = list.reduce((a, b) => a + b, 0) + 'px';
    } else {
      cols.forEach((c) => { c.style.width = ''; });
      table.style.width = `max(100%, ${nCols() * 120}px)`;
    }
  }

  function render(focus) {
    const cols = nCols();
    body.replaceChildren(...block.rows.map((row, r) => {
      const th = r === 0 && head();
      return h('tr', { class: th ? 'head' : null }, row.map((text, c) => {
        const cell = h('div', {
          class: 'cell', contenteditable: 'plaintext-only', spellcheck: 'false', 'data-r': r, 'data-c': c,
          'data-ph': th ? t('table.col', { n: c + 1 }) : null,
        });
        cell.textContent = text;
        opts.syncDir(cell);
        // За правый край ячеек первой строки тянется ширина столбца
        return h(th ? 'th' : 'td', null, cell, r === 0 && h('div', { class: 'col-rs', 'data-c': c, title: t('table.resize') }));
      }));
    }));
    table.querySelector('colgroup')?.remove();
    table.prepend(h('colgroup', null, Array.from({ length: cols }, () => h('col'))));
    applyWidths(widths());
    addColBtn.hidden = cols >= MAX_COLS;
    updateCount();
    if (focus) focusCell(focus.r, focus.c, focus.at);
  }

  function focusCell(r, c, at = 'end') {
    const cell = cellAt(clamp(r, 0, nRows() - 1), clamp(c, 0, nCols() - 1));
    if (!cell) return;
    cell.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(cell);
    if (at !== 'all') range.collapse(at === 0);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(range);
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // Каждое изменение создаёт новые массивы строк: снимки истории отмены остаются нетронутыми
  function edit(fn, focus) {
    opts.before?.();
    block.rows = block.rows.map((r) => r.slice());
    fn(block.rows);
    block.rows = normRows(block.rows);
    render(focus);
    opts.onChange(false);
  }

  const addRow = (at, c = 0) => edit((rows) => rows.splice(at, 0, Array(nCols()).fill('')), { r: at, c, at: 0 });
  const removeRow = (r) => { if (nRows() > 1) edit((rows) => rows.splice(r, 1), { r: Math.max(0, r - 1), c: 0 }); };
  // Ширины столбцов (если их меняли) сдвигаются вместе со столбцами
  const spliceWidths = (at, del, ...add) => { if (widths()) { block.widths = block.widths.slice(); block.widths.splice(at, del, ...add); } };
  const addCol = (at) => {
    if (nCols() >= MAX_COLS) return;
    edit((rows) => { spliceWidths(at, 0, 140); rows.forEach((row) => row.splice(at, 0, '')); }, { r: head() ? 0 : last.r, c: at, at: 0 });
  };
  const removeCol = (c) => {
    if (nCols() <= 1) return;
    edit((rows) => { spliceWidths(c, 1); rows.forEach((row) => row.splice(c, 1)); }, { r: last.r, c: Math.max(0, c - 1) });
  };

  // Перетаскивание края столбца
  table.addEventListener('pointerdown', (e) => {
    const rs = e.target.closest('.col-rs');
    if (!rs || e.button !== 0) return;
    e.preventDefault();
    const c = +rs.dataset.c;
    const start = [...body.rows[0].cells].map((cell) => cell.getBoundingClientRect().width);
    const list = start.slice();
    const x0 = e.clientX;
    const rtl = getComputedStyle(table).direction === 'rtl';
    rs.setPointerCapture(e.pointerId);
    root.classList.add('resizing');
    const move = (ev) => {
      list[c] = Math.max(60, Math.round(start[c] + (rtl ? x0 - ev.clientX : ev.clientX - x0)));
      applyWidths(list);
    };
    const up = () => {
      rs.removeEventListener('pointermove', move);
      rs.removeEventListener('pointerup', up);
      rs.removeEventListener('pointercancel', up);
      root.classList.remove('resizing');
      if (list[c] === Math.round(start[c])) return;
      opts.before?.();
      block.widths = list.map((w) => Math.round(w));
      opts.onChange(false);
    };
    rs.addEventListener('pointermove', move);
    rs.addEventListener('pointerup', up);
    rs.addEventListener('pointercancel', up);
  });
  table.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.col-rs') || !block.widths) return;
    opts.before?.();
    delete block.widths;
    applyWidths(null);
    opts.onChange(false);
  });
  const setHead = (on) => {
    opts.before?.();
    if (on) delete block.head; else block.head = false;
    render();
    opts.onChange(false);
  };
  function sortBy(c, dir) {
    const coll = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    edit((rows) => {
      const start = head() ? 1 : 0;
      const part = rows.splice(start).sort((a, b) => (!a[c].trim()) - (!b[c].trim()) || dir * coll.compare(a[c], b[c]));
      rows.push(...part);
    });
  }

  function openMenu(anchor, { r, c }) {
    const th = r === 0 && head();
    menu(anchor, [
      !th && { icon: 'arrowUp', label: t('table.rowAbove'), onClick: () => addRow(r, c) },
      { icon: 'arrowDown', label: t('table.rowBelow'), onClick: () => addRow(r + 1, c) },
      nCols() < MAX_COLS && { icon: 'plus', label: t('table.colBefore'), onClick: () => addCol(c) },
      nCols() < MAX_COLS && { icon: 'plus', label: t('table.colAfter'), onClick: () => addCol(c + 1) },
      { sep: true },
      { icon: 'arrowDown', label: t('table.sortAsc'), onClick: () => sortBy(c, 1) },
      { icon: 'arrowUp', label: t('table.sortDesc'), onClick: () => sortBy(c, -1) },
      { icon: 'table', label: t('table.header'), toggle: head(), onClick: (v) => setHead(v) },
      { sep: true },
      nRows() > 1 && !th && { icon: 'trash', label: t('table.delRow'), danger: true, onClick: () => removeRow(r) },
      nCols() > 1 && { icon: 'trash', label: t('table.delCol'), danger: true, onClick: () => removeCol(c) },
    ]);
  }

  /* ── Ввод ── */

  root.addEventListener('input', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    if (!cell.textContent && cell.firstChild) cell.replaceChildren();
    opts.syncDir(cell);
    const { r, c } = posOf(cell);
    const rows = block.rows.slice();
    rows[r] = rows[r].slice();
    rows[r][c] = cell.textContent;
    block.rows = rows;
    updateCount();
    opts.onChange(true);
  });

  root.addEventListener('mousedown', () => { tabStart = null; });
  root.addEventListener('focusin', (e) => {
    const cell = e.target.closest('.cell');
    if (cell) last = posOf(cell);
  });

  root.addEventListener('keydown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || e.isComposing) return;
    const { r, c } = posOf(cell);
    const rows = nRows(), cols = nCols();
    const mod = e.ctrlKey || e.metaKey;
    const sel = getSelection();

    if (/^(Arrow|Home|End|Page)/.test(e.key)) tabStart = null;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (tabStart == null) tabStart = c;
      if (e.shiftKey) {
        if (c > 0) focusCell(r, c - 1, 'all');
        else if (r > 0) focusCell(r - 1, cols - 1, 'all');
        else opts.onExit(-1);
      } else if (c < cols - 1) focusCell(r, c + 1, 'all');
      else if (r < rows - 1) focusCell(r + 1, 0, 'all');
      else addRow(rows, 0);
      return;
    }
    if (e.key === 'Enter') {
      if (mod) { e.preventDefault(); opts.onExit(1); return; }
      if (e.shiftKey) return; // перенос строки внутри ячейки
      e.preventDefault();
      // Как в Excel: после Tab по строке Enter возвращает в столбец, с которого начали (слово → перевод → следующее слово)
      const col = tabStart ?? c;
      tabStart = null;
      if (r < rows - 1) focusCell(r + 1, col, 'end');
      else addRow(rows, col);
      return;
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !mod && !e.shiftKey && !e.altKey) {
      const up = e.key === 'ArrowUp';
      const text = cell.textContent, off = caretOffset(cell);
      // В многострочной ячейке стрелки сначала ходят по её строкам
      if (up ? text.lastIndexOf('\n', off - 1) >= 0 : text.indexOf('\n', off) >= 0) return;
      e.preventDefault();
      const nr = r + (up ? -1 : 1);
      if (nr < 0 || nr >= rows) opts.onExit(up ? -1 : 1);
      else focusCell(nr, c);
      return;
    }
    if (e.key === 'Backspace' && !mod && sel.isCollapsed && c === 0 && caretOffset(cell) === 0
      && rows > 1 && !(r === 0 && head()) && block.rows[r].every((x) => !x)) {
      // Пустая строка удаляется Backspace из первой ячейки
      e.preventDefault();
      edit((list) => list.splice(r, 1), { r: Math.max(0, r - 1), c: cols - 1 });
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); opts.onExit(0); }
  });

  root.addEventListener('paste', (e) => {
    const cell = e.target.closest('.cell');
    const text = e.clipboardData?.getData('text/plain');
    if (!cell || text == null) return;
    e.preventDefault();
    e.stopPropagation();
    const grid = parseGrid(text);
    if (!grid.length) return;
    if (grid.length === 1 && grid[0].length === 1) { document.execCommand('insertText', false, grid[0][0]); return; }
    // Несколько строк или ячеек: раскладываем по таблице начиная с текущей ячейки, добавляя строки и столбцы
    const { r, c } = posOf(cell);
    const width = Math.max(...grid.map((g) => g.length));
    edit((rows) => {
      const cols = Math.min(MAX_COLS, Math.max(rows[0].length, c + width));
      for (const row of rows) while (row.length < cols) row.push('');
      grid.forEach((g, i) => {
        if (!rows[r + i]) rows.push(Array(cols).fill(''));
        g.forEach((v, j) => { if (c + j < cols) rows[r + i][c + j] = v; });
      });
    }, { r: r + grid.length - 1, c: Math.min(c + width - 1, MAX_COLS - 1) });
  });

  root.addEventListener('contextmenu', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    // С выделенным текстом оставляем обычное меню «Вырезать / Копировать / Вставить»
    const s = getSelection();
    if (!s.isCollapsed && cell.contains(s.anchorNode)) return;
    e.preventDefault();
    openMenu(pointRect(e.clientX, e.clientY), posOf(cell));
  });

  const noFocus = (btn) => btn.addEventListener('mousedown', (e) => e.preventDefault());
  [addRowBtn, addColBtn, optBtn].forEach(noFocus);
  addRowBtn.addEventListener('click', () => addRow(nRows(), 0));
  addColBtn.addEventListener('click', () => addCol(nCols()));
  optBtn.addEventListener('click', () => openMenu(optBtn, last));

  render();
  root.focusEdge = (end) => focusCell(end ? nRows() - 1 : 0, 0, end ? 'end' : 0);
  root.focusFirstEmpty = () => {
    const start = head() ? 1 : 0;
    const r = block.rows.findIndex((row, i) => i >= start && row.every((x) => !x));
    focusCell(r >= 0 ? r : nRows() - 1, 0, 0);
  };
  return root;
}
