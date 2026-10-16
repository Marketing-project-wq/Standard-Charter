/* Lapisan data registrasi SC Games 2027 (Supabase). Tanpa build step.
 * Memakai supabase-js v2 dari CDN (window.supabase). Skema: supabase/migrations/*.sql
 * Tidak ada aturan cabor di sini: min/max/gender/role dibaca dari tabel sport_divisions.
 * Tipe baris: lihat supabase/database.types.ts (hasil generate, jangan ditulis tangan).
 * @typedef {import('../supabase/database.types').Database['public']['Tables']} Tables */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SCReg = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ───────── pesan error (kode dari trigger DB, lihat 20261016000001_schema.sql) ─────────
  const MESSAGES = {
    EMAIL_DOMAIN_NOT_ALLOWED: () => 'This email domain is not allowed to register.',
    REGISTRATION_CLOSED: () => 'Registration is closed.',
    DEADLINE_PASSED: () => 'The registration deadline for this division has passed.',
    ADMIN_ONLY: () => 'Only the organizers can change status and notes.',
    ROSTER_LOCKED: () => 'The roster is locked because the organizers have already processed this registration.',
    ROSTER_UNCONFIRMED_MEMBERS: () => 'Some members have not confirmed their invitation yet.',
    ROSTER_MIN_PLAYERS: d => `Not enough players. Minimum ${d} players.`,
    ROSTER_MAX_PLAYERS: d => `Too many players. Maximum ${d} players.`,
    ROSTER_MAX_SUBSTITUTES: d => `Too many substitutes. Maximum ${d} substitutes.`,
    ROSTER_GENDER_MISMATCH: () => 'Some members do not meet the gender rule of this division.',
    ROSTER_GENDER_MIX: d => `A mixed division needs at least ${d} male and ${d} female players.`,
    ROSTER_MISSING_ROLE: d => `Required role not filled: ${d}.`,
    DIVISION_MISMATCH: () => 'This team is registered in a different division.',
    ENTRY_TYPE_MISMATCH: () => 'This division does not match the registration type (individual or team).',
    TEAM_NOT_FOUND: () => 'Team not found.',
    OTP_EMAIL_INVALID: () => 'Invalid email format.',
    OTP_COOLDOWN: () => 'A code was just sent. Wait 30 seconds before requesting another.',
    OTP_RATE_LIMIT: () => 'Too many code requests. Try again in an hour.',
    OTP_NOT_CONFIGURED: () => 'Code sending is not active yet. Contact the organizers.',
    OTP_CODE_FAILED: () => 'Could not create a code. Try again.',
    OTP_SEND_FAILED: () => 'The code email could not be sent. Try again shortly.',
    CHEER_COOLDOWN: () => 'Wait a few seconds before sending another cheer.',
    CHEER_RATE_LIMIT: () => 'Too many cheers in one minute. Try again shortly.',
  };
  const ROLE_LABEL = { drummer: 'drummer', steersperson: 'steersperson' };

  // Postgres: 23505 = unique_violation, 42501 = RLS ditolak, 23503 = FK
  function explain(err) {
    if (!err) return '';
    const msg = String(err.message || err);
    const code = Object.keys(MESSAGES).find(k => msg.includes(k));
    if (code) {
      const detail = (err.details || err.detail || '').toString();
      const d = code === 'ROSTER_MISSING_ROLE' ? (ROLE_LABEL[detail] || detail) : detail;
      return MESSAGES[code](d);
    }
    if (err.code === '23505') {
      if (/teams_name_key/.test(msg)) return 'That team name is already taken in this division. Choose another.';
      if (/team_members_email_key/.test(msg)) return 'That email is already on this team.';
      if (/registrations_/.test(msg)) return 'You are already registered in this division.';
      if (/participants_email_key/.test(msg)) return 'This email is already used by another profile.';
      return 'That record already exists.';
    }
    if (err.code === '42501' || /row-level security/i.test(msg)) return 'You do not have permission for this action. Try signing in again.';
    if (/invalid.*otp|token has expired|Token has expired/i.test(msg)) return 'The code is wrong or has expired. Request a new code.';
    if (/rate limit|too many requests|over_email_send_rate_limit/i.test(msg)) return 'Too many code requests. Wait a moment and try again.';
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'Cannot reach the server. Check your internet connection.';
    return 'Something went wrong. Try again, or contact the organizers if it keeps happening.';
  }

  // ───────── validasi roster di klien (cermin dari trigger DB, untuk pesan sebelum submit) ─────────
  // division: baris sport_divisions; members: [{ status, is_substitute, role, gender }] (tanpa yang declined)
  function rosterIssues(division, members) {
    const out = [];
    const m = members.filter(x => x.status !== 'declined');
    const main = m.filter(x => !x.is_substitute); const subs = m.length - main.length;
    if (m.some(x => x.status === 'invited')) out.push(MESSAGES.ROSTER_UNCONFIRMED_MEMBERS());
    if (main.length < division.min_players) out.push(MESSAGES.ROSTER_MIN_PLAYERS(division.min_players));
    if (main.length > division.max_players) out.push(MESSAGES.ROSTER_MAX_PLAYERS(division.max_players));
    if (subs > division.max_substitutes) out.push(MESSAGES.ROSTER_MAX_SUBSTITUTES(division.max_substitutes));
    const conf = m.filter(x => x.status === 'confirmed');
    if ((division.gender_rule === 'male' || division.gender_rule === 'female') && conf.some(x => x.gender !== division.gender_rule)) out.push(MESSAGES.ROSTER_GENDER_MISMATCH());
    if (division.gender_rule === 'mixed' && division.min_per_gender != null) {
      const cm = conf.filter(x => !x.is_substitute);
      if (cm.filter(x => x.gender === 'male').length < division.min_per_gender || cm.filter(x => x.gender === 'female').length < division.min_per_gender) out.push(MESSAGES.ROSTER_GENDER_MIX(division.min_per_gender));
    }
    for (const r of division.required_roles || []) if (!conf.some(x => x.role === r)) out.push(MESSAGES.ROSTER_MISSING_ROLE(ROLE_LABEL[r] || r));
    return out;
  }

  function divisionLabel(sport, division) {
    const only = division.nama === 'Open' || division.nama === sport.nama;
    return only ? sport.nama : `${sport.nama} · ${division.nama}`;
  }
  const STATUS_LABEL = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected', waitlist: 'Waitlist' };

  // ───────── akses data ─────────
  const CONFIG = { url: 'https://cpvzwqptzcxnwzfzgrmt.supabase.co', key: 'sb_publishable_0t9vEOYeIo_YM1__X5iNMQ_qXofEozw' };
  let _client = null;
  function client() {
    if (_client) return _client;
    if (!(typeof window !== 'undefined' && window.supabase)) throw new Error('Failed to fetch');
    _client = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { persistSession: true, autoRefreshToken: true } });
    return _client;
  }
  const ok = ({ data, error }) => { if (error) throw error; return data; };

  const api = {
    client,
    // Kode dibuat dan dikirim oleh Edge Function sc-send-otp (Resend); verifikasinya tetap lewat Supabase Auth.
    async sendOtp(email) {
      let r;
      try { r = await fetch(CONFIG.url + '/functions/v1/sc-send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CONFIG.key }, body: JSON.stringify({ email: email.trim() }) }); }
      catch (e) { throw new Error('Failed to fetch'); }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error('OTP_' + (j.error || 'SEND_FAILED'));
    },
    verifyOtp: (email, token) => client().auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' }).then(ok),
    signOut: () => client().auth.signOut(),
    session: () => client().auth.getSession().then(r => r.data.session),
    onAuth: cb => client().auth.onAuthStateChange((_e, s) => cb(s)),

    async catalog() {
      const [sports, divisions, settings] = await Promise.all([
        client().from('sports').select('*').order('urutan').then(ok),
        client().from('sport_divisions').select('*').order('id').then(ok),
        client().from('app_settings').select('*').eq('id', 1).single().then(ok),
      ]);
      return { sports, divisions, settings };
    },
    async myProfile(userId) {
      return client().from('participants').select('*').eq('user_id', userId).maybeSingle().then(ok);
    },
    async saveProfile(userId, email, p) {
      const row = { user_id: userId, email, display_name: p.display_name.trim(), full_name: p.full_name || null, phone: p.phone || null, birth_date: p.birth_date || null, gender: p.gender || null, branch: p.branch || null };
      return client().from('participants').upsert(row, { onConflict: 'user_id' }).select().single().then(ok);
    },
    myIndividuals: userId => client().from('registrations').select('*').eq('participant_id', userId).then(ok),
    // tim yang saya kapteni atau ikuti, dengan status pendaftarannya; roster lewat RPC (kolom terbatas)
    async myTeams() {
      const teams = await client().from('teams').select('id, nama, division_id, captain_id, registrations(id, status, admin_note, division_id)').then(ok);
      return Promise.all(teams.map(async t => ({ ...t, members: await client().rpc('team_roster', { p_team: t.id }).then(ok) })));
    },
    myInvitations: email => client().from('team_members').select('id, role, is_substitute, status, teams(id, nama, division_id)').eq('status', 'invited').ilike('invited_email', email).then(ok),
    registerIndividual: (userId, divisionId) => client().from('registrations').insert({ division_id: divisionId, participant_id: userId }).select().single().then(ok),
    async createTeam(userId, divisionId, nama) { return client().from('teams').insert({ division_id: divisionId, nama: nama.trim(), captain_id: userId }).select().single().then(ok); },
    addMember: (teamId, email, role, isSub) => client().from('team_members').insert({ team_id: teamId, invited_email: email.trim().toLowerCase(), role: role || null, is_substitute: !!isSub }).select().single().then(ok),
    removeMember: id => client().from('team_members').delete().eq('id', id).then(ok),
    respondInvitation: (id, status) => client().from('team_members').update({ status }).eq('id', id).then(ok),
    submitTeam: (teamId, divisionId) => client().from('registrations').insert({ division_id: divisionId, team_id: teamId }).select().single().then(ok),
    // mengubah roster saat pending: tidak ada trigger validasi ulang di update team_members, jadi validasi ulang lewat no-op update registrasi
    revalidate: regId => client().from('registrations').update({ status: 'pending' }).eq('id', regId).select().single().then(ok),
    deleteTeam: id => client().from('teams').delete().eq('id', id).then(ok),
    cancelRegistration: id => client().from('registrations').delete().eq('id', id).then(ok),

    // ───────── admin ─────────
    isAdmin: () => client().from('admins').select('user_id').maybeSingle().then(r => !!r.data),
    adminRegistrations: () => client().from('registrations').select('*, sport_divisions(nama, entry_type, sports(slug, nama)), participants(display_name, full_name, email, phone, branch, gender), teams(nama, captain_id, team_members(invited_email, role, is_substitute, status, participants(display_name)))').order('created_at', { ascending: false }).then(ok),
    adminSetStatus: (id, status, note) => client().from('registrations').update({ status, admin_note: note || null }).eq('id', id).then(ok),
    adminSetSettings: patch => client().from('app_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1).then(ok),
  };

  return { MESSAGES, STATUS_LABEL, explain, rosterIssues, divisionLabel, api, CONFIG };
});
