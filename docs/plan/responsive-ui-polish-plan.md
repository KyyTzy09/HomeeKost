# Rencana & Spesifikasi Desain: Audit Responsif & Poles Antarmuka (Phase 10.2)
## HomeeKost — Multi-Property Kost Management Platform

> **Status**: Validated Design Blueprint  
> **Referensi**: `DESIGN.md`, `KostManagement.html`, `ARCHITECTURE.md`, `PRD.md`, `AGENTS.md`

---

## 1. Understanding Summary (Ringkasan Pemahaman)

- **Tujuan**: Memastikan antarmuka seluruh modul HomeeKost tampil presisi, rapi, dan konsisten dengan sistem desain Sage Green (`#4F6958` / `#718B78`) & Cream (`#FAF9F5`), serta memiliki daya adaptasi optimal di seluruh resolusi layar (Desktop, Tablet, dan Smartphone).
- **Pengguna Target**: Pemilik Kos (*SuperAdmin*) dan Staf Pengelola (*Admin*).
- **Cakupan Area**:
  1. **Shell Navigasi Global**: Fixed Desktop Sidebar (244px), Mobile Off-Canvas Drawer (Sheet), Sticky Topbar (72px/60px), Search Dialog, dan Global Property Switcher.
  2. **Seluruh Halaman Inti**: Overview Dashboard, Manajemen Properti, Grid Kamar, Tabel Penyewa, Arus Kas & Keuangan, Tagihan & Pembayaran, Invoices Split-View, Engagement Hub & Agenda, Laporan AI & Matriks CSV, User Management, dan Profil Pengelola.
  3. **Komponen Dialog & Modal**: Form dialog responsif dengan fixed header, scrollable body (`max-h-[75vh]`), dan fixed footer.
- **Batasan Utama**:
  - Halaman Split-View (Invoice) menggunakan **Tab Segmented Switcher** pada layar `<1050px` ("Daftar Tagihan" vs "Pratinjau Dokumen").
  - Menghindari regresi logika bisnis atau mutasi skema basis data PostgreSQL.
  - Pengujian dilakukan melalui verifikasi statis (`tsc --noEmit` & Biome check), sedangkan pengujian fungsional interaktif dilakukan secara manual oleh User (sesuai `AGENTS.md`).

---

## 2. Asumsi & Kebutuhan Non-Fungsional

1. **Breakpoints Standar**:
   - **Desktop XL / Desktop**: `>1050px` (Sidebar 244px, grid 3-4 kolom, max container 1550px).
   - **Tablet**: `761px – 1050px` (Drawer/condensed sidebar, grid 2 kolom, padding 20px).
   - **Mobile**: `<=760px` (Off-canvas drawer, layout 1 kolom, padding 16px, sticky topbar 60px).
   - **Small Mobile**: `<=480px` (Tipografi ringkas, touch target 44x44px).
2. **Performa & Animasi**: Mikro-interaksi CSS transition `150ms – 250ms cubic-bezier(0.4, 0, 0.2, 1)`, zero layout shifts (CLS < 0.1).
3. **Tabel Data Mobile**: Kontainer `overflow-x-auto` dengan shadow indikator scroll halus.

---

## 3. Decision Log (Catatan Keputusan Desain)

| ID | Keputusan | Alternatif yang Dipertimbangkan | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **D1** | Memprioritaskan **Phase 10.2: Audit Responsif & Polish Antarmuka** sebelum modul baru. | Mengerjakan Phase 9.1 CCTV stream; Membuat checklist testing manual. | Memastikan 10 modul utama yang sudah dibangun benar-benar solid, rapi, dan nyaman dipakai di semua gawai. |
| **D2** | Menggunakan pendekatan **Systematic Modular Sweep** (Shell ke setiap modul). | Refaktor global CSS utility; Patching cepat hanya di mobile. | Pendekatan terstruktur dan aman dari risiko regresi visual, menjaga konsistensi desktop & mobile. |
| **D3** | Menggunakan **Tab Segmented Switcher** untuk Split-View Invoices di layar `<1050px`. | Menumpuk daftar tagihan & PDF secara vertikal (*stacked*). | Pratinjau invoice PDF A4 membutuhkan lebar yang cukup agar dokumen terbaca jelas tanpa tertekan/terpotong. |
| **D4** | Standarisasi Modal Dialog menjadi **Fixed Header + Scrollable Body + Fixed Footer**. | Modal dengan scroll halaman penuh bebas. | Mencegah tombol aksi "Simpan / Batal" terdorong hilang dari layar saat keyboard virtual muncul di smartphone. |
| **D5** | Kepatuhan ketat batasan pengujian `AGENTS.md` (Verifikasi tipe `tsc` + static linting). | Menjalankan automated browser script (Playwright). | Mematuhi aturan proyek: seluruh data entry dan uji bisnis nyata dilakukan secara manual oleh User. |

---

## 4. Rencana Tahapan Eksekusi (Implementation Steps)

- **Langkah 1: Audit & Refinement Shell Navigasi**
  - Periksa [`MasterShell.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/layout/MasterShell.tsx), [`Sidebar.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/layout/Sidebar.tsx), [`Topbar.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/layout/Topbar.tsx), dan drawer sheet mobile.
  - Pastikan transisi buka-tutup drawer mulus dan property switcher tidak terhimpit di layar kecil.
- **Langkah 2: Audit & Refinement Overview Dashboard & Properti**
  - Periksa kartu metrik 4-kolom ➔ 2-kolom ➔ 1-kolom di [`src/routes/dashboard/index.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/index.tsx).
  - Periksa Donut Chart okupansi dan Spline Chart Arus Kas agar responsif terhadap kontainer.
- **Langkah 3: Audit Modul Kamar, Penyewa & Kontrak Sewa**
  - Periksa grid kartu status kamar di [`rooms.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/rooms.tsx).
  - Periksa tabel penyewa dan dialog form input di [`tenants.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/tenants.tsx).
- **Langkah 4: Audit Modul Keuangan, Tagihan, & Invoices (Split-View)**
  - Implementasikan Tab Switcher pada [`invoices.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/invoices.tsx) untuk layar `<1050px`.
  - Periksa tabel keuangan, filter bar tanggal, dan modal form transaksi di [`finance.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/finance.tsx) & [`payments.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/payments.tsx).
- **Langkah 5: Audit Modul Engagement, AI Reports, Users & Profil**
  - Periksa layout widget di [`engagement.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/engagement.tsx), panel AI insight di [`reports.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/reports.tsx), serta halaman [`users.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/users.tsx) dan [`profile.tsx`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/profile.tsx).
- **Langkah 6: Static Analysis & Validation**
  - Eksekusi `npx tsc --noEmit` dan `npm run lint` / Biome untuk menjamin integritas kode 100% tanpa error.
