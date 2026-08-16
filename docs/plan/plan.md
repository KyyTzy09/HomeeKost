# Implementation Master Plan: HomeeKost (Multi-Property)

Dokumen ini adalah **Master Plan Progress Aplikasi** untuk melacak status pelaksanaan, arsitektur, milestone, dan tahapan eksekusi pengembangan **Sistem Pengelolaan Kos Multi-Cabang (HomeeKost)** dari Phase 0 hingga Phase 10 berbasis **Fonnte WhatsApp API**.

---

## 1. Master Progress Dashboard

| Phase | Nama Phase | Target Minggu | Status | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment, Design System & Docker Foundation** | Minggu 1 | ✅ Completed | 100% |
| **Phase 1** | **Database Schema PostgreSQL & Prisma ORM (`ERD.md`)** | Minggu 1 | ✅ Completed | 100% |
| **Phase 2** | **Autentikasi RBAC, Session Guard & Master Shell Layout** | Minggu 1 - 2 | ✅ Completed | 100% |
| **Phase 3** | **Modul Properti Kos (Kost Management — SuperAdmin)** | Minggu 2 | ✅ Completed | 100% |
| **Phase 4** | **Modul Kamar, Penyewa & Kontrak Sewa** | Minggu 2 - 3 | ✅ Completed | 100% |
| **Phase 5** | **Modul Keuangan, Arus Kas & Sinkronisasi Komplain** | Minggu 3 | ✅ Completed | 100% |
| **Phase 6** | **Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp API** | Minggu 3 - 4 | 🚀 Next Target | 0% |
| **Phase 7** | **Daily Background Cron & Engagement Hub** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 8** | **AI Financial Intelligence & Laporan Eksekutif Bulanan** | Minggu 4 - 5 | ⏳ Pending | 0% |
| **Phase 9** | **CCTV Stream Monitoring & User Management (SuperAdmin)** | Minggu 5 | 🔄 In Progress | 50% |
| **Phase 10**| **Overview Dashboard, Polish & Deployment VPS Linux 4GB** | Minggu 5 | ⏳ Pending | 0% |

---

## 2. Execution Log: Phase 5 (Modul Keuangan, Arus Kas & Sinkronisasi Komplain)

### 2.1 Objectives
Mengimplementasikan modul arus kas harian dan ringkasan finansial multi-cabang kos:
- Data layer `TransactionRepository` (`findMany`, `aggregate`, `groupByCategory`, `findForAnnualMatrix`) dengan presisi `Decimal(12,2)`
- Service layer `CashflowService` (CRUD, validasi isolasi properti, RBAC governance, ringkasan kas bulanan MoM, kalkulasi P&L, matriks tahunan 12 bulan, dan generator CSV)
- Server Functions `transaction.fn.ts` & TanStack Query hooks `use-transactions.ts`
- UI Components: `FinanceTransactionTable`, `FinanceFormDialog`, `TransactionDetailDialog`, `FinanceProfitLossTable`, `FinanceNetProfitChart`, `FinanceCostComposition`
- Integrasi rute `/dashboard/finance` dengan pencarian instan, filter kategori/tipe, sorting dinamis, paginasi, dan ekspor CSV tahunan.

### 2.2 Decision Log
- **D1**: Transaksi wajib terikat ke 1 cabang kos spesifik (`propertyId`).
- **D2**: Alur komplain/perbaikan fasilitas dicatat langsung di web sebagai `EXPENSE` kategori `MAINTENANCE`.
- **D3**: SuperAdmin memiliki akses CRUD penuh; Admin staf hanya dapat mengedit/menghapus transaksi buatannya sendiri (`createdBy`).
- **D4**: Rekap tahunan matriks 12 bulan dapat diekspor langsung ke file CSV (UTF-8 BOM) yang kompatibel dengan Excel.

---

## 3. Next Handoff Steps
Setelah Phase 5 tuntas dan terverifikasi secara statis, eksekusi berikutnya akan dilanjutkan ke **Phase 6: Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp API Gateway**.
