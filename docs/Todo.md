# Todo Fullstack — Sistem Pengelolaan Kos Multi-Property (HomeeKost)

Sistem Pengelolaan Kos Multi-Cabang (*HomeeKost*) — Monolith Server-Side Rendering (SSR) berbasis **TanStack Start + Vite + React 19 + Tailwind CSS v4 + Prisma ORM + PostgreSQL 16 + Fonnte WhatsApp API Gateway (`api.fonnte.com`) + Gemini/Groq LLM AI Engine**.

> **Referensi Spesifikasi**:
> - PRD: `fullstack/docs/PRD.md`
> - ERD: `fullstack/docs/ERD.md`
> - Arsitektur: `fullstack/docs/ARCHITECTURE.md`
> - Design System: `fullstack/docs/DESIGN.md`
> - Referensi UI: `fullstack/docs/examples/KostManagement.html`
> - Scope & Dokumen Klien: `documents/Scope-Web-Kost-Management.docx` & `documents/Rancangan-Fitur&Page.docx`

---

## Legend & Prioritas
- 🔴 **P0**: Critical Path (MVP Core / Blocker Fungsional)
- 🟡 **P1**: High Value (Fitur Utama Pelengkap Operasional)
- 🟢 **P2**: Enhancement & Polish (Peningkatan UX / Otomatisasi)
- 🔵 **P3**: Future Scope / Maintenance

---

## Phase 0: Fondasi Environment, Design System & Kontainerisasi (Minggu 1)
### 0.1 Environment Variables & Configuration
- [x] 🔴 Verifikasi & audit file konfigurasi project: `package.json`, `vite.config.ts`, `tsr.config.json`, `biome.json`, dan `tsconfig.json`
- [x] 🔴 Setup file `.env.example` dan `.env` dengan variabel lengkap:
  - Database: `DATABASE_URL`
  - Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL`
  - WhatsApp: `FONNTE_TOKEN` (API Token dari `fonnte.com`)
  - AI LLM: `GEMINI_API_KEY`, `GROQ_API_KEY`
- [x] 🔴 Setup Docker Compose file (`docker-compose.yml`) yang ringan & hemat resource (2-Tier):
  - App: TanStack Start SSR Node Runtime (Port 3000)
  - Database: PostgreSQL 16 Alpine (Port 5432)

### 0.2 Design System & Styling Setup (Sesuai `DESIGN.md` & `KostManagement.html`)
- [x] 🔴 Buat dokumentasi spesifikasi desain `DESIGN.md` (Sage & Cream)
- [x] 🔴 Konfigurasi variabel warna tokens dan utility CSS di `src/styles.css`:
  - `--sage`: `#718b78` | `--sage-dark`: `#4f6958` | `--sage-light`: `#e8f0ea` | `--sage-pale`: `#f3f7f3`
  - `--cream`: `#faf9f5` | `--white`: `#ffffff` | `--text`: `#252925` | `--muted`: `#737873`
  - `--border`: `#e4e9e4` | `--green`: `#5f896d` | `--amber`: `#b18a4b` | `--red`: `#b66b68`
  - `--shadow`: `0 2px 12px rgba(48, 65, 53, 0.055)`
- [x] 🔴 Import Google Font `Inter` (`wght@400;500;600;700`) pada `src/routes/__root.tsx`

---

