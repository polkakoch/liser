// Локализация интерфейса: русский, английский, иврит (справа налево).
const ru = {
  'untitled': 'Без названия',
  'app.failed': 'Не удалось запустить Liser:',
  'cancel': 'Отмена', 'delete': 'Удалить', 'done': 'Готово', 'remove': 'Убрать', 'reset': 'Сбросить', 'open': 'Открыть',
  'undoAction': 'Вернуть', 'saved': 'Сохранено', 'saving': 'Сохранение…', 'saveError': 'Ошибка сохранения',
  'ago.now': 'только что', 'ago.today': 'сегодня в {time}',

  'side.hide': 'Скрыть панель', 'side.show': 'Показать панель', 'side.new': 'Новая страница', 'side.search': 'Поиск',
  'side.reminders': 'Напоминания', 'side.tasks': 'Задачи', 'side.favorites': 'Избранное', 'side.pages': 'Страницы',
  'side.trash': 'Корзина', 'side.settings': 'Настройки', 'side.more': 'Ещё', 'side.addChild': 'Добавить вложенную страницу',
  'side.noChildren': 'Нет вложенных страниц', 'side.noPages': 'Пока нет страниц', 'side.cantMove': 'Нельзя переместить страницу внутрь самой себя',

  'pm.fav': 'В избранное', 'pm.unfav': 'Убрать из избранного', 'pm.child': 'Вложенная страница', 'pm.duplicate': 'Дублировать',
  'pm.rename': 'Переименовать', 'pm.trash': 'В корзину', 'pm.copySuffix': ' (копия)', 'pm.smallText': 'Мелкий текст',
  'pm.fullWidth': 'Во всю ширину', 'pm.exportMd': 'Экспорт в Markdown', 'pm.exportPdf': 'Экспорт в PDF', 'pm.exported': 'Страница экспортирована',
  'pm.find': 'Найти на странице', 'pm.edited': 'изменено {when}', 'font.sans': 'Обычный', 'font.serif': 'С засечками', 'font.mono': 'Моно',
  'words': { one: '{n} слово', few: '{n} слова', many: '{n} слов', other: '{n} слова' },
  'toast.trashed': '«{title}» в корзине',
  'empty.title': 'Здесь пока пусто', 'empty.text': 'Создайте первую страницу — и начните записывать.',
  'top.options': 'Параметры страницы',

  'block.p': 'Текст', 'block.p.d': 'Обычный абзац', 'block.h1': 'Заголовок 1', 'block.h1.d': 'Крупный заголовок раздела',
  'block.h2': 'Заголовок 2', 'block.h2.d': 'Средний заголовок', 'block.h3': 'Заголовок 3', 'block.h3.d': 'Малый заголовок',
  'block.todo': 'Список задач', 'block.todo.d': 'Задачи с галочками', 'block.bullet': 'Маркированный список', 'block.bullet.d': 'Простой список с точками',
  'block.num': 'Нумерованный список', 'block.num.d': 'Список с номерами', 'block.toggle': 'Раскрывающийся список', 'block.toggle.d': 'Скрывает вложенные блоки',
  'block.quote': 'Цитата', 'block.quote.d': 'Выделить цитату', 'block.callout': 'Выноска', 'block.callout.d': 'Заметный блок с иконкой',
  'block.code': 'Код', 'block.code.d': 'Моноширинный блок кода', 'block.divider': 'Разделитель', 'block.divider.d': 'Горизонтальная линия',
  'block.image': 'Картинка', 'block.image.d': 'Загрузить с компьютера', 'block.draw': 'Рисунок', 'block.draw.d': 'Холст для рисования от руки',
  'block.remind': 'Напоминание', 'block.remind.d': 'Задача с датой и уведомлением', 'block.page': 'Страница', 'block.page.d': 'Вложенная страница',

  'ph.p': 'Введите текст или «/» для команд', 'ph.h1': 'Заголовок 1', 'ph.h2': 'Заголовок 2', 'ph.h3': 'Заголовок 3', 'ph.todo': 'Задача',
  'ph.list': 'Список', 'ph.toggle': 'Раскрывающийся список', 'ph.quote': 'Цитата', 'ph.callout': 'Текст выноски', 'ph.code': 'Код',

  'ed.addIcon': 'Добавить иконку', 'ed.changeIcon': 'Сменить иконку', 'ed.addCover': 'Добавить обложку', 'ed.changeCover': 'Сменить обложку',
  'ed.removeCover': 'Убрать', 'cover.gradients': 'Градиенты', 'cover.upload': 'Загрузить картинку',
  'ed.blocksHead': 'Блоки', 'ed.addBelow': 'Добавить блок ниже', 'ed.dragHint': 'Перетащите или нажмите для меню',
  'ed.turnInto': 'Превратить в', 'ed.remind': 'Напомнить…', 'ed.editRemind': 'Изменить напоминание', 'ed.color': 'Цвет',
  'ed.drawOver': 'Рисовать поверх', 'ed.duplicate': 'Дублировать', 'ed.delete': 'Удалить', 'ed.caption': 'Добавить подпись',
  'ed.resize': 'Потяните, чтобы изменить размер', 'ed.pageDeleted': 'Страница удалена', 'ed.emptyToggle': 'Пусто. Нажмите Enter в строке выше, чтобы добавить блок.',
  'fmt.bold': 'Жирный', 'fmt.italic': 'Курсив', 'fmt.underline': 'Подчёркнутый', 'fmt.strike': 'Зачёркнутый', 'fmt.code': 'Код',
  'fmt.link': 'Ссылка', 'fmt.color': 'Цвет',
  'color.textHead': 'Цвет текста', 'color.bgHead': 'Фон', 'color.bg': '{color} фон', 'color.default': 'По умолчанию',
  'color.gray': 'Серый', 'color.brown': 'Коричневый', 'color.orange': 'Оранжевый', 'color.yellow': 'Жёлтый', 'color.green': 'Зелёный',
  'color.blue': 'Синий', 'color.purple': 'Фиолетовый', 'color.pink': 'Розовый', 'color.red': 'Красный',
  'md.drawing': '[рисунок]',

  'draw.pen': 'Перо', 'draw.marker': 'Маркер', 'draw.eraser': 'Ластик', 'draw.size': 'Толщина {n}', 'draw.undo': 'Убрать последний штрих',
  'draw.clear': 'Очистить холст', 'draw.hint': 'Рисуйте здесь', 'draw.resize': 'Потяните, чтобы изменить высоту', 'draw.ink': 'Чернила',

  'cal.inHour': 'Через час', 'cal.evening': 'Вечером', 'cal.tomorrow': 'Завтра утром', 'cal.nextWeek': 'Через неделю',
  'cal.prev': 'Предыдущий месяц', 'cal.next': 'Следующий месяц', 'cal.time': 'Время', 'cal.repeat': 'Повтор',
  'repeat.none': 'Не повторять', 'repeat.daily': 'Каждый день', 'repeat.weekly': 'Каждую неделю', 'repeat.monthly': 'Каждый месяц', 'repeat.yearly': 'Каждый год',
  'emoji.title': 'Иконка', 'emoji.random': 'Случайная',

  'search.ph': 'Поиск по страницам и тексту…', 'search.none': 'Ничего не найдено', 'search.empty': 'Пока нет страниц', 'search.recent': 'Недавние',
  'find.ph': 'Найти на странице', 'find.count': '{i} из {n}', 'find.none': 'Нет совпадений', 'find.prev': 'Предыдущее', 'find.next': 'Следующее', 'find.close': 'Закрыть',

  'rem.title': 'Напоминания', 'rem.sub': 'Все даты и сроки из ваших заметок в одном месте', 'rem.overdue': 'Просрочено', 'rem.today': 'Сегодня',
  'rem.tomorrow': 'Завтра', 'rem.later': 'Позже', 'rem.done': 'Выполнено', 'rem.change': 'Изменить дату', 'rem.noText': 'Без текста',
  'rem.emptyTitle': 'Напоминаний пока нет', 'rem.emptyText': 'Откройте заметку, нажмите ⋮⋮ слева от блока и выберите «Напомнить…» — или введите /напоминание.',
  'rem.snooze': 'Отложить на 10 мин', 'rem.fallback': 'Напоминание',

  'tasks.title': 'Задачи', 'tasks.sub': 'Списки дел со всех страниц', 'tasks.showDone': 'Показать выполненные', 'tasks.hideDone': 'Скрыть выполненные',
  'tasks.emptyTitle': 'Задач пока нет', 'tasks.emptyText': 'Введите [] и пробел в любой заметке — получится задача с галочкой.', 'tasks.allDone': 'Всё сделано',
  'tasks.allDoneText': { one: 'Выполнена {n} задача. Отличная работа!', few: 'Выполнено {n} задачи. Отличная работа!', many: 'Выполнено {n} задач. Отличная работа!', other: 'Выполнено {n} задачи. Отличная работа!' },

  'trash.title': 'Корзина', 'trash.empty': 'Корзина пуста', 'trash.restore': 'Восстановить', 'trash.purge': 'Удалить навсегда',
  'trash.confirm': 'Удалить «{title}» навсегда? Вложенные страницы тоже будут удалены. Отменить это нельзя.', 'trash.purged': 'Страница удалена навсегда',
  'trash.emptyAll': 'Очистить корзину', 'trash.confirmAll': 'Удалить все страницы из корзины навсегда? Отменить это нельзя.',

  'set.title': 'Настройки', 'set.appearance': 'Оформление', 'set.language': 'Язык и регион', 'set.editor': 'Редактор',
  'set.notifications': 'Уведомления и фон', 'set.data': 'Данные', 'set.keys': 'Горячие клавиши', 'set.about': 'О программе',
  'set.theme': 'Тема', 'set.themeDesc': 'Системная подстраивается под Windows', 'theme.system': 'Системная', 'theme.light': 'Светлая', 'theme.dark': 'Тёмная',
  'set.accent': 'Акцентный цвет', 'set.accentDesc': 'Цвет кнопок, галочек и выделения',
  'set.zoom': 'Масштаб интерфейса', 'set.zoomDesc': 'Также Ctrl + колёсико мыши', 'zoom.out': 'Уменьшить', 'zoom.in': 'Увеличить',
  'set.lang': 'Язык интерфейса', 'set.langDesc': 'На иврите интерфейс отображается справа налево', 'lang.system': 'Как в системе',
  'set.weekStart': 'Первый день недели', 'week.auto': 'Авто', 'week.mon': 'Понедельник', 'week.sun': 'Воскресенье',
  'set.font': 'Шрифт новых страниц', 'set.fullWidth': 'Новые страницы во всю ширину', 'set.fullWidthDesc': 'Можно поменять для каждой страницы в меню ⋯',
  'set.sound': 'Звук уведомлений', 'set.tray': 'Сворачивать в трей при закрытии', 'set.trayDesc': 'Напоминания приходят, пока Liser работает в фоне',
  'set.autostart': 'Запускать вместе с Windows', 'set.autostartDesc': 'Liser стартует свёрнутым в трей',
  'set.folder': 'Папка с заметками', 'set.openFolder': 'Открыть', 'set.exportAll': 'Экспорт всех страниц', 'set.exportAllDesc': 'Markdown-файлы и картинки в выбранную папку',
  'set.export': 'Экспорт', 'set.backup': 'Резервная копия', 'set.backupDesc': 'Полная копия заметок и картинок в выбранную папку', 'set.backupCreate': 'Создать',
  'set.restore': 'Восстановить из копии', 'set.restoreDesc': 'Заменит текущие заметки содержимым копии', 'set.restoreBtn': 'Выбрать…',
  'set.autoBackup': 'Автоматические копии', 'set.autoBackupDesc': 'Раз в день, хранятся последние 7',
  'set.exported': { one: 'Экспортирована {n} страница', few: 'Экспортировано {n} страницы', many: 'Экспортировано {n} страниц', other: 'Экспортировано {n} страницы' },
  'set.backupDone': 'Резервная копия создана', 'set.restoreConfirm': 'Восстановить заметки из копии? Текущие заметки будут заменены — перед этим Liser сохранит их в автоматическую копию.',
  'set.restoreBad': 'В этой папке нет резервной копии Liser', 'set.restoreBtnOk': 'Восстановить', 'set.version': 'Версия {v}',
  'set.aboutText': 'Офлайн-заметки. Все данные хранятся только на этом компьютере.',

  'keys.new': 'Новая страница', 'keys.search': 'Поиск', 'keys.find': 'Найти на странице', 'keys.save': 'Сохранить сейчас',
  'keys.sidebar': 'Скрыть / показать панель', 'keys.undo': 'Отменить / повторить', 'keys.format': 'Жирный, курсив, подчёркнутый', 'keys.code': 'Код в строке',
  'keys.link': 'Ссылка', 'keys.dup': 'Дублировать блок', 'keys.check': 'Отметить задачу', 'keys.move': 'Переместить блок', 'keys.indent': 'Отступ списка',
  'keys.zoom': 'Масштаб', 'keys.theme': 'Светлая / тёмная тема', 'keys.slash': 'Меню блоков', 'keys.settings': 'Настройки',
  'keys.pageLink': 'Ссылка на страницу', 'keys.wiki': 'Быстрая ссылка на страницу', 'keys.graph': 'Граф связей',

  'side.graph': 'Граф', 'app.updated': 'Liser обновлён до версии {v}',
  'fmt.pageLink': 'Ссылка на страницу', 'fmt.pageLinkShort': 'Страница',
  'link.ph': 'Найти или создать страницу…', 'link.create': 'Создать «{title}»', 'link.createHint': 'Новая вложенная страница',
  'link.none': 'Страниц не найдено', 'link.remove': 'Убрать ссылку', 'link.emptyPage': 'Пустая страница',
  'bl.title': 'Ссылки на эту страницу', 'bl.unlinked': 'Упоминания без ссылки', 'bl.link': 'Связать', 'bl.linked': 'Ссылка добавлена',
  'bl.asBlock': 'Блок со ссылкой на страницу',
  'graph.filter': 'Найти на графе…', 'graph.tree': 'Вложенность', 'graph.orphans': 'Без связей', 'graph.labels': 'Подписи',
  'graph.fit': 'Показать всё', 'graph.local': 'Граф страницы', 'graph.global': 'Весь граф', 'graph.depth': 'Глубина связей',
  'graph.depthN': 'Глубина {n}',
  'graph.hint': 'Колесо — масштаб · перетаскивание — сдвиг · клик — открыть',
  'graph.emptyTitle': 'Связей пока нет',
  'graph.emptyText': 'Выделите слово в заметке и нажмите «Страница» на панели или наберите [[ — страницы соединятся линиями.',
  'graph.pages': { one: '{n} страница', few: '{n} страницы', many: '{n} страниц', other: '{n} страницы' },
  'graph.links': { one: '{n} связь', few: '{n} связи', many: '{n} связей', other: '{n} связи' },
  'block.table': 'Таблица', 'block.table.d': 'Строки и столбцы с текстом',
  'block.vocab': 'Словарь', 'block.vocab.d': 'Таблица «слово — перевод» для новых слов',
  'table.word': 'Слово', 'table.translation': 'Перевод', 'table.col': 'Столбец {n}',
  'table.addRow': 'Новая строка', 'table.addRowHint': 'Добавить строку · или Tab в последней ячейке, Enter в последней строке',
  'table.addCol': 'Добавить столбец', 'table.options': 'Действия с таблицей',
  'table.rowAbove': 'Вставить строку выше', 'table.rowBelow': 'Вставить строку ниже',
  'table.colBefore': 'Вставить столбец перед этим', 'table.colAfter': 'Вставить столбец после этого',
  'table.delRow': 'Удалить строку', 'table.delCol': 'Удалить столбец',
  'table.sortAsc': 'Сортировать по столбцу: А → Я', 'table.sortDesc': 'Сортировать по столбцу: Я → А',
  'table.header': 'Строка заголовков',
  'table.rows': { one: '{n} строка', few: '{n} строки', many: '{n} строк', other: '{n} строки' },
  'keys.table': 'Таблица: следующая ячейка / новая строка / выйти из таблицы',
  'set.restoreFailed': 'Не удалось восстановить копию — текущие заметки не тронуты',
  'code.auto': 'Авто', 'code.autoDetected': '{lang} · авто', 'code.pickLang': 'Язык подсветки', 'code.search': 'Найти язык…',
  'code.copy': 'Копировать', 'code.copied': 'Код скопирован', 'code.pasted': 'Вставлено как код · {lang}',
  'table.resize': 'Потяните, чтобы изменить ширину · двойной щелчок — сбросить',
  'block.toc': 'Оглавление', 'block.toc.d': 'Список заголовков страницы', 'ed.tocEmpty': 'Добавьте заголовки — они появятся здесь', 'ed.untitledHeading': 'Заголовок без текста',
  'keys.turnInto': 'Сменить тип блока: текст, заголовки, задача, списки, код, цитата', 'keys.blockMenu': 'Меню блока',
  'keys.mention': 'Ссылка на страницу через @', 'keys.inlineMd': 'Жирный, курсив, зачёркнутый, код прямо при наборе',
  'zoom.reset': 'Сбросить',
};

