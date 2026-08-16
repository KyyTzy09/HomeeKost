import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	exportAnnualCsvServerFn,
	getAnnualReportMatrixServerFn,
	getMonthlyReportServerFn,
	regenerateAiInsightServerFn,
	triggerMonthlyReportCronServerFn,
} from "../data/servers/index.ts";

export const REPORT_KEYS = {
	all: ["reports"] as const,
	monthly: (propertyId?: string, month?: number, year?: number) =>
		[...REPORT_KEYS.all, "monthly", propertyId || "all", month, year] as const,
	annual: (year: number, propertyId?: string) =>
		[...REPORT_KEYS.all, "annual", year, propertyId || "all"] as const,
};

/**
 * Query untuk mengambil Laporan Finansial Eksekutif Bulanan (Super Cepat & Instan)
 */
export function useMonthlyReport(
	propertyId?: string,
	month?: number,
	year?: number,
) {
	return useQuery({
		queryKey: REPORT_KEYS.monthly(propertyId, month, year),
		queryFn: () =>
			getMonthlyReportServerFn({
				data: { propertyId, month, year },
			}),
	});
}

/**
 * Query untuk mengambil Matriks Keuangan Tahunan (12 Bulan)
 */
export function useAnnualReportMatrix(year: number, propertyId?: string) {
	return useQuery({
		queryKey: REPORT_KEYS.annual(year, propertyId),
		queryFn: () =>
			getAnnualReportMatrixServerFn({
				data: { year, propertyId },
			}),
	});
}

/**
 * Mutation untuk memicu ekspor CSV Laporan Tahunan
 */
export function useExportAnnualReportCsv() {
	return useMutation({
		mutationFn: (input: { year: number; propertyId?: string }) =>
			exportAnnualCsvServerFn({ data: input }),
	});
}

/**
 * Mutation untuk me-regenerate / refresh analisis AI secara on-demand (Terbatas 2x / hari)
 */
export function useRegenerateAiInsight() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			propertyId?: string;
			month?: number;
			year?: number;
		}) => regenerateAiInsightServerFn({ data: input }),
		onSuccess: (data, variables) => {
			queryClient.setQueryData(
				REPORT_KEYS.monthly(
					variables?.propertyId,
					variables?.month,
					variables?.year,
				),
				data,
			);
			queryClient.invalidateQueries({
				queryKey: REPORT_KEYS.monthly(
					variables?.propertyId,
					variables?.month,
					variables?.year,
				),
			});
		},
	});
}

/**
 * Mutation untuk memicu eksekusi Cron Pembuatan Laporan AI Bulanan & Reminder WhatsApp
 */
export function useTriggerMonthlyReportCron() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input?: {
			propertyId?: string;
			targetPhone?: string;
			sendWhatsApp?: boolean;
		}) => triggerMonthlyReportCronServerFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: REPORT_KEYS.all });
		},
	});
}
