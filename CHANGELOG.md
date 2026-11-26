# Changelog

## 1.3.0

- Tables: `/table` inserts a grid of text cells, `/vocabulary` a ready “Word — Translation” table for learning languages. `Tab` moves to the next cell, `Enter` goes to the next row (and returns to the column you started from, like Excel), `Ctrl+Enter` leaves the table. Right-click a cell to add or delete rows and columns, sort by a column or toggle the header row. Each cell picks its own text direction, so words in Hebrew, Russian and English mix freely.
- Lists copied from Excel or Google Sheets paste in as a table; pasting into a table fills cells and adds rows. Markdown tables paste in too and export back as Markdown.
- Table text is included in search, link previews and word count. Column widths can be dragged (double-click resets).
- Code blocks: syntax highlighting for 22 languages (JavaScript, TypeScript, Python, HTML, CSS, JSON, SQL, Bash, PowerShell, C, C++, C#, Java, Kotlin, Swift, Go, Rust, PHP, Ruby, YAML, XML, Markdown), automatic language detection, a language picker and a Copy button. `Enter` keeps indentation, `Shift+Tab` outdents.
- Pasting a piece of code into the page turns it into a code block with the language detected; ```` ```python ```` fences keep their language on paste and export.
- Markdown as you type: `**bold**`, `*italic*`, `` `code` ``, `~~strikethrough~~`.
- `Ctrl+Shift+0…9` turns the current block into text, headings, to-do, lists, toggle, code or quote; `Ctrl+/` opens the block menu.
- `@` links a page, like `[[`.
- Table of contents block (`/toc`) that follows the page’s headings.
- Pasting a URL creates a link; pasting a URL over selected text links that text.
- Zoom: browser-like steps (50–200 %), an on-screen indicator with Reset, smooth Ctrl+wheel and touchpad pinch, and the saved zoom is applied before the window appears.
- Faster: modules load in parallel at startup, undo on long pages redraws only changed blocks (≈8× faster on 3000 blocks), backlinks are computed after the page is shown, notes are read from disk in parallel, and the sidebar no longer rebuilds every minute.
- Fix: a background save that finished after the final save on quit could overwrite the newest changes.
- Fix: a failed restore from backup no longer leaves the app unable to save; the restore now copies the backup next to your notes first and only then swaps them in.
- Fix: the main process no longer keeps a copy of every saved page in memory.
- Security: blocks pasted in Liser’s own clipboard format are cleaned before use (only simple formatting and safe links survive).
- Fix: broken characters in the app description and copyright shown by Windows.
- README is now in English by default, with Hebrew (`README.he.md`) and Russian (`README.ru.md`) versions.
- `npm run dist:beta` builds “Liser Beta”, a separate app with its own data folder for trying new versions safely.

## 1.2.0

- Links between pages: select text and press “Page” on the toolbar (`Ctrl+Shift+K`), or type `[[`. Missing pages are created as subpages.
- Hovering a page link shows a preview card.
- Backlinks at the bottom of each page, plus unlinked mentions with a one-click “Link” button.
- Graph view (`Ctrl+G`): force-directed map of all pages and links, with zoom, pan, dragging, search, hierarchy and label toggles, and a per-page local graph.
- Markdown: links export as `[[Title]]`, and pasted `[[Title]]` turns into a link when the page exists.
- Installer: detects an existing installation and shows an update screen (old → new version) with an “Update” button; updates go to the same folder and skip the license and folder steps. Also handles reinstalling the same version and installing an older one.
- Installer artwork, localized welcome and finish pages; the app shows “Updated to version X” on first launch after an update.

## 1.1.0

- Interface in Russian, English and Hebrew; full right-to-left layout for Hebrew, per-paragraph text direction.
- Settings redesigned: sections for appearance, language & region, editor, notifications, data, shortcuts, about.
- Accent colors, first day of the week, default font and width for new pages, notification sound.
- Toggle lists, block text and background colors, page covers, custom callout icons.
- Repeating reminders and snooze.
- Find in page (`Ctrl+F`), export to PDF, export all pages to Markdown.
- Daily automatic backups, manual backup and restore.
- Narrow-window layout with an overlay sidebar.
- Fixes: duplicate notifications, nested blocks move and delete together, listener leaks on page switch.

## 1.0.0

- First release: block editor, to-dos, reminders, drawing, images, search, light and dark themes, Windows installer.
