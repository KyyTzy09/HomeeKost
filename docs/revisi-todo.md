# Todo List Revisi Klien & Penyempurnaan Sistem (HomeeKost)

> **Catatan Penting Lingkungan:**
> - Package Manager & Runtime: **Wajib menggunakan BUN (`bun`)**.
> - **DILARANG** menjalankan command `npm` (seperti `npm run build` atau `npm install`). Gunakan selalu `bun run build`, `bun test`, dll.

---

## Bagian A: 15 Poin Revisi Utama dari Pertemuan Klien

### 1. Identitas & Autofill KTP
- [x] 🔴 **Foto KTP Tidak Wajib**: Hapus kewajiban unggah foto fisik KTP di `TenantFormDialog.tsx`. Admin dapat menyimpan data penghuni tanpa melampirkan berkas gambar KTP.
- [x] 🟡 **Scan KTP Murni Sebagai Autofill**: Tombol/fitur pemindaian KTP (Gemini AI Vision) hanya bertindak sebagai alat bantu isi otomatis (*autofill*) form (Nama, NIK, Alamat, dll.) secara opsional tanpa menulis file ke disk VPS.

### 2. Dashboard & Filter Keuangan
- [x] 🔴 **Default Terikat ke Kos Aktif**: Semua metrik finansial dan operasional pada dashboard secara default langsung menampilkan data cabang kos yang sedang aktif/dipilih di topbar (bukan agregat konsolidasi seluruh cabang).

### 3. Tata Letak & Nomenklatur Keuangan
- [ ] 🟡 **Reposisi Tampilan Insight**: Pindahkan posisi tampilan insight keuangan ke area atas menu Keuangan agar langsung terbaca tanpa perlu scroll ke bawah.
- [ ] 🟢 **Label Laba Kas**: Ubah sub-label teks `"Operasional"` pada kartu Total Pengeluaran menjadi `"Laba Kas"` (diselaraskan dengan format penulisan insight).

### 4. Alokasi Pembayaran Cicilan
- [ ] 🔴 **Keterikatan Langsung ke Nomor Kamar**: Pembayaran sewa secara cicilan/parsial teralokasikan secara visual dan data langsung ke **Nomor Kamar** terkait (terlihat jelas di tabel pembayaran, keuangan, dan kartu kamar).

### 5. Penyederhanaan & Konsistensi Status Pembayaran
- [x] 🔴 **Standardisasi 3 Status Utama**: Seragamkan seluruh sistem hanya menggunakan 3 kategori status utama:
  1. **Lunas** (`PAID`)
  2. **Belum Lunas** (`PENDING` dengan `dueDate >= today`) — *Hapus istilah "Menunggu Pembayaran"*
  3. **Terlambat** (`OVERDUE` atau `dueDate < today`)
- [x] 🟢 **Badge Cicilan**: Untuk tagihan yang sudah dicicil sebagian namun belum selesai, tampilkan keterangan **"Cicilan"** dengan rincian sisa tagihan.

### 6. Manajemen Penghuni & Durasi Sewa
- [x] 🟡 **Pindah Opsi Durasi Sewa**: Pastikan opsi mengubah periode sewa (bulanan, triwulan, dll.) tersedia langsung di dialog **Edit Penghuni** beserta pilihan penanganan lingkup perubahan nominal & kontrak (`ALL_HISTORY` vs `CURRENT_ONLY`).
- [ ] 🔴 **Otomatisasi Lunas Multi-Bulan**: Pendaftaran sewa berdurasi Triwulan, Semesteran, atau Tahunan langsung otomatis berstatus **Lunas** (`PAID`) dan tercatat di kas masuk tanpa perlu konfirmasi manual tambahan.

### 7. Filter & Tampilan Kamar
- [ ] 🟢 **Penyempurnaan Filter Kosong**: Filter kamar kosong hanya menampilkan unit yang berstatus kosong/tersedia.
- [ ] 🟢 **Hapus Tombol Tambah Kamar di Filter**: Hapus tombol *"Tambah Kamar"* / *"Tambah Kamar Pertama"* pada tampilan kosong saat filter status aktif.

