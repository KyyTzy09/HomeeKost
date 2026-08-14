---
name: HomeeKost Sage & Cream Dashboard
source: docs/examples/KostManagement.html
mode: light
colors:
  background: '#faf9f5'
  background-alt: '#f5f8f5'
  surface: '#ffffff'
  surface-soft: '#fbfcfb'
  surface-muted: '#f7faf7'
  surface-subtle: '#f3f7f3'
  surface-elevated: '#ffffff'
  text-primary: '#252925'
  text-secondary: '#737873'
  text-tertiary: '#8a958d'
  border: '#e4e9e4'
  border-soft: '#edf0ed'
  primary: '#4f6958'
  primary-hover: '#425949'
  primary-accent: '#718b78'
  primary-soft: '#e8f0ea'
  primary-pale: '#f3f7f3'
  focus: '#8fa594'
  focus-ring: 'rgba(143, 165, 148, 0.12)'
  success: '#5f896d'
  success-background: '#e8f2ea'
  success-text: '#568062'
  warning: '#b18a4b'
  warning-background: '#f6f0e4'
  warning-text: '#99773d'
  error: '#b66b68'
  error-background: '#f7e9e8'
  error-text: '#a65f5b'
  destructive-background: '#fff5f3'
  destructive-border: '#efd4d0'
  destructive-text: '#a45149'
  modal-scrim: 'rgba(28, 40, 31, 0.30)'
  topbar: 'rgba(250, 249, 245, 0.92)'
  cctv-background: '#26332b'
  toast-background: '#253129'
  on-primary: '#ffffff'
  on-dark: '#ffffff'
typography:
  font-family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: normal
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: '-0.5px'
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: normal
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: normal
  body-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: normal
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: normal
  caption:
    fontFamily: Inter
    fontSize: 9px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  xs: 5px
  sm: 6px
  control: 8px
  md: 10px
  field: 11px
  lg: 12px
  popup: 14px
  modal: 20px
  auth: 24px
  full: 9999px
spacing:
  unit: 4px
  page-x-desktop: 34px
  page-y-desktop: 30px
  page-x-mobile: 16px
  page-y-mobile: 22px
  grid-gap-sm: 10px
  grid-gap-md: 14px
  grid-gap-lg: 16px
  panel-padding: 19px
  card-padding: 18px
  section-gap: 16px
layout:
  sidebar-width: 244px
  sidebar-width-tablet: 210px
  topbar-height: 72px
  content-max-width: 1550px
  breakpoint-tablet: 1050px
  breakpoint-mobile: 760px
  breakpoint-small-mobile: 480px
shadows:
  card: '0 2px 12px rgba(48, 65, 53, 0.055)'
  card-hover: '0 5px 18px rgba(48, 65, 53, 0.08)'
  property: '0 8px 30px rgba(47, 69, 55, 0.05)'
  property-hover: '0 14px 35px rgba(47, 69, 55, 0.10)'
  popup: '0 16px 40px rgba(35, 52, 43, 0.15)'
  modal: '0 25px 80px rgba(25, 40, 30, 0.18)'
motion:
  fast: '150ms ease'
  normal: '250ms ease'
---

# Design System HomeeKost

Dokumen ini menjadi acuan visual HomeeKost. Seluruh keputusan di bawah diambil dari `docs/examples/KostManagement.html`. Jika ada perbedaan dengan dokumen lama, contoh HTML tersebut menjadi sumber utama.

## 1. Arah Visual

HomeeKost memakai gaya dashboard operasional yang bersih, hangat, tenang, dan padat informasi.

Ciri utamanya:

- Warna utama hijau sage dengan latar krem.
- Permukaan kartu putih dengan garis tipis dan bayangan sangat lembut.
- Ukuran teks relatif kecil agar banyak data tetap mudah dipindai.
- Sudut membulat sedang; modal dan kartu pemilihan kos lebih bulat.
- Warna status dibuat lembut, bukan mencolok.
- Hierarki dibangun melalui ukuran, ketebalan teks, jarak, dan warna latar.
- Tema yang tersedia pada contoh adalah tema terang. Jangan membuat tema gelap tanpa rancangan terpisah.

