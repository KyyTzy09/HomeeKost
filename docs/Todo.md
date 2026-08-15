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
- [ ] 🔴 Protected Route Middleware & Role Guard (`SUPER_ADMIN` vs `ADMIN`) di TanStack Router context `beforeLoad`
- [ ] 🔴 State active property selector pada session context untuk isolasi multi-property

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
- [ ] 🔴 Repository & Service `src/data/repositories/property.repo.ts`:
  - CRUD Data Cabang Kos
  - Agregasi statistik kos (Total kamar, kamar terisi, persentase okupansi, estimasi omzet per properti)
  - Pengaturan rekening bank / QRIS default per properti
- [ ] 🔴 Zod Schema validation `src/common/validations/property.schema.ts`

### 3.2 Halaman Daftar & Detail Properti (`KostManagement.html` Screen `#propertyScreen` & `#propertyDetail`)
- [ ] 🔴 Halaman `src/routes/properti/index.tsx`:
  - Card View Daftar Kos (Nama kos, alamat, jumlah kamar, status okupansi, info rekening)
  - Hover state naik 3px & shadow lembut
  - Tombol "Kelola Kos" (Masuk ke scope kos), Tombol Edit, dan Tombol Hapus Kos
- [ ] 🔴 Modal Form Tambah / Edit Kos (`#propertyModal`):
  - Form input: Nama Kos, Alamat Lengkap, Deskripsi, No Rekening / Bank / QRIS, Upload/Link Foto
- [ ] 🔴 Halaman `src/routes/properti/$propertyId.tsx`:
  - Header detail kos, alamat lengkap, dan statistik ringkas properti
  - Grid daftar seluruh kamar di bawah kos tersebut
  - Tombol navigasi cepat untuk menambah kamar baru ke properti terpilih

---

## Phase 4: Modul Kamar, Penyewa & Kontrak Sewa (Admin & SuperAdmin) (Minggu 2 - 3)
### 4.1 Manajemen Kamar (Room Management — Screen `#rooms`)
- [ ] 🔴 Repository & Service `src/data/repositories/room.repo.ts`:
  - CRUD Kamar terikat pada `propertyId`
  - Update status kamar (`VACANT`, `OCCUPIED`, `MAINTENANCE`)
  - Riwayat kontrak sewa kamar
- [ ] 🔴 Halaman `src/routes/kamar/index.tsx`:
  - Room Cards Grid dengan visual status:
    - Hijau (`#E8F2EA` / `#568062`) = `VACANT` / Tersedia
    - Biru (`#E6F0FA` / `#2B6CB0`) = `OCCUPIED` / Terisi
    - Kuning (`#F6F0E4` / `#99773D`) = `MAINTENANCE` / Perbaikan
  - Filter Bar Status: Semua, Tersedia (Vacant), Terisi (Occupied), Perbaikan (Maintenance)
  - Quick action card: Tombol klik untuk buka detail kamar
- [ ] 🔴 Modal Tambah / Edit Kamar (`#roomModal`):
  - Input: Nomor Kamar (e.g. A-101), Tipe (Standard/Deluxe), Harga Sewa Bulanan (Rp), Fasilitas (AC, WiFi, Kamar Mandi Dalam, Kasur, Lemari), Status Kamar
- [ ] 🔴 Modal / Halaman Detail Kamar (`#roomDetailModal` / `src/routes/kamar/$roomId.tsx`):
  - Rincian harga sewa, fasilitas, status kamar saat ini
  - Informasi Penyewa Aktif (Nama, WA, Tanggal Masuk, Tanggal Jatuh Tempo)
  - Riwayat Sewa (Rental History) kamar dari waktu ke waktu

