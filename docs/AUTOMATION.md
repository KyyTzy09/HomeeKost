# 🤖 Panduan Otomatisasi Sistem HomeeKost (Automation Guide)

Dokumentasi ini menjelaskan seluruh sistem otomatisasi yang berjalan di HomeeKost, mulai dari tugas harian tagihan kos, laporan keuangan bulanan AI, pemantauan kesehatan server VPS, pencadangan basis data, hingga alur *deployment* CI/CD otomatis.

---

## 📌 Ringkasan Cepat (Quick Cheat Sheet)

Sistem otomatisasi HomeeKost dipicu secara terjadwal melalui **Crontab di VPS** dan **GitHub Actions**.

| Otomatisasi | Jadwal Server (UTC) | Waktu Lokal (WIB) | Target / Skrip | Fungsi Utama |
|---|---|---|---|---|
| **1. Tugas Harian** | `0 1 * * *` | 08:00 WIB | `/api/cron/daily-tasks` | Tagihan sewa, denda telat, ucapan ultah via WA |
| **2. Laporan AI Bulanan** | `0 * * * *` | Tiap 1 Jam | `/api/cron/monthly-reports` | Rekap keuangan bulanan & insight AI eksekutif |
| **3. Monitor Server** | `*/15 * * * *` | Tiap 15 Menit | `/api/cron/server-alert` | Cek RAM, CPU, Disk & kirim WA darurat jika kritis |
| **4. Backup Database** | `0 19 * * *` | 02:00 WIB | `scripts/backup-db.sh` | Dump PostgreSQL Docker, kompresi gzip & rotasi 7 hari |
| **5. CI/CD Deployment** | Push ke `main` | Otomatis | GitHub Actions | Test unit & auto-deploy update ke VPS |

---

## 🛠️ Konfigurasi Crontab di VPS

Semua jadwal otomatisasi di atas dipasang pada **Crontab Root** di VPS.

### 1. Cara Melihat Jadwal yang Aktif
```bash
sudo crontab -l
```

### 2. Cara Mengedit Jadwal
```bash
sudo crontab -e
```

### 3. Konfigurasi Standar Crontab HomeeKost
Berikut adalah baris lengkap yang terpasang di VPS:
```cron
# ==============================================================================
# HOMEEKOST PRODUCTION CRON JOBS
# ==============================================================================

# 1. TUGAS HARIAN: Pengingat sewa & ultah setiap jam 08:00 WIB (01:00 UTC)
0 1 * * * curl -s --compressed -X POST "http://localhost:3000/api/cron/daily-tasks?key=HK-Cron" >> /var/log/homeekost-daily-cron.log 2>&1

# 2. RUNNER LAPORAN AI BULANAN: Setiap 1 jam mengecek jadwal di database
0 * * * * curl -s --compressed -X POST "http://localhost:3000/api/cron/monthly-reports?key=HK-Cron" >> /var/log/homeekost-monthly-cron.log 2>&1

# 3. MONITOR KAPASITAS SERVER: Setiap 15 menit cek hardware & kirim WA darurat jika mendekati kritis
*/15 * * * * curl -s --compressed -X POST "http://localhost:3000/api/cron/server-alert?key=HK-Cron" >> /var/log/homeekost-server-alert.log 2>&1

# 4. BACKUP DATABASE OTOMATIS: Setiap hari jam 02:00 WIB (19:00 UTC)
0 19 * * * /var/www/homeekost/scripts/backup-db.sh >> /var/log/homeekost-backup.log 2>&1
```

> [!NOTE]
> Server VPS pada umumnya menggunakan zona waktu **UTC**. Karena WIB adalah **UTC+7**:
> - Jam 08:00 WIB = `01:00 UTC` (`0 1 * * *`)
> - Jam 02:00 WIB = `19:00 UTC` (`0 19 * * *`)

---

## 🔍 Detail 4 Otomatisasi Utama

