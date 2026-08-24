# Rencana & Spesifikasi Desain: Optimasi Performa Rendering & Navigasi (Route Loader + TanStack Query Prefetching)

> **Status**: Validated Design Blueprint  
> **Referensi**: `PRD.md`, `Todo.md`, `ARCHITECTURE.md`, `DESIGN.md`

---

## 1. Ringkasan Eksekutif & Akar Masalah

Berdasarkan audit performa aplikasi pada lingkungan staging & development, ditemukan 3 bottleneck utama yang memperlambat render dan navigasi:
1. **Client-Side Waterfall**: Sub-halaman tidak memiliki `loader` di level route, sehingga data baru ditembakkan setelah komponen client di-mount, menimbulkan layout shift dan loading flicker.
2. **`beforeLoad` Blocking Round-Trip**: Layout parent `/dashboard` memanggil server session RPC pada setiap navigasi internal tanpa caching di level router context.
3. **`staleTime: 0` Default**: QueryClient menganggap seluruh data usang seketika, memicu refetch berulang saat berpindah halaman.

### Solusi Arsitektur (TanStack Best Practices):
- **QueryClient Global Caching**: Menetapkan `staleTime: 30s` dan `gcTime: 5m` secara global.
- **Centralized Query Options**: Mendefinisikan helper `queryOptions` terpusat per domain data.
- **Route Loader Prefetching (`ensureQueryData`)**: Setiap sub-route memanggil `ensureQueryData` di dalam `loader` untuk melakukan prefetching data sebelum komponen dirender.
- **Hover Intent Preloading**: Memanfaatkan fitur bawaan `defaultPreload: "intent"` pada TanStack Router.
- **Session Cache di Parent Route**: Memanfaatkan `queryClient.ensureQueryData` untuk session context di `/dashboard` `beforeLoad`.

---

## 2. Running Decision Log

| ID | Keputusan | Alternatif yang Dipertimbangkan | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **D9** | Menerapkan pola **Standard Query Options + `ensureQueryData` di Route `loader`** dengan *Intent Preload*. | Return data langsung dari loader ke `initialData` `useQuery`; Full Server-Side Rendered HTML. | Mencegah bug tumpang tindih cache, mendukung hover preloading otomatis, dan memberikan navigasi instan 0ms. |
| **D10** | Konfigurasi global **`staleTime: 30 detik`** dan **`gcTime: 5 menit`** pada `QueryClient`. | `staleTime: 0` (default); `staleTime: Infinity`. | Memberikan keseimbangan sempurna antara data selalu up-to-date dan transisi halaman super cepat tanpa refetch berlebih. |
| **D11** | Optimasi Parent `beforeLoad` di `/dashboard` menggunakan **Session Query Options Cache**. | Membiarkan pemanggilan `getDashboardContextServerFn` terus-menerus pada setiap klik link. | Menghilangkan network round-trip blocking saat berpindah menu internal dashboard. |

---

## 3. Rencana Tahapan Eksekusi Teknis

1. **Tahap 1: Konfigurasi Global QueryClient**
   - Update `src/common/integrations/tanstack-query/root-provider.tsx` dengan `defaultOptions` (`staleTime: 30000`, `gcTime: 300000`, `refetchOnWindowFocus: false`).
2. **Tahap 2: Buat Helper Query Options Terpusat**
   - Buat file `src/hooks/query-options.ts` yang menampung `queryOptions` untuk:
     - Session / Dashboard Context (`sessionContextQueryOptions`)
     - Dashboard Overview Data (`dashboardOverviewQueryOptions`)
     - Properti & Cabang Kos (`propertiesQueryOptions`, `propertyDetailQueryOptions`)
     - Kamar (`roomsQueryOptions`)
     - Penyewa (`tenantsQueryOptions`)
     - Pembayaran & Invoices (`paymentsQueryOptions`, `invoicesQueryOptions`)
     - Keuangan / Arus Kas (`financeTransactionsQueryOptions`, `annualMatrixQueryOptions`)
     - Engagement (`engagementQueryOptions`)
     - Laporan Bulanan (`monthlyReportQueryOptions`)
     - User Management (`usersQueryOptions`)
3. **Tahap 3: Update Hooks agar Menggunakan Query Options Terpusat**
   - Selaraskan `useDashboardData`, `useRooms`, `useTenants`, `usePayments`, `useInvoices`, `useFinanceTransactions`, `useMonthlyReport`, dll.
4. **Tahap 4: Implementasikan `loader` pada Seluruh Route Dashboard**
   - Update `src/routes/dashboard.tsx` (`beforeLoad` caching)
   - Update `src/routes/dashboard/index.tsx`
   - Update `src/routes/dashboard/select-property.tsx` & `properties.$propertyId.tsx`
   - Update `src/routes/dashboard/rooms.tsx`
   - Update `src/routes/dashboard/tenants.tsx`
   - Update `src/routes/dashboard/payments.tsx` & `invoices.tsx`
   - Update `src/routes/dashboard/finance.tsx`
   - Update `src/routes/dashboard/reports.tsx`
   - Update `src/routes/dashboard/engagement.tsx`
   - Update `src/routes/dashboard/users.tsx` & `profile.tsx`
5. **Tahap 5: Verifikasi Statis & TypeScript Check**
   - Jalankan `npx tsc --noEmit` dan `npx biome check src` untuk menjamin zero error.
