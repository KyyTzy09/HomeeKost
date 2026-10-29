import fs from "node:fs";
import os from "node:os";
import type {
	ContainerServiceItem,
	HealthLevel,
	SystemAppInfo,
	SystemContainerBreakdown,
	SystemCpuInfo,
	SystemDatabaseInfo,
	SystemMemoryInfo,
	SystemRecommendation,
	SystemStatusData,
	SystemStatusLabel,
	SystemStorageInfo,
} from "../../common/types/system.types.ts";
import { prisma } from "../../db.ts";

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024 * 1024) {
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	return `${Math.round(bytes / 1024)} KB`;
}

function parseMemoryStringToBytes(memStr: string): number {
	const trimmed = memStr.trim().toLowerCase();
	const num = parseFloat(trimmed);
	if (isNaN(num)) return 0;
	if (trimmed.endsWith("gb") || trimmed.endsWith("g")) {
		return num * 1024 * 1024 * 1024;
	}
	if (trimmed.endsWith("mb") || trimmed.endsWith("m")) {
		return num * 1024 * 1024;
	}
	if (trimmed.endsWith("kb") || trimmed.endsWith("k")) {
		return num * 1024;
	}
	return num;
}

function formatDuration(totalSeconds: number): string {
	const sec = Math.max(0, Math.floor(totalSeconds));
	const days = Math.floor(sec / 86400);
	const hours = Math.floor((sec % 86400) / 3600);
	const minutes = Math.floor((sec % 3600) / 60);

	if (days > 0) {
		return `${days} Hari, ${hours} Jam`;
	}
	if (hours > 0) {
		return `${hours} Jam, ${minutes} Menit`;
	}
	return `${Math.max(1, minutes)} Menit`;
}

export class SystemStatusService {
	private getMemoryInfo(): SystemMemoryInfo {
		let totalBytes = os.totalmem();
		let freeBytes = os.freemem();

		// Di Linux (VPS maupun container), os.freemem() hanya membaca MemFree murni
		// sehingga mengabaikan Buffers & Cached yang sebenarnya memori bebas yang siap pakai.
		// Membaca /proc/meminfo memberikan MemAvailable yang 100% akurat sesuai perintah htop / free -m.
		if (process.platform === "linux") {
			try {
				if (fs.existsSync("/proc/meminfo")) {
					const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
					const availMatch = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/i);
					const totalMatch = meminfo.match(/MemTotal:\s+(\d+)\s+kB/i);
					if (availMatch && availMatch[1]) {
						freeBytes = parseInt(availMatch[1], 10) * 1024;
					}
					if (totalMatch && totalMatch[1]) {
						totalBytes = parseInt(totalMatch[1], 10) * 1024;
					}
				}
			} catch {
				// Fallback ke os.freemem() & os.totalmem()
			}
		}

		const usedBytes = Math.max(0, totalBytes - freeBytes);
		const usedPercent = Math.min(
			100,
			Math.max(0, Math.round((usedBytes / totalBytes) * 100)),
		);

		let statusLevel: HealthLevel = "normal";
		let statusLabel: SystemStatusLabel = "Normal";

		if (usedPercent >= 90) {
			statusLevel = "critical";
			statusLabel = "Kritis";
		} else if (usedPercent >= 75) {
			statusLevel = "warning";
			statusLabel = "Waspada";
		} else if (usedPercent < 60) {
			statusLevel = "prima";
			statusLabel = "Prima";
		} else {
			statusLevel = "normal";
			statusLabel = "Normal";
		}

