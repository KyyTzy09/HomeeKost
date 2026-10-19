import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	exportAnnualCsvServerFn,
	regenerateAiInsightServerFn,
	triggerMonthlyReportCronServerFn,
} from "../data/servers/index.ts";

import {
	annualReportMatrixQueryOptions,
	monthlyReportQueryOptions,
} from "./query-options.ts";

export const REPORT_KEYS = {
	all: ["reports"] as const,
	monthly: (propertyId?: string, month?: number, year?: number) =>
		[
			"monthly-report",
			propertyId || "all",
			month || new Date().getMonth() + 1,
			year || new Date().getFullYear(),
		] as const,
	annual: (year: number, propertyId?: string) =>
		[
			"annual-report-matrix",
			propertyId || "all",
			year || new Date().getFullYear(),
		] as const,
};

/**
 * Query untuk mengambil Laporan Finansial Eksekutif Bulanan (Super Cepat & Instan)
 */
export function useMonthlyReport(
	propertyId?: string,
	month?: number,
	year?: number,
) {
	return useQuery(monthlyReportQueryOptions(propertyId, month, year));
}

/**
 * Query untuk mengambil Matriks Keuangan Tahunan (12 Bulan)
 */
export function useAnnualReportMatrix(year: number, propertyId?: string) {
	return useQuery(annualReportMatrixQueryOptions(propertyId, year));
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
			month?: number;
			year?: number;
		}) => triggerMonthlyReportCronServerFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: REPORT_KEYS.all });
		},
	});
}
