#!/bin/bash
# ==============================================================================
# HOMEEKOST AUTOMATIC DATABASE BACKUP SCRIPT
# Mendukung mode Docker Compose container (homeekost_db) maupun Host PostgreSQL
# Menyimpan backup terkompresi (.sql.gz) dan otomatis menghapus arsip > 7 hari
# ==============================================================================

set -e

# Direktori dasar
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/homeekost}"
LOG_FILE="/var/log/homeekost-backup.log"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/homeekost_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Baca konfigurasi dari .env jika ada
if [ -f "${APP_DIR}/.env" ]; then
    export $(grep -v '^#' "${APP_DIR}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-homeekost}"
DB_PASSWORD="${POSTGRES_PASSWORD:-secret}"

# Buat folder backup jika belum ada
mkdir -p "${BACKUP_DIR}"

echo "[$(date +"%Y-%m-%d %T")] Memulai backup database HomeeKost (${DB_NAME})..."

# Cek apakah PostgreSQL berjalan di dalam Docker container (homeekost_db)
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^homeekost_db$"; then
    echo "[$(date +"%Y-%m-%d %T")] Mode: Docker Container (homeekost_db)"
    docker exec -e PGPASSWORD="${DB_PASSWORD}" homeekost_db pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
elif command -v pg_dump >/dev/null 2>&1; then
    echo "[$(date +"%Y-%m-%d %T")] Mode: Local Host PostgreSQL"
    PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
    echo "[$(date +"%Y-%m-%d %T")] ERROR: pg_dump tidak ditemukan di host dan container 'homeekost_db' tidak aktif!" >&2
    exit 1
fi

# Cek ukuran file hasil backup
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | awk '{print $1}')
echo "[$(date +"%Y-%m-%d %T")] Berhasil mencadangkan ke: ${BACKUP_FILE} (Ukuran: ${BACKUP_SIZE})"

# Rotasi arsip: Hapus backup yang lebih lama dari RETENTION_DAYS
echo "[$(date +"%Y-%m-%d %T")] Membersihkan backup lama (> ${RETENTION_DAYS} hari)..."
find "${BACKUP_DIR}" -type f -name "homeekost_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date +"%Y-%m-%d %T")] Proses backup selesai dengan sukses."
