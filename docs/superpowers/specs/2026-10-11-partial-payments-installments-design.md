# Design Specification: Partial Payments (Cicilan) & End-of-Month WhatsApp Reminders

- **Date**: 2026-10-11
- **Status**: Approved by User
- **Author**: Antigravity AI & HomeeKost Core Team
- **Scope**: Payment Management, Installments, Arus Kas Tracking, WhatsApp Notifications

---

## 1. Context & Business Need

In real-world boarding house operations (*kos-kosan*), tenants frequently request or need to pay rent in installments (e.g. paying an initial down-payment of Rp 500,000 on the 5th of the month, and settling the remaining balance of Rp 1,000,000 towards the end of the month on payday).

### Key Challenges in the Current System:
1. **Single Lump-Sum Constraint**:
   The current payment confirmation dialog ([`PaymentConfirmDialog.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentConfirmDialog.tsx)) only supports 100% full settlement at once. Admin cannot record partial payments.
2. **Cashflow Distortion**:
   If an admin delays recording until full settlement, the initial Rp 500,000 is not accounted for in the cashflow on the day it was received. If an admin confirms full payment prematurely, the cashflow overstates income by Rp 1,000,000.
3. **Lack of Installment Awareness in Communication**:
   WhatsApp notifications currently only support full payment receipts or full due reminders. There is no template acknowledging partial payments or reminding tenants about the remaining balance before the month ends.

---

## 2. Non-Destructive Architectural Strategy

To eliminate any risk of database migration errors or breaking existing queries, we employ the **Non-Destructive Multi-Transaction Pattern**:

1. **Database Schema Stability**:
   - The PostgreSQL `InvoiceStatus` enum remains unchanged (`PENDING`, `PAID`, `OVERDUE`, `CANCELLED`).
   - The existing 1-to-many relation `Invoice.transactions Transaction[]` is utilized to record each installment payment atomically.
2. **Dynamic Computation**:
   - For any invoice:
     - `paidAmount = SUM(invoice.transactions.map(t => t.amount))`
     - `remainingAmount = MAX(0, Number(invoice.amount) - paidAmount)`
     - `isPartial = paidAmount > 0 && paidAmount < Number(invoice.amount)`
   - When `remainingAmount === 0` (or `paidAmount >= Number(invoice.amount)`):
     - `Invoice.status = "PAID"`
     - `Invoice.paidAt = paidDate`
   - When `isPartial === true`:
     - `Invoice.status` remains `"PENDING"` in database (so it continues to appear in unpaid filters without breaking backward compatibility), but the application presents it with a distinct **"Dicicil"** badge and installment progress indicator.

---

## 3. Detailed Component & UI Design

### 3.1 Payment Confirmation Dialog ([`PaymentConfirmDialog.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentConfirmDialog.tsx))
When the admin clicks "Konfirmasi" or "Catat Cicilan":
1. **Payment Type Selector**:
   - `[•] Lunas Penuh (Rp [Sisa Tagihan])`
   - `[ ] Pembayaran Bertahap / Cicilan`
2. **Installment Mode Controls**:
   - Numeric input: **Nominal Dibayar Kali Ini (Rp)** (defaulting to the remaining balance).
   - Validation: Minimum Rp 10,000 and cannot exceed the remaining balance.
   - Real-time breakdown card:
     - **Total Tagihan**: Rp 1,500,000
     - **Sudah Terbayar**: Rp [paidAmount]
     - **Dibayar Kali Ini**: Rp [inputAmount]
     - **Sisa Tagihan**: Rp [remainingAmount - inputAmount]
3. **WhatsApp Receipt Checkbox**:
   - If full payment: "Kirim Kwitansi Lunas via WhatsApp"
   - If partial payment: "Kirim Bukti Penerimaan Cicilan via WhatsApp"

### 3.2 Payment Table & Metrics ([`PaymentTable.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentTable.tsx))
1. **Amount Column**:
   - Displays total invoice amount.
   - If `isPartial === true`, displays a secondary line:
     `Terbayar: Rp 500.000 · Sisa: Rp 1.000.000`
2. **Status Badge**:
   - If `isPartial === true`: renders `🌓 Dicicil` badge (soft amber styling consistent with Sage & Cream palette).
3. **Action Buttons**:
   - For partial invoices: Action button text displays **"Catat Cicilan"** or **"Pelunasan"**.
   - WhatsApp Action: Provides quick action to send **"Pengingat Sisa Cicilan"** before month end.