## 2. Warna

### 2.1 Warna Utama

| Token | Nilai | Pemakaian |
| :--- | :--- | :--- |
| `background` | `#FAF9F5` | Latar utama aplikasi |
| `background-alt` | `#F5F8F5` | Latar halaman masuk dan permukaan alternatif |
| `surface` | `#FFFFFF` | Kartu, panel, tombol sekunder, menu, dan modal |
| `surface-soft` | `#FBFCFB` | Input dan bagian dalam panel |
| `surface-muted` | `#F7FAF7` | Kotak informasi dan bagian detail |
| `surface-subtle` | `#F3F7F3` | Sorotan sangat lembut dan latar ikon |
| `text-primary` | `#252925` | Judul dan isi utama |
| `text-secondary` | `#737873` | Keterangan dan teks pendamping |
| `text-tertiary` | `#8A958D` | Teks dengan penekanan paling rendah |
| `border` | `#E4E9E4` | Garis kartu, kontrol, dan pemisah |
| `primary` | `#4F6958` | Tombol utama, tautan aksi, dan teks aktif |
| `primary-hover` | `#425949` | Tombol utama saat disentuh penunjuk |
| `primary-accent` | `#718B78` | Grafik, garis aksen, dan penanda merek |
| `primary-soft` | `#E8F0EA` | Menu aktif dan pesan milik pengguna |
| `primary-pale` | `#F3F7F3` | Latar ikon, bantuan, dan sorotan ringan |

### 2.2 Warna Status

| Status | Warna utama | Latar | Teks |
| :--- | :--- | :--- | :--- |
| Berhasil / aktif | `#5F896D` | `#E8F2EA` | `#568062` |
| Menunggu / perhatian | `#B18A4B` | `#F6F0E4` | `#99773D` |
| Terlambat / bermasalah | `#B66B68` | `#F7E9E8` | `#A65F5B` |
| Tindakan berbahaya | — | `#FFF5F3` | `#A45149` dengan garis `#EFD4D0` |

Warna status dipakai bersama teks status. Jangan mengandalkan warna saja.

### 2.3 Warna Kontekstual

| Elemen | Nilai |
| :--- | :--- |
| Bilah atas transparan | `rgba(250, 249, 245, 0.92)` |
| Fokus input | `#8FA594` |
| Cincin fokus input | `0 0 0 3px rgba(143, 165, 148, 0.12)` |
| Latar penutup modal | `rgba(28, 40, 31, 0.30)` |
| Latar CCTV | `#26332B` |
| Latar notifikasi singkat | `#253129` |
| Area kosong diagram donat | `#DCE7DE` |
| Garis bantu grafik | `#EDF0ED` |

## 3. Tipografi

### 3.1 Keluarga Huruf

Gunakan `Inter` dengan ketebalan `400`, `500`, `600`, dan `700`.

Urutan cadangan:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### 3.2 Skala Teks

| Peran | Ukuran | Ketebalan | Catatan |
| :--- | :--- | :--- | :--- |
| Judul layar pemilihan kos | `28px` | `700` | Judul besar khusus layar awal |
| Judul halaman | `24px` | `700` | Jarak huruf `-0.5px`, tinggi baris `1.2` |
| Judul halaman pada layar kecil | `21px` | `700` | Aktif pada lebar maksimal `480px` |
| Nilai statistik | `23px–25px` | `700` | Angka utama pada kartu statistik dan diagram |
| Judul dokumen/modal | `18px` | `700` | Invoice, modal, dan detail utama |
| Judul kartu properti | `16px` | `600–700` | Nama kos |
| Judul panel | `14px` | `600` | Judul bagian dalam halaman |
| Teks utama antarmuka | `12px–13px` | `400–600` | Tombol, deskripsi, dan kontrol |
| Teks pendamping | `10px–11px` | `400–600` | Isi tabel, rincian kartu, dan keterangan |
| Caption | `9px–9.5px` | `400–600` | Kepala tabel, badge, waktu, dan metadata |