### 1. 📬 Tugas Harian (Daily Tasks)
- **Kapan berjalan?** Setiap hari jam 08:00 WIB pagi.
- **Apa yang dikerjakan?**
  1. **Auto-Generate Invoice**: Menghasilkan tagihan sewa untuk seluruh kamar yang berpenghuni aktif pada bulan berjalan. Jika tanggal sudah memasuki akhir bulan (tanggal 25 ke atas), sistem juga menyiapkan tagihan untuk bulan berikutnya.
  2. **Update Status Overdue**: Tagihan yang sudah melewati tanggal jatuh tempo otomatis ditandai sebagai `OVERDUE` (Jatuh Tempo).
  3. **Pengingat WhatsApp Otomatis**: Mengirim pesan WA ke nomor penyewa dengan pola terjadwal:
     - **H-3**: Pengingat tagihan awal sebelum jatuh tempo.
     - **H-1**: Pengingat mendekati batas bayar.
     - **Hari H**: Tagihan jatuh tempo hari ini.
     - **H+1 & H+3**: Pengingat keterlambatan pembayaran.
     - Setiap pesan WA menyertakan tautan invoice interaktif agar penyewa dapat langsung melihat tagihan dan mengunggah bukti bayar.
  4. **Ucapan Ulang Tahun**: Mengirim ucapan selamat ulang tahun personal ke penyewa yang hari lahirnya cocok dengan tanggal hari ini.
- **Proteksi Anti-Spam (Idempotency)**:
  Sistem mengecek riwayat pengiriman pesan hari ini. Jika nomor tersebut sudah dikirimi notifikasi untuk invoice yang sama, pengiriman dilewati sehingga tidak akan terjadi pengiriman berulang/spam.

---

### 2. 📊 Runner Laporan AI Bulanan (Monthly AI Reports)
- **Kapan berjalan?** Diperiksa setiap 1 jam sekali.
- **Apa yang dikerjakan?**
  1. **Cek Jadwal Otomatis**: Memeriksa apakah waktu saat ini telah memenuhi jadwal rilis laporan bulanan yang diatur oleh Admin di database (misal: setiap tanggal 1 jam 08:00 WIB).
  2. **Idempotency Guard (`cron_monthly_report_YYYY_MM`)**:
     Menyimpan token khusus di database. Begitu laporan bulan berjalan berhasil diproses, cron tidak akan memproses ulang pada jam-jam berikutnya.
  3. **Analisis AI Eksekutif**:
     Mengumpulkan total pendapatan, pengeluaran operasional, rasio okupansi kamar, dan tren laba-rugi, lalu meminta model AI (Gemini) menyusun ringkasan eksekutif dan rekomendasi bisnis untuk pemilik kos.
  4. **Notifikasi Dashboard**:
     Mengaktifkan banner notifikasi laporan baru di halaman Dashboard admin/owner kos.

---

### 3. 🚨 Monitoring Kesehatan Server & Kapasitas Hardware (Server Alert)
- **Kapan berjalan?** Setiap 15 menit sekali.
- **Apa yang dikerjakan?**
  1. **Pengukuran Real-time**: Mengambil data CPU load, sisa RAM, persentase penyimpanan disk host, dan konektivitas database (`pg_isready`).
  2. **Evaluasi Tingkat Bahaya**:
     - **Prima (Healthy)**: Semua resource aman (RAM < 75%, Disk < 80%).
     - **Waspada (Warning)**: Pemakaian RAM 75-90% atau Storage 80-90%.
     - **Kritis (Critical)**: Storage > 92% atau Database terputus.
  3. **Pesan Darurat WhatsApp**: Jika kondisi masuk ke tingkat `Waspada` atau `Kritis`, sistem otomatis mengirimkan peringatan darurat ke nomor WhatsApp Owner/Admin.
  4. **Cooldown Interval**: Memiliki jeda notifikasi agar admin tidak dibombardir pesan setiap 15 menit saat perbaikan sedang dilakukan.
  5. **Halaman Publik `/status`**: Pengguna dan pengelola bisa memantau kondisi server kapan saja di `https://status.homeekost.web.id` (atau `/status`). Tombol Dashboard di halaman ini otomatis mengembalikan pengguna ke domain utama.

---

### 4. 🗄️ Pencadangan Basis Data Otomatis (Database Backup)
- **Kapan berjalan?** Setiap hari jam 02:00 WIB dini hari.
- **Skrip**: `/var/www/homeekost/scripts/backup-db.sh`
- **Lokasi Simpan**: `/var/backups/homeekost/homeekost_backup_YYYY-MM-DD_HHMMSS.sql.gz`
- **Apa yang dikerjakan?**
  1. **Deteksi Container Otomatis**:
     Skrip otomatis mendeteksi keberadaan Docker container PostgreSQL (`homeekost_db`) dan mengeksekusi `pg_dump` langsung dari dalam container.
  2. **Kompresi Gzip**:
     File hasil dump langsung dikompresi menjadi `.sql.gz` (ukuran hemat hanya puluhan kilobyte).
  3. **Rotasi 7 Hari**:
     File backup yang berumur lebih dari 7 hari otomatis dihapus agar media penyimpanan VPS tidak pernah habis.

