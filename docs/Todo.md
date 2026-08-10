# Todo Fullstack - Sistem Pengelolaan Kos Bude Frisda (HomeeKost)

Sistem Pengelolaan Kos Bude Frisda (*HomeeKost*) — Monolith Server-Side Rendering (SSR) berbasis **TanStack Start + Vite + React 19 + Tailwind CSS v4 + Prisma + PostgreSQL + OpenWA Gateway (`rmyndharis/OpenWA`)**.

## Legend
- 🔴 P0 Critical path, MVP blocker
- 🟡 P1 High value, not MVP blocker
- 🟢 P2 Nice to have
- 🔵 P3 Future

---

## Phase 0: Environment, Design System & Docker Foundation (Minggu 1)
### 0.1 Environment Variables & Config
- [x] 🔴 Verifikasi & audit file konfigurasi project: `package.json`, `vite.config.ts`, `tsr.config.json`, `biome.json`, dan `tsconfig.json`
- [x] 🔴 Buat file `.env.example` dan `.env.local` dengan environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPEN_WA_API_URL`, `OPEN_WA_API_KEY`, `OPEN_WA_SESSION_ID`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `APP_URL`
- [x] 🔴 Setup Docker Compose file (`docker-compose.yml`) untuk 3 kontainer: App (TanStack Start), Database (PostgreSQL 16), dan WA Gateway (`ghcr.io/rmyndharis/openwa:latest`, port 2785)

### 0.2 Design System & Styling Setup (Sesuai `Design.md` & `HomeeKost_Dashboard_v2(1).html`)
- [x] 🔴 Buat dokumen spesifikasi desain `Design.md` dan salinannya di `docs/Design.md`
- [x] 🔴 Konfigurasi variabel warna khas HomeeKost dan utility CSS di `src/styles.css`:
  - `--sage`: `#718b78` | `--sage-dark`: `#4f6958` | `--sage-light`: `#e8f0ea` | `--sage-pale`: `#f3f7f3`
  - `--cream`: `#faf9f5` | `--white`: `#ffffff` | `--text`: `#252925` | `--muted`: `#737873`
  - `--border`: `#e4e9e4` | `--green`: `#5f896d` | `--amber`: `#b18a4b` | `--red`: `#b66b68`
  - `--shadow`: `0 2px 12px rgba(48, 65, 53, 0.055)`
- [x] 🔴 Import Google Font `Inter` pada `src/routes/__root.tsx` dan pastikan kelas komponen (`.hk-btn`, `.hk-card`, `.hk-badge`, `.ai-insight-box`) terpakai konsisten

---

## Phase 1: Database Schema & Multi-Role Readiness (Minggu 1)
### 1.1 PostgreSQL & Prisma Setup
- [ ] 🔴 Verifikasi koneksi PostgreSQL dengan `@prisma/adapter-pg` pada `.env.local`
- [ ] 🔴 Eksekusi migrasi database awal (`npm run db:migrate` / `npm run db:push`)

### 1.2 Schema Models Definition (`prisma/schema.prisma`)
- [ ] 🔴 Model `Role` (`id`, `name`: `ADMIN` / `TENANT` / `STAFF`, `description`) - *Tabel terpisah untuk kesiapan multi-role masa depan*
- [ ] 🔴 Model `User` (`id`, `email`, `passwordHash`, `name`, `createdAt`)
- [ ] 🔴 Model `UserRole` (`userId`, `roleId`) - *Jembatan relasi User ke Role*
- [ ] 🔴 Model `Room` (`id`, `roomNumber`, `type`, `monthlyPrice`, `facilities`, `status`: `VACANT` / `OCCUPIED` / `MAINTENANCE`)
- [ ] 🔴 Model `Tenant` (`id`, `name`, `whatsappNumber`, `identityCardNumber`, `birthDate` DateTime optional, `status`: `ACTIVE` / `INACTIVE`, `createdAt`)
- [ ] 🔴 Model `RentalContract` (`id`, `tenantId`, `roomId`, `startDate`, `dueDateDay`, `status`: `ACTIVE` / `TERMINATED`)
- [ ] 🔴 Model `Invoice` (`id`, `invoiceNumber`, `contractId`, `periodMonth`, `periodYear`, `amount`, `dueDate`, `status`: `PENDING` / `PAID` / `OVERDUE` / `CANCELLED`, `paidAt`, `pdfUrl`)
- [ ] 🔴 Model `Complaint` (`id`, `roomId`, `category`: `PLUMBING` / `ELECTRICAL` / `AC` / `FURNITURE` / `OTHER`, `description`, `status`: `PENDING` / `IN_PROGRESS` / `DONE`, `reportedDate`, `resolvedDate`)
- [ ] 🔴 Model `Expense` (`id`, `category`: `UTILITIES` / `INTERNET` / `MAINTENANCE` / `SALARY` / `OTHER`, `amount`, `description`, `transactionDate`, `complaintId` optional)
- [ ] 🔴 Model `Announcement` (`id`, `title`, `content`, `category`: `KERJA_BAKTI` / `MAINTENANCE` / `ACARA` / `UMUM`, `createdAt`, `sentAt` optional, `isBroadcast` Boolean)
- [ ] 🔴 Model `AiFinancialReport` (`id`, `periodMonth`, `periodYear`, `totalIncome`, `totalExpense`, `netProfit`, `occupancyRate`, `aiNarrativeSummary` JSON, `pdfFileUrl`, `createdAt`)
- [ ] 🔴 Model `NotificationLog` (`id`, `recipientNumber`, `messageType`, `sentAt`, `status`, `notes`)

