# Rencana & Spesifikasi Desain: Penyempurnaan Laporan Finansial AI, Layout A4 PDF, Logo Dinamis & Sidebar Polish

> **Status**: Validated Design Blueprint  
> **Referensi**: `PRD.md`, `Todo.md`, `ARCHITECTURE.md`, `DESIGN.md`, `KostManagement.html`

---

## 1. Ringkasan Eksekutif & Tujuan

Penyempurnaan ini berfokus pada 4 aspek utama untuk meningkatkan kualitas operasional dan estetika platform **HomeeKost**:

1. **Refinement AI Financial Intelligence**:
   - Menghilangkan bagian rekomendasi strategis/nasihat menggurui (*No Preachings*).
   - Memfokuskan AI 100% pada **Ringkasan Fakta Finansial Eksekutif (`keyHighlights`)** yang objektif, deskriptif, dan deterministik berbasis data mutasi PostgreSQL.
2. **Dedicated Formal A4 Executive Report Layout (`ExecutiveReportDoc.tsx`)**:
   - Menghadirkan layout cetak dokumen A4 resmi untuk Laporan Bulanan (Kop Surat, Kartu KPI, Tabel Rincian Beban Kategori, dan Ringkasan Analisis).
   - Bersih dari elemen tombol, sidebar, dan kontrol web saat disimpan/dicetak ke PDF (`@media print`).
3. **Logo Dinamis per Properti Kos**:
   - Menampilkan logo/foto kustom properti (`property.imageUrl`) pada Brand Header aplikasi dan Kop Dokumen Laporan PDF jika cabang kos bersangkutan memiliki logo kustom (fallback ke logo HomeeKost jika kosong/semua cabang).
4. **Perbaikan Responsif Sidebar Profile Button**:
   - Menjadikan navigasi sidebar scrollable secara mandiri (`.nav { flex: 1; overflow-y: auto; min-height: 0; }`) dengan footer profil tetap menempel (*shrink-0 pinned footer*) agar tidak terpotong di layar pendek/smartphone.

---

## 2. Running Decision Log

| ID | Keputusan | Alternatif yang Dipertimbangkan | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **D1** | Pembayaran tagihan selalu **Lunas Penuh** (1 Invoice = 1x Pelunasan Lunas per periode). | Pembayaran parsial / cicilan per bulan. | Menjaga pencatatan kas tetap disiplin, sederhana, dan multi-bulan otomatis dipecah per bulan. |
| **D2** | Jadwal pengingat WhatsApp tetap pada **H-3, Hari H (H-0), dan Overdue** tanpa denda otomatis. | Tambah H-7 atau denda keterlambatan flat/harian. | Pendekatan sopan, proporsional, dan efektif tanpa membebani penghuni kos. |
| **D3** | Check-out dini berstatus **Non-Refundable** (sewa hangus) dan status kamar langsung kembali ke `VACANT`. | Pengembalian dana sewa sisa; Otomatisasi modal opsi perbaikan. | Standar operasional kos sewa di muka; kamar langsung siap disewakan kembali ke penghuni baru. |
| **D4** | Kategori transaksi kas (`RENT`, `UTILITIES`, `INTERNET`, `MAINTENANCE`, `SALARY`, `OTHER`) dengan klasifikasi Operasional/Investasi telah final dan lengkap. | Tambah kategori retribusi khusus. | Struktur saat ini sudah meng-cover seluruh kebutuhan pelaporan P&L bulanan & tahunan. |
| **D5** | AI Financial Intelligence difokuskan pada **Ringkasan Fakta Eksekutif Objektif (`keyHighlights`)**; menghapus rekomendasi menggurui (`strategicRecommendations`). | Mematikan AI sepenuhnya. | Memberikan wawasan mutasi bisnis riil tanpa terdengar sok tahu, tetap memanfaatkan fitur AI. |
| **D6** | Dokumen Cetak Laporan Finansial Bulanan menggunakan **Dedicated Formal A4 Print Layout** (`ExecutiveReportDoc.tsx`). | Print layar browser biasa (`window.print` mentah); Binary `pdf-lib` server-side generator. | Menghasilkan dokumen A4 resmi berstandar eksekutif yang bersih dari elemen tombol & navigasi web. |
| **D7** | **Logo Dinamis per Properti**: Menggunakan `property.imageUrl` kustom untuk logo brand aplikasi dan kop dokumen laporan bila ada, dengan fallback ke HomeeKost logo. | Hardcoded single logo. | Memenuhi kebutuhan klien untuk personalisasi identitas visual per cabang kos. |
| **D8** | **Sidebar Responsive Profile Fix**: Menjadikan container `.nav` scrollable independen (`overflow-y: auto; flex: 1; min-height: 0;`) dengan profil footer pinned (`shrink-0`). | Mengecilkan font/padding navigasi. | Menjamin tombol profil dan logout tidak pernah terpotong di layar pendek, laptop resolusi rendah, atau smartphone. |

---

## 3. Rencana Tahapan Eksekusi Teknis

1. **Tahap 1: Pembaruan Skema & Prompt AI**
   - Perbarui `AiFinancialInsightSchema` di `src/ai/types.ts`.
   - Sesuaikan `SYSTEM_ROOT_PROMPT` di `src/ai/prompts/system-root.prompt.ts`.
   - Perbarui `fallback.engine.ts` dan `ai-manager.ts`.
2. **Tahap 2: Pembaruan Komponen AI Report UI & Cetak A4**
   - Buat komponen `src/components/report/ExecutiveReportDoc.tsx`.
   - Perbarui `src/components/report/ReportAiInsightPanel.tsx` untuk menampilkan `keyHighlights`.
   - Perbarui `src/routes/dashboard/reports.tsx` agar menyematkan layout cetak A4 dan dukungan logo dinamis properti.
   - Tambahkan aturan `@media print` khusus untuk laporan eksekutif di `src/globals.css`.
3. **Tahap 3: Logo Dinamis di Sidebar & Topbar**
   - Perbarui `Sidebar.tsx` dan `Topbar.tsx` untuk menampilkan foto/logo kustom `activeProperty?.imageUrl` jika tersedia.
4. **Tahap 4: Perbaikan Responsif Sidebar**
   - Sesuaikan flex container dan scrollable rules pada `.sidebar` dan `.nav` di `src/globals.css` & `Sidebar.tsx`.
5. **Tahap 5: Verifikasi Statis & TypeScript Check**
   - Jalankan `npx tsc --noEmit` dan static linting untuk memastikan zero error.
