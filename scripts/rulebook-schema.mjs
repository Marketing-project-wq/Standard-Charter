// Schema dan validator frontmatter rulebook (tanpa dependensi).
//
// Aturan inti:
//  - `null` berarti "rulebook tidak menyebut nilai pastinya". Setiap null (kecuali yang diizinkan)
//    WAJIB tercantum di `unverified_fields`. Jangan mengarang angka.
//  - `verified` harus `true` hanya kalau `unverified_fields` kosong.
//  - Setiap penanda `⚠️ Verifikasi` di badan MD harus punya satu entri di `markers`.

import { splitFrontmatter } from './yaml-lite.mjs';

// ---------------------------------------------------------------- builder schema
const ok = null;
const fail = (path, msg) => `${path || '(root)'}: ${msg}`;
const S = {
  string: (o = {}) => (v, p) => typeof v !== 'string' ? fail(p, 'harus string') : (o.pattern && !o.pattern.test(v) ? fail(p, `format tidak cocok ${o.pattern}`) : ok),
  int: (o = {}) => (v, p) => !Number.isInteger(v) ? fail(p, 'harus bilangan bulat') : (o.min !== undefined && v < o.min ? fail(p, `minimal ${o.min}`) : ok),
  num: (o = {}) => (v, p) => typeof v !== 'number' || Number.isNaN(v) ? fail(p, 'harus angka') : (o.min !== undefined && v < o.min ? fail(p, `minimal ${o.min}`) : ok),
  bool: () => (v, p) => typeof v !== 'boolean' ? fail(p, 'harus true/false') : ok,
  date: () => (v, p) => typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) ? fail(p, 'harus tanggal YYYY-MM-DD') : ok,
  enum: vals => (v, p) => !vals.includes(v) ? fail(p, `harus salah satu dari ${vals.join(' | ')}`) : ok,
  lit: lit => (v, p) => v !== lit ? fail(p, `harus "${lit}"`) : ok,
  nullable: f => (v, p) => v === null ? ok : f(v, p),
  or: (...fs) => (v, p) => fs.some(f => f(v, p) === ok) ? ok : fail(p, 'tipe tidak cocok'),
  array: (item, o = {}) => (v, p) => {
    if (!Array.isArray(v)) return fail(p, 'harus list');
    if (o.min !== undefined && v.length < o.min) return fail(p, `minimal ${o.min} item`);
    for (let i = 0; i < v.length; i++) { const e = item(v[i], `${p}[${i}]`); if (e) return e; }
    return ok;
  },
  object: (fields, o = {}) => (v, p) => {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return fail(p, 'harus map');
    const errs = [];
    for (const [k, f] of Object.entries(fields)) {
      const req = !o.optional?.includes(k);
      if (!(k in v)) { if (req) errs.push(fail(p ? `${p}.${k}` : k, 'wajib ada')); continue; }
      const e = f(v[k], p ? `${p}.${k}` : k); if (e) errs.push(e);
    }
    if (!o.loose) for (const k of Object.keys(v)) if (!(k in fields)) errs.push(fail(p ? `${p}.${k}` : k, 'key tidak dikenal'));
    return errs.length ? errs.join('\n') : ok;
  },
  map: valueF => (v, p) => {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return fail(p, 'harus map');
    for (const [k, x] of Object.entries(v)) { const e = valueF(x, `${p}.${k}`); if (e) return e; }
    return ok;
  },
  any: () => () => ok,
};

// ---------------------------------------------------------------- bagian umum
export const CATEGORIES = ['net_raket', 'tim', 'presisi', 'individu'];
export const RESULT_TYPES = ['head_to_head_sets', 'head_to_head_score', 'timed', 'points_total', 'frames'];
export const STATUS_CODES = ['DNS', 'DNF', 'DQ', 'WO', 'RET'];
export const SCORING_MODES = ['rally_point', 'side_out', 'tennis_points', 'x01_countdown', 'frame_race'];

const I = S.int({ min: 0 });
const NI = S.nullable(I);
const leaguePoints = S.nullable(S.object({ win: NI, draw: NI, loss: NI, loss_forfeit: NI }, { optional: ['draw', 'loss_forfeit'] }));
const tiebreak = S.object({ at_games: I, points_to_win: I, win_by: I });
const matchTiebreak = S.object({ points: I, win_by: I, replaces: S.enum(['deciding_set']), optional: S.bool() });
const overtime = S.or(S.lit('none'), S.nullable(S.object({ periods: NI, period_minutes: NI, repeat: S.enum(['until_winner', 'once']), then: S.enum(['penalty_shootout', 'none']) }, { optional: ['periods', 'repeat', 'then'] })));

