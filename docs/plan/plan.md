# Implementation Master Plan: HomeeKost

Dokumen ini adalah **Master Plan Progress Aplikasi** untuk melacak status pelaksanaan, arsitektur, milestone, dan tahapan eksekusi pengembanan **Sistem Pengelolaan Kos Bude Frisda (HomeeKost)** dari Phase 0 hingga Phase 10.

---

## 1. Master Progress Dashboard

| Phase | Nama Phase | Target Minggu | Status | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment, Design System & Docker Foundation** | Minggu 1 | ✅ Completed | 100% |
| **Phase 1** | **Database Schema & Multi-Role Readiness** | Minggu 1 | 🚀 Next Target | 0% |
| **Phase 2** | **Admin Auth & Master Shell Layout** | Minggu 1 - 2 | ⏳ Pending | 0% |
| **Phase 3** | **Epic 1 - Data Kamar, Penyewa & Engagement UI** | Minggu 2 | ⏳ Pending | 0% |
| **Phase 4** | **Epic 2 - Open-WA Gateway & Invoice Engine** | Minggu 3 | ⏳ Pending | 0% |
| **Phase 5** | **Epic 3 - Daily Cron & Automated Reminders** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 6** | **Epic 4 - Log Komplain & Sync Biaya Perbaikan** | Minggu 4 | ⏳ Pending | 0% |
| **Phase 7** | **Epic 5 - Arus Kas & Monthly AI Financial Insight** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 8** | **Overview Dashboard & Micro-Interactions Polish** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 9** | **Docker Compose Containerization & Testing** | Minggu 5 | ⏳ Pending | 0% |
| **Phase 10**| **Deployment ke VPS Linux 4GB RAM & Handover** | Minggu 5 | ⏳ Pending | 0% |

---

## 2. Detailed Execution Plan: Phase 0 (Environment, Design System & Docker)

### 2.1 Objectives
Menyiapkan fondasi dasar aplikasi fullstack, mengkonfigurasi *environment variables*, mengintegrasikan font `Inter` & sistem desain nuansa *Sage Green & Cream* ke dalam `src/routes/__root.tsx`, serta menyediakan konfigurasi kontainerisasi **Docker Compose** (`app`, `db` PostgreSQL 16, dan `open-wa` REST API Gateway).

### 2.2 Detailed Step-by-Step Task Breakdown

#### Task 0.1: Project Config & Environment Setup
- [x] Audit file konfigurasi TypeScript, Vite, TanStack Router, dan Biome Linter.
- [x] Buat file `.env.example` dengan kunci variable:
  - `DATABASE_URL` (PostgreSQL connection string)
  - `BETTER_AUTH_SECRET` & `BETTER_AUTH_URL`
  - `OPEN_WA_API_URL` (`http://open-wa:8080`) & `OPEN_WA_API_KEY`
  - `GEMINI_API_KEY` & `GROQ_API_KEY`
  - `APP_URL` (`http://localhost:3000`)
- [x] Buat file `.env.local` berdasarkan template `.env.example`.

#### Task 0.2: Docker & Infrastructure Foundation
- [x] Buat file `docker-compose.yml` yang menghubungkan 3 layanan:
  1. `app`: Service Node.js/Bun TanStack Start (Port 3000)
  2. `db`: Service PostgreSQL 16 Alpine (Port 5432)
  3. `open-wa`: Service Open-WA Automate REST API (Port 8080)
- [x] Buat `Dockerfile` untuk containerization aplikasi TanStack Start Monolith.

#### Task 0.3: Design System & Root Layout Configuration
- [x] Buat dokumen spesifikasi visual `Design.md` dan salinannya di `docs/Design.md`.
- [x] Konfigurasi token warna, variabel CSS, dan utilitas komponen pada `src/styles.css`.
- [x] Update `src/routes/__root.tsx`:
  - Menambahkan link Google Fonts `Inter` (weights: 400, 500, 600, 700) ke dalam `head()`.
  - Mengubah meta title dari `'TanStack Start Starter'` menjadi `'HomeeKost — Sistem Pengelolaan Kos Bude Frisda'`.
  - Memastikan `src/styles.css` termuat secara global.

---

## 3. Risk Assessment & Mitigation

| Potential Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Keterlambatan Start Open-WA Docker** | High | Tambahkan `healthcheck` pada `docker-compose.yml` agar service `app` menunggu `open-wa` dan `db` siap total (`service_healthy`). |
| **Ketidakcocokan Variable Warna UI** | Medium | Selalu manfaatkan CSS Custom Properties (`var(--sage-dark)`, `var(--cream)`) dan kelas standar (`.hk-btn`, `.hk-card`). |
| **Port Conflict pada Local Machine** | Low | Gunakan port default terisolasi (3000 untuk App, 5432 untuk DB, 8080 untuk Open-WA). |

---

## 4. Next Handoff Steps
Phase 0 telah diselesaikan **100%**. Eksekusi selanjutnya siap dilanjutkan ke **Phase 1: Database Schema & Multi-Role Readiness** (`prisma/schema.prisma`).
