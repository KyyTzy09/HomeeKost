# Design System & UI/UX Specification: HomeeKost

Dokumen ini mendefinisikan sistem desain, pedoman visual, arsitektur tata letak (layout), serta spesifikasi komponen antarmuka (*UI Components*) untuk aplikasi **Sistem Pengelolaan Kos Bude Frisda (HomeeKost)**, yang disesuaikan secara presisi berdasarkan sampel visual pada `docs/examples/HomeeKost_Dashboard_v2(1).html`.

---

## 1. Design Philosophy & Aesthetic Principles

1. **Clean, Modern & Premium Earth Tone**: Mengusung nuansa *Sage Green & Cream* yang memberikan kesan hangat, profesional, bersih, dan menenangkan bagi pengelola kos (Bude Frisda).
2. **Single-Role Operational Efficiency**: Antarmuka dirancang khusus untuk mempercepat navigasi dan eksekusi aksi pengelola (*1-Click Actions* seperti pengiriman WA Invoice, reminder tunggakan, konfirmasi pembayaran, dan pembuatan laporan).
3. **Information Density with Visual Hierarchy**: Menggunakan kartu status (*stat cards*), indikator status berwarna (*status badges*), serta layout *split-view* untuk menjaga kepadatan informasi tanpa membingungkan pengguna.

---

## 2. Design Tokens & Color Palette

Seluruh variabel warna dan token desain didefinisikan pada `src/styles.css` menggunakan CSS Custom Properties:

```css
:root {
  /* Brand Primary Colors */
  --sage: #718b78;         /* Primary Accent */
  --sage-dark: #4f6958;    /* Primary Brand & Active State */
  --sage-light: #e8f0ea;   /* Soft Background Active State */
  --sage-pale: #f3f7f3;    /* Very Soft Card / Highlight BG */

  /* Neutral Backgrounds & Text */
  --cream: #faf9f5;        /* Global Body Background */
  --white: #ffffff;        /* Card & Panel Background */
  --text: #252925;         /* Main Body Text Color */
  --muted: #737873;        /* Secondary / Subtitle Text */
  --border: #e4e9e4;       /* Subtle Border Color */

  /* Status Colors */
  --green: #5f896d;        /* Success / Occupied Status */
  --amber: #b18a4b;        /* Warning / Pending Status */
  --red: #b66b68;          /* Danger / Overdue Status */

  /* Elevation Shadow */
  --shadow: 0 2px 12px rgba(48, 65, 53, 0.055);
}
```

### Typography
* **Font Family**: `Inter`, `system-ui`, `-apple-system`, `sans-serif`.
* **Scale**:
  * Page Title (`h1`): `24px`, Font Weight: `700`, Letter Spacing: `-0.5px`.
  * Section Header (`h2`): `14px`, Font Weight: `600`.
  * Card Header / Title: `12px - 14px`, Font Weight: `600`.
  * Body Text: `12px - 13px`, Regular (`400`) / Medium (`500`).
  * Caption & Badges: `9.5px - 11px`, Semi-Bold (`600`).

---

## 3. Layout & Shell Architecture

Struktur tata letak aplikasi menggunakan arsitektur **Fixed Sidebar + Sticky Topbar + Fluid Main Content**:

```
+-----------------------------------------------------------------------------------+
| SIDEBAR (244px Fixed)     | TOPBAR (72px Sticky, Blur Glassmorphism)              |
| - Logo HomeeKost          +-------------------------------------------------------+
| - Navigasi Utama          | MAIN CONTENT BODY (max-width: 1550px, background: cream)|
|   - Overview              | - Page Header (Title + Subtitle + Action Buttons)     |
|   - Kamar & Sewa          | - Stat Cards Grid (4 Columns)                         |
|   - Penyewa               | - Main Grid Panels (Analytics / Split Preview)        |
|   - Invoice & WA          | - Activity & Attention Lists                          |
|   - Komplain              |                                                       |
|   - Laporan Keuangan      |                                                       |
| - Help Card & Profile     |                                                       |
+-----------------------------------------------------------------------------------+
```

### Responsive Breakpoints
* **Desktop Large (>1050px)**: Fixed Sidebar `244px`, 4-column Stat Grid, Split View Invoice Preview.
* **Tablet (760px - 1050px)**: Compact Sidebar `210px`, 2-column Stat Grid.
* **Mobile (<760px)**: Collapsible Drawer Sidebar (off-canvas), 1-column Stat Grid, Stacked Table Layout.

---

## 4. Key Component Specifications

### 4.1 Navigation & Topbar
* **Brand Header**: Menampilkan logo resmi `HomeeKost`.
* **Nav Items**: Tombol menu dengan ikon SVG dan efek visual active state (`.nav-item.active` dengan latar `--sage-light` dan warna teks `--sage-dark`).
* **Topbar**: Menampilkan breadcrumb dinamis (contoh: **Dashboard** / Overview), kotak pencarian global (`.search`), dan tombol aksi profil.

### 4.2 Stat Cards & Dashboard Widgets
* **Stat Card (`.stat`)**:
  * Menampilkan metric kunci: Okupansi Kamar, Total Pendapatan, Tagihan Pending, dan Perbaikan Aktif.
  * Ikon pendukung di sudut kanan atas dengan latar `--sage-pale`.
* **Donut Chart Okupansi**: Visualisasi persentase kamar terisi vs kosong menggunakan Conic Gradient (`conic-gradient(var(--sage) 0 75%, #dce7de 75% 100%)`).
* **Attention List / Perlu Ditagih**: Widget khusus di dashboard yang menampilkan tagihan jatuh tempo & komplain pending dengan tombol aksi instan **1-Click WA Reminder**.

### 4.3 Room Cards Grid (`/kamar`)
* Card kamar (`.room-card`) menampilkan Nomor Kamar (misal: "A-101"), Tipe (Standard/Deluxe), Harga/Bulan, Status Badge (`KOSONG` / `TERISI` / `PERBAIKAN`), serta nama penyewa aktif jika terisi.

### 4.4 Invoice Split Preview (`/invoice`)
* Tampilan split 2 kolom:
  * **Kolom Kiri**: Daftar invoice tagihan bulanan penyewa.
  * **Kolom Kanan**: Dokumen preview PDF invoice *real-time* lengkap dengan Logo, No Invoice (`INV/YYYYMM/XXXX`), rincian nominal sewa, instruksi transfer, dan tombol **Kirim WA Invoice** via `open-wa` REST API / `wa.me/` redirect link.

### 4.5 AI Insight Box (`/laporan`)
* Komponen khusus (`.ai-insight-box`) dengan border kiri aksen `--sage` (3px) dan latar `--sage-pale`, berisi ringkasan naratif finansial eksekutif, tren rasio pengeluaran, serta 3 saran rekomendasi bisnis taktis dari Gemini/Groq LLM.

---

## 5. Implementation Handoff

Variabel CSS dan struktur komponen di atas telah dikonfigurasi pada `src/styles.css` dan diintegrasikan ke dalam arsitektur TanStack Start / React 19. Dokumen ini menjadi acuan utama bagi pembuatan komponen React di `src/components/`.
