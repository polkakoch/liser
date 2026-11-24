// Быстрая проверка проекта: синтаксис всех JS-файлов и полнота переводов. Запуск: npm run check
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
let failed = false;
const fail = (msg) => { failed = true; console.error('✗ ' + msg); };

function files(dir, ext, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

const sources = [...files(path.join(root, 'src'), '.js'), ...files(path.join(root, 'scripts'), '.js')];
for (const f of sources) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { fail(`${path.relative(root, f)}: ${e.stderr}`); }
}
console.log(`✓ syntax: ${sources.length} files`);

(async () => {
  const { DICTIONARIES } = await import(pathToFileURL(path.join(root, 'src/renderer/js/i18n.js')));
  const langs = Object.keys(DICTIONARIES);
  const all = new Set(langs.flatMap((l) => Object.keys(DICTIONARIES[l])));
  for (const l of langs) for (const k of all) if (!(k in DICTIONARIES[l])) fail(`i18n: "${k}" is missing in ${l}`);

  // Ключи, которые встречаются в коде как t('…') / tn('…')
  const used = new Set();
  for (const f of files(path.join(root, 'src/renderer/js'), '.js')) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/\btn?\('([a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
  }
  for (const k of used) if (!k.endsWith('.') && !all.has(k)) fail(`i18n: "${k}" is used in code but not translated`);
  console.log(`✓ i18n: ${all.size} keys × ${langs.length} languages, ${used.size} literal keys used`);
  if (failed) process.exit(1);
})();
