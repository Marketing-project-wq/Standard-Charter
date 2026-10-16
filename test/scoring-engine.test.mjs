import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { splitFrontmatter } from '../scripts/yaml-lite.mjs';

const require = createRequire(import.meta.url);
const S = require('../assets/scoring-engine.js');
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../rulebook');
const rules = slug => {
  const f = fs.readdirSync(DIR).find(n => n.replace(/^\d+-/, '') === slug + '.md');
  return splitFrontmatter(fs.readFileSync(path.join(DIR, f), 'utf8')).data;
};
const R = (slug, opts) => S.resolveRules(rules(slug), { date: '2026-10-16', ...opts });

// memainkan satu game dengan skor akhir [a, b]: bergantian lalu sisa poin pihak yang menang
function playGame(m, [a, b]) {
  let n = m; const left = [a, b];
  while (left[0] > 0 || left[1] > 0) for (const s of [0, 1]) if (left[s] > 0) { n = S.addPoint(n, s); left[s]--; }
  return n;
}

// ---------------------------------------------------------------- resolveRules
test('resolveRules: badminton memakai 21 poin sampai 3 Jan 2027 dan 15 poin mulai 4 Jan 2027', () => {
  assert.equal(R('badminton').params.points_to_win_game, 21);
  assert.equal(R('badminton', { date: '2027-01-03' }).params.points_to_win_game, 21);
  const v6 = R('badminton', { date: '2027-01-04' });
  assert.equal(v6.params.points_to_win_game, 15);
  assert.deepEqual(v6.applied, ['bwf_laws_v6']);
  assert.ok(v6.uncertain.includes('bwf_laws_v6:point_cap'));
  assert.equal(v6.verified, false);
});

test('resolveRules: parameter null dilaporkan, override operator menghapus peringatan', () => {
  const r = R('padel');
  assert.equal(r.params.deuce_rule, null);
  assert.ok(r.unverified.includes('deuce_rule'));
  const o = R('padel', { overrides: { deuce_rule: 'golden_point' } });
  assert.equal(o.params.deuce_rule, 'golden_point');
  assert.ok(!o.unverified.includes('deuce_rule'));
  assert.deepEqual(o.overridden, ['deuce_rule']);
});

test('resolveRules: nilai contoh dari options hanya sebagai pengganti simulasi dan tetap tidak terverifikasi', () => {
  const r = R('table-tennis', { useOptionFallbacks: true });
  assert.equal(r.params.games_to_win_match, 3);
  assert.deepEqual(r.assumed, ['games_to_win_match']);
  assert.ok(r.unverified.includes('games_to_win_match'));
});

test('createMatch menolak parameter yang belum ditetapkan rulebook', () => {
  assert.throws(() => S.createMatch(R('table-tennis').params), /games_to_win_match/);
  assert.throws(() => S.createMatch(R('darts').params), /legs_to_win_match/);
});

// ---------------------------------------------------------------- badminton
test('badminton: 21–18, 19–21, 21–15 -> pemenang 2–1', () => {
  let m = S.createMatch(R('badminton').params);
  for (const g of [[21, 18], [19, 21], [21, 15]]) m = playGame(m, g);
  const s = S.summarize(m);
  assert.deepEqual(s.games, [[21, 18], [19, 21], [21, 15]]);
  assert.deepEqual(s.wins, [2, 1]);
  assert.equal(s.winner, 0);
  assert.equal(s.status, 'done');
});

test('badminton: 20–20 butuh selisih 2, dan 29–29 poin ke-30 menentukan game', () => {
  const p = R('badminton').params;
  let m = playGame(S.createMatch(p), [22, 20]);
  assert.deepEqual(S.summarize(m).games, [[22, 20]]);
  m = S.createMatch(p);
  for (let i = 0; i < 29; i++) { m = S.addPoint(m, 0); m = S.addPoint(m, 1); }
  assert.deepEqual(S.summarize(m).current, [29, 29]);
  m = S.addPoint(m, 1);
  assert.deepEqual(S.summarize(m).games, [[29, 30]]);
});

