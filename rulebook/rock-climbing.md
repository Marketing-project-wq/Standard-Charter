---
sport: rock-climbing
number: 21
name: Rock Climbing (Panjat Tebing)
category: individu
source: "IFSC (International Federation of Sport Climbing), IFSC Rules"
rules_checked: 2026-10-16
result_type: timed
ranking: lowest_time
time_precision: null
penalties: []
disciplines:
  speed:
    result: lowest_time
    head_to_head: true
    wall_height_m: 15
    false_start: DQ
    false_start_reaction_seconds: 0.1
  boulder:
    result: top_zone_attempts
    scoring_system: null
    zone_points: 10
    zone_attempt_penalty_points: 0.1
    top_points: null
  lead:
    result: highest_hold
extra:
  combined_ranking: null
status_codes: [DNS, DNF, DQ, WO, RET]
tiebreakers:
  - count_back_previous_round
  - fewest_attempts_on_tops
  - fewest_attempts_on_zones
league_points: null
manual_input_required: false
markers:
  - at: "21.3"
    field: disciplines.speed.false_start
    affects_scoring: true
  - at: "21.4"
    field: disciplines.boulder.time_minutes
    affects_scoring: false
  - at: "21.4"
    field: disciplines.boulder.scoring_system
    affects_scoring: true
  - at: "21.8"
    field: extra.combined_ranking
    affects_scoring: true
verified: false
unverified_fields:
  - time_precision
  - disciplines.speed.false_start
  - disciplines.boulder.scoring_system
  - disciplines.boulder.top_points
  - extra.combined_ranking
---

# 21. Rock Climbing (Panjat Tebing)

> Kategori: Individu

> **Dokumen acuan:** IFSC (International Federation of Sport Climbing), *IFSC Rules*.

> **Terkonfirmasi sumber resmi** · dicek 16 Okt 2026
>
> - Lead: percobaan dimulai saat pemanjat meninggalkan tanah. Waktu memanjat tidak lebih dari 6 menit, batas pastinya ditetapkan regulasi kompetisi. Lead berhasil jika pemanjat meng-clip anchor terakhir (§8.3). [IFSC Competition Rules v3, Jan 2026](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/jaq7awz9jmqwpddwnbpr.pdf)
> - Speed: start dihitung dari yang lebih awal antara sinyal start atau gaya di start pad turun di bawah ambang. Start dinyatakan false start jika waktu reaksi kurang dari 0,100 detik. Pada versi 2025 ada syarat tambahan: waktu reaksi juga harus lebih rendah dari semua pemanjat lain. [IFSC Competition Rules v3, Jan 2026](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/jaq7awz9jmqwpddwnbpr.pdf)
> - Boulder: berhasil dengan mencapai posisi berdiri di atas, atau menahan hold akhir dengan dua tangan dalam kontrol (§8.5). Satu boulder tidak lebih dari 12 pegangan. [IFSC Competition Rules v3, Jan 2026](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/jaq7awz9jmqwpddwnbpr.pdf)
> - Boulder: zone bernilai 10 poin, dengan pengurangan 0,1 poin untuk tiap percobaan sebelum zone didapat (§5.1). Satu pencarian lain menyebut top bernilai 25 poin, tetapi pencarian kedua tidak bisa memastikannya. [IFSC Event Regulations v3, Jan 2026](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/brsjsyh2ea4fxinl8nsa.pdf)
> - Speed: jika dua pemanjat mencatat waktu sama di bracket Speed 2, lomba diulang (§6.2). [IFSC Event Regulations v3](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/brsjsyh2ea4fxinl8nsa.pdf)
> - Boulder: seri diselesaikan berurutan dengan count-back ke peringkat umum babak sebelumnya, lalu jumlah percobaan paling sedikit pada boulder yang berhasil, lalu jumlah percobaan paling sedikit untuk zone. Count-back tidak berlaku jika babak sebelumnya memakai beberapa kelompok start. [IFSC Event Regulations v3](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/brsjsyh2ea4fxinl8nsa.pdf)
> - Lead: peringkat pada satu rute dimulai dari semua yang berhasil, lalu yang gagal menurut skor menurun. Speed kualifikasi: peringkat menurut waktu valid terbaik. [IFSC Event Regulations v3](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/brsjsyh2ea4fxinl8nsa.pdf)

## 21.1 Ringkasan format

- Berdasarkan aturan **IFSC**.

## 21.2 Disiplin dan perlengkapan

