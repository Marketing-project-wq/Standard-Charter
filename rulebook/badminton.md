---
sport: badminton
number: 1
name: Badminton
category: net_raket
source: "BWF (Badminton World Federation), Laws of Badminton"
rules_checked: 2026-10-16
result_type: head_to_head_sets
scoring_mode: rally_point
unit: game
points_to_win_game: 21
win_by: 2
point_cap: 30
games_to_win_match: 2
deciding_game_points: same
variants:
  - id: bwf_laws_v5
    effective_from: 2025-04-26
    effective_to: 2027-01-03
    overrides:
      points_to_win_game: 21
      point_cap: 30
  - id: bwf_laws_v6
    effective_from: 2027-01-04
    effective_to: null
    overrides:
      points_to_win_game: 15
      win_by: null
      point_cap: null
      games_to_win_match: null
    unverified: [win_by, point_cap, games_to_win_match]
status_codes: [DNS, DNF, DQ, WO, RET]
tiebreakers: [head_to_head, game_difference, point_difference, draw_lots]
league_points:
  win: 2
  loss: 0
manual_input_required: false
markers:
  - at: "1.2"
    field: equipment.racket_size
    affects_scoring: false
  - at: "1.8"
    field: league_points.alt_pattern_3_2_1_0
    affects_scoring: true
verified: false
unverified_fields: [league_points.alt_pattern_3_2_1_0]
---

# 1. Badminton

> Kategori: Net dan raket

> **Dokumen acuan:** BWF (Badminton World Federation), *Laws of Badminton*.

