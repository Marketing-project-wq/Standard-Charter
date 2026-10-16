---
sport: basketball
number: 8
numbers: [8, 9]
name: Basketball (M) dan (W)
category: tim
source: "FIBA, Official Basketball Rules"
rules_checked: 2026-10-16
result_type: head_to_head_score
periods: 4
period_label: quarter
period_minutes: 10
overtime:
  period_minutes: 5
  repeat: until_winner
score_events:
  free_throw: 1
  two_pointer: 2
  three_pointer: 3
walkover:
  score: [20, 0]
extra:
  ball_size:
    men: 7
    women: 6
status_codes: [DNS, DNF, DQ, WO]
tiebreakers: [head_to_head, point_difference, total_points]
league_points:
  win: 2
  loss: 1
  loss_forfeit: 0
manual_input_required: false
markers:
  - at: "8.3"
    field: rules.timeouts
    affects_scoring: false
  - at: "8.7"
    field: rules.team_foul_bonus
    affects_scoring: false
verified: true
unverified_fields: []
---

# 8–9. Basketball (M) dan (W)

> Kategori: Tim

> **Dokumen acuan:** FIBA, *Official Basketball Rules (3x3: FIBA 3x3 Official Rules)*.

> **Terkonfirmasi sumber resmi** · dicek 16 Okt 2026
>
> - FIBA Official Basketball Rules 2026 berlaku mulai 1 Oktober 2026. [FIBA Rules 2026 v1.1](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-1.pdf)
> - Ada dua kategori foul teknis menurut sifat dan beratnya. Hanya satu kategori yang dihitung menuju diskualifikasi pertandingan. [Ringkasan perubahan FIBA](https://about.fiba.basketball/en/news/fiba-official-basketball-rules-changes-2026-summary-now-available)
> - Foul unsportsmanlike diganti dengan foul *disruptive* dan *flagrant*. Foul disruptive dihitung sebagai foul tim dan diikuti lemparan masuk dari garis lemparan masuk di area depan. [Ringkasan perubahan FIBA](https://about.fiba.basketball/en/news/fiba-official-basketball-rules-changes-2026-summary-now-available)
> - Instant replay boleh memeriksa apakah tembakan dilepas sebelum bunyi shot clock atau game clock, dan apakah ada foul saat lemparan masuk di 2 menit terakhir. Aturan reset shot clock dari 2024 tetap berlaku. [Ringkasan perubahan FIBA](https://about.fiba.basketball/en/news/fiba-official-basketball-rules-changes-2026-summary-now-available)
> - Pertandingan terdiri dari 4 kuarter masing-masing 10 menit. Interval 2 menit antara kuarter 1 dan 2, antara 3 dan 4, dan sebelum tiap overtime. [FIBA Rules 2026](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-0.pdf)
> - Shot clock dimulai 24 detik saat tim menguasai bola hidup. Setelah henti, lemparan masuk di area depan me-reset ke 14 detik jika tersisa 13 detik atau kurang. Jika tersisa 14 detik atau lebih, jam tidak di-reset dan berlanjut. [FIBA Rules 2026](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-0.pdf)
> - Disruptive foul (Art. 37): kontak ilegal non-flagrant yang mengganggu permainan dan merugikan lawan, misalnya menghentikan fast break atau menghentikan jam di akhir periode. Hukumannya foul tim, lemparan bebas untuk pemain yang difoul, lalu lemparan masuk dari garis depan. Tidak dihitung menuju diskualifikasi. [FIBA Rules 2026](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-1.pdf)
> - Flagrant foul (Art. 38): kontak ilegal yang melanggar semangat sportivitas, termasuk tindakan ceroboh, keras, atau berbahaya. Hukumannya foul tim, lemparan bebas, dan lemparan masuk dari garis depan. Dihitung menuju diskualifikasi. [FIBA Rules 2026](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-1.pdf)
> - Pemain didiskualifikasi dari sisa pertandingan setelah 2 flagrant foul, 2 foul teknis kategori 1, atau 1 foul teknis kategori 1 dan 1 flagrant foul. Jika diskualifikasi akibat flagrant foul, hanya flagrant foul itu yang dihukum tanpa penalti tambahan (Art. 38.2.4). Foul teknis kategori 1 mencakup perilaku seperti komunikasi tidak hormat ke ofisial dan memancing lawan. [FIBA Rules 2026](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-1.pdf)
> - Disqualifying foul (Art. 39): tindakan tidak sportif yang flagrant oleh pemain, pengganti, pelatih, atau anggota delegasi lain. Pelaku harus ke ruang ganti atau meninggalkan gedung. [FIBA Rules 2026](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-1.pdf)
> - Aturan 3x3 ada di dokumen terpisah (FIBA Internal Regulations Book 6). [Book 6](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-regulations-internal-regulations-book-6.pdf)

> Aturan sama untuk putra dan putri (FIBA). Perbedaan hanya **ukuran bola** (putra: ukuran 7, putri: ukuran 6) dan kategori peserta.

## 8.1 Ringkasan format

- Interval: 2 menit antar kuarter, 15 menit di tengah pertandingan.

## 8.2 Lapangan dan perlengkapan

| Bagian | Ukuran |
|---|---|
| Lapangan | 28 m × 15 m |
| Ring | 3,05 m dari lantai |
| Garis tiga angka | 6,75 m (FIBA) |
| Garis lemparan bebas | 4,60 m |
| Bola putra | Ukuran 7 (keliling 74,9–78 cm) |
| Bola putri | Ukuran 6 (keliling 72,4–73,7 cm) |

## 8.3 Jalannya pertandingan

1. **Jump ball** awal: wasit melempar bola di lingkaran tengah. Setelahnya, kepemilikan awal kuarter diatur oleh *alternating possession arrow*.
2. **Gerak bola**: pemain bergerak dengan *dribbling*, operan, atau tembakan.
3. **Time-out**: 2 di babak pertama, 3 di babak kedua (maksimal 2 di 2 menit terakhir kuarter 4), 1 per overtime. ⚠️ Verifikasi Detail ada di FIBA.
4. **Substitusi**: saat bola mati.
5. **Overtime**: 5 menit sampai ada pemenang.

## 8.4 Aturan skor

| Tembakan | Poin |
|---|---|
| Lemparan bebas | 1 |
| Tembakan di dalam garis tiga angka | 2 |
| Tembakan di luar garis tiga angka | 3 |

## 8.5 Kamus istilah dan pelanggaran

| Istilah | Penjelasan detail | Hukuman |
|---|---|---|
| **Travelling** | Berjalan lebih dari dua langkah sambil memegang bola, atau memindahkan kaki poros (*pivot foot*) setelah menerima bola. | Bola ke lawan |
| **Double dribble** | Mendribel, memegang bola dengan dua tangan, lalu mendribel lagi. Atau mendribel dengan dua tangan sekaligus. | Bola ke lawan |
| **Carrying / palming** | Tangan berada di bawah bola saat mendribel sehingga bola tertahan. | Bola ke lawan |
| **Backcourt violation** | Bola yang sudah masuk setengah lapangan lawan tidak boleh dikembalikan ke setengah lapangan sendiri oleh tim yang menguasai. | Bola ke lawan |
| **8 detik** | Tim harus memindahkan bola ke setengah lapangan lawan dalam 8 detik. | Bola ke lawan |
| **24 detik (shot clock)** | Tim harus melepas tembakan yang mengenai ring dalam 24 detik. Setelah rebound serangan, jam ditetapkan 14 detik. | Bola ke lawan |
| **3 detik** | Pemain serang tidak boleh berada di area kunci lebih dari 3 detik berturut-turut. | Bola ke lawan |
| **5 detik** | Pemain yang dijaga ketat tidak boleh memegang bola lebih dari 5 detik. Inbound juga maksimal 5 detik. | Bola ke lawan |
| **Goaltending** | Menyentuh bola yang sedang turun menuju ring atau berada di atas ring. | Poin diberikan |
| **Charging** | Penyerang menabrak bek yang sudah diam di posisi. | Foul penyerang |
| **Blocking** | Bek menghalangi sebelum posisinya mantap. | Foul bek |
| **Foul pribadi** | Kontak ilegal: mendorong, menahan, memukul. | Lemparan bebas atau inbound |
| **Foul tim** | Foul tim ke-5 per kuarter dan seterusnya memberi lawan lemparan bebas (*bonus*). | Lemparan bebas |
| **Foul teknis** | Perilaku buruk tanpa kontak. Sejak 1 Oktober 2026 ada dua kategori, dan hanya satu kategori yang dihitung menuju diskualifikasi | Kategori 1 (perilaku seperti komunikasi tidak hormat ke ofisial dan memancing lawan) dihitung menuju diskualifikasi |
| **Disruptive foul** (menggantikan unsportsmanlike sejak 2026) | Foul yang mengganggu jalannya permainan | Foul tim, lemparan bebas untuk pemain yang difoul, lalu lemparan masuk dari garis depan. Tidak dihitung menuju diskualifikasi |
| **Flagrant foul** (menggantikan unsportsmanlike sejak 2026) | Foul berat atau berbahaya | Foul tim, lemparan bebas, dan lemparan masuk dari garis depan. Dihitung menuju diskualifikasi (2 flagrant = diskualifikasi) |
| **Held ball** | Dua pemain memegang bola sama kuat. | *Alternating possession arrow* |

## 8.6 Aturan foul

- Maksimal **5 foul** per pemain, pemain keluar (*fouled out*).
- Foul tim: dari foul ke-5 per kuarter, setiap foul berikutnya = lemparan bebas.
- Foul saat menembak: 2 atau 3 lemparan bebas sesuai jenis tembakan; jika tembakan masuk, hitung dan 1 lemparan bebas tambahan (*and-one*).

## 8.7 Format 3x3 (FIBA)

- 3 lawan 3, satu ring, setengah lapangan.
- 10 menit atau sampai 21 poin (mana yang lebih dulu).
- Poin: 1 (dalam garis), 2 (luar garis).
- Shot clock **12 detik**. Foul tim: lemparan bebas mulai foul ke-7 (⚠️ Verifikasi cek aturan terbaru).
- Overtime: poin pertama sampai 2.

## 8.8 Status hasil

| Istilah | Di basket |
|---|---|
| **DNS** | Tim tidak hadir. |
| **DNF** | Pertandingan dihentikan. Hasil mengikuti keputusan panitia. |
| **DQ** | Pemain: *disqualifying foul* (diusir). Tim: dikeluarkan dari turnamen. |
| **Forfeit / W/O** | Tim tidak punya 5 pemain 15 menit setelah jadwal, kalah **20–0**. Tim dengan kurang dari 2 pemain di lapangan kalah (*default*). |
| **RET** | Pemain keluar karena cedera atau *fouled out* (5 foul). Tim lanjut dengan pengganti. |
| **Let** | Tidak ada. Padanannya ***held ball / jump ball***: bola diperebutkan, kepemilikan bergantian. |
| **Fault** | Dua jenis: **violation** (travelling, backcourt, jam) = bola ke lawan; **foul** = lemparan bebas atau inbound. |

## 8.9 Perhitungan dan klasemen

- **Contoh skor**: 8 tembakan dua angka (16) + 4 tembakan tiga angka (12) + 6 lemparan bebas (6) = 34.
- **Poin liga (FIBA)**: menang 2, kalah 1 (jika bermain penuh), kalah forfeit 0.
- **Tie-breaker**: head-to-head → selisih poin → total poin.
- Overtime 5 menit tiap kali seri.
