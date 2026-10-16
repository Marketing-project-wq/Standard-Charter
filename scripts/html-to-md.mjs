#!/usr/bin/env node
// Konversi rulebook HTML -> Markdown (rulebook/README.md + satu file per cabor).
//
//   node scripts/html-to-md.mjs [input.html]
//
// Default input: rulebook/source/Aturan-22-Cabor-Terbaru.html
// (kalau belum dipindah: Aturan-22-Cabor-Terbaru.html di root repo).
//
// - Tanpa dependensi (Railpack mendeteksi Node kalau ada package.json di root).
// - Frontmatter YAML di file cabor yang sudah ada DIPERTAHANKAN; skrip hanya menulis badan.
// - Setelah menulis, skrip menghitung ulang tabel, baris, link, penanda Verifikasi,
//   subbagian, dan kotak sumber per cabor dan GAGAL (exit 1) kalau ada yang tidak sama dengan HTML.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'rulebook');

// ---------------------------------------------------------------- HTML parser mini
const VOID = new Set(['meta', 'link', 'br', 'hr', 'img', 'input']);
const RAW = new Set(['script', 'style']);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = s => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return String.fromCodePoint(n); }
  return ENT[e.toLowerCase()] ?? m;
});

function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|<!doctype[^>]*>|[^<]+|</gi;
  let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith('<!--') || /^<!doctype/i.test(m[0])) continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const attrs = {};
      for (const a of (m[3] || '').matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
      const node = { tag, attrs, children: [] };
      top.children.push(node);
      if (RAW.has(tag)) {
        const end = html.toLowerCase().indexOf('</' + tag, re.lastIndex);
        node.children.push({ text: html.slice(re.lastIndex, end) });
        re.lastIndex = html.indexOf('>', end) + 1;
      } else if (!VOID.has(tag) && !m[4]) stack.push(node);
    } else if (m[0] === '<') {
      top.children.push({ text: '<' });
    } else {
      top.children.push({ text: decode(m[0]) });
    }
  }
  return root;
}

