import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	type AutomationSettingsFormValues,
	automationSettingsSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { reportService } from "../services/report.service.ts";

export const getMonthlyReportServerFn = createServerFn({
	method: "GET",
})
	.validator(
		(input?: { propertyId?: string; month?: number; year?: number }) => {
			return z
				.object({
					propertyId: z.string().optional(),
					month: z.number().int().min(1).max(12).optional(),
					year: z.number().int().min(2020).max(2050).optional(),
				})
				.optional()
				.parse(input);
		},
	)
	.handler(async ({ data }) => {
		return executeWithLogging(
			"getMonthlyReportServerFn",
			data || {},
			(session) =>
				reportService.getMonthlyReport(
					data?.propertyId,
					data?.month,
					data?.year,
					session.user,
				),
			{
				method: "GET",
				summary: (res) =>
					`Laporan ${res.propertyName} (${res.periodMonth} ${res.periodYear}) - Laba: Rp${res.netProfit.toLocaleString("id-ID")}`,
			},
		);
	});

export const regenerateAiInsightServerFn = createServerFn({
	method: "POST",
})
	.validator(
		(input: { propertyId?: string; month?: number; year?: number }) => {
			return z
				.object({
					propertyId: z.string().optional(),
					month: z.number().int().min(1).max(12).optional(),
					year: z.number().int().min(2020).max(2050).optional(),
				})
				.parse(input);
		},
	)
	.handler(async ({ data }) => {
		return executeWithLogging(
			"regenerateAiInsightServerFn",
			data,
			(session) =>
				reportService.generateOrRefreshAiReport(
					data.propertyId,
					data.month,
					data.year,
					session.user,
				),
			{
				method: "POST",
				summary: (res) =>
					`Regenerasi AI Insight ${res.propertyName} (${res.periodMonth} ${res.periodYear}) - Status: ${res.financialHealthGrade} (Sisa Kuota: ${res.remainingRefreshesToday})`,
			},
		);
	});

export const triggerMonthlyReportCronServerFn = createServerFn({
	method: "POST",
})
	.validator(
		(input?: {
			propertyId?: string;
			targetPhone?: string;
			sendWhatsApp?: boolean;
			month?: number;
			year?: number;
			forceSend?: boolean;
		}) => {
			return z
				.object({
					propertyId: z.string().optional(),
					targetPhone: z.string().optional(),
					sendWhatsApp: z.boolean().optional(),
					month: z.number().int().min(1).max(12).optional(),
					year: z.number().int().min(2020).max(2050).optional(),
					forceSend: z.boolean().optional(),
				})
				.optional()
				.parse(input);
		},
	)
	.handler(async ({ data }) => {
		return executeWithLogging(
			"triggerMonthlyReportCronServerFn",
			data || {},
			() => reportService.runMonthlyReportCron(data),
			{
				method: "POST",
				summary: (res) =>
					`Cron Automasi Laporan AI: ${res.processedCount} kos diproses (${res.period.month}/${res.period.year})`,
			},
		);
	});

export const getAnnualReportMatrixServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { year: number; propertyId?: string }) => {
		return z
			.object({
				year: z.number().int().min(2020).max(2050),
				propertyId: z.string().optional(),
			})
			.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"getAnnualReportMatrixServerFn",
			data,
			(session) =>
				reportService.getAnnualReportMatrix(
					data.year,
					data.propertyId,
					session.user,
				),
			{
				method: "GET",
				summary: (res) =>
					`Matriks Tahunan ${res.year} (${res.propertyName}) - Total Omzet: Rp${res.grandTotals.totalIncome.toLocaleString("id-ID")}`,
			},
		);
	});

export const exportAnnualCsvServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { year: number; propertyId?: string }) => {
		return z
			.object({
				year: z.number().int().min(2020).max(2050),
				propertyId: z.string().optional(),
			})
			.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"exportAnnualCsvServerFn",
			data,
			(session) =>
				reportService.exportAnnualCsv(data.year, data.propertyId, session.user),
			{
				method: "POST",
				summary: (res) => `Ekspor CSV: ${res.filename}`,
			},
		);
	});

export const getReportAutomationSettingsServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<AutomationSettingsFormValues> => {
	return executeWithLogging(
		"getReportAutomationSettingsServerFn",
		{},
		() => reportService.getAutomationSettings(),
		{
			method: "GET",
			summary: (res) =>
				`Pengaturan automasi laporan: Tgl ${res.scheduleDay}, Jam ${res.scheduleTime}, WA: ${res.autoSendWhatsApp ? "Aktif" : "Nonaktif"}`,
		},
	);
});

export const updateReportAutomationSettingsServerFn = createServerFn({
	method: "POST",
})
	.validator((input: AutomationSettingsFormValues) => {
		return automationSettingsSchema.parse(input);
	})
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return executeWithLogging(
			"updateReportAutomationSettingsServerFn",
			data,
			async (session) => {
				const userRole =
					typeof (session.user as any)?.role === "string"
						? (session.user as any).role
						: (session.user as any)?.role?.name;

				if (userRole !== "SUPER_ADMIN") {
					throw new Error(
						"Akses ditolak: Hanya SuperAdmin yang berhak mengubah pengaturan automasi laporan.",
					);
				}

				await reportService.updateAutomationSettings(data, session.user as any);
				return { success: true };
			},
			{
				method: "POST",
				summary: () =>
					`Perbarui pengaturan automasi laporan: Tgl ${data.scheduleDay}, Jam ${data.scheduleTime}`,
			},
		);
	});