## Phase 1: Database Schema PostgreSQL & Prisma ORM (Sesuai `ERD.md`) (Minggu 1)
### 1.1 Definisi Model Prisma Schema (`prisma/schema.prisma`)
- [x] 🔴 Setup Prisma Schema dengan generator client `@prisma/adapter-pg`
- [x] 🔴 Model `Role` (`id`, `name`: `SUPER_ADMIN` / `ADMIN` / `TENANT` / `STAFF`, `description`)
- [x] 🔴 Model `User` (`id`, `roleId` FK, `email` UK, `passwordHash`, `name`, `assignedPropertyId` FK optional, `createdAt`, `updatedAt`)
- [x] 🔴 Model `Property` (`id`, `name`, `address`, `description`, `bankAccountInfo`, `imageUrl` optional, `createdAt`, `updatedAt`)
- [x] 🔴 Model `UserPropertyAccess` (`id`, `userId` FK, `propertyId` FK) — Relasi penugasan akses kos untuk Admin
- [x] 🔴 Model `CctvDevice` (`id`, `propertyId` FK, `name`, `streamUrl`, `isActive`, `createdAt`)
- [x] 🔴 Model `Room` (`id`, `propertyId` FK, `roomNumber`, `type`: `Standard`/`Deluxe`, `price` / `monthlyPrice` `Decimal(12,2)`, `facilities` Text/JSON, `status`: `VACANT` / `OCCUPIED` / `MAINTENANCE`, `createdAt`, `updatedAt`)
- [x] 🔴 Model `Tenant` (`id`, `name`, `NIK` UK, `phoneNumber` / `whatsappNumber`, `email` optional, `birthDate` DateTime optional, `occupation`, `originAddress`, `status`: `ACTIVE` / `INACTIVE`, `createdAt`, `updatedAt`)
- [x] 🔴 Model `RentalContract` (`id`, `roomId` FK, `tenantId` FK, `billingCycle`: `MONTHLY` / `QUARTERLY` / `SEMI_ANNUAL` / `ANNUALLY`, `startDate`, `endDate`, `dueDateDay` Int (1-31), `status`: `ACTIVE` / `TERMINATED`, `createdAt`, `updatedAt`)
- [x] 🔴 Model `Invoice` (`id`, `contractId` FK, `invoiceNumber` UK, `periodMonth`, `periodYear`, `amount` `Decimal(12,2)`, `dueDate`, `paidAt` optional, `status`: `PENDING` / `PAID` / `OVERDUE` / `CANCELLED`, `pdfUrl` optional, `createdAt`, `updatedAt`)
- [x] 🔴 Model `Transaction` / `Expense` (`id`, `propertyId` FK, `createdBy` / `recordedById` FK User, `complaintId` FK optional, `type`: `INCOME` / `EXPENSE`, `category`: `RENT` / `UTILITIES` / `INTERNET` / `MAINTENANCE` / `SALARY` / `OTHER`, `amount` `Decimal(12,2)`, `transactionDate`, `description`, `createdAt`)
- [x] 🔴 Model `Complaint` (`id`, `roomId` FK, `category`: `PLUMBING` / `ELECTRICAL` / `AC` / `FURNITURE` / `OTHER`, `description`, `status`: `PENDING` / `IN_PROGRESS` / `DONE`, `reportedDate`, `resolvedDate` optional, `createdAt`, `updatedAt`)
- [x] 🔴 Model `Announcement` (`id`, `propertyId` FK optional, `title`, `content`, `category`: `KERJA_BAKTI` / `MAINTENANCE` / `ACARA` / `UMUM`, `isBroadcast` Boolean, `sentAt` optional, `createdAt`)
- [x] 🔴 Model `NotificationLog` (`id`, `recipientNumber`, `messageType`: `DUE_DATE_REMINDER` / `BIRTHDAY_WISH` / `ANNOUNCEMENT` / `INVOICE`, `status`: `SENT` / `FAILED`, `notes` optional, `sentAt`)
- [x] 🔴 Model `AiFinancialReport` (`id`, `propertyId` FK optional, `periodMonth`, `periodYear`, `totalIncome` `Decimal(12,2)`, `totalExpense` `Decimal(12,2)`, `netProfit` `Decimal(12,2)`, `occupancyRate` Float, `aiNarrativeSummary` JSON, `pdfFileUrl` optional, `createdAt`)

### 1.2 Database Migration & Seed Initial Data
- [x] 🔴 Definisi skema dan generate Prisma Client ke `src/generated/prisma`
- [x] 🟡 Buat script `prisma/seed.ts` berisi data realistis:
  - Role: `SUPER_ADMIN`, `ADMIN`, `TENANT`, `STAFF`
  - Akun SuperAdmin (Owner) & Akun Admin Staf
  - 2 Properti Kos: "HomeeKost Cabang Melati" & "HomeeKost Cabang Mawar"
  - Kamar per properti (kombinasi `VACANT`, `OCCUPIED`, `MAINTENANCE`)
  - Data Penyewa & Kontrak Sewa aktif dengan tanggal jatuh tempo & tanggal lahir
  - Data Transaksi Kas (Pemasukan & Pengeluaran) & Log Komplain
  - CCTV Device dummy per cabang

---

## Phase 2: Autentikasi RBAC, Session Guard & Master Shell Layout (Minggu 1 - 2)
### 2.1 Better-Auth Implementation & Server Route Guards
- [x] 🔴 Konfigurasi Better-Auth server provider di `src/lib/auth.ts` dengan session cookie & adapter Prisma PostgreSQL
- [x] 🔴 Auth Client RPC helper di `src/lib/auth-client.ts`
- [x] 🔴 Skema validasi Zod form login di `src/common/validations/auth.schema.ts`
- [x] 🔴 Halaman Login `src/routes/login.tsx` (TanStack Form, Zod validation, UI Sage & Cream exact replica dari `KostManagement.html`)
- [x] 🔴 Protected Route Middleware & Role Guard (`SUPER_ADMIN` vs `ADMIN`) di TanStack Router context `beforeLoad`
- [x] 🔴 State active property selector pada session context untuk isolasi multi-property

### 2.2 Layout Shell Aplikasi (100% Mengikuti `KostManagement.html`)
- [x] 🔴 Komponen `Sidebar.tsx`:
  - Brand header Logo HomeeKost & Badge Properti Terpilih
  - Menu Navigasi: Dashboard, Properti (SuperAdmin), Kamar, Penghuni, Pembayaran, Invoice, Keuangan, Engagement, CCTV, User Management (SuperAdmin), Laporan & Insight
  - Indikator Active Menu (latar `#E8F0EA`, teks `#4F6958`) & Counter Badge
  - Mini Card Bantuan / WhatsApp Help
  - Profil Mini & Tombol Logout di bagian bawah sidebar
- [x] 🔴 Komponen `Topbar.tsx`:
  - Tombol toggle sidebar mobile drawer
  - Breadcrumb dinamis & Global Property Switcher Dropdown (SuperAdmin)
  - Input Global Search dengan popup hasil pencarian
  - Tombol Notifikasi Popover & Avatar Profil Mini Popover