		return {
			totalBytes,
			usedBytes,
			freeBytes,
			totalFormatted: formatBytes(totalBytes),
			usedFormatted: formatBytes(usedBytes),
			freeFormatted: formatBytes(freeBytes),
			usedPercent,
			statusLevel,
			statusLabel,
		};
	}

	private getStorageInfo(isVercel = false): SystemStorageInfo | null {
		try {
			if (typeof fs.statfsSync === "function") {
				// Di Vercel Serverless (AWS Lambda), root / adalah squashfs read-only image yang 100% terisi.
				// Satu-satunya writable disk di Vercel adalah /tmp (berukuran 512MB-1GB).
				const targetPath = isVercel && fs.existsSync("/tmp") ? "/tmp" : "/";
				const stat = fs.statfsSync(targetPath);
				const totalBytes = Number(stat.blocks) * Number(stat.bsize);
				const freeBytes = Number(stat.bavail) * Number(stat.bsize);
				const usedBytes = Math.max(0, totalBytes - freeBytes);
				const usedPercent = Math.min(
					100,
					Math.max(0, Math.round((usedBytes / totalBytes) * 100)),
				);

				let statusLevel: HealthLevel = "normal";
				let statusLabel: SystemStatusLabel = "Normal";

				if (usedPercent >= 90) {
					statusLevel = "critical";
					statusLabel = "Kritis";
				} else if (usedPercent >= 80) {
					statusLevel = "warning";
					statusLabel = "Waspada";
				} else if (usedPercent < 60) {
					statusLevel = "prima";
					statusLabel = "Prima";
				} else {
					statusLevel = "normal";
					statusLabel = "Normal";
				}

				return {
					totalBytes,
					usedBytes,
					freeBytes,
					totalFormatted: formatBytes(totalBytes),
					usedFormatted: formatBytes(usedBytes),
					freeFormatted: formatBytes(freeBytes),
					usedPercent,
					statusLevel,
					statusLabel,
				};
			}
		} catch {
			// Jika file system statfs tidak didukung
		}
		return null;
	}

	private getCpuInfo(): SystemCpuInfo {
		const cpus = os.cpus() || [];
		const cores = Math.max(1, cpus.length);
		const loadAvg = os.loadavg();
		const load1m = loadAvg && loadAvg[0] ? loadAvg[0] : 0;
		const normalizedLoad = load1m / cores;

		let loadStatus: "Ringan" | "Sedang" | "Tinggi" = "Ringan";
		let statusLevel: HealthLevel = "prima";
		let statusLabel: SystemStatusLabel = "Prima";

		if (normalizedLoad >= 1.0) {
			loadStatus = "Tinggi";
			statusLevel = "warning";
			statusLabel = "Waspada";
		} else if (normalizedLoad >= 0.7) {
			loadStatus = "Sedang";
			statusLevel = "normal";
			statusLabel = "Normal";
		} else {
			loadStatus = "Ringan";
			statusLevel = "prima";
			statusLabel = "Prima";
		}

		return {
			cores,
			model: `${cores} Core`,
			loadAvg1m: Math.round(load1m * 100) / 100,
			loadStatus,
			statusLevel,
			statusLabel,
		};
	}

	private getAppInfo(serverTotalMem: number, isVercel = false): SystemAppInfo {
		if (isVercel) {
			const memoryUsedBytes = process.memoryUsage().rss;
			const percentOfServer =
				serverTotalMem > 0
					? Math.round((memoryUsedBytes / serverTotalMem) * 1000) / 10
					: 0;
			const uptimeSeconds = Math.floor(process.uptime());

			return {
				isContainer: false,
				name: "Layanan Aplikasi Web",
				memoryUsedBytes,
				memoryUsedFormatted: formatBytes(memoryUsedBytes),
				memoryPercentOfServer: percentOfServer,
				uptimeSeconds,
				uptimeFormatted: formatDuration(uptimeSeconds),
				statusLevel: "prima",
				statusLabel: "Prima",
				description:
					"Aplikasi berjalan aktif pada cloud serverless Vercel (Auto-scaled).",
			};
		}

		let isContainer = false;
		let memoryUsedBytes = 0;

		// 1. Coba deteksi batas memori kontainer cgroup v2
		try {
			if (fs.existsSync("/sys/fs/cgroup/memory.current")) {
				const raw = fs
					.readFileSync("/sys/fs/cgroup/memory.current", "utf8")
					.trim();
				const parsed = parseInt(raw, 10);
				if (!isNaN(parsed) && parsed > 0) {
					memoryUsedBytes = parsed;
					isContainer = true;
				}
			}
		} catch {
			// Abaikan error baca cgroup v2
		}

		// 2. Coba deteksi batas memori kontainer cgroup v1 jika v2 belum dapat
		if (!isContainer) {
			try {
				if (fs.existsSync("/sys/fs/cgroup/memory/memory.usage_in_bytes")) {
					const raw = fs
						.readFileSync(
							"/sys/fs/cgroup/memory/memory.usage_in_bytes",
							"utf8",
						)
						.trim();
					const parsed = parseInt(raw, 10);
					if (!isNaN(parsed) && parsed > 0) {
						memoryUsedBytes = parsed;
						isContainer = true;
					}
				}
			} catch {
				// Abaikan error baca cgroup v1
			}
		}

		// 3. Cek marker lingkungan kontainer (.dockerenv)
		if (!isContainer) {
			try {
				if (
					fs.existsSync("/.dockerenv") ||
					fs.existsSync("/run/.containerenv")
				) {
					isContainer = true;
				}
			} catch {
				// Abaikan
			}
		}

		// Jika pembacaan cgroup gagal atau berjalan di luar kontainer, gunakan process memory RSS
		if (memoryUsedBytes <= 0) {
			memoryUsedBytes = process.memoryUsage().rss;
		}

		const percentOfServer =
			serverTotalMem > 0
				? Math.round((memoryUsedBytes / serverTotalMem) * 1000) / 10
				: 0;

		const uptimeSeconds = Math.floor(process.uptime());

		return {
			isContainer,
			name: "Layanan Aplikasi Kos",
			memoryUsedBytes,
			memoryUsedFormatted: formatBytes(memoryUsedBytes),
			memoryPercentOfServer: percentOfServer,
			uptimeSeconds,
			uptimeFormatted: formatDuration(uptimeSeconds),
			statusLevel: "normal",
			statusLabel: "Normal",
			description: isContainer
				? "Aplikasi berjalan aktif dalam lingkungan kontainer terisolasi."
				: "Aplikasi berjalan aktif pada server utama (tanpa pembatasan kontainer khusus).",
		};
	}

	private async getDatabaseInfo(): Promise<SystemDatabaseInfo> {
		const start = performance.now();
		try {
			// Query gabungan untuk mendapatkan status koneksi, ukuran basis data, dan memori buffer
			const queryRes = (await prisma.$queryRawUnsafe(`
				SELECT 
					pg_size_pretty(pg_database_size(current_database())) as db_size,
					current_setting('shared_buffers') as shared_buffers,
					(SELECT count(*) FROM pg_stat_activity) as active_conns
			`)) as Array<{
				db_size: string;
				shared_buffers: string;
				active_conns: bigint | number;
			}>;

			const latencyMs = Math.round(performance.now() - start);
			const row = queryRes && queryRes[0] ? queryRes[0] : null;

			const statusLevel: HealthLevel =
				latencyMs > 600 ? "warning" : latencyMs < 300 ? "prima" : "normal";
			const statusLabel: SystemStatusLabel =
				latencyMs > 600 ? "Waspada" : latencyMs < 300 ? "Prima" : "Normal";

			return {
				status: "connected",
				statusLabel,
				statusLevel,
				latencyMs,
				sizeFormatted: row?.db_size || "12 MB",
				sharedBuffersFormatted: row?.shared_buffers || "128 MB",
				activeConnections: Number(row?.active_conns || 1),
			};
		} catch {
			return {
				status: "disconnected",
				statusLabel: "Kritis",
				statusLevel: "critical",
				latencyMs: 0,
				sizeFormatted: "Tidak Diketahui",
				sharedBuffersFormatted: "Tidak Diketahui",
				activeConnections: 0,
			};
		}
	}

	private getContainerBreakdown(
		app: SystemAppInfo,
		db: SystemDatabaseInfo,
		serverMemory: SystemMemoryInfo,
		isVercel = false,
	): SystemContainerBreakdown {
		if (isVercel) {
			const appLimitBytes = 1024 * 1024 * 1024; // 1024 MB standar alokasi fungsi Vercel
			const appPercent = Math.min(
				100,
				Math.max(0, Math.round((app.memoryUsedBytes / appLimitBytes) * 100)),
			);

			const items: ContainerServiceItem[] = [
				{
					id: "homeekost_app",
					name: "Layanan Aplikasi Web",
					role: "app",
					memoryUsedFormatted: app.memoryUsedFormatted,
					memoryLimitFormatted: "1024 MB (Serverless)",
					memoryPercentOfLimit: appPercent,
					statusLevel: appPercent > 85 ? "warning" : "prima",
					statusLabel: appPercent > 85 ? "Waspada" : "Prima",
					description:
						"Menjalankan antarmuka dashboard kos, API sistem, dan automasi notifikasi pada cloud serverless Vercel.",
				},
				{
					id: "homeekost_db",
					name: "Layanan Basis Data",
					role: "database",
					memoryUsedFormatted:
						db.status === "connected" ? db.sharedBuffersFormatted : "0 MB",
					memoryLimitFormatted: "Dikelola Cloud",
					memoryPercentOfLimit: 0,
					statusLevel: db.status === "connected" ? "prima" : "critical",
					statusLabel: db.status === "connected" ? "Prima" : "Kritis",
					description:
						db.status === "connected"
							? `Menyimpan data kamar, penyewa, & transaksi pada database cloud (Ukuran data fisik: ${db.sizeFormatted}, ${db.activeConnections} koneksi aktif).`
							: "Layanan basis data cloud tidak dapat dijangkau oleh aplikasi.",
				},
			];

			return {
				detected: false,
				summary: "Arsitektur Cloud Serverless (Vercel) — Mode Non-Docker",
				items,
			};
		}

		// Batas memori sesuai alokasi di docker-compose.yml (app: 512m, db: 256m)
		const appLimitBytes = 512 * 1024 * 1024;
		const dbLimitBytes = 256 * 1024 * 1024;

		// Hitung persentase penggunaan terhadap batas aman alokasi container
		const appPercent = Math.min(
			100,
			Math.max(0, Math.round((app.memoryUsedBytes / appLimitBytes) * 100)),
		);

		const dbSharedBytes = parseMemoryStringToBytes(db.sharedBuffersFormatted);
		const dbUsedBytes = dbSharedBytes > 0 ? dbSharedBytes : 128 * 1024 * 1024;
		const dbPercent = Math.min(
			100,
			Math.max(0, Math.round((dbUsedBytes / dbLimitBytes) * 100)),
		);

		const items: ContainerServiceItem[] = [
			{
				id: "homeekost_app",
				name: "Layanan Aplikasi Web",
				role: "app",
				memoryUsedFormatted: app.memoryUsedFormatted,
				memoryLimitFormatted: "512 MB (Batas Aman)",
				memoryPercentOfLimit: appPercent,
				statusLevel: appPercent > 85 ? "warning" : "prima",
				statusLabel: appPercent > 85 ? "Waspada" : "Prima",
				description:
					"Menjalankan antarmuka dashboard kos, API sistem, dan pengiriman notifikasi WhatsApp.",
			},
			{
				id: "homeekost_db",
				name: "Layanan Basis Data",
				role: "database",
				memoryUsedFormatted:
					db.status === "connected" ? db.sharedBuffersFormatted : "0 MB",
				memoryLimitFormatted: "256 MB (Batas Aman)",
				memoryPercentOfLimit: db.status === "connected" ? dbPercent : 0,
				statusLevel: db.status === "connected" ? "prima" : "critical",
				statusLabel: db.status === "connected" ? "Prima" : "Kritis",
				description:
					db.status === "connected"
						? `Menyimpan data kamar, penyewa, & transaksi (Ukuran data fisik: ${db.sizeFormatted}, ${db.activeConnections} koneksi aktif).`
						: "Layanan basis data tidak dapat dijangkau oleh aplikasi.",
			},
		];

		return {
			detected: app.isContainer,
			summary: app.isContainer
				? "2 Layanan Kontainer Terdeteksi Aktif"
				: "2 Layanan Utama Sistem Terpantau (Mode Standar)",
			items,
		};
	}

	private generateRecommendation(
		memory: SystemMemoryInfo,
		storage: SystemStorageInfo | null,
		database: SystemDatabaseInfo,
		cpu: SystemCpuInfo,
		isVercel = false,
	): SystemRecommendation {
		if (database.status === "disconnected") {
			return {
				level: "critical",
				headline: "Koneksi Database Terputus",
				description:
					"Server sedang kesulitan menjangkau basis data. Pastikan konfigurasi jaringan dan layanan basis data tetap aktif.",
				actionRequired: true,
			};
		}

		// KASUS KRITIS: Terjadi hanya jika RAM tinggi DAN (Penyimpanan tinggi ATAU CPU tinggi secara simultan)
		if (
			memory.usedPercent >= 90 &&
			((storage && storage.usedPercent >= 90) || cpu.loadStatus === "Tinggi")
		) {
			return {
				level: "critical",
				headline: "Kapasitas Server Mendekati Batas Maksimal",
				description:
					"Penggunaan RAM, CPU, dan penyimpanan secara bersamaan berada di batas atas karena pertumbuhan data dan aktivitas kos. Sudah saatnya mempertimbangkan peningkatan paket spesifikasi server VPS.",
				actionRequired: true,
			};
		}

		// KASUS PENYIMPANAN KRITIS
		if (storage && storage.usedPercent >= 92) {
			return {
				level: "critical",
				headline: "Penyimpanan Server Hampir Penuh",
				description:
					"Ruang penyimpanan server telah terpakai di atas 90%. Segera bersihkan berkas sampah, foto lama, atau riwayat log agar operasional tidak terganggu.",
				actionRequired: true,
			};
		}

		// KASUS PENYIMPANAN PERLU DIBERSIHKAN (RAM masih aman)
		if (storage && storage.usedPercent >= 80) {
			return {
				level: "warning",
				headline: "Penyimpanan Server Perlu Dibersihkan",
				description: `Ruang penyimpanan telah terpakai ${storage.usedPercent}%. Berkas bukti pembayaran lama atau log mulai menumpuk. Cukup bersihkan berkas sampah berkala, belum perlu upgrade paket VPS.`,
				actionRequired: false,
			};
		}

		// KASUS RAM TINGGI SEMENTARA (Penyimpanan & CPU masih aman)
		if (memory.usedPercent >= 80) {
			return {
				level: "warning",
				headline: "RAM Server Sedang Aktif Digunakan",
				description: `Penggunaan RAM mencapai ${memory.usedPercent}% untuk menampung cache data dan antrean proses agar web cepat. Ruang penyimpanan dan CPU masih sangat aman. Sistem akan melepaskan memori secara otomatis, tidak perlu upgrade VPS.`,
				actionRequired: false,
			};
		}

		// KASUS PRIMA
		if (memory.usedPercent < 60 && (!storage || storage.usedPercent < 60)) {
			return {
				level: "prima",
				headline: "Kondisi Server Sangat Prima",
				description:
					"Seluruh sumber daya RAM, penyimpanan, dan pemrosesan bekerja sangat longgar. Operasional sistem kos berjalan optimal tanpa kendala.",
				actionRequired: false,
			};
		}

		return {
			level: "normal",
			headline: "Kondisi Server Normal",
			description: isVercel
				? "Seluruh layanan aplikasi cloud Vercel dan basis data terhubung dengan optimal."
				: "Seluruh komponen server beroperasi dengan stabil dalam batas wajar aktivitas harian. Transaksi dan pencatatan kos berjalan lancar.",
			actionRequired: false,
		};
	}

	/**
	 * Mengambil seluruh parameter kesehatan server, aplikasi, dan basis data
	 * dengan format yang mudah dibaca oleh pengguna non-teknis.
	 */
	async getSystemStatus(): Promise<SystemStatusData> {
		const isVercel = Boolean(
			process.env.VERCEL ||
				process.env.VERCEL_ENV ||
				process.env.AWS_LAMBDA_FUNCTION_NAME,
		);

		const memory = this.getMemoryInfo();
		const storage = this.getStorageInfo(isVercel);
		const cpu = this.getCpuInfo();
		const app = this.getAppInfo(memory.totalBytes, isVercel);
		const database = await this.getDatabaseInfo();
		const containers = this.getContainerBreakdown(
			app,
			database,
			memory,
			isVercel,
		);
		const recommendation = this.generateRecommendation(
			memory,
			storage,
			database,
			cpu,
			isVercel,
		);

		const overallStatus: HealthLevel = recommendation.level;
		const overallStatusLabel: SystemStatusLabel =
			overallStatus === "prima"
				? "Prima"
				: overallStatus === "critical"
					? "Kritis"
					: overallStatus === "warning"
						? "Waspada"
						: "Normal";

		const platform = isVercel
			? `Vercel Serverless (${process.env.VERCEL_REGION || "Cloud"})`
			: `${os.type()} ${os.arch()}`;

		return {
			timestamp: new Date().toISOString(),
			overallStatus,
			overallStatusLabel,
			server: {
				memory,
				storage,
				cpu,
				uptimeSeconds: Math.floor(os.uptime()),
				uptimeFormatted: formatDuration(os.uptime()),
				platform,
			},
			app,
			database,
			containers,
			recommendation,
		};
	}
}

export const systemStatusService = new SystemStatusService();