test('badminton: sistem baru 15 poin berlaku lewat tanggal pertandingan', () => {
  const m = playGame(S.createMatch(R('badminton', { date: '2027-01-04' }).params), [15, 10]);
  assert.deepEqual(S.summarize(m).games, [[15, 10]]);
});

// ---------------------------------------------------------------- tenis meja, pickleball
test('table tennis: game ke 11 selisih 2 tanpa batas poin', () => {
  const p = R('table-tennis', { overrides: { games_to_win_match: 3 } }).params;
  let m = playGame(S.createMatch(p), [11, 7]);
  m = playGame(m, [9, 11]); m = playGame(m, [11, 8]); m = playGame(m, [12, 10]);
  assert.deepEqual(S.summarize(m).games, [[11, 7], [9, 11], [11, 8], [12, 10]]);
  assert.deepEqual(S.summarize(m).wins, [3, 1]);
});

test('pickleball side-out: hanya server yang mencetak poin', () => {
  const p = R('pickleball', { overrides: { games_to_win_match: 1 } }).params;
  let m = S.createMatch(p, { server: 0 });
  for (let i = 0; i < 4; i++) m = S.addPoint(m, 0);       // server A menang 4 rally berturut-turut
  assert.deepEqual(S.summarize(m).current, [4, 0]);
  m = S.addPoint(m, 1);                                    // B menang rally saat A servis: side-out, tanpa poin
  assert.deepEqual(S.summarize(m).current, [4, 0]);
  assert.equal(S.summarize(m).server, 1);
  m = S.addPoint(m, 1);                                    // sekarang B server dan mencetak poin
  assert.deepEqual(S.summarize(m).current, [4, 1]);
});

// ---------------------------------------------------------------- voli
test('voli: set 5 sampai 15 dan poin liga 3–2 -> 2 dan 1', () => {
  const p = R('volleyball').params;
  let m = S.createMatch(p);
  for (const g of [[25, 20], [22, 25], [25, 23], [18, 25]]) m = playGame(m, g);
  m = playGame(m, [15, 13]);
  const s = S.summarize(m);
  assert.deepEqual(s.wins, [3, 2]);
  assert.deepEqual(s.games.at(-1), [15, 13]);
  assert.deepEqual(S.leaguePointsBySetScore(p, 3, 2), { winner: 2, loser: 1 });
  assert.deepEqual(S.leaguePointsBySetScore(p, 3, 0), { winner: 3, loser: 0 });
  assert.deepEqual(S.leaguePointsBySetScore(p, 3, 1), { winner: 3, loser: 0 });
});

test('voli: set 1–4 tidak berhenti di 25–24 (selisih 2)', () => {
  let m = S.createMatch(R('volleyball').params);
  for (let i = 0; i < 24; i++) { m = S.addPoint(m, 0); m = S.addPoint(m, 1); }
  m = S.addPoint(m, 0);
  assert.deepEqual(S.summarize(m).current, [25, 24]);
  m = S.addPoint(m, 0);
  assert.deepEqual(S.summarize(m).games, [[26, 24]]);
});

// ---------------------------------------------------------------- tenis dan padel
const point = (m, s, n = 1) => { for (let i = 0; i < n; i++) m = S.addPoint(m, s); return m; };
const game = (m, s) => point(m, s, 4);
const set6 = (m, s, lose = 0) => { for (let i = 0; i < 6; i++) { m = game(m, s); if (i < lose) m = game(m, 1 - s); } return m; };

test('tenis: 6–3, 6–7(5), 10–8 -> pemenang 2–1 set (match tie-break)', () => {
  const p = R('tennis').params;
  let m = S.createTennisMatch(p, { matchTiebreak: true });
  m = set6(m, 0, 3);                                         // 6–3
  for (let i = 0; i < 5; i++) { m = game(m, 0); m = game(m, 1); } // 5–5
  m = game(m, 1); m = game(m, 0);                            // 6–6 (B 6, A 6)
  assert.deepEqual(m.tb, [0, 0]);
  m = point(m, 0, 5); m = point(m, 1, 7);                    // tie-break 5–7
  assert.deepEqual(S.summarize(m).games[1], [6, 7]);
  assert.deepEqual(S.summarize(m).tiebreaks[1], [5, 7]);
  assert.ok(m.mtb);                                          // set penentu diganti match tie-break 10 poin
  for (let i = 0; i < 8; i++) { m = point(m, 0); m = point(m, 1); } // 8–8
  m = point(m, 0, 2);                                        // 10–8
  const s = S.summarize(m);
  assert.deepEqual(s.games[2], [10, 8]);
  assert.deepEqual(s.wins, [2, 1]);
  assert.equal(s.winner, 0);
});

