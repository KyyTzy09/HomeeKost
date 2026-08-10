# Phase 1 Execution Plan & Progress Log: Database Schema & Multi-Role Readiness

Dokumen ini mencatat rencana aksi detail dan *verification log* untuk **Phase 1: Database Schema & Multi-Role Readiness** (`prisma/schema.prisma`).

---

## 1. Action Items Checklist

### Component 1: Environment Variable Check
- [x] Memastikan variabel lingkungan utama menggunakan `.env` (bukan `.env.local`).
- [x] Verifikasi string koneksi PostgreSQL `DATABASE_URL` pada `.env`.

### Component 2: Prisma Schema Definition (`prisma/schema.prisma`)
- [x] Model `Role` (`id`, `name`: `ADMIN` / `TENANT` / `STAFF`, `description`) - *Tabel terpisah untuk fleksibilitas multi-role*.
- [x] Model `User` (`id`, `email`, `passwordHash`, `name`, `roleId` FK -> `Role.id`, `createdAt`, `updatedAt`).
- [x] Model `Room` (`id`, `roomNumber`, `type`, `monthlyPrice`, `facilities`, `status`: `VACANT` / `OCCUPIED` / `MAINTENANCE`).
- [x] Model `Tenant` (`id`, `name`, `whatsappNumber`, `identityCardNumber`, `birthDate` DateTime optional, `status`: `ACTIVE` / `INACTIVE`, `createdAt`).
- [x] Model `RentalContract` (`id`, `tenantId` FK -> `Tenant.id`, `roomId` FK -> `Room.id`, `startDate`, `dueDateDay`, `status`: `ACTIVE` / `TERMINATED`).
- [x] Model `Invoice` (`id`, `invoiceNumber`, `contractId` FK -> `RentalContract.id`, `periodMonth`, `periodYear`, `amount`, `dueDate`, `status`: `PENDING` / `PAID` / `OVERDUE` / `CANCELLED`, `paidAt` optional, `pdfUrl` optional).
- [x] Model `Complaint` (`id`, `roomId` FK -> `Room.id`, `category`: `PLUMBING` / `ELECTRICAL` / `AC` / `FURNITURE` / `OTHER`, `description`, `status`: `PENDING` / `IN_PROGRESS` / `DONE`, `reportedDate`, `resolvedDate` optional).
- [x] Model `Expense` (`id`, `category`: `UTILITIES` / `INTERNET` / `MAINTENANCE` / `SALARY` / `OTHER`, `amount`, `description`, `transactionDate`, `complaintId` FK -> `Complaint.id` optional).
- [x] Model `Announcement` (`id`, `title`, `content`, `category`: `KERJA_BAKTI` / `MAINTENANCE` / `ACARA` / `UMUM`, `createdAt`, `sentAt` optional, `isBroadcast` Boolean).
- [x] Model `AiFinancialReport` (`id`, `periodMonth`, `periodYear`, `totalIncome`, `totalExpense`, `netProfit`, `occupancyRate`, `aiNarrativeSummary` JSON, `pdfFileUrl` optional, `createdAt`).
- [x] Model `NotificationLog` (`id`, `recipientNumber`, `messageType`, `sentAt`, `status`, `notes`).

### Component 3: Database Migration & Seeding (`prisma/seed.ts`)
- [x] Generasi Prisma Client (`npm run db:generate` -> `src/generated/prisma`).
- [x] Pembuatan script seed data awal `prisma/seed.ts`:
  - Roles default: `ADMIN`, `TENANT`, `STAFF`
  - Admin User: `bude.frisda@homeekost.com`
  - 10 Sample Kamar & 2 Sample Penyewa Aktif (Budi Santoso & Siti Rahmawati)

---

## 2. Progress Execution Log

| Date & Time | Task Executed | Result / Status | Notes |
| :--- | :--- | :--- | :--- |
| **10 Aug 2026 22:45** | Switch `.env.local` to `.env` | ✅ Success | Konfigurasi `.env` aktif |
| **10 Aug 2026 22:53** | Complete `prisma/schema.prisma` | ✅ Success | 11 model relasional & enum terdefinisi |
| **10 Aug 2026 22:53** | Create `prisma/seed.ts` | ✅ Success | Script seed Admin, Roles, 10 kamar, & penyewa |
| **10 Aug 2026 22:53** | Execute `npm run db:generate` | ✅ Success | Prisma Client (v7.9.1) terkompilasi di `src/generated/prisma` |

**Status Akhir Phase 1**: 🎉 **COMPLETED (100%)**
