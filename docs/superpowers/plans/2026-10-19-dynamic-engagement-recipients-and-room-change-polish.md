# Dynamic Engagement Recipient Hub, Selective Broadcast, and Room Change Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `/dashboard/engagement` left panel into a dynamic, template-reactive recipient hub with selective multi-checkbox broadcasting and 1-by-1 sending, persist custom templates in localStorage, clean up emoji clutter, enforce SuperAdmin-only broadcast dialogs, and replace confusing room-change checkboxes in `/dashboard/tenants` with clear, non-technical info callouts.

**Architecture:** Single-fetch backend query cached for 1 minute in TanStack Query (`staleTime: 60s`, `refetchInterval: 60s`) providing complete active tenant engagement metadata. Frontend performs reactive in-memory filtering (0ms latency) based on the selected template category. Multi-select and single-send WhatsApp mutations execute via Fonnte with Meta anti-ban pacing jitter and batch notification logging.

**Tech Stack:** React 19, TanStack Start (SSR), TanStack Router, TanStack Query v5, Tailwind CSS v4, Lucide React, PostgreSQL 16 + Prisma ORM.

## Global Constraints

- Strict compliance with AGENTS.md: Pure unit tests only, no live DB destructive commands, do not read `.env` directly.
- Sage Green & Cream design tokens preserved according to DESIGN.md.
- Multi-property isolation and RBAC (`ADMIN` vs `SUPER_ADMIN`) strictly enforced at server level.
- Status badges must use pure text without emojis or dots: `Terkirim Hari Ini` (green) and `Belum Dikirim` (muted).
- TypeScript strict type safety (`tsc --noEmit`) and Biome linting/formatting.

---

### Task 1: `/dashboard/tenants` Room Change & Correction Info Callout

**Files:**
- Modify: `src/components/tenant/TenantFormDialog.tsx:1395-1490`

**Interfaces:**
- Produces: Seamless room transfer/correction UX without manual checkboxes. Form values `updateCurrentInvoice: true` and `createDifferenceInvoice: true` are always auto-applied.

- [ ] **Step 1: Inspect and update TRANSFER mode in `TenantFormDialog.tsx`**
Replace the `<label><input type="checkbox" ... /></label>` for `createDifferenceInvoice` with an informative callout box. Ensure `diffField.handleChange(true)` is set by default.
When `priceDiff > 0`:
Display an info banner with `Info` icon:
`Informasi Selisih Biaya Kamar: Tagihan selisih kamar sebesar +Rp X akan otomatis dibuat untuk bulan ini. Tagihan bulan depan otomatis mengikuti tarif kamar baru (Rp Y).`
When `priceDiff <= 0`:
Display an info banner:
`Tidak ada tagihan selisih biaya karena tarif kamar baru sama atau lebih terjangkau. Tarif baru otomatis berlaku mulai periode sewa berikutnya.`

- [ ] **Step 2: Inspect and update CORRECTION mode in `TenantFormDialog.tsx`**
Replace the checkbox for `updateCurrentInvoice` with an informative callout banner:
When `priceDiffers`:
Display: `Tagihan bulan ini akan otomatis disesuaikan mengikuti harga kamar yang benar (Rp X ➔ Rp Y).`
When `!priceDiffers`:
Display: `Tarif kamar baru sama, tagihan bulan ini tetap berjalan normal.`
Ensure `invField.handleChange(true)` is set by default.

- [ ] **Step 3: Verify TypeScript and Biome**
Run `npx tsc --noEmit` and Biome formatting.

- [ ] **Step 4: Commit Task 1**
`git add src/components/tenant/TenantFormDialog.tsx && git commit -m "feat(tenants): replace room change checkboxes with clear informative callout banners"`

---

### Task 2: Template Persistence, Category Selector & Selector Cleanup in Engagement

**Files:**
- Modify: `src/common/types/engagement.types.ts`
- Modify: `src/components/engagement/EngagementTemplateDialog.tsx`
- Modify: `src/components/engagement/EngagementEventDialog.tsx`
- Modify: `src/routes/dashboard/engagement.tsx`

**Interfaces:**
- Consumes: `EngagementTemplateItem`, `isSuperAdmin` from `useDashboardContext()`.
- Produces: Persisted custom templates in `localStorage` (`homeekost_engagement_templates`), clean Lucide icons in `EngagementEventDialog`, label `"Semua Cabang"`, and SuperAdmin-only broadcast button visibility.

- [ ] **Step 1: Add Category Selector to `EngagementTemplateDialog.tsx`**
Update form state in `EngagementTemplateDialog.tsx` to include `category`:
Options: `"Sambutan"`, `"Pembayaran"`, `"Ulang Tahun"`, `"Kerja Bakti"`, `"Umum"`.
Add icons based on category.

