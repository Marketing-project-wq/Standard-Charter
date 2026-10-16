import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, inline } from '../scripts/md-lite.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('inline: tebal, miring, link http, penanda Verifikasi', () => {
  assert.equal(inline('**a** dan *b*'), '<strong>a</strong> dan <em>b</em>');
  assert.match(inline('[BWF](https://bwf.sport/x.pdf)'), /<a href="https:\/\/bwf.sport\/x.pdf" target="_blank" rel="noopener noreferrer">BWF<\/a>/);
  assert.match(inline('Raket 68 cm ⚠️ Verifikasi'), /<span class="mk">⚠️ Verifikasi<\/span>/);
});

test('semua HTML di-escape dan link berbahaya tidak dirender', () => {
  assert.equal(inline('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.ok(!inline('[x](javascript:alert(1))').includes('<a '));
  assert.ok(!inline('<img src=x onerror=alert(1)>').includes('<img'));
});

test('tabel dan daftar bersarang', () => {
  const { html } = render('| A | B |\n|---|---|\n| 1 | x \\| y |\n\n- satu\n  - dua\n- tiga\n\n1. a\n2. b');
  assert.match(html, /<table><thead><tr><th>A<\/th><th>B<\/th><\/tr><\/thead><tbody><tr><td>1<\/td><td>x \| y<\/td><\/tr>/);
  assert.match(html, /<ul><li>satu<ul><li>dua<\/li><\/ul><\/li><li>tiga<\/li><\/ul>/);
  assert.match(html, /<ol><li>a<\/li><li>b<\/li><\/ol>/);
});

test('blockquote Terkonfirmasi sumber resmi diberi kelas conf', () => {
  const { html } = render('> **Terkonfirmasi sumber resmi** · dicek 16 Okt 2026\n>\n> - isi');
  assert.match(html, /<blockquote class="conf">/);
});

test('file hasil generate (assets/rulebook-data.js, rulebook/*.html) sama dengan hasil build dari MD', () => {
  execFileSync('node', ['scripts/build-rulebook.mjs', '--check'], { cwd: ROOT, stdio: 'pipe' });
});
