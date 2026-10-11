# Implementation Plan: Expense History & Calculation Synchronization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghilangkan ketidaksesuaian antara transaksi pengeluaran yang diinput pengelola dengan kartu metrik ringkasan (mengatasi cache stale dashboard, pemotongan pembulatan nominal, filter tabel transaksi, dan boundary timezone WIB).

**Architecture:** 
- Standarisasi rentang bulan menggunakan utilitas tanggal berbasis WIB (`getMonthDateRange` & `getTodayDateString`) di seluruh backend service (`dashboard.service.ts`, `cashflow.service.ts`, `report.repository.ts`).
- Penambahan invalidasi cache React Query `["dashboard", "overview"]` pada mutasi transaksi (`use-transactions.ts`).
- Sinkronisasi filter periode pada tabel riwayat transaksi (`FinanceTransactionTable.tsx` & `finance.tsx`) dengan toggle periode aktif vs semua periode.
- Penyajian nominal pengeluaran presisi pada kartu metrik Dashboard tanpa pemotongan membingungkan.

**Tech Stack:** React 19, TanStack Start/Router, TanStack Query v5, Prisma ORM v7, PostgreSQL 16, Vitest, TypeScript.

## Global Constraints
- Strict compliance with `AGENTS.md`: Pure unit tests only (`src/lib/*.test.ts`), no destructive DB commands, no automated E2E/Playwright scripts.
- Design tokens: Sage Green & Cream tokens preserved according to `DESIGN.md`.
- TypeScript strict type safety (`tsc --noEmit`) and Biome linting (`npm run check`).

---

### Task 1: Timezone & Date Range Utility Standardization

**Files:**
- Modify: `src/lib/date-utils.ts:15-35`
- Test: `src/lib/date-utils.test.ts`

**Interfaces:**
- Produces:
  - `getMonthDateRange(month: number, year: number): { startDate: Date; endDate: Date }`
  - `getTodayDateString(): string` (WIB UTC+7 aligned)

- [ ] **Step 1: Write the failing unit test for date-utils**

Buat file pengujian unit murni `src/lib/date-utils.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { getMonthDateRange, getTodayDateString } from "./date-utils.ts";

describe("date-utils timezone and month boundaries", () => {
	it("should calculate correct start and end date for a month in WIB (UTC+7)", () => {
		const { startDate, endDate } = getMonthDateRange(10, 2026);

		// 1 Oktober 2026 00:00:00 WIB = 30 September 2026 17:00:00 UTC
		expect(startDate.toISOString()).toBe("2026-09-30T17:00:00.000Z");

		// 31 Oktober 2026 23:59:59.999 WIB = 31 Oktober 2026 16:59:59.999 UTC
		expect(endDate.toISOString()).toBe("2026-10-31T16:59:59.999Z");
	});

	it("should return valid YYYY-MM-DD date string for today", () => {
		const today = getTodayDateString();
		expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit src/lib/date-utils.test.ts`
Expected: FAIL (karena `getMonthDateRange` belum diekspor/didefinisikan).

- [ ] **Step 3: Implement `getMonthDateRange` & fix `getTodayDateString` in `src/lib/date-utils.ts`**

Tambahkan fungsi `getMonthDateRange` dan perbarui `getTodayDateString` di `src/lib/date-utils.ts`:
```ts
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Mendapatkan representasi tanggal hari ini dalam format YYYY-MM-DD sesuai waktu lokal Indonesia (WIB UTC+7)
 */
export function getTodayDateString(): string {
	const now = new Date();
	const wibDate = new Date(now.getTime() + WIB_OFFSET_MS);
	return wibDate.toISOString().split("T")[0];
}

/**
 * Menghitung batas awal dan akhir bulan dalam zona waktu Indonesia (WIB UTC+7)
 * Menghasilkan objek Date yang valid untuk query PostgreSQL Prisma
 */
export function getMonthDateRange(
	month: number,
	year: number,
): { startDate: Date; endDate: Date } {
	// Bulan 1-12
	// Batas awal: tanggal 1 pukul 00:00:00.000 WIB
	const startUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - WIB_OFFSET_MS;
	// Batas akhir: tanggal terakhir pukul 23:59:59.999 WIB
	const endUtcMs = Date.UTC(year, month, 0, 23, 59, 59, 999) - WIB_OFFSET_MS;

	return {
		startDate: new Date(startUtcMs),
		endDate: new Date(endUtcMs),
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit src/lib/date-utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/date-utils.ts src/lib/date-utils.test.ts
git commit -m "feat(date-utils): add getMonthDateRange and align getTodayDateString to WIB"
```

---

### Task 2: Service & Repository Date Range Standardization & Category Mapping

**Files:**
- Modify: `src/data/services/dashboard.service.ts:55-75, 90-110, 230-245, 428-445`
- Modify: `src/data/services/cashflow.service.ts:420-445, 550-565, 640-655, 690-705`
- Modify: `src/data/repositories/report.repository.ts:70-85, 95-105`