- [ ] **Step 2: Add `localStorage` Persistence in `src/routes/dashboard/engagement.tsx`**
Create helper to load templates: `JSON.parse(localStorage.getItem("homeekost_engagement_templates") || "null") || DEFAULT_TEMPLATES`.
In `handleSaveTemplate` and `handleDeleteTemplate`: save updated templates to `localStorage.setItem("homeekost_engagement_templates", JSON.stringify(updated))`.

- [ ] **Step 3: Clean up Emojis in `EngagementEventDialog.tsx` & Change Label**
In `EngagementEventDialog.tsx`:
- Replace emoji labels in `CATEGORY_OPTIONS` with text and Lucide icons:
  `UMUM`: `Megaphone`, `KERJA_BAKTI`: `Sparkles`, `MAINTENANCE`: `Wrench`, `ACARA`: `PartyPopper`.
- Change label `"📢 Semua Cabang Kos (Global)"` to `"Semua Cabang"`, using `Building2` icon.
- In `propertyOptions`: replace `🏠 ${p.name}` with clean `${p.name}` and `Building2` icon.

- [ ] **Step 4: Restrict "Buat Broadcast" and Dialog to SuperAdmin Only**
In `src/routes/dashboard/engagement.tsx`:
- Wrap the "Buat Broadcast" button and "Gunakan untuk Broadcast" button with `{isSuperAdmin && (...)}`.
- If user is not `isSuperAdmin`, `isEventDialogOpen` cannot be triggered.

- [ ] **Step 5: Verify TypeScript and Biome**
Run `npx tsc --noEmit`.

- [ ] **Step 6: Commit Task 2**
`git add src/common/types/engagement.types.ts src/components/engagement/EngagementTemplateDialog.tsx src/components/engagement/EngagementEventDialog.tsx src/routes/dashboard/engagement.tsx && git commit -m "feat(engagement): persist templates in localStorage, clean up selector emojis, and enforce SuperAdmin RBAC"`

---

### Task 3: Backend Single-Fetch Recipient Dataset & Multi-Select Broadcast Mutations

**Files:**
- Modify: `src/common/types/engagement.types.ts`
- Modify: `src/data/repositories/engagement.repository.ts`
- Modify: `src/data/services/engagement.service.ts`
- Modify: `src/data/servers/engagement.fn.ts`
- Modify: `src/hooks/use-engagement.ts`

**Interfaces:**
- Produces:
  - `EngagementRecipient` type.
  - `getActiveTenantsWithEngagementMetadata(propertyIds?: string[])` in repository.
  - `recipients: EngagementRecipient[]` in `getEngagementDashboard`.
  - `broadcastToSelectedRecipients` & `sendSingleTemplateMessage` in service & server functions.
  - Hooks: `useBroadcastToSelectedRecipients`, `useSendSingleTemplateMessage`.

- [ ] **Step 1: Define `EngagementRecipient` in `src/common/types/engagement.types.ts`**
Add:
```ts
export interface EngagementRecipient {
	tenantId: string;
	name: string;
	phone: string;
	roomNumber: string;
	propertyId: string;
	propertyName: string;
	startDate: string;
	birthDate?: string | null;
	daysRemaining?: number | null;
	relativeBirthdayLabel?: string | null;
	lastPaymentDate?: string | null;
	isOnTimePayment?: boolean;
	isSentToday?: boolean;
}
```

- [ ] **Step 2: Add `getActiveTenantsWithEngagementMetadata` to `engagement.repository.ts`**
Fetch active rental contracts with tenant, room, and property.
Also query recent transactions for these tenants to determine `lastPaymentDate` and `isOnTimePayment` (paid before or on day 5).
Cross-reference recipient phone numbers with `getTodaySentNotificationLogs` to set `isSentToday: true`.

- [ ] **Step 3: Enrich `getEngagementDashboard` in `engagement.service.ts`**
Call `this.repo.getActiveTenantsWithEngagementMetadata(propertyIds)` and include `recipients` in the returned object.

- [ ] **Step 4: Implement `sendSingleTemplateMessage` and `broadcastToSelectedRecipients` in `engagement.service.ts`**
Support token replacement `{nama}`, `{kamar}`, `{kos}`.
Add Meta anti-ban pacing jitter (`sleepWithJitter(800, 400)`) between sends.
Insert batch notification logs via `recordNotificationLogsBatch`.

- [ ] **Step 5: Create Server Functions & Hooks**
Expose `sendSingleTemplateMessageFn` and `broadcastToSelectedRecipientsFn` in `src/data/servers/engagement.fn.ts`.
Create `useSendSingleTemplateMessage` and `useBroadcastToSelectedRecipients` in `src/hooks/use-engagement.ts`.
Invalidate `["engagement", "dashboard"]` on success.

