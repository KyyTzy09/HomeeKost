import { describe, expect, it } from "bun:test";
import type { SystemStatusData } from "../../src/common/types/system.types.ts";
import { serverAlertSettingsSchema } from "../../src/common/validations/system-alert.schema.ts";
import { ServerAlertService } from "../../src/data/services/server-alert.service.ts";
import { whatsappTemplates } from "../../src/lib/whatsapp-templates.ts";

describe("Server Alert WhatsApp Notifications", () => {
	describe("serverAlertSettingsSchema", () => {
		it("meloloskan konfigurasi valid dengan nomor WhatsApp", () => {
			const res = serverAlertSettingsSchema.safeParse({
				enabled: true,
				targetPhone: "081234567890",
				triggerCondition: "NEAR_CRITICAL_AND_CRITICAL",
				cooldownHours: 6,
			});
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.enabled).toBe(true);
				expect(res.data.targetPhone).toBe("081234567890");
			}
		});

		it("meloloskan nomor kosong jika notifikasi dinonaktifkan (enabled: false)", () => {
			const res = serverAlertSettingsSchema.safeParse({
				enabled: false,
				targetPhone: "",
				triggerCondition: "CRITICAL_ONLY",
				cooldownHours: 12,
			});
			expect(res.success).toBe(true);
		});

		it("menolak nomor kosong jika notifikasi diaktifkan (enabled: true)", () => {
			const res = serverAlertSettingsSchema.safeParse({
				enabled: true,
				targetPhone: "",
				triggerCondition: "NEAR_CRITICAL_AND_CRITICAL",
				cooldownHours: 6,
			});
			expect(res.success).toBe(false);
		});

		it("menolak nomor kurang dari 8 digit jika notifikasi aktif", () => {
			const res = serverAlertSettingsSchema.safeParse({
				enabled: true,
				targetPhone: "1234",
				triggerCondition: "NEAR_CRITICAL_AND_CRITICAL",
				cooldownHours: 6,
			});
			expect(res.success).toBe(false);
		});
	});

	describe("WhatsApp Alert Templates", () => {
		it("menghasilkan template serverStatusAlert yang ramah dan tidak memakai jargon teknis rumit", () => {
			const text = whatsappTemplates.serverStatusAlert({
				statusLabel: "Mendekati Kritis",
				headline: "RAM mulai mendekati batas normal",
				description: "Sebagian memori digunakan untuk cache sistem.",
				ramPercent: 88,
				ramUsedFormatted: "1.76 GB",
				ramTotalFormatted: "2 GB",
				storagePercent: 70,
				storageUsedFormatted: "14 GB",
				storageTotalFormatted: "20 GB",
				cpuLoadStatus: "Normal",
				databaseStatus: "Terhubung & Siap",
				actionAdvice:
					"Server masih berjalan dengan baik, cache RAM akan dibersihkan otomatis saat dibutuhkan.",
				statusUrl: "http://localhost:3000/status",
			});

			expect(text).toContain("PERINGATAN KAPASITAS SERVER");
			expect(text).toContain("MENDEKATI KRITIS");
			expect(text).toContain("88%");
			expect(text).toContain("Penyimpanan");
			expect(text).toContain("Basis Data");
			expect(text).toContain("Tindakan yang Disarankan");
			expect(text).toContain("http://localhost:3000/status");
			// Pastikan tidak ada jargon programmer asing
			expect(text).not.toContain("cgroups");
			expect(text).not.toContain("RSS");
			expect(text).not.toContain("shared_buffers");
		});

		it("menghasilkan template serverTestAlert untuk verifikasi nomor", () => {
			const text = whatsappTemplates.serverTestAlert({
				recipientPhone: "6281234567890",
			});
			expect(text).toContain("UJI COBA NOTIFIKASI WHATSAPP");
			expect(text).toContain("6281234567890");
			expect(text).toContain("berhasil terhubung");
		});
	});

	describe("ServerAlertService Logic Gate", () => {
		const mockStatusNormal: SystemStatusData = {
			timestamp: new Date().toISOString(),
			overallStatus: "healthy",
			overallStatusLabel: "Normal",
			server: {
				uptimeSeconds: 3600,
				uptimeFormatted: "1 jam",
				cpu: { count: 2, model: "Virtual CPU", loadStatus: "Normal" },
				memory: {
					totalBytes: 2147483648,
					usedBytes: 1073741824,
					freeBytes: 1073741824,
					usedPercent: 50,
					totalFormatted: "2.0 GB",
					usedFormatted: "1.0 GB",
					freeFormatted: "1.0 GB",
				},
				storage: {
					totalBytes: 20000000000,
					usedBytes: 10000000000,
					freeBytes: 10000000000,
					usedPercent: 50,
					totalFormatted: "20.0 GB",
					usedFormatted: "10.0 GB",
					freeFormatted: "10.0 GB",
				},
			},
			database: {
				status: "connected",
				statusLabel: "Terhubung & Siap",
				responseTimeMs: 5,
				sizeBytes: 10485760,
				sizeFormatted: "10.0 MB",
			},
			app: {
				version: "1.0.0",
				environment: "test",
				memoryUsedBytes: 52428800,
				memoryUsedFormatted: "50.0 MB",
				processUptimeFormatted: "1 jam",
			},
		};

		const mockStatusWaspada: SystemStatusData = {
			...mockStatusNormal,
			overallStatus: "warning",
			overallStatusLabel: "Waspada",
			server: {
				...mockStatusNormal.server,
				memory: {
					...mockStatusNormal.server.memory,
					usedPercent: 88,
				},
			},
		};

		it("tidak mengirim alert jika status server Normal atau Prima (hemat kuota)", async () => {
			const mockSettingRepo = {
				getSetting: async () => ({
					enabled: true,
					targetPhone: "6281234567890",
					triggerCondition: "NEAR_CRITICAL_AND_CRITICAL",
					cooldownHours: 6,
					lastNotifiedAt: null,
					lastNotifiedStatus: null,
				}),
				setSetting: async () => ({ id: "1", key: "k", value: "v", updatedAt: new Date() }),
			};

			const mockStatusService = {
				getSystemStatus: async () => mockStatusNormal,
			};

			const service = new ServerAlertService(
				mockSettingRepo as any,
				mockStatusService as any,
			);

			const result = await service.checkAndSendAlertIfDue(mockStatusNormal);
			expect(result.sent).toBe(false);
			expect(result.reason).toBe("condition_not_met");
		});

		it("tidak mengirim alert jika kondisi Waspada tetapi setting memilih CRITICAL_ONLY", async () => {
			const mockSettingRepo = {
				getSetting: async () => ({
					enabled: true,
					targetPhone: "6281234567890",
					triggerCondition: "CRITICAL_ONLY",
					cooldownHours: 6,
					lastNotifiedAt: null,
					lastNotifiedStatus: null,
				}),
				setSetting: async () => ({ id: "1", key: "k", value: "v", updatedAt: new Date() }),
			};

			const mockStatusService = {
				getSystemStatus: async () => mockStatusWaspada,
			};

			const service = new ServerAlertService(
				mockSettingRepo as any,
				mockStatusService as any,
			);

			const result = await service.checkAndSendAlertIfDue(mockStatusWaspada);
			expect(result.sent).toBe(false);
			expect(result.reason).toBe("condition_not_met");
		});

		it("mencegah pengiriman berulang jika cooldown aktif (anti-spam)", async () => {
			const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
			const mockSettingRepo = {
				getSetting: async () => ({
					enabled: true,
					targetPhone: "6281234567890",
					triggerCondition: "NEAR_CRITICAL_AND_CRITICAL",
					cooldownHours: 6, // butuh 6 jam jeda
					lastNotifiedAt: twoHoursAgo, // baru 2 jam lalu
					lastNotifiedStatus: "Mendekati Kritis",
				}),
				setSetting: async () => ({ id: "1", key: "k", value: "v", updatedAt: new Date() }),
			};

			const mockStatusService = {
				getSystemStatus: async () => mockStatusWaspada,
			};

			const service = new ServerAlertService(
				mockSettingRepo as any,
				mockStatusService as any,
			);

			const result = await service.checkAndSendAlertIfDue(mockStatusWaspada);
			expect(result.sent).toBe(false);
			expect(result.reason).toBe("cooldown_active");
		});
	});
});
