# Implementation Master Plan: HomeeKost (Multi-Property)

Dokumen ini adalah **Master Plan Progress Aplikasi** untuk melacak status pelaksanaan, arsitektur, milestone, dan tahapan eksekusi pengembangan **Sistem Pengelolaan Kos Multi-Cabang (HomeeKost)** dari Phase 0 hingga Phase 10 berbasis **Fonnte WhatsApp API**.

---

## 1. Master Progress Dashboard

| Phase | Nama Phase | Target Minggu | Status | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment, Design System & Docker Foundation** | Minggu 1 | ✅ Completed | 100% |
| **Phase 1** | **Database Schema PostgreSQL & Prisma ORM (`ERD.md`)** | Minggu 1 | ✅ Completed | 100% |
| **Phase 2** | **Autentikasi RBAC, Session Guard & Master Shell Layout** | Minggu 1 - 2 | ✅ Completed | 100% |
| **Phase 3** | **Modul Properti Kos (Kost Management — SuperAdmin)** | Minggu 2 | ✅ Completed | 100% |
| **Phase 4** | **Modul Kamar, Penyewa & Kontrak Sewa** | Minggu 2 - 3 | ✅ Completed | 100% |
| **Phase 5** | **Modul Keuangan, Arus Kas & Sinkronisasi Komplain** | Minggu 3 | ✅ Completed | 100% |
| **Phase 6** | **Tagihan, Invoice Digital & Integrasi Fonnte WhatsApp API** | Minggu 3 - 4 | ✅ Completed | 100% |
| **Phase 7** | **Daily Background Cron & Engagement Hub** | Minggu 4 | 🚀 Next Target | 0% |
| **Phase 8** | **AI Financial Intelligence & Laporan Eksekutif Bulanan** | Minggu 4 - 5 | ⏳ Pending | 0% |
| **Phase 9** | **CCTV Stream Monitoring & User Management (SuperAdmin)** | Minggu 5 | 🔄 In Progress | 50% |
| **Phase 10**| **Overview Dashboard, Polish & Deployment VPS Linux 4GB** | Minggu 5 | ⏳ Pending | 0% |

---

## 2. Execution Log: Phase 6 (Tagihan, Invoice Digital & WhatsApp Gateway)

### 2.1 Objectives Implemented
- **Sub-Phase 6.1 (Fonnte WhatsApp Gateway)**:
  - Utility Sanitasi Nomor WA Indonesia: [phone-sanitizer.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/lib/phone-sanitizer.ts)
  - Generator Template Pesan WhatsApp: [whatsapp-templates.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/lib/whatsapp-templates.ts) (Tagihan resmi, pengingat jatuh tempo H-3/H-0/Overdue, kwitansi pelunasan berlampiran file PDF)
  - Fonnte API Client: [fonnte-client.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/lib/fonnte-client.ts) (`sendText`, `sendFile`, fallback wa.me URL)
  - Service Dispatch & Audit Logging PostgreSQL: [fonnte.service.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/data/services/fonnte.service.ts)
- **Sub-Phase 6.2 (Monitoring Tagihan & Pembayaran)**:
  - Repository Data Layer: [invoice.repository.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/data/repositories/invoice.repository.ts) (Prisma atomic transaction `markAsPaid` -> otomatis buat transaksi `INCOME` `RENT` di kas)
  - Business Service: [payment.service.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/data/services/payment.service.ts) (Kalkulasi H-3/H-0/Overdue, agregasi statistik, generate bulanan massal, buat tagihan manual)
  - Server Functions & Hooks: [payment.fn.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/data/servers/payment.fn.ts) & [use-payments.ts](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/hooks/use-payments.ts)
  - UI Component Table & Dialogs: [PaymentTable.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentTable.tsx), [PaymentMetrics.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentMetrics.tsx), [PaymentConfirmDialog.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentConfirmDialog.tsx), [PaymentGenerateDialog.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentGenerateDialog.tsx), [PaymentFormDialog.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/payment/PaymentFormDialog.tsx)
  - Route: [payments.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/payments.tsx)
- **Sub-Phase 6.3 (Invoice Digital & Live PDF Engine)**:
  - Live Document Renderer: [InvoiceDocPreview.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/components/invoice/InvoiceDocPreview.tsx) (Format A4 resmi dengan stempel LUNAS / MENUNGGU, rincian sewa, info rekening BCA/QRIS, tanda tangan pengelola)
  - Print-to-PDF Styling presisi: [globals.css](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/globals.css) (`@media print`)
  - Route Split View: [invoices.tsx](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/src/routes/dashboard/invoices.tsx)

### 2.2 Decision Log
- **D1**: Pelunasan sewa melalui tombol "Verifikasi Bayar" menggunakan *Prisma atomic transaction* (`db.$transaction`) agar status invoice `PAID` dan transaksi kas pemasukan `INCOME` kategori `RENT` selalu sinkron tanpa inkonsistensi.
- **D2**: Seluruh invoice dan kwitansi diformat sebagai **Dokumen PDF Resmi**, bukan hanya pesan teks biasa, sehingga pengiriman ke WhatsApp via Fonnte menyertakan file dokumen resmi yang jauh lebih profesional.
- **D3**: Setiap invoice memiliki live preview dan tombol cetak A4 yang kompatibel langsung dengan browser "Save as PDF".

---

## 3. Next Handoff Steps
Melanjutkan ke **Phase 7: Daily Background Cron & Engagement Hub** (Pemeriksaan Jatuh Tempo otomatis, Birthday Reminder Engine, dan Modul Pengumuman/Broadcast Kos).
