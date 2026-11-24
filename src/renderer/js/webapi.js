// Запасной API для запуска интерфейса в обычном браузере (npm run web): данные лежат в localStorage.
const K = 'liser:';
const get = (k) => { try { return JSON.parse(localStorage.getItem(K + k)); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch {} };
const listeners = {};
const assets = get('assets') || {};
const navLang = (navigator.language || 'en').slice(0, 2);

function hash(bytes) {
  let a = 2166136261;
  for (let i = 0; i < bytes.length; i += 1 + (bytes.length >> 14)) a = Math.imul(a ^ bytes[i], 16777619);
  return (a >>> 0).toString(36) + bytes.length.toString(36);
}

async function storeAsset(bytes, ext) {
  const name = `${hash(bytes)}.${ext || 'png'}`;
  const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext || 'png'}`;
  assets[name] = await new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(new Blob([bytes], { type: mime }));
  });
  set('assets', assets);
  return name;
}

function download(name, content, type = 'text/markdown') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const webApi = {
  isDesktop: false,
  async load() {
    return {
      index: get('index'), settings: get('settings') || {}, dataDir: 'localStorage', version: 'web', packaged: false,
      systemLang: navLang === 'iw' ? 'he' : navLang,
    };
  },
  async saveIndex(index) { set('index', index); },
  async loadPage(id) { return get('page:' + id); },
  async savePage(id, data) { set('page:' + id, data); },
  async deletePage(id) { localStorage.removeItem(K + 'page:' + id); },
  async allPages() {
    const index = get('index') || { pages: {} };
    return Object.keys(index.pages).map((id) => ({ id, blocks: get('page:' + id)?.blocks || [] }));
  },
  saveSync(data) {
    for (const p of data.pages || []) set('page:' + p.id, p.data);
    if (data.index) set('index', data.index);
  },
  saveAsset: (bytes, ext) => storeAsset(bytes, ext),
  pickImages(multi = true) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*'; input.multiple = multi;
      input.onchange = async () => {
        const names = [];
        for (const f of input.files) names.push(await storeAsset(new Uint8Array(await f.arrayBuffer()), f.type.split('/')[1]));
        resolve(names);
      };
      input.oncancel = () => resolve([]);
      input.click();
    });
  },
  assetUrl: (name) => assets[name] || '',
  async setSettings(patch) { set('settings', { ...(get('settings') || {}), ...patch }); },
  async setTheme() {},
  setZoom(f) { document.documentElement.style.zoom = f; },
  async saveFile({ name, content }) { download(name, content); return true; },
  async exportPdf() { window.print(); return false; },
  async exportAll({ files }) {
    download('liser-export.md', files.map((f) => `<!-- ${f.path} -->\n${f.content}`).join('\n\n'));
    return true;
  },
  async backup() { return false; },
  async pickBackup() { return null; },
  async restore() {},
  async openExternal(url) { if (/^(https?:|mailto:)/i.test(url)) window.open(url, '_blank', 'noopener'); },
  async openDataDir() {},
  on(channel, fn) { (listeners[channel] ||= []).push(fn); },
};

// Имитация планировщика напоминаний главного процесса
setInterval(() => {
  const index = get('index');
  const due = (index?.reminders || []).filter((r) => !r.fired && !r.done && r.at <= Date.now()).map((r) => r.id);
  if (due.length) (listeners.reminder || []).forEach((fn) => fn(due));
}, 5000);