> **Terkonfirmasi sumber resmi** · dicek 16 Okt 2026
>
> - Rally point. Game dimenangkan pada 21 poin. Interval maksimal 60 detik saat skor tertinggi mencapai 11, dan maksimal 120 detik antar game. [BWF Laws v5.0 (berlaku 26 Apr 2025)](https://extranet.bwf.sport/docs/document-system/81/1466/1470/Section%204.1%20-%20Laws%20of%20Badminton%20-%2026%20April%202025%20V5.0%20%282%29%20.pdf)
> - Servis yang tidak benar adalah fault (Law 9.1). Shuttle yang tersangkut di atas net setelah servis juga fault. [BWF Laws v5.0](https://extranet.bwf.sport/docs/document-system/81/1466/1470/Section%204.1%20-%20Laws%20of%20Badminton%20-%2026%20April%202025%20V5.0%20%282%29%20.pdf)
> - Pelanggaran etika: peringatan untuk pelanggaran pertama, lalu fault untuk pelanggaran berikutnya (Law 16.7). Pelanggaran saat interval diperlakukan sama seperti saat game. [BWF Laws v5.0](https://extranet.bwf.sport/docs/document-system/81/1466/1470/Section%204.1%20-%20Laws%20of%20Badminton%20-%2026%20April%202025%20V5.0%20%282%29%20.pdf)
> - Pelanggaran etika (Law 16): sengaja menunda atau menghentikan permainan, sengaja mengubah atau merusak shuttle untuk mengubah kecepatan atau terbangnya, atau berperilaku menyerang atau tidak pantas. Wasit memberi peringatan, lalu fault jika sudah pernah diperingatkan, dan langsung fault untuk pelanggaran flagrant. [BWF Laws v2.1 (2023)](https://extranet.bwf.sport/docs/document-system/81/1466/1470/Section%204.1%20-%20Laws%20of%20Badminton%20-%2029%20May%202023%20V2.1.pdf)
> - Kartu kuning menandai peringatan. Kartu merah menandai fault dan wasit melapor ke Referee untuk kemungkinan diskualifikasi. Kartu hitam diberikan saat Referee memutuskan diskualifikasi, yang berlaku untuk seluruh turnamen. [BWF Laws v2.1 (2023)](https://extranet.bwf.sport/docs/document-system/81/1466/1470/Section%204.1%20-%20Laws%20of%20Badminton%20-%2029%20May%202023%20V2.1.pdf)
> - Sistem skor akan berubah. Dokumen "Approved by the BWF AGM 2026" dan versi 6.0 (berlaku 4 Januari 2027) memuat game sampai 15 poin. Sampai versi itu berlaku, game 21 poin yang dipakai. [AGM 2026](https://extranet.bwf.sport/docs/document-system/81/82/4610/Approved%20By%20the%20BWF%20AGM%202026%20-%20Laws%20of%20Badminton.pdf) [Versi 6.0](https://extranet.bwf.sport/docs/document-system/81/1466/1470/Section%204.1%20-%20Laws%20of%20Badminton%20-%2004%20January%202027%20V6.0.pdf)

## 1.1 Ringkasan format

- Tunggal atau ganda (putra, putri, campuran).
- Pertandingan **best of 3 game**, tiap game sampai **21 poin** dengan sistem *rally point*.
- Dimainkan di lapangan berjaring dengan shuttlecock (kok).

## 1.2 Lapangan dan perlengkapan

| Bagian | Ukuran |
|---|---|
| Panjang lapangan | 13,40 m |
| Lebar ganda | 6,10 m |
| Lebar tunggal | 5,18 m |
| Tinggi net | 1,55 m di tiang, 1,524 m di tengah |
| Garis servis pendek | 1,98 m dari net |
| Garis servis panjang (ganda) | 0,76 m di dalam garis belakang |
| Garis servis panjang (tunggal) | Garis belakang |

- Shuttlecock: 16 bulu (atau sintetis), berat 4,74–5,50 g.
- Raket: panjang maksimal 68 cm, lebar maksimal 23 cm. ⚠️ Verifikasi

## 1.3 Jalannya pertandingan

1. **Undian (toss)**: pemenang memilih servis atau sisi lapangan.
2. **Servis awal**: dari kotak kanan, diagonal ke kotak kanan lawan.
3. **Rally**: shuttle dipukul bolak-balik sampai jatuh di lantai, keluar, atau terjadi pelanggaran.
4. **Setelah poin**: pemenang rally mendapat poin dan melakukan servis berikutnya.
5. **Posisi servis**: skor server **genap** → servis dari kotak kanan. Skor **ganjil** → kotak kiri.
6. **Ganti sisi**: setelah game 1, setelah game 2, dan di game 3 ketika salah satu pihak mencapai 11.
7. **Interval**: 60 detik saat salah satu mencapai 11, 120 detik antar game.

**Urutan servis di ganda**

- Tim yang memenangkan rally melakukan servis berikutnya.
- Server yang sama melanjutkan servis, hanya berpindah kotak (kanan/kiri) sesuai skor.
- Jika tim penerima menang rally, **pemain yang berada di kotak kanan (jika skor tim genap)** melakukan servis.
- Tidak ada servis kedua.

## 1.4 Aturan skor

- Setiap rally = 1 poin untuk pemenang rally, **siapa pun** yang servis.
- Game ke 21. Jika 20–20, pemenang harus unggul 2 poin.
- Jika 29–29, poin berikutnya (30) menentukan game.
- Menang pertandingan = menang 2 game.
- Pihak yang menang game melakukan servis pertama di game berikutnya.

## 1.5 Kamus istilah dan pelanggaran

| Istilah | Penjelasan detail | Hukuman |
|---|---|---|
| **Carry / sling** | Shuttle tertahan di senar raket lalu dilempar atau diayunkan, bukan dipukul dengan kontak bersih. Pukulan harus berupa kontak singkat. Jika terlihat "menempel" dan dilontarkan, itu fault. | Poin untuk lawan |
| **Foot fault (servis)** | Saat servis, kedua kaki server dan penerima harus menyentuh lantai dan diam sampai shuttle dipukul. Kaki tidak boleh menyentuh garis atau keluar kotak servis. Melangkah atau menyeret kaki sebelum kontak = fault. | Poin untuk lawan |
| **Service fault lain** | Shuttle dipukul di atas 1,15 m dari lantai; kepala raket tidak lebih rendah dari tangan pemegang; shuttle masuk kotak yang salah; servis ditunda tidak wajar; gerakan servis tidak terus-menerus. | Poin untuk lawan |
| **Double hit** | Satu pemain memukul shuttle dua kali berturut-turut di sisinya. Dua pukulan oleh pasangan ganda juga fault. | Poin untuk lawan |
| **Touching the net** | Raket, badan, atau pakaian menyentuh net atau tiang saat rally berlangsung. | Poin untuk lawan |
| **Over the net** | Memukul shuttle sebelum melewati net ke sisi Anda. Hanya *follow-through* (ayunan lanjutan) yang boleh melewati net. | Poin untuk lawan |
| **Obstruction** | Sengaja menghalangi lawan memukul secara sah, termasuk berteriak atau gerak mengganggu. | Poin untuk lawan |
| **Out** | Shuttle jatuh di luar garis lapangan. Garis termasuk area masuk (kontak dengan garis = masuk). | Poin untuk lawan |
| **Shuttle hits ceiling / wall** | Shuttle mengenai langit-langit atau objek di luar. | Poin untuk pihak yang menyebabkan (jika pukulan terakhir) |
| **Let** | Servis sebelum penerima siap; shuttle tersangkut di net setelah servis; gangguan luar; kok pecah. | Diulang tanpa poin |

## 1.6 Disiplin dan penalti

| Tingkat | Sanksi |
|---|---|
| Peringatan | **Kartu kuning**: peringatan resmi |
| Pelanggaran lanjutan | **Kartu merah**: poin untuk lawan |
| Pelanggaran berat | **Kartu hitam**: DQ dari pertandingan atau turnamen |
| Penundaan | Peringatan, lalu fault |
| Coaching ilegal | Peringatan |

## 1.7 Status hasil

| Istilah | Di badminton |
|---|---|
| **DNS** | Pemain tidak hadir saat dipanggil. Setelah batas waktu (sesuai turnamen), lawan menang W/O. |
| **DNF** | Pertandingan tidak selesai. Biasanya dicatat sebagai RET. |
| **DQ** | Kartu hitam atau pelanggaran berat. Hasil pertandingan dibatalkan. |
| **Forfeit / W/O** | Pemain tidak hadir atau mundur. Skor walkover ditentukan turnamen (contoh 21–0, 21–0). |
| **RET** | Mundur karena cedera. Game yang selesai tetap tercatat, lawan dianggap menang. |
| **Let** | Servis sebelum siap, kok tersangkut, gangguan luar. Rally diulang. |
| **Fault** | Semua pelanggaran di 1.5 memberi **poin ke lawan**. Servis salah juga langsung poin lawan (tidak ada servis kedua). |

## 1.8 Perhitungan dan klasemen

- **Contoh pertandingan**: 21–18, 19–21, 21–15 → pemenang 2–1.
- **Liga**: menang 2 poin, kalah 0 poin (atau pola 3-2-1-0 jika memakai skor game; ⚠️ Verifikasi sesuai turnamen).
- **Tie-breaker klasemen**: 1) head-to-head, 2) selisih game, 3) selisih poin, 4) undian.
- **Turnamen sistem gugur**: pemenang maju, kalah tersingkir.
