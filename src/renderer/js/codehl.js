// Подсветка синтаксиса в блоках кода и определение языка.
// Свой небольшой разборщик на регулярных выражениях; раскраска — через CSS Custom Highlight API:
// разметка блока не меняется, поэтому каретка и отмена работают как в обычном тексте, а вставка больших кусков не тормозит.

const set = (s) => new Set(s.split(/\s+/).filter(Boolean));

const JS_KW = 'break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static switch throw try typeof var void while with yield async await get set';
const JS_TYPES = 'Array Object String Number Boolean Promise Map Set WeakMap Date RegExp Error JSON Math Symbol BigInt console window document globalThis process require module exports';
const C_KW = 'auto break case const continue default do else enum extern for goto if inline register return sizeof static struct switch typedef union volatile while';
const C_TYPES = 'void char short int long float double signed unsigned bool size_t uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t FILE';

export const LANGS = {
  javascript: {
    name: 'JavaScript', alias: 'js jsx mjs cjs node', line: '//', block: ['/*', '*/'], quotes: '"\'`', regexLit: true,
    kw: JS_KW, lit: 'true false null undefined NaN Infinity this super', types: JS_TYPES,
  },
  typescript: {
    name: 'TypeScript', alias: 'ts tsx', line: '//', block: ['/*', '*/'], quotes: '"\'`', decorators: true,
    kw: JS_KW + ' interface type enum implements declare readonly namespace abstract public private protected keyof infer is as satisfies',
    lit: 'true false null undefined NaN Infinity this super', types: JS_TYPES + ' string number boolean any unknown never object Record Partial Readonly',
  },
  python: {
    name: 'Python', alias: 'py python3 py3', line: '#', quotes: '"\'', triple: true, decorators: true,
    kw: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case',
    lit: 'True False None self cls', types: 'int float str list dict set tuple bool bytes object type Exception ValueError TypeError KeyError print len range enumerate zip map filter open super isinstance',
  },
  html: { name: 'HTML', alias: 'htm xhtml vue svelte', markup: true },
  xml: { name: 'XML', alias: 'svg xaml xsd plist csproj', markup: true },
  css: { name: 'CSS', alias: 'scss sass less', css: true },
  json: { name: 'JSON', alias: 'json5 jsonc', json: true, line: '//', block: ['/*', '*/'], quotes: '"', lit: 'true false null' },
  sql: {
    name: 'SQL', alias: 'mysql postgres postgresql sqlite tsql plsql', line: '--', block: ['/*', '*/'], quotes: '\'"', ci: true,
    kw: 'select from where and or not insert into values update set delete create table drop alter add column index view join inner left right full outer on as group by order having limit offset distinct union all case when then else end primary key foreign references default unique check exists in like between is with returning begin commit rollback transaction grant revoke if replace',
    lit: 'null true false', types: 'int integer bigint smallint varchar char text date datetime timestamp boolean decimal numeric float real serial uuid json jsonb blob count sum avg min max coalesce now',
  },
  bash: {
    name: 'Bash', alias: 'sh shell zsh console terminal', line: '#', quotes: '"\'', vars: true,
    kw: 'if then else elif fi for while until do done case esac in function return local export source alias unset readonly shift exit break continue',
    lit: 'true false', types: 'echo cd ls cat grep sed awk find sudo apt npm npx node git curl wget mkdir rm cp mv chmod chown pwd touch tar ssh docker python pip',
  },
  powershell: {
    name: 'PowerShell', alias: 'ps1 ps pwsh posh', line: '#', block: ['<#', '#>'], quotes: '"\'', vars: true, ci: true, dashWords: true,
    kw: 'if else elseif switch foreach for while do until break continue return function param begin process end try catch finally throw trap filter in',
    lit: '$true $false $null', types: '',
  },
  c: { name: 'C', alias: 'h', line: '//', block: ['/*', '*/'], quotes: '"\'', pre: true, kw: C_KW, lit: 'NULL true false', types: C_TYPES + ' printf scanf malloc free' },
  cpp: {
    name: 'C++', alias: 'c++ cc cxx hpp hh', line: '//', block: ['/*', '*/'], quotes: '"\'', pre: true, caps: true,
    kw: C_KW + ' class namespace template typename public private protected virtual override final new delete using operator friend this throw try catch constexpr noexcept nullptr auto mutable explicit',
    lit: 'true false nullptr NULL this', types: C_TYPES + ' std string vector map set unique_ptr shared_ptr cout cin endl',
  },
  csharp: {
    name: 'C#', alias: 'cs c# dotnet', line: '//', block: ['/*', '*/'], quotes: '"\'', pre: true, caps: true, decorators: false,
    kw: 'abstract as async await base break case catch checked class const continue default delegate do else enum event explicit extern finally fixed for foreach get goto if implicit in interface internal is lock namespace new operator out override params private protected public readonly ref return sealed set sizeof static struct switch this throw try typeof unchecked unsafe using var virtual void volatile while yield record init',
    lit: 'true false null this', types: 'int long short byte bool char string object double float decimal dynamic List Dictionary Task Console Math',
  },
  java: {
    name: 'Java', alias: 'jav', line: '//', block: ['/*', '*/'], quotes: '"\'', caps: true, decorators: true,
    kw: 'abstract assert break case catch class continue default do else enum extends final finally for if implements import instanceof interface native new package private protected public return static super switch synchronized this throw throws transient try void volatile while var record',
    lit: 'true false null this', types: 'int long short byte boolean char double float String Object Integer List Map ArrayList HashMap System',
  },
  kotlin: {
    name: 'Kotlin', alias: 'kt kts', line: '//', block: ['/*', '*/'], quotes: '"\'', caps: true, decorators: true,
    kw: 'fun val var class object interface if else when for while do return break continue package import is as in out by companion data sealed open override private public internal protected lateinit suspend try catch finally throw',
    lit: 'true false null this', types: 'Int Long Double Float String Boolean Unit Any List Map println',
  },
  swift: {
    name: 'Swift', alias: '', line: '//', block: ['/*', '*/'], quotes: '"', caps: true, decorators: true,
    kw: 'func let var class struct enum protocol extension if else guard switch case default for in while repeat return break continue import init deinit self throws throw try catch do async await public private internal fileprivate static override mutating',
    lit: 'true false nil self', types: 'Int Double Float String Bool Array Dictionary print',
  },
  go: {
    name: 'Go', alias: 'golang', line: '//', block: ['/*', '*/'], quotes: '"\'`',
    kw: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var',
    lit: 'true false nil iota', types: 'int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float32 float64 string bool byte rune error any make new len cap append fmt',
  },
  rust: {
    name: 'Rust', alias: 'rs', line: '//', block: ['/*', '*/'], quotes: '"', caps: true,
    kw: 'as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return static struct super trait type unsafe use where while',
    lit: 'true false self Self None Some Ok Err', types: 'i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str String Vec Option Result Box',
  },
  php: {
    name: 'PHP', alias: '', line: '//', block: ['/*', '*/'], quotes: '"\'', vars: true, ci: true,
    kw: 'abstract and as break case catch class const continue declare default do echo else elseif extends final finally fn for foreach function global if implements include interface namespace new or private protected public require return static switch throw trait try use var while yield match',
    lit: 'true false null', types: 'array string int float bool mixed void',
  },
  ruby: {
    name: 'Ruby', alias: 'rb', line: '#', quotes: '"\'', vars: true,
    kw: 'alias and begin break case class def defined do else elsif end ensure for if in module next not or redo rescue retry return self super then unless until when while yield require attr_accessor',
    lit: 'true false nil self', types: 'puts print p',
  },
  yaml: { name: 'YAML', alias: 'yml', yaml: true, line: '#', quotes: '"\'', lit: 'true false null yes no on off ~' },
  markdown: { name: 'Markdown', alias: 'md', md: true },
};

