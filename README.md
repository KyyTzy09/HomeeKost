# 🌿 HomeeKost — Multi-Property Kost Management Platform

**HomeeKost** adalah platform manajemen operasional kos-kosan multi-cabang (*Multi-Property Management*) modern yang dirancang khusus untuk pemilik kos (**SuperAdmin / Owner**) dan staf pengelola cabang (**Admin / Branch Manager**).

Sistem dibangun menggunakan arsitektur **Type-Safe Fullstack SSR Monolith** berbasis **TanStack Start + React 19 + Tailwind CSS v4 + Prisma ORM + PostgreSQL 16 + Better-Auth + Fonnte WhatsApp Gateway + Google Gemini / Groq AI**.

---

## 📑 Daftar Isi
1. [Ruang Lingkup & Fitur Utama (Scope)](#-ruang-lingkup--fitur-utama-scope)
2. [Tech Stack](#-tech-stack)
3. [Prasyarat Sistem (Prerequisites)](#-prasyarat-sistem-prerequisites)
4. [Panduan Instalasi & Setup Cepat](#-panduan-instalasi--setup-cepat)
5. [Akun Demo Default (Seeding Data)](#-akun-demo-default-seeding-data)
6. [Struktur Direktori & Cara Membaca Codebase](#-struktur-direktori--cara-membaca-codebase)
7. [Alur Arsitektur & Aliran Data (Data Flow)](#-alur-arsitektur--aliran-data-data-flow)
8. [Daftar Perintah CLI (Cheatsheet)](#-daftar-perintah-cli-cheatsheet)
9. [Dokumentasi Lengkap Proyek](#-dokumentasi-lengkap-proyek)

---

## 🎯 Ruang Lingkup & Fitur Utama (Scope)

### 1. Multi-Property Isolation (Isolasi Cabang Kos Mutlak)
- Pengelolaan banyak cabang kos dalam satu dashboard terpadu.
- **SuperAdmin**: Akses penuh seluruh cabang kos, switcher cabang global, konsolidasi laporan, dan manajemen pengguna.
- **Admin Cabang**: Akses data terisolasi ketat hanya pada cabang kos yang ditugaskan (*assigned property*).

### 2. Single-Role Web Dashboard (Zero Friction for Tenants)
- Antarmuka web dioptimalkan khusus untuk pengelola operasional.
- Anak kos **tidak perlu membuat akun atau login web**. Seluruh interaksi penagihan, kwitansi, invoice resmi A4, dan pengumuman dikirimkan langsung ke **WhatsApp** penyewa.

### 3. Manajemen Kamar, Penghuni & Siklus Sewa Fleksibel
- Grid visual status kamar (*Terisi, Kosong, Maintenance*) dengan filter tipe & harga.
- Manajemen kontrak sewa dengan siklus fleksibel: **Bulanan, Triwulan (3 Bulan), Semesteran (6 Bulan), dan Tahunan (12 Bulan)**.
- **Amortisasi Sewa Prabayar**: Pembayaran multi-bulan di muka otomatis dialokasikan per bulan pada invoice dan laporan agar tidak ada bulan yang kosong (*roller coaster revenue*).

### 4. Penagihan & Invoice Digital Otomatis (WhatsApp Gateway)
- Mesin render PDF Invoice & Kwitansi resmi berstempel lunas (ukuran A4 presisi).
- Integrasi **WhatsApp Gateway (Fonnte API)** untuk pengiriman tagihan baru, pengingat jatuh tempo H-3, peringatan overdue, dan bukti pembayaran instan.
- **Background Cron Engine**: Otomasi pembuatan invoice periode baru dan notifikasi berkala.

### 5. Kas Keuangan, Biaya Bersama & Laporan
- Pencatatan pemasukan & pengeluaran kas dengan klasifikasi Operasional vs Investasi.
- **Fitur Biaya Bersama (*Shared Cost Allocation*)**: Pembagian beban fixed cost (seperti WiFi, sampah, gaji penjaga) ke beberapa cabang kos secara proporsional.
- Sinkronisasi otomatis biaya komplain perbaikan fasilitas kamar ke buku kas.

### 6. AI Financial Intelligence & Matriks Tahunan 12 Bulan
- Analisis finansial eksekutif bulanan dengan kalkulasi angka deterministik PostgreSQL.
- Narasi wawasan bisnis, tren MoM, evaluasi beban operasional, dan rekomendasi strategis oleh **LLM (Gemini 2.0 / Groq Llama 3)** dengan *fallback engine* deterministik lokal.
- **Ekspor CSV Matriks 12 Bulan**: Laporan terstruktur Jan–Des per cabang kos dengan encoding **UTF-8 BOM** (langsung rapi di Excel).

### 7. Engagement Hub & Notifikasi Navbar Real-Time
- Pengingat ulang tahun penghuni kos dalam 7–30 hari ke depan dengan tombol kirim ucapan personal via WhatsApp.
- Broadcast pengumuman kos per cabang atau ke seluruh penghuni aktif.
- **Global Search Navbar**: Pencarian instan lintas entitas (penghuni, kamar, invoice, transaksi kas, properti).
- **Topbar Live Notifications**: Lonceng notifikasi tagihan overdue, ultah dekat, komplain fasilitas, dan pembayaran masuk.

---

## 🛠 Tech Stack

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework Fullstack** | [TanStack Start (SSR)](https://tanstack.com/start) | Server-Side Rendering modern berbasis Nitro engine |
| **Routing** | [TanStack Router](https://tanstack.com/router) | 100% Type-Safe File-Based Routing |
| **UI Library** | React 19 + Tailwind CSS v4 | Kustom token warna *Sage & Cream* |
| **State & Data Fetching**| [TanStack Query v5](https://tanstack.com/query) | Async state caching, optimistic updates |
| **Tabel & Data Grid** | [TanStack Table v8](https://tanstack.com/table) | Filtering, sorting, pagination headless |
| **Autentikasi & RBAC** | [Better-Auth](https://www.better-auth.com) | Session cookie HttpOnly & Role-Based Access Control |
| **Database & ORM** | PostgreSQL 16 + [Prisma ORM v7](https://www.prisma.io) | Presisi moneter `Decimal(12,2)` |
| **WhatsApp Gateway** | [Fonnte API](https://fonnte.com) | WhatsApp automation & notification logs |
| **AI LLM Engine** | Google Gemini API / Groq Cloud | Structured JSON insights & executive narrative |
| **PDF Generation** | `pdf-lib` | Dokumen faktur & kwitansi sewa A4 |
| **Linter & Formatter** | [Biome](https://biomejs.dev) | Linter & code formatting ultra-cepat |

---

## 📦 Prasyarat Sistem (Prerequisites)

Sebelum memulai, pastikan perangkat Anda telah terpasang:
1. **Node.js**: Versi **`>= 22.0.0`** (LTS) atau **Bun** (`>= 1.1.0`).
2. **PostgreSQL**: Versi **`16`** (Lokal atau via Docker).
3. **Git**: Untuk clone repositori.
4. **Fonnte API Token** *(Opsional untuk live WhatsApp)*: Dapatkan token di [fonnte.com](https://fonnte.com).
5. **Gemini / Groq API Key** *(Opsional untuk live AI)*: Dapatkan di [Google AI Studio](https://aistudio.google.com) atau [Groq Console](https://console.groq.com).

---

## 🚀 Panduan Instalasi & Setup Cepat

Ikuti langkah-langkah berikut secara berurutan:

### Langkah 1: Masuk ke Direktori Project Fullstack
```bash
cd fullstack
```

### Langkah 2: Konfigurasi Environment Variables (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
# Di Windows PowerShell:
cp .env.example .env

# Di Linux / macOS:
cp .env.example .env
```

Buka file `.env` dan sesuaikan nilainya:
```env
# Koneksi Database PostgreSQL
DATABASE_URL="postgresql://postgres:secret@localhost:5432/homeekost?schema=public"

# Konfigurasi Autentikasi Better-Auth
BETTER_AUTH_SECRET="homeekost-secret-key-minimal-32-karakter-bebas"
BETTER_AUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"

# WhatsApp Gateway Provider (Fonnte)
FONNTE_TOKEN="isi_token_fonnte_anda"

# AI Integration (Opsional, ada fallback lokal jika kosong)
GEMINI_API_KEY=""
GROQ_API_KEY=""

# Cloud Storage (Opsional)
STORAGE_DRIVER="local"
```

### Langkah 3: Install Dependencies
```bash
npm install
```

### Langkah 4: Siapkan Database PostgreSQL
Jika Anda menggunakan **Docker**, Anda dapat menjalankan PostgreSQL langsung dari root:
```bash
# Dari direktori root kosan_app
docker compose up -d postgres
```
Atau jika menggunakan PostgreSQL lokal, pastikan service PostgreSQL aktif dan database `homeekost` sudah dibuat.

### Langkah 5: Jalankan Migrasi & Generate Prisma Client
Sinkronisasikan skema Prisma ke PostgreSQL dan generate TypeScript Client:
```bash
# Opsi A: Push skema langsung (Rekomendasi untuk dev cepat)
npm run db:push

# Opsi B: Menggunakan Prisma Migration resmi
npm run db:migrate
```

### Langkah 6: Jalankan Database Seeding (Data Dummy Realistis)
Isi database dengan data awal (Role, Akun Admin, 2 Cabang Properti, Kamar, Penyewa, Kontrak, Mutasi Kas, dan Komplain):
```bash
npm run db:seed
```

### Langkah 7: Jalankan Server Development
```bash
npm run dev
```
Buka browser Anda di **`http://localhost:3000`**.

---

## 🔑 Akun Demo Default (Seeding Data)

Setelah menjalankan `npm run db:seed`, Anda dapat langsung login dengan akun berikut:

| Role | Email | Password | Hak Akses & Cabang |
| :--- | :--- | :--- | :--- |
| **SuperAdmin (Owner)** | `owner@homeekost.com` | `admin123` | **Akses Penuh**: Seluruh Cabang Kos, User Management, Global Switcher, & AI Insight. |
| **Admin Staf (Cabang)** | `admin.melati@homeekost.com` | `admin123` | **Akses Terisolasi**: Khusus mengelola Cabang Melati saja. |

---

## 📂 Struktur Direktori & Cara Membaca Codebase

Arsitektur kode diatur dengan pola **Clean Layered Architecture** yang modular:

```text
fullstack/
├── prisma/
│   ├── schema.prisma              # Definisi model data PostgreSQL (ERD)
│   └── seed.ts                    # Script seeding data realistis
│
├── src/
│   ├── ai/                        # AI Engine (Gemini, Groq, Rule-based Fallback)
│   │   ├── gemini.service.ts
│   │   ├── groq.service.ts
│   │   └── fallback.service.ts
│   │
│   ├── common/                    # Shared Types, DTOs & Skema Validasi
│   │   ├── types/                 # TypeScript interfaces per modul
│   │   └── validations/           # Skema Zod untuk form & input validasi
│   │
│   ├── components/                # Komponen UI React 19 (Sage & Cream)
│   │   ├── layout/                # Sidebar, Topbar, Shell Navigation
│   │   ├── dashboard/             # Widget statistik overview & charts
│   │   ├── property/              # Card cabang kos, detail & dialog
│   │   ├── room/                  # Grid kamar, status badge, form kamar
│   │   ├── tenant/                # Tabel penghuni, dialog onboarding
│   │   ├── payment/               # Tabel tagihan, status filter, settlement
│   │   ├── invoice/               # Invoice preview, PDF engine modal
│   │   ├── finance/               # Kas pemasukan/pengeluaran, biaya bersama
│   │   ├── engagement/            # Ultah penghuni, template pesan WhatsApp
│   │   ├── report/                # AI insight panel, matriks 12 bulan
│   │   ├── user/                  # User management table, audit trail log
│   │   └── ui/                    # Reusable primitives (Button, Dialog, Select, etc.)
│   │
│   ├── data/                      # Backend Data Access & Business Logic
│   │   ├── repositories/          # Layer akses database Prisma ORM murni
│   │   ├── services/              # Layer logika bisnis & validasi aturan
│   │   └── servers/               # TanStack Start Server Functions (*.fn.ts)
│   │
│   ├── hooks/                     # TanStack Query React Custom Hooks
│   ├── lib/                       # Utility helpers (Auth, Currency, Phone, PDF, Date, CSV)
│   │
│   ├── routes/                    # File-Based Routing TanStack Router
│   │   ├── __root.tsx             # Root layout & Google Font Inter
│   │   ├── index.tsx              # Landing / Redirection
│   │   ├── login.tsx              # Halaman Login Authentication
│   │   └── dashboard/             # Protected Routes (/dashboard/*)
│   │       ├── index.tsx          # Overview Dashboard Utama
│   │       ├── select-property.tsx# Pemilihan Properti Aktif
│   │       ├── properties.$propertyId.tsx # Detail Cabang Kos
│   │       ├── rooms.tsx          # Manajemen Kamar
│   │       ├── tenants.tsx        # Manajemen Penghuni
│   │       ├── payments.tsx       # Monitoring Pembayaran Sewa
│   │       ├── invoices.tsx       # Invoice Digital & Cetak PDF
│   │       ├── finance.tsx        # Arus Kas & Biaya Bersama
│   │       ├── engagement.tsx     # Engagement Hub & Cron WhatsApp
│   │       ├── cctv.tsx           # Pemantauan CCTV Stream
│   │       ├── reports.tsx        # Laporan Eksekutif & AI Insight
│   │       ├── users.tsx          # User Management (SuperAdmin)
│   │       └── profile.tsx        # Pengaturan Akun & Keamanan
│   │
│   ├── styles.css                 # Master CSS & Token Warna Sage & Cream
│   └── db.ts                      # Singleton Prisma Client Adapter
│
├── docs/                          # Dokumentasi Spesifikasi & Panduan
│   ├── PRD.md                     # Product Requirements Document
│   ├── ERD.md                     # Entity Relationship Diagram & Schema
│   ├── ARCHITECTURE.md            # System Architecture Blueprint
│   ├── DESIGN.md                  # Master Design Tokens & Palette
│   └── Todo.md                    # Roadmap & Development Checklist
│
├── docker-compose.yml             # Kontainerisasi 2-Tier (App + DB)
├── Dockerfile                     # Multi-stage production build Nitro SSR
├── package.json                   # Dependencies & script runner
└── tsconfig.json                  # Konfigurasi TypeScript Strict Mode
```

---

## 🔄 Alur Arsitektur & Aliran Data (Data Flow)

Aplikasi mengikuti aliran data **Type-Safe End-to-End**:

```
[ Browser Client UI ]
        │
        ▼ (Menggunakan TanStack Query Hook di src/hooks/)
[ TanStack Query Hook ]
        │
        ▼ (Memanggil Server Function via RPC Type-Safe)
[ Server Function (src/data/servers/*.fn.ts) ]
        │  (Validasi Sesi Better-Auth & Role RBAC Guard)
        ▼
[ Service Layer (src/data/services/*.service.ts) ]
        │  (Logika Bisnis, Amortisasi Invoice, Format WhatsApp/AI)
        ▼
[ Repository Layer (src/data/repositories/*.repo.ts) ]
        │  (Kueri Prisma Client dengan isolasi propertyId)
        ▼
[ PostgreSQL Database 16 ]
```

---

## ⚡ Daftar Perintah CLI (Cheatsheet)

### 1. Operasi Server
```bash
# Menjalankan server development (Port 3000)
npm run dev

# Membangun bundle produksi (Production Build)
npm run build

# Menjalankan hasil build produksi lokal
npm run preview
```

### 2. Operasi Database & Prisma
```bash
# Sinkronisasi skema ke database tanpa membuat file migrasi
npm run db:push

# Membuat dan menerapkan file migrasi Prisma
npm run db:migrate

# Generate ulang TypeScript Prisma Client
npm run db:generate

# Menjalankan seeding data awal
npm run db:seed

# Membuka Prisma Studio GUI (Web visual database di localhost:5555)
npm run db:studio
```

### 3. Kualitas Kode, Linter & Type Check
```bash
# Pemeriksaan tipe data TypeScript (wajib 0 error)
npx tsc --noEmit

# Jalankan linter dan formatter Biome
npm run check

# Format otomatis file kode
npm run format
```

---

## 📚 Dokumentasi Lengkap Proyek

Untuk rujukan teknis mendalam, silakan baca dokumen pendukung berikut:
- 📄 [PRD.md](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/docs/PRD.md) — Problem statement, persona pengguna, dan fitur MVP.
- 🗄️ [ERD.md](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/docs/ERD.md) — Struktur relasi tabel database & tipe field.
- 🏛️ [ARCHITECTURE.md](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/docs/ARCHITECTURE.md) — Arsitektur sistem SSR, security, dan sequence diagram.
- 🎨 [DESIGN.md](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/docs/DESIGN.md) — Panduan desain token palet Sage Green & Cream.
- ✅ [Todo.md](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/docs/Todo.md) — Checklist progres pengembangan bertahap dari Phase 0 hingga Phase 10.
- 🤖 [AGENTS.md](file:///D:/Coding%20Mandiri/client/kosan_app/AGENTS.md) — Panduan dan batasan operasional AI Agent.

---

**HomeeKost** — *Sistem Manajemen Kos Modern, Tenang, Bersih, dan Presisi.* 🏠🌿
