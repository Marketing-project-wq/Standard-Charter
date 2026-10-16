// YAML subset parser/serializer tanpa dependensi, cukup untuk frontmatter rulebook.
//
// Didukung: map bersarang (indentasi 2 spasi), list `- item` (skalar atau map), list/map inline
// `[a, b]` / `{a: 1}`, skalar null/true/false/angka/tanggal/string (bare, "..." atau '...'),
// komentar `# ...`. Tidak didukung (sengaja): anchor, tag, multi-dokumen, block scalar `|`/`>`.

export class YamlError extends Error {}

function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '\\' && q === '"') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { if (i === 0 || /[\s:\[{,-]/.test(line[i - 1])) q = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}

function scalar(s) {
  s = s.trim();
  if (s === '' || s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s);
  if (s[0] === '"') {
    if (s[s.length - 1] !== '"' || s.length < 2) throw new YamlError('String tidak ditutup: ' + s);
    try { return JSON.parse(s); } catch { throw new YamlError('String tidak valid: ' + s); }
  }
  if (s[0] === "'") {
    if (s[s.length - 1] !== "'" || s.length < 2) throw new YamlError('String tidak ditutup: ' + s);
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s[0] === '[' || s[0] === '{') return inline(s);
  return s;
}

function splitTop(s) {
  const out = []; let depth = 0, q = null, cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === '\\' && q === '"') { cur += s[++i]; } else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '') out.push(cur);
  return out;
}

function inline(s) {
  const open = s[0], close = open === '[' ? ']' : '}';
  if (s[s.length - 1] !== close) throw new YamlError('Koleksi inline tidak ditutup: ' + s);
  const parts = splitTop(s.slice(1, -1));
  if (open === '[') return parts.map(scalar);
  const o = {};
  for (const p of parts) {
    const i = keyEnd(p);
    if (i < 0) throw new YamlError('Pasangan key:value tidak valid: ' + p);
    o[unquoteKey(p.slice(0, i))] = scalar(p.slice(i + 1));
  }
  return o;
}

function keyEnd(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === ':' && (i === s.length - 1 || /\s/.test(s[i + 1]))) return i;
  }
  return -1;
}
const unquoteKey = k => { k = k.trim(); return (k[0] === '"' || k[0] === "'") ? scalar(k) : k; };

export function parse(text) {
  const lines = [];
  text.split('\n').forEach((raw, n) => {
    const l = stripComment(raw).replace(/\s+$/, '');
    if (l.trim() === '') return;
    if (/\t/.test(l.match(/^\s*/)[0])) throw new YamlError(`Baris ${n + 1}: tab tidak boleh dipakai untuk indentasi`);
    lines.push({ n: n + 1, indent: l.match(/^ */)[0].length, text: l.trim() });
  });
  let i = 0;

  function block(indent) {
    if (i >= lines.length) return null;
    return lines[i].text.startsWith('- ') || lines[i].text === '-' ? list(indent) : map(indent);
  }

  function value(rest, indent, parentLine) {
    if (rest === '') {
      if (i < lines.length && lines[i].indent > indent) return block(lines[i].indent);
      if (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith('- ') && parentLine.isMapKey) return list(indent);
      return null;
    }
    return scalar(rest);
  }

  function map(indent) {
    const o = {};
    while (i < lines.length && lines[i].indent === indent && !lines[i].text.startsWith('- ')) {
      const ln = lines[i++];
      const k = keyEnd(ln.text);
      if (k < 0) throw new YamlError(`Baris ${ln.n}: diharapkan "key: value", dapat "${ln.text}"`);
      const key = unquoteKey(ln.text.slice(0, k));
      if (key in o) throw new YamlError(`Baris ${ln.n}: key "${key}" ganda`);
      o[key] = value(ln.text.slice(k + 1).trim(), indent, { isMapKey: true });
    }
    if (i < lines.length && lines[i].indent > indent) throw new YamlError(`Baris ${lines[i].n}: indentasi tidak terduga`);
    return o;
  }

  function list(indent) {
    const a = [];
    while (i < lines.length && lines[i].indent === indent && (lines[i].text.startsWith('- ') || lines[i].text === '-')) {
      const ln = lines[i];
      const rest = ln.text === '-' ? '' : ln.text.slice(2).trim();
      if (rest === '') { i++; a.push(i < lines.length && lines[i].indent > indent ? block(lines[i].indent) : null); continue; }
      const k = rest[0] === '[' || rest[0] === '{' || rest[0] === '"' || rest[0] === "'" ? -1 : keyEnd(rest);
      if (k >= 0) {
        // map di dalam list: ubah baris ini jadi baris map dengan indent +2
        lines[i] = { n: ln.n, indent: indent + 2, text: rest };
        a.push(map(indent + 2));
      } else { i++; a.push(scalar(rest)); }
    }
    return a;
  }

  if (!lines.length) return {};
  const res = block(lines[0].indent);
  if (i < lines.length) throw new YamlError(`Baris ${lines[i].n}: indentasi tidak konsisten`);
  return res;
}

// ---------------------------------------------------------------- stringify
const plain = /^[A-Za-z_][\w./ -]*$/;
function str(s) {
  if (s === '' || /^(null|true|false|~)$/i.test(s) || /^-?[\d.]+$/.test(s) || !/^[^\s#:\[\]{},&*!|>'"%@`-][^#:\[\]{},"']*$/.test(s) || /\s$/.test(s) || /:\s|\s#/.test(s)) return JSON.stringify(s);
  return s;
}
function sc(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return str(String(v));
}
const keyStr = k => (plain.test(k) && !/^(null|true|false)$/i.test(k) ? k : JSON.stringify(k));
const isScalarList = a => a.every(x => x === null || typeof x !== 'object') && a.length <= 8 && a.join('').length < 70;

export function stringify(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) lines.push(`${pad}${keyStr(k)}: []`);
      else if (isScalarList(v)) lines.push(`${pad}${keyStr(k)}: [${v.map(sc).join(', ')}]`);
      else {
        lines.push(`${pad}${keyStr(k)}:`);
        for (const item of v) {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            const sub = stringify(item, indent + 4).split('\n');
            lines.push(`${pad}  - ${sub[0].slice(indent + 4)}`, ...sub.slice(1));
          } else lines.push(`${pad}  - ${sc(item)}`);
        }
      }
    } else if (v !== null && typeof v === 'object') {
      if (Object.keys(v).length === 0) lines.push(`${pad}${keyStr(k)}: {}`);
      else lines.push(`${pad}${keyStr(k)}:`, stringify(v, indent + 2));
    } else lines.push(`${pad}${keyStr(k)}: ${sc(v)}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------- frontmatter
export function splitFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: null, body: md, raw: null };
  return { data: parse(m[1]), body: md.slice(m[0].length), raw: m[1] };
}
