# Implementation Master Plan: HomeeKost (Multi-Property)

Dokumen ini adalah **Master Plan Progress Aplikasi** untuk melacak status pelaksanaan, arsitektur, milestone, dan tahapan eksekusi pengembangan **Sistem Pengelolaan Kos Multi-Cabang (HomeeKost)** dari Phase 0 hingga Phase 10 berbasis **Fonnte WhatsApp API**.

---

## 1. Master Progress Dashboard

| Phase | Nama Phase | Target Minggu | Status | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment, Design System & Docker Foundation** | Minggu 1 | ✅ Completed | 100% |
| **Phase 1** | **Database Schema PostgreSQL & Prisma ORM (`ERD.md`)** | Minggu 1 | ✅ Completed | 100% |
| **Phase 2** | **Autentikasi RBAC, Session Guard & Master Shell Layout** | Minggu 1 - 2 | ✅ Completed | 100% |
| **Phase 3** | **Modul Properti Kos (Kost Management — SuperAdmin)** | Minggu 2 | 🚀 Next Target | 0% |
| **Phase 4** | **Modul Kamar, Penyewa & Kontrak Sewa** | Minggu 2 - 3 | ⏳ Pending | 0% |
| **Phase 5** | **Modul Keuangan, Arus Kas & Sinkronisasi Komplain** | Minggu 3 | ⏳ Pending | 0% |
| **Phase 6** | **Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp API** | Minggu 3 - 4 | ⏳ Pending | 0% |
| **Phase 7** | **Daily Background Cron & Engagement Hub** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 8** | **AI Financial Intelligence & Laporan Eksekutif Bulanan** | Minggu 4 - 5 | ⏳ Pending | 0% |
| **Phase 9** | **CCTV Stream Monitoring & User Management (SuperAdmin)** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 10**| **Overview Dashboard, Polish & Deployment VPS Linux 4GB** | Minggu 5 | ⏳ Pending | 0% |

---

## 2. Execution Log: Phase 2 (Autentikasi RBAC, Session Guard & Master Shell Layout)

### 2.1 Objectives
Mengimplementasikan sistem keamanan terintegrasi dan navigasi berbasis peran (RBAC) pada level server SSR (TanStack Start & TanStack Router) serta penanganan persistensi cabang kos aktif (*Active Property Session*):
- Server Route Guard `beforeLoad` di `/dashboard` & sub-rutenya
- Isolasi hak akses `SUPER_ADMIN` (Full Authority) vs `ADMIN` (Cabang Ditugaskan)
- Cookie-based Active Property Persistence (`hk_active_property_id`)
- Integrasi UI Shell dinamis: `Sidebar.tsx` (role-aware navigation) & `Topbar.tsx` (property switcher dropdown)

### 2.2 Decision Log
- **D1**: Server-Side Route Guard `beforeLoad` TanStack Router + Server Function (mencegah FOUC & menjamin proteksi data di level SSR).
- **D2**: Cookie `hk_active_property_id` untuk Active Property SuperAdmin (memungkinkan SSR loader membaca kos aktif instan).
- **D3**: Role-Aware Navigation di `Sidebar.tsx` & `Topbar.tsx` (menyembunyikan menu SuperAdmin bagi role Admin).

### 2.3 Task Completion Summary
- [x] **Task 2.1: Server Function & Session Context Layer**: Dibuat `getDashboardContextServerFn` di `src/data/services/auth-context.server.ts` & `setActivePropertyServerFn` di `src/data/services/property-session.server.ts`.
- [x] **Task 2.2: TanStack Router `beforeLoad` Guards**: Diterapkan guard SSR pada `src/routes/dashboard.tsx`, `src/routes/index.tsx`, `src/routes/login.tsx`, serta proteksi SuperAdmin pada `src/routes/dashboard/users.tsx` dan `src/routes/dashboard/select-property.tsx`.
- [x] **Task 2.3: UI Shell Dynamic Integration**: Disesuaikan `src/components/layout/Topbar.tsx` (Property Switcher Dropdown & User Avatar Popover) dan `src/components/layout/Sidebar.tsx` (Role-Aware Navigation & Mini Profile).
- [x] **Task 2.4: Validasi & Type-Check**: Verifikasi kompilasi TypeScript (`node tsc --noEmit`) dan Biome linting (`npm run check`) 100% pass dengan zero errors.

---

## 3. Next Handoff Steps
Setelah Phase 2 tuntas dan terverifikasi, eksekusi akan dilanjutkan ke **Phase 3: Modul Properti Kos (Kost / Property Management — SuperAdmin)**.
