#!/bin/bash
# ==============================================================================
# HOMEEKOST AUTOMATIC DATABASE BACKUP SCRIPT
# Mendukung mode Docker Compose container (homeekost_db),
# Cloud/Supabase (DATABASE_URL / DIRECT_URL), maupun Local PostgreSQL
# Menyimpan backup terkompresi (.sql.gz) dan otomatis menghapus arsip > 7 hari
# ==============================================================================

set -eo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/homeekost}"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/homeekost_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Ekstrak variabel database secara aman dari .env tanpa word-splitting error
ENV_FILE="${APP_DIR}/.env"
if [ -f "${ENV_FILE}" ]; then
    get_env_var() {
        grep -E "^${1}=" "${ENV_FILE}" | head -n 1 | cut -d '=' -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
    }

    DATABASE_URL=$(get_env_var "DATABASE_URL")
    DIRECT_URL=$(get_env_var "DIRECT_URL")
    POSTGRES_USER=$(get_env_var "POSTGRES_USER")
    POSTGRES_PASSWORD=$(get_env_var "POSTGRES_PASSWORD")
    POSTGRES_DB=$(get_env_var "POSTGRES_DB")
    POSTGRES_HOST=$(get_env_var "POSTGRES_HOST")
    POSTGRES_PORT=$(get_env_var "POSTGRES_PORT")
fi

# Fallback: jika variabel POSTGRES_* tidak didefinisikan terpisah di .env,
# ekstrak otomatis dari DATABASE_URL
if [ -n "${DATABASE_URL}" ]; then
    URL_USER=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p' 2>/dev/null || true)
    URL_PASS=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p' 2>/dev/null || true)
    URL_DB=$(echo "${DATABASE_URL}" | sed -e 's/.*\/[0-9]*\///' -e 's/.*:\/\/[^\/]*\///' -e 's/?.*//' 2>/dev/null || true)
fi

DB_USER="${POSTGRES_USER:-${URL_USER:-postgres}}"
DB_NAME="${POSTGRES_DB:-${URL_DB:-homeekost}}"
DB_PASSWORD="${POSTGRES_PASSWORD:-${URL_PASS:-secret}}"

# Prioritaskan DIRECT_URL atau DATABASE_URL jika ada (misal Supabase / Cloud PG)
TARGET_URL="${DIRECT_URL:-$DATABASE_URL}"
if [ -n "${TARGET_URL}" ]; then
    CLEAN_DB_URL=$(echo "${TARGET_URL}" | sed -e 's/[?&]pgbouncer=true//g' -e 's/\?$//')
fi

# Pastikan direktori backup tersedia
mkdir -p "${BACKUP_DIR}"

echo "[$(date +"%Y-%m-%d %T")] Memulai backup database HomeeKost..."

# Deteksi perintah Docker (dengan atau tanpa sudo jika user belum di grup docker)
DOCKER_CMD=""
if command -v docker >/dev/null 2>&1; then
    if docker ps >/dev/null 2>&1; then
        DOCKER_CMD="docker"
    elif command -v sudo >/dev/null 2>&1 && sudo -n docker ps >/dev/null 2>&1; then
        DOCKER_CMD="sudo -n docker"
    fi
fi

# Cek apakah ada container Postgres Docker aktif (homeekost_db atau sejenisnya)
DOCKER_CONTAINER=""
if [ -n "${DOCKER_CMD}" ]; then
    DOCKER_CONTAINER=$(${DOCKER_CMD} ps --format '{{.Names}}' 2>/dev/null | grep -E "^homeekost_db$|homeekost.*db|postgres" | head -n 1 || true)
fi

# 1. Mode Docker Container (jika container Postgres terdeteksi aktif)
if [ -n "${DOCKER_CONTAINER}" ]; then
    echo "[$(date +"%Y-%m-%d %T")] Menggunakan mode: Docker Container (${DOCKER_CONTAINER})"
    ${DOCKER_CMD} exec -e PGPASSWORD="${DB_PASSWORD}" "${DOCKER_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# 2. Mode Connection String URI (Supabase / Cloud Database / DIRECT_URL)
elif [ -n "${CLEAN_DB_URL}" ] && command -v pg_dump >/dev/null 2>&1; then
    echo "[$(date +"%Y-%m-%d %T")] Menggunakan mode: PostgreSQL Connection URL (Cloud/DIRECT_URL)"
    pg_dump "${CLEAN_DB_URL}" | gzip > "${BACKUP_FILE}"

# 3. Mode Local Host PostgreSQL (via host/port/user)
elif command -v pg_dump >/dev/null 2>&1; then
    echo "[$(date +"%Y-%m-%d %T")] Menggunakan mode: Local Host PostgreSQL"
    PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# 4. Error handling jika pg_dump tidak terpasang dan container docker tidak ditemukan
else
    echo "[$(date +"%Y-%m-%d %T")] ERROR: Container Docker PostgreSQL tidak ditemukan aktif dan pg_dump tidak terpasang di host!" >&2
    echo "Pastikan container Docker PostgreSQL Anda sudah aktif (misal: docker compose up -d db)" >&2
    exit 1
fi

# Cek ukuran file hasil backup
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | awk '{print $1}')
echo "[$(date +"%Y-%m-%d %T")] Backup berhasil dibuat: ${BACKUP_FILE} (Ukuran: ${BACKUP_SIZE})"

# Rotasi arsip: Hapus backup yang lebih lama dari RETENTION_DAYS
echo "[$(date +"%Y-%m-%d %T")] Membersihkan backup lama (> ${RETENTION_DAYS} hari)..."
find "${BACKUP_DIR}" -type f -name "homeekost_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

echo "[$(date +"%Y-%m-%d %T")] Proses backup database selesai dengan sukses."