test('tenis: hitungan poin 15/30/40, deuce dan advantage', () => {
  let m = S.createTennisMatch(R('tennis').params);
  m = point(m, 0, 3); m = point(m, 1, 3);
  assert.deepEqual(S.tennisPointLabel(m), ['40', '40']);
  m = point(m, 0);
  assert.deepEqual(S.tennisPointLabel(m), ['AD', '40']);
  m = point(m, 1);
  assert.deepEqual(S.tennisPointLabel(m), ['40', '40']);
  m = point(m, 1, 2);
  assert.deepEqual(m.g, [0, 1]);
});

test('padel: deuce_rule belum ditetapkan -> mesin menolak menebak', () => {
  const m = S.createTennisMatch(R('padel').params);
  assert.throws(() => point(m, 0), /deuce_rule/);
});

test('padel: golden point di 40–40 satu poin menentukan game', () => {
  let m = S.createTennisMatch(R('padel', { overrides: { deuce_rule: 'golden_point' } }).params);
  m = point(m, 0, 3); m = point(m, 1, 3); m = point(m, 1);
  assert.deepEqual(m.g, [0, 1]);
});

test('padel: star point tiga tahap', () => {
  let m = S.createTennisMatch(R('padel', { overrides: { deuce_rule: 'star_point' } }).params);
  m = point(m, 0, 3); m = point(m, 1, 3);        // deuce #1
  m = point(m, 0); m = point(m, 1);              // advantage A, B menang poin -> deuce #2
  assert.deepEqual(S.tennisPointLabel(m), ['40', '40']);
  m = point(m, 0); m = point(m, 1);              // advantage kedua A, B menang poin -> Star Point
  assert.deepEqual(m.g, [0, 0]);
  m = point(m, 0);                               // Star Point: satu poin penentu
  assert.deepEqual(m.g, [1, 0]);
});

test('padel: set sampai 6 selisih 2, tie-break pada 6–6', () => {
  let m = S.createTennisMatch(R('padel', { overrides: { deuce_rule: 'golden_point' } }).params);
  for (let i = 0; i < 5; i++) { m = game(m, 0); m = game(m, 1); }
  m = game(m, 0); m = game(m, 1);
  assert.deepEqual(m.tb, [0, 0]);
});

// ---------------------------------------------------------------- darts
const D = (r, n) => ({ r, n });
test('darts 501: T20 + T20 + D18 = 156 -> sisa 345', () => {
  let m = S.createMatch(R('darts', { overrides: { legs_to_win_match: 3 } }).params);
  const r = S.addVisit(m, 0, [D('T', 20), D('T', 20), D('D', 18)]);
  assert.equal(r.scored, 156);
  assert.equal(r.match.remaining[0], 345);
});

test('darts: bust (lebih dari sisa, sisa 1, atau 0 tanpa double) membuat giliran hangus', () => {
  const base = S.createMatch(R('darts', { overrides: { legs_to_win_match: 3 } }).params);
  const at = rem => ({ ...base, remaining: [rem, 501] });
  let r = S.addVisit(at(40), 0, [D('T', 20)]);                       // 60 > 40
  assert.ok(r.bust); assert.equal(r.match.remaining[0], 40); assert.equal(r.scored, 0);
  r = S.addVisit(at(40), 0, [D('S', 20), D('S', 20)]);               // 0 tanpa double
  assert.ok(r.bust); assert.equal(r.match.remaining[0], 40);
  r = S.addVisit(at(40), 0, [D('S', 20), D('S', 19)]);               // menyisakan 1
  assert.ok(r.bust); assert.equal(r.match.remaining[0], 40);
  r = S.addVisit(at(2), 0, [D('S', 1)]);                              // menyisakan 1
  assert.ok(r.bust);
});

