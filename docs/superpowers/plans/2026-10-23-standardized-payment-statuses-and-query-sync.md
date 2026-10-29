# Implementation Plan: Standardized 3 Payment Statuses & Query Sync

- **Spec Reference**: `docs/superpowers/specs/2026-10-23-standardized-payment-statuses-and-query-sync-design.md`
- **Scope**: Status Standardization (`Lunas`, `Belum Lunas`, `Terlambat`, `Cicilan`), Query Sync, Multi-Page Consistency (`/tenants`, `/payments`, `/invoices`)
- **Runtime Environment**: **Bun (`bun`)** only. Do not use `npm`.

---

## Proposed Tasks

### Step 1: Utility & Domain Logic (`src/lib/payment-utils.ts`)
- [ ] Export `evaluateRentalPaymentStatus` in `src/lib/payment-utils.ts`.
- [ ] Add WIB boundary helper to ensure `todayWib` is at `00:00:00`.
- [ ] Create `tests/unit/payment-status.test.ts` to test:
  - Exact due date today (`Belum Lunas`)
  - Past due date yesterday (`Terlambat`)
  - Partial payment (`Cicilan`)
  - Full settlement (`Lunas`)
- [ ] Run `bun test tests/unit/payment-status.test.ts`.

### Step 2: Backend Services Synchronization (`src/data/services/`)
- [ ] In `src/data/services/payment.service.ts`:
  - Wire `evaluateRentalPaymentStatus` into `getPayments` formatting.
  - Align `getStats` metrics so "Belum Lunas" (`dueDate >= today`) and "Terlambat" (`dueDate < today`) never overlap.
  - Align status filters (`PAID`, `UNPAID` / `PENDING`, `OVERDUE`, `PARTIAL`).
- [ ] In `src/data/services/tenant.service.ts`:
  - In `getTenants`, remove `"Lancar"` and evaluate tenant payment status to `"Lunas"`, `"Belum Lunas"`, `"Terlambat"` (or `"Cicilan"`).
  - Support filtering by `"Lunas"`, `"Belum Lunas"`, `"Terlambat"`.

### Step 3: Frontend Pages & Components Alignment
- [ ] `/dashboard/tenants` (`src/routes/dashboard/tenants.tsx`):
  - Update status column to render `Lunas`, `Belum Lunas`, `Terlambat`.
  - Update status filter menu options to `Semua status`, `Lunas`, `Belum Lunas`, `Terlambat`.
- [ ] `/dashboard/payments` (`src/routes/dashboard/payments.tsx`, `PaymentTable.tsx`, `PaymentMetrics.tsx`):
  - In `PaymentMetrics.tsx`: Change `"Total Tagihan Bulan Ini (...)"` to `"Total Tagihan Bulan Ini"`, and `"Menunggu Pembayaran"` to `"Belum Lunas"`.
  - In `PaymentTable.tsx`: Replace status `"Dicicil"` with `"Cicilan"`, `"Menunggu"` with `"Belum Lunas"`.
  - Align status filter dropdown with backend filters.
- [ ] `/dashboard/invoices` (`src/routes/dashboard/invoices.tsx`):
  - Align document filter options to `Semua Dokumen`, `Lunas`, `Belum Lunas`, `Cicilan`, `Terlambat`.

### Step 4: Verification & Build
- [ ] Run `bun test` to ensure all tests pass.
- [ ] Run `bun run build` to verify type safety and bundle generation.
- [ ] Update `docs/revisi-todo.md` items completed.
