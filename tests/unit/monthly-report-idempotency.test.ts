import { describe, expect, it, vi, beforeEach } from "vitest";
import { ReportService } from "../../src/data/services/report.service.ts";
import type { ReportRepository } from "../../src/data/repositories/report.repository.ts";
import type { PropertyRepository } from "../../src/data/repositories/property.repository.ts";
import type { SystemSettingRepository } from "../../src/data/repositories/system-setting.repository.ts";

describe("Monthly Report Idempotency & Anti-Spam Guard", () => {
	let mockReportRepo: Partial<ReportRepository>;
	let mockPropertyRepo: Partial<PropertyRepository>;
	let mockSystemSettingRepo: Partial<SystemSettingRepository>;
	let settingsStore: Record<string, any>;

	beforeEach(() => {
		settingsStore = {};

		mockReportRepo = {
			findStoredAiReport: vi.fn().mockResolvedValue(null),
			saveStoredAiReport: vi.fn().mockResolvedValue(undefined),
		};

		mockPropertyRepo = {
			findAll: vi.fn().mockResolvedValue([
				{ id: "prop-1", name: "HomeeKost Pusat" },
			]),
		};

		mockSystemSettingRepo = {
			getSetting: vi.fn().mockImplementation(async (key: string) => {
				return settingsStore[key] || null;
			}),
			setSetting: vi.fn().mockImplementation(async (key: string, value: any) => {
				settingsStore[key] = value;
			}),
		};
	});

	it("harus melewati eksekusi jika token idempotency sudah ada dalam database (Anti-Spam)", async () => {
		const service = new ReportService(
			mockReportRepo as ReportRepository,
			mockPropertyRepo as PropertyRepository,
			mockSystemSettingRepo as SystemSettingRepository,
		);

		// Simulasikan token idempotency periode 9/2026 sudah tersimpan dari runner sebelumnya
		const idempotencyKey = "cron_monthly_report_2026_9";
		settingsStore[idempotencyKey] = {
			processedAt: "2026-10-01T01:00:00.000Z",
			month: 9,
			year: 2026,
			resultsCount: 1,
		};

		const result = await service.runMonthlyReportCron({
			month: 9,
			year: 2026,
		});

		expect(result.success).toBe(true);
		expect(result.skipped).toBe(true);
		expect((result as any).idempotent).toBe(true);
		expect((result as any).reason).toContain("sudah diproses sebelumnya");
	});

	it("harus mengizinkan eksekusi ulang jika forceSend bernilai true meskipun sudah pernah diproses", async () => {
		const service = new ReportService(
			mockReportRepo as ReportRepository,
			mockPropertyRepo as PropertyRepository,
			mockSystemSettingRepo as SystemSettingRepository,
		);

		// Mock internal report generation
		vi.spyOn(service as any, "generateOrRefreshAiReport").mockResolvedValue({
			propertyId: "prop-1",
			month: 9,
			year: 2026,
			income: 10000000,
			expense: 5000000,
			netProfit: 5000000,
			occupancyRate: 85,
			narrative: "Analisis performa",
		});

		// Simulasikan token idempotency sudah ada
		const idempotencyKey = "cron_monthly_report_2026_9";
		settingsStore[idempotencyKey] = {
			processedAt: "2026-10-01T01:00:00.000Z",
			month: 9,
			year: 2026,
		};

		const result = await service.runMonthlyReportCron({
			month: 9,
			year: 2026,
			forceSend: true,
		});

		expect(result.success).toBe(true);
		expect((result as any).skipped).toBeUndefined();
		expect(result.processedCount).toBeGreaterThanOrEqual(1);

		// Pastikan alert notifikasi terbaru diterbitkan
		expect(settingsStore["latest_monthly_report_alert"]).toBeDefined();
		expect(settingsStore["latest_monthly_report_alert"].month).toBe(9);
		expect(settingsStore["latest_monthly_report_alert"].year).toBe(2026);
		expect(settingsStore["latest_monthly_report_alert"].active).toBe(true);
	});

	it("harus menyimpan latest_monthly_report_alert saat eksekusi baru berhasil dijalankan", async () => {
		const service = new ReportService(
			mockReportRepo as ReportRepository,
			mockPropertyRepo as PropertyRepository,
			mockSystemSettingRepo as SystemSettingRepository,
		);

		vi.spyOn(service as any, "generateOrRefreshAiReport").mockResolvedValue({
			propertyId: "prop-1",
			month: 10,
			year: 2026,
			income: 15000000,
			expense: 6000000,
			netProfit: 9000000,
			occupancyRate: 90,
			narrative: "Performa stabil",
		});

		const result = await service.runMonthlyReportCron({
			month: 10,
			year: 2026,
		});

		expect(result.success).toBe(true);
		expect(settingsStore["cron_monthly_report_2026_10"]).toBeDefined();
		expect(settingsStore["latest_monthly_report_alert"]).toBeDefined();
		expect(settingsStore["latest_monthly_report_alert"].month).toBe(10);
		expect(settingsStore["latest_monthly_report_alert"].year).toBe(2026);
		expect(settingsStore["latest_monthly_report_alert"].monthName).toBe("Oktober");
	});
});