**Interfaces:**
- Consumes: `getMonthDateRange` from `src/lib/date-utils.ts`
- Produces:
  - `DashboardService.getOverviewData`: kembalikan `monthlyExpenseRaw`, dan perbaiki `formatJuta` agar di bawah Rp 10 juta menggunakan `formatRupiah` lengkap (misal `Rp1.140.000`), sehingga tidak ada pembulatan palsu.
  - `ReportRepository`: mapping kategori `UTILITIES` ke `"Listrik & Air"`.

- [ ] **Step 1: Update `dashboard.service.ts`**

1. Import `getMonthDateRange` dari `#/*lib/date-utils.ts`.
2. Perbaiki fungsi `formatJuta`:
```ts
	private formatJuta(val: number): string {
		if (val === 0) return "Rp0";
		// Jika nominal di bawah 10 juta, tampilkan nominal rupiah presisi penuh agar tidak membingungkan
		if (val < 10_000_000) {
			return formatRupiah(val);
		}
		const jt = val / 1_000_000;
		return `Rp${jt.toLocaleString("id-ID", {
			minimumFractionDigits: jt % 1 === 0 ? 0 : 1,
			maximumFractionDigits: 1,
		})} jt`;
	}
```
3. Gunakan `getMonthDateRange(currentMonth, currentYear)` untuk `startOfCurrentMonth` dan `endOfCurrentMonth`.
4. Pada query `recentExpenses`, ambil 3 transaksi pengeluaran terbaru tanpa terkunci hanya di bulan berjalan:
```ts
		const recentExpenseTxs = await this.db.transaction.findMany({
			where: {
				type: "EXPENSE",
				...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
			},
			include: {
				property: { select: { name: true } },
			},
			orderBy: { transactionDate: "desc" },
			take: 3,
		});
```

- [ ] **Step 2: Update `cashflow.service.ts`**

Ganti konstruksi `startOfMonth` dan `endOfMonth` di:
- `getFinancialSummary` (baris ~426-440)
- `getCostComposition` (baris ~554-560)
- `getRecentMonthlyTrends` (baris ~644-646)
- `getProfitLossStatement` (baris ~690-696)
Gunakan `getMonthDateRange(targetMonth, targetYear)`.

- [ ] **Step 3: Update `report.repository.ts`**

1. Tambahkan `UTILITIES: "Listrik & Air"` pada `getCategoryLabel`:
```ts
		const labels: Record<string, string> = {
			UTILITIES: "Listrik & Air",
			ELECTRICITY: "Listrik & Daya PLN",
			WATER: "Air Bersih PDAM",
			INTERNET: "Abonemen WiFi Indihome",
			CLEANING: "Kebersihan & Sampah",
			MAINTENANCE: "Maintenance & Perbaikan",
			SUPPLIES: "Perlengkapan & Logistik",
			SALARY: "Gaji Staf Pengelola",
			SECURITY: "Iuran Keamanan Lingkungan",
			TAX: "PBB & Pajak Usaha",
			OTHER: "Operasional Lain-lain",
			RENT: "Pendapatan Sewa Kos",
		};
```
2. Gunakan `getMonthDateRange(targetMonth, targetYear)` untuk `startDate` dan `endDate` di `getMonthlyFinancialSummary`.

- [ ] **Step 4: Verify TypeScript & Biome**

Run: `npx tsc --noEmit` dan `npm run check`
Expected: PASS tanpa error type.

- [ ] **Step 5: Commit**

```bash
git add src/data/services/dashboard.service.ts src/data/services/cashflow.service.ts src/data/repositories/report.repository.ts
git commit -m "fix(services): standardize month boundaries with getMonthDateRange and precision formatting"
```

---

### Task 3: Invalidate Dashboard Query Cache in Transaction Mutations

**Files:**
- Modify: `src/hooks/use-transactions.ts:114-124, 147-160, 172-185`

**Interfaces:**
- Produces: Query invalidation pada `["dashboard", "overview"]` dan `["dashboard-overview"]`.

- [ ] **Step 1: Tambahkan invalidasi cache dashboard pada `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`**

Di `src/hooks/use-transactions.ts`:
```ts
// Pada useCreateTransaction onSuccess:
queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: FINANCIAL_SUMMARY_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: COST_COMPOSITION_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: MONTHLY_TRENDS_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: PROFIT_LOSS_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: ANNUAL_MATRIX_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });

// Pada useUpdateTransaction onSuccess:
// Tambahkan queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
// Tambahkan queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });

// Pada useDeleteTransaction onSuccess:
// Tambahkan queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
// Tambahkan queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
```

- [ ] **Step 2: Run verification**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-transactions.ts
git commit -m "fix(hooks): invalidate dashboard overview queries on transaction mutations"
```

---

### Task 4: Precision Display on Dashboard Card (`/dashboard`)

**Files:**
- Modify: `src/routes/dashboard/index.tsx:244-257`

**Interfaces:**
- Consumes: `stats.monthlyExpense`, `stats.monthlyExpenseRaw` from `getOverviewData`

- [ ] **Step 1: Enhance "Pengeluaran Bulan Ini" Stat Card**

Di `src/routes/dashboard/index.tsx`:
```tsx
<Card
	className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
	onClick={() => navigate({ to: "/dashboard/finance" })}