test('darts: checkout harus di double atau bullseye, dart setelah menutup tidak dihitung', () => {
  const base = S.createMatch(R('darts', { overrides: { legs_to_win_match: 2 } }).params);
  let r = S.addVisit({ ...base, remaining: [32, 501] }, 0, [D('D', 16), D('T', 20)]);
  assert.ok(r.checkout); assert.deepEqual(r.match.legs, [1, 0]);
  r = S.addVisit({ ...base, remaining: [170, 501] }, 0, [D('T', 20), D('T', 20), D('B', 25)]);
  assert.ok(r.checkout);
  r = S.addVisit({ ...base, remaining: [40, 501] }, 0, [D('D', 20)]);
  assert.ok(r.checkout);
});

test('darts: best of N leg -> pemain yang mencapai legs_to_win_match menang pertandingan', () => {
  let m = S.createMatch(R('darts', { overrides: { legs_to_win_match: 2 } }).params);
  for (let leg = 0; leg < 2; leg++) { m = { ...m, remaining: [32, 501] }; m = S.addVisit(m, 0, [D('D', 16)]).match; }
  assert.equal(m.winner, 0); assert.equal(m.status, 'done');
});

test('darts: checkout maksimum 170 dan angka yang tidak bisa di-checkout 3 dart', () => {
  assert.equal(R('darts').params.max_checkout, 170);
  assert.ok(S.checkoutPossible(170));
  for (const n of [169, 168, 166, 165, 163, 162, 159]) assert.equal(S.checkoutPossible(n), false, String(n));
  assert.ok(S.checkoutPossible(40) && S.checkoutPossible(32) && S.checkoutPossible(100));
});

test('darts: rata-rata tiga dart 501 dalam 15 dart = 100,2', () => {
  assert.equal(S.threeDartAverage(501, 15), 100.2);
});

// ---------------------------------------------------------------- pool
test('pool: race to 3, skor 3–1 -> pemenang', () => {
  let m = S.createMatch(R('pool', { overrides: { frames_to_win_match: 3 } }).params);
  m = S.addPoint(m, 0); m = S.addPoint(m, 1); m = S.addPoint(m, 0); m = S.addPoint(m, 0);
  assert.deepEqual(S.summarize(m).wins, [3, 1]);
  assert.equal(m.winner, 0);
});

// ---------------------------------------------------------------- bowling
test('bowling: strike lalu 7+2 -> frame 1 = 19, frame 2 = 9, total 28', () => {
  const r = S.scoreBowling(R('bowling').params, [10, 7, 2]);
  assert.equal(r.frames[0].score, 19);
  assert.equal(r.frames[1].score, 9);
  assert.equal(r.total, 28);
});

test('bowling: 12 strike berturut-turut = 300', () => {
  const r = S.scoreBowling(R('bowling').params, Array(12).fill(10));
  assert.equal(r.total, 300);
  assert.ok(r.complete);
  assert.equal(r.frames[9].rolls.length, 3);
});

test('bowling: spare dan frame ke-10', () => {
  const p = R('bowling').params;
  assert.equal(S.scoreBowling(p, [9, 1, 5, 3]).frames[0].score, 15);
  const rolls = [...Array(9).fill(0).flatMap(() => [0, 0]), 7, 3, 5];
  const r = S.scoreBowling(p, rolls);
  assert.equal(r.frames[9].score, 15);
  assert.equal(r.total, 15);
});

test('bowling: frame yang belum selesai tidak dihitung dulu', () => {
  const r = S.scoreBowling(R('bowling').params, [10, 10]);
  assert.equal(r.frames[0].score, null);
  assert.equal(r.total, 0);
  assert.equal(r.frames[0].mark, 'X');
});

test('bowling: Current Frame Scoring (opsi World Bowling) strike = 30, maksimal tetap 300', () => {
  const p = R('bowling', { overrides: { scoring_system: 'current_frame' } }).params;
  assert.equal(S.scoreBowling(p, Array(12).fill(10)).total, 300);
  assert.equal(S.scoreBowling(p, [10, 7, 2]).frames[0].score, 30);
  assert.equal(S.scoreBowling(p, [6, 4, 5, 0]).frames[0].score, 16); // spare = 10 + bola pertama
});

