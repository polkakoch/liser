'use strict';
const {
  app, BrowserWindow, ipcMain, protocol, Notification, Tray, Menu, shell, dialog, nativeTheme, screen,
} = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');

const APP_ID = 'com.liser.notes';
const RENDERER = path.join(__dirname, 'renderer');
const ICON = path.join(__dirname, '..', 'assets', 'icon.png');
const TRAY_ICON = path.join(__dirname, '..', 'assets', 'tray.png');
const START_HIDDEN = process.argv.includes('--hidden');
// Хуки самопроверки (скриншот и выполнение кода в окне) работают только при запуске из исходников
const SELFTEST = !app.isPackaged && process.env.LISER_SHOT ? { shot: process.env.LISER_SHOT, eval: process.env.LISER_EVAL } : null;
const DATA_OVERRIDE = !app.isPackaged ? process.env.LISER_DATA : null;

const MIME = {
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8',
  json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', avif: 'image/avif', ico: 'image/x-icon',
};
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'svg'];
const ID_RE = /^[a-z0-9]{6,32}$/;
const KEEP_AUTO_BACKUPS = 7;

/* ───────────── Тексты главного процесса ───────────── */

const TEXT = {
  ru: {
    open: 'Открыть Liser', newPage: 'Новая заметка', quit: 'Выход', untitled: 'Без названия', reminder: 'Напоминание',
    cut: 'Вырезать', copy: 'Копировать', paste: 'Вставить', selectAll: 'Выделить всё', copyImage: 'Копировать картинку',
    pickImages: 'Выберите картинки', images: 'Картинки', exportFolder: 'Куда сохранить экспорт', backupFolder: 'Куда сохранить резервную копию',
    restoreFolder: 'Выберите папку с резервной копией', exportName: 'Liser экспорт', backupName: 'Liser копия',
    bgTitle: 'Liser работает в фоне', bgText: 'Напоминания продолжат приходить. Выйти можно через значок в трее.',
  },
  en: {
    open: 'Open Liser', newPage: 'New note', quit: 'Quit', untitled: 'Untitled', reminder: 'Reminder',
    cut: 'Cut', copy: 'Copy', paste: 'Paste', selectAll: 'Select all', copyImage: 'Copy image',
    pickImages: 'Choose images', images: 'Images', exportFolder: 'Where to save the export', backupFolder: 'Where to save the backup',
    restoreFolder: 'Choose a backup folder', exportName: 'Liser export', backupName: 'Liser backup',
    bgTitle: 'Liser is running in the background', bgText: 'Reminders will keep coming. Quit from the tray icon.',
  },
  he: {
    open: 'פתיחת Liser', newPage: 'פתק חדש', quit: 'יציאה', untitled: 'ללא כותרת', reminder: 'תזכורת',
    cut: 'גזירה', copy: 'העתקה', paste: 'הדבקה', selectAll: 'בחירת הכול', copyImage: 'העתקת התמונה',
    pickImages: 'בחירת תמונות', images: 'תמונות', exportFolder: 'היכן לשמור את הייצוא', backupFolder: 'היכן לשמור את הגיבוי',
    restoreFolder: 'בחירת תיקיית גיבוי', exportName: 'Liser ייצוא', backupName: 'Liser גיבוי',
    bgTitle: 'Liser פועל ברקע', bgText: 'התזכורות ימשיכו להגיע. אפשר לצאת דרך הסמל במגש.',
  },
};

let systemLang = 'en';
const lang = () => (TEXT[settings.lang] ? settings.lang : systemLang);
const tr = (key) => TEXT[lang()][key] || TEXT.en[key];

