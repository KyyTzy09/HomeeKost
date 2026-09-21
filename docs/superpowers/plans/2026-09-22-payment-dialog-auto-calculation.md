# PaymentFormDialog Auto-Calculation & Rent Duration Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-calculation of invoice amount based on tenant's rent cycle (Monthly, Quarterly, Semi-Annual, Annual), auto-compute dueDate from tenant contract data, and render a Sage & Cream styled calculation card in `PaymentFormDialog.tsx`.

**Architecture:** Detect tenant duration in `PaymentFormDialog.tsx`, calculate total nominal (`monthlyRent * cycleMonths`), auto-generate `dueDate` formatted as `YYYY-MM-DD` without manual calendar input, and render an informative summary card showing tenant lease details and multiplier breakdown.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React (`Info`, `Calendar`, `DollarSign`, `Clock`), TanStack Start.

## Global Constraints
- Never read `.env` files or credentials directly without explicit user permission.
- Design tokens must strictly match Sage & Cream palette (`#4f6958`, `#e4e9e4`, `#fbfcfb`, `#252925`, `#737873`, `#f3f7f3`).
- No automated functional/E2E browser tests.
- All changes must pass `npx tsc --noEmit` and `npm run test:unit`.

---

### Task 1: Add Auto-Calculation and Information Card to `PaymentFormDialog.tsx`

**Files:**
- Modify: `src/components/payment/PaymentFormDialog.tsx`

**Interfaces:**
- Consumes: `TenantItem.duration`, `TenantItem.rent`, `TenantItem.dueDate`
- Produces: Form with auto-computed amount, auto-computed dueDate, and lease summary card.

- [ ] **Step 1: Define cycle multiplier helper**

In `src/components/payment/PaymentFormDialog.tsx`:
Add helper to get cycle multiplier in months:
```tsx
function getCycleMultiplier(duration?: string): { months: number; label: string } {
	switch (duration) {
		case "Tahunan":
			return { months: 12, label: "Tahunan (12 Bulan)" };
		case "Semesteran":
			return { months: 6, label: "Semesteran (6 Bulan)" };
		case "Triwulan":
			return { months: 3, label: "Triwulan (3 Bulan)" };
		case "Bulanan":
		default:
			return { months: 1, label: "Bulanan (1 Bulan)" };
	}
}
```

- [ ] **Step 2: Update selection handler to auto-calculate amount and dueDate**

When a tenant is selected:
- Extract `cycle = getCycleMultiplier(tenant.duration)`
- `monthly = parseRupiah(tenant.rent) || 850000`
- `setAmount(monthly * cycle.months)`
- Compute `dueDate`: Extract day from `tenant.dueDate` (e.g., regex `/\d+/` or default `10`), format to `${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`.

- [ ] **Step 3: Render Lease Information & Calculation Card**

Replace the manual date picker input with a styled preview card:
```tsx
{selectedTenant && (
	<div className="p-3 rounded-xl bg-[#f3f7f3] border border-[#e4e9e4] space-y-2">
		<div className="flex items-center justify-between text-xs">
			<span className="text-[#737873] flex items-center gap-1.5 font-medium">
				<Clock className="w-3.5 h-3.5 text-[#4f6958]" />
				Siklus Sewa:
			</span>
			<span className="font-semibold text-[#4f6958] bg-white px-2 py-0.5 rounded-md border border-[#e4e9e4]">
				{cycleInfo.label}
			</span>
		</div>
		<div className="flex items-center justify-between text-xs">
			<span className="text-[#737873] font-medium">Tarif Kamar:</span>
			<span className="font-semibold text-[#252925]">
				{selectedTenant.rent} / bln
			</span>
		</div>
		<div className="flex items-center justify-between text-xs">
			<span className="text-[#737873] font-medium">Jatuh Tempo:</span>
			<span className="font-semibold text-[#252925]">
				{selectedTenant.dueDate || `Tanggal ${dueDay} tiap bulan`}
			</span>
		</div>
		<div className="pt-2 border-t border-[#e4e9e4]/80 flex items-center justify-between text-xs">
			<span className="text-[#737873] font-medium">Kalkulasi Otomatis:</span>
			<span className="font-bold text-[#4f6958]">
				{cycleInfo.months} bln × {selectedTenant.rent} = {formatRupiah(cycleInfo.months * monthlyRent)}
			</span>
		</div>
	</div>
)}
```

- [ ] **Step 4: Update Amount input helper text**

Below the Amount input, show a small hint:
`"Nominal otomatis terhitung sesuai siklus sewa (dapat disesuaikan jika perlu)"`.

- [ ] **Step 5: Run Verification**
Run:
`npx tsc --noEmit`
`npm run test:unit`
`npm run build`
Commit changes:
`feat(payment): add auto-calculation and rent cycle display to payment form dialog`
