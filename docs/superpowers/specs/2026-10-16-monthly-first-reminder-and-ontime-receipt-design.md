# Spesifikasi Desain: Pengingat Tagihan Tanggal 1 & Kwitansi Apresiasi Tepat Waktu

**Tanggal**: 16 Oktober 2026  
**Status**: Disetujui (Approved via Brainstorming)  
**Dokumen Terkait**: `fullstack/docs/PRD.md`, `fullstack/docs/ARCHITECTURE.md`

---

## 1. Ringkasan Kebutuhan (Understanding Summary)

Berdasarkan hasil diskusi dan review bersama klien/pemilik kos:
1. **Jadwal Pengingat Tagihan Utama**:
   - Cron pengingat tagihan sewa reguler (non-cicilan) **hanya aktif dan dikirim 1 kali setiap tanggal 1 awal bulan baru**.
   - Menghilangkan sistem pengingat otomatis berbasis H-3 untuk tagihan reguler.
2. **Kriteria Seleksi Tagihan Tanggal 1**:
   - Sistem memfilter seluruh invoice sewa aktif berstatus `PENDING` pada periode bulan & tahun berjalan (`periodMonth = curMonth, periodYear = curYear`).
   - Tagihan yang berstatus cicilan bertahap (*partial payment*) **dikecualikan dari cron otomatis**.
3. **Trigger Pengingat Cicilan Bertahap Secara Manual**:
   - Pengingat sisa cicilan tidak dijalankan oleh cron otomatis, melainkan dipicu secara **manual oleh pemilik kos** melalui tombol WhatsApp di Halaman Pembayaran (`/dashboard/payments`).
4. **Pembaruan Redaksi Pesan WhatsApp Tagihan Utama**:
   - Sapaan profesional: *"Halo [Nama]"* (tanpa kata "Kak").
   - Pembuka awal bulan: *"Hari ini sudah tanggal 1 [Bulan]... Jangan lupa untuk melakukan pembayaran tagihan sewa kos Anda..."*.
   - Masa pembayaran: **Tanggal 1 s/d 5 [Bulan]**.
   - Klausul Denda: *"Batas akhir pembayaran adalah tanggal 5. Pembayaran yang melewati tanggal 5 akan dikenakan denda keterlambatan sesuai kebijakan kos."*
5. **Diferensiasi Template Kwitansi Pelunasan Sewa**:
   - **Tepat Waktu / Lebih Awal (`paidDate <= dueDate`)**: Disertai kalimat apresiasi khusus atas kedisiplinan penghuni kos.
   - **Terlambat (`paidDate > dueDate`)**: Format kwitansi pelunasan resmi standar yang sopan dan formal.
6. **Integritas Pembukuan Kas (*Cash Basis*)**:
   - Tanggal transaksi kas masuk (`transactionDate`) tetap dicatat pada tanggal riil uang diterima (misal 28 Oktober), dengan keterangan periode sewa tetap untuk bulan berikutnya (misal sewa 11/2026).
7. **Kompabilitas & *Reversibility***:
   - Method lama `getDueInvoicesForReminder()` di `engagement.repository.ts` tetap dipertahankan utuh sebagai cadangan. Method baru dibuat khusus untuk menangani pengingat tanggal 1.

---

## 2. Asumsi (Assumptions)

- Cron harian dijalankan 1 kali setiap hari pada jam 00:00 WIB. Pada tanggal selain tanggal 1 (tanggal 2–31), cron harian tidak mengirimkan pesan tagihan sewa reguler (hanya memperbarui status overdue jika ada dan mengirim ucapan ulang tahun jika ada).
- Mekanisme idempotensi token anti-spam (`TOKEN:REMINDER:[invId]:[YYYY-MM-DD]`) dan jeda pacing anti-ban (800–1200ms) tetap aktif saat cron tanggal 1 dijalankan.
- Denda keterlambatan murni berupa klausul teks peringatan kebijakan kos tanpa mutasi skema database/kalkulasi denda otomatis.

---

## 3. Catatan Keputusan (Decision Log)

| No | Topik Keputusan | Keputusan Akhir | Alternatif yang Dipertimbangkan | Alasan Pemilihan |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Jadwal Pengingat Tagihan Utama** | Aktif 1x di tanggal 1 awal bulan baru | Sistem pengingat H-3 berulang | Pemilik kos ingin penagihan terpusat di awal bulan dengan masa bayar 1–5. |
| **2** | **Kompabilitas Kode Lama** | Menyimpan `getDueInvoicesForReminder` utuh, membuat method baru `getFirstOfMonthInvoicesForReminder` | Mengubah method lama langsung | Menjaga kode lama tetap utuh agar mudah jika sewaktu-waktu pemilik kos ingin kembali ke sistem H-3. |
| **3** | **Sapaan Template** | Menggunakan *"Halo [Nama]"* | *"Halo Kak [Nama]"* | Sesuai masukan klien agar lebih formal dan profesional dalam urusan sewa-menyewa. |
| **4** | **Peringatan Batas Bayar & Denda** | Klausul teks di pesan WA (Batas tgl 5, denda jika lewat tgl 5) | Menambahkan kolom denda otomatis di DB | Menegaskan batas waktu pembayaran tanpa menambah kompleksitas sistem keuangan. |
| **5** | **Pengingat Cicilan** | Manual via Halaman Pembayaran | Otomatis di cron | Pemilik kos ingin memegang kendali penuh kapan menagih sisa cicilan ke anak kos. |
| **6** | **Kwitansi Apresiasi Tepat Waktu** | Variasi template otomatis berdasarkan `paidDate <= dueDate` | Template tunggal generik | Memberi sentuhan personal dan apresiasi bagi anak kos yang rajin membayar tepat waktu. |

