import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { explain, rosterIssues, divisionLabel, MESSAGES } = createRequire(import.meta.url)('../assets/registration.js');

const dragon = { min_players: 16, max_players: 22, max_substitutes: 4, gender_rule: 'open', min_per_gender: null, required_roles: ['drummer', 'steersperson'] };
const mem = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ status: 'confirmed', is_substitute: false, role: null, gender: 'male', ...extra, ...(i === 0 ? { role: 'drummer' } : i === 1 ? { role: 'steersperson' } : {}) }));

test('explain: kode error trigger dipetakan ke pesan Indonesia dengan detail', () => {
  assert.equal(explain({ message: 'ROSTER_MIN_PLAYERS', details: '16' }), 'Jumlah pemain kurang. Minimal 16 pemain.');
  assert.match(explain({ message: 'ROSTER_MISSING_ROLE', details: 'drummer' }), /drummer/);
  assert.match(explain({ message: 'DEADLINE_PASSED' }), /Batas waktu/);
  assert.match(explain({ message: 'EMAIL_DOMAIN_NOT_ALLOWED' }), /Domain email/);
});
test('explain: unique violation dan RLS dan jaringan', () => {
  assert.match(explain({ code: '23505', message: 'duplicate key value violates unique constraint "teams_name_key"' }), /Nama tim/);
  assert.match(explain({ code: '42501', message: 'new row violates row-level security policy' }), /izin/);
  assert.match(explain(new Error('Failed to fetch')), /terhubung/);
  assert.match(explain({ message: 'Token has expired or is invalid' }), /kedaluwarsa/);
  assert.match(explain({ message: 'aneh' }), /Terjadi kesalahan/);
});
test('rosterIssues: roster dragon boat lengkap valid, kurang pemain dan peran terdeteksi', () => {
  assert.deepEqual(rosterIssues(dragon, mem(16)), []);
  const bad = rosterIssues(dragon, mem(10).map(x => ({ ...x, role: null })));
  assert.ok(bad.some(x => /Minimal 16/.test(x)));
  assert.ok(bad.some(x => /drummer/.test(x)) && bad.some(x => /steersperson/.test(x)));
});
test('rosterIssues: cadangan, undangan belum konfirmasi, gender', () => {
  assert.ok(rosterIssues(dragon, [...mem(16), ...mem(5, { is_substitute: true, role: null })]).some(x => /Maksimal 4 cadangan/.test(x)));
  assert.ok(rosterIssues(dragon, [...mem(16), { status: 'invited', is_substitute: true, role: null }]).some(x => /belum mengonfirmasi/.test(x)));
  const putri = { min_players: 2, max_players: 2, max_substitutes: 0, gender_rule: 'female', required_roles: [] };
  assert.ok(rosterIssues(putri, [{ status: 'confirmed', gender: 'female' }, { status: 'confirmed', gender: 'male' }]).some(x => /gender/.test(x)));
  const mixed = { min_players: 2, max_players: 2, max_substitutes: 0, gender_rule: 'mixed', min_per_gender: 1, required_roles: [] };
  assert.ok(rosterIssues(mixed, [{ status: 'confirmed', gender: 'male' }, { status: 'confirmed', gender: 'male' }]).some(x => /mixed/.test(x)));
  assert.deepEqual(rosterIssues(mixed, [{ status: 'confirmed', gender: 'male' }, { status: 'confirmed', gender: 'female' }]), []);
});
test('rosterIssues: anggota declined diabaikan', () => {
  const d = { min_players: 2, max_players: 2, max_substitutes: 0, gender_rule: 'open', required_roles: [] };
  assert.deepEqual(rosterIssues(d, [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'declined' }]), []);
});
test('divisionLabel', () => {
  assert.equal(divisionLabel({ nama: 'Basketball' }, { nama: 'Putra' }), 'Basketball · Putra');
  assert.equal(divisionLabel({ nama: 'Running' }, { nama: 'Open' }), 'Running');
});
test('semua kode error trigger di migrasi punya pesan', async () => {
  const fs = await import('node:fs');
  const sql = fs.readdirSync('supabase/migrations').map(f => fs.readFileSync('supabase/migrations/' + f, 'utf8')).join('\n');
  const codes = [...sql.matchAll(/raise exception '([A-Z_]+)'/g)].map(m => m[1]);
  for (const c of new Set(codes)) assert.ok(MESSAGES[c], 'tidak ada pesan untuk ' + c);
});

test('explain: error pengiriman OTP dari Edge Function', () => {
  assert.match(explain(new Error('OTP_COOLDOWN')), /30 detik/);
  assert.match(explain(new Error('OTP_RATE_LIMIT')), /satu jam/);
  assert.match(explain(new Error('OTP_NOT_CONFIGURED')), /belum aktif/);
  assert.match(explain(new Error('OTP_SEND_FAILED')), /gagal dikirim/);
});
