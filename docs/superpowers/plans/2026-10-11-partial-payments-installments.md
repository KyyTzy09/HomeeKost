# Partial Payments (Cicilan) & End-of-Month Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement flexible partial payments (cicilan sewa) for invoices, recording accurate cashflow income per installment, showing installment progress in the payment table, and supporting WhatsApp installment receipts and end-of-month reminders.

**Architecture:** Use the existing 1-to-many relationship between `Invoice` and `Transaction` without altering PostgreSQL database enums. Dynamically compute `paidAmount`, `remainingAmount`, and `isPartial`. When full amount is achieved, mark invoice `PAID`; while partially paid, maintain `PENDING` in database with `isPartial` badge in application.

**Tech Stack:** React 19, TanStack Start, TanStack Query v5, Zod, PostgreSQL 16, Prisma ORM, Bun, Fonnte WhatsApp API.

## Global Constraints
- Strictly adhere to Sage & Cream design tokens (`DESIGN.md` & `KostManagement.html`).
- All financial calculations must maintain Decimal / integer precision.
- Zero breaking changes to existing full-payment confirmation flows.
- Package manager: strictly `bun` and `bunx`.

---

### Task 1: Schema, Types & Calculation Helpers
**Files:**
- Modify: `src/common/validations/payment.schema.ts`
- Modify: `src/common/types/payment.types.ts`
- Test: `tests/unit/payment-form-calc.test.ts`
- Test: `tests/unit/validations.test.ts`

**Interfaces:**
- Consumes: Existing `confirmPaymentSchema` and `PaymentItem`.
- Produces: `isPartial?: boolean`, `amount?: number` in `confirmPaymentSchema`; `paidAmount`, `remainingAmount`, `isPartial`, `transactions` in `PaymentItem`.

- [ ] **Step 1: Write unit tests in `tests/unit/validations.test.ts` for partial payment validation**
- [ ] **Step 2: Write unit tests in `tests/unit/payment-form-calc.test.ts` for installment calculations**
- [ ] **Step 3: Update `payment.schema.ts` to include `isPartial` and `amount`**
- [ ] **Step 4: Update `payment.types.ts` to include installment fields in `PaymentItem`**
- [ ] **Step 5: Run `bun test` and confirm all tests pass**
- [ ] **Step 6: Commit changes**

---

### Task 2: WhatsApp Notification Templates
**Files:**
- Modify: `src/lib/whatsapp-templates.ts`
- Test: `tests/unit/whatsapp-templates.test.ts`

**Interfaces:**
- Produces: `whatsappTemplates.partialPaymentReceipt` and `whatsappTemplates.installmentReminder`.

- [ ] **Step 1: Write unit tests in `tests/unit/whatsapp-templates.test.ts` for installment templates**
- [ ] **Step 2: Implement `partialPaymentReceipt` and `installmentReminder` in `src/lib/whatsapp-templates.ts`**
- [ ] **Step 3: Run `bun test tests/unit/whatsapp-templates.test.ts` and confirm pass**
- [ ] **Step 4: Commit changes**

---

### Task 3: Backend Repository & Service Layer
**Files:**
- Modify: `src/data/repositories/invoice.repository.ts`
- Modify: `src/data/services/payment.service.ts`

**Interfaces:**
- Consumes: `ConfirmPaymentInput` with `isPartial` and `amount`.
- Produces: Atomic `recordPayment` method, accurate `getStats`, mapped `PaymentItem` with installment metadata.

- [ ] **Step 1: In `invoice.repository.ts`, implement `recordPayment`**:
  - Calculate `existingPaid = sum(transactions.amount)`
  - Determine `amountToRecord` (input `amount` or remaining balance)
  - Create `Transaction` for `amountToRecord` with descriptive title
  - If `existingPaid + amountToRecord >= invoice.amount`: update invoice to `PAID` and `paidAt = paidDate`
- [ ] **Step 2: In `invoice.repository.ts`, update `getStats`**:
  - Incorporate partial transaction receipts into `paidAmount` and remaining into `unpaidAmount`
- [ ] **Step 3: In `payment.service.ts`, update `getPayments`**:
  - Compute `paidAmount`, `remainingAmount`, `isPartial` for each `PaymentItem`
  - Route direct WhatsApp reminder link to `installmentReminder` when `isPartial` is true
- [ ] **Step 4: In `payment.service.ts`, update `confirmPayment`**:
  - Call `invoiceRepo.recordPayment` and send appropriate WhatsApp receipt (partial vs full)
- [ ] **Step 5: Verify types with `bunx tsc --noEmit`**
- [ ] **Step 6: Commit changes**

---

### Task 4: Frontend UI (`PaymentConfirmDialog.tsx` & `PaymentTable.tsx`)
**Files:**
- Modify: `src/components/payment/PaymentConfirmDialog.tsx`
- Modify: `src/components/payment/PaymentTable.tsx`

**Interfaces:**
- Consumes: Updated `PaymentItem` with `isPartial`, `paidAmount`, `remainingAmount`.
- Produces: Installment options in confirmation modal, progress indicator & badge in table.

- [ ] **Step 1: In `PaymentConfirmDialog.tsx`**:
  - Add radio toggle: "Lunas Penuh" vs "Pembayaran Bertahap / Cicilan"
  - Add input for "Nominal Bayar Kali Ini" with real-time remaining calculation
  - Validate that input is positive and does not exceed remaining balance
  - Pass `isPartial` and `amount` to `onConfirm`
- [ ] **Step 2: In `PaymentTable.tsx`**:
  - Render installment breakdown (`Terbayar: Rp X · Sisa: Rp Y`) under amount
  - Render `🌓 Dicicil` badge when `isPartial`
  - Change button label to "Catat Cicilan / Pelunasan"
  - Wire quick WhatsApp reminder button for installment reminder
- [ ] **Step 3: Verify UI styling with HomeeKost Sage & Cream tokens**
- [ ] **Step 4: Commit changes**

---

### Task 5: End-to-End Verification & Production Build
**Files:**
- All touched files

- [ ] **Step 1: Run all unit tests with `bun test`**
- [ ] **Step 2: Run TypeScript compile check with `bunx tsc --noEmit`**
- [ ] **Step 3: Run production SSR build with `bun run build`**
- [ ] **Step 4: Commit and push to `dev` and `main` branches**