const en = {
  'untitled': 'Untitled',
  'app.failed': 'Liser failed to start:',
  'cancel': 'Cancel', 'delete': 'Delete', 'done': 'Done', 'remove': 'Remove', 'reset': 'Reset', 'open': 'Open',
  'undoAction': 'Undo', 'saved': 'Saved', 'saving': 'Saving…', 'saveError': 'Save failed',
  'ago.now': 'just now', 'ago.today': 'today at {time}',

  'side.hide': 'Hide sidebar', 'side.show': 'Show sidebar', 'side.new': 'New page', 'side.search': 'Search',
  'side.reminders': 'Reminders', 'side.tasks': 'Tasks', 'side.favorites': 'Favorites', 'side.pages': 'Pages',
  'side.trash': 'Trash', 'side.settings': 'Settings', 'side.more': 'More', 'side.addChild': 'Add a page inside',
  'side.noChildren': 'No pages inside', 'side.noPages': 'No pages yet', 'side.cantMove': 'A page can’t be moved inside itself',

  'pm.fav': 'Add to Favorites', 'pm.unfav': 'Remove from Favorites', 'pm.child': 'Page inside', 'pm.duplicate': 'Duplicate',
  'pm.rename': 'Rename', 'pm.trash': 'Move to Trash', 'pm.copySuffix': ' (copy)', 'pm.smallText': 'Small text',
  'pm.fullWidth': 'Full width', 'pm.exportMd': 'Export to Markdown', 'pm.exportPdf': 'Export to PDF', 'pm.exported': 'Page exported',
  'pm.find': 'Find in page', 'pm.edited': 'edited {when}', 'font.sans': 'Default', 'font.serif': 'Serif', 'font.mono': 'Mono',
  'words': { one: '{n} word', other: '{n} words' },
  'toast.trashed': '“{title}” moved to Trash',
  'empty.title': 'Nothing here yet', 'empty.text': 'Create your first page and start writing.',
  'top.options': 'Page options',

  'block.p': 'Text', 'block.p.d': 'Plain paragraph', 'block.h1': 'Heading 1', 'block.h1.d': 'Big section heading',
  'block.h2': 'Heading 2', 'block.h2.d': 'Medium heading', 'block.h3': 'Heading 3', 'block.h3.d': 'Small heading',
  'block.todo': 'To-do list', 'block.todo.d': 'Tasks with checkboxes', 'block.bullet': 'Bulleted list', 'block.bullet.d': 'Simple bulleted list',
  'block.num': 'Numbered list', 'block.num.d': 'List with numbers', 'block.toggle': 'Toggle list', 'block.toggle.d': 'Hides the blocks nested inside',
  'block.quote': 'Quote', 'block.quote.d': 'Capture a quote', 'block.callout': 'Callout', 'block.callout.d': 'Make text stand out',
  'block.code': 'Code', 'block.code.d': 'Monospaced code block', 'block.divider': 'Divider', 'block.divider.d': 'Horizontal line',
  'block.image': 'Image', 'block.image.d': 'Upload from your computer', 'block.draw': 'Drawing', 'block.draw.d': 'Freehand drawing canvas',
  'block.remind': 'Reminder', 'block.remind.d': 'Task with a date and notification', 'block.page': 'Page', 'block.page.d': 'Page inside this one',

  'ph.p': 'Type text or “/” for commands', 'ph.h1': 'Heading 1', 'ph.h2': 'Heading 2', 'ph.h3': 'Heading 3', 'ph.todo': 'To-do',
  'ph.list': 'List', 'ph.toggle': 'Toggle', 'ph.quote': 'Quote', 'ph.callout': 'Callout text', 'ph.code': 'Code',

  'ed.addIcon': 'Add icon', 'ed.changeIcon': 'Change icon', 'ed.addCover': 'Add cover', 'ed.changeCover': 'Change cover',
  'ed.removeCover': 'Remove', 'cover.gradients': 'Gradients', 'cover.upload': 'Upload image',
  'ed.blocksHead': 'Blocks', 'ed.addBelow': 'Add a block below', 'ed.dragHint': 'Drag to move, click for menu',
  'ed.turnInto': 'Turn into', 'ed.remind': 'Remind me…', 'ed.editRemind': 'Edit reminder', 'ed.color': 'Color',
  'ed.drawOver': 'Draw on top', 'ed.duplicate': 'Duplicate', 'ed.delete': 'Delete', 'ed.caption': 'Add a caption',
  'ed.resize': 'Drag to resize', 'ed.pageDeleted': 'Page deleted', 'ed.emptyToggle': 'Empty. Press Enter in the line above to add a block.',
  'fmt.bold': 'Bold', 'fmt.italic': 'Italic', 'fmt.underline': 'Underline', 'fmt.strike': 'Strikethrough', 'fmt.code': 'Code',
  'fmt.link': 'Link', 'fmt.color': 'Color',
  'color.textHead': 'Text color', 'color.bgHead': 'Background', 'color.bg': '{color} background', 'color.default': 'Default',
  'color.gray': 'Gray', 'color.brown': 'Brown', 'color.orange': 'Orange', 'color.yellow': 'Yellow', 'color.green': 'Green',
  'color.blue': 'Blue', 'color.purple': 'Purple', 'color.pink': 'Pink', 'color.red': 'Red',
  'md.drawing': '[drawing]',

  'draw.pen': 'Pen', 'draw.marker': 'Highlighter', 'draw.eraser': 'Eraser', 'draw.size': 'Size {n}', 'draw.undo': 'Undo last stroke',
  'draw.clear': 'Clear canvas', 'draw.hint': 'Draw here', 'draw.resize': 'Drag to change height', 'draw.ink': 'Ink',

  'cal.inHour': 'In an hour', 'cal.evening': 'This evening', 'cal.tomorrow': 'Tomorrow morning', 'cal.nextWeek': 'Next week',
  'cal.prev': 'Previous month', 'cal.next': 'Next month', 'cal.time': 'Time', 'cal.repeat': 'Repeat',
  'repeat.none': 'Don’t repeat', 'repeat.daily': 'Every day', 'repeat.weekly': 'Every week', 'repeat.monthly': 'Every month', 'repeat.yearly': 'Every year',
  'emoji.title': 'Icon', 'emoji.random': 'Random',

  'search.ph': 'Search pages and text…', 'search.none': 'No results', 'search.empty': 'No pages yet', 'search.recent': 'Recent',
  'find.ph': 'Find in page', 'find.count': '{i} of {n}', 'find.none': 'No matches', 'find.prev': 'Previous', 'find.next': 'Next', 'find.close': 'Close',

  'rem.title': 'Reminders', 'rem.sub': 'Every date and deadline from your notes in one place', 'rem.overdue': 'Overdue', 'rem.today': 'Today',
  'rem.tomorrow': 'Tomorrow', 'rem.later': 'Later', 'rem.done': 'Done', 'rem.change': 'Change date', 'rem.noText': 'No text',
  'rem.emptyTitle': 'No reminders yet', 'rem.emptyText': 'Open a note, click ⋮⋮ next to a block and choose “Remind me…” — or type /reminder.',
  'rem.snooze': 'Snooze 10 min', 'rem.fallback': 'Reminder',

  'tasks.title': 'Tasks', 'tasks.sub': 'To-do lists from every page', 'tasks.showDone': 'Show completed', 'tasks.hideDone': 'Hide completed',
  'tasks.emptyTitle': 'No tasks yet', 'tasks.emptyText': 'Type [] and a space in any note to create a task with a checkbox.', 'tasks.allDone': 'All done',
  'tasks.allDoneText': { one: '{n} task completed. Great job!', other: '{n} tasks completed. Great job!' },

  'trash.title': 'Trash', 'trash.empty': 'Trash is empty', 'trash.restore': 'Restore', 'trash.purge': 'Delete forever',
  'trash.confirm': 'Delete “{title}” forever? Pages inside it will be deleted too. This can’t be undone.', 'trash.purged': 'Page deleted forever',
  'trash.emptyAll': 'Empty Trash', 'trash.confirmAll': 'Delete every page in Trash forever? This can’t be undone.',

  'set.title': 'Settings', 'set.appearance': 'Appearance', 'set.language': 'Language & region', 'set.editor': 'Editor',
  'set.notifications': 'Notifications & background', 'set.data': 'Data', 'set.keys': 'Keyboard shortcuts', 'set.about': 'About',
  'set.theme': 'Theme', 'set.themeDesc': 'System follows your Windows setting', 'theme.system': 'System', 'theme.light': 'Light', 'theme.dark': 'Dark',
  'set.accent': 'Accent color', 'set.accentDesc': 'Color of buttons, checkboxes and selection',
  'set.zoom': 'Interface scale', 'set.zoomDesc': 'Also Ctrl + mouse wheel', 'zoom.out': 'Zoom out', 'zoom.in': 'Zoom in',
  'set.lang': 'Interface language', 'set.langDesc': 'Hebrew switches the interface to right-to-left', 'lang.system': 'System default',
  'set.weekStart': 'First day of the week', 'week.auto': 'Auto', 'week.mon': 'Monday', 'week.sun': 'Sunday',
  'set.font': 'Font for new pages', 'set.fullWidth': 'New pages use full width', 'set.fullWidthDesc': 'You can change it per page in the ⋯ menu',
  'set.sound': 'Notification sound', 'set.tray': 'Minimize to tray on close', 'set.trayDesc': 'Reminders keep coming while Liser runs in the background',
  'set.autostart': 'Start with Windows', 'set.autostartDesc': 'Liser starts minimized to the tray',
  'set.folder': 'Notes folder', 'set.openFolder': 'Open', 'set.exportAll': 'Export all pages', 'set.exportAllDesc': 'Markdown files and images to a folder you choose',
  'set.export': 'Export', 'set.backup': 'Backup', 'set.backupDesc': 'A full copy of notes and images to a folder you choose', 'set.backupCreate': 'Create',
  'set.restore': 'Restore from backup', 'set.restoreDesc': 'Replaces your current notes with the backup', 'set.restoreBtn': 'Choose…',
  'set.autoBackup': 'Automatic backups', 'set.autoBackupDesc': 'Once a day, the last 7 are kept',
  'set.exported': { one: '{n} page exported', other: '{n} pages exported' },
  'set.backupDone': 'Backup created', 'set.restoreConfirm': 'Restore notes from this backup? Your current notes will be replaced — Liser will save them to an automatic backup first.',
  'set.restoreBad': 'This folder doesn’t contain a Liser backup', 'set.restoreBtnOk': 'Restore', 'set.version': 'Version {v}',
  'set.aboutText': 'Offline notes. All data stays on this computer.',

  'keys.new': 'New page', 'keys.search': 'Search', 'keys.find': 'Find in page', 'keys.save': 'Save now',
  'keys.sidebar': 'Hide / show sidebar', 'keys.undo': 'Undo / redo', 'keys.format': 'Bold, italic, underline', 'keys.code': 'Inline code',
  'keys.link': 'Link', 'keys.dup': 'Duplicate block', 'keys.check': 'Check a task', 'keys.move': 'Move block', 'keys.indent': 'Indent list',
  'keys.zoom': 'Zoom', 'keys.theme': 'Light / dark theme', 'keys.slash': 'Block menu', 'keys.settings': 'Settings',
  'keys.pageLink': 'Link to page', 'keys.wiki': 'Quick link to page', 'keys.graph': 'Graph view',

  'side.graph': 'Graph', 'app.updated': 'Liser has been updated to version {v}',
  'fmt.pageLink': 'Link to page', 'fmt.pageLinkShort': 'Page',
  'link.ph': 'Find or create a page…', 'link.create': 'Create “{title}”', 'link.createHint': 'New subpage',
  'link.none': 'No pages found', 'link.remove': 'Remove link', 'link.emptyPage': 'Empty page',
  'bl.title': 'Linked mentions', 'bl.unlinked': 'Unlinked mentions', 'bl.link': 'Link', 'bl.linked': 'Link added',
  'bl.asBlock': 'Page block',
  'graph.filter': 'Search the graph…', 'graph.tree': 'Hierarchy', 'graph.orphans': 'Orphans', 'graph.labels': 'Labels',
  'graph.fit': 'Fit to screen', 'graph.local': 'Page graph', 'graph.global': 'Whole graph', 'graph.depth': 'Link depth',
  'graph.depthN': 'Depth {n}',
  'graph.hint': 'Scroll to zoom · drag to pan · click to open',
  'graph.emptyTitle': 'No links yet',
  'graph.emptyText': 'Select a word in a note and press “Page” on the toolbar, or type [[ — linked pages get connected here.',
  'graph.pages': { one: '{n} page', other: '{n} pages' },
  'graph.links': { one: '{n} link', other: '{n} links' },
  'block.table': 'Table', 'block.table.d': 'Rows and columns of text',
  'block.vocab': 'Vocabulary', 'block.vocab.d': 'Word — translation table for new words',
  'table.word': 'Word', 'table.translation': 'Translation', 'table.col': 'Column {n}',
  'table.addRow': 'New row', 'table.addRowHint': 'Add a row · or Tab in the last cell, Enter in the last row',
  'table.addCol': 'Add column', 'table.options': 'Table actions',
  'table.rowAbove': 'Insert row above', 'table.rowBelow': 'Insert row below',
  'table.colBefore': 'Insert column before', 'table.colAfter': 'Insert column after',
  'table.delRow': 'Delete row', 'table.delCol': 'Delete column',
  'table.sortAsc': 'Sort by column: A → Z', 'table.sortDesc': 'Sort by column: Z → A',
  'table.header': 'Header row',
  'table.rows': { one: '{n} row', other: '{n} rows' },
  'keys.table': 'Table: next cell / new row / leave the table',
  'set.restoreFailed': 'Couldn’t restore the backup — your current notes are untouched',
  'code.auto': 'Auto', 'code.autoDetected': '{lang} · auto', 'code.pickLang': 'Highlighting language', 'code.search': 'Find a language…',
  'code.copy': 'Copy', 'code.copied': 'Code copied', 'code.pasted': 'Pasted as code · {lang}',
  'table.resize': 'Drag to resize · double-click to reset',
  'block.toc': 'Table of contents', 'block.toc.d': 'List of the page’s headings', 'ed.tocEmpty': 'Add headings and they’ll show up here', 'ed.untitledHeading': 'Empty heading',
  'keys.turnInto': 'Turn into: text, headings, to-do, lists, code, quote', 'keys.blockMenu': 'Block menu',
  'keys.mention': 'Link a page with @', 'keys.inlineMd': 'Bold, italic, strikethrough, code as you type',
  'zoom.reset': 'Reset',
};