>
	<div className="stat-top">
		<span>Pengeluaran Bulan Ini</span>
		<span className="stat-icon">
			<ArrowDownRight className="w-4 h-4" />
		</span>
	</div>
	<div className="stat-value">{stats.monthlyExpense}</div>
	<div className="stat-sub">
		{stats.monthlyExpenseRaw > 0 ? (
			<span className="text-[#55695a] font-medium">Bulan berjalan</span>
		) : (
			<span>Belum ada pengeluaran</span>
		)}
	</div>
</Card>
```

- [ ] **Step 2: Run verification**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/routes/dashboard/index.tsx
git commit -m "feat(dashboard): show precise monthly expense without rounding confusion"
```

---

### Task 5: Synchronize Finance Table with Active Period Filter (`/dashboard/finance`)

**Files:**
- Modify: `src/routes/dashboard/finance.tsx:174-188, 510-530`
- Modify: `src/components/finance/FinanceTransactionTable.tsx:60-85, 300-340`

**Interfaces:**
- Consumes: `selectedMonth`, `selectedYear` in `FinancePage`
- Produces: Period filter toggle ("Bulan Terpilih" vs "Semua Periode") pada `FinanceTransactionTable`.

- [ ] **Step 1: Update `FinanceTransactionTableProps` & Header Toolbar**

Di `src/components/finance/FinanceTransactionTable.tsx`:
Tambahkan prop:
- `periodFilterMode: "SELECTED_MONTH" | "ALL"`
- `onPeriodFilterModeChange: (mode: "SELECTED_MONTH" | "ALL") => void`
- `selectedPeriodLabel: string`

Tambahkan segmented toggle di samping search bar / toolbar tabel:
```tsx
<div className="flex items-center gap-1.5 p-1 bg-[#f3f7f3] rounded-lg border border-[#e4e9e4] text-xs">
	<button
		type="button"
		onClick={() => onPeriodFilterModeChange("SELECTED_MONTH")}
		className={`px-2.5 py-1 rounded-md font-medium transition-all ${
			periodFilterMode === "SELECTED_MONTH"
				? "bg-white text-[#4f6958] shadow-xs"
				: "text-[#737873] hover:text-[#252925]"
		}`}
	>
		{selectedPeriodLabel}
	</button>
	<button
		type="button"
		onClick={() => onPeriodFilterModeChange("ALL")}
		className={`px-2.5 py-1 rounded-md font-medium transition-all ${
			periodFilterMode === "ALL"
				? "bg-white text-[#4f6958] shadow-xs"
				: "text-[#737873] hover:text-[#252925]"
		}`}
	>
		Semua Periode
	</button>
</div>
```

- [ ] **Step 2: Connect Period State in `src/routes/dashboard/finance.tsx`**

1. Tambahkan state `periodFilterMode`:
```ts
const [periodFilterMode, setPeriodFilterMode] = useState<"SELECTED_MONTH" | "ALL">("SELECTED_MONTH");
```
2. Hitung `dateFilter` saat `periodFilterMode === "SELECTED_MONTH"`:
```ts
const activeDateRange = useMemo(() => {
	if (periodFilterMode === "ALL") return { startDate: undefined, endDate: undefined };
	const { startDate, endDate } = getMonthDateRange(selectedMonth.value, selectedYear.value);
	return {
		startDate: startDate.toISOString().split("T")[0],
		endDate: endDate.toISOString().split("T")[0],
	};
}, [periodFilterMode, selectedMonth.value, selectedYear.value]);
```
3. Lewatkan `startDate: activeDateRange.startDate` dan `endDate: activeDateRange.endDate` ke `useTransactions`.
4. Lewatkan `periodFilterMode`, `setPeriodFilterMode`, dan `selectedPeriodLabel: ${selectedMonth.label} ${selectedYear.value}` ke `FinanceTransactionTable`.

- [ ] **Step 3: Run verification**

Run: `npx tsc --noEmit` dan `npm run check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/routes/dashboard/finance.tsx src/components/finance/FinanceTransactionTable.tsx
git commit -m "feat(finance): synchronize transaction table with active period filter"
```

---

### Task 6: Final Verification & Test Suite Execution

**Files:**
- All touched files in Tasks 1-5

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`
Expected: ALL PASS

- [ ] **Step 2: Run TypeScript compile check**

Run: `npx tsc --noEmit`
Expected: Code 0 (No type errors)

- [ ] **Step 3: Run Biome check & formatting**

Run: `npm run check`
Expected: Code 0 (No lint errors)

- [ ] **Step 4: Commit final verification if any format tweaks needed**

```bash
git status
```
Expected: Clean working tree.
