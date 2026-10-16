#!/usr/bin/env node
// Build rulebook: validasi frontmatter -> assets/rulebook-data.js + halaman publik rulebook/*.html.
//
//   node scripts/build-rulebook.mjs          validasi, lalu tulis ulang file hasil generate
//   node scripts/build-rulebook.mjs --check  validasi dan pastikan file hasil generate sudah up to date (untuk CI)
//
// Keluar dengan kode 1 kalau frontmatter tidak valid. Tanpa dependensi.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontmatter } from './yaml-lite.mjs';
import { validateRulebookSet } from './rulebook-schema.mjs';
import { render, plainText, escHtml } from './md-lite.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'rulebook');
const CHECK = process.argv.includes('--check');

// ---------------------------------------------------------------- baca dan validasi
const names = fs.readdirSync(DIR).filter(f => f.endsWith('.md') && f !== 'README.md').sort();
const files = Object.fromEntries(names.map(f => [f, fs.readFileSync(path.join(DIR, f), 'utf8')]));
const errors = validateRulebookSet(files);
if (errors.length) { console.error('Frontmatter rulebook tidak valid:\n' + errors.map(e => '  - ' + e).join('\n')); process.exit(1); }
const readme = fs.readFileSync(path.join(DIR, 'README.md'), 'utf8');

const sports = names.map(f => {
  const { data, body } = splitFrontmatter(files[f]);
  return { fm: data, body, file: f, slug: data.sport, page: `${data.sport}.html` };
}).sort((a, b) => a.fm.number - b.fm.number);