const he = {
  'untitled': 'ללא כותרת',
  'app.failed': 'לא ניתן להפעיל את Liser:',
  'cancel': 'ביטול', 'delete': 'מחיקה', 'done': 'סיום', 'remove': 'הסרה', 'reset': 'איפוס', 'open': 'פתיחה',
  'undoAction': 'שחזור', 'saved': 'נשמר', 'saving': 'שומר…', 'saveError': 'שגיאה בשמירה',
  'ago.now': 'עכשיו', 'ago.today': 'היום ב-{time}',

  'side.hide': 'הסתרת הסרגל', 'side.show': 'הצגת הסרגל', 'side.new': 'דף חדש', 'side.search': 'חיפוש',
  'side.reminders': 'תזכורות', 'side.tasks': 'משימות', 'side.favorites': 'מועדפים', 'side.pages': 'דפים',
  'side.trash': 'אשפה', 'side.settings': 'הגדרות', 'side.more': 'עוד', 'side.addChild': 'הוספת דף פנימי',
  'side.noChildren': 'אין דפים פנימיים', 'side.noPages': 'אין עדיין דפים', 'side.cantMove': 'אי אפשר להעביר דף לתוך עצמו',

  'pm.fav': 'הוספה למועדפים', 'pm.unfav': 'הסרה מהמועדפים', 'pm.child': 'דף פנימי', 'pm.duplicate': 'שכפול',
  'pm.rename': 'שינוי שם', 'pm.trash': 'העברה לאשפה', 'pm.copySuffix': ' (עותק)', 'pm.smallText': 'טקסט קטן',
  'pm.fullWidth': 'רוחב מלא', 'pm.exportMd': 'ייצוא ל-Markdown', 'pm.exportPdf': 'ייצוא ל-PDF', 'pm.exported': 'הדף יוצא',
  'pm.find': 'חיפוש בדף', 'pm.edited': 'נערך {when}', 'font.sans': 'רגיל', 'font.serif': 'סריף', 'font.mono': 'מונו',
  'words': { one: 'מילה אחת', two: '{n} מילים', other: '{n} מילים' },
  'toast.trashed': '״{title}״ הועבר לאשפה',
  'empty.title': 'עדיין ריק כאן', 'empty.text': 'צרו את הדף הראשון ותתחילו לכתוב.',
  'top.options': 'אפשרויות הדף',

  'block.p': 'טקסט', 'block.p.d': 'פסקה רגילה', 'block.h1': 'כותרת 1', 'block.h1.d': 'כותרת גדולה לפרק',
  'block.h2': 'כותרת 2', 'block.h2.d': 'כותרת בינונית', 'block.h3': 'כותרת 3', 'block.h3.d': 'כותרת קטנה',
  'block.todo': 'רשימת משימות', 'block.todo.d': 'משימות עם תיבות סימון', 'block.bullet': 'רשימת תבליטים', 'block.bullet.d': 'רשימה פשוטה עם נקודות',
  'block.num': 'רשימה ממוספרת', 'block.num.d': 'רשימה עם מספרים', 'block.toggle': 'רשימה מתקפלת', 'block.toggle.d': 'מסתירה את הבלוקים שבתוכה',
  'block.quote': 'ציטוט', 'block.quote.d': 'הדגשת ציטוט', 'block.callout': 'הערה בולטת', 'block.callout.d': 'בלוק מודגש עם אייקון',
  'block.code': 'קוד', 'block.code.d': 'בלוק קוד ברוחב קבוע', 'block.divider': 'קו מפריד', 'block.divider.d': 'קו אופקי',
  'block.image': 'תמונה', 'block.image.d': 'העלאה מהמחשב', 'block.draw': 'ציור', 'block.draw.d': 'קנבס לציור ביד חופשית',
  'block.remind': 'תזכורת', 'block.remind.d': 'משימה עם תאריך והתראה', 'block.page': 'דף', 'block.page.d': 'דף פנימי',

  'ph.p': 'הקלידו טקסט או ״/״ לפקודות', 'ph.h1': 'כותרת 1', 'ph.h2': 'כותרת 2', 'ph.h3': 'כותרת 3', 'ph.todo': 'משימה',
  'ph.list': 'רשימה', 'ph.toggle': 'רשימה מתקפלת', 'ph.quote': 'ציטוט', 'ph.callout': 'טקסט ההערה', 'ph.code': 'קוד',

  'ed.addIcon': 'הוספת אייקון', 'ed.changeIcon': 'החלפת אייקון', 'ed.addCover': 'הוספת כיסוי', 'ed.changeCover': 'החלפת כיסוי',
  'ed.removeCover': 'הסרה', 'cover.gradients': 'מעברי צבע', 'cover.upload': 'העלאת תמונה',
  'ed.blocksHead': 'בלוקים', 'ed.addBelow': 'הוספת בלוק מתחת', 'ed.dragHint': 'גרירה להזזה, לחיצה לתפריט',
  'ed.turnInto': 'הפיכה ל…', 'ed.remind': 'תזכורת…', 'ed.editRemind': 'עריכת תזכורת', 'ed.color': 'צבע',
  'ed.drawOver': 'ציור מעל התמונה', 'ed.duplicate': 'שכפול', 'ed.delete': 'מחיקה', 'ed.caption': 'הוספת כיתוב',
  'ed.resize': 'גרירה לשינוי גודל', 'ed.pageDeleted': 'הדף נמחק', 'ed.emptyToggle': 'ריק. הקישו Enter בשורה שמעל כדי להוסיף בלוק.',
  'fmt.bold': 'מודגש', 'fmt.italic': 'נטוי', 'fmt.underline': 'קו תחתון', 'fmt.strike': 'קו חוצה', 'fmt.code': 'קוד',
  'fmt.link': 'קישור', 'fmt.color': 'צבע',
  'color.textHead': 'צבע טקסט', 'color.bgHead': 'רקע', 'color.bg': 'רקע {color}', 'color.default': 'ברירת מחדל',
  'color.gray': 'אפור', 'color.brown': 'חום', 'color.orange': 'כתום', 'color.yellow': 'צהוב', 'color.green': 'ירוק',
  'color.blue': 'כחול', 'color.purple': 'סגול', 'color.pink': 'ורוד', 'color.red': 'אדום',
  'md.drawing': '[ציור]',

  'draw.pen': 'עט', 'draw.marker': 'מרקר', 'draw.eraser': 'מחק', 'draw.size': 'עובי {n}', 'draw.undo': 'ביטול הקו האחרון',
  'draw.clear': 'ניקוי הקנבס', 'draw.hint': 'ציירו כאן', 'draw.resize': 'גרירה לשינוי הגובה', 'draw.ink': 'דיו',

  'cal.inHour': 'בעוד שעה', 'cal.evening': 'הערב', 'cal.tomorrow': 'מחר בבוקר', 'cal.nextWeek': 'בעוד שבוע',
  'cal.prev': 'החודש הקודם', 'cal.next': 'החודש הבא', 'cal.time': 'שעה', 'cal.repeat': 'חזרה',
  'repeat.none': 'ללא חזרה', 'repeat.daily': 'כל יום', 'repeat.weekly': 'כל שבוע', 'repeat.monthly': 'כל חודש', 'repeat.yearly': 'כל שנה',
  'emoji.title': 'אייקון', 'emoji.random': 'אקראי',

  'search.ph': 'חיפוש בדפים ובטקסט…', 'search.none': 'לא נמצאו תוצאות', 'search.empty': 'אין עדיין דפים', 'search.recent': 'אחרונים',
  'find.ph': 'חיפוש בדף', 'find.count': '{i} מתוך {n}', 'find.none': 'אין התאמות', 'find.prev': 'הקודם', 'find.next': 'הבא', 'find.close': 'סגירה',

  'rem.title': 'תזכורות', 'rem.sub': 'כל התאריכים והמועדים מהפתקים שלך במקום אחד', 'rem.overdue': 'באיחור', 'rem.today': 'היום',
  'rem.tomorrow': 'מחר', 'rem.later': 'בהמשך', 'rem.done': 'בוצעו', 'rem.change': 'שינוי תאריך', 'rem.noText': 'ללא טקסט',
  'rem.emptyTitle': 'אין עדיין תזכורות', 'rem.emptyText': 'פתחו פתק, לחצו על ⋮⋮ ליד בלוק ובחרו ״תזכורת…״ — או הקלידו ‎/תזכורת.',
  'rem.snooze': 'דחייה ב-10 דק׳', 'rem.fallback': 'תזכורת',

  'tasks.title': 'משימות', 'tasks.sub': 'רשימות מטלות מכל הדפים', 'tasks.showDone': 'הצגת משימות שבוצעו', 'tasks.hideDone': 'הסתרת משימות שבוצעו',
  'tasks.emptyTitle': 'אין עדיין משימות', 'tasks.emptyText': 'הקלידו [] ורווח בכל פתק — ותתקבל משימה עם תיבת סימון.', 'tasks.allDone': 'הכול בוצע',
  'tasks.allDoneText': { one: 'משימה אחת בוצעה. כל הכבוד!', other: '{n} משימות בוצעו. כל הכבוד!' },

  'trash.title': 'אשפה', 'trash.empty': 'האשפה ריקה', 'trash.restore': 'שחזור', 'trash.purge': 'מחיקה לצמיתות',
  'trash.confirm': 'למחוק את ״{title}״ לצמיתות? גם הדפים הפנימיים יימחקו. אי אפשר לבטל את הפעולה.', 'trash.purged': 'הדף נמחק לצמיתות',
  'trash.emptyAll': 'ריקון האשפה', 'trash.confirmAll': 'למחוק לצמיתות את כל הדפים שבאשפה? אי אפשר לבטל את הפעולה.',

  'set.title': 'הגדרות', 'set.appearance': 'מראה', 'set.language': 'שפה ואזור', 'set.editor': 'עורך',
  'set.notifications': 'התראות ורקע', 'set.data': 'נתונים', 'set.keys': 'קיצורי מקלדת', 'set.about': 'אודות',
  'set.theme': 'ערכת נושא', 'set.themeDesc': 'מערכת — לפי ההגדרה של Windows', 'theme.system': 'מערכת', 'theme.light': 'בהירה', 'theme.dark': 'כהה',
  'set.accent': 'צבע הדגשה', 'set.accentDesc': 'צבע הכפתורים, תיבות הסימון והבחירה',
  'set.zoom': 'גודל הממשק', 'set.zoomDesc': 'גם Ctrl + גלגלת העכבר', 'zoom.out': 'הקטנה', 'zoom.in': 'הגדלה',
  'set.lang': 'שפת הממשק', 'set.langDesc': 'בעברית הממשק מוצג מימין לשמאל', 'lang.system': 'לפי המערכת',
  'set.weekStart': 'היום הראשון בשבוע', 'week.auto': 'אוטומטי', 'week.mon': 'שני', 'week.sun': 'ראשון',
  'set.font': 'גופן לדפים חדשים', 'set.fullWidth': 'דפים חדשים ברוחב מלא', 'set.fullWidthDesc': 'אפשר לשנות לכל דף בתפריט ⋯',
  'set.sound': 'צליל התראה', 'set.tray': 'מזעור למגש בעת סגירה', 'set.trayDesc': 'התזכורות ממשיכות להגיע כש-Liser פועל ברקע',
  'set.autostart': 'הפעלה יחד עם Windows', 'set.autostartDesc': 'Liser נפתח ממוזער במגש',
  'set.folder': 'תיקיית הפתקים', 'set.openFolder': 'פתיחה', 'set.exportAll': 'ייצוא כל הדפים', 'set.exportAllDesc': 'קובצי Markdown ותמונות לתיקייה לבחירתכם',
  'set.export': 'ייצוא', 'set.backup': 'גיבוי', 'set.backupDesc': 'עותק מלא של הפתקים והתמונות לתיקייה לבחירתכם', 'set.backupCreate': 'יצירה',
  'set.restore': 'שחזור מגיבוי', 'set.restoreDesc': 'מחליף את הפתקים הנוכחיים בתוכן הגיבוי', 'set.restoreBtn': 'בחירה…',
  'set.autoBackup': 'גיבויים אוטומטיים', 'set.autoBackupDesc': 'פעם ביום, נשמרים 7 האחרונים',
  'set.exported': { one: 'דף אחד יוצא', other: '{n} דפים יוצאו' },
  'set.backupDone': 'הגיבוי נוצר', 'set.restoreConfirm': 'לשחזר את הפתקים מהגיבוי? הפתקים הנוכחיים יוחלפו — לפני כן Liser ישמור אותם בגיבוי אוטומטי.',
  'set.restoreBad': 'בתיקייה זו אין גיבוי של Liser', 'set.restoreBtnOk': 'שחזור', 'set.version': 'גרסה {v}',
  'set.aboutText': 'פתקים אופליין. כל הנתונים נשמרים רק במחשב הזה.',

  'keys.new': 'דף חדש', 'keys.search': 'חיפוש', 'keys.find': 'חיפוש בדף', 'keys.save': 'שמירה עכשיו',
  'keys.sidebar': 'הסתרה / הצגה של הסרגל', 'keys.undo': 'ביטול / ביצוע חוזר', 'keys.format': 'מודגש, נטוי, קו תחתון', 'keys.code': 'קוד בשורה',
  'keys.link': 'קישור', 'keys.dup': 'שכפול בלוק', 'keys.check': 'סימון משימה', 'keys.move': 'הזזת בלוק', 'keys.indent': 'הזחת רשימה',
  'keys.zoom': 'גודל תצוגה', 'keys.theme': 'ערכה בהירה / כהה', 'keys.slash': 'תפריט בלוקים', 'keys.settings': 'הגדרות',
  'keys.pageLink': 'קישור לדף', 'keys.wiki': 'קישור מהיר לדף', 'keys.graph': 'תצוגת גרף',

  'side.graph': 'גרף', 'app.updated': 'Liser עודכן לגרסה {v}',
  'fmt.pageLink': 'קישור לדף', 'fmt.pageLinkShort': 'דף',
  'link.ph': 'חיפוש או יצירה של דף…', 'link.create': 'יצירת „{title}”', 'link.createHint': 'דף משנה חדש',
  'link.none': 'לא נמצאו דפים', 'link.remove': 'הסרת הקישור', 'link.emptyPage': 'דף ריק',
  'bl.title': 'דפים שמקשרים לכאן', 'bl.unlinked': 'אזכורים ללא קישור', 'bl.link': 'קישור', 'bl.linked': 'הקישור נוסף',
  'bl.asBlock': 'בלוק של דף',
  'graph.filter': 'חיפוש בגרף…', 'graph.tree': 'היררכיה', 'graph.orphans': 'דפים ללא קישורים', 'graph.labels': 'תוויות',
  'graph.fit': 'התאמה למסך', 'graph.local': 'גרף הדף', 'graph.global': 'הגרף המלא', 'graph.depth': 'עומק הקישורים',
  'graph.depthN': 'עומק {n}',
  'graph.hint': 'גלגלת – זום · גרירה – הזזה · לחיצה – פתיחה',
  'graph.emptyTitle': 'עדיין אין קישורים',
  'graph.emptyText': 'סמנו מילה בפתק ולחצו על „דף” בסרגל, או הקלידו [[ – הדפים המקושרים יתחברו כאן בקווים.',
  'graph.pages': { one: 'דף אחד', two: '{n} דפים', other: '{n} דפים' },
  'graph.links': { one: 'קישור אחד', two: '{n} קישורים', other: '{n} קישורים' },
  'block.table': 'טבלה', 'block.table.d': 'שורות ועמודות של טקסט',
  'block.vocab': 'מילון', 'block.vocab.d': 'טבלת מילה — תרגום למילים חדשות',
  'table.word': 'מילה', 'table.translation': 'תרגום', 'table.col': 'עמודה {n}',
  'table.addRow': 'שורה חדשה', 'table.addRowHint': 'הוספת שורה · או Tab בתא האחרון, Enter בשורה האחרונה',
  'table.addCol': 'הוספת עמודה', 'table.options': 'פעולות בטבלה',
  'table.rowAbove': 'הוספת שורה מעל', 'table.rowBelow': 'הוספת שורה מתחת',
  'table.colBefore': 'הוספת עמודה לפני', 'table.colAfter': 'הוספת עמודה אחרי',
  'table.delRow': 'מחיקת השורה', 'table.delCol': 'מחיקת העמודה',
  'table.sortAsc': 'מיון לפי העמודה: א → ת', 'table.sortDesc': 'מיון לפי העמודה: ת → א',
  'table.header': 'שורת כותרות',
  'table.rows': { one: 'שורה אחת', two: '{n} שורות', other: '{n} שורות' },
  'keys.table': 'טבלה: התא הבא / שורה חדשה / יציאה מהטבלה',
  'set.restoreFailed': 'לא ניתן היה לשחזר את הגיבוי — הפתקים הנוכחיים לא השתנו',
  'code.auto': 'אוטומטי', 'code.autoDetected': '{lang} · אוטומטי', 'code.pickLang': 'שפת ההדגשה', 'code.search': 'חיפוש שפה…',
  'code.copy': 'העתקה', 'code.copied': 'הקוד הועתק', 'code.pasted': 'הודבק כקוד · {lang}',
  'table.resize': 'גררו כדי לשנות רוחב · לחיצה כפולה — איפוס',
  'block.toc': 'תוכן עניינים', 'block.toc.d': 'רשימת הכותרות בדף', 'ed.tocEmpty': 'הוסיפו כותרות והן יופיעו כאן', 'ed.untitledHeading': 'כותרת ריקה',
  'keys.turnInto': 'שינוי סוג הבלוק: טקסט, כותרות, משימה, רשימות, קוד, ציטוט', 'keys.blockMenu': 'תפריט הבלוק',
  'keys.mention': 'קישור לדף עם @', 'keys.inlineMd': 'מודגש, נטוי, קו חוצה וקוד תוך כדי הקלדה',
  'zoom.reset': 'איפוס',
};

