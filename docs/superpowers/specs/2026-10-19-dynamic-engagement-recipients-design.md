# Desain Teknis: Dynamic Engagement Recipient Hub & Selective WhatsApp Broadcast

Dokumen spesifikasi arsitektur dan desain teknis untuk penyempurnaan modul WhatsApp Engagement Hub pada halaman `/dashboard/engagement` di repositori **HomeeKost**.

---

## 1. Latar Belakang & Masalah

Pada implementasi sebelumnya di `/dashboard/engagement`:
1. **Ketidaksinkronan Kolom Kiri**: Kolom kiri menampilkan komponen statis `EngagementBirthdayPanel` (hanya daftar ulang tahun 30 hari ke depan), terlepas dari template pesan apa yang sedang dipilih pengelola di kolom kanan.
2. **Ketiadaan Pemilihan Granular ("Ke Siapa")**: Pengelola kos hanya dapat memilih cabang kos sasaran ("Ke mana"), tetapi belum dapat mencentang atau memilih nomor-nomor penyewa tertentu ("Ke siapa"). Menekan tombol broadcast langsung menembak ke 100% penyewa aktif di cabang tersebut.
3. **Ketidaktahuan Status Pengiriman**: Pengelola tidak dapat membedakan secara visual di daftar penyewa siapa saja yang sudah menerima pesan hari ini dan siapa yang belum.
4. **Kebutuhan Relevansi Waktu**:
   - Pengingat ulang tahun 30 hari sebelumnya dirasa terlalu lama/bisa terlupakan; dipersingkat menjadi **5 hari menjelang hari-H (H-5 s/d Hari-H)**.
   - Template apresiasi pembayaran difokuskan khusus kepada penyewa yang **baru-baru ini membayar sewa tepat waktu** (dalam 14 hari terakhir sebelum/pada tanggal 5).

---

## 2. Tujuan & Solusi yang Dipilih

Menerapkan **Pendekatan 1: Unified Dynamic Recipient Hub**:
- Mengubah panel statis di kolom kiri menjadi **`EngagementDynamicRecipientPanel`** yang adaptif dan reaktif mengikuti template yang diklik di kolom kanan.
- **Strategi Optimalisasi Performa (Single-Fetch + In-Memory Filter)**: Backend mengambil seluruh data penerima aktif dalam satu payload query ringan saat halaman dimuat. TanStack Query menyimpannya dalam cache dengan `staleTime: 60 * 1000` (1 menit) dan `refetchInterval: 60 * 1000`. Penggantian template menyaring data murni di memori frontend dengan latensi 0ms tanpa request berulang ke server.
- **Mode Seleksi Fleksibel**: Pengelola dapat:
  1. Mengirim pesan secara **1-per-1** langsung per baris penyewa.
  2. Mencentang penyewa tertentu (Checklist) atau **Pilih Semua**, lalu menekan tombol **`Broadcast ke (N) Terpilih`**.
- **Indikator Status Bersih**: Tampilan status pengiriman murni berbasis teks dan elemen span rapi tanpa emoji atau karakter titik:
  - `<span class="...">Terkirim Hari Ini</span>`
  - `<span class="...">Belum Dikirim</span>`

---

## 3. Spesifikasi Data & Backend Service

### A. Tipe Data `EngagementRecipient` (`src/common/types/engagement.types.ts`)
```ts
export interface EngagementRecipient {
	tenantId: string;
	name: string;
	phone: string;
	roomNumber: string;
	propertyId: string;
	propertyName: string;
	startDate: string; // ISO date string mulai sewa
	birthDate?: string | null; // ISO date string tanggal lahir
	daysRemaining?: number | null; // Sisa hari menuju ultah (0 = hari ini, dst)
	relativeBirthdayLabel?: string | null; // "Hari ini", "Besok", "3 hari lagi"
	lastPaymentDate?: string | null; // ISO date string bayar terakhir
	isOnTimePayment?: boolean; // True jika bayar sebelum/pada batas tgl 5
	isSentToday?: boolean; // True jika nomor WA sudah menerima pesan hari ini
}
```

### B. Query Repository `getActiveTenantsWithEngagementMetadata` (`engagement.repository.ts`)
Mengambil data penyewa aktif, kamar, properti, tanggal mulai sewa, tanggal lahir, dan transaksi pembayaran terakhir dalam 1 query teroptimasi Prisma:
```ts
async getActiveTenantsWithEngagementMetadata(propertyIds?: string[]): Promise<EngagementRecipient[]>
```
- Menghitung `daysRemaining` untuk ulang tahun.
- Mengidentifikasi status pembayaran tepat waktu (`isOnTimePayment`).
- Membandingkan nomor telepon dengan log `getTodaySentNotificationLogs` untuk menentukan `isSentToday`.

### C. Service Endpoint (`engagement.service.ts`)
1. **`getEngagementDashboard(user?: SessionUser)`**:
   - Memasukkan array `recipients: EngagementRecipient[]` ke dalam response dashboard.
   - Tetap mematuhi aturan isolasi RBAC (`ADMIN` hanya menerima data cabangnya, `SUPER_ADMIN` menerima semua cabang).
2. **`sendSingleTemplateMessage(input: { tenantId: string; templateContent: string }, user?: SessionUser)`**:
   - Mengirim template personal ke 1 penyewa via Fonnte.
   - Mencatat log `ANNOUNCEMENT` atau `ENGAGEMENT` di tabel `notificationLog`.
