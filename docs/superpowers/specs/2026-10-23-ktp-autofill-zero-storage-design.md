# Spesifikasi Desain: Fitur Asisten Pindai KTP Otomatis (Zero-Storage Ephemeral Autofill)

## 1. Latar Belakang & Tujuan
* **Kebutuhan Bisnis:** Klien pengelola kos sangat menyukai efisiensi pengisian otomatis (*autofill*) identitas anak kos melalui pemindaian KTP berbasis AI Vision (Gemini), namun **tidak ingin dan tidak memerlukan penyimpanan foto fisik KTP** di server maupun database demi kepatuhan privasi data pribadi, efisiensi storage VPS, dan minimalisasi risiko keamanan.
* **Tujuan Utama:** Menghadirkan asisten pindai KTP murni berbasis memori (*in-memory*) yang hanya bertugas mengekstrak data teks (NIK, Nama, Tempat/Tanggal Lahir, Alamat Asal, Jenis Kelamin) ke dalam formulir pendaftaran, kemudian membuang berkas foto dari memori tanpa menulis berkas apa pun ke disk penyimpanan VPS.

---

## 2. Ruang Lingkup & Batasan
* **Lingkup Pekerjaan:**
  1. **Backend Server Function (`src/data/servers/tenant.fn.ts`):**  
     Mencabut pemanggilan `storageService.uploadImage` dari `scanKtpServerFn`. Gambar diproses murni di memori RAM server langsung ke Gemini AI Vision OCR.
  2. **Formulir Pendaftaran & Edit (`src/components/tenant/TenantFormDialog.tsx`):**
     - Header seksi scan disederhanakan menjadi teks minimalis: **`"Pindai KTP Otomatis"`** (tanpa badge dan tanpa catatan panjang).
     - Fitur scan tetap aktif baik pada mode *Tambah Penghuni Baru* maupun *Edit Penghuni*.
     - State pratinjau gambar hanya bersifat visual lokal di browser dan otomatis dibersihkan saat form selesai disubmit/dibatalkan.
     - Menyimpan nilai `ktpUrl: null` ke database.
     - Menyinkronkan status *loading* form (`isSubmitting`) agar tombol simpan menampilkan animasi pemuatan dan mencegah dialog tertutup prematur sebelum proses simpan selesai.
  3. **Halaman / Modal Detail Penghuni (`src/components/tenant/TenantDetailDialog.tsx`):**  
     Menghapus kontainer seksi *"Dokumen KTP Terlampir"* secara menyeluruh karena seluruh data teks identitas sudah tersaji lengkap pada kartu profil atas.
  4. **Halaman Penghuni (`src/routes/dashboard/tenants.tsx`):**  
     Meneruskan status mutasi `createTenantMutation.isPending` dan `updateTenantMutation.isPending` ke properti dialog formulir. Dialog hanya tertutup jika transaksi database berhasil (`onSuccess`), dan tetap terbuka jika gagal (`onError`) disertai notifikasi *toast error*.
* **Batasan Penting:**
  - Fungsi `storageService.uploadImage` untuk modul lain (seperti Logo Kos, foto properti, dll.) **tetap dipertahankan seutuhnya dan tidak diubah**.
  - Kolom database `ktpUrl` tetap bernilai nullable (`String?`) tanpa mengubah skema Prisma demi keamanan data produksi klien.
  - Runtime eksekusi: **Wajib BUN (`bun`)**, dilarang keras menggunakan `npm`.

---

## 3. Alur Data & State Lifecycle

```
[Admin Pilih / Ambil Foto KTP]
           │
           ▼
[Kompresi Ringan di Canvas Browser (< 500KB)]
           │
           ├──► [Pratinjau Visual Sementara di Form (State Lokal Browser)]
           │
           ▼
[POST scanKtpServerFn (Base64 murni di RAM)]
           │
           ▼
[Gemini AI Vision OCR Ekstraksi Data]
           │  (0 Byte ditulis ke disk storage VPS)
           ▼
[Data Teks Diterima: NIK, Nama, Alamat, dll.]
           │
           ▼
[Kolom Form Terisi Otomatis (Autofill)]
           │
           ▼
[Admin Tekan Tombol "Simpan Penghuni"]
           │
           ├──► [State Loading: Tombol Disabled + Animasi "Menyimpan data..."]
           │
     ┌─────┴─────────────────────────────────────┐
     ▼                                           ▼
[BERHASIL (onSuccess)]                  [GAGAL (onError)]
     │                                           │
     ├──► Tampilkan Toast Berhasil               ├──► Tampilkan Toast Error
     ├──► Bersihkan State Pratinjau KTP          ├──► Form Tetap Terbuka
     └──► Tutup Form Dialog                      └──► Data Teks Tetap Utuh
```

---

## 4. Decision Log

| ID | Keputusan | Alternatif Dipertimbangkan | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **DEC-01** | **100% In-Memory OCR Pass-through** | Simpan file sementara dengan cron auto-delete | Mengeliminasi penulisan I/O disk secara total, menjamin privasi klien 100%, dan mencegah penumpukan sampah file di VPS. |
| **DEC-02** | **Ketersediaan di Create & Update** | Hanya aktif di Create form | Mempertahankan fitur ikonik sistem sehingga admin tetap dapat mengoreksi data lama via scan KTP. |
| **DEC-03** | **Tampilan Minimalis Form** | Menyertakan badge AI dan catatan kepatuhan panjang | Arahan klien/user agar tampilan form bersih, fokus, dan bebas distraksi teks berlebih. |
| **DEC-04** | **Hapus Seksi KTP di Detail Dialog** | Membuat kartu pengganti identitas KTP | Data NIK, Nama, dan No WA sudah tertera jelas di panel atas, sehingga kartu tambahan menjadi mubazir/redundant. |
| **DEC-05** | **Sinkronisasi Loading & Error Guard** | Penutupan dialog instan tanpa menunggu mutasi selesai | Mencegah kebingungan pengguna (UX yang buruk) dan mencegah hilangnya form saat terjadi kegagalan jaringan. |

---

## 5. Rencana Pengujian & Verifikasi
1. **Unit Test:**
   - Memverifikasi `scanKtpServerFn` tidak lagi memanggil `storageService.uploadImage`.
   - Memastikan `tenantSchema` menerima payload pendaftaran tanpa `ktpUrl` (`null` atau `undefined`).
2. **Pengujian Frontend & UI:**
   - Memastikan teks header form tertulis `"Pindai KTP Otomatis"`.
   - Memastikan tombol simpan menampilkan state loading dan dialog hanya tertutup setelah server merespons sukses.
   - Memastikan seksi foto KTP pada `TenantDetailDialog` tidak lagi muncul.
3. **Kompilasi & Build:**
   - `bun test` seluruh test suite (harus 100% pass).
   - `bun run build` sukses bersih tanpa TypeScript error.