const COMMON = {
  sport: S.string({ pattern: /^[a-z0-9-]+$/ }),
  number: I,
  numbers: S.array(I),
  name: S.string(),
  category: S.enum(CATEGORIES),
  source: S.string(),
  rules_checked: S.date(),
  result_type: S.nullable(S.enum(RESULT_TYPES)),
  verified: S.bool(),
  unverified_fields: S.array(S.string()),
  markers: S.array(S.object({ at: S.string({ pattern: /^\d+\.\d+$/ }), field: S.string(), affects_scoring: S.bool() })),
  status_codes: S.nullable(S.array(S.enum(STATUS_CODES))),
  tiebreakers: S.nullable(S.array(S.string())),
  league_points: leaguePoints,
  manual_input_required: S.bool(),
  options: S.map(S.array(S.any())),
  variants: S.array(S.object({
    id: S.string(), effective_from: S.date(), effective_to: S.nullable(S.date()), optional: S.bool(), overrides: S.map(S.any()), unverified: S.array(S.string()),
  }, { optional: ['optional', 'unverified'] })),
  extra: S.map(S.any()),
};
const COMMON_REQUIRED = ['sport', 'number', 'name', 'category', 'source', 'rules_checked', 'result_type', 'verified', 'unverified_fields', 'markers', 'status_codes', 'tiebreakers', 'league_points', 'manual_input_required'];

// ---------------------------------------------------------------- bagian per tipe hasil
const SETS_BY_MODE = {
  rally_point: { unit: S.enum(['game', 'set']), points_to_win_game: NI, win_by: NI, point_cap: S.or(NI, S.lit('none')), games_to_win_match: NI, deciding_game_points: S.or(NI, S.lit('same')), league_points_by_score: S.map(S.array(I)), walkover: S.nullable(S.object({ score: S.array(I), set_score: S.nullable(S.array(I)) }, { optional: ['set_score'] })) },
  side_out: { unit: S.enum(['game']), points_to_win_game: NI, win_by: NI, point_cap: S.or(NI, S.lit('none')), games_to_win_match: NI, deciding_game_points: S.or(NI, S.lit('same')) },
  tennis_points: { unit: S.enum(['set']), games_per_set: NI, set_win_by: NI, sets_to_win_match: NI, deuce_rule: S.nullable(S.enum(['advantage', 'golden_point', 'star_point'])), tiebreak_game: S.nullable(tiebreak), match_tiebreak: S.nullable(matchTiebreak) },
  x01_countdown: { unit: S.enum(['leg']), start_score: NI, finish: S.nullable(S.enum(['double_out'])), bust: S.nullable(S.bool()), legs_to_win_match: NI, max_visit_score: NI, max_checkout: NI },
  frame_race: { unit: S.enum(['frame']), frames_to_win_match: NI },
};
const SCORE_SPECS = {
  periods: I, period_label: S.enum(['half', 'quarter', 'innings']), period_minutes: S.or(NI, S.lit('none')), overtime,
  score_events: S.map(I), walkover: S.nullable(S.object({ score: S.array(I) })),
  innings_per_team: I, overs_per_innings: I, balls_per_over: I, wickets_per_innings: I, max_overs_per_bowler: I,
  extras: S.map(I), super_over: S.object({ overs: I }), powerplay: S.object({ overs: I, max_fielders_outside_circle: I }),
};
const TIMED_SPECS = {
  ranking: S.lit('lowest_time'), time_precision: S.nullable(S.num({ min: 0 })), distance_m: S.nullable(I),
  penalties: S.array(S.object({ code: S.string(), seconds: S.nullable(I), per: S.enum(['violation', 'race']), first_is_warning: S.bool() }, { optional: ['per', 'first_is_warning'] })),
  stages: S.array(S.string()), laps: I, stations: S.array(S.object({ no: I, name: S.string(), distance_m: S.nullable(I), reps: S.nullable(I) }, { optional: ['distance_m', 'reps'] })),
  station_weights: S.map(S.map(S.any())), disciplines: S.map(S.any()),
};
const POINTS_SPECS = { formats: S.array(S.string()), strokes: S.any(), stableford: S.map(I), holes: I, handicap: S.nullable(S.string()), disciplines: S.map(S.any()) };
const FRAMES_SPECS = { scoring_system: S.enum(['standard', 'current_frame']), frames: I, balls_per_frame: I, max_score: I, tenth_frame: S.map(S.any()), strike_bonus_balls: I, spare_bonus_balls: I, foul_pins: I };

function typeSpec(fm) {
  switch (fm.result_type) {
    case 'head_to_head_sets': {
      const mode = SETS_BY_MODE[fm.scoring_mode];
      return { scoring_mode: S.enum(SCORING_MODES), ...(mode || {}), ...{ walkover: S.nullable(S.object({ score: S.array(I), set_score: S.nullable(S.array(I)) }, { optional: ['set_score'] })), league_points_by_score: S.map(S.array(I)) } };
    }
    case 'head_to_head_score': return SCORE_SPECS;
    case 'timed': return TIMED_SPECS;
    case 'points_total': return POINTS_SPECS;
    case 'frames': return FRAMES_SPECS;
    default: return {};
  }
}
const TYPE_REQUIRED = {
  rally_point: ['unit', 'points_to_win_game', 'win_by', 'point_cap', 'games_to_win_match', 'deciding_game_points'],
  side_out: ['unit', 'points_to_win_game', 'win_by', 'point_cap', 'games_to_win_match', 'deciding_game_points'],
  tennis_points: ['unit', 'games_per_set', 'set_win_by', 'sets_to_win_match', 'deuce_rule', 'tiebreak_game', 'match_tiebreak'],
  x01_countdown: ['unit', 'start_score', 'finish', 'bust', 'legs_to_win_match'],
  frame_race: ['unit', 'frames_to_win_match'],
  head_to_head_score: ['periods', 'period_minutes', 'overtime', 'score_events'],
  timed: ['ranking', 'time_precision', 'penalties'],
  points_total: ['formats'],
  frames: ['scoring_system', 'frames', 'max_score'],
};

