# Design Specification: Standardized 3 Payment Statuses &amp; Query Synchronization

- **Date**: 2026-10-23
- **Status**: Approved by User
- **Author**: Antigravity AI &amp; HomeeKost Core Team
- **Scope**: Status Standardization (Lunas, Belum Lunas, Terlambat, Cicilan), Query Sync, Multi-Page Consistency (`/tenants`, `/payments`, `/invoices`)
- **Runtime Environment**: **Bun (`bun`)** — *Strictly no `npm` commands allowed*

---

## 1. Executive Summary &amp; Purpose

Sistem HomeeKost saat ini memiliki beberapa istilah status pembayaran yang tumpang tindih antar halaman (seperti *"Lancar"*, *"Menunggu Pembayaran"*, *"Dicicil"*, dan *"Terlambat"*). Hal ini membingungkan bagi pengelola kos non-teknis dan berisiko memunculkan ketidaksesuaian (*mismatch*) antara angka kartu ringkasan atas dengan baris data tabel di bawahnya.

Spesifikasi ini menetapkan **Pendekatan 1 (Centralized Status Evaluator)** untuk menyelaraskan seluruh kueri database, business service layer, dan komponen antarmuka ke dalam **3 status baku sistem** ditambah sub-status **Cicilan**:

1. **Lunas** (`PAID`)
2. **Belum Lunas** (`UNPAID` / `dueDate >= todayWib`)
3. **Terlambat** (`OVERDUE` / `dueDate < todayWib`)
4. **Cicilan** (`isInstallment` / `paidAmount > 0 && remainingAmount > 0`)

---

## 2. Decision Log

- **D1 (2026-10-23):** Mengadopsi **Pendekatan 1 (Centralized Status Evaluator)** menggunakan fungsi murni terpusat di `src/lib/payment-utils.ts` tanpa mengubah skema Enum PostgreSQL di Prisma.
  - *Alternatif yang Dipertimbangkan:* Migrasi Enum PostgreSQL di database (Ditolak karena berisiko tinggi merusak data produksi klien di VPS) dan UI-Only Mapping (Ditolak karena berisiko memicu mismatch filter backend).
  - *Alasan:* Menjamin integritas data production VPS dan konsistensi 100% antar layer.
- **D2 (2026-10-23):** Menyeragamkan kueri filter backend di `PaymentService` dan `TenantService` menggunakan acuan waktu kalender WIB (UTC+7) pada awal hari (`00:00:00 WIB`).
  - *Alasan:* Mencegah bug *off-by-one* atau selisih jam server UTC vs WIB, sehingga penghuni yang jatuh tempo pada hari-H tidak dianggap terlambat sampai hari berakhir.
- **D3 (2026-10-23):** Seluruh proses build, type-check, dan pengujian unit test wajib dijalankan menggunakan **`bun`** (`bun test`, `bun run build`).
  - *Alasan:* Sesuai dengan konfigurasi runtime server dan instruksi eksplisit pengguna.

---

## 3. Assumptions &amp; Edge Cases

1. **Evaluasi Jatuh Tempo (Hari Ini / Hari-H):**
   - Jika tagihan jatuh tempo pada tanggal 23 Oktober dan hari ini adalah 23 Oktober, status tagihan adalah **Belum Lunas** (bukan Terlambat).
   - Status baru beralih menjadi **Terlambat** jika `todayWib > dueDate`.
2. **Penanganan Cicilan (Installments):**
   -  Tagihan yang telah dicicil sebagian (misal Rp 500.000 dari total Rp 1.000.000) tetap memiliki status waktu (*Belum Lunas* jika belum lewat tempo, atau *Terlambat* jika sudah lewat tempo), namun secara visual ditandai dengan badge/teks baku **"Cicilan"** dan keterangan rincian sisa tagihan.
3. **Penghapusan Istilah Lama:**
   - Istilah *"Lancar"* pada tabel Penghuni dihapus 100%.
   - Istilah *"Menunggu Pembayaran"* pada tabel Pembayaran dan Invoice dihapus 100%.
   - Istilah kata kerja *"Dicicil"* diubah menjadi kata baku **"Cicilan"**.

---

## 4. Technical Architecture &amp; Implementation Design

### 4.1 Pure Evaluator Helper (`src/lib/payment-utils.ts`)

