# Todo List Revisi Klien & Penyempurnaan Sistem (HomeeKost)
*Berdasarkan Catatan Asli Lapangan (Kamila PPLG 5 & Hanna PPLG 3)*

> **Catatan Penting Lingkungan:**
> - Package Manager & Runtime: **Wajib menggunakan BUN (`bun`)**.
> - **DILARANG** menjalankan command `npm` (seperti `npm run build` atau `npm install`). Gunakan selalu `bun run build`, `bun test`, dll.
> - Database schema DDL / migrations / PostgreSQL enums **TIDAK BOLEH** diubah tanpa izin untuk melindungi data VPS.

---

## 1. Fitur yang Sudah Selesai (Completed ✅)

- [x] **Foto KTP Tidak Disimpan di Server (Kamila #1, Hanna #1)**:
  - Unggah foto KTP hanya alat bantu isi otomatis (*autofill* form via Gemini AI Vision).
  - Foto fisik KTP tidak disimpan ke disk / storage VPS dan form dapat disimpan tanpa foto KTP.
- [x] **Reposisi & Pembersihan Rasio Beban (Kamila #2)**:
  - Reposisi tampilan insight keuangan ke bagian atas halaman Keuangan.
  - Hapus container/baris bawah *"Beban Operasional Terkendali"* pada widget Komposisi Biaya.
  - Sub-label kartu pengeluaran diselaraskan.
- [x] **Standardisasi 3 Status Pembayaran (Kamila #4, Hanna #4)**:
  - Hanya ada 3 status resmi: **Lunas** (`PAID`), **Belum Lunas** (`PENDING` dengan `dueDate >= today`), dan **Terlambat** (`OVERDUE` atau `dueDate < today`).
  - Istilah *"Menunggu Pembayaran"* dihapus.
- [x] **Edit Durasi Sewa Penghuni (Kamila #5, Hanna #3)**:
  - Opsi mengubah periode sewa (Bulanan, Triwulan, Semesteran, Tahunan) sudah tersedia langsung di dialog Edit Penghuni.
- [x] **Filter Kamar & Hapus Tombol Tambah Kamar di Filter (Kamila #7, Hanna #2)**:
  - Filter kamar kosong hanya menampilkan kamar kosong riil.
  - Tombol *"Tambah Kamar"* / *"Tambah Kamar Pertama"* disembunyikan jika sedang memfilter status kamar.
- [x] **Checkout Penghuni Bersihkan Tagihan (Kamila #8)**:
  - Saat penghuni di-checkout, invoice berjalan/unpaid dihapus dari halaman Pembayaran agar tidak ada selisih angka atau tagihan hantu.
  - Seluruh riwayat transaksi kas masuk masa lalu di menu Keuangan **tetap aman & abadi** (`Transaction.invoiceId` diset null).
- [x] **Ekspor Data Excel .xlsx (Kamila #12, Hanna #10)**:
  - Format ekspor CSV diganti menjadi **Microsoft Excel (`.xlsx`)** resmi dengan garis tabel dan format Rupiah menggunakan `exceljs`.
- [x] **Nomenklatur "Cicilan"**:
  - Semua istilah kata kerja *"Dicicil"* diganti menjadi kata benda resmi **"Cicilan"**.
- [x] **Format Penomoran Nota / Invoice Deterministik (Hanna #8)**:
  - Pola: `[Tanggal][Bulan][Tahun]-[3 Digit Nomor Kamar]-[Kode Kos]`
  - Kode cabang: `1` = Bahari, `2` = Homeekost, `3` = Hunian (contoh: `22102026-005-2`).
  - Unit test lulus 6/6 di `tests/unit/invoice-utils.test.ts`.

---

## 2. Poin yang Dibatalkan / Salah Tafsir AI Sebelumnya (Invalidated ❌)

- [x] ❌ **Otomatisasi Lunas Multi-Bulan**:
  - *Koreksi:* AI sebelumnya salah paham. Fleksibilitas checkbox *"Tandai Lunas"* dipertahankan karena saat pendaftaran penghuni baru, admin/klien ingin bisa memilih apakah penghuni sudah langsung membayar atau belum. Transaksi kas masuk tetap dibagi per bulan saat pembayaran tercatat.
- [x] ❌ **Kirim File Peraturan Kos JPG (Kamila #15, Hanna #12)**:
  - *Koreksi:* Dibatalkan langsung oleh klien saat rapat (*"di bagian sambutan anak kos minta bisa dimasukin file peraturan dlm bentuk jpg (tapi gausah katanya)"*).
- [x] ❌ **Triple Confirmation Reset Database (Checklist + Password + Teks)**:
  - *Koreksi:* Halusinasi AI. Klien sebenarnya hanya meminta tombol konfirmasi di popup reset data **digeser (Slide to Confirm)** agar tidak sengaja terpencet (Kamila #18, Hanna #16).
- [x] ❌ **Perubahan Template WhatsApp**:
  - *Koreksi:* Perubahan kode WhatsApp dibatalkan/direvert sesuai instruksi user, karena pengerjaan draf teks WA akan diserahkan ke rekannya.

---

## 3. Daftar Tugas Asli yang Sedang / Akan Dikerjakan (Action Items 📌)

### A. Dashboard & Logika Bisnis
- [ ] 🔴 **Dashboard: Filter Kamar Mendekati Pembayaran (Kamila #6)**
  - Kamar dengan sewa multi-bulan (misal bayar Triwulan dan temponya masih 2-3 bulan lagi) **TIDAK BOLEH** muncul di daftar kamar mendekati pembayaran.
  - Hanya tampilkan yang jatuh tempo dalam bulan berjalan / mendekati (H-7).
- [ ] 🔴 **Dashboard: Kartu Jatuh Tempo Bulan Ini (Kamila #3, Hanna #5)**
  - Metrik kartu jatuh tempo di dashboard harus menghitung **jumlah kamar/penghuni riil yang menunggak**, bukan sekadar menghitung lembar invoice.
- [ ] 🟡 **AI Insight: 3 Rentang Rasio Beban Kas (Kamila #14, Hanna #11)**
  - Hilangkan status *"Sedang Berjalan"*.
  - Standarisasi skala rasio beban operasional terhadap kas masuk:
    - **Prima:** `< 25%`
    - **Waspada:** `25% - 50%`
    - **Bahaya / Kritis:** `> 50%`

### B. User Management & Keamanan
- [ ] 🟡 **Riwayat Perubahan / Audit Log: Tampilkan Badge "Sistem" (Kamila #17, Hanna #15)**
  - Untuk aksi yang dijalankan otomatis oleh sistem/cron/bot (misal generate tagihan bulanan atau auto-reminder), tampilkan badge/nama **"Sistem"** (bukan "Admin").
  - Role akun pengguna tetap `SuperAdmin` dan `Admin`.
- [ ] 🔴 **Reset Data: Slider Geser (Slide to Confirm) (Kamila #18, Hanna #16)**
  - Ubah tombol eksekusi reset data pada popup `ResetDataDialog` dari tombol klik biasa menjadi komponen **Slide to Confirm (digeser)** agar tidak sengaja tertekan.

### C. Engagement
- [ ] 🟢 **Hapus Kategori "Kerja Bakti" (Kamila #16, Hanna #14)**
  - Hapus opsi kategori *"Kerja Bakti"* pada form pengumuman/engagement (anak kos tidak ada agenda kerja bakti).
- [ ] 🟢 **Apresiasi Pembayaran Tepat Waktu (Kamila #16)**
  - Pengiriman pesan apresiasi pembayaran tepat waktu berupa tombol aksi manual pengelola (bukan blast otomatis liar).
