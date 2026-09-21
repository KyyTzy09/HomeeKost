# Design Spec: Auto-Calculation & Rent Duration Display in PaymentFormDialog

**Date**: 2026-09-22  
**Component**: `fullstack/src/components/payment/PaymentFormDialog.tsx`  
**Related Route**: `fullstack/src/routes/dashboard/payments.tsx`

---

## 1. Background & Problem
Sebelumnya, pada modal pembuatan tagihan manual (`PaymentFormDialog`):
1. Admin harus memilih tanggal kalender secara manual (`type="date"` untuk jatuh tempo).
2. Admin harus menghitung sendiri total tagihan jika penyewa membayar siklus non-bulanan (misal Triwulan 3 bulan, Semesteran 6 bulan, atau Tahunan 12 bulan).
3. Informasi durasi sewa penyewa tidak terlihat jelas, sehingga rawan salah input nominal.

---

## 2. Proposed Architecture & UI Changes

### 2.1 Auto-Detection & Calculation
Saat admin memilih penyewa dari Searchable Combobox:
1. **Siklus Sewa (`cycleMonths`)**:
   - `"Tahunan"` $\rightarrow$ 12 bulan
   - `"Semesteran"` $\rightarrow$ 6 bulan
   - `"Triwulan"` $\rightarrow$ 3 bulan
   - `"Bulanan"` (default) $\rightarrow$ 1 bulan
2. **Kalkulasi Nominal (`amount`)**:
   - `monthlyRent = parseRupiah(selectedTenant.rent) || 850000`
   - `totalAmount = monthlyRent * cycleMonths`
   - State `amount` otomatis di-set ke `totalAmount`.
3. **Jatuh Tempo Otomatis (`dueDate`)**:
   - Diekstrak dari hari jatuh tempo kontrak penyewa (misal angka tanggal dari `selectedTenant.dueDate` atau default tgl 10).
   - Diformat otomatis menjadi string `YYYY-MM-DD` sesuai bulan & tahun periode aktif.
   - Input kalender manual `type="date"` dihilangkan dari form tampilan utama agar tidak membingungkan admin.

### 2.2 UI Information Card (Preview Box)
Tepat di bawah dropdown penyewa, ditampilkan kartu ringkasan visual dengan tema Sage & Cream:
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Rincian Sewa & Kalkulasi Otomatis                        │
├─────────────────────────────────────────────────────────────┤
│  Siklus Sewa   : [Badge: Triwulan (3 Bulan)]                │
│  Tarif Kamar   : Rp 850.000 / bulan                         │
│  Jatuh Tempo   : Setiap tanggal 10                          │
│  Kalkulasi     : 3 bulan x Rp 850.000 = Rp 2.550.000        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Form Fields
- **Pilih Penghuni & Kamar** (Searchable Combobox yang sudah ada).
- **Card Ringkasan Info & Kalkulasi Otomatis** (muncul saat penghuni terpilih).
- **Periode Sewa** (Bulan & Tahun, pre-filled otomatis).
- **Nominal Tagihan (Rp)** (terisi otomatis hasil perkalian, tetap dapat diedit jika ada biaya tambahan).
- **Catatan Tagihan** (opsional).
- **Kirim Tagihan ke WhatsApp** (checkbox).

---

## 3. Data & Validation Flow
- Form tetap mengirim payload yang valid sesuai `createManualInvoiceSchema`:
  - `contractId: string`
  - `periodMonth: number`
  - `periodYear: number`
  - `amount: number`
  - `dueDate: string (YYYY-MM-DD)` (dihitung otomatis di background)
  - `notes?: string`
  - `sendWhatsApp: boolean`

---

## 4. Verification Plan
- `npx tsc --noEmit` $\rightarrow$ 0 error
- `npm run test:unit` $\rightarrow$ 51/51 lulus
- `npm run build` $\rightarrow$ Sukses bundling