### 4.2 Manajemen Penyewa & Kontrak Sewa (Tenant Management — Screen `#tenants`)
- [ ] 🔴 Repository & Service `src/data/repositories/tenant.repo.ts` & `rental-contract.repo.ts`:
  - CRUD Penyewa & Kontrak Sewa
  - Logic sanitasi nomor WhatsApp (format internasional `628xxx` / `08xxx`)
  - Relasi penyewa ke kamar & siklus pembayaran (`MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `ANNUALLY`)
  - Auto-update status kamar menjadi `OCCUPIED` saat kontrak aktif, dan kembali ke `VACANT` saat keluar
- [ ] 🔴 Halaman `src/routes/penyewa/index.tsx`:
  - Tabel Data Penyewa: Nama, Kamar Disewa, Status Pekerjaan (Mahasiswa/Karyawan), Nomor WhatsApp, NIK, Tanggal Lahir, Jatuh Tempo, Status Aktif
  - Search & Filtering berdasarkan status, kamar, dan pekerjaan
  - Pagination kontrol tabel
- [ ] 🔴 Modal Form Tambah / Edit Penyewa (`#residentModal`):
  - Input: Nama Lengkap, Nomor KTP (NIK), Tanggal Lahir (datepicker untuk Birthday Reminder), Nomor WhatsApp aktif, Email, Alamat Asal, Pekerjaan, Pilihan Kamar, Siklus Pembayaran, Tanggal Mulai Sewa, Tanggal Jatuh Tempo
- [ ] 🔴 Modal / Halaman Detail Penyewa (`#tenantDetailModal` / `src/routes/penyewa/$tenantId.tsx`):
  - Profil lengkap, kontak WA dengan link langsung, NIK, riwayat pembayaran & invoice, status kontrak

---

## Phase 5: Modul Keuangan, Arus Kas & Sinkronisasi Komplain (Minggu 3)
### 5.1 Arus Kas & Transaksi Keuangan (Screen `#finance`)
- [ ] 🔴 Repository & Service `src/data/repositories/transaction.repo.ts` & `src/data/services/cashflow.service.ts`:
  - Pencatatan Pemasukan (`INCOME`) & Pengeluaran (`EXPENSE`)
  - Isolasi transaksi per `propertyId`
  - Audit Trail: Menyimpan `createdBy` / `recordedById` untuk setiap transaksi
  - Agregasi matematika PostgreSQL berpresisi `Decimal(12,2)`: Total Pemasukan, Total Pengeluaran, Saldo Bersih, Saldo Operasional
- [ ] 🔴 Halaman `src/routes/transaksi/index.tsx` (atau tab Finance):
  - 3 Ringkasan Widget Kas: Total Pemasukan Bulan Ini, Total Pengeluaran, Laba Bersih
  - Toolbar Filter: Filter Rentang Tanggal, Filter Kategori Transaksi, Filter Cabang Kos, Pencarian
  - Tabel Riwayat Arus Kas: Tanggal, Kategori, Deskripsi, Tipe (Pemasukan/Pengeluaran dengan badge hijau/merah), Nominal (Rp), Dicatat Oleh (User), Aksi (Edit, Hapus)
- [ ] 🔴 Modal Form Transaksi Kas (`#financeModal`):
  - Input: Tipe Transaksi (Pemasukan / Pengeluaran), Kategori (Sewa, Listrik, Air, Internet/WiFi, Kebersihan/Gaji, Maintenance, Lain-lain), Nominal (Rp), Tanggal Transaksi, Deskripsi/Keterangan

### 5.2 Log Komplain & Sinkronisasi Biaya Perbaikan (Maintenance Engine)
- [ ] 🔴 Repository & Service `src/data/repositories/complaint.repo.ts`:
  - Pencatatan komplain fasilitas kamar kos
  - Status lifecycle: `PENDING` -> `IN_PROGRESS` -> `DONE`
- [ ] 🔴 Halaman Log Komplain `src/routes/komplain/index.tsx`:
  - Tabel Komplain: Kamar, Kategori Kerusakan (AC, Plumbing, Listrik, Furniture, Lainnya), Deskripsi, Tanggal Lapor, Status Badge, Biaya Perbaikan
  - Form Input Komplain baru oleh Admin
- [ ] 🔴 Sinkronisasi Biaya Perbaikan ke Transaksi Kas:
  - Saat komplain ditandai selesai (`status: DONE`), muncul dialog input total biaya perbaikan (Rp)
  - Sistem mengeksekusi *Prisma atomic transaction* untuk otomatis menambah record `EXPENSE` (kategori: `MAINTENANCE`, `complaintId` terkait)

---

## Phase 6: Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp Gateway (Minggu 3 - 4)
### 6.1 Fonnte WhatsApp API Gateway Integration (`api.fonnte.com`)
- [ ] 🔴 Client Helper `src/lib/fonnte-client.ts`:
  - Header: `Authorization: ${FONNTE_TOKEN}`
  - Function `sendTextMessage(target: string, message: string)` via `POST https://api.fonnte.com/send`
  - Function `sendInvoiceWithAttachment(target: string, message: string, fileUrl: string, filename: string)`
  - Logging status respons pengiriman ke tabel `NotificationLog`
  - Fallback mechanism: Jika API gagal/koneksi bermasalah, sediakan tombol link manual WhatsApp Web / App (`https://wa.me/628xxx?text=...`)

### 6.2 Monitoring Pembayaran & Tagihan (Screen `#payments`)
- [ ] 🔴 Halaman `src/routes/pembayaran/index.tsx`:
  - Kartu Ringkasan: Total Tagihan Bulan Ini, Sudah Dibayar, Belum Dibayar / Terlambat
  - Filter Status Pembayaran: Semua, Menunggu Pembayaran (`PENDING`), Lunas (`PAID`), Jatuh Tempo (`OVERDUE`)
  - Filter Periode Bulan & Tahun
  - Tabel Tagihan: Nomor Invoice, Nama Penyewa, Kamar, Jatuh Tempo (dengan indikator visual H-3, H-0, Overdue), Nominal Tagihan, Status Badge, Tanggal Bayar
  - Aksi "Verifikasi Pembayaran" (*Confirm / Mark as Paid*) -> Otomatis mencatat pelunasan & menambah Pemasukan Kas

### 6.3 Invoice Digital & Live PDF Engine (Screen `#invoice`)
- [ ] 🔴 PDF Generator Engine `src/lib/pdf-generator.ts`:
  - Template resmi Invoice HomeeKost (Header Kos, No Invoice, Tanggal, Detail Kamar, Periode Sewa, Nominal, Rekening Transfer / QRIS Pembayaran)
- [ ] 🔴 Halaman `src/routes/invoice/index.tsx`:
  - Split View Layout (Daftar Invoice di panel kiri, Live Preview PDF Invoice di panel kanan)
  - Tombol Buat Invoice Manual (`#invoiceModal`) & Generate Invoice Massal Bulanan
  - Tombol Aksi **"Kirim Tagihan via WhatsApp (Fonnte)"** (Otomatis panggil Fonnte API + lampiran link PDF)
  - Tombol Cadangan **"Kirim WA Manual (wa.me)"**
  - Tombol **"Download PDF Invoice"**

---

## Phase 7: Background Cron Scheduler & Engagement Hub (Minggu 4)
### 7.1 Automated Daily Cron Tasks (08:00 WIB)
- [ ] 🔴 Endpoint Server Cron `src/routes/api/cron/daily-tasks.ts`:
  - **Pemeriksaan Jatuh Tempo**: Query kontrak/invoice H-3, H-0, dan H+1 Overdue -> Auto-update status `OVERDUE` -> Dispatch pesan pengingat tagihan otomatis via Fonnte API
  - **Birthday Reminder Engine**: Query data penyewa aktif yang ulang tahun hari ini (berdasarkan `birthDate`) -> Dispatch ucapan selamat ulang tahun personal via Fonnte API
  - Simpan audit pengiriman pesan ke `NotificationLog`

### 7.2 Modul Engagement & Pengumuman Kos (Screen `#engagement`)
- [ ] 🔴 Halaman `src/routes/engagement/index.tsx`:
  - Widget **"Ulang Tahun Terdekat"**: Menampilkan daftar anak kos yang berulang tahun dalam 7 hari ke depan
  - Widget **"Agenda & Pengumuman Kos"**: Daftar pengumuman kegiatan (Kerja Bakti, Jadwal Pembayaran Sampah, Info Perbaikan Air/WiFi)
  - Modal Form Buat Pengumuman & Tombol **"Broadcast ke WhatsApp Seluruh Penghuni via Fonnte"**

---

## Phase 8: AI Financial Intelligence & Laporan Eksekutif Bulanan (Minggu 4 - 5)
### 8.1 Zero-Hallucination Deterministic RAG Pipeline
- [ ] 🔴 Service `src/data/repositories/report.repo.ts`:
  - Kalkulasi matematika murni PostgreSQL: Omzet, Total Beban Operasional, Laba Bersih, Rasio Okupansi, Perbandingan MoM (*Month-over-Month*), Pengeluaran Terbesar per Kategori, Total Tunggakan
- [ ] 🔴 RAG Context Serializer `src/ai/prompts/financial-context-builder.ts`:
  - Serialisasi data terstruktur PostgreSQL ke context prompt AI
- [ ] 🔴 LLM Client & Structured Output `src/ai/llm/client.ts` & `src/lib/ai-client.ts`:
  - Integrasi Gemini API / Groq API dengan schema enforcement Zod `AiFinancialInsightSchema`:
    - `executiveSummary` (Ringkasan performa bisnis 2-3 kalimat)
    - `financialHealthGrade` (`PRIMA` | `SEHAT` | `WASPADA` | `KRITIS`)
    - `trendAnalysis` (Analisis tren pendapatan, beban, dan okupansi)
    - `complaintFinancialImpact` (Dampak biaya komplain/kerusakan fasilitas terhadap laba)
    - `strategicRecommendations` (Tepat 3 butir rekomendasi taktis prioritas)
  - Static Rule-Based Fallback Engine jika API timeout/error

### 8.2 Monthly Cron & Executive PDF Report (Screen `#reports`)
- [ ] 🔴 Endpoint Cron Bulanan `src/routes/api/cron/monthly-ai-report.ts` (Setiap Tanggal 1 Pukul 00:01 WIB):
  - Generate data keuangan bulan sebelumnya -> Panggil AI Insight -> Simpan ke tabel `AiFinancialReport` -> Generate PDF Laporan Eksekutif
- [ ] 🔴 Halaman `src/routes/laporan/index.tsx`:
  - Selector Periode Bulan/Tahun & Filter Properti
  - Card Metrik Finansial Utama
  - Visual Box AI Insight (`.ai-insight-box` dengan aksen border hijau sage)
  - Breakdown Kategori Pengeluaran Terbesar
  - Tombol **"Generate / Refresh AI Insight"** & Tombol **"Download Laporan Eksekutif PDF"**

---

## Phase 9: Modul CCTV Monitoring & User Management (SuperAdmin) (Minggu 5)
### 9.1 CCTV Stream Monitoring (Screen `#cctv`)
- [ ] 🔴 Repository & Service `src/data/repositories/cctv.repo.ts`:
  - CRUD Device CCTV per `propertyId` (Nama Kamera, Lokasi/Area, Stream URL / RTSP / HLS, Status Aktif)
- [ ] 🔴 Halaman `src/routes/cctv/index.tsx`:
  - Grid CCTV Stream Card per cabang kos
  - Status indikator Live / Offline
  - Tombol Fullscreen Modal Stream CCTV (`#cctvFullscreenModal`)

### 9.2 Manajemen User & Staf Kos (User Management — Screen `#users` — SuperAdmin Only)
- [ ] 🔴 Repository & Service `src/data/repositories/user.repo.ts`:
  - CRUD Akun Pengguna sistem (SuperAdmin & Admin Staf)
  - Penugasan cabang kos (`assignedPropertyId`)
  - Tracking riwayat transaksi yang dibuat oleh user (`createdBy` audit trail)
- [ ] 🔴 Halaman `src/routes/users/index.tsx`:
  - Tabel Daftar Pengguna: Nama, Email, Role Badge (`SUPER_ADMIN` / `ADMIN`), Cabang Kos yang Dikelola, Tanggal Terdaftar, Status Akun
  - Tombol Tambah User Baru & Tombol Aksi Hapus/Nonaktifkan
- [ ] 🔴 Modal Tambah / Edit User (`#userModal`):
  - Form Input: Nama Lengkap, Email, Password, Pilihan Role (`SUPER_ADMIN` / `ADMIN`), Penugasan Properti Kos
- [ ] 🔴 Halaman / Modal Detail User (`src/routes/users/$userId.tsx`):
  - Profil staf, hak akses, dan Tabel Riwayat Input Transaksi Keuangan oleh staf tersebut

---

## Phase 10: Overview Dashboard, Polish & Deployment VPS (Minggu 5)
### 10.1 Dashboard Utama (Screen `#dashboard` — `src/routes/index.tsx`)
- [ ] 🔴 4 Top Stat Cards:
  - Total Okupansi Kamar (Persentase & Jumlah Terisi/Total)
  - Total Pendapatan Bulan Berjalan (Rp)
  - Tagihan Menunggu Pembayaran / Overdue (Rp & Jumlah Penyewa)
  - Komplain Fasilitas Aktif
- [ ] 🔴 Trend Arus Kas SVG Chart (Visualisasi garis kurva pendapatan & pengeluaran)
- [ ] 🔴 Conic Gradient / SVG Donut Chart Keterisian Kamar
- [ ] 🔴 Widget **"Perlu Ditagih Hari Ini"** (Daftar penyewa jatuh tempo terdekat dengan tombol quick WhatsApp)
- [ ] 🔴 Widget **"Engagement & Ulang Tahun Mendatang"**
- [ ] 🔴 Widget **"Breakdown Cabang Kos"** (Statistik ringkas per properti)
- [ ] 🔴 Quick Link navigation "Lihat Semua" ke setiap tabel detail

### 10.2 Responsive & Aesthetic Polish (Mengacu pada `DESIGN.md`)
- [ ] 🔴 Audit responsive breakpoints:
  - Desktop (>1050px): 244px fixed sidebar, multi-column grid
  - Tablet (761px - 1050px): 210px sidebar, 2-column stats, stacked panels
  - Mobile (<=760px): Drawer sidebar tersembunyi dengan tombol toggle, 1-column layouts, sticky topbar padding 16px
  - Small Mobile (<=480px): 1-column stat cards, page title 21px
- [ ] 🔴 Menerapkan micro-interactions & hover transitions (150ms-250ms ease)
- [ ] 🔴 Memastikan konsistensi tipografi `Inter` dan kepadatan informasi (*High Information Density*)

### 10.3 Testing, Containerization & VPS Deployment
- [ ] 🔴 Verifikasi `Dockerfile` multi-stage build untuk aplikasi TanStack Start SSR
- [ ] 🔴 Pengujian integrasi lokal Docker Compose (`app`, `db`)
- [ ] 🔴 Validasi alur autentikasi, mutasi data kamar, pengiriman pesan WA Fonnte, dan AI report generation
- [ ] 🔴 Script deployment PM2 / Docker Compose untuk VPS Linux 4GB RAM (Ubuntu 22.04 LTS)
