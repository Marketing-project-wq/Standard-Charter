import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRulebookFile, validateRulebookSet } from '../scripts/rulebook-schema.mjs';
import { parse, stringify, splitFrontmatter } from '../scripts/yaml-lite.mjs';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../rulebook');
const load = () => Object.fromEntries(fs.readdirSync(DIR).filter(f => /^\d+-.*\.md$/.test(f)).map(f => [f, fs.readFileSync(path.join(DIR, f), 'utf8')]));
const edit = (md, fn) => { const { data, body } = splitFrontmatter(md); fn(data); return `---\n${stringify(data)}\n---\n${body}`; };

test('21 file cabor ada dan semuanya valid', () => {
  const files = load();
  assert.equal(Object.keys(files).length, 21);
  assert.deepEqual(validateRulebookSet(files), []);
});

test('nomor cabor lengkap 1-22 (basketball putra dan putri satu file)', () => {
  const nums = Object.values(load()).flatMap(md => { const { data } = splitFrontmatter(md); return data.numbers || [data.number]; }).sort((a, b) => a - b);
  assert.deepEqual(nums, Array.from({ length: 22 }, (_, i) => i + 1));
});

test('null tanpa unverified_fields ditolak', () => {
  const md = edit(load()['04-table-tennis.md'], d => { d.unverified_fields = []; d.verified = true; });
  const errs = validateRulebookFile('04-table-tennis.md', md);
  assert.ok(errs.some(e => /games_to_win_match: bernilai null/.test(e)), errs.join('\n'));
});

test('verified true dengan unverified_fields ditolak', () => {
  const md = edit(load()['06-football.md'], d => { d.verified = true; });
  assert.ok(validateRulebookFile('06-football.md', md).some(e => /verified: true tetapi/.test(e)));
});

test('tipe salah dan key tidak dikenal ditolak', () => {
  const md = edit(load()['01-badminton.md'], d => { d.points_to_win_game = '21'; d.typo_field = 1; });
  const errs = validateRulebookFile('01-badminton.md', md).join('\n');
  assert.match(errs, /points_to_win_game: harus bilangan bulat/);
  assert.match(errs, /typo_field: key tidak dikenal/);
});

test('penanda Verifikasi di badan harus dipetakan di markers', () => {
  const md = load()['01-badminton.md'].replace('## 1.1 Ringkasan format', '## 1.1 Ringkasan format\n\n⚠️ Verifikasi tambahan\n');
  assert.ok(validateRulebookFile('01-badminton.md', md).some(e => /markers: badan MD punya 3/.test(e)));
});

test('nama file harus sama dengan sport dan nomor', () => {
  assert.match(validateRulebookFile('07-voli.md', load()['07-futsal.md']).join('\n'), /sport: "futsal" tidak sama/);
  assert.match(validateRulebookFile('09-futsal.md', load()['07-futsal.md']).join('\n'), /number: 7 tidak sama/);
});

test('Cage Cricket: result_type null, input manual, tidak terverifikasi', () => {
  const { data } = splitFrontmatter(load()['13-cage-cricket.md']);
  assert.equal(data.result_type, null);
  assert.equal(data.manual_input_required, true);
  assert.equal(data.verified, false);
});

test('Hyrox: bobot sled ada di unverified_fields', () => {
  const { data } = splitFrontmatter(load()['22-hyrox.md']);
  assert.equal(data.verified, false);
  assert.ok(data.unverified_fields.includes('station_weights.sled_push'));
  assert.ok(data.unverified_fields.includes('station_weights.sled_pull'));
});

test('Badminton: sistem 15 poin berlaku 4 Januari 2027', () => {
  const { data } = splitFrontmatter(load()['01-badminton.md']);
  const v6 = data.variants.find(v => v.id === 'bwf_laws_v6');
  assert.equal(v6.effective_from, '2027-01-04');
  assert.equal(v6.overrides.points_to_win_game, 15);
});

test('yaml roundtrip semua frontmatter', () => {
  for (const [name, md] of Object.entries(load())) {
    const { data } = splitFrontmatter(md);
    assert.deepEqual(parse(stringify(data)), data, name);
  }
});
