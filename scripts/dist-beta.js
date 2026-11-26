// Бета-сборка: npm run dist:beta [-- номер], например npm run dist:beta -- 2 → 1.3.0-beta.2
// Ставится рядом с обычным Liser как отдельное приложение «Liser Beta»: своё имя, ID и папка данных
// (%APPDATA%\Liser Beta), поэтому основные заметки не затрагивает. Установщик кладётся в папку beta/.
const path = require('path');
const { build } = require('electron-builder');
const pkg = require('../package.json');

const n = Number(process.argv[2]) || 1;
const version = `${pkg.version}-beta.${n}`;
const name = 'Liser Beta';

build({
  win: ['nsis:x64'],
  publish: 'never',
  projectDir: path.join(__dirname, '..'),
  config: {
    ...pkg.build,
    appId: 'com.liser.beta',
    productName: name,
    extraMetadata: { name: 'liser-beta', productName: name, version },
    directories: { ...pkg.build.directories, output: 'beta' },
    win: { ...pkg.build.win, artifactName: 'Liser-Beta-Setup-${version}.${ext}' },
    nsis: { ...pkg.build.nsis, shortcutName: name, uninstallDisplayName: name },
  },
}).then((files) => {
  console.log(`\nLiser Beta ${version}:`);
  for (const f of files) if (f.endsWith('.exe')) console.log('  ' + path.relative(process.cwd(), f));
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
