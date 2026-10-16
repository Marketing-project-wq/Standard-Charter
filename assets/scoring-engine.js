/* Mesin scoring SC Games. Semua parameter datang dari frontmatter rulebook (rulebook/*.md),
 * dibangun menjadi assets/rulebook-data.js oleh scripts/build-rulebook.mjs.
 * Tidak ada angka aturan di file ini: kalau parameter bernilai null, mesin melaporkannya
 * (resolveRules().unverified) dan menolak menebak.
 *
 * Skrip klasik (UMD): dimuat lewat <script src> di browser sebagai window.SCORING,
 * dan lewat require() di test Node.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SCORING = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const clone = o => JSON.parse(JSON.stringify(o));
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] = a[k] ?? {}), o); t[last] = v; };

  // ================================================================ aturan efektif
  // rules: frontmatter satu cabor. opts: { date, overrides, variants, useOptionFallbacks }
  function resolveRules(rules, opts = {}) {
    const date = opts.date || new Date().toISOString().slice(0, 10);
    const p = clone(rules);
    const variants = p.variants || [];
    delete p.variants;
    const applied = [], uncertain = [], overridden = [], assumed = [];
    for (const v of variants) {
      const on = v.optional
        ? (opts.variants || []).includes(v.id)
        : v.effective_from <= date && (!v.effective_to || date <= v.effective_to);
      if (!on) continue;
      applied.push(v.id);
      for (const [k, val] of Object.entries(v.overrides || {})) {
        if (val === null) uncertain.push(v.id + ':' + k);
        else p[k] = val;
      }
    }
    for (const [k, val] of Object.entries(opts.overrides || {})) { setPath(p, k, val); overridden.push(k); }
    if (opts.useOptionFallbacks) {
      for (const [k, list] of Object.entries(p.options || {})) {
        if (list.length && getPath(p, k) === null) { setPath(p, k, list[0]); assumed.push(k); }
      }
    }
    // nilai pengganti (assumed) hanya agar simulasi berjalan: tetap dianggap belum terverifikasi
    const unverified = (p.unverified_fields || []).filter(f => !overridden.includes(f));
    return { params: p, applied, uncertain, overridden, assumed, unverified, verified: unverified.length === 0 && uncertain.length === 0, date };
  }

  function missing(params, keys) { return keys.filter(k => getPath(params, k) == null); }

  // ================================================================ game/set (rally_point, side_out)
  function createSetsMatch(params, opts = {}) {
    const need = missing(params, ['points_to_win_game', 'win_by', 'games_to_win_match']);
    if (need.length) throw new Error('Parameter belum ditetapkan rulebook: ' + need.join(', '));
    return { kind: 'sets', p: clone(params), games: [], cur: [0, 0], wins: [0, 0], server: opts.server ?? 0, status: 'live', winner: null };
  }
  function targetPoints(m) {
    const p = m.p; const need = p.games_to_win_match;
    const deciding = m.wins[0] === need - 1 && m.wins[1] === need - 1 && need > 1;
    if (deciding && p.deciding_game_points !== 'same' && p.deciding_game_points != null) return p.deciding_game_points;
    return p.points_to_win_game;
  }
  function gameDone(m, cur) {
    const t = targetPoints(m), by = m.p.win_by, cap = m.p.point_cap;
    for (const s of [0, 1]) {
      const a = cur[s], b = cur[1 - s];
      if (typeof cap === 'number' && a >= cap) return s;
      if (a >= t && a - b >= by) return s;
    }
    return -1;
  }
  function addPointSets(m, side) {
    if (m.status !== 'live') return m;
    const n = clone(m);
    if (n.p.scoring_mode === 'side_out' && side !== n.server) { n.server = side; return n; } // side-out: tidak ada poin
    n.cur[side]++; n.server = side;
    const w = gameDone(n, n.cur);
    if (w >= 0) {
      n.games.push([...n.cur]); n.wins[w]++; n.cur = [0, 0];
      if (n.wins[w] >= n.p.games_to_win_match) { n.status = 'done'; n.winner = w; }
    }
    return n;
  }

  // ================================================================ tenis / padel (tennis_points)
  const PT = ['0', '15', '30', '40'];
  function createTennisMatch(params, opts = {}) {
    const need = missing(params, ['games_per_set', 'set_win_by', 'sets_to_win_match']);
    if (need.length) throw new Error('Parameter belum ditetapkan rulebook: ' + need.join(', '));
    return { kind: 'tennis', p: clone(params), matchTiebreak: !!opts.matchTiebreak, sets: [], g: [0, 0], pts: [0, 0], tb: null, mtb: null, deuce: 1, setsWon: [0, 0], server: opts.server ?? 0, status: 'live', winner: null };
  }
  function tennisGameWon(n, side) {
    const o = 1 - side, a = n.pts[side], b = n.pts[o];
    const rule = n.p.deuce_rule;
    if (!rule) throw new Error('deuce_rule belum ditetapkan rulebook');
    if (rule === 'advantage') return a >= 4 && a - b >= 2;
    if (rule === 'golden_point') return a >= 4;
    // star_point: deuce #1 -> adv -> deuce #2 -> adv -> deuce #3 = Star Point (satu poin penentu)
    return a >= 4 && a - b >= 2;
  }
  function tennisPoint(n, side) {
    const o = 1 - side;
    const rule = n.p.deuce_rule;
    if (rule === 'star_point') {
      const both3 = n.pts[0] >= 3 && n.pts[1] >= 3;
      if (both3) {
        const d = n.pts[side] - n.pts[o];
        if (d === 0) { if (n.deuce >= 3) return true; n.pts[side]++; return false; }
        if (d === 1) return true;
        n.pts = [3, 3]; n.deuce++; return false; // lawan unggul kalah poin -> kembali deuce
      }
      n.pts[side]++;
      return n.pts[side] >= 4 && n.pts[side] - n.pts[o] >= 2;
    }
    n.pts[side]++;
    return tennisGameWon(n, side);
  }
  function finishSet(n, side, rec) {
    n.sets.push(rec); n.setsWon[side]++; n.g = [0, 0]; n.pts = [0, 0]; n.tb = null; n.deuce = 1;
    if (n.setsWon[side] >= n.p.sets_to_win_match) { n.status = 'done'; n.winner = side; }
    else if (n.matchTiebreak && n.p.match_tiebreak && n.setsWon[0] === n.p.sets_to_win_match - 1 && n.setsWon[1] === n.p.sets_to_win_match - 1) n.mtb = [0, 0];
  }
  function addPointTennis(m, side) {
    if (m.status !== 'live') return m;
    const n = clone(m); const o = 1 - side;
    if (n.mtb) { // match tie-break menggantikan set penentu
      n.mtb[side]++;
      const t = n.p.match_tiebreak;
      if (n.mtb[side] >= t.points && n.mtb[side] - n.mtb[o] >= t.win_by) { const rec = { g: [0, 0], mtb: [...n.mtb] }; n.mtb = null; n.sets.push(rec); n.setsWon[side]++; n.status = 'done'; n.winner = side; }
      return n;
    }
    if (n.tb) {
      n.tb[side]++;
      const t = n.p.tiebreak_game;
      if (n.tb[side] >= t.points_to_win && n.tb[side] - n.tb[o] >= t.win_by) { n.g[side]++; finishSet(n, side, { g: [...n.g], tb: [...n.tb] }); }
      return n;
    }
    if (!tennisPoint(n, side)) return n;
    n.g[side]++; n.pts = [0, 0]; n.deuce = 1; n.server = 1 - n.server;
    const gps = n.p.games_per_set, by = n.p.set_win_by;
    if (n.g[side] >= gps && n.g[side] - n.g[o] >= by) { finishSet(n, side, { g: [...n.g] }); return n; }
    if (n.p.tiebreak_game && n.g[0] === n.p.tiebreak_game.at_games && n.g[1] === n.p.tiebreak_game.at_games) n.tb = [0, 0];
    return n;
  }
  function tennisPointLabel(m) {
    if (m.mtb) return [String(m.mtb[0]), String(m.mtb[1])];
    if (m.tb) return [String(m.tb[0]), String(m.tb[1])];
    const [a, b] = m.pts;
    if (a >= 3 && b >= 3) { if (a === b) return ['40', '40']; return a > b ? ['AD', '40'] : ['40', 'AD']; }
    return [PT[a], PT[b]];
  }

  // ================================================================ dispatch game/set
  function createMatch(params, opts = {}) {
    if (params.result_type !== 'head_to_head_sets') throw new Error('createMatch hanya untuk head_to_head_sets');
    switch (params.scoring_mode) {
      case 'rally_point': case 'side_out': return createSetsMatch(params, opts);
      case 'tennis_points': return createTennisMatch(params, opts);
      case 'x01_countdown': return createX01Match(params, opts);
      case 'frame_race': return createFrameMatch(params, opts);
      default: throw new Error('scoring_mode tidak dikenal: ' + params.scoring_mode);
    }
  }
  function addPoint(m, side) {
    if (m.kind === 'sets') return addPointSets(m, side);
    if (m.kind === 'tennis') return addPointTennis(m, side);
    if (m.kind === 'frames') return winFrame(m, side);
    throw new Error('addPoint tidak berlaku untuk ' + m.kind);
  }
  // tampilan: { games: [[a,b],...], current: [a,b], winsLabel: [a,b], winner, status }
  function summarize(m) {
    if (m.kind === 'sets') return { games: m.games, current: m.cur, wins: m.wins, winner: m.winner, status: m.status, server: m.server };
    if (m.kind === 'tennis') return { games: m.sets.map(s => (s.mtb ? s.mtb : s.g)), tiebreaks: m.sets.map(s => s.tb || null), current: m.mtb || m.tb || m.g, pointLabels: tennisPointLabel(m), gamesInSet: m.g, wins: m.setsWon, winner: m.winner, status: m.status, server: m.server };
    if (m.kind === 'frames') return { games: [], current: m.wins, wins: m.wins, winner: m.winner, status: m.status };
    if (m.kind === 'x01') return { legs: m.legs, current: m.remaining, wins: m.legs, winner: m.winner, status: m.status, turn: m.turn };
    throw new Error('summarize: jenis tidak dikenal');
  }

  // ================================================================ pool (frame_race)
  function createFrameMatch(params) {
    if (params.frames_to_win_match == null) throw new Error('Parameter belum ditetapkan rulebook: frames_to_win_match');
    return { kind: 'frames', p: clone(params), wins: [0, 0], status: 'live', winner: null };
  }
  function winFrame(m, side) {
    if (m.status !== 'live') return m;
    const n = clone(m); n.wins[side]++;
    if (n.wins[side] >= n.p.frames_to_win_match) { n.status = 'done'; n.winner = side; }
    return n;
  }

  // ================================================================ darts (x01_countdown)
  // dart: { r: 'S'|'D'|'T'|'OB'|'B'|'M', n: 1..20 }  (OB = outer bull 25, B = bullseye 50, M = miss)
  function dartValue(d) {
    switch (d.r) {
      case 'S': return d.n; case 'D': return d.n * 2; case 'T': return d.n * 3;
      case 'OB': return 25; case 'B': return 50; default: return 0;
    }
  }
  const isDouble = d => d.r === 'D' || d.r === 'B'; // bullseye dihitung sebagai double 25
  function createX01Match(params, opts = {}) {
    const need = missing(params, ['start_score', 'legs_to_win_match']);
    if (need.length) throw new Error('Parameter belum ditetapkan rulebook: ' + need.join(', '));
    return { kind: 'x01', p: clone(params), legs: [0, 0], remaining: [params.start_score, params.start_score], turn: opts.starter ?? 0, starter: opts.starter ?? 0, history: [[], []], status: 'live', winner: null, legWinner: null };
  }
  // Satu giliran (maksimal 3 dart). Mengembalikan { match, bust, checkout, scored }
  function addVisit(m, player, darts) {
    if (m.status !== 'live') return { match: m, bust: false, checkout: false, scored: 0 };
    const n = clone(m); const p = n.p;
    let rem = n.remaining[player], scored = 0, bust = false, checkout = false;
    const list = darts.slice(0, 3);
    for (const d of list) {
      const v = dartValue(d); const after = rem - v;
      if (after < 0 || after === 1 || (after === 0 && !(p.finish === 'double_out' ? isDouble(d) : true))) { bust = true; break; }
      rem = after; scored += v;
      if (rem === 0) { checkout = true; break; } // dart setelah menutup tidak dihitung
    }
    if (p.max_visit_score != null && scored > p.max_visit_score) throw new Error('Skor giliran melebihi maksimum');
    if (bust) scored = 0; else n.remaining[player] = rem;
    n.history[player].push({ darts: list, scored, bust, remainingAfter: n.remaining[player] });
    n.turn = 1 - player;
    if (checkout) {
      n.legs[player]++;
      if (n.legs[player] >= p.legs_to_win_match) { n.status = 'done'; n.winner = player; }
      else { n.remaining = [p.start_score, p.start_score]; n.starter = 1 - n.starter; n.turn = n.starter; n.history = [[], []]; }
    }
    return { match: n, bust, checkout, scored };
  }
  // Apakah sisa skor bisa ditutup dalam <= 3 dart dengan double-out?
  function checkoutPossible(score, maxDarts = 3) {
    const singles = []; for (let i = 1; i <= 20; i++) singles.push(i, i * 2, i * 3);
    singles.push(25, 50); singles.push(0);
    const doubles = []; for (let i = 1; i <= 20; i++) doubles.push(i * 2); doubles.push(50);
    const go = (rem, left) => {
      if (left === 0) return false;
      if (doubles.includes(rem)) return true;
      if (left === 1) return false;
      return singles.some(v => v > 0 && rem - v >= 2 && go(rem - v, left - 1));
    };
    return go(score, maxDarts);
  }
  const threeDartAverage = (points, darts) => (darts ? Math.round((points / darts) * 3 * 10) / 10 : 0);

  // ================================================================ olahraga skor (head_to_head_score)
  function createScoreMatch(params) {
    if (params.period_minutes == null) throw new Error('Parameter belum ditetapkan rulebook: period_minutes');
    const timed = params.period_minutes !== 'none';
    return { kind: 'score', p: clone(params), period: 1, ot: 0, clock: timed ? params.period_minutes * 60 : null, score: [0, 0], events: [], status: 'live', winner: null, draw: false };
  }
  function scoreEvent(m, side, key) {
    if (m.status !== 'live') return m;
    const pts = m.p.score_events && m.p.score_events[key];
    if (pts === undefined) throw new Error('Jenis skor tidak ada di rulebook: ' + key);
    const n = clone(m); n.score[side] += pts; n.events.push({ side, key, pts, period: n.period, ot: n.ot }); return n;
  }
  function endPeriod(m) {
    const n = clone(m); const p = n.p;
    if (n.ot === 0 && n.period < p.periods) { n.period++; n.clock = p.period_minutes * 60; return n; }
    if (n.score[0] !== n.score[1]) { n.status = 'ft'; n.winner = n.score[0] > n.score[1] ? 0 : 1; return n; }
    const ot = p.overtime;
    if (!ot || ot === 'none') { n.status = 'ft'; n.draw = true; return n; }
    if (ot.period_minutes == null) throw new Error('Parameter belum ditetapkan rulebook: overtime.period_minutes');
    const per = ot.periods || 1;
    if (n.ot === 0) { n.ot = 1; n.otPeriod = 1; n.clock = ot.period_minutes * 60; return n; }
    if (n.otPeriod < per) { n.otPeriod++; n.clock = ot.period_minutes * 60; return n; }
    if (ot.repeat === 'until_winner') { n.ot++; n.otPeriod = 1; n.clock = ot.period_minutes * 60; return n; }
    if (ot.then === 'penalty_shootout') { n.status = 'shootout'; return n; }
    n.status = 'ft'; n.draw = true; return n;
  }
  function tickClock(m, seconds) {
    if (m.status !== 'live' || m.clock == null) return m;
    const n = clone(m); n.clock = Math.max(0, n.clock - seconds);
    return n.clock === 0 ? endPeriod(n) : n;
  }
  function periodLabel(m) {
    const p = m.p;
    if (m.ot) return 'OT' + (m.ot > 1 ? m.ot : '');
    const base = { half: 'H', quarter: 'Q', innings: 'INN ' }[p.period_label] || 'P';
    return base + m.period;
  }
  function leaguePoints(params, outcome) {
    const lp = params.league_points;
    if (!lp) return null;
    const key = { win: 'win', draw: 'draw', loss: 'loss', loss_forfeit: 'loss_forfeit' }[outcome];
    const v = lp[key];
    return v === undefined || v === null ? null : v;
  }
  function leaguePointsBySetScore(params, winnerSets, loserSets) {
    const t = params.league_points_by_score && params.league_points_by_score[winnerSets + '-' + loserSets];
    return t ? { winner: t[0], loser: t[1] } : null;
  }

  // ================================================================ cricket
  function createCricket(params) {
    const need = missing(params, ['overs_per_innings', 'balls_per_over', 'wickets_per_innings']);
    if (need.length) throw new Error('Parameter belum ditetapkan rulebook: ' + need.join(', '));
    return { kind: 'cricket', p: clone(params), inns: [{ runs: 0, wkts: 0, balls: 0 }, { runs: 0, wkts: 0, balls: 0 }], cur: 0, target: null, freeHit: false, status: 'live', winner: null, result: null };
  }
  // ev: { runs?: n, wicket?: bool, extra?: 'wide'|'no_ball'|'bye'|'leg_bye' }
  function cricketBall(m, ev) {
    if (m.status !== 'live') return m;
    const n = clone(m); const p = n.p; const i = n.inns[n.cur];
    const ex = ev.extra || null; let add = ev.runs || 0; let legal = true; const wasFreeHit = m.freeHit;
    if (ex === 'wide') { add += p.extras.wide; legal = false; }
    if (ex === 'no_ball') { add += p.extras.no_ball; legal = false; n.freeHit = true; }
    else if (legal) n.freeHit = false;
    i.runs += add;
    const wicket = !!ev.wicket && !(wasFreeHit && ev.how !== 'run_out'); // free hit: hanya run out yang sah
    if (wicket) i.wkts++;
    if (legal) i.balls++;
    const maxBalls = p.overs_per_innings * p.balls_per_over;
    const over = i.wkts >= p.wickets_per_innings || i.balls >= maxBalls || (n.cur === 1 && i.runs >= n.target);
    if (!over) return n;
    if (n.cur === 0) { n.cur = 1; n.target = i.runs + 1; return n; }
    n.status = 'done';
    const a = n.inns[0], b = n.inns[1];
    if (b.runs >= n.target) { n.winner = 1; n.result = { by: 'wickets', margin: p.wickets_per_innings - b.wkts }; }
    else if (b.runs === a.runs) { n.winner = null; n.result = { by: 'tie' }; }
    else { n.winner = 0; n.result = { by: 'runs', margin: a.runs - b.runs }; }
    return n;
  }
  const oversLabel = (balls, bpo = 6) => Math.floor(balls / bpo) + '.' + (balls % bpo);
  const runRate = (runs, balls, bpo = 6) => (balls ? Math.round((runs / (balls / bpo)) * 100) / 100 : 0);
  function netRunRate(forRuns, forBalls, againstRuns, againstBalls, bpo = 6) {
    return Math.round((runRate(forRuns, forBalls, bpo) - runRate(againstRuns, againstBalls, bpo)) * 100) / 100;
  }

  // ================================================================ waktu (timed)
  const decimals = precision => (precision ? (String(precision).split('.')[1] || '').length : 0);
  function formatTime(seconds, precision) {
    const d = decimals(precision); const f = Math.pow(10, d);
    const total = Math.round(seconds * f) / f;
    const h = Math.floor(total / 3600), mi = Math.floor((total % 3600) / 60), s = total - h * 3600 - mi * 60;
    const ss = d ? s.toFixed(d).padStart(3 + d, '0') : String(Math.round(s)).padStart(2, '0');
    if (h) return h + ':' + String(mi).padStart(2, '0') + ':' + ss;
    if (mi) return mi + ':' + ss;
    return d ? s.toFixed(d) : String(Math.round(s));
  }
  // entries: [{ id, seconds, status?: 'DNS'|'DNF'|'DQ', penalties?: { CODE: count } }]
  function rankTimed(entries, params) {
    const pen = Object.fromEntries((params.penalties || []).map(x => [x.code, x]));
    const prec = params.time_precision || 0.01; const f = Math.pow(10, decimals(prec));
    const rows = entries.map(e => {
      let add = 0; const unknown = [];
      for (const [code, count] of Object.entries(e.penalties || {})) {
        const def = pen[code];
        if (!def || def.seconds == null) unknown.push(code); else add += def.seconds * count;
      }
      const adjusted = e.seconds == null ? null : Math.round((e.seconds + add) * f) / f;
      return { ...e, penaltySeconds: add, adjusted, unknownPenalties: unknown };
    });
    const ok = rows.filter(r => !r.status && r.adjusted != null).sort((a, b) => a.adjusted - b.adjusted);
    let pos = 0;
    ok.forEach((r, i) => { if (i === 0 || r.adjusted !== ok[i - 1].adjusted) pos = i + 1; r.rank = pos; r.display = formatTime(r.adjusted, params.time_precision); });
    const out = rows.filter(r => r.status || r.adjusted == null);
    out.forEach(r => { r.rank = null; r.display = r.status || '—'; });
    return [...ok, ...out];
  }

  // ================================================================ golf (points_total)
  function stablefordPoints(params, strokes, par) {
    const t = params.stableford; const d = strokes - par;
    if (d >= 2) return t.double_bogey_or_worse;
    return { 1: t.bogey, 0: t.par, '-1': t.birdie, '-2': t.eagle }[d] ?? t.albatross; // d <= -3 -> albatross
  }
  function golfToPar(strokes, par) { return strokes - par; }
  // count-back: bandingkan jumlah pukulan 9, 6, 3, 1 lubang terakhir (lebih kecil menang)
  function countBack(cardA, cardB) {
    for (const k of [9, 6, 3, 1]) {
      const a = cardA.slice(-k).reduce((x, y) => x + y, 0), b = cardB.slice(-k).reduce((x, y) => x + y, 0);
      if (a !== b) return a < b ? -1 : 1;
    }
    return 0;
  }

  // ================================================================ bowling (frames)
  // rolls: daftar pin per lemparan untuk satu game. Mengembalikan frame demi frame + total.
  function scoreBowling(params, rolls) {
    const std = params.scoring_system !== 'current_frame';
    const frames = []; let i = 0; let total = 0; let blocked = false;
    for (let f = 1; f <= params.frames; f++) {
      const last = f === params.frames; const r1 = rolls[i]; if (r1 === undefined) break;
      const fr = { no: f, rolls: [r1], score: null, cumulative: null, mark: '' };
      if (r1 === 10) {
        fr.mark = 'X';
        if (last) { fr.rolls.push(rolls[i + 1], rolls[i + 2]); fr.rolls = fr.rolls.filter(x => x !== undefined); }
        if (std) { const b1 = rolls[i + 1], b2 = rolls[i + 2]; fr.score = b1 !== undefined && b2 !== undefined ? 10 + b1 + b2 : null; }
        else fr.score = 30;
        i += last ? 3 : 1;
      } else {
        const r2 = rolls[i + 1];
        if (r2 !== undefined) fr.rolls.push(r2);
        if (r2 === undefined) { fr.score = null; i += 1; }
        else if (r1 + r2 === 10) {
          fr.mark = '/';
          if (last) { const r3 = rolls[i + 2]; if (r3 !== undefined) fr.rolls.push(r3); }
          if (std) { const b = rolls[i + 2]; fr.score = b !== undefined ? 10 + b : null; } else fr.score = 10 + r1;
          i += last ? 3 : 2;
        } else { fr.score = r1 + r2; i += 2; }
      }
      if (fr.score == null) blocked = true;
      else if (!blocked) { total += fr.score; fr.cumulative = total; }
      frames.push(fr);
    }
    return { frames, total, complete: frames.length === params.frames && !blocked };
  }

  // ================================================================ klasemen
  // rows: [{ id, ...angka }]; keys: urutan tiebreaker dari rulebook; ctx.h2h(a, b) > 0 jika a mengalahkan b
  const TB = {
    wins: r => r.wins, points: r => r.points, goal_difference: r => r.gf - r.ga, goals_for: r => r.gf,
    point_difference: r => r.pf - r.pa, total_points: r => r.pf, game_difference: r => r.gamesFor - r.gamesAgainst,
    set_difference: r => r.setsFor - r.setsAgainst, set_ratio: r => r.setsFor / (r.setsAgainst || 1), point_ratio: r => r.pf / (r.pa || 1),
    frame_difference: r => r.framesFor - r.framesAgainst, leg_difference: r => r.legsFor - r.legsAgainst, net_run_rate: r => r.nrr,
    fair_play: r => -(r.cards || 0),
  };
  function compareTable(a, b, keys, ctx = {}) {
    if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
    for (const k of keys || []) {
      if (k === 'draw_lots') return 0;
      if (k === 'head_to_head') { const h = ctx.h2h ? ctx.h2h(a.id, b.id) : 0; if (h) return -h; continue; }
      const f = TB[k]; if (!f) continue;
      const x = f(a), y = f(b); if (x !== y) return y - x;
    }
    return 0;
  }
  function rankTable(rows, keys, ctx) { return [...rows].sort((a, b) => compareTable(a, b, keys, ctx)); }

  return {
    resolveRules, createMatch, addPoint, summarize,
    createSetsMatch, addPointSets, createTennisMatch, addPointTennis, tennisPointLabel,
    createFrameMatch, winFrame,
    createX01Match, addVisit, dartValue, checkoutPossible, threeDartAverage,
    createScoreMatch, scoreEvent, endPeriod, tickClock, periodLabel, leaguePoints, leaguePointsBySetScore,
    createCricket, cricketBall, oversLabel, runRate, netRunRate,
    formatTime, rankTimed,
    stablefordPoints, golfToPar, countBack,
    scoreBowling,
    rankTable, compareTable,
  };
});
