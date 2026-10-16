---
sport: hyrox
number: 22
name: Hyrox
category: individu
source: "HYROX, Official Rulebook Single 26/27 (rulebook penyelenggara komersial)"
rules_checked: 2026-10-16
result_type: timed
ranking: lowest_time
time_precision: null
laps: 8
stations:
  - no: 1
    name: SkiErg
    distance_m: 1000
  - no: 2
    name: Sled Push
    distance_m: 50
  - no: 3
    name: Sled Pull
    distance_m: 50
  - no: 4
    name: Burpee Broad Jump
    distance_m: 80
  - no: 5
    name: Rowing
    distance_m: 1000
  - no: 6
    name: Farmers Carry
    distance_m: 200
  - no: 7
    name: Sandbag Lunges
    distance_m: 100
  - no: 8
    name: Wall Balls
    reps: 100
station_weights:
  sled_push:
    women_open_kg: 102
    men_open_and_women_pro_kg: 152
    men_pro_kg: 202
  sled_pull:
    women_open_kg: 78
    men_open_and_women_pro_kg: 103
    men_pro_kg: 153
  sandbag_lunges:
    women_open_kg: 10
    men_open_and_women_pro_kg: 20
    men_pro_kg: 30
  farmers_carry:
    women_open_kg_each: 16
    men_open_and_women_pro_kg_each: 24
    men_pro_kg_each: 32
  wall_balls:
    women_open_kg: 4
    men_open_and_women_pro_kg: 6
    men_pro_kg: 9
penalties:
  - code: EXIT_STATION_VIA_IN_GATE
    seconds: 120
    per: violation
  - code: UNASSIGNED_LANE_OR_EQUIPMENT
    seconds: 120
    per: violation
  - code: ROWING_AFTER_FIRST_WARNING
    seconds: 15
    per: violation
    first_is_warning: true
  - code: SLED_PUSH_AFTER_FIRST_WARNING
    seconds: 15
    per: violation
    first_is_warning: true
  - code: BURPEE_BROAD_JUMP_AFTER_FIRST_WARNING
    seconds: 15
    per: violation
    first_is_warning: true
  - code: SANDBAG_REMOVED_FROM_SHOULDERS
    seconds: 15
    per: violation
  - code: FARMERS_CARRY_WRONG_KETTLEBELL_RETURN
    seconds: 30
    per: violation
  - code: CHALK_AT_WALL_BALL_STATION
    seconds: 120
    per: violation
  - code: RUN_SHORT_2_LAPS
    seconds: 420
    per: race
  - code: RUN_SHORT_3_LAPS
    seconds: 300
    per: race
  - code: RUN_SHORT_4_LAPS
    seconds: 180
    per: race
  - code: FIRST_STATION_OUT_OF_ORDER
    seconds: 180
    per: race
  - code: SWAP_ROXZONE_IN_OUT_GATES
    seconds: 120
    per: violation
  - code: OUTSIDE_HELP
    seconds: 120
    per: violation
extra:
  dq_reasons:
    - run_short_1_lap
    - more_than_one_station_out_of_order
    - skipped_sled_lane_or_farmers_carry_lap
    - wrong_wave_without_permission
    - wrong_weight_not_repeated
    - left_skierg_before_1000m
  no_chip: DNS
status_codes: [DNS, DNF, DQ]
tiebreakers: [same_position]
league_points: null
manual_input_required: false
markers: []
verified: false
unverified_fields: [station_weights.sled_push, station_weights.sled_pull, time_precision]
---

# 22. Hyrox

> Kategori: Individu

> **Rulebook milik penyelenggara:** **Dokumen acuan:** HYROX (penyelenggara komersial, bukan federasi dunia), *HYROX Official Rulebook (berubah tiap musim)*.