---

## 4. WhatsApp Notification Templates ([`whatsapp-templates.ts`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/lib/whatsapp-templates.ts))

### 4.1 Installment Receipt (`partialPaymentReceipt`)
```text
🧾 *BUKTI PENERIMAAN CICILAN SEWA*

Halo Kak *{tenantName}*,
Pembayaran sewa kos Anda untuk periode *{period}* telah kami terima:

🏠 *Properti:* {propertyName} (Kamar {roomNumber})
📄 *No. Invoice:* {invoiceNumber}
💳 *Metode Bayar:* {paymentMethod}
🗓️ *Tanggal Bayar:* {paidDate}
💵 *Nominal Diterima:* *{paidThisTime}*

📊 *Rincian Status Tagihan:*
- Total Tagihan: {totalAmount}
- Total Terbayar: {totalPaid}
- ⚠️ *Sisa Tagihan:* *{remainingAmount}*

Bukti pembayaran resmi ini tersimpan digital di sistem pengelola kos. Terima kasih! 🙏✨
_— Pengelola {propertyName}_
```

### 4.2 End-of-Month Balance Reminder (`installmentReminder`)
```text
🔔 *PENGINGAT SISA CICILAN SEWA*

Halo Kak *{tenantName}*,
Mengingatkan kembali perihal sisa tagihan sewa kos untuk periode *{period}*:

🏠 *Properti:* {propertyName} (Kamar {roomNumber})
📄 *No. Invoice:* {invoiceNumber}
💵 *Total Tagihan:* {totalAmount}
✅ *Sudah Dibayar:* {totalPaid}
⏳ *Sisa Pelunasan:* *{remainingAmount}*
📅 *Batas Waktu Pelunasan:* Sebelum akhir bulan ({endOfMonthDate})

Pembayaran dapat ditransfer ke rekening:
🏦 *{bankAccount}* a.n. *{accountHolder}*

Mohon lakukan pelunasan sisa tagihan sebelum tanggal tersebut. Terima kasih banyak atas kerjasamanya! 🙏✨
_— Pengelola {propertyName}_
```

---

## 5. Backend Logic & Services

### 5.1 Validation Schema (`payment.schema.ts`)
Extend `confirmPaymentSchema`:
```typescript
export const confirmPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID wajib disertakan"),
  paymentMethod: z.enum(["TRANSFER", "CASH", "QRIS"]),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  sendReceiptWhatsApp: z.boolean().optional().default(true),
  isPartial: z.boolean().optional().default(false),
  amount: z.number().positive("Nominal pembayaran harus lebih dari 0").optional(),
});
```

### 5.2 Repository Layer (`invoice.repository.ts`)
In `markAsPaid` (renamed or overloaded to support partials):
```typescript
async recordPayment(
  invoiceId: string,
  paymentMethod: PaymentMethod,
  paidDate: Date,
  createdByUserId: string,
  amountToPay: number,
  notes?: string
)
```
1. Fetch invoice with existing transactions.
2. Validate `amountToPay <= remainingAmount`.
3. Create `Transaction`:
   - `type: "INCOME"`, `category: "RENT"`, `classification: "OPERATIONAL"`
   - `amount: amountToPay`
   - `description`: `Pembayaran Sewa (Cicilan ke-{N}) Kamar {roomNo} - {tenantName}` (or Pelunasan if finishing).
4. Update `Invoice`:
   - If `newTotalPaid >= invoice.amount`:
     `status: "PAID"`, `paidAt: paidDate`
   - Else:
     Keep `status: "PENDING"`, update `updatedAt: new Date()`

### 5.3 Statistics Accuracy (`getStats`)
In `invoice.repository.ts`:
Calculate `paidAmount` from actual transaction receipts (`sum(transactions.amount)`), guaranteeing that partial installments are accurately counted as realized income, while remaining balances are classified as `unpaidAmount`.

---

## 6. Verification & Quality Assurance
1. **Unit Tests**:
   - Calculation of `paidAmount`, `remainingAmount`, and installment count.
   - Validation schema checks for `confirmPaymentSchema` with partial amounts.
2. **Type Safety**:
   - `bunx tsc --noEmit` must report 0 errors.
3. **SSR Build**:
   - `bun run build` must succeed cleanly.