// ---------------------------------------------------------------- olahraga skor
test('basket: 8 dua angka + 4 tiga angka + 6 lemparan bebas = 34', () => {
  let m = S.createScoreMatch(R('basketball').params);
  for (let i = 0; i < 8; i++) m = S.scoreEvent(m, 0, 'two_pointer');
  for (let i = 0; i < 4; i++) m = S.scoreEvent(m, 0, 'three_pointer');
  for (let i = 0; i < 6; i++) m = S.scoreEvent(m, 0, 'free_throw');
  assert.equal(m.score[0], 34);
});

test('basket: 4 kuarter 10 menit, seri -> overtime 5 menit sampai ada pemenang', () => {
  let m = S.createScoreMatch(R('basketball').params);
  assert.equal(m.clock, 600);
  for (let q = 0; q < 4; q++) { m = S.tickClock(m, 600); }
  assert.equal(m.status, 'live'); assert.equal(m.ot, 1); assert.equal(m.clock, 300); // seri 0–0
  m = S.tickClock(m, 300);
  assert.equal(m.ot, 2);                                                            // masih seri -> OT lagi
  m = S.scoreEvent(m, 1, 'two_pointer'); m = S.tickClock(m, 300);
  assert.equal(m.status, 'ft'); assert.equal(m.winner, 1);
});

test('football: 2 × 45 menit, seri di fase gugur -> perpanjangan 2 × 15 lalu adu penalti', () => {
  let m = S.createScoreMatch(R('football').params);
  assert.equal(m.clock, 2700);
  m = S.tickClock(m, 2700); assert.equal(m.period, 2);
  m = S.tickClock(m, 2700); assert.equal(m.ot, 1); assert.equal(m.clock, 900);
  m = S.tickClock(m, 900); assert.equal(m.otPeriod, 2);
  m = S.tickClock(m, 900); assert.equal(m.status, 'shootout');
});

test('football: gol langsung menang, liga 3-1-0 dan tidak ada jenis skor di luar rulebook', () => {
  const p = R('football').params;
  let m = S.createScoreMatch(p);
  m = S.scoreEvent(m, 0, 'goal'); m = S.scoreEvent(m, 0, 'goal'); m = S.scoreEvent(m, 1, 'goal');
  assert.deepEqual(m.score, [2, 1]);
  assert.equal(S.leaguePoints(p, 'win'), 3);
  assert.equal(S.leaguePoints(p, 'draw'), 1);
  assert.equal(S.leaguePoints(p, 'loss'), 0);
  assert.throws(() => S.scoreEvent(m, 0, 'three_pointer'), /tidak ada di rulebook/);
});

test('basket: poin liga menang 2, kalah 1, kalah forfeit 0, walkover 20–0', () => {
  const p = R('basketball').params;
  assert.deepEqual([S.leaguePoints(p, 'win'), S.leaguePoints(p, 'loss'), S.leaguePoints(p, 'loss_forfeit')], [2, 1, 0]);
  assert.deepEqual(p.walkover.score, [20, 0]);
});

test('futsal: lama babak belum ditetapkan rulebook -> mesin menolak menebak', () => {
  assert.throws(() => S.createScoreMatch(R('futsal').params), /period_minutes/);
  const m = S.createScoreMatch(R('futsal', { overrides: { period_minutes: 20 } }).params);
  assert.equal(m.clock, 1200);
});

test('netball: 4 kuarter 15 menit dan poin liga seri belum ditetapkan', () => {
  const p = R('netball').params;
  assert.equal(S.createScoreMatch(p).clock, 900);
  assert.equal(S.leaguePoints(p, 'win'), 3);
  assert.equal(S.leaguePoints(p, 'draw'), null);
});

