# SuperAdmin Dynamic Report Automation Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist executive monthly report automation settings into PostgreSQL, restrict schedule control to `SUPER_ADMIN`, and enable an hourly cron runner that matches execution to the configured day & hour in WIB.

**Architecture:** A generic `SystemSetting` model stores the JSON configuration. `ReportService` reads these settings, matches current WIB day/hour in the hourly cron trigger, and sends the AI monthly report WhatsApp summary to the configured Owner phone number. TanStack Server Functions expose secured mutations restricted to `SUPER_ADMIN`.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, React 19, PostgreSQL 16, Prisma ORM, Vitest, Zod, Tailwind CSS.

## Global Constraints
- Strict compliance with `AGENTS.md`: Pure unit tests only for deterministic functions, no direct destructive DB commands, no automated E2E scripts.
- Multi-property isolation and RBAC (`SUPER_ADMIN` vs `ADMIN`) strictly enforced.
- Sage Green & Cream tokens preserved according to `DESIGN.md`.
- Timezone calculations strictly aligned to Indonesian Western Time (WIB, UTC+7).
- TypeScript compile check (`tsc --noEmit`) and Biome check (`npm run check`) must pass cleanly.

---

## File Structure Map
- `fullstack/prisma/schema.prisma`: Add `SystemSetting` model.
- `fullstack/src/data/repositories/system-setting.repository.ts`: Key-value repository for system settings.
- `fullstack/src/data/services/report.service.ts`: Methods `getAutomationSettings`, `updateAutomationSettings`, and hourly cron filter logic in `runMonthlyReportCron`.
- `fullstack/src/data/servers/report.fn.ts`: Server functions `getReportAutomationSettingsServerFn` and `updateReportAutomationSettingsServerFn`.
- `fullstack/src/hooks/use-reports.ts`: Query and mutation hooks for report automation settings.
- `fullstack/src/routes/api/cron/monthly-reports.ts`: Enhanced cron route receiving hourly calls and returning detailed schedule verdicts.
- `fullstack/src/routes/dashboard/reports.tsx`: Connect UI to server hooks, wrap controls in `isSuperAdmin` check, and eliminate legacy `localStorage` usage.
- `fullstack/tests/unit/report-automation-scheduler.test.ts`: Pure unit tests validating WIB hour and day schedule matching logic.

---

## Tasks

### Task 1: Database Model & System Setting Repository
- [x] Add `SystemSetting` model in `fullstack/prisma/schema.prisma` (`id`, `key`, `value`, `createdAt`, `updatedAt`).
- [x] Run `bunx prisma generate` in `fullstack`.
- [x] Create `fullstack/src/data/repositories/system-setting.repository.ts` with `getSetting<T>` and `setSetting<T>`.
- [x] Run `npx tsc --noEmit` and Biome format.
- [x] Commit: `feat(db): add SystemSetting model and repository`

### Task 2: Service Schedule Matching Logic & Unit Tests
- [x] Create pure helper utility for schedule matching in `src/lib/schedule-utils.ts` (checks if given timestamp in WIB matches `scheduleDay` and `scheduleTime`).
- [x] Write unit test `tests/unit/report-automation-scheduler.test.ts` covering:
  - Exact match of date & hour -> returns `true`.
  - Mismatched day -> returns `false`.
  - Mismatched hour -> returns `false`.
  - Timezone UTC vs WIB offset (+7h) handled accurately.
- [x] Verify unit tests pass: `npm run test:unit`.
- [x] Implement `getAutomationSettings`, `updateAutomationSettings`, and time-matching logic in `ReportService.runMonthlyReportCron()`.
- [x] Update `src/routes/api/cron/monthly-reports.ts` to surface skipped vs executed status.
- [x] Run `npx tsc --noEmit` and Biome check.
- [x] Commit: `feat(report): implement persistent automation settings and hourly schedule matcher`

### Task 3: Server Functions & React Query Hooks
- [x] In `src/data/servers/report.fn.ts`, add:
  - `getReportAutomationSettingsServerFn`: fetches current settings.
  - `updateReportAutomationSettingsServerFn`: validates with `automationSettingsSchema` and checks `user.role?.name === "SUPER_ADMIN"`.
- [x] In `src/hooks/use-reports.ts`, add:
  - `useReportAutomationSettings()`
  - `useUpdateReportAutomationSettings()`
- [x] Run `npx tsc --noEmit` and Biome check.
- [x] Commit: `feat(servers): add server functions and hooks for report automation settings`

### Task 4: UI Integration & SuperAdmin Guard in `/dashboard/reports`
- [x] In `src/routes/dashboard/reports.tsx`:
  - Fetch settings via `useReportAutomationSettings()`.
  - Replace `handleSaveAutomationSettings` to trigger `updateMutation.mutateAsync(values)` with toast notification.
  - Wrap `<ReportAutomationCard>` and `<AutomationSettingsDialog>` with `{isSuperAdmin && (...)}`.
  - Remove `AUTOMATION_STORAGE_KEY` and legacy `localStorage` read/write calls.
- [x] Run `npx tsc --noEmit` and Biome check.
- [x] Commit: `feat(ui): connect report automation settings to DB and guard with SuperAdmin role`

### Task 5: Static Analysis, Pure Unit Tests & Crontab Documentation
- [x] Run complete unit test suite: `npm run test:unit`.
- [x] Run TypeScript compile check: `npx tsc --noEmit`.
- [x] Run Biome lint & format: `npm run check`.
- [x] Update `fullstack/docs/Todo.md` to reflect dynamic report cron completion.
- [x] Commit: `chore: verify type safety, tests, and documentation`
