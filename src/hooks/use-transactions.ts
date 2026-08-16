import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	AnnualFinancialMatrix,
	CategoryCostItem,
	FinancialSummary,
	MonthlyTrendPoint,
	PaginatedTransactions,
	ProfitLossRow,
	TransactionItem,
} from "../common/types/index.ts";
import type {
	AnnualFinancialQueryInput,
	FinancialSummaryQueryInput,
	TransactionFilterInput,
	TransactionFormValues,
} from "../common/validations/index.ts";
import {
	createTransactionServerFn,
	deleteTransactionServerFn,
	exportAnnualFinancialCsvServerFn,
	getAnnualFinancialMatrixServerFn,
	getCostCompositionServerFn,
	getFinancialSummaryServerFn,
	getProfitLossStatementServerFn,
	getRecentMonthlyTrendsServerFn,
	getTransactionByIdServerFn,
	getTransactionsServerFn,
	updateTransactionServerFn,
} from "../data/servers/index.ts";
import { DASHBOARD_CONTEXT_QUERY_KEY } from "./use-dashboard-context.ts";

export const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;
export const FINANCIAL_SUMMARY_QUERY_KEY = ["financial-summary"] as const;
export const COST_COMPOSITION_QUERY_KEY = ["cost-composition"] as const;
export const MONTHLY_TRENDS_QUERY_KEY = ["monthly-trends"] as const;
export const PROFIT_LOSS_QUERY_KEY = ["profit-loss"] as const;
export const ANNUAL_MATRIX_QUERY_KEY = ["annual-matrix"] as const;

export function useTransactions(
	filters?: TransactionFilterInput,
): UseQueryResult<PaginatedTransactions, Error> {
	return useQuery<PaginatedTransactions, Error>({
		queryKey: [...TRANSACTIONS_QUERY_KEY, filters],
		queryFn: async () => {
			return getTransactionsServerFn({ data: filters });
		},
	});
}

export function useTransaction(
	id?: string,
): UseQueryResult<TransactionItem | null, Error> {
	return useQuery<TransactionItem | null, Error>({
		queryKey: [...TRANSACTIONS_QUERY_KEY, id],
		queryFn: async () => {
			if (!id) return null;
			return getTransactionByIdServerFn({ data: { id } });
		},
		enabled: Boolean(id),
	});
}

export function useFinancialSummary(
	query?: FinancialSummaryQueryInput,
): UseQueryResult<FinancialSummary, Error> {
	return useQuery<FinancialSummary, Error>({
		queryKey: [...FINANCIAL_SUMMARY_QUERY_KEY, query],
		queryFn: async () => {
			return getFinancialSummaryServerFn({ data: query });
		},
	});
}

export function useCostComposition(
	query?: FinancialSummaryQueryInput,
): UseQueryResult<CategoryCostItem[], Error> {
	return useQuery<CategoryCostItem[], Error>({
		queryKey: [...COST_COMPOSITION_QUERY_KEY, query],
		queryFn: async () => {
			return getCostCompositionServerFn({ data: query });
		},
	});
}

export function useRecentMonthlyTrends(query?: {
	propertyId?: string;
	count?: number;
}): UseQueryResult<MonthlyTrendPoint[], Error> {
	return useQuery<MonthlyTrendPoint[], Error>({
		queryKey: [...MONTHLY_TRENDS_QUERY_KEY, query],
		queryFn: async () => {
			return getRecentMonthlyTrendsServerFn({ data: query });
		},
	});
}

export function useProfitLossStatement(
	query?: FinancialSummaryQueryInput,
): UseQueryResult<ProfitLossRow[], Error> {
	return useQuery<ProfitLossRow[], Error>({
		queryKey: [...PROFIT_LOSS_QUERY_KEY, query],
		queryFn: async () => {
			return getProfitLossStatementServerFn({ data: query });
		},
	});
}

export function useAnnualFinancialMatrix(
	query?: AnnualFinancialQueryInput,
): UseQueryResult<AnnualFinancialMatrix, Error> {
	return useQuery<AnnualFinancialMatrix, Error>({
		queryKey: [...ANNUAL_MATRIX_QUERY_KEY, query],
		queryFn: async () => {
			return getAnnualFinancialMatrixServerFn({ data: query });
		},
	});
}

export function useCreateTransaction(): UseMutationResult<
	TransactionItem,
	Error,
	TransactionFormValues
> {
	const queryClient = useQueryClient();

	return useMutation<TransactionItem, Error, TransactionFormValues>({
		mutationFn: async (data: TransactionFormValues) => {
			return createTransactionServerFn({ data });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: FINANCIAL_SUMMARY_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: COST_COMPOSITION_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: MONTHLY_TRENDS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: PROFIT_LOSS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ANNUAL_MATRIX_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
		},
	});
}

export function useUpdateTransaction(): UseMutationResult<
	TransactionItem,
	Error,
	{ id: string; data: TransactionFormValues }
> {
	const queryClient = useQueryClient();

	return useMutation<
		TransactionItem,
		Error,
		{ id: string; data: TransactionFormValues }
	>({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: TransactionFormValues;
		}) => {
			return updateTransactionServerFn({ data: { id, data } });
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
			queryClient.invalidateQueries({
				queryKey: [...TRANSACTIONS_QUERY_KEY, variables.id],
			});
			queryClient.invalidateQueries({ queryKey: FINANCIAL_SUMMARY_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: COST_COMPOSITION_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: MONTHLY_TRENDS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: PROFIT_LOSS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ANNUAL_MATRIX_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
		},
	});
}

export function useDeleteTransaction(): UseMutationResult<
	{ success: boolean; id: string },
	Error,
	string
> {
	const queryClient = useQueryClient();

	return useMutation<{ success: boolean; id: string }, Error, string>({
		mutationFn: async (id: string) => {
			return deleteTransactionServerFn({ data: { id } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: FINANCIAL_SUMMARY_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: COST_COMPOSITION_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: MONTHLY_TRENDS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: PROFIT_LOSS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ANNUAL_MATRIX_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
		},
	});
}

export function useExportAnnualCsv(): UseMutationResult<
	{ filename: string; csvContent: string },
	Error,
	AnnualFinancialQueryInput
> {
	return useMutation<
		{ filename: string; csvContent: string },
		Error,
		AnnualFinancialQueryInput
	>({
		mutationFn: async (data: AnnualFinancialQueryInput) => {
			return exportAnnualFinancialCsvServerFn({ data });
		},
	});
}