### 1.3 Seed Data (`prisma/seed.ts`)
- [ ] 🟡 Buat script `db:seed` untuk mengisi tabel `Role` (`ADMIN`, `TENANT`), akun Admin Bude Frisda, serta 10 kamar & penyewa awal

---

## Phase 2: Admin Auth & Master Shell Layout (Minggu 1 - 2)
### 2.1 Admin Authentication System (Better-Auth)
- [ ] 🔴 Setup Better-Auth provider di `src/lib/auth.ts`
- [ ] 🔴 Form `POST /api/auth/login` (Admin Single-Role session cookie)
- [ ] 🔴 Protected Route Middleware untuk memproteksi dashboard

### 2.2 Layout Shell Aplikasi (Persis Design System `Design.md`)
- [ ] 🔴 Komponen `Sidebar.tsx`: Logo HomeeKost, Menu Navigasi dengan Active Indicator, Profile Mini & Logout
- [ ] 🔴 Komponen `Topbar.tsx`: Breadcrumb dinamis, Global Search, Button aksi cepat
- [ ] 🔴 Main Layout Container (`.main-content` & `.content-body`)

---

## Phase 3: Epic 1 - Data Kamar, Penyewa & Engagement Engine (Minggu 2)
### 3.1 Server Functions (Kamar, Penyewa & Announcement)
- [ ] 🔴 `src/server/rooms.ts`: CRUD data kamar & update status
- [ ] 🔴 `src/server/tenants.ts`: CRUD penyewa (termasuk input `birthDate`) & sewa kamar
- [ ] 🔴 `src/server/announcements.ts`: Simpan & kirim pengumuman kos

### 3.2 Halaman Kamar (`src/routes/kamar/index.tsx`)
- [ ] 🔴 Grid Room Cards (`.room-card`) & filter status (Semua, Kosong, Terisi, Perbaikan)

### 3.3 Halaman Penyewa & Engagement UI (`src/routes/penyewa/index.tsx`)
- [ ] 🔴 Tabel Data Penyewa (Nama, Kamar, WA `628xxx`, No KTP, Tanggal Lahir, Jatuh Tempo, Status)
- [ ] 🔴 Modal Form Tenant (Auto-format WA `628...`, input tanggal lahir, auto-assign kamar)
- [ ] 🟡 Tab / Modal **"Pengumuman Kos Sederhana"**: Form buat pengumuman (Info kerja bakti, acara, perbaikan) & tombol Broadcast via OpenWA

---

## Phase 4: Epic 2 - OpenWA Gateway (`rmyndharis/OpenWA`) & Invoice Engine (Minggu 3)
### 4.1 OpenWA Integration Service
- [ ] 🔴 Setup OpenWA Client Helper di `src/lib/open-wa-client.ts`:
  - Check status sesi: `GET http://open-wa:2785/api/sessions/{sessionId}`
  - Dapatkan QR Code jika belum diautentikasi: `GET http://open-wa:2785/api/sessions/{sessionId}/qr`
  - Function `sendTextMessage(to: string, message: string)` memanggil REST API `POST http://open-wa:2785/api/sessions/{sessionId}/messages/send-text` dengan header `X-API-Key` dan payload `{"chatId": "628xxx@c.us", "text": message}`

### 4.2 Invoice PDF & WhatsApp Dispatcher (`src/routes/invoice/index.tsx`)
- [ ] 🔴 Invoice Split View Layout (Daftar Invoice di kiri, Live PDF preview di kanan)
- [ ] 🔴 Action Button **"Kirim WA Invoice (Automated via OpenWA REST API)"**:
  - Pemicu pengiriman pesan & link invoice otomatis ke WhatsApp penyewa via OpenWA `POST /api/sessions/{sessionId}/messages/send-text`