Gunakan ukuran kecil secara konsisten. Jangan membesarkan teks isi menjadi `16px` karena akan mengubah kepadatan dan karakter contoh.

## 4. Tata Letak Utama

### 4.1 Kerangka Desktop

```text
┌──────────────────── 244px ────────────────────┬───────────────────────────────┐
│ Sidebar tetap                                  │ Topbar lengket, tinggi 72px    │
│ Logo                                           ├───────────────────────────────┤
│ Navigasi                                       │ Konten, maksimum 1550px        │
│                                                │ Padding 30px 34px 45px         │
│ Bantuan                                        │                               │
│ Profil                                         │                               │
└────────────────────────────────────────────────┴───────────────────────────────┘
```

Aturan:

- Aplikasi memakai susunan mendatar dengan tinggi minimum satu layar.
- Sidebar tetap di kiri, lebar `244px`, latar putih, garis kanan `1px solid #E4E9E4`.
- Isi sidebar memakai padding `22px 15px`.
- Area utama memakai margin kiri sesuai lebar sidebar.
- Topbar memiliki tinggi `72px`, posisi lengket di atas, padding mendatar `34px`, blur `8px`, dan garis bawah.
- Konten berada di tengah, lebar maksimum `1550px`, padding `30px 34px 45px`.
- Kepala halaman menempatkan judul di kiri dan tombol aksi di kanan. Jarak bawah `25px`.

### 4.2 Grid

| Grid | Desktop | Jarak |
| :--- | :--- | :--- |
| Statistik utama | 4 kolom sama lebar | `14px` |
| Panel utama | `1.7fr 1fr` | `16px` |
| Panel bawah | `1.45fr 1fr` | `16px` |
| Daftar kamar | 3 kolom sama lebar | `14px` |
| Tiga indikator | 3 kolom sama lebar | `14px` |
| Aktivitas | 4 kolom sama lebar | `10px` |
| Pemilihan kos | 3 kolom sama lebar | `16px` |
| CCTV | 2 kolom sama lebar | `16px` |
| Formulir | 2 kolom sama lebar | `13px` |
| Profil | 2 kolom sama lebar | `16px` |
| Invoice | `1fr 1.5fr` | `15px` |
| Okupansi | `160px 1fr` | `20px` |
| Percakapan | `280px 1fr` | — |

### 4.3 Tabel

- Tabel memenuhi lebar panel dan memakai `border-collapse: collapse`.
- Lebar minimum tabel data adalah `650px`.
- Pembungkus tabel harus dapat digulir mendatar saat ruang tidak cukup.
- Sel memakai padding `11px 8px` dan garis bawah `#EEF1EE`.
- Isi tabel `10.5px`; kepala tabel `9.5px`, huruf kapital, ketebalan `600`, jarak huruf `0.3px`.

## 5. Responsif

### 5.1 Tablet — maksimal 1050px

- Sidebar menyusut dari `244px` menjadi `210px`.
- Margin kiri area utama mengikuti `210px`.
- Statistik berubah dari 4 menjadi 2 kolom.
- Panel utama dan panel bawah menjadi 1 kolom.
- Aktivitas berubah dari 4 menjadi 2 kolom.

### 5.2 Ponsel — maksimal 760px

- Sidebar menjadi panel tersembunyi di luar layar dan muncul dari kiri.
- Area utama tidak memakai margin kiri.
- Topbar memakai padding mendatar `16px`.
- Konten memakai padding `22px 16px 35px`.
- Pencarian desktop disembunyikan; tombol menu ditampilkan.
- Kepala halaman ditumpuk vertikal.
- Grid properti, kamar, tiga indikator, invoice, CCTV, profil, dan formulir menjadi 1 kolom.
- Statistik dan aktivitas tetap 2 kolom.
- Diagram okupansi menjadi 1 kolom.
- Daftar percakapan disembunyikan; jendela pesan memakai seluruh lebar.
- Toolbar transaksi ditumpuk dan direntangkan penuh.

