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
    EMAIL_DOMAIN_NOT_ALLOWED: () => 'Domain email ini belum diizinkan untuk pendaftaran.',
    REGISTRATION_CLOSED: () => 'Pendaftaran sedang ditutup.',
    DEADLINE_PASSED: () => 'Batas waktu pendaftaran untuk divisi ini sudah lewat.',
    ADMIN_ONLY: () => 'Status dan catatan hanya bisa diubah oleh panitia.',
    ROSTER_LOCKED: () => 'Susunan tim sudah dikunci karena pendaftaran sudah diproses panitia.',
    ROSTER_UNCONFIRMED_MEMBERS: () => 'Masih ada anggota yang belum mengonfirmasi undangan.',
    ROSTER_MIN_PLAYERS: d => `Jumlah pemain kurang. Minimal ${d} pemain.`,
    ROSTER_MAX_PLAYERS: d => `Jumlah pemain melebihi batas. Maksimal ${d} pemain.`,
    ROSTER_MAX_SUBSTITUTES: d => `Cadangan melebihi batas. Maksimal ${d} cadangan.`,
    ROSTER_GENDER_MISMATCH: () => 'Ada anggota yang tidak sesuai ketentuan gender divisi ini.',
    ROSTER_GENDER_MIX: d => `Divisi mixed butuh minimal ${d} pemain putra dan ${d} pemain putri.`,
    ROSTER_MISSING_ROLE: d => `Peran wajib belum terisi: ${d}.`,
    DIVISION_MISMATCH: () => 'Tim ini terdaftar di divisi yang berbeda.',
    ENTRY_TYPE_MISMATCH: () => 'Divisi ini tidak cocok dengan jenis pendaftaran (individu atau tim).',
    TEAM_NOT_FOUND: () => 'Tim tidak ditemukan.',
    CHEER_COOLDOWN: () => 'Tunggu beberapa detik sebelum mengirim cheer lagi.',
    CHEER_RATE_LIMIT: () => 'Terlalu banyak cheer dalam satu menit. Coba lagi sebentar lagi.',
  };
  const ROLE_LABEL = { drummer: 'drummer', steersperson: 'juru mudi (steersperson)' };

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
      if (/teams_name_key/.test(msg)) return 'Nama tim itu sudah dipakai di divisi ini. Pilih nama lain.';
      if (/team_members_email_key/.test(msg)) return 'Email itu sudah ada di tim ini.';
      if (/registrations_/.test(msg)) return 'Kamu sudah terdaftar di divisi ini.';
      if (/participants_email_key/.test(msg)) return 'Email ini sudah dipakai profil lain.';
      return 'Data itu sudah ada.';
    }
    if (err.code === '42501' || /row-level security/i.test(msg)) return 'Kamu tidak punya izin untuk tindakan ini. Coba login ulang.';
    if (/invalid.*otp|token has expired|Token has expired/i.test(msg)) return 'Kode salah atau sudah kedaluwarsa. Kirim ulang kode.';
    if (/rate limit|too many requests|over_email_send_rate_limit/i.test(msg)) return 'Terlalu banyak permintaan kode. Tunggu sebentar lalu coba lagi.';
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.';
    return 'Terjadi kesalahan. Coba lagi, atau hubungi panitia kalau berulang.';
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
  const STATUS_LABEL = { pending: 'Menunggu review', approved: 'Disetujui', rejected: 'Ditolak', waitlist: 'Daftar tunggu' };

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
    sendOtp: email => client().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } }).then(ok),
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