```typescript
export interface EvaluateRentalStatusInput {
  totalAmount: number;
  paidAmount: number;
  dueDate: Date | string;
  databaseStatus?: string; // "PAID" | "PENDING" | "OVERDUE" | "CANCELLED"
}

export type StandardRentalStatus = "Lunas" | "Belum Lunas" | "Terlambat";

export interface EvaluatedRentalStatus {
  status: StandardRentalStatus;
  statusKey: "PAID" | "UNPAID" | "OVERDUE";
  isSettled: boolean;
  isInstallment: boolean;
  paidAmount: number;
  remainingAmount: number;
  badgeText: string;
  badgeVariant: "green" | "amber" | "red";
  badgeClass: string;
}

export function evaluateRentalPaymentStatus(
  input: EvaluateRentalStatusInput
): EvaluatedRentalStatus {
  const total = Number(input.totalAmount) || 0;
  const paid = Math.max(0, Number(input.paidAmount) || 0);
  const remaining = Math.max(0, total - paid);
  const isSettled = paid >= total || input.databaseStatus === "PAID";
  const isInstallment = !isSettled && paid > 0 && remaining > 0;

  if (isSettled) {
    return {
      status: "Lunas",
      statusKey: "PAID",
      isSettled: true,
      isInstallment: false,
      paidAmount: total,
      remainingAmount: 0,
      badgeText: "Lunas",
      badgeVariant: "green",
      badgeClass: "bg-[#e8f0ea] text-[#4f6958] border-[#c8dacb]",
    };
  }

  // Bandingkan dengan WIB Today (00:00:00)
  const today = getWibTodayStart();
  const due = new Date(input.dueDate);
  due.setHours(0, 0, 0, 0);

  const isOverdue = due.getTime() < today.getTime() || input.databaseStatus === "OVERDUE";

  if (isOverdue) {
    return {
      status: "Terlambat",
      statusKey: "OVERDUE",
      isSettled: false,
      isInstallment,
      paidAmount: paid,
      remainingAmount: remaining,
      badgeText: isInstallment ? "Cicilan" : "Terlambat",
      badgeVariant: "red",
      badgeClass: "bg-[#fdf0ed] text-[#b8382e] border-[#f5c6c2]",
    };
  }

  return {
    status: "Belum Lunas",
    statusKey: "UNPAID",
    isSettled: false,
    isInstallment,
    paidAmount: paid,
    remainingAmount: remaining,
    badgeText: isInstallment ? "Cicilan" : "Belum Lunas",
    badgeVariant: "amber",
    badgeClass: "bg-[#fbf4ea] text-[#99773d] border-[#ebd8bc]",
  };
}
```

---

### 4.2 Backend Layer Synchronization

1. **`PaymentService` (`src/data/services/payment.service.ts`)**:
   - Fungsi `getPayments`:
     - Menyelaraskan filter `status` (`ALL`, `PAID`, `UNPAID`, `OVERDUE`, `INSTALLMENT`).
     - Menyematkan hasil `evaluateRentalPaymentStatus` pada setiap item tagihan.
   - Fungsi `getStats`:
     - Menghitung agregat Lunas, Belum Lunas (nominal &amp; jumlah), dan Terlambat tanpa saling tumpang tindih.
2. **`TenantService` (`src/data/services/tenant.service.ts`)**:
   - Fungsi `getTenants`:
     - Menghapus pemetaan status *"Lancar"*.
     - Mengevaluasi kontrak aktif dan invoice bulan berjalan setiap penghuni menggunakan `evaluateRentalPaymentStatus`.
     - Dropdown filter status penghuni menerima: `all`, `Lunas`, `Belum Lunas`, `Terlambat`.

---

### 4.3 Frontend Layer Synchronization

1. **Halaman Penghuni (`src/routes/dashboard/tenants.tsx`)**:
   - Kolom tabel *Pembayaran* menampilkan badge seragam: `Lunas` (hijau), `Belum Lunas` (kuning/amber), `Terlambat` (merah).
   - Filter bar status atas disesuaikan dengan 3 status tersebut.
2. **Halaman Pembayaran (`src/routes/dashboard/payments.tsx` &amp; komponen terkait)**:
   - Header kartu KPI 1: Mengubah teks `"Total Tagihan Bulan Ini (Oktober 2026)"` menjadi **`"Total Tagihan Bulan Ini"`**.
   - Komponen `PaymentTable.tsx`: Mengubah label status `"Dicicil"` menjadi **`"Cicilan"`**.
   - Filter dropdown status: Menyelaraskan opsi *Semua*, *Lunas*, *Belum Lunas*, *Cicilan*, dan *Terlambat*.
3. **Halaman Invoice (`src/routes/dashboard/invoices.tsx`)**:
   - Dropdown filter dokumen kiri atas memuat 5 opsi yang sinkron: *Semua Dokumen*, *Lunas*, *Belum Lunas*, *Cicilan*, *Terlambat*.

---

## 5. Verification &amp; Testing Strategy

- **Unit Testing**:
  - Berkas: `tests/unit/payment-status.test.ts`
  - Perintah eksekusi: **`bun test`**
  - Skenario pengujian:
    1. Tagihan jatuh tempo hari ini $\rightarrow$ `Belum Lunas`.
    2. Tagihan jatuh tempo kemarin $\rightarrow$ `Terlambat`.
    3. Tagihan dengan pembayaran cicilan separuh $\rightarrow$ `Cicilan` (sub-status).
    4. Tagihan lunas penuh $\rightarrow$ `Lunas`.
- **Build Verification**:
  - Perintah eksekusi: **`bun run build`** (memastikan 0 type error dan bundle berhasil dibuat).