#### Uji Coba Manual Backup:
```bash
sudo /var/www/homeekost/scripts/backup-db.sh
```

#### Cara Restore Database dari File Backup:
Jika sewaktu-waktu ingin mengembalikan database dari file backup tertentu:
```bash
# 1. Masuk ke folder backup
cd /var/backups/homeekost

# 2. Ekstrak dan restore ke container PostgreSQL Docker
gunzip -c homeekost_backup_2026-10-31_142428.sql.gz | docker exec -i homeekost_db psql -U postgres -d homeekost
```

---

### 5. 🚀 Pipeline CI/CD (GitHub Actions)
- **File Konfigurasi**: [`.github/workflows/deploy.yml`](file:///D:/Coding%20Mandiri/client/kosan_app/fullstack/.github/workflows/deploy.yml)
- **Pemicu**: Setiap ada commit yang di-push atau di-merge ke branch `main`.
- **Alur Kerja**:
  1. **Job `test`**:
     - Meng-install dependensi Bun (`bun install`).
     - Membangun Prisma Client (`bunx prisma generate`).
     - Pengecekan tipe data ketat TypeScript (`bunx tsc --noEmit`).
     - Menjalankan 23 modul unit test (207 pengujian). Jika ada 1 saja test gagal, deploy otomatis dibatalkan.
  2. **Job `deploy`**:
     - Terhubung ke VPS via SSH.
     - Menjalankan `set -e` dan `script_stop: true` (skrip langsung berhenti jika ada galat).
     - Menjalankan `git reset --hard HEAD` untuk menjamin direktori kerja VPS selalu sinkron dan bersih.
     - Menarik kode terbaru (`git pull origin main`).
     - Memperbarui skema database (`bunx prisma db push`).
     - Membangun ulang dan menyalakan container aplikasi (`docker compose up -d --build app`).
     - Membersihkan image dan build cache lama (`docker builder prune -af`) agar penyimpanan VPS tetap lega.

---

## 🔑 Variabel Lingkungan (`.env`) Penting

Pastikan variabel-variabel berikut telah terisi di file `.env` di VPS (`/var/www/homeekost/.env`):

```env
# 1. Kunci Pengaman Endpoint Cron
CRON_SECRET="HK-Cron"

# 2. URL Aplikasi Utama
APP_URL="https://homeekost.web.id"

# 3. Kredensial Database Docker
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your-strong-password"
POSTGRES_DB="homeekost"
POSTGRES_HOST="localhost"
POSTGRES_PORT=5432

# 4. Kredensial SMTP Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="ownerhomeekost@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_SECURE="false"
EMAIL_FROM="HomeeKost Security <ownerhomeekost@gmail.com>"
```

---

## 🩺 Panduan Pemantauan & Troubleshooting Praktis

### 1. Bagaimana cara melihat log cron harian?
```bash
tail -n 50 /var/log/homeekost-daily-cron.log
```

### 2. Bagaimana cara melihat log backup database?
```bash
tail -n 50 /var/log/homeekost-backup.log
```

### 3. Bagaimana cara melihat log real-time aplikasi di Docker?
```bash
sudo docker logs --tail 50 -f homeekost_app
```

### 4. Bagaimana cara menguji endpoint cron secara manual?
Gunakan `curl -i` (tanpa `-s`) agar status HTTP `200 OK` dan body responnya tampak di layar terminal:
```bash
# Uji Tugas Harian
curl -i -X POST "http://localhost:3000/api/cron/daily-tasks?key=HK-Cron"

# Uji Laporan Bulanan
curl -i -X POST "http://localhost:3000/api/cron/monthly-reports?key=HK-Cron"

# Uji Pengecekan Server Alert
curl -i -X POST "http://localhost:3000/api/cron/server-alert?key=HK-Cron"
```

### 5. Apa yang harus dilakukan jika `backup-db.sh` error `command not found`?
Pastikan format baris skrip adalah LF (bukan Windows CRLF):
```bash
sed -i 's/\r$//' /var/www/homeekost/scripts/backup-db.sh
sudo chmod +x /var/www/homeekost/scripts/backup-db.sh
```
