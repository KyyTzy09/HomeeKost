# Monthly 1st Reminder & On-Time Appreciation Receipt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan pengingat tagihan sewa reguler otomatis yang hanya aktif pada tanggal 1 awal bulan (dengan informasi masa bayar tgl 1–5 & klausul denda keterlambatan), menonaktifkan otomasi pengingat cicilan di cron, dan menambahkan apresiasi pembayaran tepat waktu pada kwitansi pelunasan.

**Architecture:** 
- `whatsapp-templates.ts`: Menambahkan template `monthlyFirstReminder` dan mendukung variasi `isOnTime` pada template `paymentReceipt`.
- `engagement.repository.ts`: Menambahkan method teroptimasi baru `getFirstOfMonthInvoicesForReminder` (sembari tetap mempertahankan `getDueInvoicesForReminder` lama utuh).
- `engagement.service.ts`: Membatasi trigger pengiriman tagihan utama hanya saat tanggal 1 (`now.getDate() === 1`) dan mengecualikan tagihan cicilan bertahap dari cron harian.
- `payment.service.ts`: Menghitung status ketepatan waktu pembayaran (`paidDate <= dueDate`) saat pelunasan tagihan untuk memicu template kwitansi apresiasi.

**Tech Stack:** TypeScript, React 19, TanStack Start, Prisma ORM, Vitest, Fonnte WhatsApp API.

## Global Constraints
- Kepatuhan penuh terhadap `AGENTS.md`: Hanya menjalankan unit test murni (`tests/unit/*.test.ts`), tidak memodifikasi database nyata secara destruktif, tidak menjalankan automated E2E script yang menembak API live.
- Presisi tipe TypeScript ketat (`npx tsc --noEmit` wajib 0 error).
- Biome linter & formatting bersih (`npx @biomejs/biome check`).
- Desain token warna Sage Green & Cream dan tone komunikasi profesional tanpa kata "Kak" untuk tagihan/kwitansi.

---

### Task 1: WhatsApp Templates Enhancement (`monthlyFirstReminder` & `paymentReceipt` On-Time Variation)

**Files:**
- Modify: `src/lib/whatsapp-templates.ts`
- Test: `tests/unit/whatsapp-templates.test.ts`

**Interfaces:**
- Produces:
  - `whatsappTemplates.monthlyFirstReminder(p: MonthlyFirstReminderTemplateParams): string`
  - `whatsappTemplates.paymentReceipt(p: PaymentReceiptTemplateParams): string` (dengan `isOnTime?: boolean`)

- [ ] **Step 1: Write the failing unit test in `tests/unit/whatsapp-templates.test.ts`**

Tambahkan pengujian untuk template `monthlyFirstReminder` dan variasi `paymentReceipt` (tepat waktu vs terlambat):

```typescript
// Di tests/unit/whatsapp-templates.test.ts
import { describe, expect, it } from "vitest";
import { whatsappTemplates } from "../../src/lib/whatsapp-templates.ts";

describe("whatsappTemplates.monthlyFirstReminder", () => {
	it("formats monthly 1st reminder without 'Kak' and includes day 1-5 window with fine warning", () => {
		const result = whatsappTemplates.monthlyFirstReminder({
			tenantName: "Ahmad Priyadi",
			propertyName: "Kost Harmoni",
			roomNumber: "A-01",
			invoiceNumber: "INV-202611-001",
			period: "November 2026",
			amount: 1500000,
			bankAccount: "8735081290",
			accountHolder: "Bude Frisda",
			documentUrl: "http://localhost:3000/api/invoices/123/document",
		});

		expect(result).toContain("Halo *Ahmad Priyadi*");
		expect(result).not.toContain("Halo Kak");
		expect(result).toContain("Hari ini sudah tanggal 1 November 2026");
		expect(result).toContain("Tanggal 1 s/d 5 November 2026");
		expect(result).toContain("dikenakan denda keterlambatan");
		expect(result).toContain("Rp 1.500.000");
	});
});

describe("whatsappTemplates.paymentReceipt on-time variation", () => {
	it("includes appreciation text when payment is made on time", () => {
		const result = whatsappTemplates.paymentReceipt({
			tenantName: "Ahmad Priyadi",
			propertyName: "Kost Harmoni",
			roomNumber: "A-01",
			invoiceNumber: "INV-202611-001",
			period: "November 2026",
			paidDate: "01 Nov 2026",
			amount: 1500000,
			paymentMethod: "Transfer Bank",
			isOnTime: true,
		});

		expect(result).toContain("Halo *Ahmad Priyadi*");
		expect(result).not.toContain("Halo Kak");
		expect(result).toContain("tepat waktu");
		expect(result).toContain("mengapresiasi kedisiplinan");
	});

	it("uses formal confirmation text when payment is late", () => {
		const result = whatsappTemplates.paymentReceipt({
			tenantName: "Ahmad Priyadi",
			propertyName: "Kost Harmoni",
			roomNumber: "A-01",
			invoiceNumber: "INV-202611-001",
			period: "November 2026",
			paidDate: "08 Nov 2026",
			amount: 1500000,
			paymentMethod: "Transfer Bank",
			isOnTime: false,
		});

		expect(result).toContain("Halo *Ahmad Priyadi*");
		expect(result).not.toContain("Halo Kak");
		expect(result).not.toContain("tepat waktu");
		expect(result).toContain("telah kami terima dan diverifikasi");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit tests/unit/whatsapp-templates.test.ts`  
