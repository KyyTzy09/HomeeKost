# Hybrid Room Transfer & Price Difference Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a hybrid room transfer workflow that supports instant move-in (Hari-H) with automatic price difference invoice generation when upgrading rooms, while preserving typo correction capabilities.

**Architecture:** Extend Zod schemas and tenant mutation services to handle `createDifferenceInvoice`. In the repository layer, execute atomic Prisma transactions that transition room occupancy, update active rental contracts, generate a `PENDING` price difference invoice if upgrading, and invalidate all financial/payment TanStack Query caches.

**Tech Stack:** React 19, TanStack Start, TanStack Form, TanStack Query v5, Zod, PostgreSQL 16, Prisma ORM, Bun.

## Global Constraints
- Strictly adhere to Sage & Cream design tokens (`DESIGN.md` & `KostManagement.html`).
- All financial numbers must maintain integer/Decimal precision without floating point inaccuracies.
- No direct `.env` reading or unauthorized DB mutations.
- Package manager: strictly `bun` and `bunx`.

---

### Task 1: Validation Schema & Type Definitions
**Files:**
- Modify: `src/common/validations/tenant.schema.ts`
- Modify: `src/common/types/tenant.types.ts`
- Test: `tests/unit/validations.test.ts`

**Interfaces:**
- Consumes: Existing `updateTenantSchema`.
- Produces: `createDifferenceInvoice?: boolean | null` field in `updateTenantSchema` and `UpdateTenantFormValues`.

- [ ] **Step 1: Add unit tests for `createDifferenceInvoice` in `tests/unit/validations.test.ts`**
- [ ] **Step 2: Run `bun test tests/unit/validations.test.ts` and confirm failure**
- [ ] **Step 3: Update `tenant.schema.ts` to include `createDifferenceInvoice`**
- [ ] **Step 4: Update `tenant.types.ts` if needed**
- [ ] **Step 5: Run `bun test tests/unit/validations.test.ts` and confirm pass**
- [ ] **Step 6: Commit changes**

---

### Task 2: Backend Repository & Service Transfer Logic
**Files:**
- Modify: `src/data/repositories/tenant.repository.ts`
- Modify: `src/data/services/tenant.service.ts`

**Interfaces:**
- Consumes: `createDifferenceInvoice` flag, room prices from Prisma `Room`.
- Produces: Atomic room transfer, difference invoice (`INV-DIFF-...`), updated contract room.

- [ ] **Step 1: Update `tenant.repository.ts` `updateTenantWithContract`**:
  - In `TRANSFER` branch:
    - Set previous room `status = "VACANT"`, target room `status = "OCCUPIED"`.
    - Update `activeContract.roomId = data.roomId`.
    - Calculate `priceDiff = Number(targetRoom.price) - Number(activeContract.room.price)`.
    - If `priceDiff > 0` and `data.createDifferenceInvoice !== false`, create a `PENDING` invoice with `amount = priceDiff`.
    - Update upcoming `PENDING` invoices to `Number(targetRoom.price)`.
- [ ] **Step 2: Update `tenant.service.ts` `updateTenant`** to extract and forward `createDifferenceInvoice`.
- [ ] **Step 3: Verify TypeScript compiler `bunx tsc --noEmit`**
- [ ] **Step 4: Commit changes**

---

### Task 3: Frontend UI in `TenantFormDialog.tsx`
**Files:**
- Modify: `src/components/tenant/TenantFormDialog.tsx`

**Interfaces:**
- Consumes: `editingTenant`, `roomOptions`, `targetRoom`, `form.values.roomChangeMode`.
- Produces: Reactive difference card showing `oldPrice`, `newPrice`, and `difference`, with checkbox toggle `createDifferenceInvoice`.

- [ ] **Step 1: Add reactive state / form field for `createDifferenceInvoice` (default `true`)**
- [ ] **Step 2: Render difference preview card under `TRANSFER` option with price diff breakdown**
- [ ] **Step 3: Include `createDifferenceInvoice` in form submission payload**
- [ ] **Step 4: Verify UI renders cleanly and matches Sage design tokens**
- [ ] **Step 5: Commit changes**

---

### Task 4: End-to-End Verification & Build
**Files:**
- All touched files

- [ ] **Step 1: Run all unit tests with `bun test`**
- [ ] **Step 2: Run TypeScript compile check with `bunx tsc --noEmit`**
- [ ] **Step 3: Run production SSR build with `bun run build`**
- [ ] **Step 4: Commit and push to `dev` and `main` branches**
