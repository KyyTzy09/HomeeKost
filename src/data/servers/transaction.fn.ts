import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
	AnnualFinancialMatrix,
	CategoryCostItem,
	FinancialSummary,
	MonthlyTrendPoint,
	PaginatedTransactions,
	ProfitLossRow,
	TransactionItem,
} from "../../common/types/index.ts";
import {
	type AnnualFinancialQueryInput,
	annualFinancialQuerySchema,
	type FinancialSummaryQueryInput,
	financialSummaryQuerySchema,
	type TransactionFilterInput,
	type TransactionFormValues,
	transactionFilterSchema,
	transactionFormSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { cashflowService } from "../services/cashflow.service.ts";

export const getTransactionsServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: TransactionFilterInput) => {
		return transactionFilterSchema.parse(input || {});
	})
	.handler(async ({ data }): Promise<PaginatedTransactions> => {
		return executeWithLogging(
			"getTransactionsServerFn",
			data,
			(session) => cashflowService.getTransactions(data, session.user),
			{
				method: "GET",
				summary: (res) =>
					`${res.data.length} transaksi (total: ${res.totalCount}, hal: ${res.currentPage}/${res.totalPages})`,
			},
		);
	});

export const getTransactionByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }): Promise<TransactionItem | null> => {
		return executeWithLogging(
			"getTransactionByIdServerFn",
			{ id },
			(session) => cashflowService.getTransactionById(id, session.user),
			{
				method: "GET",
				summary: (res) =>
					res ? `${res.description} (${res.category})` : "Not Found",
			},
		);
	});

export const createTransactionServerFn = createServerFn({
	method: "POST",
})
	.validator((input: TransactionFormValues) => {
		return transactionFormSchema.parse(input);
	})
	.handler(async ({ data }): Promise<TransactionItem> => {
		return executeWithLogging(
			"createTransactionServerFn",
			data,
			(session) => cashflowService.createTransaction(data, session.user),
			{
				method: "POST",
				summary: (res) =>
					`Sukses dibuat: ${res.type} Rp${res.amount.toLocaleString("id-ID")} `,
			},
		);
	});

export const updateTransactionServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string; data: TransactionFormValues }) => {
		return z
			.object({
				id: z.string().min(1),
				data: transactionFormSchema,
			})
			.parse(input);
	})
	.handler(async ({ data: { id, data } }): Promise<TransactionItem> => {
		return executeWithLogging(
			"updateTransactionServerFn",
			{ id, ...data },
			(session) => cashflowService.updateTransaction(id, data, session.user),
			{
				method: "POST",
				summary: (res) => `Sukses diubah: ${res.id}`,
			},
		);
	});

export const deleteTransactionServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(
		async ({ data: { id } }): Promise<{ success: boolean; id: string }> => {
			return executeWithLogging(
				"deleteTransactionServerFn",
				{ id },
				(session) => cashflowService.deleteTransaction(id, session.user),
				{
					method: "POST",
					summary: () => `Sukses dihapus: ${id}`,
				},
			);
		},
	);

export const getFinancialSummaryServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: FinancialSummaryQueryInput) => {
		return financialSummaryQuerySchema.parse(input || {});
	})
	.handler(async ({ data }): Promise<FinancialSummary> => {
		return executeWithLogging(
			"getFinancialSummaryServerFn",
			data,
			(session) => cashflowService.getFinancialSummary(data, session.user),
			{
				method: "GET",
				summary: (res) =>
					`Omzet: Rp${res.totalIncome.toLocaleString("id-ID")} · Laba: Rp${res.netProfit.toLocaleString("id-ID")}`,
			},
		);
	});

export const getCostCompositionServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: FinancialSummaryQueryInput) => {
		return financialSummaryQuerySchema.parse(input || {});
	})
	.handler(async ({ data }): Promise<CategoryCostItem[]> => {
		return executeWithLogging(
			"getCostCompositionServerFn",
			data,
			(session) => cashflowService.getCostComposition(data, session.user),
			{
				method: "GET",
				summary: (res) => `${res.length} kategori pengeluaran`,
			},
		);
	});

export const getRecentMonthlyTrendsServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: { propertyId?: string; count?: number }) => {
		return z
			.object({
				propertyId: z.string().optional(),
				count: z.number().optional(),
			})
			.parse(input || {});
	})
	.handler(async ({ data }): Promise<MonthlyTrendPoint[]> => {
		return executeWithLogging(
			"getRecentMonthlyTrendsServerFn",
			data,
			(session) => cashflowService.getRecentMonthlyTrends(data, session.user),
			{
				method: "GET",
				summary: (res) => `${res.length} titik tren bulan`,
			},
		);
	});

export const getProfitLossStatementServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: FinancialSummaryQueryInput) => {
		return financialSummaryQuerySchema.parse(input || {});
	})
	.handler(async ({ data }): Promise<ProfitLossRow[]> => {
		return executeWithLogging(
			"getProfitLossStatementServerFn",
			data,
			(session) => cashflowService.getProfitLossStatement(data, session.user),
			{
				method: "GET",
				summary: (res) => `${res.length} baris akun laba rugi`,
			},
		);
	});

export const getAnnualFinancialMatrixServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: AnnualFinancialQueryInput) => {
		return annualFinancialQuerySchema.parse(input || {});
	})
	.handler(async ({ data }): Promise<AnnualFinancialMatrix> => {
		return executeWithLogging(
			"getAnnualFinancialMatrixServerFn",
			data,
			(session) => cashflowService.getAnnualFinancialMatrix(data, session.user),
			{
				method: "GET",
				summary: (res) =>
					`Tahun ${res.year}: Total Omzet Rp${res.totals.income.toLocaleString("id-ID")}`,
			},
		);
	});

export const exportAnnualFinancialCsvServerFn = createServerFn({
	method: "POST",
})
	.validator((input?: AnnualFinancialQueryInput) => {
		return annualFinancialQuerySchema.parse(input || {});
	})
	.handler(
		async ({ data }): Promise<{ filename: string; csvContent: string }> => {
			return executeWithLogging(
				"exportAnnualFinancialCsvServerFn",
				data,
				async (session) => {
					const year = data.year || new Date().getFullYear();
					const csvContent = await cashflowService.exportAnnualFinancialCsv(
						data,
						session.user,
					);
					const filename = `Laporan-Keuangan-Tahunan-${year}.csv`;
					return { filename, csvContent };
				},
				{
					method: "POST",
					summary: (res) => `Generated ${res.filename}`,
				},
			);
		},
	);