// ---------------------------------------------------------------- null / unverified
const NULL_OK = [/^variants\.\d+\.effective_to$/, /^status_codes$/, /^tiebreakers$/, /^league_points$/];
function nullPaths(v, p = '', out = []) {
  if (v === null) out.push(p);
  else if (Array.isArray(v)) v.forEach((x, i) => nullPaths(x, `${p}.${i}`.replace(/^\./, ''), out));
  else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) nullPaths(x, p ? `${p}.${k}` : k, out);
  return out;
}
const covered = (path, unv) => unv.some(u => path === u || path.startsWith(u + '.'));
function variantCovered(path, fm) {
  const m = path.match(/^variants\.(\d+)\.overrides\.(.+)$/);
  if (!m) return false;
  const v = fm.variants?.[Number(m[1])];
  return Array.isArray(v?.unverified) && covered(m[2], v.unverified);
}

// ---------------------------------------------------------------- validator publik
export function countMarkers(body) { return (body.match(/⚠️ Verifikasi/g) || []).length; }

export function validateRulebookFile(fileName, md) {
  const errors = [];
  let fm, body;
  try { ({ data: fm, body } = splitFrontmatter(md)); } catch (e) { return [`${fileName}: frontmatter tidak bisa dibaca: ${e.message}`]; }
  if (!fm) return [`${fileName}: frontmatter tidak ada`];
  const add = e => { if (e) errors.push(...String(e).split('\n').map(l => `${fileName}: ${l}`)); };

  const slug = fileName.replace(/^\d+-/, '').replace(/\.md$/, '');
  if (fm.sport !== slug) add(`sport: "${fm.sport}" tidak sama dengan nama file "${slug}"`);
  const num = parseInt(fileName, 10);
  if (fm.number !== num) add(`number: ${fm.number} tidak sama dengan awalan nama file ${num}`);

  // spesifikasi gabungan
  const spec = { ...COMMON, ...typeSpec(fm) };
  const mode = fm.result_type === 'head_to_head_sets' ? fm.scoring_mode : fm.result_type;
  const required = [...COMMON_REQUIRED, ...(TYPE_REQUIRED[mode] || []), ...(fm.result_type === 'head_to_head_sets' ? ['scoring_mode'] : [])];
  const optional = Object.keys(spec).filter(k => !required.includes(k));
  add(S.object(spec, { optional })(fm, ''));

  if (fm.result_type === null) {
    if (fm.manual_input_required !== true) add('manual_input_required: harus true kalau result_type null');
    if (fm.verified !== false) add('verified: harus false kalau result_type null');
  }
  const unv = Array.isArray(fm.unverified_fields) ? fm.unverified_fields : [];
  if (fm.verified === true && unv.length) add('verified: true tetapi unverified_fields tidak kosong');
  if (fm.verified === false && !unv.length) add('verified: false tetapi unverified_fields kosong');

  // setiap null harus tercantum di unverified_fields
  for (const path of nullPaths(fm)) {
    if (NULL_OK.some(r => r.test(path))) continue;
    if (!covered(path, unv) && !variantCovered(path, fm)) add(`${path}: bernilai null tetapi tidak ada di unverified_fields (rulebook tidak menyebut nilai pastinya)`);
  }

  // penanda Verifikasi di badan harus semuanya dipetakan
  const mk = countMarkers(body);
  const listed = Array.isArray(fm.markers) ? fm.markers : [];
  if (mk !== listed.length) add(`markers: badan MD punya ${mk} penanda "⚠️ Verifikasi" tetapi frontmatter memetakan ${listed.length}`);
  for (const m of listed) if (m.affects_scoring && !covered(m.field, unv)) add(`markers: field "${m.field}" mempengaruhi scoring tetapi tidak ada di unverified_fields`);
  return errors;
}

export function validateRulebookSet(files) {
  const errors = [];
  const seen = new Map();
  for (const [name, md] of Object.entries(files)) {
    errors.push(...validateRulebookFile(name, md));
    const { data } = (() => { try { return splitFrontmatter(md); } catch { return {}; } })();
    if (data?.sport) { if (seen.has(data.sport)) errors.push(`${name}: sport "${data.sport}" ganda dengan ${seen.get(data.sport)}`); seen.set(data.sport, name); }
  }
  return errors;
}
