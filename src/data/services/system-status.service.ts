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
		let statusLabel = "Kondisi Normal";

		if (usedPercent >= 90) {
			statusLevel = "critical";
			statusLabel = "Kritis / Mendekati Batas";
		} else if (usedPercent >= 75) {
			statusLevel = "warning";
			statusLabel = "Perlu Dipantau";
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
				let statusLabel = "Sangat Lega";

				if (usedPercent >= 95) {
					statusLevel = "critical";
					statusLabel = "Penuh / Kritis";
				} else if (usedPercent >= 85) {
					statusLevel = "warning";
					statusLabel = "Hampir Penuh";
				} else if (usedPercent >= 70) {
					statusLevel = "normal";
					statusLabel = "Cukup";
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
		if (normalizedLoad >= 1.0) {
			loadStatus = "Tinggi";
		} else if (normalizedLoad >= 0.7) {
			loadStatus = "Sedang";
		}

		return {
			cores,
			model: `${cores} Inti Pemroses`,
			loadAvg1m: Math.round(load1m * 100) / 100,
			loadStatus,
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
				statusLevel: "normal",
				statusLabel: "Aktif Serverless",
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
			statusLabel: "Berjalan Normal",
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

			return {
				status: "connected",
				statusLabel: "Terhubung Normal",
				statusLevel: latencyMs > 600 ? "warning" : "normal",
				latencyMs,
				sizeFormatted: row?.db_size || "12 MB",
				sharedBuffersFormatted: row?.shared_buffers || "128 MB",
				activeConnections: Number(row?.active_conns || 1),
			};
		} catch {
			return {
				status: "disconnected",
				statusLabel: "Kendala Koneksi",
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
					statusLevel: appPercent > 85 ? "warning" : "normal",
					statusLabel: "Aktif Serverless",
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
					statusLevel: db.status === "connected" ? "normal" : "critical",
					statusLabel:
						db.status === "connected" ? "Terhubung Cloud" : "Terkendala",
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
				statusLevel: appPercent > 85 ? "warning" : "normal",
				statusLabel: appPercent > 85 ? "Mendekati Batas" : "Aktif Normal",
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
				statusLevel: db.status === "connected" ? "normal" : "critical",
				statusLabel:
					db.status === "connected" ? "Aktif Normal" : "Terkendala",
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
		isVercel = false,
	): SystemRecommendation {
		if (database.status === "disconnected") {
			return {
				level: "critical",
				headline: "Koneksi Basis Data Mengalami Kendala",
				description:
					"Server saat ini kesulitan menjangkau basis data. Pastikan konfigurasi jaringan dan layanan basis data tetap aktif.",
				actionRequired: true,
			};
		}

		if (storage && storage.usedPercent >= 95) {
			return {
				level: "critical",
				headline: isVercel
					? "Penyimpanan Sementara Vercel Hampir Habis"
					: "Ruang Penyimpanan Server Penuh (Kritis)",
				description: isVercel
					? "Penyimpanan sementara (/tmp) pada runtime Vercel telah mencapai 95%. Bersihkan berkas sementara aplikasi jika diperlukan."
					: "Kapasitas penyimpanan server telah melebihi 95%. Sangat disarankan untuk segera membersihkan cache Docker ('docker system prune -a') atau menambah kapasitas disk VPS.",
				actionRequired: true,
			};
		}

		if (memory.usedPercent >= 90) {
			return {
				level: "critical",
				headline: "Kapasitas Memori Server Mendekati Batas Maksimal",
				description:
					"Penggunaan memori server saat ini berada di atas 90%. Disarankan untuk mempertimbangkan peningkatan spesifikasi server ke paket berikutnya agar performa aplikasi tetap lancar dan tidak terjadi gangguan mendadak.",
				actionRequired: true,
			};
		}

		if (storage && storage.usedPercent >= 85) {
			return {
				level: "warning",
				headline: "Ruang Penyimpanan Server Mendekati Penuh",
				description:
					"Kapasitas penyimpanan server telah melebihi 85%. Disarankan untuk memantau sisa ruang disk dan membersihkan berkas log lama.",
				actionRequired: false,
			};
		}

		if (memory.usedPercent >= 75) {
			return {
				level: "warning",
				headline: "Kapasitas Memori Dalam Batas Perhatian",
				description:
					"Penggunaan memori berada di atas 75%. Kondisi masih aman untuk operasional harian, namun disarankan untuk memantau jika ada lonjakan transaksi atau penambahan banyak kamar baru.",
				actionRequired: false,
			};
		}

		return {
			level: "normal",
			headline: isVercel
				? "Layanan Serverless Vercel Berjalan Prima"
				: "Kapasitas Server Berjalan Sangat Sehat",
			description: isVercel
				? "Seluruh layanan aplikasi cloud Vercel dan basis data terhubung dengan optimal."
				: "Seluruh komponen server beroperasi dengan optimal. Penggunaan memori dan penyimpanan masih dalam batas aman, belum diperlukan peningkatan spesifikasi server saat ini.",
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
			isVercel,
		);

		let overallStatus: HealthLevel = "normal";
		let overallStatusLabel = "Semua Sistem Normal";

		if (recommendation.level === "critical") {
			overallStatus = "critical";
			overallStatusLabel = "Perlu Perhatian Khusus";
		} else if (recommendation.level === "warning") {
			overallStatus = "warning";
			overallStatusLabel = "Perlu Dipantau";
		}

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
