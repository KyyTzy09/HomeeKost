# Design Specification: Hybrid Room Change & Transfer with Difference Invoice

- **Date**: 2026-10-11
- **Status**: Approved by User
- **Author**: Antigravity AI & HomeeKost Core Team
- **Scope**: Tenant Room Editing, Transfer Workflow, Price Difference Billing

---

## 1. Context & Problem Statement

In managing boarding houses (*kos-kosan*), tenants changing rooms falls into two distinct operational categories:

1. **Typo / Initial Data Entry Mistake (`CORRECTION`)**:
   - The administrator mistakenly selected the wrong room or input an incorrect rent price when initially registering the tenant.
   - **Requirement**: The contract must stay unified, the room number must be corrected, the previous room released, the correct room occupied, and both the registration invoice and related cashflow transaction records must be adjusted to the correct room rate without creating duplicate billing.

2. **Official Physical Room Transfer (`TRANSFER`)**:
   - The tenant legitimately requests to move from their current room to a different room (e.g. upgrading from an economy room of Rp 800,000/month to a VIP room of Rp 1,000,000/month) effective immediately on Move Day (Hari-H).
   - **Requirement**:
     - The previous room becomes immediately `VACANT` (available for new prospective tenants).
     - The target room becomes `OCCUPIED`.
     - The tenant's active rental contract is updated to the target room.
     - **Price Difference Handling**: If the new room has a higher rental price than the previous room, the system automatically generates an interim **Price Difference Invoice (`INV-DIFF-...`)** for the remaining difference (e.g., Rp 200,000) with status `PENDING`, allowing the admin to collect the shortfall and send a WhatsApp reminder.
     - **Past History Protection**: Invoices already marked `PAID` from the old room are preserved as-is.
     - **Future Periods**: Any existing future `PENDING` invoices are updated to the full new room price. If the new room has equal or lower rent, no surcharge invoice is created.

---

## 2. User Experience & Interface Design

### 2.1 Dialog Form (`TenantFormDialog.tsx`)
When editing an existing tenant (`isEditing === true`), if the selected room differs from the tenant's current room:
A specialized section is presented below the room combobox:

1. **Radio Mode Selector**:
   - `CORRECTION` (*Koreksi Salah Input - Default*):
     - Description: "Gunakan jika salah pilih saat input awal. Nomor kamar & tagihan pendaftaran diperbarui tanpa memutus riwayat."
     - Checkbox: "Sesuaikan nominal tagihan & catatan kas pendaftaran ke tarif baru" (`updatePendingInvoiceAmount`, default: `true`).
   - `TRANSFER` (*Pindah Kamar Resmi Hari-H*):
     - Description: "Penghuni mutasi fisik hari ini. Kamar lama langsung kosong (VACANT) dan kamar baru ditempati (OCCUPIED)."

2. **Price Difference Card (Visible when `TRANSFER` is selected)**:
   - Evaluates: `difference = targetRoom.price - currentRoom.price`.
   - **If `difference > 0`**:
     - Displays badge/alert with old price, new price, and difference:
       `Kamar Lama (Rp 800.000) ➔ Kamar Baru (Rp 1.000.000) · Selisih: Rp 200.000`
     - Checkbox: "Otomatis buat tagihan selisih kurang bayar bulan ini (Rp 200.000)" (`createDifferenceInvoice`, default: `true`).
   - **If `difference <= 0`**:
     - Displays informational note: "Tarif kamar baru sama atau lebih murah. Tidak ada tagihan selisih bulan ini; tarif baru otomatis berlaku penuh untuk periode berikutnya."

---

## 3. Data Schema & Contracts

### 3.1 Zod Validation Schema (`tenant.schema.ts`)
Update `updateTenantSchema`:
```typescript
export const updateTenantSchema = tenantSchema.extend({
  // Existing fields...
  roomChangeMode: z.enum(["CORRECTION", "TRANSFER"]).nullable().optional(),
  updatePendingInvoiceAmount: z.boolean().nullable().optional(),
  createDifferenceInvoice: z.boolean().nullable().optional(),
});
```

### 3.2 Types (`tenant.types.ts`)
Include `createDifferenceInvoice?: boolean` in `UpdateTenantFormValues`.

---

## 4. Backend Implementation Architecture

### 4.1 Service Layer (`tenant.service.ts`)
- In `updateTenant`:
  Extract `createDifferenceInvoice` from input (defaults to `true` if `roomChangeMode === "TRANSFER"` and room price is higher).
  Forward to `tenantRepository.updateTenantWithContract`.

### 4.2 Repository Layer (`tenant.repository.ts`)
In `updateTenantWithContract`:
When `activeContract` exists and `isRoomChanged`:
1. **Room State Transitions**:
   - `Room.update({ where: { id: activeContract.roomId }, data: { status: "VACANT" } })`
   - `Room.update({ where: { id: data.roomId }, data: { status: "OCCUPIED" } })`

2. **Mode `TRANSFER`**:
   - Update `activeContract`:
     `roomId: data.roomId`
     `billingCycle: data.billingCycle || activeContract.billingCycle`
   - Calculate price difference:
     `oldPrice = Number(activeContract.room.price)`
     `newPrice = Number(targetRoom.price)`
     `diffPrice = newPrice - oldPrice`
   - If `diffPrice > 0` and `data.createDifferenceInvoice !== false`:
     Create a difference invoice:
     ```typescript
     const now = new Date();
     const pMonth = now.getMonth() + 1;
     const pYear = now.getFullYear();
     const invNumber = `INV-DIFF-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

     await tx.invoice.create({
       data: {
         contractId: activeContract.id,
         invoiceNumber: invNumber,
         periodMonth: pMonth,
         periodYear: pYear,
         amount: diffPrice,
         dueDate: now,
         status: "PENDING",
       },
     });
     ```
   - Update future `PENDING` invoices on `activeContract` to the full new room price `newPrice`.
   - Past `PAID` invoices are preserved without changes.

3. **Mode `CORRECTION`**:
   - Preserves existing typo correction logic:
     - Updates `activeContract.roomId = data.roomId`.
     - Updates all `PENDING` invoices to `effectiveRentAmount`.
     - Updates current/latest invoice to `effectiveRentAmount`.
     - If current invoice was `PAID`, synchronizes linked `Transaction` records (amount and description with new room number).

---

## 5. Cache Invalidation & Real-Time Sync

Upon successful mutation of `useUpdateTenant`:
- `queryClient.invalidateQueries({ queryKey: ["tenants"] })`
- `queryClient.invalidateQueries({ queryKey: ["rooms"] })`
- `queryClient.invalidateQueries({ queryKey: ["payments"] })`
- `queryClient.invalidateQueries({ queryKey: ["invoices"] })`
- `queryClient.invalidateQueries({ queryKey: ["transactions"] })`
- `queryClient.invalidateQueries({ queryKey: ["finances"] })`
- `queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] })`

This guarantees that:
- The newly created difference invoice immediately shows up under `/dashboard/payments`.
- The room occupancy numbers in `/dashboard` and `/dashboard/rooms` update immediately.
- The financial summaries reflect accurate data without page reloads.

---

## 6. Verification & Quality Gates

1. **Unit Testing**:
   - Unit tests for validation schema accepting `createDifferenceInvoice`.
   - Pure function calculations for room price difference and invoice amounts.
2. **Static Type Safety**:
   - `bunx tsc --noEmit` must report 0 errors.
3. **Build Integrity**:
   - `bun run build` must produce a valid SSR bundle without warnings.