### 8. Penanganan Transaksi Checkout
- [ ] 🔴 **Nol-kan Tagihan Sisa Pasca Checkout**: Saat penghuni di-checkout (selesai sewa), nominal tagihan invoice berjalan dihapus/dinolkan agar tidak lagi tertagih sebagai piutang.
- [ ] 🔴 **Histori Keuangan Tetap Abadi**: Seluruh catatan transaksi kas pemasukan masa lalu yang sudah pernah dibayar penghuni tetap tersimpan utuh di menu Keuangan.

### 9. Penyesuaian Istilah & Nomenklatur
- [x] 🟢 **Istilah Baku "Cicilan"**: Ubah seluruh kemunculan kata kerja `"Dicicil"` pada Dashboard dan tabel menjadi kata benda baku **`"Cicilan"`**.
- [ ] 🟢 **Koreksi Typo**: Pastikan seluruh label formulir akun menggunakan ejaan baku **`"Password"`** (bukan *"Pasword"*).

### 10. Identitas Pengirim Pesan WhatsApp
- [ ] 🟢 **Pengirim Seragam "Admin Kos"**: Format penutup seluruh template pesan WhatsApp otomatis diseragamkan menggunakan nama umum: **`"Admin Kos"`** (bukan variasi per cabang).

### 11. Format Penomoran Kuitansi / Invoice
- [ ] 🔴 **Format Deterministik Nota**: Ubah pola pembuatan nomor kuitansi/invoice menjadi:
  `[Tanggal][Bulan][Tahun]-[3 Digit Nomor Kamar]-[Kode Kos]`  
  *Contoh (Kamar 5 pada 22 Oktober 2026 di Kos 1):* `22102026-005-1`.

### 12. Sistem Notifikasi & Laporan
- [ ] 🟡 **Penyempurnaan Redaksi Pesan WA**: Perbaiki susunan kata pada template notifikasi dan tagihan agar lebih luwes dan sopan.
- [ ] 🟡 **Reminder Pembukuan Lengkap**: Tambahkan notifikasi pengingat ke admin saat transaksi 1 bulan terakhir telah lengkap dan siap dievaluasi.

### 13. Format Ekspor Data
- [x] 🔴 **Ubah CSV Menjadi Excel (.xlsx)**: Ganti seluruh fitur ekspor CSV di menu Keuangan menggunakan format **Microsoft Excel (`.xlsx`)** dengan garis tabel dan format Rupiah resmi (berbasis library `exceljs`).

### 14. Penyesuaian Logika & Kategori Status Insight
- [x] 🟡 **Hapus Status "Sedang Berjalan" & Terapkan Guardrail**: Hilangkan penimpaan status *"Sedang Berjalan ⏳"* pada bulan aktif dan cegah vonis *"Bahaya"* keliru di bulan berjalan dengan pembatasan ke *"Waspada (Dalam Pemantauan)"*.
- [x] 🟡 **Standar 4 Kategori Finansial Baku**:
  - **Prima**: Performa finansial optimal, margin laba & okupansi tinggi
  - **Normal**: Kondisi keuangan stabil dan sehat wajar operasional
  - **Waspada**: Pengeluaran operasional membengkak / dalam pemantauan
  - **Bahaya**: Beban melebihi batas toleransi aman (hanya aktif jika tutup buku/kondisi riil)

### 15. Keamanan & Performa Sistem
- [ ] 🔴 **Triple Confirmation Reset Data**: Terapkan konfirmasi 3 langkah pada `ResetDataDialog`:
  1. *Checkbox checklist* pemahaman risiko penghapusan data.
  2. Input verifikasi kata sandi (*password*) SuperAdmin.
  3. Input ketik teks konfirmasi final.
- [ ] 🟡 **Optimasi Loading & Resource**: Pertahankan efisiensi memory VPS, caching query TanStack Query, dan pemantauan response time.

---

## Bagian B: Design & Feedback Lintas Halaman (/dashboard)

### 1. Halaman Penghuni (`/dashboard/tenants`)
- [x] 🔴 **Sinkronisasi 3 Status Penghuni**: Ubah kolom status pembayaran di tabel penghuni dari status *"Lancar"* / *"Terlambat"* menjadi 3 status konsisten: **Lunas**, **Belum Lunas**, dan **Terlambat**.
- [x] 🟢 **Filter Status Penghuni**: Sesuaikan opsi dropdown filter di atas tabel penghuni agar selaras dengan 3 status tersebut.