// ---------------------------------------------------------------- status hasil dan glosarium dari tabel di MD
const STATUS_KEY = [[/^DNS$/i, 'DNS'], [/^DNF$/i, 'DNF'], [/^DQ$/i, 'DQ'], [/forfeit|w\/o/i, 'WO'], [/^RET/i, 'RET'], [/^Let$/i, 'LET'], [/^Fault$/i, 'FAULT']];
const plainCell = c => c.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\]\(https?:\/\/[^)\s]+\)/g, ']').replace(/[\[\]]/g, '').replace(/\\([\\*_`\[\]<>|])/g, '$1').trim();
function tableRows(md) {
  return md.split('\n').filter(l => l.startsWith('|') && !/^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(l) && !/^\|---/.test(l)).map(l => l.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => plainCell(c.replace(/\\\|/g, '|'))));
}
function statusMeanings(body) {
  const sec = body.split(/^(?=## )/m).find(s => /^## \d+\.\d+ Status hasil/.test(s));
  if (!sec) return null;
  const out = {};
  for (const [term, meaning] of tableRows(sec).slice(1)) { const k = STATUS_KEY.find(([re]) => re.test(term)); if (k) out[k[1]] = meaning; }
  return out;
}
const glossary = tableRows(readme.split(/^(?=## )/m).find(s => /^## Tujuh istilah umum/.test(s)).split('\n').slice(0, 14).join('\n'))
  .slice(1).map(([term, full, meaning, note]) => ({ term, full, meaning, note }));

// ---------------------------------------------------------------- assets/rulebook-data.js
const data = {
  source: 'rulebook/*.md',
  checked: sports.map(s => s.fm.rules_checked).sort().at(-1),
  order: sports.map(s => s.slug),
  glossary,
  sports: Object.fromEntries(sports.map(s => [s.slug, { ...s.fm, file: `rulebook/${s.file}`, page: `rulebook/${s.page}`, status_meanings: statusMeanings(s.body) }])),
};
const dataJs = `/* GENERATED oleh scripts/build-rulebook.mjs dari rulebook/*.md. Jangan diedit tangan. */\nwindow.RULEBOOK = ${JSON.stringify(data)};\n`;

// ---------------------------------------------------------------- halaman publik
const LABEL = {
  result_type: 'Tipe hasil', scoring_mode: 'Mode skor', unit: 'Satuan', points_to_win_game: 'Poin untuk menang game/set', win_by: 'Selisih minimal', point_cap: 'Batas poin',
  games_to_win_match: 'Game/set untuk menang pertandingan', deciding_game_points: 'Poin game penentu', deuce_rule: 'Aturan deuce', games_per_set: 'Game per set', set_win_by: 'Selisih game di set',
  sets_to_win_match: 'Set untuk menang pertandingan', tiebreak_game: 'Tie-break game', match_tiebreak: 'Match tie-break', start_score: 'Skor awal', finish: 'Cara menutup', bust: 'Bust berlaku', legs_to_win_match: 'Leg untuk menang pertandingan',
  max_visit_score: 'Skor maksimal per giliran', max_checkout: 'Checkout tertinggi', frames_to_win_match: 'Frame untuk menang pertandingan', periods: 'Jumlah babak', period_minutes: 'Menit per babak', overtime: 'Perpanjangan waktu',
  score_events: 'Nilai skor', walkover: 'Skor walkover', league_points: 'Poin liga', league_points_by_score: 'Poin liga menurut skor set', tiebreakers: 'Urutan tie-breaker klasemen', status_codes: 'Status hasil yang berlaku',
  ranking: 'Peringkat', time_precision: 'Ketelitian waktu (detik)', penalties: 'Penalti waktu', formats: 'Format skor', holes: 'Jumlah lubang', stableford: 'Poin Stableford', scoring_system: 'Sistem hitung', frames: 'Jumlah frame',
  max_score: 'Skor maksimal', laps: 'Putaran', distance_m: 'Jarak (m)', overs_per_innings: 'Over per innings', balls_per_over: 'Bola per over', wickets_per_innings: 'Wicket per innings', max_overs_per_bowler: 'Over maksimal per bowler',
  extras: 'Extras (run)', super_over: 'Super over', powerplay: 'Powerplay', station_weights: 'Bobot stasiun', stations: 'Stasiun', stages: 'Babak lomba', disciplines: 'Disiplin', options: 'Pilihan yang disebut rulebook', extra: 'Catatan tambahan',
  variants: 'Varian berdasarkan tanggal', manual_input_required: 'Wajib input manual panitia',
};
const SKIP = new Set(['sport', 'number', 'numbers', 'name', 'category', 'source', 'rules_checked', 'verified', 'unverified_fields', 'markers', 'period_label', 'innings_per_team']);
const compact = v => (v === null ? null : typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '').replace(/,/g, ', ') : String(v));
function paramTable(fm) {
  const rows = [];
  for (const [k, v] of Object.entries(fm)) {
    if (SKIP.has(k)) continue;
    const val = compact(v);
    const cell = val === null ? '<span class="unk">belum ditetapkan rulebook</span>' : escHtml(val);
    rows.push(`<tr><th>${escHtml(LABEL[k] || k)}</th><td>${cell}</td></tr>`);
  }
  const unv = fm.unverified_fields.length ? `<p class="warn">⚠️ Belum terverifikasi: ${fm.unverified_fields.map(f => `<code>${escHtml(f)}</code>`).join(', ')}. Panitia dapat menetapkan nilainya di panel operator halaman Live.</p>` : '<p class="ok">✓ Semua parameter scoring cabor ini terverifikasi di rulebook.</p>';
  return `<details class="params" open><summary>Parameter scoring (dibaca mesin live scoring)</summary>${unv}<div class="tw"><table class="p">${rows.join('')}</table></div></details>`;
}

const CSS = `:root{--navy:#05103F;--blue:#0473EA;--green:#38D200;--ink:#0B1430;--mut:#5B6478;--line:#E3E7EF;--bg:#F4F6FB}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 'Barlow',system-ui,sans-serif}
a{color:var(--blue)}header.top{background:var(--navy);color:#fff;position:sticky;top:0;z-index:5}
.top .in{max-width:1280px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.top a{color:#fff;text-decoration:none}.brand{font:800 22px 'Barlow Condensed',sans-serif;letter-spacing:.04em}
.top nav a{font:700 14px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#B8C4E6;margin-right:14px}.top nav a.on{color:#fff}
.layout{max-width:1280px;margin:0 auto;padding:20px;display:grid;grid-template-columns:280px minmax(0,1fr);gap:24px}
aside.side{position:sticky;top:64px;align-self:start;max-height:calc(100vh - 80px);overflow:auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px}
aside.side summary{cursor:pointer;margin-top:10px;font:700 14px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase}aside.side input{width:100%;padding:10px 12px;border:1.5px solid #D5DBE6;border-radius:10px;font:inherit}
aside.side h4{margin:14px 0 4px;font:700 12px 'Barlow Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
aside.side a{display:flex;gap:8px;padding:6px 8px;border-radius:8px;text-decoration:none;color:var(--ink);font-size:15px}aside.side a:hover{background:#EEF3FC}
aside.side a.on{background:var(--navy);color:#fff}aside.side a .n{font:600 12px 'JetBrains Mono',monospace;color:var(--mut);min-width:28px}aside.side a.on .n{color:#8FA3D9}
main{min-width:0}main h1{font:800 44px/1 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:0 0 6px}
main h2{font:800 26px 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:28px 0 8px;padding-top:6px;border-top:1px solid var(--line)}
main h3{font:700 20px 'Barlow Condensed',sans-serif;text-transform:uppercase}
.card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px 22px}
blockquote{margin:12px 0;padding:12px 16px;border-radius:12px;background:#EEF3FC;border-left:4px solid var(--blue)}blockquote p,blockquote ul{margin:4px 0}
blockquote.conf{background:#E6F9DC;border-left-color:var(--green)}blockquote.cat{background:transparent;border:0;padding:0;color:var(--mut);font:600 13px 'JetBrains Mono',monospace;letter-spacing:.06em}
blockquote.src{background:#F1F3F8;border-left-color:#8FA3D9}
.tw{overflow-x:auto;margin:10px 0}table{border-collapse:collapse;width:100%;font-size:15px}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
thead th{background:var(--navy);color:#fff;font:700 13px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase}
.mk{background:#FFF3C4;color:#7A5A00;border-radius:6px;padding:1px 6px;font:600 12px 'JetBrains Mono',monospace;white-space:nowrap}
details.params{margin:14px 0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px 16px}details.params summary{cursor:pointer;font:700 15px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase}
table.p th{width:36%;background:#F4F6FB;font-weight:600}.unk{color:#B3261E;font-weight:600}.warn{background:#FFF3C4;border-radius:10px;padding:8px 12px;margin:8px 0}.ok{color:#1E7A00;font-weight:600}
code{font:13px 'JetBrains Mono',monospace;background:#F1F3F8;padding:1px 5px;border-radius:5px}
#results{display:none}#results a{display:block;padding:10px 12px;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink)}#results small{color:var(--mut)}#results mark{background:#FFF3C4}
@media(max-width:900px){.layout{grid-template-columns:1fr}aside.side{position:static;max-height:none}main h1{font-size:34px}}`;

const groups = [['Umum', [{ href: 'index.html', n: '', t: 'Tujuh istilah umum', k: 'index' }]]];
const CAT = { net_raket: 'Net dan raket', tim: 'Tim', presisi: 'Presisi', individu: 'Individu' };
for (const c of Object.keys(CAT)) groups.push([CAT[c], sports.filter(s => s.fm.category === c).map(s => ({ href: s.page, n: (s.fm.numbers ? `${s.fm.numbers[0]}–${s.fm.numbers.at(-1)}` : s.fm.number), t: s.fm.name.replace(/ dan \(W\)/, ' & (W)'), k: s.slug }))]);

function layout({ title, current, content }) {
  const side = groups.map(([g, items]) => `<h4>${escHtml(g)}</h4>${items.map(i => `<a href="${i.href}"${i.k === current ? ' class="on"' : ''}><span class="n">${i.n}</span>${escHtml(i.t)}</a>`).join('')}`).join('');
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(title)} · Rulebook SC Games 2027</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${CSS}</style></head><body>
<header class="top"><div class="in"><a class="brand" href="/">SC GAMES</a><nav><a href="/">Portal</a><a class="on" href="index.html">Rulebook</a></nav></div></header>
<div class="layout"><aside class="side"><input id="q" type="search" placeholder="Cari aturan, istilah, cabor…" aria-label="Cari di rulebook" autocomplete="off"><details id="nv" open><summary>Daftar cabor (22)</summary>${side}</details></aside>
<main><div id="results" class="card"></div><div id="content">${content}</div></main></div>
<script src="search-index.js"></script>
<script>(function(){var nv=document.getElementById('nv');if(window.matchMedia&&window.matchMedia('(max-width:900px)').matches)nv.open=false;
var q=document.getElementById('q'),res=document.getElementById('results'),box=document.getElementById('content');
function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
q.addEventListener('input',function(){var t=q.value.trim().toLowerCase();if(t.length<2){res.style.display='none';box.style.display='';return}
var terms=t.split(/\\s+/),hits=[];(window.RULEBOOK_SEARCH||[]).forEach(function(s){s.sections.forEach(function(x){var h=(s.name+' '+x.h+' '+x.t).toLowerCase();
if(terms.every(function(w){return h.indexOf(w)>-1}))hits.push({s:s,x:x,at:x.t.toLowerCase().indexOf(terms[0])})})});
box.style.display='none';res.style.display='block';
if(!hits.length){res.textContent='Tidak ada hasil untuk "'+q.value+'".';return}
res.innerHTML='<strong>'+hits.length+' hasil</strong>'+hits.slice(0,40).map(function(r){var st=Math.max(0,r.at-60),sn=r.x.t.slice(st,st+180);
var m=esc(sn);terms.forEach(function(w){m=m.replace(new RegExp(esc(w).replace(/[.*+?^$()|[\\]\\\\{}]/g,'\\\\$&'),'ig'),function(z){return '<mark>'+z+'</mark>'})});
return '<a href="'+r.s.page+'#'+r.x.id+'"><strong>'+esc(r.s.name)+'</strong> · '+esc(r.x.h)+'<br><small>'+(st>0?'…':'')+m+'…</small></a>'}).join('')});
})();</script></body></html>
`;
}

const pages = {};
// halaman indeks (README)
{
  const body = readme.replace(/^---[\s\S]*?---\n/, '');
  const { html } = render(body.replace(/\[([\w-]+)\.md\]\(\1\.md\)/g, (m, slug) => `[Buka halaman](${slug}.html)`));
  pages['index.html'] = layout({ title: 'Indeks', current: 'index', content: `<div class="card">${html}</div>` });
}
for (const s of sports) {
  const { html } = render(s.body);
  const m = html.match(/^<h1[^>]*>.*?<\/h1>/s);
  const rest = m ? html.slice(m[0].length) : html;
  pages[s.page] = layout({ title: s.fm.name, current: s.slug, content: `${m ? m[0] : ''}${paramTable(s.fm)}<div class="card">${rest}</div>` });
}
const searchIndex = [{ slug: 'index', name: 'Tujuh istilah umum', page: 'index.html', sections: readme.replace(/^---[\s\S]*?---\n/, '').split(/^(?=## )/m).slice(1).map(sec => { const h = sec.split('\n')[0].replace(/^## /, ''); return { id: /^\d+\.\d+/.test(h) ? 's' + h.match(/^\d+\.\d+/)[0].replace('.', '-') : h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), h, t: plainText(sec.split('\n').slice(1).join('\n')) }; }) }]
  .concat(sports.map(s => ({
    slug: s.slug, name: s.fm.name, page: s.page,
    sections: s.body.split(/^(?=## )/m).map(sec => { const h = (sec.split('\n')[0].match(/^#{1,2} (.*)/) || [, s.fm.name])[1]; const num = h.match(/^(\d+\.\d+)\b/); return { id: num ? 's' + num[1].replace('.', '-') : '', h, t: plainText(sec.split('\n').slice(1).join('\n')) }; }),
  })));
const searchJs = `/* GENERATED oleh scripts/build-rulebook.mjs. Jangan diedit tangan. */\nwindow.RULEBOOK_SEARCH = ${JSON.stringify(searchIndex)};\n`;

// ---------------------------------------------------------------- tulis atau periksa
const outputs = { [path.join(ROOT, 'assets', 'rulebook-data.js')]: dataJs, [path.join(DIR, 'search-index.js')]: searchJs, ...Object.fromEntries(Object.entries(pages).map(([n, h]) => [path.join(DIR, n), h])) };
let stale = 0;
for (const [file, content] of Object.entries(outputs)) {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (CHECK) { if (cur !== content) { console.error('Usang: ' + path.relative(ROOT, file)); stale++; } }
  else if (cur !== content) fs.writeFileSync(file, content);
}
if (CHECK && stale) { console.error(`\n${stale} file hasil generate usang. Jalankan: node scripts/build-rulebook.mjs`); process.exit(1); }
console.log(CHECK ? `OK: ${Object.keys(outputs).length} file hasil generate up to date` : `Ditulis: ${Object.keys(outputs).length} file (${sports.length} halaman cabor + indeks + data + pencarian)`);