---

## 4. Desain Teknis & Spesifikasi Perubahan

### A. Template WhatsApp (`src/lib/whatsapp-templates.ts`)

#### 1. Template Pengingat Tagihan Tanggal 1 (`monthlyFirstReminder`)
```text
Halo *{{tenantName}}*,

Hari ini sudah tanggal 1 {{period}}. Jangan lupa untuk melakukan pembayaran tagihan sewa kos Anda:

🏠 *Properti:* {{propertyName}} (Kamar {{roomNumber}})
📄 *No. Invoice:* {{invoiceNumber}}
💰 *Total Tagihan:* *{{formattedAmount}}*

📅 *Masa Pembayaran:* Tanggal 1 s/d 5 {{period}}
⚠️ *Penting:* Batas waktu pembayaran adalah tanggal 5. Pembayaran yang melewati tanggal 5 akan dikenakan denda keterlambatan sesuai ketentuan kos.

💳 *Pembayaran dapat ditransfer ke rekening:*
🏦 *{{bankName}} {{bankAccount}}* a.n. *{{accountHolder}}*

📄 *Tautan Invoice Digital Resmi:*
{{documentUrl}}

Jika Anda sudah melakukan transfer, silakan kirimkan bukti pembayaran ke nomor ini. Terima kasih! 🙏✨
— Pengelola {{propertyName}}
```

#### 2. Template Kwitansi Pelunasan dengan Apresiasi (`paymentReceipt`)
- Tambahkan parameter `isOnTime?: boolean`.
- Jika `isOnTime === true`:
  > *"Terima kasih banyak! Pembayaran sewa kos Anda untuk periode {{period}} telah kami terima dan diverifikasi tepat waktu. Kami sangat mengapresiasi kedisiplinan dan kerja sama Anda! 🙏✨"*
- Jika `isOnTime === false`:
  > *"Pembayaran sewa kos Anda untuk periode {{period}} telah kami terima dan diverifikasi."*

---

### B. Repository Penagihan (`src/data/repositories/engagement.repository.ts`)

1. **Pertahankan `getDueInvoicesForReminder()`** (tidak dihapus).
2. **Tambahkan method baru**:
   ```typescript
   async getFirstOfMonthInvoicesForReminder(targetMonth: number, targetYear: number) {
       // Query hanya invoice dengan:
       // - status: "PENDING"
       // - periodMonth: targetMonth
       // - periodYear: targetYear
       // - contract & tenant: ACTIVE
       // - Minimal select projection
       // Filter: keluarkan yang installmentSummary.isPartial === true
   }
   ```

---

### C. Service Cron (`src/data/services/engagement.service.ts`)

Pada `runDailyCronTasks()`:
```typescript
const isFirstDayOfMonth = now.getDate() === 1;

const [dueReminders, todaysBirthdays] = await Promise.all([
    isFirstDayOfMonth
        ? this.repo.getFirstOfMonthInvoicesForReminder(curMonth, curYear)
        : Promise.resolve([]),
    this.repo.getTodaysBirthdays(),
]);
```
- Tagihan utama yang dikirim di tanggal 1 menggunakan template `monthlyFirstReminder`.
- Anti-spam idempotency token tetap berjalan: `TOKEN:REMINDER:${invId}:${todayStr}`.

---

### D. Service Pembayaran (`src/data/services/payment.service.ts`)

Pada `recordPayment`:
- Bandingkan `paidDate` dengan `invoice.dueDate`.
- Hitung `isOnTime = paidDate.getTime() <= invoice.dueDate.getTime()`.
- Teruskan `isOnTime` ke `whatsappTemplates.paymentReceipt`.

---

## 5. Strategi Pengujian & Verifikasi

1. **Unit Testing (`tests/unit/whatsapp-templates.test.ts`)**:
   - Menguji template `monthlyFirstReminder` memastikan tidak ada kata "Kak", mencakup tanggal 1 s/d 5, dan klausul denda.
   - Menguji template `paymentReceipt` dengan kondisi `isOnTime: true` vs `isOnTime: false`.
2. **Static Code Analysis**:
   - `npx tsc --noEmit` untuk memastikan kepatuhan type-safety.
   - `npx @biomejs/biome check` untuk linter dan formatting.
3. **Manual Verification**:
   - Verifikasi melalui dashboard oleh User sesuai panduan `AGENTS.md`.