- [ ] **Step 6: Verify TypeScript and Biome**
Run `npx tsc --noEmit`.

- [ ] **Step 7: Commit Task 3**
`git add src/common/types/engagement.types.ts src/data/repositories/engagement.repository.ts src/data/services/engagement.service.ts src/data/servers/engagement.fn.ts src/hooks/use-engagement.ts && git commit -m "feat(engagement): add single-fetch recipients query and selective broadcast mutations"`

---

### Task 4: Dynamic Recipient Panel Component & Pure Filter Logic

**Files:**
- Create: `src/lib/engagement-utils.ts`
- Create: `tests/unit/engagement-utils.test.ts`
- Create: `src/components/engagement/EngagementDynamicRecipientPanel.tsx`
- Modify: `src/components/engagement/index.ts`

**Interfaces:**
- Consumes: `EngagementRecipient[]`, `selectedTemplate`, `selectedPropertyId`.
- Produces: `EngagementDynamicRecipientPanel` component with selective multi-checkbox and single-send action.

- [ ] **Step 1: Write pure filtering & personalization utilities in TDD style**
Create `src/lib/engagement-utils.ts`:
- `filterRecipientsByTemplate(recipients, templateCategory, selectedPropertyId)`:
  - `"Sambutan"`: `startDate` within last 30 days.
  - `"Ulang Tahun"`: `daysRemaining >= 0 && daysRemaining <= 5`.
  - `"Pembayaran"`: `isOnTimePayment === true` within last 14 days.
  - Other: all active tenants.
- `personalizeMessage(content, recipient)`: replaces `{nama}`, `{kamar}`, `{kos}`.
Write unit tests in `tests/unit/engagement-utils.test.ts` and verify they pass.

- [ ] **Step 2: Build `EngagementDynamicRecipientPanel.tsx`**
Create component with:
- Dynamic Header based on active template category with count.
- Subtitle explaining the active filter criteria.
- Selection Bar: Checkbox "Pilih Semua", counter "(N) dari (M) dipilih", button `Broadcast ke (N) Terpilih`.
- Recipient items: Checkbox, Name, Room, Property, context tag, status badge (`Terkirim Hari Ini` vs `Belum Dikirim`), and `Kirim` button.
- Export in `src/components/engagement/index.ts`.

- [ ] **Step 3: Verify TypeScript and Biome**
Run `npx tsc --noEmit` and Biome format.

- [ ] **Step 4: Commit Task 4**
`git add src/lib/engagement-utils.ts tests/unit/engagement-utils.test.ts src/components/engagement/EngagementDynamicRecipientPanel.tsx src/components/engagement/index.ts && git commit -m "feat(engagement): create EngagementDynamicRecipientPanel with selective multi-broadcast and pure filter utils"`

---

### Task 5: Integration in `/dashboard/engagement.tsx` & Cache Tuning

**Files:**
- Modify: `src/routes/dashboard/engagement.tsx`

**Interfaces:**
- Replaces `EngagementBirthdayPanel` with `EngagementDynamicRecipientPanel`.
- Tunes TanStack Query with `staleTime: 60 * 1000` and `refetchInterval: 60 * 1000`.

- [ ] **Step 1: Update TanStack Query options for Engagement Dashboard**
In `src/hooks/use-engagement.ts` or `src/routes/dashboard/engagement.tsx`:
Set `staleTime: 60 * 1000` and `refetchInterval: 60 * 1000`.

- [ ] **Step 2: Mount `EngagementDynamicRecipientPanel` in left column**
In `src/routes/dashboard/engagement.tsx`:
Wire `engagementData?.recipients` to `EngagementDynamicRecipientPanel`.
Connect `handleSendSingle` and `handleBroadcastSelected` with mutations and toast messages.

- [ ] **Step 3: Verify TypeScript and Biome**
Run `npx tsc --noEmit`.

- [ ] **Step 4: Commit Task 5**
`git add src/routes/dashboard/engagement.tsx src/hooks/use-engagement.ts && git commit -m "feat(engagement): integrate dynamic recipient panel and tune 1-minute query caching"`

---

### Task 6: Final Verification, Unit Tests & Production Build

**Files:**
- All modified files

- [ ] **Step 1: Run all unit tests**
Run `npm run test:unit`. Ensure all unit tests pass.

- [ ] **Step 2: Run TypeScript compile check**
Run `npx tsc --noEmit`. Ensure 0 errors.

- [ ] **Step 3: Run Biome lint & format check**
Run `npx @biomejs/biome check --write` on modified files.

- [ ] **Step 4: Run fullstack build verification**
Run `npm run build`. Ensure production SSR build succeeds.

- [ ] **Step 5: Commit final verification**
`git add -u && git commit -m "chore: final verification for dynamic engagement recipients and room change polish"`
