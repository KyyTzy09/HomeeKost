# Tenant Natural Sorting, WhatsApp Pacing & Installment Cron Implementation Plan

> **For implementers:**
> - Strictly adhere to `AGENTS.md`: Pure unit tests only (`src/lib/*.test.ts`), no destructive DB operations, no automated E2E/Playwright scripts.
> - Preserves Sage Green & Cream tokens (`DESIGN.md`).
> - **IMPORTANT USER INSTRUCTION**: Create local git commits only; **DO NOT `git push` to `origin/dev`** so the user can test locally first.

---

## Proposed Changes

### 1. Async Utility (`src/lib/async-utils.ts`)
- `sleepWithJitter(baseMs, jitterMs)`: async delay utility providing human-like randomized pacing (~800ms to 1200ms) between WhatsApp message dispatch in loops.
- Pure unit tests in `src/lib/async-utils.test.ts`.

### 2. WhatsApp Anti-Ban Pacing & Installment Cron Automation (`src/data/services/engagement.service.ts` & `src/data/repositories/engagement.repository.ts`)
- Apply `sleepWithJitter` across batch broadcast loops and daily cron loops.
- In `runDailyCronTasks()`:
  - Query invoices with active contracts and include their transactions.
  - Distinguish between standard unpaid invoices and partially paid invoices (`isPartial`).
  - For partial invoices: if today is H-3 of the end of the month OR matching due date, dispatch `whatsappTemplates.installmentReminder` (showing Total, Sudah Dibayar, Sisa Pelunasan, Batas Akhir Bulan, and Bank Account).
  - In `src/routes/dashboard/payments.tsx`: Align `handleSendWhatsApp` to ensure `isPartial` invoices always trigger `REMINDER` type.

### 3. Natural Alphanumeric Sorting Utility (`src/lib/sort-utils.ts`)
- `naturalCompare(a, b)`: Uses `localeCompare(b, undefined, { numeric: true, sensitivity: "base" })` to naturally order room numbers with leading zeroes (`01`, `02`, `10`), alphabetical codes (`A`, `B`), and alphanumeric prefixes (`A-01`, `A-10`, `Kamar 1`, `Kamar 10`).
- Pure unit tests in `src/lib/sort-utils.test.ts`.

### 4. Interactive Tenant Table Sorting (`src/components/tenant/TenantTable.tsx` & `src/routes/dashboard/tenants.tsx`)
- Default sort: `roomNo` ascending (`asc`).
- Sortable columns: `roomNo`, `name`, `startDate`, `dueDate`, `paymentStatus`.
- Interactive headers with `ArrowUp`, `ArrowDown`, `ArrowDownUp` indicators in Sage Green theme.

---

## Tasks

### Task 1: Async Pacing Utility & Unit Tests
- **Files**:
  - `src/lib/async-utils.ts`
  - `src/lib/async-utils.test.ts`
- **Steps**:
  1. Write failing test for `sleepWithJitter` in `src/lib/async-utils.test.ts`.
  2. Implement `sleepWithJitter` in `src/lib/async-utils.ts`.
  3. Verify tests pass: `npm run test:unit src/lib/async-utils.test.ts`.
  4. Local commit: `feat(utils): add sleepWithJitter utility for WhatsApp anti-ban pacing`

### Task 2: Natural Alphanumeric Sorting Utility & Unit Tests
- **Files**:
  - `src/lib/sort-utils.ts`
  - `src/lib/sort-utils.test.ts`
- **Steps**:
  1. Write tests in `src/lib/sort-utils.test.ts` covering:
     - Pure numbers with leading zeros: `["02", "01", "10"]` -> `["01", "02", "10"]`
     - Pure letters: `["B", "A", "C"]` -> `["A", "B", "C"]`
     - Alphanumeric codes: `["A-10", "A-2", "A-1", "B-1"]` -> `["A-1", "A-2", "A-10", "B-1"]`
     - Prefixed rooms: `["Kamar 10", "Kamar 2", "Kamar 1"]` -> `["Kamar 1", "Kamar 2", "Kamar 10"]`
  2. Implement `naturalCompare` in `src/lib/sort-utils.ts`.
  3. Verify tests pass: `npm run test:unit src/lib/sort-utils.test.ts`.
  4. Local commit: `feat(utils): add naturalCompare for natural alphanumeric room sorting`

### Task 3: Background Cron Installment Reminder Engine & WA Pacing
- **Files**:
  - `src/data/repositories/engagement.repository.ts`
  - `src/data/services/engagement.service.ts`
  - `src/routes/dashboard/payments.tsx`
- **Steps**:
  1. In `engagement.repository.ts`: ensure `getDueInvoicesForReminder()` includes transactions and invoice payment status.
  2. In `engagement.service.ts`:
     - Import `sleepWithJitter` and `calculateInstallmentSummary`, `getEndOfMonthString`.
     - In `runDailyCronTasks()`:
       - Check if invoice is partial (`isPartial`).
       - If partial and H-3 before end of month OR due date, send `whatsappTemplates.installmentReminder`.
       - Add `sleepWithJitter(800, 400)` between message dispatch in all loops (due reminders, installment reminders, birthday wishes, and broadcast).
  3. In `src/routes/dashboard/payments.tsx`:
     - Fix `handleSendWhatsApp` to ensure `payment.isPartial` always dispatches `type: "REMINDER"`.
  4. Local commit: `feat(cron): add installment reminder handling and anti-ban delay to daily cron`

### Task 4: Interactive & Default Room Sorting on `/dashboard/tenants`
- **Files**:
  - `src/components/tenant/TenantTable.tsx`
  - `src/routes/dashboard/tenants.tsx`
- **Steps**:
  1. In `TenantTable.tsx`:
     - Add props `sortBy?: string`, `sortOrder?: "asc" | "desc"`, `onSortToggle?: (column: string) => void`.
     - Render sort buttons with `ArrowUp`, `ArrowDown`, `ArrowDownUp` icons for `roomNo`, `name`, `startDate`, `dueDate`, `paymentStatus`.
  2. In `tenants.tsx`:
     - Add state `sortBy: string = "roomNo"` and `sortOrder: "asc" | "desc" = "asc"`.
     - Implement `handleSortToggle`.
     - Sort `filteredTenants` using `naturalCompare` for `roomNo`, and appropriate comparisons for `name`, `startDate`, `dueDate`, `paymentStatus`.
  3. Local commit: `feat(tenants): add natural room sorting by default and interactive table column sorting`

### Task 5: Verification & Linting
- **Steps**:
  1. Run unit test suite: `npm run test:unit`.
  2. Run TypeScript compilation check: `npx tsc --noEmit`.
  3. Run Biome formatting & lint check: `npm run check`.
  4. Confirm all commits are local and **no push** has been made.