const isEl = n => n && n.tag;
const cls = n => (n.attrs.class || '').split(/\s+/).filter(Boolean);
const hasCls = (n, c) => isEl(n) && cls(n).includes(c);
const walk = (n, fn) => { if (isEl(n) || n.tag === '#root') { fn(n); n.children.forEach(c => walk(c, fn)); } };
const find = (n, pred, out = []) => { walk(n, x => { if (isEl(x) && pred(x)) out.push(x); }); return out; };
const textOf = n => n.text !== undefined ? n.text : n.children.map(textOf).join('');
const clean = s => s.replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- Markdown emitter
const VERIF = '⚠️ Verifikasi';
const escText = s => s.replace(/\\/g, '\\\\').replace(/([*_`\[\]<>])/g, '\\$1').replace(/ /g, ' ');
const encodeHref = h => h.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');

function inline(n) {
  if (n.text !== undefined) return escText(n.text).replace(/\s+/g, ' ');
  const kids = () => n.children.map(inline).join('');
  switch (n.tag) {
    case 'strong': case 'b': return wrap('**', kids());
    case 'em': case 'i': return wrap('*', kids());
    case 'a': { const t = clean(kids()); const href = n.attrs.href || ''; return href ? `[${t || href}](${encodeHref(href)})` : t; }
    case 'br': return ' ';
    case 'span':
      if (hasCls(n, 'mk')) return VERIF;
      return kids();
    case 'ul': case 'ol': case 'table': case 'div': case 'p': throw new Error(`Elemen blok <${n.tag}> di dalam inline`);
    default: return kids();
  }
}
function wrap(mark, inner) {
  const lead = inner.match(/^\s*/)[0], trail = inner.match(/\s*$/)[0];
  const core = inner.trim();
  return core ? lead + mark + core + mark + trail : inner;
}
const inl = n => clean(n.children.map(inline).join(''));

function listMd(n, depth = 0) {
  const ordered = n.tag === 'ol';
  const lines = [];
  let i = 0;
  for (const li of n.children.filter(isEl)) {
    i++;
    const bullet = ordered ? `${i}.` : '-';
    const pad = '  '.repeat(depth);
    const nested = li.children.filter(c => isEl(c) && (c.tag === 'ul' || c.tag === 'ol'));
    const rest = li.children.filter(c => !nested.includes(c));
    lines.push(`${pad}${bullet} ${clean(rest.map(inline).join(''))}`);
    for (const nl of nested) lines.push(...listMd(nl, depth + 1));
  }
  return lines;
}

function tableMd(t) {
  const rows = find(t, x => x.tag === 'tr');
  const cell = c => {
    for (const k of find(c, x => ['ul', 'ol', 'table', 'p', 'div'].includes(x.tag))) throw new Error(`Blok <${k.tag}> di dalam sel tabel`);
    return clean(c.children.map(inline).join('')).replace(/\|/g, '\\|');
  };
  const head = rows.filter(r => find(r, x => x.tag === 'th').length);
  const body = rows.filter(r => !head.includes(r));
  const hdr = head[0] ? find(head[0], x => x.tag === 'th').map(cell) : null;
  const first = body[0] ? find(body[0], x => x.tag === 'td').map(cell) : [];
  const cols = hdr ? hdr.length : first.length;
  const out = [];
  out.push(`| ${(hdr || Array(cols).fill('')).join(' | ')} |`);
  out.push(`|${Array(cols).fill('---').join('|')}|`);
  for (const r of body) {
    const cs = find(r, x => x.tag === 'td').map(cell);
    if (cs.length !== cols) throw new Error(`Jumlah kolom baris tidak sama (${cs.length} vs ${cols})`);
    out.push(`| ${cs.join(' | ')} |`);
  }
  return out;
}

function blocks(nodes) {
  const out = [];
  const push = lines => { if (lines.length) { out.push(...lines, ''); } };
  for (const n of nodes) {
    if (n.text !== undefined) { if (clean(n.text)) throw new Error('Teks liar di luar blok: ' + clean(n.text).slice(0, 40)); continue; }
    switch (n.tag) {
      case 'p': push([inl(n)]); break;
      case 'ul': case 'ol': push(listMd(n)); break;
      case 'table': push(tableMd(n)); break;
      case 'blockquote': push([`> ${inl(n)}`]); break;
      case 'div': out.push(...blocks(n.children)); break;
      default: throw new Error(`Elemen tidak dikenal di badan: <${n.tag}>`);
    }
  }
  return out;
}

// ---------------------------------------------------------------- struktur rulebook
const SLUG = {
  1: 'badminton', 2: 'padel', 3: 'pickleball', 4: 'table-tennis', 5: 'tennis', 6: 'football', 7: 'futsal',
  8: 'basketball', 10: 'volleyball', 11: 'netball', 12: 'cricket', 13: 'cage-cricket', 14: 'dragon-boat',
  15: 'darts', 16: 'pool', 17: 'golf', 18: 'bowling', 19: 'swimming', 20: 'running', 21: 'rock-climbing', 22: 'hyrox',
};

function sectionInfo(sec) {
  const h2 = find(sec, x => x.tag === 'h2')[0];
  const numEl = find(h2, x => hasCls(x, 'num'))[0];
  const nameEl = find(h2, x => hasCls(x, 'name'))[0];
  const eyebrow = find(sec, x => hasCls(x, 'eyebrow'))[0];
  return { id: sec.attrs.id, num: numEl ? clean(textOf(numEl)) : null, name: clean(textOf(nameEl)), eyebrow: eyebrow ? clean(textOf(eyebrow)) : '' };
}

function asideMd(a) {
  const kind = hasCls(a, 'conf') ? 'conf' : 'src';
  const lines = [];
  if (kind === 'conf') {
    const ch = find(a, x => hasCls(x, 'ch'))[0];
    const tag = clean(textOf(find(ch, x => hasCls(x, 'tag'))[0]));
    const date = clean(ch.children.filter(c => c.text !== undefined).map(c => c.text).join(''));
    lines.push(`> **${tag}** · ${date}`, '>');
    for (const ul of a.children.filter(c => isEl(c) && c.tag === 'ul')) for (const l of listMd(ul)) lines.push(`> ${l}`);
  } else {
    const tag = clean(textOf(find(a, x => hasCls(x, 'tag'))[0]));
    const p = a.children.find(c => isEl(c) && c.tag === 'p');
    let body = inl(p);
    const dup = `**${tag}:**`;
    if (body.toLowerCase().startsWith(dup.toLowerCase())) body = body.slice(dup.length).trim();
    lines.push(`> **${tag}:** ${body}`);
  }
  return lines;
}

function detailMd(d) {
  const sum = clean(textOf(find(d, x => x.tag === 'summary')[0]));
  const sub = find(d, x => hasCls(x, 'sub'))[0];
  return [`## ${sum}`, '', ...blocks(sub.children)];
}

function sectionBody(sec, titleLine) {
  const lines = [titleLine, ''];
  // urutan dokumen: aside (sumber), aside (konfirmasi), details, dan blok langsung di bawah section (tabel glosarium)
  for (const c of sec.children.filter(isEl)) {
    if (c.tag === 'header') continue;
    if (c.tag === 'aside') { lines.push(...asideMd(c), ''); continue; }
    if (c.tag === 'details') { lines.push(...detailMd(c)); continue; }
    lines.push(...blocks([c]));
  }
  while (lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------- statistik (HTML vs MD)
function htmlStats(sec) {
  const tables = find(sec, x => x.tag === 'table');
  return {
    tabel: tables.length,
    baris: find(sec, x => x.tag === 'tr').length,
    link: find(sec, x => x.tag === 'a').length,
    verifikasi: find(sec, x => x.tag === 'span' && hasCls(x, 'mk')).length,
    subbagian: find(sec, x => x.tag === 'details').length,
    kotakKonfirmasi: find(sec, x => x.tag === 'aside' && hasCls(x, 'conf')).length,
    kotakSumber: find(sec, x => x.tag === 'aside' && hasCls(x, 'src')).length,
    daftar: find(sec, x => x.tag === 'li').length,
  };
}
function mdStats(md) {
  const lines = md.split('\n');
  const isSep = l => /^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(l) || /^\|(?:---\|)+$/.test(l);
  const tableLines = lines.filter(l => l.startsWith('|'));
  const tabel = tableLines.filter(isSep).length;
  return {
    tabel,
    baris: tableLines.length - tabel,
    link: (md.match(/\]\(https?:\/\/[^)\s]+\)/g) || []).length,
    verifikasi: (md.match(/⚠️ Verifikasi/g) || []).length,
    subbagian: lines.filter(l => /^## /.test(l)).length,
    kotakKonfirmasi: lines.filter(l => l.startsWith('> **Terkonfirmasi sumber resmi**')).length,
    kotakSumber: lines.filter(l => /^> \*\*[^*]+:\*\* /.test(l) && !l.startsWith('> **Terkonfirmasi')).length,
    daftar: lines.filter(l => /^(?:> )?\s*(?:- |\d+\. )/.test(l)).length,
  };
}

// ---------------------------------------------------------------- main
function frontmatterOf(file) {
  if (!fs.existsSync(file)) return null;
  const m = fs.readFileSync(file, 'utf8').match(/^---\n[\s\S]*?\n---\n/);
  return m ? m[0] : null;
}

function main() {
  const arg = process.argv[2];
  const candidates = [arg, path.join(OUT, 'source', 'Aturan-22-Cabor-Terbaru.html'), path.join(ROOT, 'Aturan-22-Cabor-Terbaru.html')].filter(Boolean);
  const src = candidates.find(f => fs.existsSync(f));
  if (!src) throw new Error('File HTML sumber tidak ditemukan');
  const dom = parse(fs.readFileSync(src, 'utf8'));
  const sections = find(dom, x => x.tag === 'section' && 'data-sec' in x.attrs);
  fs.mkdirSync(OUT, { recursive: true });

  const report = [];
  const index = [];
  let bad = 0;
  for (const sec of sections) {
    const info = sectionInfo(sec);
    const isGlossary = !info.num;
    const firstNum = info.num ? parseInt(info.num, 10) : null;
    const slug = isGlossary ? null : SLUG[firstNum];
    if (!isGlossary && !slug) throw new Error('Slug tidak dikenal untuk cabor ' + info.num);
    const fileName = isGlossary ? null : `${slug}.md`;
    const display = info.name;
    const title = isGlossary ? `## ${display}` : `# ${info.num}. ${display}`;
    let body = sectionBody(sec, isGlossary ? `## ${display}` : title);
    if (!isGlossary) body = body.replace(/^# .*\n\n/, `# ${info.num}. ${display}\n\n> Kategori: ${info.eyebrow}\n\n`);
    const before = htmlStats(sec);
    if (!isGlossary) {
      const fm = frontmatterOf(path.join(OUT, fileName)) || `---\nsport: ${slug}\n---\n`;
      fs.writeFileSync(path.join(OUT, fileName), `${fm}\n${body}`);
      const after = mdStats(body);
      const diffs = Object.keys(before).filter(k => before[k] !== after[k]).map(k => `${k}: html=${before[k]} md=${after[k]}`);
      // subbagian di MD = details + judul H1? H1 tidak dihitung (^## saja)
      report.push({ file: fileName, ...before, ok: diffs.length === 0, diffs });
      if (diffs.length) bad++;
      index.push({ num: info.num, name: display, slug, file: fileName, category: info.eyebrow });
    } else {
      sec.__glossary = { body, before };
    }
  }

  // README
  const gl = sections.find(s => s.__glossary).__glossary;
  const cats = [];
  for (const i of index) { let c = cats.find(x => x.name === i.category); if (!c) cats.push(c = { name: i.category, items: [] }); c.items.push(i); }
  const mast = clean(textOf(find(dom, x => x.tag === 'h1')[0]));
  const foot = inl(find(dom, x => x.tag === 'p' && hasCls(x, 'foot'))[0]);
  const readme = [
    `# ${mast}`, '',
    'Indeks 22 cabor SC Games 2027. Dokumen ini dikonversi dari `rulebook/source/Aturan-22-Cabor-Terbaru.html` oleh `scripts/html-to-md.mjs`.',
    '', `Penanda ${VERIF} berarti detail itu belum dicek ke sumber resmi. Jangan dihapus sebelum dicek, dan jangan diisi tebakan.`, '',
    '## Daftar cabor (22)', '',
    '| No | Cabor | Kategori | File |', '|---|---|---|---|',
    ...index.map(i => `| ${i.num} | ${i.name} | ${i.category} | [${i.file}](${i.file}) |`),
    '', 'Basketball putra (8) dan putri (9) memakai satu file: aturan sama, beda ukuran bola dan kategori peserta.', '',
    gl.body.trimEnd(), '', foot ? `> ${foot}` : '',
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n') + '\n';
  fs.writeFileSync(path.join(OUT, 'README.md'), readme);
  const rg = mdStats(gl.body);
  const gdiff = Object.keys(gl.before).filter(k => !['kotakKonfirmasi', 'kotakSumber', 'subbagian'].includes(k) && gl.before[k] !== rg[k]).map(k => `${k}: html=${gl.before[k]} md=${rg[k]}`);
  report.unshift({ file: 'README.md (glosarium)', ...gl.before, ok: gdiff.length === 0, diffs: gdiff });
  if (gdiff.length) bad++;

  const tot = report.reduce((a, r) => { for (const k of ['tabel', 'baris', 'link', 'verifikasi', 'subbagian']) a[k] = (a[k] || 0) + r[k]; return a; }, {});
  console.log('File'.padEnd(26), 'tabel baris link verif sub  status');
  for (const r of report) console.log(r.file.padEnd(26), String(r.tabel).padStart(5), String(r.baris).padStart(5), String(r.link).padStart(4), String(r.verifikasi).padStart(5), String(r.subbagian).padStart(3), ' ', r.ok ? 'OK' : 'BEDA ' + r.diffs.join('; '));
  console.log('TOTAL'.padEnd(26), String(tot.tabel).padStart(5), String(tot.baris).padStart(5), String(tot.link).padStart(4), String(tot.verifikasi).padStart(5), String(tot.subbagian).padStart(3));
  if (bad) { console.error(`\n${bad} file tidak cocok dengan HTML.`); process.exit(1); }
  console.log('\nSemua file cocok dengan HTML.');
}

main();