// Ключ языка по названию или расширению из ```lang
const ALIAS = new Map();
for (const [key, L] of Object.entries(LANGS)) {
  ALIAS.set(key, key);
  ALIAS.set(L.name.toLowerCase(), key);
  for (const a of (L.alias || '').split(' ')) if (a) ALIAS.set(a, key);
}
export const normLang = (s) => ALIAS.get(String(s || '').trim().toLowerCase()) || null;

/* ───────────── Разбор на лексемы ───────────── */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NUM = String.raw`\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[a-zA-Z]*\b`;

function compile(L) {
  if (L.re) return L.re;
  L.kwS = set(L.kw || ''); L.litS = set(L.lit || ''); L.typeS = set(L.types || '');
  if (L.ci) for (const k of ['kwS', 'litS', 'typeS']) L[k] = new Set([...L[k]].map((w) => w.toLowerCase()));
  const parts = [];
  const com = [];
  if (L.block) com.push(esc(L.block[0]) + String.raw`[\s\S]*?(?:` + esc(L.block[1]) + '|$)');
  if (L.line) com.push(esc(L.line) + '.*');
  if (L.line === '//' && L.vars && !L.ci) com.push('#.*'); // PHP: оба вида комментариев
  if (com.length) parts.push(`(?<com>${com.join('|')})`);
  if (L.json || L.yaml) parts.push(L.json ? String.raw`(?<key>"(?:\\.|[^"\\\n])*"(?=\s*:))` : String.raw`(?<key>^[ \t]*(?:- )?[\w.\-/ ]*[\w.\-/](?=:(?:\s|$)))`);
  const str = [];
  if (L.triple) str.push(String.raw`"""[\s\S]*?(?:"""|$)`, String.raw`'''[\s\S]*?(?:'''|$)`);
  for (const q of L.quotes || '') {
    str.push(q === '`' ? String.raw`\`(?:\\[\s\S]|[^\\\`])*\`?` : `${q}(?:\\\\.|[^${q}\\\\\\n])*${q}?`);
  }
  if (str.length) parts.push(`(?<str>${str.join('|')})`);
  if (L.pre) parts.push(String.raw`(?<pre>^[ \t]*#[ \t]*\w+)`);
  if (L.decorators) parts.push(String.raw`(?<deco>@[A-Za-z_][\w.]*)`);
  if (L.vars) parts.push(String.raw`(?<var>\$\{?[A-Za-z_][\w:]*\}?|@{1,2}[A-Za-z_]\w*)`);
  parts.push(`(?<num>${NUM})`);
  parts.push(L.dashWords ? String.raw`(?<word>[A-Za-z_][\w]*(?:-[A-Za-z]\w*)*)` : String.raw`(?<word>[A-Za-z_$][\w$]*)`);
  L.re = new RegExp(parts.join('|'), 'gm');
  return L.re;
}