Expected: FAIL (`monthlyFirstReminder` is not a function or missing parameters).

- [ ] **Step 3: Implement `monthlyFirstReminder` and update `paymentReceipt` in `src/lib/whatsapp-templates.ts`**

1. Definisikan `MonthlyFirstReminderTemplateParams`:
```typescript
export interface MonthlyFirstReminderTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	amount: number;
	bankName?: string;
	bankAccount?: string;
	accountHolder?: string;
	documentUrl?: string;
}
```
2. Perbarui `PaymentReceiptTemplateParams` dengan properti opsional `isOnTime?: boolean`.
3. Implementasikan fungsi `monthlyFirstReminder`:
```typescript
	monthlyFirstReminder(p: MonthlyFirstReminderTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital Resmi:*\n${p.documentUrl}\n`
			: "";

		return `Halo *${p.tenantName}*,

Hari ini sudah tanggal 1 ${p.period}. Jangan lupa untuk melakukan pembayaran tagihan sewa kos Anda:

🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💰 *Total Tagihan:* *${formatRupiah(p.amount)}*

📅 *Masa Pembayaran:* Tanggal 1 s/d 5 ${p.period}
⚠️ *Penting:* Batas waktu pembayaran adalah tanggal 5. Pembayaran yang melewati tanggal 5 akan dikenakan denda keterlambatan sesuai ketentuan kos.

💳 *Pembayaran dapat ditransfer ke rekening:*
🏦 *${p.bankName || "BCA"} ${p.bankAccount || "8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*
${docSection}
Jika Anda sudah melakukan transfer, silakan kirimkan bukti pembayaran ke nomor ini. Terima kasih! 🙏✨
— Pengelola ${p.propertyName}`;
	},
```
4. Sesuaikan `paymentReceipt`:
   - Ganti sapaan menjadi `Halo *${p.tenantName}*,`.
   - Jika `p.isOnTime === true`, gunakan teks apresiasi:
     `Terima kasih banyak! Pembayaran sewa kos Anda untuk periode *${p.period}* telah kami terima dan diverifikasi tepat waktu. Kami sangat mengapresiasi kedisiplinan dan kerja sama Anda! 🙏✨`
   - Jika `p.isOnTime !== true`, gunakan teks formal standar:
     `Pembayaran sewa kos Anda untuk periode *${p.period}* telah kami terima dan diverifikasi.`

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `npm run test:unit tests/unit/whatsapp-templates.test.ts`  
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/whatsapp-templates.ts tests/unit/whatsapp-templates.test.ts
git commit -m "feat(templates): add monthlyFirstReminder and on-time appreciation paymentReceipt"
```

---

### Task 2: Repository Method for 1st of Month Invoices (`getFirstOfMonthInvoicesForReminder`)

**Files:**
- Modify: `src/data/repositories/engagement.repository.ts`

**Interfaces:**
- Produces:
  - `engagementRepository.getFirstOfMonthInvoicesForReminder(targetMonth: number, targetYear: number)`
- Consumes:
  - `calculateInstallmentSummary` from `src/lib/payment-utils.ts`

- [ ] **Step 1: Check existing `getDueInvoicesForReminder` in `engagement.repository.ts`**

Pastikan method `getDueInvoicesForReminder()` tetap utuh tanpa dihapus untuk kebutuhan cadangan di masa mendatang.

- [ ] **Step 2: Add `getFirstOfMonthInvoicesForReminder` in `EngagementRepository`**