> **Terkonfirmasi sumber resmi** · dicek 16 Okt 2026
>
> - Rulebook Single musim 26/27: 8 putaran, lari 1 km sebelum tiap stasiun. SkiErg 1.000 m, rowing 1.000 m, burpee broad jump 80 m untuk semua divisi. Sled push dan sled pull masing-masing 4 × 12,5 m, lunges 100 m, farmers carry 200 m, wall balls 100 repetisi. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Bobot sesuai divisi tercantum di tabel bobot di bawah. Pada Kejuaraan Dunia semua divisi memakai bobot PRO kecuali Mixed Doubles dan atlet 60+ yang memakai bobot OPEN. Di Mixed Doubles, kedua atlet memakai bobot Open putra (bola 6 kg). [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf) [Judges Training](https://hyrox.com/judges-training/)
> - Keluar dari stasiun lewat gerbang IN dihukum 2 menit. Memakai lajur, peralatan, atau stasiun wall ball yang tidak ditugaskan Race Crew dihukum 2 menit per pelanggaran. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Dayung: pelanggaran pertama peringatan resmi, kedua 15 detik, dan tiap pelanggaran berikutnya 15 detik tambahan tanpa peringatan lagi. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Farmers Carry dengan beban salah: ulang seluruh stasiun dengan beban benar, jika tidak DQ. Wall balls: tidak ada peringatan, hanya rep atau no-rep. Kapur bubuk di stasiun wall ball dihukum 2 menit. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Wall balls: target 3,00 m untuk putra dan 2,70 m untuk putri, dengan bola 9 kg (Pro putra), 6 kg (Open putra dan Pro putri), 4 kg (Open putri), 100 repetisi. Repetisi dihitung hanya jika gerakan sesuai standar dan bola mengenai target fisik. Target fisik dan juri yang menentukan, bukan layar digital. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Kedalaman squat: rulebook 25/26 menyebut squat di bawah paralel sebelum melempar. Rulebook 26/27 menuliskan squat penuh, sehingga rumusannya berubah. Definisi persis 26/27 belum terbaca. [Rulebook 25/26](https://hyrox.com/wp-content/uploads/2025/07/25_26_HYROX_RulebookSingles_EN.pdf) [Rulebook 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Sandbag Lunges: lutut belakang harus jelas menyentuh tanah di setiap lunge, dan lutut serta pinggul harus lurus penuh di atas tiap repetisi. Lunges bergantian lutut, tanpa langkah atau geser di antara repetisi. Sandbag harus tetap tertopang penuh di kedua bahu dan tidak boleh diletakkan di tanah, pembatas, kaki, atau permukaan lain. Melepas sandbag dari bahu dikenai 15 detik per pelanggaran. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Burpee Broad Jump: dada harus jelas menyentuh tanah di dasar tiap burpee (garis puting menyentuh lantai). Tangan tidak boleh maju setelah ditempatkan, dan di burpee berikutnya harus mendarat dalam 30 cm dari ujung kaki depan. Kaki tidak boleh melewati ujung jari saat melompat atau melangkah keluar. Lompatan tidak boleh didahului langkah atau geseran tambahan. Peringatan dulu, lalu 15 detik per pelanggaran berikutnya. Jika kaki mendarat di garis finis, lompat lagi. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Sled Push dan Sled Pull: 4 lajur 12,5 m. Juri menentukan lajur dan atlet harus tetap di lajurnya. Sled harus melewati penanda 12,5 m sepenuhnya sebelum atlet berganti arah. Sebelum mulai, sled dan atlet harus sepenuhnya di dalam Racers Box. Pelanggaran sled push: peringatan formal, lalu 15 detik, dan tiap pelanggaran berikutnya 15 detik lagi. Sled pull: atlet harus tetap berdiri, tidak boleh menarik dari posisi duduk atau berlutut. Tali boleh melewati belakang lajur tetapi tidak boleh mengganggu lajur sebelah. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Farmers Carry: kettlebell harus dikembalikan ke kotak yang benar dengan gagang tegak. Pengembalian yang salah dikenai 30 detik. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Alasan DQ (hanya Race Director yang boleh menjatuhkan, berdasarkan masukan juri): mulai di wave yang bukan jadwal tanpa izin penyelenggara, meninggalkan SkiErg sebelum 1.000 m, melewatkan lajur sled atau lap Farmers Carry, memakai beban yang salah dan tidak mengulang stasiun, lebih dari satu stasiun dikerjakan tidak berurutan, menerima bantuan dari orang lain, dan perilaku tidak sportif (bisa penalti, DQ, atau larangan seumur hidup). [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Lari kurang lap: setup 1 lap = DQ. Setup 2, 3, atau 4 lap = penalti 7, 5, atau 3 menit. Stasiun pertama yang tidak berurutan = 3 menit. Menukar gerbang Roxzone IN dan OUT = 2 menit per pelanggaran. Bantuan dari luar (kode 18) = 2 menit per pelanggaran. Meludah atau membersihkan hidung = 2 menit atau DQ sesuai Race Director. Tanpa chip = Did Not Start, bukan DQ. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)
> - Stasiun 1 sampai 7 memberi satu peringatan untuk masalah standar gerakan. Juri dapat memberi penalti saat itu juga. Penalti bisa ditambah atau diubah sampai 48 jam setelah acara berakhir. [HYROX Rulebook Single 26/27](https://maintain.hyrox.com/rulebooks/HYROX_RulebookSingles_EN.pdf)

## 22.1 Ringkasan format

- Lomba kebugaran fungsional: **8 putaran** masing-masing **lari 1 km + satu stasiun kerja**. Total lari 8 km.
- Kategori: **Single** (Open/Pro), **Doubles**, **Relay**, dengan pembagian gender dan usia.
- Hasil: **waktu total**.
- Berdasarkan HYROX Rulebook Single musim 26/27, rulebook milik perusahaan Hyrox.

## 22.2 Urutan lomba

| No | Stasiun | Jarak/repetisi |
|---|---|---|
| 0 | Lari 1 km |  |
| 1 | **SkiErg** | 1.000 m |
| 1 | Lari 1 km |  |
| 2 | **Sled Push** | 50 m |
| 2 | Lari 1 km |  |
| 3 | **Sled Pull** | 50 m |
| 3 | Lari 1 km |  |
| 4 | **Burpee Broad Jump** | 80 m |
| 4 | Lari 1 km |  |
| 5 | **Rowing** | 1.000 m |
| 5 | Lari 1 km |  |
| 6 | **Farmers Carry** | 200 m |
| 6 | Lari 1 km |  |
| 7 | **Sandbag Lunges** | 100 m |
| 7 | Lari 1 km |  |
| 8 | **Wall Balls** | 100 repetisi |

Setiap stasiun didahului satu lari 1 km. Wall Balls adalah stasiun terakhir lalu atlet finis.

## 22.3 Bobot (Single, musim 26/27)

| Stasiun | Putri Open | Putra Open dan Putri Pro | Putra Pro |
|---|---|---|---|
| Sled Push (4 × 12,5 m, termasuk sled) | 102 kg | 152 kg | 202 kg |
| Sled Pull (4 × 12,5 m, termasuk sled) | 78 kg | 103 kg | 153 kg |
| Sandbag Lunges (100 m) | 10 kg | 20 kg | 30 kg |
| Farmers Carry (200 m) | 2 × 16 kg | 2 × 24 kg | 2 × 32 kg |
| Wall Balls (100 repetisi) | 4 kg | 6 kg | 9 kg |

> Tabel ini dibaca dari ekstraksi PDF yang acak. Nilai sled paling perlu dicek ke PDF rulebook. Ketinggian target wall ball tidak terbaca.

## 22.4 Standar gerakan dan istilah

| Istilah | Penjelasan detail | Akibat |
|---|---|---|
| **SkiErg** | Menarik dua gagang ke bawah menggerakkan roda. Jarak 1.000 m di monitor. | — |
| **Sled Push** | 4 lajur 12,5 m. Sled harus melewati penanda 12,5 m sepenuhnya sebelum berganti arah. | Peringatan, lalu 15 detik per pelanggaran |
| **Sled Pull** | 4 lajur 12,5 m. Atlet harus tetap berdiri, tidak boleh duduk atau berlutut saat menarik. | Sesuai tabel penalti |
| **Burpee Broad Jump** | Dada (garis puting) jelas menyentuh lantai di dasar tiap burpee, lalu melompat ke depan. 80 m total. | Peringatan, lalu 15 detik per pelanggaran |
| **Rowing** | Rowing ergometer 1.000 m. | — |
| **Farmers Carry** | Membawa dua kettlebell 200 m dan mengembalikannya ke kotak yang benar dengan gagang tegak. | 30 detik jika salah dikembalikan. Beban salah = ulang stasiun, jika tidak DQ |
| **Sandbag Lunges** | Lunges 100 m dengan kantong pasir tetap di kedua bahu. Lutut belakang harus jelas menyentuh tanah tiap lunge. | 15 detik jika sandbag dilepas dari bahu |
| **Wall Balls** | Squat sampai pinggul di bawah lutut, lalu lempar bola ke target. 100 repetisi. | **No-rep** jika bola di bawah target atau squat tidak dalam |
| **No-rep** | Repetisi atau gerakan tidak memenuhi standar, tidak dihitung dan harus diulang. Padanan dari *let/fault*. | Ulang, mungkin penalti waktu |
| **Roxzone** | Area transisi antara lari dan stasiun. Waktunya dihitung bagian dari total. | — |
| **Stay in lane** | Sled dan stasiun lain harus tetap di jalurnya. | Penalti |

## 22.5 Disiplin dan penalti (rulebook Single 26/27)

| Pelanggaran | Sanksi |
|---|---|
| Keluar stasiun lewat gerbang IN | 2 menit |
| Memakai lajur, peralatan, atau stasiun wall ball yang tidak ditugaskan Race Crew | 2 menit per pelanggaran |
| Dayung: pelanggaran pertama | Peringatan resmi |
| Dayung: pelanggaran kedua dan seterusnya | 15 detik tiap pelanggaran, tanpa peringatan lagi |
| Farmers Carry dengan beban salah | Ulang seluruh stasiun dengan beban benar, jika tidak DQ |
| Wall balls | Hanya rep atau no-rep, tanpa peringatan |
| Kapur bubuk di stasiun wall ball | 2 menit |
| Lari kurang lap | Setup 1 lap: DQ. Setup 2, 3, atau 4 lap: penalti 7, 5, atau 3 menit |
| Stasiun tidak berurutan | 3 menit untuk yang pertama. Lebih dari satu: DQ |
| Melewatkan lajur sled atau lap Farmers Carry | DQ |
| Menukar gerbang Roxzone IN dan OUT | 2 menit per pelanggaran |
| Bantuan dari luar | 2 menit per pelanggaran, bisa DQ |
| Mulai di wave yang salah tanpa izin | DQ |

## 22.6 Status hasil

| Istilah | Di Hyrox |
|---|---|
| **DNS** | Atlet terdaftar tapi tidak start di gelombang (*wave*) yang ditentukan. |
| **DNF** | Atlet tidak menyelesaikan 8 putaran, . |
| **DQ** | Melewatkan stasiun, keluar rute, bantuan tidak sah, atau pelanggaran berat. |
| **Forfeit / W/O** | Tidak berlaku (lomba individu atau tim waktu). Tim Doubles/Relay yang tidak hadir = DNS. |
| **RET** | Atlet berhenti karena cedera atau sakit. Dicatat DNF. |
| **Let** | Tidak ada. Padanannya: gerakan *no-rep* diulang tanpa hitung. |
| **Fault** | Padanannya ***no-rep*** atau **penalti waktu**. |

## 22.7 Perhitungan dan klasemen

- **Hasil** = waktu total = 8 putaran lari + 8 stasiun + waktu transisi (*Roxzone*) + penalti.
- **Contoh**: lari 40:00 + stasiun 35:00 + transisi 3:00 + penalti 0:20 = **1:18:20**.
- **Doubles**: waktu tim (dua atlet menyelesaikan bersama).
- **Relay**: jumlah waktu tiap anggota.
- **Peringkat**: waktu terkecil per kategori menang.
- **Seri waktu**: posisi sama.