- [ ] 🟡 Action Button **"Kirim WA (Manual Redirect `wa.me/`)"** sebagai opsi cadangan (fallback)
- [ ] 🔴 Action **"Konfirmasi Pembayaran Manual"** (*Verify Paid*) -> Catat otomatis ke Pemasukan

---

## Phase 5: Epic 3 - Daily Cron & Automated Reminders (Minggu 4)
### 5.1 Daily Cron Scheduler (08:00 WIB)
- [ ] 🔴 Endpoint `/api/cron/daily-tasks`:
  - **Pemeriksaan Tanggal Jatuh Tempo**: Kueri sewa H-3, H-0, H+1 Overdue -> Auto-update status `OVERDUE` -> Kirim WA reminder otomatis via OpenWA REST API `send-text`
  - **Pengingat Ulang Tahun (Birthday Reminder)**: Kueri penyewa aktif yang ulang tahun hari ini -> Kirim ucapan ulang tahun otomatis via OpenWA REST API `send-text`
  - Simpan catatan pengiriman ke `NotificationLog`

### 5.2 Dashboard Widget Integration
- [ ] 🔴 Widget Dashboard **"Perlu Ditagih Hari Ini & Ulang Tahun Hari Ini"** dengan tombol trigger pesan WhatsApp manual/otomatis

---

## Phase 6: Epic 4 - Pencatatan Komplain & Sync Biaya Perbaikan (Minggu 4)
### 6.1 Halaman Komplain (`src/routes/komplain/index.tsx`)
- [ ] 🔴 Tabel Log Komplain: Kategori (AC, Listrik, Plumbing, Furniture, Lainnya), Status (`PENDING`, `IN_PROGRESS`, `DONE`), Tanggal Lapor
- [ ] 🔴 Form Input Komplain Manual oleh Admin

### 6.2 Integrasi Biaya Perbaikan
- [ ] 🔴 Logic Update Status -> `DONE`: Input Biaya Perbaikan (Rp) -> Otomatis mencatat record baru di tabel `Expense` (Kategori: *Maintenance & Repairs*)

---

## Phase 7: Epic 5 - Arus Kas & Monthly AI Insight (Minggu 5)
### 7.1 Pencatatan Arus Kas & Financial Math
- [ ] 🔴 Form Input Pemasukan & Pengeluaran Kas
- [ ] 🔴 Kalkulasi Matematika PostgreSQL: Total Income, Total Expense, Net Profit, Occupancy Rate (%)

### 7.2 AI Service Layer (Gemini / Groq LLM API)
- [ ] 🔴 Setup SDK / HTTP Client di `src/lib/ai-client.ts` dengan Zod Structured Output (`executiveSummary`, `trendAnalysis`, `complaintFinancialImpact`, `strategicRecommendations`)
- [ ] 🔴 System Prompt Engineering: AI fokus pada analisis naratif dan rekomendasi taktis tanpa mengkalkulasi ulang angka DB
- [ ] 🔴 Static Template Fallback jika AI API timeout

### 7.3 Monthly Cron & Executive PDF Report
- [ ] 🔴 Endpoint `/api/cron/monthly-ai-report` (Setiap Tanggal 1 Jam 00:01 WIB) -> Generate PDF Laporan Keuangan Eksekutif Bulanan
- [ ] 🔴 Tampilan Card AI Insight (`.ai-insight-box`) & Tombol Download PDF Laporan di `src/routes/laporan/index.tsx`

---

## Phase 8: Overview Dashboard & Aesthetics Polish (Minggu 5)
### 8.1 Dashboard Utama (`src/routes/index.tsx`)
- [ ] 🔴 4 Top Stat Cards: Okupansi Kamar, Total Pendapatan, Tagihan Pending, Perbaikan Aktif
- [ ] 🔴 Trend Pemasukan/Pengeluaran SVG Chart & Conic Gradient Donut Chart Okupansi
- [ ] 🔴 Activity Stream & Attention List Widgets

---

## Phase 9: Deployment via Docker Compose ke VPS (4GB RAM) (Minggu 5)
### 9.1 Containerization & Testing
- [ ] 🔴 Buat `Dockerfile` untuk aplikasi TanStack Start Monolith
- [ ] 🔴 Verifikasi file `docker-compose.yml` (App, PostgreSQL 16, OpenWA `ghcr.io/rmyndharis/openwa:latest`)
- [ ] 🔴 Menjalankan & verifikasi pengujian end-to-end pada lingkungan Docker lokal
- [ ] 🔴 Script deployment PM2 / Docker Compose di VPS Linux 4GB RAM (2 vCPU, 60GB SSD)