// ---------------------------------------------------------------- cricket
function innings(m, runsList, wkts) {
  let n = m; let w = 0;
  for (const r of runsList) { n = S.cricketBall(n, { runs: r, wicket: w < wkts && r === 0 && (w++, true) }); }
  return n;
}
test('cricket: A 160/6 dalam 20 over, B 155/8 -> A menang 5 run', () => {
  let m = S.createCricket(R('cricket').params);
  const a = Array(120).fill(0); let left = 160; // 6 wicket di bola 0..5 (dot), lalu 160 run
  for (let i = 6; i < 120 && left > 0; i++) { const r = Math.min(2, left); a[i] = r; left -= r; }
  for (let i = 0; i < 120; i++) m = S.cricketBall(m, { runs: a[i], wicket: i < 6 });
  assert.equal(m.inns[0].runs, 160); assert.equal(m.inns[0].wkts, 6); assert.equal(m.cur, 1); assert.equal(m.target, 161);
  const b = Array(120).fill(0); left = 155;
  for (let i = 8; i < 120 && left > 0; i++) { const r = Math.min(2, left); b[i] = r; left -= r; }
  for (let i = 0; i < 120; i++) m = S.cricketBall(m, { runs: b[i], wicket: i < 8 });
  assert.equal(m.status, 'done'); assert.equal(m.winner, 0);
  assert.deepEqual(m.result, { by: 'runs', margin: 5 });
  assert.equal(S.runRate(160, 120), 8);
});

test('cricket: wide dan no-ball +1 run tanpa menghabiskan bola, free hit hanya run out', () => {
  let m = S.createCricket(R('cricket').params);
  m = S.cricketBall(m, { extra: 'wide' });
  assert.equal(m.inns[0].runs, 1); assert.equal(m.inns[0].balls, 0);
  m = S.cricketBall(m, { extra: 'no_ball' });
  assert.equal(m.inns[0].runs, 2); assert.equal(m.inns[0].balls, 0); assert.equal(m.freeHit, true);
  m = S.cricketBall(m, { wicket: true, how: 'bowled' });       // free hit: tidak out
  assert.equal(m.inns[0].wkts, 0); assert.equal(m.inns[0].balls, 1);
  m = S.cricketBall(m, { wicket: true, how: 'bowled' });
  assert.equal(m.inns[0].wkts, 1);
});

test('cricket: innings selesai saat 10 wicket atau 20 over; chasing selesai saat target tercapai', () => {
  let m = S.createCricket(R('cricket').params);
  for (let i = 0; i < 10; i++) m = S.cricketBall(m, { wicket: true });
  assert.equal(m.cur, 1);
  m = S.cricketBall(m, { runs: 6 });
  assert.equal(m.status, 'done'); assert.equal(m.winner, 1); assert.equal(m.result.by, 'wickets');
});

test('cricket: net run rate dan label over', () => {
  assert.equal(S.oversLabel(123), '20.3');
  assert.equal(S.netRunRate(160, 120, 155, 120), 0.25);
});

// ---------------------------------------------------------------- waktu
test('renang: A 28,41 s, B 28,55 s, C 28,55 s -> juara 1, lalu B dan C seri posisi 2', () => {
  const rows = S.rankTimed([{ id: 'A', seconds: 28.41 }, { id: 'B', seconds: 28.55 }, { id: 'C', seconds: 28.55 }], R('swimming').params);
  assert.deepEqual(rows.map(r => [r.id, r.rank]), [['A', 1], ['B', 2], ['C', 2]]);
  assert.equal(rows[0].display, '28.41');
});

test('renang: DNS, DNF, DQ tidak masuk peringkat', () => {
  const rows = S.rankTimed([{ id: 'A', seconds: 30 }, { id: 'B', status: 'DQ' }, { id: 'C', status: 'DNS' }, { id: 'D', status: 'DNF', seconds: 99 }], R('swimming').params);
  assert.deepEqual(rows.map(r => r.rank), [1, null, null, null]);
});

test('dragon boat: 2:04,50 + penalti 5 detik = 2:09,50 kalah dari 2:06,20', () => {
  const rows = S.rankTimed([{ id: 'A', seconds: 124.5, penalties: { FALSE_START_REPEAT: 1 } }, { id: 'B', seconds: 126.2 }], R('dragon-boat').params);
  assert.equal(rows[0].id, 'B');
  assert.equal(rows[1].display, '2:09.50');
  assert.equal(rows[1].rank, 2);
});