### 2. Halaman Pembayaran (`/dashboard/payments`)
- [x] 🔴 **Penyelarasan Query Status Pembayaran**:
  - **Lunas**: Invoice lunas penuh (`isSettled === true` atau status `PAID`).
  - **Belum Lunas**: Belum lunas penuh dan tanggal jatuh tempo belum lewat (`dueDate >= today`).
  - **Terlambat**: Belum lunas penuh dan tanggal jatuh tempo sudah lewat (`dueDate < today`).
- [x] 🟢 **Nomenklatur Cicilan**: Ganti status/badge `"dicicil"` menjadi **`"Cicilan"`**.
- [x] 🟢 **Header Stat Card**: Pada kartu *"Total Tagihan Bulan Ini (Oktober 2026)"*, hapus tulisan bulan di dalam kurung menjadi cukup **`"Total Tagihan Bulan Ini"`**.

### 3. Halaman Invoice (`/dashboard/invoices`)
- [x] 🔴 **Sinkronisasi Filter Dokumen**: Selaraskan pilihan dropdown filter dokumen (kiri atas) antara: **Semua**, **Cicilan**, **Belum Lunas**, **Lunas**, dan **Terlambat** tanpa mismatch data.

### 4. Halaman Keuangan (`/dashboard/finance`)
- [x] 🔴 **Default Kos Aktif**: Dropdown pilihan cabang kos secara default memilih kosan yang sedang aktif di topbar (bukan *"Semua Cabang Kos"*), namun fungsionalitas ganti filter tetap tersedia.
- [x] 🟢 **Hapus Kata "Konsolidasi"**: Ubah label teks `"Semua Cabang Kos (Konsolidasi)"` menjadi cukup **`"Semua Cabang Kos"`**.
- [x] 🟡 **Kartu Total Pengeluaran**: Ubah teks sub-label `"Operasional: Rp..."` menjadi perbandingan persentase pengeluaran terhadap bulan lalu (*Month-over-Month %*), setara dengan kartu pendapatan.
- [x] 🟡 **Kartu Rasio Beban**: Ganti teks `"Periode: Oktober 2026"` menjadi panduan insight rasio normal (contoh: *"Beban ideal < 40%"*).
- [x] 🔴 **Ekspor Excel di Keuangan**: Ganti tombol *"Ekspor CSV 12 Bulan"* menjadi tombol **"Ekspor Excel (.xlsx)"** menggunakan engine `exceljs`.
- [x] 🟢 **Hapus Sub-Card Duplikat di Komposisi Biaya**: Hapus container/baris bawah *"Beban Operasional Terkendali (Ideal < 40%)"* pada widget Komposisi Biaya karena informasinya sudah ditampilkan pada 4 kartu KPI atas.
- [x] 🔒 **Proteksi Stabilitas**: Pertahankan query transaksi dan perhitungan arus kas yang sudah berjalan baik tanpa perubahan di luar instruksi.

### 5. Halaman Laporan & Insight (`/dashboard/reports`)
- [x] 🔴 **Default Kos Aktif**: Nilai awal filter properti otomatis memilih kosan yang sedang aktif di topbar.
- [x] 🟡 **Insight Perbandingan Bulan Lalu**: Pada kartu *Pendapatan (Omzet)* dan *Total Pengeluaran*, ganti sub-teks tanggal statis `"Oktober 2026"` menjadi persentase pertumbuhan dibanding bulan sebelumnya (*MoM Growth %*).

### 6. Halaman Manajemen User & Log Audit (`/dashboard/users`)
- [ ] 🔴 **Standar Role Tetap 2**: Role pengguna sistem tetap hanya ada 2: **`SuperAdmin`** dan **`Admin`** (tidak menambahkan role baru *"Sistem"*).
- [ ] 🟡 **Pencatatan Audit Trail**:
  - Jika aksi dilakukan SuperAdmin ➔ tampilkan badge **SuperAdmin**.
  - Jika aksi dilakukan Admin ➔ tampilkan badge **Admin**.
  - Jika otomatisasi sistem ➔ tampilkan nama pemicu yang tepat tanpa mengaburkan role.
- [ ] 🟢 **Filter Role Audit**: Dropdown filter role pada tabel audit log tetap memfilter akun **SuperAdmin** dan **Admin**.