| Disiplin | Penjelasan |
|---|---|
| **Speed** | Dinding standar 15 m, dua pemanjat berlomba di rute identik. Hasil: **waktu**. |
| **Boulder** | Dinding rendah (sekitar 4–5 m), tanpa tali, dengan matras. Beberapa problem, hasil dari jumlah top dan zone. |
| **Lead** | Dinding tinggi dengan tali. Hasil: hold tertinggi yang dicapai. |

## 21.3 Speed

**Jalannya**

1. **Start pad**: pemanjat menaruh tangan di hold awal dan kaki di start pad.
2. **Sinyal**: "Climbers ready", lalu bunyi beep. Pemanjat naik.
3. **Finis**: pemanjat menekan **pad finis** di puncak.
4. **Duel**: dua pemanjat, yang lebih cepat menang.

**Pelanggaran**

| Istilah | Penjelasan detail | Akibat |
|---|---|---|
| **False start** | Pemanjat meninggalkan pad sebelum sinyal start (atau reaksi terlalu cepat). | **DQ** (aturan IFSC saat ini ⚠️ Verifikasi berubah antar edisi) |
| **Jatuh** | Pemanjat jatuh di tengah rute. | Kalah |
| **Tidak menyentuh pad finis** | Pemanjat tidak menyentuh pad di puncak. | Kalah |

## 21.4 Boulder

**Jalannya**

1. **Observasi**: pemanjat melihat problem sebelum memanjat (waktu terbatas).
2. **Waktu**: sekitar 4–5 menit per problem. ⚠️ Verifikasi
3. **Percobaan**: pemanjat boleh mencoba berkali-kali dalam waktu itu.
4. **Top**: pemanjat mengendalikan hold terakhir dengan dua tangan.
5. **Zone**: hold tengah yang menjadi titik hitung.

**Istilah**

| Istilah | Penjelasan |
|---|---|
| **Top** | Mengendalikan hold terakhir problem dengan dua tangan. |
| **Zone** | Hold tengah yang menjadi titik hitung. |
| **Attempt** | Setiap kali pemanjat melepas tanah dan mulai problem dihitung percobaan. |

**Skor (sistem lama)**: jumlah **top**, lalu jumlah **zone**, lalu jumlah **percobaan**. ⚠️ Verifikasi IFSC memperkenalkan sistem poin baru pada 2025 (top bernilai poin tinggi, zone lebih rendah, pengurangan kecil per percobaan). Cek versi yang dipakai.

**Contoh**: A 3 top, 4 zone, 7 percobaan top; B 3 top, 4 zone, 9 percobaan → **A menang**.

## 21.5 Lead

**Jalannya**

1. **Rute**: pemanjat diobservasi dulu, lalu memanjat dengan tali.
2. **Waktu**: sekitar 6 menit per rute.
3. **Skor**: hold tertinggi yang dicapai (hold bernomor). Hold "+" jika sudah melewati hold itu.
4. **Jatuh**: mengakhiri percobaan.
5. **Skor seri**: dilihat dari waktu (lebih cepat menang) atau hasil babak sebelumnya.

## 21.6 Disiplin

| Pelanggaran | Sanksi |
|---|---|
| False start (speed) | DQ |
| Menyentuh hold atau area di luar rute | Penalti atau DQ |
| Menggunakan dinding samping | Penalti atau DQ |
| Melewati batas waktu | Percobaan berakhir |
| Perilaku tidak sportif | Peringatan atau DQ |

## 21.7 Status hasil

| Istilah | Di panjat tebing |
|---|---|
| **DNS** | Pemanjat tidak hadir di zona isolasi atau tidak memanjat. |
| **DNF** | Tidak menyelesaikan rute (jatuh, waktu habis). Skor lead = hold tertinggi. |
| **DQ** | False start (speed), menyentuh area di luar rute, atau pelanggaran berat. |
| **Forfeit / W/O** | Di speed head-to-head, lawan yang tidak hadir kalah. |
| **RET** | Pemanjat cedera, mundur dari ronde. |
| **Let** | Tidak ada. Padanannya ***re-climb***: percobaan diulang jika ada masalah teknis (hold longgar, sensor start bermasalah). |
| **Fault** | Padanannya **pelanggaran**: false start, menyentuh area luar rute, melewati batas waktu. |

## 21.8 Perhitungan dan klasemen

- **Speed**: waktu terkecil menang. Contoh: 6,10 s vs 6,85 s.
- **Boulder**: top → zone → percobaan (atau sistem poin baru).
- **Lead**: hold tertinggi.
- **Kombinasi**: jika beberapa disiplin dipakai, peringkat dikali atau dijumlahkan menurut aturan event. ⚠️ Verifikasi
