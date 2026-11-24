# Changelog

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
