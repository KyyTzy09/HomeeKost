# Implementation Master Plan: HomeeKost

Dokumen ini adalah **Master Plan Progress Aplikasi** untuk melacak status pelaksanaan, arsitektur, milestone, dan tahapan eksekusi pengembanan **Sistem Pengelolaan Kos Bude Frisda (HomeeKost)** dari Phase 0 hingga Phase 10.

---

## 1. Master Progress Dashboard

| Phase | Nama Phase | Target Minggu | Status | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment, Design System & Docker Foundation** | Minggu 1 | ✅ Completed | 100% |
| **Phase 1** | **Database Schema & Multi-Role Readiness** | Minggu 1 | ✅ Completed | 100% |
| **Phase 2** | **Admin Auth & Master Shell Layout** | Minggu 1 - 2 | 🚀 Next Target | 0% |
| **Phase 3** | **Epic 1 - Data Kamar, Penyewa & Engagement UI** | Minggu 2 | ⏳ Pending | 0% |
| **Phase 4** | **Epic 2 - OpenWA Gateway & Invoice Engine** | Minggu 3 | ⏳ Pending | 0% |
| **Phase 5** | **Epic 3 - Daily Cron & Automated Reminders** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 6** | **Epic 4 - Log Komplain & Sync Biaya Perbaikan** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 7** | **Epic 5 - Arus Kas & Monthly AI Financial Insight** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 8** | **Overview Dashboard & Micro-Interactions Polish** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 9** | **Docker Compose Containerization & Testing** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 10**| **Deployment ke VPS Linux 4GB RAM & Handover** | Minggu 5 | ⏳ Pending | 0% |

---

## 2. Detailed Execution Plan: Phase 1 (Database Schema & Multi-Role Readiness)

### 2.1 Objectives
Mendefinisikan skema relasional PostgreSQL melalui **Prisma ORM** (`prisma/schema.prisma`) dengan tabel `Role` terpisah, `User`, `Room`, `Tenant` (termasuk `birthDate`), `RentalContract`, `Invoice`, `Complaint`, `Expense`, `Announcement`, `AiFinancialReport`, dan `NotificationLog`. Melakukan migrasi database dan pengisian seed data awal (`prisma/seed.ts`).

### 2.2 Detailed Step-by-Step Task Breakdown

#### Task 1.1: Environment File Verification
- [x] Memastikan variabel lingkungan utama menggunakan `.env` (bukan `.env.local`).
- [x] Verifikasi koneksi PostgreSQL `DATABASE_URL` pada `.env`.

#### Task 1.2: Prisma Schema Definition (`prisma/schema.prisma`)
- [x] Buat model `Role`, `User`, `Room`, `Tenant`, `RentalContract`, `Invoice`, `Complaint`, `Expense`, `Announcement`, `AiFinancialReport`, `NotificationLog`.
- [x] Konfigurasi relasi foreign keys dan enums (`VACANT`/`OCCUPIED`/`MAINTENANCE`, `PENDING`/`PAID`/`OVERDUE`, dll).

#### Task 1.3: Migration & Seed Execution
- [x] Generasi Prisma Client (`npm run db:generate` -> `src/generated/prisma`).
- [x] Pembuatan script `prisma/seed.ts` untuk seed data awal Bude Frisda & kamar kos.

---

## 3. Next Handoff Steps
Phase 1 telah diselesaikan **100%**. Eksekusi selanjutnya siap dilanjutkan ke **Phase 2: Admin Auth & Master Shell Layout** (`Better-Auth`, `Sidebar.tsx`, `Topbar.tsx`).