function wordType(L, w, text, end) {
  const k = L.ci ? w.toLowerCase() : w;
  if (L.kwS.has(k)) return 'kw';
  if (L.litS.has(k)) return 'lit';
  if (L.typeS.has(k)) return 'type';
  if (L.dashWords && /^[A-Z][a-z]+-[A-Z]/.test(w)) return 'fn'; // командлеты PowerShell: Get-ChildItem
  let i = end;
  while (text[i] === ' ' || text[i] === '\t') i++;
  if (text[i] === '(' || (L === LANGS.rust && text[i] === '!')) return 'fn';
  if (L.caps && /^[A-Z][a-z0-9]/.test(w)) return 'type';
  return null;
}

function codeTokens(text, L) {
  const re = compile(L);
  const out = [];
  re.lastIndex = 0;
  for (let m, guard = 0; (m = re.exec(text)) && guard < 200000; guard++) {
    if (!m[0]) { re.lastIndex++; continue; }
    const s = m.index, e = s + m[0].length, g = m.groups;
    if (g.com) out.push([s, e, 'com']);
    else if (g.key) out.push([s, e, 'prop']);
    else if (g.str) out.push([s, e, 'str']);
    else if (g.pre || g.deco) out.push([s, e, g.pre ? 'kw' : 'fn']);
    else if (g.var) out.push([s, e, L.litS.has(m[0].toLowerCase()) ? 'lit' : 'var']);
    else if (g.num) out.push([s, e, 'num']);
    else if (g.word) {
      const tp = wordType(L, g.word, text, e);
      if (tp) out.push([s, e, tp]);
    }
  }
  return out;
}