- [x] 🔴 Layout Route `/dashboard` & Root Dashboard Page `/dashboard/index.tsx` (Desktop fixed sidebar 244px, sticky topbar 72px, max-width content 1550px)
- [x] 🔴 Komponen Reusable Primitives UI (Shadcn UI + Lucide React + Chart.js):
  - `button.tsx` (default, outline, secondary, ghost, destructive, icon)
  - `input.tsx`, `select.tsx`, `combobox.tsx`, `label.tsx`, `badge`
  - `card.tsx`, `skeleton.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`
  - `RevenueExpenseChart.tsx` & `OccupancyDonutChart.tsx` (Chart.js + react-chartjs-2)
  - `Toast` notification popup & skeleton loader state

---

## Phase 3: Modul Properti Kos (Kost / Property Management — SuperAdmin) (Minggu 2)
### 3.1 Data Access & Server Functions Properti
- [x] 🔴 Repository & Service `src/data/repositories/property.repository.ts` & `src/data/services/property.service.ts`:
  - CRUD Data Cabang Kos
  - Agregasi statistik kos (Total kamar, kamar terisi, persentase okupansi, estimasi omzet per properti)
  - Pengaturan rekening bank default per properti
- [x] 🔴 Zod Schema validation `src/common/validations/property.schema.ts`
- [x] 🔴 Server Functions `src/data/servers/property.fn.ts` & Hooks `src/hooks/use-properties.ts`

### 3.2 Halaman Daftar & Detail Properti (`KostManagement.html` Screen `#propertyScreen` & `#propertyDetail`)
- [x] 🔴 Halaman `src/routes/dashboard/select-property.tsx`:
  - Card View Daftar Kos (Nama kos, alamat, jumlah kamar, status okupansi, info rekening)
  - Hover state & shadow lembut sesuai Design System
  - Tombol "Masuk Kos" / "Kelola Kos" (Set active property session & redirect), Tombol Edit, dan Tombol Hapus Kos
- [x] 🔴 Modal Form Tambah / Edit Kos (`PropertyFormDialog`):
  - Form input: Nama Kos, Alamat Lengkap, Deskripsi, No Rekening / Bank, Link Foto
- [x] 🔴 Halaman `src/routes/dashboard/properties.$propertyId.tsx`:
  - Header detail kos, alamat lengkap, dan statistik ringkas properti
  - Grid daftar seluruh kamar di bawah kos tersebut
  - Tombol navigasi cepat untuk menambah kamar baru ke properti terpilih

---

## Phase 4: Modul Kamar, Penyewa & Kontrak Sewa (Admin & SuperAdmin) (Minggu 2 - 3)
### 4.1 Manajemen Kamar (Room Management — Screen `#rooms`)
- [x] 🔴 Repository & Service `src/data/repositories/room.repository.ts` & `src/data/services/room.service.ts`:
  - CRUD Kamar terikat pada `propertyId`
  - Update status kamar (`VACANT`, `OCCUPIED`, `MAINTENANCE`)
  - Format harga dan penanganan kontrak sewa aktif
- [x] 🔴 Server Functions `src/data/servers/room.fn.ts` & Hooks `src/hooks/use-rooms.ts`
- [x] 🔴 Halaman `src/routes/dashboard/rooms.tsx`:
  - Room Cards Grid dengan visual status:
    - Hijau (`#E8F2EA` / `#568062`) = `VACANT` / Tersedia
    - Biru (`#E6F0FA` / `#2B6CB0`) = `OCCUPIED` / Terisi
    - Kuning (`#F6F0E4` / `#99773D`) = `MAINTENANCE` / Perbaikan
  - Segmented status filters (`Semua`, `Terisi`, `Kosong`, `Maintenance`) & Paginasi
  - Modal Form Tambah & Edit Kamar (`RoomFormDialog`) dengan Zod & TanStack Form
  - Modal Detail Kamar (`RoomDetailDialog`) & Modal Hapus Kamar (`RoomDeleteDialog`)

  - Filter Bar Status: Semua, Tersedia (Vacant), Terisi (Occupied), Perbaikan (Maintenance)
  - Quick action card: Tombol klik untuk buka detail kamar
- [x] 🔴 Modal Tambah / Edit Kamar (`RoomFormDialog`):
  - Input: Nomor Kamar, Tipe (Standard/Deluxe/Suite), Harga Sewa Bulanan (Rp), Fasilitas, Status Kamar
- [x] 🔴 Modal Detail Kamar (`RoomDetailDialog`):
  - Rincian harga sewa, fasilitas, status kamar saat ini
  - Informasi Penyewa Aktif & Tanggal Jatuh Tempo


