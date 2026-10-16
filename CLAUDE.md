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

## Struktur repo (jangan diubah tanpa diminta)

- `index.html` — halaman utama portal. **Nama file wajib tetap `index.html`**; Railway (Railpack staticfile) butuh file ini di root untuk bisa build. Jangan rename.
- `assets/` — font dan script hasil export desain. Rujuk dari `index.html`, jangan dihapus kecuali benar-benar tidak dipakai lagi.
- `Caddyfile.template` — konfigurasi web server Railway (CSP mengizinkan `unsafe-eval` untuk runtime desain). Jangan diubah kecuali diminta.
- `PRD-bank.md` — PRD produk. Acuan fitur; update isinya (ganti bagian yang berubah) kalau scope berubah.

## Deploy

- Push ke branch `main` → Railway auto-deploy (project `radiant-youth`, service `Standard-Charter`, env `production`).
- Domain custom: `indonesiascgames2027.20fit.id`.
- Setelah push, cek build di Railway. Kalau gagal, perbaiki dulu sebelum lanjut ke perubahan lain.