Tambahkan method baru di `src/data/repositories/engagement.repository.ts`:
```typescript
	/**
	 * Dapatkan tagihan sewa reguler PENDING untuk tanggal 1 bulan berjalan (Anti-Spam & Exclude Cicilan)
	 * Query teroptimasi (< 5ms): hanya mengambil kolom minimal yang dibutuhkan.
	 */
	async getFirstOfMonthInvoicesForReminder(
		targetMonth: number,
		targetYear: number,
	) {
		const pendingInvoices = await this.db.invoice.findMany({
			where: {
				status: "PENDING",
				periodMonth: targetMonth,
				periodYear: targetYear,
				contract: {
					status: "ACTIVE",
					tenant: {
						status: "ACTIVE",
					},
				},
			},
			select: {
				id: true,
				invoiceNumber: true,
				periodMonth: true,
				periodYear: true,
				amount: true,
				dueDate: true,
				status: true,
				pdfUrl: true,
				transactions: {
					select: {
						amount: true,
					},
					orderBy: { transactionDate: "asc" },
				},
				contract: {
					select: {
						startDate: true,
						endDate: true,
						billingCycle: true,
						tenant: {
							select: {
								id: true,
								name: true,
								phoneNumber: true,
								whatsappNumber: true,
							},
						},
						room: {
							select: {
								roomNumber: true,
								property: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
			},
		});

		// Filter keluar tagihan yang sedang dicicil bertahap (cicilan hanya ditagih manual)
		return pendingInvoices.filter((inv) => {
			const installmentSummary = calculateInstallmentSummary(
				Number(inv.amount),
				inv.transactions,
			);
			return !installmentSummary.isPartial;
		});
	}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add src/data/repositories/engagement.repository.ts
git commit -m "feat(repo): add getFirstOfMonthInvoicesForReminder method excluding partial installments"
```

---

### Task 3: Cron Service & Payment Service Integration

**Files:**
- Modify: `src/data/services/engagement.service.ts`
- Modify: `src/data/services/payment.service.ts`

**Interfaces:**
- Consumes:
  - `engagementRepository.getFirstOfMonthInvoicesForReminder`
  - `whatsappTemplates.monthlyFirstReminder`
  - `whatsappTemplates.paymentReceipt` with `isOnTime`

- [ ] **Step 1: Update `EngagementService.runDailyCronTasks()` in `src/data/services/engagement.service.ts`**

1. Cek apakah hari ini adalah tanggal 1:
```typescript
const isFirstDayOfMonth = now.getDate() === 1;
```
2. Jalankan query pengingat tagihan hanya jika tanggal 1:
```typescript
const [dueReminders, todaysBirthdays] = await Promise.all([
    isFirstDayOfMonth
        ? this.repo.getFirstOfMonthInvoicesForReminder(curMonth, curYear)
        : Promise.resolve([]),
    this.repo.getTodaysBirthdays(),
]);
```
3. Di dalam loop penagihan:
   Gunakan template `whatsappTemplates.monthlyFirstReminder` untuk pesan penagihan tanggal 1:
```typescript
const message = whatsappTemplates.monthlyFirstReminder({
    tenantName: rem.tenantName,
    propertyName: rem.propertyName,
    roomNumber: rem.roomNumber,
    invoiceNumber: rem.invoiceNumber,
    period: rem.period,
    amount: rem.amount,
    bankName: "BCA",
    bankAccount: "8735081290",
    accountHolder: "Bude Frisda",
    documentUrl: rem.documentUrl,
});
const noteLabel = `[${invoiceToken}] Cron Tagihan Tgl 1 (#${rem.invoiceNumber}) [${invId}]`;
```

- [ ] **Step 2: Update `PaymentService.confirmPayment` in `src/data/services/payment.service.ts`**

Hitung `isOnTime`:
```typescript
const isPaidOnTime = paidDate.getTime() <= invoice.dueDate.getTime();
```
Teruskan `isOnTime: isPaidOnTime` ke pemanggilan `this.fonnte.sendPaymentReceipt` dan `whatsappTemplates.paymentReceipt`.

- [ ] **Step 3: Update `PaymentService.getPayments` (Direct WA URL generation)**

Pada mapping data invoice `isPaid`:
```typescript
const isPaidOnTime = inv.paidAt
    ? new Date(inv.paidAt).getTime() <= dueDate.getTime()
    : true;

message = whatsappTemplates.paymentReceipt({
    tenantName,
    propertyName,
    roomNumber,
    invoiceNumber: inv.invoiceNumber,
    period,
    paidDate: inv.paidAt ? formatDate(inv.paidAt) : formatDate(now),
    amount,
    paymentMethod: "Transfer Bank",
    documentUrl,
    isOnTime: isPaidOnTime,
});
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 5: Run unit tests**

Run: `npm run test:unit`  
Expected: All tests pass.

- [ ] **Step 6: Commit changes**

```bash
git add src/data/services/engagement.service.ts src/data/services/payment.service.ts
git commit -m "feat(cron): trigger monthly reminders on 1st only and integrate on-time receipt"
```

---

### Task 4: Static Analysis, Formatting & Final Verification

**Files:**
- Modified files from Tasks 1-3

- [ ] **Step 1: Run Biome check and write formatting**

Run: `npx @biomejs/biome check --write src/lib/whatsapp-templates.ts src/data/repositories/engagement.repository.ts src/data/services/engagement.service.ts src/data/services/payment.service.ts tests/unit/whatsapp-templates.test.ts`

- [ ] **Step 2: Run full TypeScript check**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 3: Run full unit test suite**

Run: `npm run test:unit`  
Expected: All 97+ unit tests pass.

- [ ] **Step 4: Commit any formatting or lint fixes**

```bash
git add -u
git commit -m "chore: format and verify code after monthly 1st reminder update"
```