### 5.3 Ponsel Kecil — maksimal 480px

- Statistik menjadi 1 kolom.
- Aktivitas menjadi 1 kolom.
- Judul halaman turun menjadi `21px`.

## 6. Komponen

### 6.1 Kartu dan Panel

Kartu dasar:

```css
background: #ffffff;
border: 1px solid #e4e9e4;
border-radius: 10px;
box-shadow: 0 2px 12px rgba(48, 65, 53, 0.055);
```

- Panel standar memakai padding `19px`.
- Kartu statistik memakai padding `18px 19px`.
- Kartu kamar memakai padding `16px`.
- Kartu aktivitas memakai padding `12px` dan radius `8px`.
- Kartu pemilihan kos memakai radius `20px`, padding `22px`, tinggi minimum `190px`, serta bayangan lebih luas namun tetap lembut.
- Kartu pemilihan kos bergerak naik `3px` saat disentuh penunjuk.

### 6.2 Sidebar dan Navigasi

- Tombol navigasi: padding `11px 12px`, radius `8px`, jarak ikon dan teks `12px`.
- Teks menu: `13px`, ketebalan `500`, warna `#6E746F`.
- Menu aktif: latar `#E8F0EA`, teks `#4F6958`, ketebalan `600`.
- Menu saat disentuh penunjuk: latar `#F3F7F3`, teks `#4F6958`.
- Ikon navigasi: area `18px`, gambar `17px`, garis `1.7`, ujung dan sambungan membulat.
- Bagian bantuan: radius `10px`, latar `#F3F7F3`, garis `#E4E9E4`.
- Profil mini ditempatkan di bagian paling bawah sidebar.

### 6.3 Tombol

Tombol standar:

```css
border: 1px solid #e4e9e4;
background: #ffffff;
color: #252925;
border-radius: 8px;
padding: 10px 14px;
font-size: 12px;
font-weight: 600;
```

Tombol utama:

```css
background: #4f6958;
border-color: #4f6958;
color: #ffffff;
```

- Hover tombol utama memakai `#425949`.
- Tombol ikon topbar berukuran `37px × 37px` dengan radius `8px`.
- Tombol tutup modal berukuran `32px × 32px` dengan radius `9px`.
- Tombol berbahaya memakai latar `#FFF5F3`, garis `#EFD4D0`, dan teks `#A45149`.
- Tombol sekunder tetap putih; jangan mengganti seluruh tombol dengan sage.

### 6.4 Formulir

- Input dan pilihan utama memiliki tinggi `43px`.
- Garis input `#DFE7E0`, radius `11px`, padding mendatar `13px`.
- Latar input `#FBFCFB`, ukuran teks `12px`.
- Label `11px`, ketebalan `700`, warna `#506257`, jarak bawah `7px`.
- Fokus memakai garis `#8FA594` dan cincin `3px rgba(143, 165, 148, 0.12)`.
- Kotak centang dan radio memakai aksen `#5D7865`.
- Formulir dua kolom berubah menjadi satu kolom di ponsel.
- Kelompok formulir dipisahkan garis atas dan jarak `16px`.

### 6.5 Badge Status

```css
padding: 5px 8px;
border-radius: 6px;
font-size: 9.5px;
font-weight: 600;
```

Gunakan pasangan warna pada bagian Warna Status tanpa modifikasi.

### 6.6 Modal

- Lapisan belakang menutup seluruh layar dengan `rgba(28, 40, 31, 0.30)`.
- Kartu modal memiliki lebar sesuai kebutuhan hingga batas layar, tinggi maksimum `90vh`, dan dapat digulir.
- Radius modal `20px`, padding `24px`, garis `#E1E8E2`.
- Bayangan modal `0 25px 80px rgba(25, 40, 30, 0.18)`.
- Tombol aksi berada di kanan bawah, dipisahkan garis atas dan jarak atas `16px`.