const DICT = { ru, en, he };
export const DICTIONARIES = DICT; // для проверки полноты переводов (npm run check)
const LOCALES = { ru: 'ru-RU', en: 'en-US', he: 'he-IL' };
export const LANGS = [['ru', 'Русский'], ['en', 'English'], ['he', 'עברית']];

let lang = 'en';
let rules = new Intl.PluralRules('en-US');

export function resolveLang(pref, system) {
  const l = pref && pref !== 'system' ? pref : system;
  return DICT[l] ? l : 'en';
}

export function setLang(l) {
  lang = DICT[l] ? l : 'en';
  rules = new Intl.PluralRules(LOCALES[lang]);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

export const getLang = () => lang;
export const getLocale = () => LOCALES[lang];
export const isRTL = () => lang === 'he';

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')) : s);

export function t(key, vars) {
  const s = DICT[lang][key] ?? en[key] ?? key;
  return fill(typeof s === 'string' ? s : s.other, vars);
}

// Строка с учётом формы множественного числа: tn('words', 5) → «5 слов»
export function tn(key, n, vars) {
  const forms = DICT[lang][key] ?? en[key];
  if (!forms) return key;
  const cat = rules.select(n);
  return fill(forms[cat] ?? forms.other ?? forms.many, { n, ...vars });
}
