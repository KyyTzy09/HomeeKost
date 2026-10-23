# Todo List Revisi & Penyempurnaan Sistem (HomeeKost)

> **Catatan Lingkungan:**
> - Package Manager & Runtime: **Wajib BUN (`bun`)**. Dilarang menggunakan `npm`.
> - Skema database DDL / migrasi PostgreSQL tidak boleh diubah sembarangan untuk menjaga keutuhan data VPS.

---

## 1. Selesai Dikerjakan (Completed ✅)

### Dashboard & Filter
- [x] **Filter Default Kos Aktif**: Dashboard, Keuangan, Pembayaran, dan Laporan secara *default* langsung memfilter cabang kos yang sedang aktif dipilih di topbar.
- [x] **Kartu Jatuh Tempo Berbasis Kamar**: Menghitung jumlah kamar unik yang memiliki tunggakan/belum lunas (bukan menghitung lembar invoice).
- [x] **Aksi Klik Kartu Jatuh Tempo**: Mengarahkan langsung ke halaman Pembayaran (`/dashboard/payments`) dengan filter otomatis pada status belum lunas/terlambat di bulan berjalan.
- [x] **Saring Kamar Mendekati Pembayaran**: Menyaring kontrak multi-bulan (Triwulan, Semesteran, Tahunan) yang jatuh temponya masih lebih dari 30 hari ke depan agar tidak muncul sebelum waktunya.
- [x] **Nomenklatur "Cicilan"**: Mengganti semua kemunculan kata kerja *"Dicicil"* menjadi kata benda baku **"Cicilan"**.

### Kamar & Penghuni
- [x] **Foto KTP Tanpa Simpan Fisik**: Unggah foto KTP murni sebagai alat bantu isi otomatis (*autofill* form via AI Vision), berkas gambar fisik tidak disimpan ke disk/storage VPS.
- [x] **Edit Durasi Sewa Penghuni**: Opsi mengubah durasi sewa (Bulanan, Triwulan, Semesteran, Tahunan) tersedia langsung di dalam dialog Edit Penghuni.
- [x] **Penyempurnaan Filter Kamar Kosong**: Filter status kamar kosong hanya menampilkan unit yang berstatus kosong riil, serta menyembunyikan tombol *"Tambah Kamar"* saat filter aktif.
- [x] **Pembersihan Invoice Pasca Checkout**: Saat penghuni di-checkout, invoice berjalan/unpaid dihapus dari halaman Pembayaran agar tidak ada selisih angka tagihan gantung, sementara seluruh riwayat transaksi kas masuk di Keuangan **tetap utuh dan aman**.

### Pembayaran & Keuangan
- [x] **Standardisasi 3 Status Pembayaran**: Menyeragamkan status tagihan menjadi 3 kategori baku di seluruh sistem: **Lunas** (`PAID`), **Belum Lunas** (`PENDING`), dan **Terlambat** (`OVERDUE`). Istilah *"Menunggu Pembayaran"* dihapus.
- [x] **Penomoran Nota / Invoice Deterministik**: Menggunakan format `[Tanggal][Bulan][Tahun]-[3 Digit Nomor Kamar]-[Kode Kos]` (contoh: `22102026-005-2`), dengan kode cabang `1` = Bahari, `2` = Homeekost, `3` = Hunian.
- [x] **Ekspor Laporan Excel (.xlsx)**: Mengganti seluruh fungsi ekspor CSV di Keuangan menjadi berkas Microsoft Excel (`.xlsx`) resmi bergaris tabel dengan `exceljs`.
- [x] **Tata Letak & Ringkasan Komposisi Biaya**: 
  - Memindahkan tampilan insight ke bagian atas halaman Keuangan.
  - Mengubah label pengeluaran menjadi *"Laba Kas"*.
  - Menghapus badge pill dari header kartu Komposisi Biaya dan memindahkan total pengeluaran ke bagian bawah kartu dengan teks bersih.

### Manajemen Pengguna & Keamanan
- [x] **Badge "Sistem" & Kolom Peran Terpisah pada Riwayat Perubahan (Audit Log)**:
  - Pada tabel riwayat log perubahan, Peran (Role) dipisahkan menjadi kolom tersendiri terpisah dari nama user.
  - Aktivitas otomatisasi sistem menampilkan badge **"Sistem"** dengan ikon bot khusus, sementara role database akun pengguna tetap murni `SuperAdmin` dan `Admin`.
- [x] **Slider Geser (Slide to Confirm) pada Reset Database**:
  - Mengubah tombol konfirmasi hapus database pada popup `ResetDataDialog` menjadi slider geser interaktif horizontal (*Slide to Confirm*) untuk mencegah ketidaksengajaan.

### Laporan & AI Insight
- [x] **Kalibrasi Ambang Batas Rasio Beban Kas & Status Finansial**:
  - Menyelaraskan logika evaluasi kesehatan finansial di AI prompt & fallback engine berdasarkan rasio beban kas terhadap pemasukan:
    - **Prima**: Rasio beban kas `< 25%` (Margin laba bersih `> 75%`)
    - **Waspada**: Rasio beban kas `25% - 50%` (kategori tengah-tengah)
    - **Bahaya / Kritis**: Rasio beban kas `> 50%` (dengan guardrail: pada bulan berjalan dibatasi ke `WASPADA`)
  - Menghapus label *"Sedang Berjalan"* sebagai nama grade status akhir (periode berjalan tetap sebagai konteks waktu/data).
- [x] **Otomatisasi Laporan Harian & Pembersihan Pengaturan Jadwal**:
  - Menghapus broadcast pesan WhatsApp laporan bulanan ke pengelola agar nomor WA tidak terganggu.
  - Menghapus kartu *Automasi Laporan Bulanan* dan dialog *Pengaturan Jadwal Automasi* dari tampilan Laporan sehingga UI bersih dan fokus pada data finansial.
  - Menjadwalkan pembaruan snapshot data laporan & AI wawasan secara otomatis setiap hari via cron harian (sangat hemat kuota API).

---

### Menu Engagement
- [x] **Hapus Kategori "Kerja Bakti"**:
  - Menghapus opsi kategori *"Kerja Bakti"* pada dialog pembuatan pengumuman (`EngagementEventDialog`), dialog template pesan (`EngagementTemplateDialog`), serta daftar template bawaan.
- [x] **Tombol Manual Apresiasi Bayar Tepat Waktu**:
  - Menyediakan tombol aksi kirim manual perorangan (*"Kirim Apresiasi"*) serta kirim selektif bagi pengelola untuk apresiasi pembayaran tepat waktu di Engagement Hub (bukan dikirim otomatis secara blast).

---

## 2. Belum Dikerjakan (To Do 📌)

*(Semua daftar tugas revisi utama telah selesai dikerjakan ✅)*

---

## 3. Dibatalkan / Sesuai Desain Awal (Cancelled ❌)

- [x] ❌ **Otomatisasi Lunas Paksa Multi-Bulan**: Dibatalkan karena sistem saat ini sudah tepat dengan mempertahankan fleksibilitas centang *"Tandai Lunas"* pada form pendaftaran sewa.
- [x] ❌ **Kirim File Peraturan Kos Format JPG**: Dibatalkan langsung oleh klien saat pertemuan.
- [x] ❌ **Form Konfirmasi 3 Lapis (Triple Confirmation)**: Dibatalkan (klien hanya menginginkan interaksi tombol digeser / slider).
- [x] ❌ **Perubahan Draf Template WhatsApp**: Ditahan dan dikembalikan ke kode awal agar dapat dikerjakan secara terpisah.
