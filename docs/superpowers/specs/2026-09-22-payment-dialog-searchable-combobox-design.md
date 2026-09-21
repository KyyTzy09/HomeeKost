# Design Spec: Searchable Tenant Combobox in PaymentFormDialog

**Date**: 2026-09-22  
**Status**: Draft / Pending Implementation  
**Component**: `fullstack/src/components/payment/PaymentFormDialog.tsx`  
**Page**: `fullstack/src/routes/dashboard/payments.tsx`

---

## 1. Problem Statement & Motivation
Pada modal penerbitan tagihan sewa manual (`PaymentFormDialog`), daftar pilihan penghuni sebelumnya menggunakan komponen `<Select>` biasa:
1. Tidak ada kolom filter/pencarian teks sehingga menyulitkan admin kos ketika memiliki puluhan hingga ratusan penyewa.
2. Batas ketinggian popover belum dibatasi secara optimal, menyebabkan dropdown memanjang ke bawah.
3. Kebutuhan operasional: admin perlu mencari penyewa berdasarkan **nama penghuni** maupun **nomor kamar** dengan cepat dan visual yang informatif.

---

## 2. Architecture & UI Specifications

### 2.1 Visual Anatomy & Layout
Komponen dropdown penghuni & kamar diubah menjadi **Searchable Popover Combobox** yang mengikuti pola teruji pada `InvoiceFormDialog.tsx`:

1. **Trigger Box**:
   - Tampilan default / terpilih: `{selectedTenant.name} — Kamar {selectedTenant.roomNo} ({selectedTenant.rent}/bln)`
   - Tampilan jika belum ada pilihan: `"Pilih / Cari Penghuni & Kamar..."`
   - Ikon sisi kanan: `<ChevronsUpDown className="w-4 h-4 text-[#737873]" />`
   - Styling: Tinggi `h-10`, latar `#fbfcfb`, border `#e4e9e4`, sudut `rounded-lg`, teks ukuran `text-xs text-[#252925]`.

2. **Dropdown Menu Container**:
   - `position: absolute`, z-index `z-50`, lebar penuh `w-full`, margin top `mt-1`.
   - Latar belakang `bg-white`, sudut `rounded-xl`, border `#e4e9e4`, bayangan `shadow-xl`.
   - Batas tinggi scroll: `max-h-56` (224px) dengan `overflow-y-auto`.

3. **Filter / Search Input**:
   - Elemen input sticky di bagian atas dropdown list.
   - Ikon `<Search className="w-3.5 h-3.5 text-[#737873]" />` di sisi kiri input.
   - Placeholder: `"Ketik nama atau nomor kamar..."`.
   - Auto focus saat menu dibuka.

4. **Option Items & Empty State**:
   - Filter case-insensitive mencocokkan `tenant.name`, `tenant.roomNo`, dan `tenant.phone` (jika ada).
   - Setiap item baris menampilkan:
     - Nama penghuni (font medium / semibold).
     - Sub-label: `Kamar {roomNo} · {rent}/bln` beserta nomor kontak jika tersedia.
     - Indikator centang `<Check className="w-3.5 h-3.5 text-[#4f6958]" />` jika sedang terpilih.
   - Jika query pencarian tidak menemukan hasil, tampilkan pesan: `"Penghuni tidak ditemukan"` dengan padding dan warna muted.

---

## 3. State Management & Data Flow

### 3.1 Local State in `PaymentFormDialog`
- `tenantQuery`: string (kata kunci filter pencarian, default `""`).
- `isTenantDropdownOpen`: boolean (status buka/tutup menu combobox, default `false`).
- `tenantComboboxRef`: `useRef<HTMLDivElement>(null)` untuk deteksi klik di luar popover (`mousedown` listener).

### 3.2 Selection & Auto-Fill Flow
1. Saat admin mengklik salah satu baris penghuni:
   - Nilai `contractId` diatur ke `t.contractId || t.id`.
   - Nilai `amount` otomatis di-update sesuai harga sewa kamar (`parseRupiah(t.rent)`).
   - State `tenantQuery` di-reset ke `""`.
   - State `isTenantDropdownOpen` diubah ke `false`.
2. Saat modal ditutup atau dibuka kembali:
   - State pencarian di-reset ke `""`.
   - Dropdown otomatis tertutup.

---

## 4. Edge Cases & Boundary Handling

1. **Penghuni Tanpa Kamar Aktif**:
   - Filter `activeTenantsWithRoom` tetap mempertahankan validasi `t.roomNo && t.roomNo !== "—"`.
2. **Outside Click**:
   - Event listener `mousedown` global yang mendeteksi apakah klik terjadi di luar `tenantComboboxRef.current`. Jika ya, tutup dropdown tanpa mengubah nilai yang sudah terpilih.
3. **Pencarian Karakter Khusus / Whitespace**:
   - Query dibersihkan dengan `.trim().toLowerCase()` sebelum dilakukan pencocokan substring.

---

## 5. Verification & Testing Plan

1. **TypeScript Typecheck**:
   - Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe data.
2. **Build Check**:
   - Jalankan `npm run build` untuk memvalidasi bundling TanStack Start / Vite.
3. **Unit Test Pure Utility**:
   - Pastikan seluruh 51 unit test di Vitest tetap lulus (`npm run test:unit`).
4. **Manual User Verification**:
   - Buka modal "Tambah Pembayaran / Tagihan Manual" di `/dashboard/payments`.
   - Verifikasi dropdown dibatasi tingginya dan dapat discroll.
   - Ketik nama penghuni dan nomor kamar pada input pencarian dan pastikan filter bekerja akurat.
