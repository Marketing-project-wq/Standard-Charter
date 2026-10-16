# CLAUDE.md — SC Games Portal (Standard-Charter)

Aturan kerja untuk Claude Code di repo ini. Baca dan ikuti setiap kali ada prompt baru.

## Aturan utama: GANTI code lama, jangan GABUNG

Setiap prompt baru adalah versi terbaru yang berlaku. Perlakukan sebagai pengganti, bukan tambahan.

- **Edit file yang ada di tempatnya.** Bagian yang diminta berubah harus ditimpa (replace) dengan versi baru. Jangan menempelkan code baru di bawah code lama.
- **Hapus code lama yang sudah tidak dipakai.** Fungsi, section HTML, CSS, script, atau data yang digantikan harus dihapus, bukan di-comment out dan bukan dibiarkan berdampingan.
- **Tidak boleh ada duplikat.** Satu komponen/section/fungsi hanya punya satu definisi. Sebelum menulis, cari dulu (grep) apakah sudah ada versi lamanya, lalu ganti yang itu.
- **Jangan buat file versi baru.** Tidak boleh `index-v2.html`, `index-new.html`, `index (1).html`, `backup.html`, dan sejenisnya. Riwayat versi sudah disimpan oleh git.
- **Kalau prompt baru bertentangan dengan code lama, prompt baru yang menang.** Jangan mempertahankan perilaku lama "untuk jaga-jaga".
- **Bagian yang tidak disebut di prompt jangan diubah.** Ganti hanya yang diminta, sisanya biarkan apa adanya.

### Checklist sebelum commit
1. `grep` nama section/fungsi/class yang diubah → pastikan hanya muncul satu kali.
2. Tidak ada code lama yang tersisa dalam bentuk comment.
3. Tidak ada file baru hasil duplikasi di root repo.
4. Ringkas di pesan commit: apa yang **diganti** dan apa yang **dihapus**.
5. Pastikan sedang di branch `staging`, bukan `main`.

## Struktur repo (jangan diubah tanpa diminta)

- `index.html` — halaman utama portal. **Nama file wajib tetap `index.html`**; Railway (Railpack staticfile) butuh file ini di root untuk bisa build. Jangan rename.
- `assets/` — font dan script hasil export desain. Rujuk dari `index.html`, jangan dihapus kecuali benar-benar tidak dipakai lagi.
- `Caddyfile.template` — konfigurasi web server Railway (CSP mengizinkan `unsafe-eval` untuk runtime desain). Jangan diubah kecuali diminta.
- `PRD-bank.md` — PRD produk. Acuan fitur; update isinya (ganti bagian yang berubah) kalau scope berubah.
- `rulebook/` — **sumber kebenaran scoring** (lihat bagian Rulebook di bawah). `rulebook/source/` menyimpan HTML asli sebagai arsip.
- `scripts/` — skrip Node tanpa dependensi untuk konversi, validasi, dan build rulebook. **Jangan tambahkan `package.json` di root**: Railpack akan mendeteksi Node dan merusak deploy statis.
- `assets/scoring-engine.js` dan `assets/rulebook-data.js` — mesin scoring dan data rulebook hasil generate. `rulebook-data.js` dan halaman `rulebook/*.html` dibuat oleh `node scripts/build-rulebook.mjs`; jangan diedit tangan.
- `test/` — unit test mesin scoring (`node --test`).

## Rulebook

Rulebook di `rulebook/*.md` adalah sumber kebenaran scoring. Ubah aturan dengan mengedit MD, bukan kode.

- Parameter mesin scoring ada di frontmatter YAML tiap file cabor. Isi hanya dari teks rulebook; kalau tidak disebut, tulis `null` dan masukkan ke `unverified_fields`. Jangan mengarang angka.
- Setelah mengedit MD: jalankan `node scripts/build-rulebook.mjs` (validasi schema + regenerate), lalu `node --test`, lalu commit hasil generate bersama MD-nya.
- Penanda `⚠️ Verifikasi` di MD jangan dihapus sebelum nilainya benar-benar dicek ke sumber resmi.
- Live scoring di `index.html` tidak boleh punya angka aturan hardcode. Satu-satunya nilai buatan adalah `DEMO_ASSUMED` (agar simulasi jalan saat rulebook belum menetapkan angka) dan skenario demo di `DEMO`; keduanya ditandai di panel aturan.
- Mode operator (`?operator=1`) menyimpan override hanya di browser itu (`localStorage`), belum ada penyimpanan bersama.

## Alur deploy: SEMUA perubahan wajib lewat staging

| Branch | Railway environment | URL |
|---|---|---|
| `staging` | `staging` | https://staging-indonesiascgames2027.20fit.id |
| `main` | `production` | https://indonesiascgames2027.20fit.id |

Aturan:
- **Jangan pernah commit atau push langsung ke `main`.** Tidak ada pengecualian,
  termasuk perubahan kecil, typo, atau perubahan CLAUDE.md.
- Semua pekerjaan dilakukan di branch `staging` (atau branch fitur yang di-merge ke `staging`).
- Push ke `staging` → Railway auto-deploy ke environment staging.
- Setelah push, cek build staging di Railway dan buka URL staging. Kalau build gagal
  atau tampilan rusak, perbaiki di `staging` dulu.
- Naik ke production hanya lewat Pull Request `staging` → `main`, dan hanya setelah
  Ferdinand menyetujui hasil di staging. Jangan merge PR sendiri tanpa persetujuan.
- Sebelum mulai kerja: `git checkout staging && git pull origin staging`.
- Kalau `main` punya commit yang belum ada di `staging`, merge `main` ke `staging` dulu.
