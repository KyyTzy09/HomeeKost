# Searchable Tenant Combobox in PaymentFormDialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a searchable, scroll-constrained combobox dropdown for tenant selection in `PaymentFormDialog.tsx` so administrators can search by tenant name or room number without visual overflow.

**Architecture:** Replace the standard Radix/Shadcn `<Select>` component for the tenant/room picker with an accessible, styled popover combobox adhering to the Sage & Cream design system. The combobox features a trigger button, an absolute dropdown container with sticky real-time text filter, a constrained `max-h-56` scrollable list, selection indicators, and click-outside dismissal.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React (`ChevronsUpDown`, `Search`, `Check`), TanStack Start.

## Global Constraints

- Never read `.env` files or credentials directly without explicit user permission.
- Design tokens must strictly match Sage & Cream palette (`#4f6958`, `#e4e9e4`, `#fbfcfb`, `#252925`, `#737873`).
- No automated functional/E2E browser tests (all testing by agent is strictly unit tests and static code analysis).
- All changes must pass `npx tsc --noEmit` and `npm run test:unit` without regression.

---

### Task 1: Refactor Tenant Selector to Searchable Combobox in `PaymentFormDialog.tsx`

**Files:**
- Modify: `fullstack/src/components/payment/PaymentFormDialog.tsx`

**Interfaces:**
- Consumes: `TenantItem[]` from `PaymentFormDialogProps`, `parseRupiah` from `src/lib/currency.ts`
- Produces: Updated `PaymentFormDialog` with searchable combobox dropdown and height constraint.

- [ ] **Step 1: Add icons and local states for combobox**

In `fullstack/src/components/payment/PaymentFormDialog.tsx`:
Add Lucide icons `Check`, `ChevronsUpDown`, and `Search`.
Add local states:
```tsx
const [tenantQuery, setTenantQuery] = useState<string>("");
const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState<boolean>(false);
const tenantComboboxRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Add click-outside listener and query filter logic**

Add `useEffect` to handle clicking outside `tenantComboboxRef` to automatically close `isTenantDropdownOpen`:
```tsx
useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (
            tenantComboboxRef.current &&
            !tenantComboboxRef.current.contains(event.target as Node)
        ) {
            setIsTenantDropdownOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

Add filtered tenant list calculation:
```tsx
const filteredTenants = useMemo(() => {
    const q = tenantQuery.trim().toLowerCase();
    if (!q) return activeTenantsWithRoom;
    return activeTenantsWithRoom.filter(
        (t) =>
            t.name.toLowerCase().includes(q) ||
            t.roomNo.toLowerCase().includes(q) ||
            (t.phone && t.phone.includes(q)),
    );
}, [tenantQuery, activeTenantsWithRoom]);
```

- [ ] **Step 3: Replace Select with Combobox Markup**

Replace `<Select>` in the tenant picker section with the searchable combobox:
```tsx
{/* Searchable Combobox Penghuni & Kamar */}
<div className="space-y-1.5 relative" ref={tenantComboboxRef}>
    <Label className="text-xs font-semibold text-[#252925] mb-1 block">
        Pilih Penghuni & Kamar *
    </Label>
    <button
        type="button"
        onClick={() => setIsTenantDropdownOpen((prev) => !prev)}
        className="w-full h-10 px-3 border border-[#e4e9e4] rounded-lg bg-[#fbfcfb] text-left text-xs flex items-center justify-between hover:border-[#8fa594] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8fa594]/20"
    >
        <span
            className={
                selectedTenantLabel
                    ? "text-[#252925] font-medium truncate"
                    : "text-[#737873]"
            }
        >
            {selectedTenantLabel || "Pilih / Cari Penghuni & Kamar..."}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-[#737873] shrink-0 ml-2" />
    </button>

    {isTenantDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e9e4] rounded-xl shadow-xl z-50 p-2 space-y-1">
            <div className="relative mb-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#737873]" />
                <input
                    type="text"
                    placeholder="Ketik nama atau nomor kamar..."
                    value={tenantQuery}
                    onChange={(e) => setTenantQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e4e9e4] rounded-lg outline-none focus:border-[#4f6958] bg-[#fbfcfb]"
                    autoFocus
                />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filteredTenants.length === 0 ? (
                    <div className="py-3 text-center text-xs text-[#737873]">
                        Penghuni tidak ditemukan
                    </div>
                ) : (
                    filteredTenants.map((t) => {
                        const isSelected = (t.contractId || t.id) === contractId;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                    setContractId(t.contractId || t.id);
                                    setAmount(parseRupiah(t.rent) || 850000);
                                    setIsTenantDropdownOpen(false);
                                    setTenantQuery("");
                                }}
                                className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between hover:bg-[#f3f7f3] transition-colors ${
                                    isSelected
                                        ? "bg-[#f3f7f3] font-semibold text-[#4f6958]"
                                        : "text-[#252925]"
                                }`}
                            >
                                <div className="truncate pr-2">
                                    <div className="font-medium text-[#252925] truncate">
                                        {t.name}
                                    </div>
                                    <div className="text-[11px] text-[#737873]">
                                        Kamar {t.roomNo} · {t.rent}/bln
                                    </div>
                                </div>
                                {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#4f6958] shrink-0" />
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    )}

    {errors.contractId && (
        <p className="text-[11px] text-[#a65f5b] mt-1">
            {errors.contractId}
        </p>
    )}
</div>
```

- [ ] **Step 4: Reset state when dialog re-opens or closes**

In the `useEffect` listening to `open`, ensure `setTenantQuery("")` and `setIsTenantDropdownOpen(false)` are triggered.

---

### Task 2: Verification and Quality Assurance

**Files:**
- Test/Verify: `fullstack/src/components/payment/PaymentFormDialog.tsx`

- [ ] **Step 1: TypeScript typecheck**

Run command in `fullstack`:
```bash
npx tsc --noEmit
```
Expected output: No errors.

- [ ] **Step 2: Run unit test suite**

Run command in `fullstack`:
```bash
npm run test:unit
```
Expected output: All 51 tests pass.

- [ ] **Step 3: Run production build verification**

Run command in `fullstack`:
```bash
npm run build
```
Expected output: Vite client and SSR server bundles successfully generated without warnings.

- [ ] **Step 4: Commit changes**

Commit changes:
```bash
git add src/components/payment/PaymentFormDialog.tsx
git commit -m "feat(payment): add searchable combobox with max height limit to payment form dialog"
```
