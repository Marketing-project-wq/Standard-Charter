import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, stringify, splitFrontmatter } from '../scripts/yaml-lite.mjs';

test('skalar, list, map bersarang, komentar', () => {
  const y = `
sport: badminton   # slug
number: 1
verified: false
ratio: 0.5
cap: null
date: 2026-10-16
list: [a, b, 3]
nested:
  x: 1
  y:
    z: "a: b"
items:
  - id: v5
    from: 2025-04-26
    overrides: {points: 21, cap: 30}
  - id: v6
    overrides: {points: 15}
tags:
  - one
  - two
`;
  assert.deepEqual(parse(y), {
    sport: 'badminton', number: 1, verified: false, ratio: 0.5, cap: null, date: '2026-10-16',
    list: ['a', 'b', 3], nested: { x: 1, y: { z: 'a: b' } },
    items: [{ id: 'v5', from: '2025-04-26', overrides: { points: 21, cap: 30 } }, { id: 'v6', overrides: { points: 15 } }],
    tags: ['one', 'two'],
  });
});

test('stringify lalu parse menghasilkan objek yang sama', () => {
  const o = {
    sport: 'table-tennis', name: 'Table Tennis (Tenis Meja)', note: 'a: b # c', n: 0, empty: [], none: {}, nul: null,
    f: false, s: 'true', num: '12', pts: [1, 2, 3], long: ['satu dua tiga empat lima', 'enam tujuh delapan sembilan sepuluh', 'sebelas dua belas'],
    markers: [{ at: '1.2', field: 'x.y', affects_scoring: false }, { at: '1.8', field: 'z', affects_scoring: true }],
    deep: { a: { b: { c: [{ k: 1, v: { w: 2 } }] } } },
  };
  assert.deepEqual(parse(stringify(o)), o);
});

test('frontmatter dipisahkan dari badan', () => {
  const { data, body } = splitFrontmatter('---\nsport: x\nn: 2\n---\n\n# Judul\n');
  assert.deepEqual(data, { sport: 'x', n: 2 });
  assert.equal(body, '\n# Judul\n');
});

test('error jelas untuk key ganda dan indentasi salah', () => {
  assert.throws(() => parse('a: 1\na: 2'), /ganda/);
  assert.throws(() => parse('a:\n  b: 1\n c: 2'), /indentasi/);
  assert.throws(() => parse('a: "terbuka'), /ditutup/);
});