const RE_MARKUP = /(?<com><!--[\s\S]*?(?:-->|$))|(?<doc><![A-Za-z][^>]*>|<\?[\s\S]*?\?>)|(?<tag><\/?[A-Za-z][\w:.-]*|\/?>)|(?<attr>(?<=<[A-Za-z][^<>]*)\s[\w:@.-]+(?=\s*=))|(?<str>(?<=<[A-Za-z][^<>]*=\s*)(?:"[^"]*"|'[^']*'))|(?<ent>&#?\w+;)/g;
const RE_CSS = /(?<com>\/\*[\s\S]*?(?:\*\/|$)|(?<![:\w])\/\/.*)|(?<str>"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(?<at>@[\w-]+|!important)|(?<prop>(?<=[{;\s])-{0,2}[a-zA-Z][\w-]*(?=\s*:(?!:)[^{;]*[;}]))|(?<color>#[\da-fA-F]{3,8}\b)|(?<num>-?(?:\d*\.)?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|pt)?\b)|(?<sel>[.#][A-Za-z_][\w-]*|::?[a-z-]+)|(?<var>\$[\w-]+|--[\w-]+)/g;
const RE_MD = /(?<head>^#{1,6}[ \t].*)|(?<code>`[^`\n]+`|^```.*)|(?<bold>\*\*[^*\n]+\*\*|__[^_\n]+__)|(?<link>!?\[[^\]\n]*\]\([^)\n]*\))|(?<list>^[ \t]*(?:[-*+]|\d+[.)])(?=[ \t]))|(?<quote>^>.*)/gm;

function regexTokens(text, re, map) {
  const out = [];
  re.lastIndex = 0;
  for (let m, guard = 0; (m = re.exec(text)) && guard < 200000; guard++) {
    if (!m[0]) { re.lastIndex++; continue; }
    for (const k in m.groups) if (m.groups[k] != null) { out.push([m.index, m.index + m[0].length, map[k]]); break; }
  }
  return out;
}

export function tokenize(text, lang) {
  const L = LANGS[lang];
  if (!L) return [];
  if (L.markup) return regexTokens(text, RE_MARKUP, { com: 'com', doc: 'kw', tag: 'tag', attr: 'attr', str: 'str', ent: 'lit' });
  if (L.css) return regexTokens(text, RE_CSS, { com: 'com', str: 'str', at: 'kw', prop: 'prop', color: 'num', num: 'num', sel: 'type', var: 'var' });
  if (L.md) return regexTokens(text, RE_MD, { head: 'kw', code: 'str', bold: 'type', link: 'fn', list: 'lit', quote: 'com' });
  return codeTokens(text, L);
}

/* ───────────── Определение языка ───────────── */

// [язык, признак, вес]: побеждает язык с наибольшей суммой
const SIGNS = [
  ['json', /^\s*[{[][\s\S]*[}\]]\s*$/, 0], // проверяется отдельно через JSON.parse
  ['javascript', /\b(?:const|let|var)\s+[\w$]+\s*=/, 2], ['javascript', /=>/, 1], ['javascript', /\bfunction\s*[\w$]*\s*\(/, 2],
  ['javascript', /\bconsole\.\w+\(/, 3], ['javascript', /\brequire\(['"]/, 3], ['javascript', /^\s*import\s.+\sfrom\s+['"]/m, 2],
  ['javascript', /\bdocument\.\w+|\bwindow\.\w+/, 2], ['javascript', /\bexport\s+(?:default|const|function|class)\b/, 2], ['javascript', /===|!==/, 1],
  ['typescript', /:\s*(?:string|number|boolean|any|void|unknown)\b/, 3], ['typescript', /^\s*(?:export\s+)?(?:interface|type)\s+\w+/m, 3], ['typescript', /<\w+>\(/, 1],
  ['python', /^\s*def\s+\w+\s*\(.*\)\s*(?:->.*)?:\s*$/m, 4], ['python', /^\s*(?:from\s+[\w.]+\s+)?import\s+[\w.]+(?:\s+as\s+\w+)?\s*$/m, 2],
  ['python', /^\s*(?:if|elif|for|while|with|class|try|except)\b.*:\s*$/m, 2], ['python', /\bself\.\w+/, 2], ['python', /\bprint\(/, 1], ['python', /\b(?:None|True|False)\b/, 1],
  ['python', /^\s*elif\b/m, 3], ['python', /f["'][^"']*\{/, 2],
  ['html', /<!DOCTYPE\s+html/i, 6], ['html', /<\/?(?:html|head|body|div|span|p|a|ul|li|script|style|section|button|input|img|h[1-6])\b[^>]*>/i, 3],
  ['xml', /^\s*<\?xml/, 6], ['xml', /<\/[\w:]+>\s*$/m, 1],
  ['css', /^\s*[.#]?[\w-][\w\s.#:,>+~[\]="'-]*\{\s*$/m, 2], ['css', /^\s*[\w-]+\s*:\s*[^;{}]+;\s*$/m, 2], ['css', /@media|@import|@keyframes|@font-face/, 3],
  ['sql', /\bSELECT\b[\s\S]+\bFROM\b/i, 4], ['sql', /\b(?:INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/i, 4], ['sql', /\bWHERE\b/i, 1],
  ['bash', /^#!\/(?:usr\/)?bin\/(?:env\s+)?(?:ba|z)?sh/, 8], ['bash', /^\s*(?:sudo|apt(?:-get)?|npm|npx|yarn|pip|git|cd|ls|echo|export|mkdir|curl|docker|chmod)\s/m, 2],
  ['bash', /\$\(|\$\{\w+\}|\bfi\b|\besac\b|\bdone\b/, 2], ['bash', /^\s*\$\s+\w/m, 2],
  ['powershell', /\b(?:Get|Set|New|Remove|Write|Start|Stop|Invoke|Import|Test|Add|Out|Select|Where|ForEach)-[A-Z]\w+/, 4], ['powershell', /\$\w+\s*=/, 1], ['powershell', /-(?:eq|ne|gt|lt|like|match)\b/i, 2],
  ['c', /^\s*#include\s*<\w+\.h>/m, 4], ['c', /\bprintf\s*\(/, 2], ['c', /\bint\s+main\s*\(/, 2], ['c', /\bmalloc\(|->\w+/, 1],
  ['cpp', /^\s*#include\s*<(?:iostream|vector|string|map|memory|algorithm)>/m, 5], ['cpp', /\bstd::/, 4], ['cpp', /\bcout\s*<</, 3], ['cpp', /\btemplate\s*</, 3],
  ['csharp', /^\s*using\s+System(?:\.\w+)*;/m, 5], ['csharp', /\bConsole\.Write(?:Line)?\(/, 4], ['csharp', /\bnamespace\s+[\w.]+/, 2], ['csharp', /\b(?:public|private)\s+(?:static\s+)?(?:async\s+)?(?:void|string|int|Task)\s+\w+\s*\(/, 1], ['csharp', /\{\s*get;\s*(?:set;)?\s*\}/, 4],
  ['java', /\bSystem\.out\.print/, 5], ['java', /\bpublic\s+static\s+void\s+main\s*\(String/, 5], ['java', /^\s*import\s+java\./m, 5], ['java', /^\s*package\s+[\w.]+;/m, 3], ['java', /@Override\b/, 2],
  ['kotlin', /\bfun\s+\w+\s*\(/, 3], ['kotlin', /\bval\s+\w+\s*[:=]/, 2], ['kotlin', /\bprintln\(/, 1],
  ['swift', /\bfunc\s+\w+\s*\(/, 2], ['swift', /\bguard\s+let\b|\bif\s+let\b/, 4], ['swift', /^\s*import\s+(?:UIKit|SwiftUI|Foundation)\b/m, 5],
  ['go', /^\s*package\s+\w+\s*$/m, 4], ['go', /\bfunc\s+(?:\(\w+\s+\*?\w+\)\s*)?\w+\s*\(/, 3], ['go', /:=/, 2], ['go', /\bfmt\.\w+\(/, 4],
  ['rust', /\bfn\s+\w+\s*(?:<[^>]*>)?\s*\(/, 3], ['rust', /\blet\s+mut\b/, 4], ['rust', /\b(?:println|vec|format)!\(/, 4], ['rust', /\bimpl\b|::new\(/, 2],
  ['php', /<\?php/, 8], ['php', /\$\w+\s*=|\$this->/, 2], ['php', /\becho\s+/, 1],
  ['ruby', /^\s*def\s+\w+[?!]?(?:\(.*\))?\s*$/m, 3], ['ruby', /^\s*end\s*$/m, 2], ['ruby', /\bputs\s/, 3], ['ruby', /\bdo\s*\|\w+\|/, 4], ['ruby', /^\s*require\s+['"]/m, 2],
  ['yaml', /^[ \t]*[\w.-]+:[ \t]+\S.*$/m, 1], ['yaml', /^[ \t]*- [\w.-]+:\s/m, 2], ['yaml', /^---\s*$/m, 2],
  ['markdown', /^#{1,6}\s+\S/m, 2], ['markdown', /^\s*[-*+]\s+\S/m, 1], ['markdown', /\[[^\]]+\]\([^)]+\)/, 2], ['markdown', /^```/m, 3],
];

// Возвращает { lang, score }; lang = null, если уверенности нет
export function detectLang(text) {
  const src = String(text).slice(0, 20000);
  const trimmed = src.trim();
  if (!trimmed) return { lang: null, score: 0 };
  if (/^[{[]/.test(trimmed) && /[}\]]$/.test(trimmed)) {
    try { JSON.parse(trimmed); return { lang: 'json', score: 10 }; } catch {}
  }
  const score = {};
  for (const [lang, re, w] of SIGNS) if (w && re.test(src)) score[lang] = (score[lang] || 0) + w;
  // TypeScript — это JavaScript с типами
  if (score.typescript) score.typescript += score.javascript || 0;
  // YAML даёт много ложных срабатываний на тексте «ключ: значение» — учитываем, только если таких строк большинство
  if (score.yaml) {
    const lines = trimmed.split('\n').filter((l) => l.trim());
    const kv = lines.filter((l) => /^[ \t]*(?:- )?[\w.-]+:(?:\s|$)|^[ \t]*- |^\s*#|^---/.test(l)).length;
    if (kv / lines.length < 0.7) delete score.yaml; else score.yaml += 2;
  }
  let best = null, top = 0;
  for (const k in score) if (score[k] > top) { top = score[k]; best = k; }
  return top >= 2 ? { lang: best, score: top } : { lang: null, score: top };
}

// Похоже ли многострочное вставленное содержимое на код (а не на обычный текст или Markdown)
export function looksLikeCode(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return null;
  const { lang, score } = detectLang(text);
  if (!lang || lang === 'markdown' || lang === 'yaml') return null;
  const codey = lines.filter((l) => /[;{}()[\]=<>]\s*$|^\s{2,}\S|^\t|^\s*(?:\/\/|#|<\/?[a-z]|\*|--)|^\s*[})\]]/i.test(l)).length;
  return score >= 3 && codey / lines.length >= 0.4 ? lang : null;
}

/* ───────────── Раскраска ───────────── */

const supported = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';
const registry = new Map(); // тип лексемы → Highlight
const owned = new Map();    // элемент блока кода → его диапазоны

function reg(type) {
  let hl = registry.get(type);
  if (!hl) {
    hl = new Highlight();
    registry.set(type, hl);
    CSS.highlights.set('code-' + type, hl);
  }
  return hl;
}

// Текст элемента с переводами строк из <br> и карта «смещение → текстовый узел»
function textMap(el) {
  let text = '';
  const nodes = [];
  const walk = (n) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { nodes.push([c, text.length]); text += c.nodeValue; } else if (c.nodeName === 'BR') text += '\n';
      else if (c.nodeType === 1) walk(c);
    }
  };
  walk(el);
  return { text, nodes };
}

function point(nodes, off) {
  let lo = 0, hi = nodes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (nodes[mid][1] <= off) lo = mid; else hi = mid - 1;
  }
  const [node, start] = nodes[lo];
  return [node, Math.min(off - start, node.nodeValue.length)];
}

export function clearCode(el) {
  const list = owned.get(el);
  if (!list) return;
  for (const [type, r] of list) registry.get(type)?.delete(r);
  owned.delete(el);
}

export function clearAllCode() {
  for (const hl of registry.values()) hl.clear();
  owned.clear();
}

export function codeText(el) { return textMap(el).text; }

export function highlightCode(el, lang) {
  clearCode(el);
  if (!supported || !lang || !LANGS[lang]) return;
  const { text, nodes } = textMap(el);
  if (!nodes.length || text.length > 300000) return;
  const list = [];
  for (const [s, e, type] of tokenize(text, lang)) {
    if (!type || e <= s) continue;
    const r = new Range();
    const [sn, so] = point(nodes, s);
    const [en, eo] = point(nodes, e);
    try { r.setStart(sn, so); r.setEnd(en, eo); } catch { continue; }
    reg(type).add(r);
    list.push([type, r]);
  }
  owned.set(el, list);
}