test('dragon boat: penalti tanpa nilai detik di rulebook ditandai, tidak ditebak', () => {
  const rows = S.rankTimed([{ id: 'A', seconds: 100, penalties: { LANE_INTERFERENCE: 1 } }], R('dragon-boat').params);
  assert.deepEqual(rows[0].unknownPenalties, ['LANE_INTERFERENCE']);
  assert.equal(rows[0].adjusted, 100);
});

test('hyrox: lari 40:00 + stasiun 35:00 + transisi 3:00 + penalti 0:20 = 1:18:20', () => {
  const base = 40 * 60 + 35 * 60 + 3 * 60;
  const params = { ...R('hyrox').params, time_precision: 1, penalties: [{ code: 'CONTOH_20_DETIK', seconds: 20 }] };
  const rows = S.rankTimed([{ id: 'A', seconds: base, penalties: { CONTOH_20_DETIK: 1 } }], params);
  assert.equal(rows[0].adjusted, base + 20);
  assert.equal(S.formatTime(rows[0].adjusted), '1:18:20');
});

test('hyrox: penalti sesuai rulebook (menit ke detik)', () => {
  const pen = Object.fromEntries(R('hyrox').params.penalties.map(x => [x.code, x.seconds]));
  assert.equal(pen.EXIT_STATION_VIA_IN_GATE, 120);
  assert.equal(pen.RUN_SHORT_2_LAPS, 420);
  assert.equal(pen.RUN_SHORT_3_LAPS, 300);
  assert.equal(pen.RUN_SHORT_4_LAPS, 180);
  assert.equal(pen.FARMERS_CARRY_WRONG_KETTLEBELL_RETURN, 30);
});

test('formatTime: menit dan jam', () => {
  assert.equal(S.formatTime(6.1, 0.01), '6.10');
  assert.equal(S.formatTime(129.5, 0.01), '2:09.50');
  assert.equal(S.formatTime(3600 + 62.25, 0.01), '1:01:02.25');
});

// ---------------------------------------------------------------- golf
test('golf: 78 pukulan di par 72 = +6; stableford par(2) + bogey(1) + birdie(3) = 6', () => {
  const p = R('golf').params;
  assert.equal(S.golfToPar(78, 72), 6);
  const pts = [[4, 4], [5, 4], [3, 4]].map(([st, par]) => S.stablefordPoints(p, st, par));
  assert.deepEqual(pts, [2, 1, 3]);
  assert.equal(pts.reduce((a, b) => a + b, 0), 6);
});

test('golf: tabel stableford lengkap (double bogey = 0 sampai albatross = 5)', () => {
  const p = R('golf').params;
  assert.deepEqual([6, 5, 4, 3, 2, 1].map(st => S.stablefordPoints(p, st, 4)), [0, 1, 2, 3, 4, 5]);
  assert.equal(S.stablefordPoints(p, 8, 4), 0);
});

test('golf: tie-breaker count-back (9, 6, 3, 1 lubang terakhir)', () => {
  const a = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3];
  const b = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5];
  assert.equal(S.countBack(a, b), -1);
  assert.equal(S.countBack(a, a), 0);
});

// ---------------------------------------------------------------- klasemen
test('klasemen: poin liga lalu tiebreaker dari rulebook (football)', () => {
  const keys = R('football').params.tiebreakers;
  const rows = [
    { id: 'A', leaguePoints: 6, gf: 5, ga: 2 }, { id: 'B', leaguePoints: 6, gf: 4, ga: 0 }, { id: 'C', leaguePoints: 3, gf: 9, ga: 0 },
  ];
  assert.deepEqual(S.rankTable(rows, keys).map(r => r.id), ['B', 'A', 'C']);
  const h2h = (a, b) => (a === 'A' && b === 'B' ? 1 : a === 'B' && b === 'A' ? -1 : 0);
  assert.deepEqual(S.rankTable(rows, keys, { h2h }).map(r => r.id), ['A', 'B', 'C']);
});

test('Cage Cricket: tidak ada mesin skor, input manual panitia', () => {
  const r = R('cage-cricket');
  assert.equal(r.params.result_type, null);
  assert.equal(r.params.manual_input_required, true);
  assert.throws(() => S.createMatch(r.params));
});