3. **`broadcastToSelectedRecipients(input: { tenantIds: string[]; templateContent: string; title?: string }, user?: SessionUser)`**:
   - Mengambil data nomor telepon untuk daftar `tenantIds` yang dikirimkan.
   - Mengirim WhatsApp secara sekuensial dengan jeda anti-ban Meta (`sleepWithJitter(800, 400)`).
   - Menyimpan seluruh log pengiriman via `recordNotificationLogsBatch`.

---

## 4. Logika Filtering Reaktif Frontend (`useMemo`)

Di dalam komponen halaman `/dashboard/engagement`, daftar penerima disaring otomatis berdasarkan template yang aktif:

| Kategori / ID Template | Logika Penyaringan Data | Keterangan Header Panel |
| :--- | :--- | :--- |
| **Sambutan** (`category: "Sambutan"`) | Penyewa dengan kontrak aktif yang tanggal mulai sewanya (`startDate`) berada dalam **30 hari terakhir** (diurutkan dari yang terbaru). | *Daftar Penerima: Anak Kos Baru (N)* |
| **Ulang Tahun** (`category: "Ulang Tahun"`) | Penyewa dengan `daysRemaining` bernilai **antara 0 s/d 5 hari** (H-5 s/d Hari-H). | *Daftar Penerima: Ulang Tahun H-5 (N)* |
| **Pembayaran** (`category: "Pembayaran"`) | Penyewa yang **baru-baru ini membayar tepat waktu** (`isOnTimePayment === true` dalam 14 hari terakhir). | *Daftar Penerima: Lunas Tepat Waktu (N)* |
| **Kerja Bakti / Pengumuman / Kustom** | **Seluruh Penyewa Aktif** pada cabang yang dipilih (atau seluruh cabang jika filter global). | *Daftar Penerima: Seluruh Penghuni (N)* |

Jika hasil filter menghasilkan 0 penyewa (misal tidak ada yang berulang tahun dalam 5 hari ke depan), panel menampilkan pesan informatif ramah: *"Tidak ada penghuni yang memenuhi kriteria untuk template ini saat ini."*

---

## 5. Spesifikasi Komponen UI (`EngagementDynamicRecipientPanel.tsx`)

Komponen baru ini menggantikan `EngagementBirthdayPanel.tsx` di kolom kiri:

1. **Header Panel**:
   - Judul dinamis sesuai template aktif (misal: *Daftar Penerima: Anak Kos Baru (3)*).
   - Subtitle deskriptif konteks filter.
   - Indikator ringkasan terpilih: *"N dari M dipilih"*.
2. **Bar Aksi & Seleksi**:
   - Checkbox **"Pilih Semua"** (mendukung status *indeterminate* jika baru sebagian yang dipilih).
   - Filter Cabang Kos (khusus SuperAdmin, sinkron dengan filter properti global jika ada).
   - Tombol Aksi Utama: **`Broadcast ke (N) Terpilih`**
     - Berwarna Sage Solid (`bg-[#4f6958] text-white`).
     - Dinonaktifkan jika `selectedCount === 0` atau sedang proses pengiriman (`isLoading`).
3. **Baris Penerima (Recipient Card / Row)**:
   - Checkbox seleksi per individu.
   - Nama Penyewa (Bold).
   - Nomor Kamar & Nama Kos (teks sekunder `#737873`).
   - Info Kontekstual Teks Biasa:
     - Sambutan: `Mulai sewa: [tgl]`
     - Ulang tahun: `Ultah: [tgl] ([N] hari lagi / Hari ini)`
     - Pembayaran: `Lunas tepat waktu ([tgl])`
   - Status Badge Pengiriman (Murni Teks):
     - `Terkirim Hari Ini` (`bg-[#e8f2ea] text-[#3e724d] border-[#b9dbbf]`)
     - `Belum Dikirim` (`bg-[#f3f7f3] text-[#737873] border-[#e4e9e4]`)
   - Tombol Aksi 1-per-1:
     - Tombol **Kirim** di ujung kanan baris.
     - Jika diklik, langsung memicu pengiriman template yang sedang aktif ke penyewa tersebut.

---

## 6. Template Variabel Pengganti Otomatis (Personalization)

Saat template dikirimkan ke masing-masing penerima (baik 1-per-1 maupun batch), sistem melakukan replace token sederhana:
- `{nama}` ➔ Nama penyewa (misal: "Kak Budi")
- `{kamar}` ➔ Nomor kamar (misal: "A-01")
- `{kos}` ➔ Nama cabang kos (misal: "Kos Melati")

---

## 7. Rencana Verifikasi & Testing

1. **Unit Testing**:
   - Uji fungsi filter murni berdasarkan kriteria:
     - Filter anak baru (30 hari terakhir).
     - Filter ulang tahun (rentang 0–5 hari).
     - Filter pembayaran tepat waktu (14 hari terakhir).
   - Uji helper penggantian variabel personalisasi `{nama}`, `{kamar}`, `{kos}`.
2. **TypeScript Strict Type Check**:
   - `npx tsc --noEmit` lolos 0 error.
3. **Biome Formatting**:
   - Format dan linting bersih.
4. **Fullstack Build Verification**:
   - `npm run build` sukses tanpa kendala SSR/Vite.