### 6.7 Menu Mengambang dan Notifikasi

- Panel notifikasi: lebar `330px`, radius `14px`.
- Panel pengaturan: lebar `290px`, radius `14px`.
- Bayangan panel: `0 16px 40px rgba(35, 52, 43, 0.15)`.
- Hasil pencarian memakai radius `12px` dan bayangan `0 14px 35px rgba(35, 52, 43, 0.13)`.
- Notifikasi singkat muncul di kanan bawah, latar `#253129`, teks putih, radius `8px`, padding `12px 15px`.

### 6.8 Grafik

- Garis data utama memakai `#718B78`, tebal `3px`, ujung membulat.
- Garis bantu memakai `#EDF0ED`, tebal `1px`.
- Label grafik memakai Inter `9px`, warna `#8A908B`.
- Diagram donat berukuran `148px`; lubang tengah `96px`.
- Bagian terisi memakai `#718B78`; bagian kosong `#DCE7DE`.
- Batang kemajuan memiliki tinggi `6px`, radius `5px`, latar `#EDF1ED`, dan isi `#718B78`.

## 7. Kedalaman, Radius, dan Gerak

### 7.1 Bayangan

| Elemen | Bayangan |
| :--- | :--- |
| Kartu standar | `0 2px 12px rgba(48, 65, 53, 0.055)` |
| Kartu saat disentuh penunjuk | `0 5px 18px rgba(48, 65, 53, 0.08)` |
| Kartu properti | `0 8px 30px rgba(47, 69, 55, 0.05)` |
| Kartu properti hover | `0 14px 35px rgba(47, 69, 55, 0.10)` |
| Menu mengambang | `0 16px 40px rgba(35, 52, 43, 0.15)` |
| Modal | `0 25px 80px rgba(25, 40, 30, 0.18)` |

### 7.2 Radius

- `6px`: badge.
- `7px–8px`: filter, tombol, kartu kecil, dan kontrol.
- `10px`: kartu standar.
- `11px–12px`: input dan kotak informasi.
- `14px`: panel mengambang dan gambar properti.
- `20px`: modal dan kartu pemilihan kos.
- `24px`: kartu masuk.
- `50%`: avatar dan indikator bulat.

### 7.3 Gerak

- Hover kartu umum: `150ms ease`, naik `1px`.
- Hover kartu properti: `180ms`, naik `3px`.
- Sidebar ponsel dan notifikasi singkat: `250ms`.
- Gerak tidak boleh mengubah ukuran elemen atau menggeser elemen di sekitarnya.

## 8. Aturan Konsistensi

- Gunakan tema sage dan krem persis seperti token; jangan mengganti dengan biru, ungu, atau warna dashboard umum lain.
- Gunakan Inter di seluruh aplikasi.
- Pertahankan kepadatan teks contoh, terutama pada tabel, kartu statistik, dan metadata.
- Gunakan garis `1px` dan bayangan halus untuk memisahkan permukaan.
- Gunakan putih sebagai permukaan utama; sage lembut hanya untuk keadaan aktif dan sorotan.
- Pertahankan sidebar tetap pada desktop dan model panel geser pada ponsel.
- Gunakan grid dan rasio kolom yang tercatat sebelum membuat variasi baru.
- Gunakan ikon garis SVG dengan ukuran dan ketebalan konsisten.
- Hindari gradien dekoratif. Gradien hanya dipakai untuk area grafik dan diagram donat seperti pada contoh.
- Halaman pemilihan kos berada di dalam kerangka dashboard, bukan layar penuh. Aturan ini mengikuti penyesuaian terakhir pada contoh HTML.
- Tombol edit dan hapus di kartu properti selalu terlihat. Aturan ini mengikuti penyesuaian terakhir pada contoh HTML.