### 4.2 Manajemen Penyewa & Kontrak Sewa (Tenant Management — Screen `#tenants`)
- [x] 🔴 Repository & Service `src/data/repositories/tenant.repository.ts` & `src/data/services/tenant.service.ts`:
  - CRUD Penyewa & Kontrak Sewa dengan penyimpanan foto arsip KTP (`ktpUrl`)
  - Logic sanitasi nomor WhatsApp (`sanitizePhone` format canonical `628xxx` & UI display `08xxx`)
  - Relasi penyewa ke kamar & siklus pembayaran (`MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `ANNUALLY`)
  - Auto-update status kamar menjadi `OCCUPIED` saat kontrak aktif, dan kembali ke `VACANT` saat check-out/selesai sewa
  - **Smart Historical Multi-Period Settlement (1-Click)**: Otomasi kalkulasi dan penerbitan invoice periode lampau berstatus `PAID` untuk kemudahan migrasi data lama tanpa ribet
  - **Asisten AI Vision OCR KTP (`ktp-ocr.service.ts`)**: Ekstraksi identitas NIK 16 digit, Nama Lengkap, Tanggal Lahir, dan Alamat Asal berbasis Google Gemini Multimodal Vision dengan arsitektur anti-crash (*safe error fallback*)
- [x] 🔴 Halaman `src/routes/dashboard/tenants.tsx`:
  - Tabel Data Penyewa: Nama, Kamar Disewa, Status Pekerjaan (Mahasiswa/Karyawan), Nomor WhatsApp, NIK, Tanggal Lahir, Jatuh Tempo, Status Pembayaran (Lancar/Terlambat), dan tombol aksi **"Check-Out"**
  - Search & Filtering berdasarkan status dan pencarian instan
  - Server Functions (`tenant.fn.ts`), `scanKtpServerFn`, & TanStack Query Hooks (`useTenants`, `useCreateTenant`, `useUpdateTenant`, `useDeleteTenant`, `useScanKtp`)
- [x] 🔴 Modal Form Tambah / Edit Penyewa (`TenantFormDialog`):
  - Area Upload & AI Vision Scan KTP di **bagian paling atas form**
  - Banner Deteksi Migrasi Data Lampau & Checkbox *"Tandai semua periode lampau sebagai LUNAS"*
  - Input: Nama Lengkap, Nomor KTP (NIK), Tanggal Lahir, Nomor WhatsApp aktif, Email, Alamat Asal, Pekerjaan, Pilihan Kamar, Siklus Pembayaran, Tanggal Mulai Sewa, Tanggal Jatuh Tempo
- [x] 🔴 Modal Detail Penyewa (`TenantDetailDialog`) & Dialog Check-Out (`TenantDeleteDialog`):
  - Profil lengkap, kartu pratinjau dokumen foto KTP, kontak WA, NIK, riwayat pembayaran & invoice, status kontrak
  - Dialog konfirmasi Check-Out / Selesai Sewa informatif (Kamar kembali `VACANT`, seluruh arsip transaksi kas & invoice tetap tersimpan aman di database)

---

## Phase 5: Modul Keuangan, Arus Kas & Sinkronisasi Komplain (Minggu 3)
### 5.1 Arus Kas & Transaksi Keuangan (Screen `#finance`)
- [x] 🔴 Repository & Service `src/data/repositories/transaction.repository.ts` & `src/data/services/cashflow.service.ts`:
  - Pencatatan Pemasukan (`INCOME`) & Pengeluaran (`EXPENSE`)
  - Isolasi transaksi per `propertyId`
  - Audit Trail: Menyimpan `createdBy` / `recordedById` untuk setiap transaksi
  - Agregasi matematika PostgreSQL berpresisi `Decimal(12,2)`: Total Pemasukan, Total Pengeluaran, Saldo Bersih, Saldo Operasional
- [x] 🔴 Halaman `src/routes/dashboard/finance.tsx`:
  - 4 Ringkasan Widget Kas: Total Pemasukan Bulan Ini, Total Pengeluaran, Laba Bersih Kas, Rasio Beban
  - Toolbar Filter: Filter Rentang Tanggal, Filter Kategori Transaksi, Filter Jenis Transaksi, Pencarian real-time
  - Tabel Riwayat Arus Kas (`FinanceTransactionTable`): Tanggal, Kost, Kategori, Deskripsi, Tipe (Pemasukan/Pengeluaran badge hijau/merah), Nominal (Rp), Aksi (Detail, Edit, Hapus dengan RBAC)
  - Grafik Tren Laba Bersih 6 Bulan (`FinanceNetProfitChart`) & Komposisi Beban Biaya (`FinanceCostComposition`)
  - Laporan Laba Rugi P&L (`FinanceProfitLossTable`) dengan selector Bulan/Tahun dan tombol Ekspor CSV 12 Bulan
- [x] 🔴 Modal Form Transaksi Kas (`FinanceFormDialog`) & Detail Transaksi (`TransactionDetailDialog`):
  - Input: Tipe Transaksi (Pemasukan / Pengeluaran), Cabang Kos Terkait, Kategori, Klasifikasi (Operasional / Investasi), Nominal (Rp), Tanggal Transaksi, Metode Pembayaran, Deskripsi/Keterangan
  - Validasi Zod & Error Handling lengkap
- [x] 🔴 Rekap Matriks 12 Bulan & Generator Ekspor CSV (`exportAnnualFinancialCsvServerFn`):
  - Perhitungan pendapatan, biaya operasional vs investasi, dan laba bersih 12 bulan penuh dengan format CSV kompatibel Excel (UTF-8 BOM).
- [x] 🟢 **Sinkronisasi Riwayat & Perhitungan Pengeluaran Kas**:
  - Penyelarasan batas awal dan akhir bulan menggunakan standar WIB (UTC+7) di seluruh backend service (`getMonthDateRange`)
  - Invalidasi cache query dashboard (`["dashboard", "overview"]`) pada mutasi transaksi kas agar kartu Dashboard langsung reaktif real-time
  - Penyajian nominal rupiah presisi penuh di bawah Rp 10 juta (`formatRupiah`) untuk mencegah salah persepsi akibat pembulatan pemendekan
  - Sinkronisasi filter periode tabel transaksi kas dengan selector aktif (toggle *"Bulan Terpilih"* vs *"Semua Periode"*) serta auto-reset paginasi ke halaman 1 saat filter berubah.

---

## Phase 6: Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp Gateway (Minggu 3 - 4)
### 6.1 Fonnte WhatsApp API Gateway Integration (`api.fonnte.com`)
- [x] 🔴 Client Helper `src/lib/fonnte-client.ts` & `src/lib/phone-sanitizer.ts`:
  - Header: `Authorization: ${FONNTE_TOKEN}`
  - Function `sendText({ target, message })` via `POST https://api.fonnte.com/send`
  - Function `sendFile({ target, message, url, filename })`
  - Logging status respons pengiriman ke tabel `NotificationLog`
  - Fallback mechanism: Jika API gagal/koneksi bermasalah, sediakan tombol link manual WhatsApp Web / App (`https://wa.me/628xxx?text=...`)
  - Template Generator `src/lib/whatsapp-templates.ts` (Invoice Tagihan, Pengingat Jatuh Tempo H-3/Hari H/Overdue, Kwitansi Lunas)

### 6.2 Monitoring Pembayaran & Tagihan (Screen `#payments`)
- [x] 🔴 Halaman `src/routes/dashboard/payments.tsx`:
  - Kartu Ringkasan: Total Tagihan Bulan Ini, Sudah Dibayar, Belum Dibayar / Terlambat
  - Filter Status Pembayaran: Semua, Menunggu Pembayaran (`PENDING`), Lunas (`PAID`), Jatuh Tempo (`OVERDUE`)
  - Filter Periode Bulan & Tahun dan Pencarian Instan Real-time
  - Tabel Tagihan TanStack Table v8: Nomor Invoice, Nama Penyewa (dengan direct link WA), Kamar, Jatuh Tempo (dengan indikator visual H-3, H-0, Overdue), Nominal Tagihan, Status Badge, Tanggal Bayar
  - Aksi "Verifikasi Pembayaran" (*Confirm / Mark as Paid*) -> Otomatis mencatat pelunasan & menambah Pemasukan Kas (`INCOME` - `RENT`) secara atomik via Prisma Transaction
  - Modal Generate Tagihan Bulanan Massal (`PaymentGenerateDialog`) & Modal Buat Tagihan Manual (`PaymentFormDialog`)
  - Action button "Kirim WA (Fonnte API)" dan "Buka WhatsApp Web (Manual wa.me)"
  - **Dukungan Pembayaran Bertahap / Cicilan Sewa**:
    - Dialog Konfirmasi Pembayaran fleksibel: Pilihan Lunas Penuh vs Pembayaran Bertahap (Cicilan) dengan input nominal kustom & kalkulasi sisa real-time
    - Pencatatan Pemasukan Kas multi-transaksi atomik (`INCOME` - `RENT`) sesuai nominal riil yang diterima per cicilan tanpa mutasi enum PostgreSQL (`InvoiceStatus`)
    - Akurasi ringkasan statistik kas (`getStats`): omzet terealisasi (`paidAmount`) menghitung total transaksi cicilan yang masuk, sisa tagihan tercatat akurat sebagai `unpaidAmount`
    - Indikator UI tabel pembayaran: Rincian `Terbayar: Rp X · Sisa: Rp Y`, badge status `🌓 Dicicil`, serta tombol aksi cepat pengingat sisa cicilan menjelang akhir bulan via WhatsApp
    - Template WhatsApp: Bukti Penerimaan Cicilan Sewa (`partialPaymentReceipt`) & Pengingat Sisa Pelunasan Akhir Bulan (`installmentReminder`)

### 6.3 Invoice Digital & Live PDF Engine (Screen `#invoice`)
- [x] 🔴 In-Memory PDF Generator (`src/lib/pdf-generator.ts`):
  - Pure in-memory PDF Engine (`pdf-lib`) super ringan (<10MB RAM, cocok untuk VPS Linux 2GB)
  - Layout formal A4 (Logo HomeeKost, Nomor Invoice, Stempel LUNAS / MENUNGGU, Rentang Periode Sewa, Tabel Rincian, Rekening Transfer BCA, Tanda Tangan)
- [x] 🔴 Fonnte Direct Multipart PDF Upload (`src/lib/fonnte-client.ts`):
  - Pengiriman file PDF biner Buffer secara langsung via `multipart/form-data` ke Fonnte API (`api.fonnte.com/send`)
- [x] 🔴 Halaman `src/routes/dashboard/invoices.tsx`:
  - Split View Layout (Daftar Invoice real-time dari database di panel kiri, Live Preview Dokumen Faktur/Kwitansi di panel kanan)
  - Tombol Buat Invoice Manual (`PaymentFormDialog`)
  - Tombol Aksi **"Kirim File via WA"** (Kirim file dokumen PDF langsung via WhatsApp Fonnte)
  - Tombol **"Cetak / Simpan PDF"** (A4 Print-to-PDF)

---

## Phase 7: Background Cron Scheduler & Engagement Hub (Minggu 4)
### 7.1 Automated Daily Cron Tasks (08:00 WIB)
- [x] 🔴 Endpoint Server Cron `src/routes/api/cron/daily-tasks.ts`:
  - **Pemeriksaan Jatuh Tempo**: Query invoice H-3, H-0, dan Overdue -> Auto-update status `OVERDUE` -> Dispatch pesan pengingat tagihan otomatis via Fonnte API
  - **Birthday Reminder Engine**: Query data penyewa aktif yang ulang tahun hari ini (berdasarkan `birthDate`) -> Dispatch ucapan selamat ulang tahun personal via Fonnte API
  - Simpan audit pengiriman pesan ke `NotificationLog`
  - Dilindungi token rahasia `CRON_SECRET` (Authorization Bearer / Query param)

### 7.2 Modul Engagement & Pengumuman Kos (Screen `#engagement`)
- [x] 🔴 Halaman `src/routes/dashboard/engagement.tsx`:
  - Panel Dinamis **"Hub Penerima Pesan & Seleksi Broadcast"** (`EngagementDynamicRecipientPanel`): Menampilkan daftar penerima yang otomatis terfilter sesuai template pesan aktif di kolom kanan (Sambutan: penghuni baru 30 hari; Ulang Tahun: rentang H-5 hingga Hari-H; Pembayaran: penyewa tepat waktu 14 hari terakhir; Kerja Bakti/Umum: seluruh penghuni aktif)
  - **Optimalisasi Single-Fetch & Client Caching**: Query backend tunggal (`getEngagementDashboard`) dengan TanStack Query `staleTime: 60s` & `refetchInterval: 60s` + in-memory filtering (0ms latency perpindahan template)
  - **Mode Multi-Select & Broadcast Selektif**: Checkbox per baris + "Pilih Semua", penghitung `(N) dari (M) dipilih`, dan tombol `Broadcast ke (N) Terpilih` dengan Meta anti-ban pacing jitter (800ms - 1200ms)
  - **Badge Status Murni & Anti-Spam Confirmation**: Badge teks murni (`Terkirim Hari Ini` dan `Belum Dikirim`), dengan modal konfirmasi anti-spam saat mengirim ulang apresiasi pembayaran yang sudah pernah terkirim hari ini
  - **Persistensi Template & Kategori**: Kategori selector (`Sambutan`, `Pembayaran`, `Ulang Tahun`, `Kerja Bakti`, `Umum`) dan persistensi `localStorage`
  - Widget **"Agenda & Pengumuman Kos"**: Daftar pengumuman kegiatan (Kerja Bakti, Maintenance, Acara, Umum) + tombol **"Broadcast WA"**
  - Widget **"Riwayat Log Notifikasi WhatsApp"**: Audit 15 log pengiriman notifikasi terakhir dari database
  - Modal Form Buat Pengumuman & Broadcast Massal (`EngagementEventDialog`) dengan ikon Lucide bersih, label "Semua Cabang", dan pembatasan pembuatan pengumuman khusus `SuperAdmin`
  - Tombol manual **"Jalankan Cron Pagi"** untuk testing dan eksekusi instan pengingat harian
- [x] 🟢 Halaman `src/routes/dashboard/tenants.tsx` (`TenantFormDialog.tsx`):
  - Banner informasi non-teknis ("Info Penyesuaian Tagihan") yang ramah dan mudah dipahami pengguna awam untuk mode Koreksi Salah Input dan Pindah Kamar Resmi, menggantikan opsi checkbox manual rumit.

---

## Phase 8: AI Financial Intelligence & Laporan Eksekutif Bulanan (Minggu 4 - 5)
### 8.1 Zero-Hallucination Deterministic RAG Pipeline
- [x] 🟢 Service & Repository `src/data/repositories/report.repository.ts` & `src/data/services/report.service.ts`:
  - Kalkulasi matematika murni PostgreSQL: Omzet, Total Beban Operasional, Biaya Investasi, Laba Bersih, Rasio Okupansi, Pengeluaran Terbesar per Kategori, Total Tunggakan, dan Matriks Keuangan 12 Bulan (Jan–Des)
- [x] 🟢 Strict System Root Prompt & Context Serializer `src/ai/prompts/system-root.prompt.ts` & `src/ai/prompts/financial-context.ts`:
  - System Root Prompt disiplin (Bahasa Indonesia formal, batasan domain keuangan kos ketat, zero-hallucination guard)
  - Serialisasi data terstruktur PostgreSQL ke context prompt AI dengan rubrik evaluasi eksplisit (`PRIMA`, `SEHAT`, `WASPADA`, `KRITIS`)
- [x] 🟢 Multi-Tier LLM Client & Fallback Engine `src/ai/llm/` (`gemini.client.ts`, `groq.client.ts`, `fallback.engine.ts`, `ai-manager.ts`):
  - Integrasi Gemini API & Groq Cloud API dengan schema enforcement Zod `AiFinancialInsightSchema`:
    - `executiveSummary` (Ringkasan performa bisnis 2-3 kalimat)
    - `financialHealthGrade` (`PRIMA` | `SEHAT` | `WASPADA` | `KRITIS`)
    - `trendAnalysis` (Penerimaan omzet, struktur beban biaya, dampak okupansi unit)
    - `complaintCostImpact` (Dampak finansial perbaikan kerusakan fasilitas terhadap laba)
    - `strategicRecommendations` (Tepat 3 butir rekomendasi taktis prioritas)
  - Deterministic Rule-Based Fallback Engine lokal (100% garansi ketersediaan tanpa risiko downtime API)

### 8.2 Monthly Executive Report & Formatted Annual CSV (Screen `#reports`)
- [x] 🟢 Structured Annual CSV Generator `src/lib/csv-exporter.ts`:
  - Format tabel matriks 12 bulan (Jan–Des) per cabang kos, total omzet, beban operasional, beban investasi, laba bersih, dan margin laba dengan encoding **UTF-8 BOM** (langsung rapi dan terstruktur di Microsoft Excel & Google Sheets)
- [x] 🟢 Halaman `src/routes/dashboard/reports.tsx`:
  - Selector Periode Bulan/Tahun & Filter Properti Multi-Cabang (SuperAdmin)
  - 4 Card Metrik Finansial Utama (Omzet, Total Pengeluaran, Laba Bersih & Margin %, Okupansi Kamar)
  - Visual Box Executive AI Insight (`ReportAiInsightPanel` dengan badge status kesehatan finansial, analisis tren, dan prioritas rekomendasi)
  - Breakdown Pengeluaran Terbesar per Kategori & Distribusi Status Kamar (`ReportRoomExpenseBreakdown`)
  - Kartu Matriks Keuangan Tahunan 12 Bulan dengan Visual Chart Tren Arus Kas (`ReportAnnualMatrixCard`)
  - Tombol **"Refresh AI"**, **"Cetak PDF"**, dan **"Ekspor Laporan Tahunan (.CSV)"**

---

## Phase 9: Modul CCTV Monitoring & User Management (SuperAdmin) (Minggu 5)
### 9.1 CCTV Stream Monitoring (Screen `#cctv`)
- [ ] 🔴 Repository & Service `src/data/repositories/cctv.repo.ts`:
  - CRUD Device CCTV per `propertyId` (Nama Kamera, Lokasi/Area, Stream URL / RTSP / HLS, Status Aktif)
- [ ] 🔴 Halaman `src/routes/cctv/index.tsx`:
  - Grid CCTV Stream Card per cabang kos
  - Status indikator Live / Offline
  - Tombol Fullscreen Modal Stream CCTV (`#cctvFullscreenModal`)

### 9.2 Modul Pengelolaan Pengguna & Hak Akses (Screen `#users` — `src/routes/dashboard/users.tsx`)
- [x] 🟢 Halaman User Management (`SUPER_ADMIN` Only Guard):
  - Tabel Daftar Pengguna: Nama, Email, Role Badge (`SUPER_ADMIN` / `ADMIN` / `STAFF`), Cabang Kos yang Dikelola, Tanggal Terdaftar, Status Akun
  - Segmented Filter Role (`Semua`, `SuperAdmin`, `Admin`, `Staff`) dengan live counter badge & Search
  - Modal Form Tambah & Edit Pengguna (`UserFormDialog`) terintegrasi dinamis dengan data real database cabang properti (`useProperties`)
  - Modal Konfirmasi Hapus Pengguna (`UserDeleteDialog`)
  - Tabel Riwayat Perubahan & Audit Trail Log terintegrasi live dari database PostgreSQL
  - Integrasi End-to-End dengan TanStack Query Hooks (`useUsers`, `useUserAuditLogs`, `useCreateUser`, `useUpdateUser`, `useDeleteUser`) & Server Functions (`user.fn.ts`)
- [x] 🟢 Halaman / Modal Detail User (`src/routes/users/$userId.tsx`):
  - Profil staf, hak akses, dan Tabel Riwayat Input Transaksi Keuangan oleh staf tersebut

### 9.3 Halaman Profil Pengelola & Pengaturan Akun (Screen `#profile` — `src/routes/dashboard/profile.tsx`)
- [x] 🟢 UI Header Profil Admin dengan Tombol Keluar Akun (`action-danger`)
- [x] 🟢 Kartu Ringkasan Akun (`ProfileOverviewCard`): Cover Sage `#edf4ee`, Avatar Overlapping besar `72x72px`, Nama, Subtitle, dan Grid 2-kolom status properti aktif & role
- [x] 🟢 Formulir Informasi Akun (`ProfileInfoForm`): TanStack Form + Zod (`name`, `email`, `phoneNumber`, `newPassword` opsional)
- [x] 🟢 Dialog Pengaturan Keamanan (`SecuritySettingsDialog`): Ganti kata sandi dengan validasi verifikasi password lama & konfirmasi
- [x] 🟢 Kartu Properti yang Dikelola (`ProfileManagedPropertiesCard`): Switcher cabang kos real-time dengan status indikator aktif
- [x] 🟢 Perapihan Sidebar Bottom Profile Area (`Sidebar.tsx`): Memisahkan hit target navigasi profil `<Link to="/dashboard/profile">` dengan tombol Logout independen (`e.stopPropagation()`) tanpa benturan/tabrakan
- [x] 🟢 Integrasi Popover Topbar (`Topbar.tsx`): Menu navigasi langsung "Profil Saya"
- [x] 🟢 Server Functions (`getMyProfileServerFn`, `updateMyProfileServerFn`, `changeMyPasswordServerFn`) & React Query Hooks (`useMyProfile`, `useUpdateMyProfile`, `useChangeMyPassword`)

---

## Phase 10: Overview Dashboard, Polish & Deployment VPS (Minggu 5)
### 10.1 Dashboard Utama (Screen `#dashboard` — `src/routes/dashboard/index.tsx`)
- [x] 🟢 4 Top Stat Cards Real-Time dari PostgreSQL:
  - Total Kamar & Okupansi (Terisi, Kosong, Maintenance)
  - Total Pendapatan Bulan Berjalan (Rp) & Pertumbuhan MoM (%)
  - Tagihan Menunggu Pembayaran / Overdue (Rp & Jumlah Tagihan)
  - Total Pengeluaran Bulan Berjalan (Rp)
- [x] 🟢 Trend Arus Kas SVG Area/Spline Chart (Visualisasi garis kurva pendapatan & pengeluaran dinamis 6 bulan & 12 bulan)
- [x] 🟢 SVG Donut Chart Keterisian Kamar (Terisi, Kosong, Maintenance)
- [x] 🟢 Widget **"Pembayaran Terdekat"** (Daftar penyewa jatuh tempo terdekat dengan tombol quick WhatsApp direct link)
- [x] 🟢 Widget **"Perhatian Hari Ini"** (Deteksi otomatis ulang tahun penghuni dalam 7 hari ke depan, tagihan jatuh tempo, dan komplain kamar aktif)
- [x] 🟢 Widget **"Pengeluaran Terakhir"** & **"Kamar Mendekati Pembayaran"** (Breakdown ringkas per cabang kos)
- [x] 🟢 Widget **"Aktivitas & Log Notifikasi"** (Audit pengiriman pesan WhatsApp & mutasi terbaru)
- [x] 🟢 Quick Link navigation "Lihat Semua" ke setiap modul operasional terkait

### 10.2 Responsive & Aesthetic Polish (Mengacu pada `DESIGN.md`)
- [x] 🟢 Audit responsive breakpoints:
  - Desktop (>1050px): 244px fixed sidebar, multi-column grid
  - Tablet (761px - 1050px): 210px sidebar, 2-column stats, stacked panels
  - Mobile (<=760px): Drawer sidebar tersembunyi dengan tombol toggle, 1-column layouts, sticky topbar padding 16px, Mobile Tab Switcher untuk Split-View Invoice
  - Small Mobile (<=480px): 1-column stat cards, page title 21px, touch targets 44x44px
- [x] 🟢 Menerapkan micro-interactions & hover transitions (150ms-250ms ease)
- [x] 🟢 Memastikan konsistensi tipografi `Inter` dan kepadatan informasi (*High Information Density*)

### 10.3 Testing, Containerization & VPS Deployment
- [x] 🟢 **Unit Testing Suite (Vitest)**:
  - 38 unit test cases terisolasi untuk fungsi murni di `tests/unit/`:
    - `currency.test.ts` (Format Rupiah, Parse Integer, Edge Cases)
    - `phone-sanitizer.test.ts` (Canonical 628xxx, UI Display 08xxx, Validasi Seluler Indonesia, wa.me Link)
    - `date-utils.test.ts` (Jatuh Tempo +1/+3/+6/+12 Bulan, Nama Bulan Indonesia, Rentang Sewa)
    - `whatsapp-templates.test.ts` (Template Tagihan, H-3/H-0/Overdue, Ucapan Ulang Tahun)
    - `validations.test.ts` (Zod Schemas: Tenant, Room, Finance)
  - Hasil eksekusi: **38 tests passed (100% lulus)**
- [x] 🟢 **Production Build Verification**:
  - `npm run build` sukses menghasilkan artifact bundle TanStack Start + Nitro SSR (`.output/server/index.mjs`)
- [x] 🟢 Verifikasi `Dockerfile` multi-stage build untuk aplikasi TanStack Start Nitro SSR (`node .output/server/index.mjs`)
- [x] 🟢 Konfigurasi Docker Compose 2-Tier (`app` + `db` PostgreSQL 16 Alpine dengan healthcheck otomatis)
- [x] 🟢 Konfigurasi Environment Variable (`.env.example`) lengkap untuk Fonnte WhatsApp, Google Gemini GenAI SDK, Groq Cloud OpenAI SDK, dan Better-Auth Secret
- [x] 🟢 Validasi static type compile (`tsc --noEmit`) dan code formatting Biome 100% (0 error)
