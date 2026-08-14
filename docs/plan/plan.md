# Implementation Master Plan: HomeeKost (Multi-Property)

Dokumen ini adalah **Master Plan Progress Aplikasi** untuk melacak status pelaksanaan, arsitektur, milestone, dan tahapan eksekusi pengembangan **Sistem Pengelolaan Kos Multi-Cabang (HomeeKost)** dari Phase 0 hingga Phase 10 berbasis **Fonnte WhatsApp API**.

---

## 1. Master Progress Dashboard

| Phase | Nama Phase | Target Minggu | Status | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment, Design System & Docker Foundation** | Minggu 1 | ✅ Completed | 100% |
| **Phase 1** | **Database Schema PostgreSQL & Prisma ORM (`ERD.md`)** | Minggu 1 | 🚀 Next Target | 0% |
| **Phase 2** | **Autentikasi RBAC, Session Guard & Master Shell Layout** | Minggu 1 - 2 | ⏳ Pending | 0% |
| **Phase 3** | **Modul Properti Kos (Kost Management — SuperAdmin)** | Minggu 2 | ⏳ Pending | 0% |
| **Phase 4** | **Modul Kamar, Penyewa & Kontrak Sewa** | Minggu 2 - 3 | ⏳ Pending | 0% |
| **Phase 5** | **Modul Keuangan, Arus Kas & Sinkronisasi Komplain** | Minggu 3 | ⏳ Pending | 0% |
| **Phase 6** | **Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp API** | Minggu 3 - 4 | ⏳ Pending | 0% |
| **Phase 7** | **Daily Background Cron & Engagement Hub** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 8** | **AI Financial Intelligence & Laporan Eksekutif Bulanan** | Minggu 4 - 5 | ⏳ Pending | 0% |
| **Phase 9** | **CCTV Stream Monitoring & User Management (SuperAdmin)** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 10**| **Overview Dashboard, Polish & Deployment VPS Linux 4GB** | Minggu 5 | ⏳ Pending | 0% |

---

## 2. Detailed Execution Plan: Phase 1 (Database Schema & Relational Models)

### 2.1 Objectives
Mendefinisikan skema relasional PostgreSQL melalui **Prisma ORM** (`prisma/schema.prisma`) yang selaras 100% dengan `fullstack/docs/ERD.md`, `fullstack/docs/ARCHITECTURE.md`, dan dokumen scope klien:
- `Role`, `User`, `Property`, `UserPropertyAccess`, `CctvDevice`
- `Room`, `Tenant`, `RentalContract`, `Invoice`
- `Transaction` / `Expense`, `Complaint`, `Announcement`, `NotificationLog`, `AiFinancialReport`
- Presisi desimal keuangan (`Decimal(12,2)`)
- Eksekusi migrasi database & seed script (`prisma/seed.ts`).

### 2.2 Detailed Step-by-Step Task Breakdown

#### Task 1.1: Environment & Database Connection
- [x] Verifikasi koneksi PostgreSQL `DATABASE_URL` pada `.env`.
- [x] Konfigurasi provider Prisma dengan adapter postgresql.

#### Task 1.2: Prisma Schema Definition (`prisma/schema.prisma`)
- [ ] Buat model `Role`, `User`, `Property`, `UserPropertyAccess`, `CctvDevice`.
- [ ] Buat model `Room`, `Tenant`, `RentalContract`, `Invoice`.
- [ ] Buat model `Transaction`, `Complaint`, `Announcement`, `NotificationLog`, `AiFinancialReport`.
- [ ] Konfigurasi enum: `RoleName`, `RoomStatus`, `TenantStatus`, `ContractStatus`, `InvoiceStatus`, `TransactionType`, `TransactionCategory`, `ComplaintCategory`, `ComplaintStatus`, `AnnouncementCategory`, `NotificationType`, `NotificationStatus`.

#### Task 1.3: Migration & Seed Execution
- [ ] Eksekusi migrasi database (`prisma migrate dev` / `prisma db push`).
- [ ] Generasi Prisma Client (`npm run db:generate` -> `src/generated/prisma`).
- [ ] Pembuatan script `prisma/seed.ts` untuk seed data awal multi-property, kamar, penyewa, dan transaksi.

---

## 3. Next Handoff Steps
Setelah Phase 1 selesai, eksekusi akan dilanjutkan ke **Phase 2: Autentikasi RBAC, Session Guard & Master Shell Layout** (`Better-Auth`, `Sidebar.tsx`, `Topbar.tsx`, `MasterShell.tsx`, `KostManagement.html` UI replica).
