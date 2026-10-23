# Rencana Implementasi: Fitur Pindai KTP Otomatis (Zero-Storage Ephemeral Autofill)

Rencana kerja ini mengimplementasikan spesifikasi desain [`docs/superpowers/specs/2026-10-23-ktp-autofill-zero-storage-design.md`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/docs/superpowers/specs/2026-10-23-ktp-autofill-zero-storage-design.md) untuk menyempurnakan fitur scan KTP menjadi asisten autofill murni tanpa menulis berkas ke storage VPS.

> **Batasan Wajib:**
> - Runtime & Build: **Wajib menggunakan BUN (`bun`)**. Dilarang menggunakan `npm`.
> - Keamanan Modul Lain: Fungsi `storageService.uploadImage` untuk logo kos / foto properti tidak boleh terganggu.

---

## Task 1: Backend Zero-Storage Refactor pada `scanKtpServerFn`

**File yang Diubah:**
- `src/data/servers/tenant.fn.ts`

**Langkah:**
1. Hapus pemanggilan `storageService.uploadImage` di dalam `scanKtpServerFn`.
2. Langsung kirim `imageBase64` ke `ktpOcrService.processKtpImage(imageBase64)`.
3. Kembalikan respons `{ success, data: ocrResult.data, error: ocrResult.error }` tanpa field `ktpUrl`.

---

## Task 2: Pembersihan Tampilan pada `TenantDetailDialog.tsx`

**File yang Diubah:**
- `src/components/tenant/TenantDetailDialog.tsx`

**Langkah:**
1. Hapus blok kontainer `{tenant.ktpUrl && (...)}` ("Dokumen KTP Terlampir").
2. Rapikan impor ikon jika ada yang tidak terpakai lagi (`FileText`).

---

## Task 3: Penyesuaian Antarmuka & State Form pada `TenantFormDialog.tsx`

**File yang Diubah:**
- `src/components/tenant/TenantFormDialog.tsx`

**Langkah:**
1. Ubah teks judul seksi menjadi minimalis: **`"Pindai KTP Otomatis"`** (tanpa badge, tanpa teks catatan panjang).
2. Pastikan tombol pemindaian dapat digunakan baik saat pendaftaran baru maupun saat edit penghuni.
3. Pastikan state `ktpPreview` hanya hidup di memori browser dan dibersihkan saat form selesai disubmit atau dibatalkan.
4. Nilai `ktpUrl` yang dikirimkan ke server selalu `null`.
5. Dukung properti `isSubmitting` dari luar sehingga tombol "Simpan Penghuni" menampilkan spinner dan status disable selama mutasi berjalan.

---

## Task 4: Sinkronisasi Status Loading & Proteksi Form pada `src/routes/dashboard/tenants.tsx`

**File yang Diubah:**
- `src/routes/dashboard/tenants.tsx`

**Langkah:**
1. Teruskan prop `isSubmitting={createTenantMutation.isPending || updateTenantMutation.isPending}` ke `TenantFormDialog`.
2. Pastikan `setIsFormOpen(false)` hanya dieksekusi saat mutasi berhasil (`onSuccess`).
3. Saat mutasi gagal (`onError`), dialog tetap terbuka sehingga data yang sudah diisi admin tidak hilang, dan tampilkan notifikasi *toast error*.

---

## Task 5: Pengujian & Verifikasi

**Langkah:**
1. Jalankan unit test dengan `bun test`.
2. Jalankan build produksi dengan `bun run build`.
3. Perbarui daftar centang di `docs/revisi-todo.md`.
