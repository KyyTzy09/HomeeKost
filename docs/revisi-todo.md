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

---

## 2. Belum Dikerjakan (To Do 📌)

### Laporan & AI Insight
- [ ] **Kalibrasi Ambang Batas Rasio Beban Kas**:
  - Menyelaraskan logika evaluasi kesehatan finansial di AI prompt & fallback engine berdasarkan rasio beban kas terhadap pemasukan:
    - **Prima**: Rasio beban kas `< 25%`
    - **Waspada**: Rasio beban kas `25% - 50%` (kategori tengah-tengah)
    - **Bahaya / Kritis**: Rasio beban kas `> 50%`
  - Menghapus status *"Sedang Berjalan"* sebagai label status akhir.

### Manajemen Pengguna & Keamanan
- [ ] **Badge "Sistem" pada Riwayat Perubahan (Audit Log)**:
  - Pada tabel log riwayat perubahan, aktivitas yang dipicu otomatis oleh bot/cron sistem menampilkan nama/badge **"Sistem"** (bukan "Admin").
  - Role akun pengguna di database tetap hanya `SuperAdmin` dan `Admin`.
- [ ] **Slider Geser (Slide to Confirm) pada Reset Database**:
  - Mengubah tombol konfirmasi hapus database pada popup `ResetDataDialog` dari tombol klik biasa menjadi tombol **geser (Slide to Confirm)** agar tidak sengaja tertekan.

### Menu Engagement
- [ ] **Hapus Kategori "Kerja Bakti"**:
  - Menghapus opsi kategori *"Kerja Bakti"* pada dialog pembuatan pengumuman / event engagement.
- [ ] **Tombol Manual Apresiasi Bayar Tepat Waktu**:
  - Menyediakan tombol aksi kirim manual bagi pengelola untuk pesan apresiasi pembayaran tepat waktu (bukan dikirim otomatis secara blast).

---

## 3. Dibatalkan / Sesuai Desain Awal (Cancelled ❌)

- [x] ❌ **Otomatisasi Lunas Paksa Multi-Bulan**: Dibatalkan karena sistem saat ini sudah tepat dengan mempertahankan fleksibilitas centang *"Tandai Lunas"* pada form pendaftaran sewa.
- [x] ❌ **Kirim File Peraturan Kos Format JPG**: Dibatalkan langsung oleh klien saat pertemuan.
- [x] ❌ **Form Konfirmasi 3 Lapis (Triple Confirmation)**: Dibatalkan (klien hanya menginginkan interaksi tombol digeser / slider).
- [x] ❌ **Perubahan Draf Template WhatsApp**: Ditahan dan dikembalikan ke kode awal agar dapat dikerjakan secara terpisah.
