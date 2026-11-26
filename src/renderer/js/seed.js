// Стартовая страница на языке интерфейса
import { uid } from './util.js';

const TEXT = {
  ru: {
    title: 'Добро пожаловать в Liser',
    intro: 'Это ваше личное пространство для заметок. Всё хранится на этом компьютере и работает без интернета.',
    start: 'С чего начать',
    t1: 'Нажмите <code>/</code> в пустой строке — откроется меню блоков',
    t2: 'Создайте новую страницу: <code>Ctrl+N</code>',
    t3: 'Вставьте картинку из буфера обмена: <code>Ctrl+V</code>',
    t4: 'Поставьте напоминание — нажмите на ⋮⋮ слева от блока',
    can: 'Что умеют блоки',
    b1: '<b>Жирный</b>, <i>курсив</i>, <u>подчёркнутый</u>, <code>код</code> — выделите текст, появится панель',
    b2: 'Markdown-сокращения: <code>#</code> заголовок, <code>-</code> список, <code>[]</code> задача, <code>&gt;</code> цитата',
    b3: 'Блоки можно перетаскивать за ⋮⋮, выделять рамкой и красить через меню',
    toggle: 'Раскрывающийся список — нажмите на треугольник',
    inner: 'Внутри можно прятать что угодно: текст, задачи, картинки.',
    callout: 'Изменения сохраняются автоматически. <code>Ctrl+S</code> — сохранить сразу, <code>Ctrl+P</code> — поиск по всем заметкам, <code>Ctrl+F</code> — поиск по странице.',
    draw: 'Рисование',
    drawText: 'Ниже — холст. Рисуйте мышью, пером или пальцем. Картинку тоже можно превратить в холст и рисовать поверх.',
    table: 'Таблицы и словарь',
    tableText: 'Наберите <code>/словарь</code> или <code>/таблица</code>. <code>Tab</code> — следующая ячейка, <code>Enter</code> — новая строка, <code>Ctrl+Enter</code> — выйти из таблицы. Списки из Excel вставляются сразу таблицей.',
    rows: [['Слово', 'Перевод'], ['hello', 'привет'], ['שלום', 'мир'], ['gracias', 'спасибо']],
  },
  en: {
    title: 'Welcome to Liser',
    intro: 'This is your personal space for notes. Everything is stored on this computer and works offline.',
    start: 'Getting started',
    t1: 'Press <code>/</code> on an empty line to open the block menu',
    t2: 'Create a new page: <code>Ctrl+N</code>',
    t3: 'Paste an image from the clipboard: <code>Ctrl+V</code>',
    t4: 'Set a reminder — click ⋮⋮ to the left of a block',
    can: 'What blocks can do',
    b1: '<b>Bold</b>, <i>italic</i>, <u>underline</u>, <code>code</code> — select text and a toolbar appears',
    b2: 'Markdown shortcuts: <code>#</code> heading, <code>-</code> list, <code>[]</code> to-do, <code>&gt;</code> quote',
    b3: 'Drag blocks by ⋮⋮, select them with a box and color them from the menu',
    toggle: 'Toggle list — click the triangle',
    inner: 'You can tuck anything inside: text, tasks, images.',
    callout: 'Changes are saved automatically. <code>Ctrl+S</code> saves right away, <code>Ctrl+P</code> searches all notes, <code>Ctrl+F</code> searches this page.',
    draw: 'Drawing',
    drawText: 'Below is a canvas. Draw with a mouse, pen or finger. You can also turn an image into a canvas and draw on top of it.',
    table: 'Tables and vocabulary',
    tableText: 'Type <code>/vocabulary</code> or <code>/table</code>. <code>Tab</code> moves to the next cell, <code>Enter</code> starts a new row, <code>Ctrl+Enter</code> leaves the table. Lists copied from Excel paste straight in as a table.',
    rows: [['Word', 'Translation'], ['hola', 'hello'], ['שלום', 'peace'], ['merci', 'thank you']],
  },
  he: {
    title: 'ברוכים הבאים ל-Liser',
    intro: 'זה המרחב האישי שלכם לפתקים. הכול נשמר במחשב הזה ועובד גם בלי אינטרנט.',
    start: 'איך מתחילים',
    t1: 'הקישו <code>/</code> בשורה ריקה — ייפתח תפריט הבלוקים',
    t2: 'יצירת דף חדש: <code>Ctrl+N</code>',
    t3: 'הדבקת תמונה מהלוח: <code>Ctrl+V</code>',
    t4: 'הגדירו תזכורת — לחצו על ⋮⋮ ליד הבלוק',
    can: 'מה בלוקים יודעים לעשות',
    b1: '<b>מודגש</b>, <i>נטוי</i>, <u>קו תחתון</u>, <code>קוד</code> — סמנו טקסט ויופיע סרגל עיצוב',
    b2: 'קיצורי Markdown: <code>#</code> כותרת, <code>-</code> רשימה, <code>[]</code> משימה, <code>&gt;</code> ציטוט',
    b3: 'אפשר לגרור בלוקים בעזרת ⋮⋮, לסמן אותם במלבן ולצבוע דרך התפריט',
    toggle: 'רשימה מתקפלת — לחצו על המשולש',
    inner: 'אפשר להסתיר בפנים כל דבר: טקסט, משימות, תמונות.',
    callout: 'השינויים נשמרים אוטומטית. <code>Ctrl+S</code> — שמירה מיידית, <code>Ctrl+P</code> — חיפוש בכל הפתקים, <code>Ctrl+F</code> — חיפוש בדף.',
    draw: 'ציור',
    drawText: 'למטה יש קנבס. ציירו בעכבר, בעט או באצבע. אפשר גם להפוך תמונה לקנבס ולצייר מעליה.',
    table: 'טבלאות ומילון',
    tableText: 'הקלידו <code>/מילון</code> או <code>/טבלה</code>. <code>Tab</code> — התא הבא, <code>Enter</code> — שורה חדשה, <code>Ctrl+Enter</code> — יציאה מהטבלה. רשימות שהועתקו מ-Excel מודבקות ישר כטבלה.',
    rows: [['מילה', 'תרגום'], ['hello', 'שלום'], ['привет', 'היי'], ['gracias', 'תודה']],
  },
};

export function seedPage(lang) {
  const s = TEXT[lang] || TEXT.en;
  const b = (type, html, extra) => ({ id: uid(), type, html, ...extra });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return {
    meta: { title: s.title, icon: '👋' },
    page: {
      cover: { kind: 'grad', value: 3 },
      blocks: [
        b('p', s.intro),
        b('h2', s.start),
        b('todo', s.t1, { checked: true }),
        b('todo', s.t2),
        b('todo', s.t3),
        b('todo', s.t4, { remind: { at: tomorrow.getTime() } }),
        b('h2', s.can),
        b('bullet', s.b1),
        b('bullet', s.b2),
        b('bullet', s.b3),
        b('toggle', s.toggle, { open: false }),
        b('p', s.inner, { indent: 1 }),
        b('callout', s.callout, { color: 'bg-blue' }),
        b('h2', s.table),
        b('p', s.tableText),
        { id: uid(), type: 'table', rows: s.rows },
        b('h2', s.draw),
        b('p', s.drawText),
        { id: uid(), type: 'draw', h: 240, strokes: [] },
        b('p', ''),
      ],
    },
  };
}