function detectSystemLang() {
  const list = [...(app.getPreferredSystemLanguages?.() || []), app.getLocale()];
  for (const l of list) {
    const code = String(l).toLowerCase();
    if (code.startsWith('ru')) return 'ru';
    if (code.startsWith('he') || code.startsWith('iw')) return 'he';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'liser', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

let DATA, PAGES, ASSETS, BACKUPS, INDEX_FILE, SETTINGS_FILE;
let win = null;
let tray = null;
let quitting = false;
let rendererReady = false;
let index = null;
let settings = {
  theme: 'system', zoom: 1, lang: 'system', sidebarWidth: 260, sidebarCollapsed: false, sound: true,
  closeToTray: true, autostart: false, autoBackup: true, lastRoute: null, bounds: null, maximized: false,
};

/* ───────────── Хранилище: атомарная запись с очередью на файл ───────────── */

const latest = new Map();
const chains = new Map();
let pendingWrites = 0;

async function renameRetry(tmp, file) {
  for (let i = 0; ; i++) {
    try { return await fsp.rename(tmp, file); } catch (err) {
      if (i >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err;
      await new Promise((r) => setTimeout(r, 40 * (i + 1)));
    }
  }
}

function writeAtomic(file, text) {
  latest.set(file, text);
  if (chains.has(file) && chains.get(file).queued) return chains.get(file).promise;
  const prev = chains.get(file)?.promise || Promise.resolve();
  const entry = { queued: true };
  pendingWrites++;
  entry.promise = prev.catch(() => {}).then(async () => {
    entry.queued = false;
    const data = latest.get(file);
    if (data == null) return;
    const tmp = file + '.tmp';
    await fsp.writeFile(tmp, data);
    await renameRetry(tmp, file);
  }).catch((err) => console.error('write failed', file, err)).finally(() => {
    pendingWrites--;
    if (chains.get(file) === entry) chains.delete(file);
  });
  chains.set(file, entry);
  return entry.promise;
}

function writeSync(file, text) {
  latest.set(file, text);
  const tmp = file + '.stmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

const drainWrites = () => Promise.allSettled([...chains.values()].map((c) => c.promise));

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function initStorage() {
  DATA = DATA_OVERRIDE || path.join(app.getPath('userData'), 'data');
  PAGES = path.join(DATA, 'pages');
  ASSETS = path.join(DATA, 'assets');
  BACKUPS = path.join(DATA, 'backups');
  INDEX_FILE = path.join(DATA, 'index.json');
  SETTINGS_FILE = path.join(DATA, 'settings.json');
  fs.mkdirSync(PAGES, { recursive: true });
  fs.mkdirSync(ASSETS, { recursive: true });

  Object.assign(settings, readJson(SETTINGS_FILE) || {});
  index = readJson(INDEX_FILE);
  const bak = INDEX_FILE + '.bak';
  if (index) {
    try { fs.copyFileSync(INDEX_FILE, bak); } catch {}
  } else if (fs.existsSync(bak)) {
    index = readJson(bak); // основной файл повреждён — берём резервную копию
  }
}

const pageFile = (id) => path.join(PAGES, id + '.json');
const saveSettings = () => writeAtomic(SETTINGS_FILE, JSON.stringify(settings));
const stamp = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}`;
};

/* ───────────── Резервные копии ───────────── */

async function snapshot(name) {
  await drainWrites();
  const dir = path.join(BACKUPS, name);
  await fsp.mkdir(dir, { recursive: true });
  if (fs.existsSync(INDEX_FILE)) await fsp.copyFile(INDEX_FILE, path.join(dir, 'index.json'));
  await fsp.cp(PAGES, path.join(dir, 'pages'), { recursive: true, filter: (src) => !src.endsWith('.tmp') && !src.endsWith('.stmp') });
  return dir;
}

async function autoBackup() {
  if (!settings.autoBackup || !index) return;
  try {
    const name = 'auto-' + stamp().slice(0, 10);
    if (fs.existsSync(path.join(BACKUPS, name))) return;
    await snapshot(name);
    const autos = (await fsp.readdir(BACKUPS)).filter((n) => n.startsWith('auto-')).sort();
    for (const old of autos.slice(0, -KEEP_AUTO_BACKUPS)) await fsp.rm(path.join(BACKUPS, old), { recursive: true, force: true });
  } catch (err) { console.error('auto backup failed', err); }
}

function isBackupDir(dir) {
  const idx = readJson(path.join(dir, 'index.json'));
  return !!(idx && idx.pages && Array.isArray(idx.root) && fs.existsSync(path.join(dir, 'pages')));
}

/* ───────────── Окно ───────────── */

function isDark() {
  return settings.theme === 'dark' || (settings.theme !== 'light' && nativeTheme.shouldUseDarkColors);
}

function overlay(dark, zoom = settings.zoom || 1) {
  return {
    color: dark ? '#191919' : '#ffffff',
    symbolColor: dark ? '#d4d4d4' : '#37352f',
    height: Math.round(44 * zoom),
  };
}

function validBounds(b) {
  if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return false;
  return screen.getAllDisplays().some(({ workArea: a }) =>
    b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y >= a.y - 10 && b.y < a.y + a.height - 80);
}

function createWindow() {
  const b = settings.bounds;
  const dark = isDark();
  win = new BrowserWindow({
    width: b?.width || 1180,
    height: b?.height || 780,
    ...(validBounds(b) ? { x: b.x, y: b.y } : {}),
    minWidth: 400,
    minHeight: 340,
    show: false,
    title: 'Liser',
    backgroundColor: dark ? '#191919' : '#ffffff',
    titleBarStyle: 'hidden',
    titleBarOverlay: overlay(dark),
    icon: ICON,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      v8CacheOptions: 'bypassHeatCheck',
    },
  });

  win.once('ready-to-show', () => {
    if (SELFTEST) return;
    if (START_HIDDEN && settings.closeToTray && tray) return;
    if (settings.maximized) win.maximize();
    win.show();
  });

  let boundsTimer = null;
  const rememberBounds = () => {
    clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (!win || win.isDestroyed()) return;
      settings.maximized = win.isMaximized();
      if (!win.isMaximized() && !win.isMinimized()) settings.bounds = win.getBounds();
      saveSettings();
    }, 400);
  };
  win.on('resize', rememberBounds);
  win.on('move', rememberBounds);

  win.on('close', (e) => {
    if (!quitting && settings.closeToTray && tray) {
      e.preventDefault();
      win.webContents.send('flush');
      win.hide();
      if (!settings.trayHintShown) {
        settings.trayHintShown = true;
        saveSettings();
        try { tray.displayBalloon({ title: tr('bgTitle'), content: tr('bgText'), iconType: 'info' }); } catch {}
      }
    }
  });
  win.on('closed', () => { win = null; });

  const wc = win.webContents;
  wc.on('will-navigate', (e) => e.preventDefault());
  wc.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  wc.on('context-menu', (_e, p) => {
    const items = [];
    if (p.isEditable) {
      items.push({ label: tr('cut'), role: 'cut', enabled: p.editFlags.canCut });
      items.push({ label: tr('copy'), role: 'copy', enabled: p.editFlags.canCopy });
      items.push({ label: tr('paste'), role: 'paste', enabled: p.editFlags.canPaste });
      items.push({ type: 'separator' }, { label: tr('selectAll'), role: 'selectAll' });
    } else if (p.mediaType === 'image') {
      items.push({ label: tr('copyImage'), click: () => wc.copyImageAt(p.x, p.y) });
    } else if (p.selectionText) {
      items.push({ label: tr('copy'), role: 'copy' });
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });

  win.loadURL('liser://app/index.html');

  if (SELFTEST) {
    wc.once('did-finish-load', () => setTimeout(async () => {
      if (SELFTEST.eval) {
        try { fs.writeFileSync(SELFTEST.shot + '.json', JSON.stringify(await wc.executeJavaScript(SELFTEST.eval))); } catch (err) { fs.writeFileSync(SELFTEST.shot + '.json', String(err)); }
      }
      for (let i = 0; i < 4; i++) {
        try { fs.writeFileSync(SELFTEST.shot, (await wc.capturePage()).toPNG()); break; } catch { await new Promise((r) => setTimeout(r, 800)); }
      }
      quitting = true;
      app.quit();
    }, 2500));
    win.show();
  }
}

function showWindow() {
  if (!win) return createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function openExternal(url) {
  if (/^(https?:|mailto:)/i.test(url)) shell.openExternal(url);
}

function buildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: tr('open'), click: showWindow },
    { label: tr('newPage'), click: () => { showWindow(); win.webContents.send('new-page'); } },
    { type: 'separator' },
    { label: tr('quit'), click: () => { quitting = true; app.quit(); } },
  ]));
}

function createTray() {
  try { tray = new Tray(TRAY_ICON); } catch { tray = null; return; }
  tray.setToolTip('Liser');
  tray.on('click', showWindow);
  buildTrayMenu();
}

/* ───────────── Напоминания ───────────── */

const liveNotifications = new Set();
const firedKeys = new Set(); // защита от повторов, пока окно ещё не записало отметку

function fireNotification(r) {
  if (!Notification.isSupported()) return;
  const page = index?.pages?.[r.pageId];
  const time = new Date(r.at).toLocaleTimeString(lang() === 'he' ? 'he-IL' : lang() === 'ru' ? 'ru-RU' : 'en-US', { hour: 'numeric', minute: '2-digit' });
  const n = new Notification({
    title: r.text || tr('reminder'),
    body: `${page?.title || tr('untitled')} · ${time}`,
    icon: ICON,
    silent: settings.sound === false,
  });
  liveNotifications.add(n);
  n.on('click', () => {
    showWindow();
    win.webContents.send('navigate', { pageId: r.pageId, blockId: r.id });
  });
  n.on('close', () => liveNotifications.delete(n));
  n.show();
}

function reminderTick() {
  if (!index || !rendererReady || !win) return;
  const now = Date.now();
  const due = [];
  for (const r of index.reminders || []) {
    const key = r.id + ':' + r.at;
    if (!r.fired && !r.done && r.at <= now && !firedKeys.has(key) && index.pages?.[r.pageId] && !index.pages[r.pageId].trashed) {
      firedKeys.add(key);
      due.push(r);
    }
  }
  if (!due.length) return;
  due.slice(0, 4).forEach(fireNotification);
  if (!win.isFocused()) win.flashFrame(true);
  win.webContents.send('reminder', due.map((r) => r.id));
}

/* ───────────── Экспорт ───────────── */

function safeRel(rel) {
  const parts = String(rel).split('/').map((s) => s.replace(/[\\:*?"<>|\u0000-\u001f]/g, ' ').trim()).filter((s) => s && s !== '.' && s !== '..');
  return parts.length ? path.join(...parts) : null;
}

async function pickFolder(title) {
  const res = await dialog.showOpenDialog(win, { title, properties: ['openDirectory', 'createDirectory'] });
  return res.canceled || !res.filePaths[0] ? null : res.filePaths[0];
}

async function uniqueDir(parent, name) {
  let dir = path.join(parent, name);
  for (let k = 2; fs.existsSync(dir); k++) dir = path.join(parent, `${name} (${k})`);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

/* ───────────── IPC ───────────── */

function savePageData(id, data, sync) {
  if (!ID_RE.test(id)) return;
  const text = JSON.stringify(data);
  return sync ? writeSync(pageFile(id), text) : writeAtomic(pageFile(id), text);
}

async function saveAssetBuffer(buf, ext) {
  ext = String(ext || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!IMAGE_EXT.includes(ext)) ext = 'png';
  const name = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 20) + '.' + ext;
  const file = path.join(ASSETS, name);
  if (!fs.existsSync(file)) await fsp.writeFile(file, buf);
  return name;
}

function registerIpc() {
  ipcMain.handle('data:load', () => {
    rendererReady = true;
    return { index, settings, dataDir: DATA, version: app.getVersion(), packaged: app.isPackaged, systemLang };
  });

  ipcMain.handle('index:save', (_e, data) => {
    index = data;
    return writeAtomic(INDEX_FILE, JSON.stringify(data));
  });

  ipcMain.handle('page:load', async (_e, id) => {
    if (!ID_RE.test(id)) return null;
    const file = pageFile(id);
    if (latest.has(file)) return JSON.parse(latest.get(file));
    try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch { return null; }
  });

  ipcMain.handle('page:save', (_e, id, data) => savePageData(id, data, false));

  ipcMain.handle('page:delete', async (_e, id) => {
    if (!ID_RE.test(id)) return;
    await chains.get(pageFile(id))?.promise;
    latest.delete(pageFile(id));
    await fsp.rm(pageFile(id), { force: true });
  });

  // Лёгкая выжимка всех страниц для поиска и списка задач
  ipcMain.handle('pages:all', async () => {
    const out = [];
    for (const id of Object.keys(index?.pages || {})) {
      if (!ID_RE.test(id)) continue;
      try {
        const file = pageFile(id);
        const page = latest.has(file) ? JSON.parse(latest.get(file)) : JSON.parse(await fsp.readFile(file, 'utf8'));
        out.push({
          id,
          blocks: (page.blocks || []).map((b) => ({
            id: b.id, type: b.type, html: b.html, checked: b.checked, remind: b.remind, caption: b.caption,
          })),
        });
      } catch {}
    }
    return out;
  });

  ipcMain.on('sync:save', (e, data) => {
    try {
      for (const p of data.pages || []) savePageData(p.id, p.data, true);
      if (data.index) { index = data.index; writeSync(INDEX_FILE, JSON.stringify(index)); }
    } catch (err) { console.error(err); }
    e.returnValue = true;
  });

  ipcMain.handle('asset:save', (_e, bytes, ext) => saveAssetBuffer(Buffer.from(bytes), ext));

  ipcMain.handle('asset:pick', async (_e, multi) => {
    const res = await dialog.showOpenDialog(win, {
      title: tr('pickImages'),
      properties: multi ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: [{ name: tr('images'), extensions: IMAGE_EXT }],
    });
    if (res.canceled) return [];
    const names = [];
    for (const f of res.filePaths) {
      try { names.push(await saveAssetBuffer(await fsp.readFile(f), path.extname(f).slice(1))); } catch {}
    }
    return names;
  });

  ipcMain.handle('settings:set', (_e, patch) => {
    const langChanged = 'lang' in patch && patch.lang !== settings.lang;
    Object.assign(settings, patch);
    if ('autostart' in patch && app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: !!settings.autostart, args: ['--hidden'] });
    }
    if (langChanged) buildTrayMenu();
    if (patch.autoBackup) autoBackup();
    return saveSettings();
  });

  ipcMain.handle('win:theme', (_e, { dark, zoom }) => {
    if (!win) return;
    nativeTheme.themeSource = settings.theme === 'system' ? 'system' : settings.theme;
    win.setBackgroundColor(dark ? '#191919' : '#ffffff');
    try { win.setTitleBarOverlay(overlay(dark, zoom)); } catch {}
  });

  ipcMain.handle('file:save', async (_e, { name, content }) => {
    const res = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), path.basename(name)),
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (res.canceled || !res.filePath) return false;
    await fsp.writeFile(res.filePath, content, 'utf8');
    return true;
  });

  ipcMain.handle('file:pdf', async (_e, name) => {
    const res = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), path.basename(name)),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (res.canceled || !res.filePath) return false;
    const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 } });
    await fsp.writeFile(res.filePath, pdf);
    return true;
  });

  ipcMain.handle('export:all', async (_e, { files, assets }) => {
    const parent = await pickFolder(tr('exportFolder'));
    if (!parent) return false;
    const root = await uniqueDir(parent, `${tr('exportName')} ${stamp()}`);
    for (const f of files || []) {
      const rel = safeRel(f.path);
      if (!rel) continue;
      const target = path.join(root, rel);
      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.writeFile(target, String(f.content), 'utf8');
    }
    if (assets?.length) {
      await fsp.mkdir(path.join(root, 'assets'), { recursive: true });
      for (const a of assets) {
        const name = path.basename(String(a));
        try { await fsp.copyFile(path.join(ASSETS, name), path.join(root, 'assets', name)); } catch {}
      }
    }
    shell.openPath(root);
    return true;
  });

  ipcMain.handle('backup:create', async () => {
    const parent = await pickFolder(tr('backupFolder'));
    if (!parent || path.resolve(parent).toLowerCase().startsWith(path.resolve(DATA).toLowerCase())) return false;
    await drainWrites();
    const root = await uniqueDir(parent, `${tr('backupName')} ${stamp()}`);
    await fsp.cp(DATA, root, {
      recursive: true,
      filter: (src) => !src.startsWith(BACKUPS) && !src.endsWith('.tmp') && !src.endsWith('.stmp'),
    });
    shell.openPath(root);
    return true;
  });

  ipcMain.handle('backup:pick', async () => {
    const res = await dialog.showOpenDialog(win, {
      title: tr('restoreFolder'),
      defaultPath: fs.existsSync(BACKUPS) ? BACKUPS : undefined,
      properties: ['openDirectory'],
    });
    if (res.canceled || !res.filePaths[0]) return null;
    const dir = res.filePaths[0];
    return isBackupDir(dir) ? { path: dir } : { error: 'bad' };
  });

  ipcMain.handle('backup:restore', async (_e, dir) => {
    if (!dir || !isBackupDir(dir) || path.resolve(dir) === path.resolve(DATA)) return false;
    await drainWrites();
    await snapshot('before-restore ' + stamp());
    // Копия может лежать внутри папки данных — сначала забираем её во временную папку
    const tmp = path.join(app.getPath('temp'), 'liser-restore-' + Date.now());
    await fsp.cp(dir, tmp, { recursive: true });
    latest.clear();
    await fsp.rm(PAGES, { recursive: true, force: true });
    await fsp.cp(path.join(tmp, 'pages'), PAGES, { recursive: true });
    await fsp.copyFile(path.join(tmp, 'index.json'), INDEX_FILE);
    if (fs.existsSync(path.join(tmp, 'assets'))) await fsp.cp(path.join(tmp, 'assets'), ASSETS, { recursive: true, force: false });
    await fsp.rm(tmp, { recursive: true, force: true });
    index = readJson(INDEX_FILE);
    firedKeys.clear();
    win?.webContents.reload();
    return true;
  });

  ipcMain.handle('open:external', (_e, url) => openExternal(String(url)));
  ipcMain.handle('open:datadir', () => shell.openPath(DATA));
}

/* ───────────── Запуск ───────────── */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setAppUserModelId(app.isPackaged ? APP_ID : process.execPath);
  if (SELFTEST) app.disableHardwareAcceleration();
  app.on('second-instance', showWindow);

  app.whenReady().then(() => {
    initStorage();
    systemLang = detectSystemLang();
    Menu.setApplicationMenu(null);

    protocol.handle('liser', async (req) => {
      try {
        const u = new URL(req.url);
        const rel = decodeURIComponent(u.pathname);
        let file;
        const headers = {};
        if (u.host === 'asset') {
          file = path.join(ASSETS, path.basename(rel));
          headers['cache-control'] = 'max-age=31536000, immutable';
        } else if (u.host === 'app') {
          file = path.normalize(path.join(RENDERER, rel === '/' ? 'index.html' : rel));
          if (!file.startsWith(RENDERER)) return new Response('Forbidden', { status: 403 });
        } else {
          return new Response('Not found', { status: 404 });
        }
        const buf = await fsp.readFile(file);
        headers['content-type'] = MIME[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream';
        return new Response(buf, { headers });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    });

    registerIpc();
    if (!SELFTEST) createTray();
    createWindow();
    setInterval(reminderTick, 15000);
    setTimeout(reminderTick, 4000);
    setTimeout(autoBackup, 20000);
    setInterval(autoBackup, 3 * 3600 * 1000);
  });

  app.on('window-all-closed', () => { quitting = true; app.quit(); });

  let drained = false;
  app.on('before-quit', (e) => {
    quitting = true;
    if (drained || pendingWrites === 0) return;
    e.preventDefault();
    drainWrites().then(() => { drained = true; app.quit(); });
  });
}
