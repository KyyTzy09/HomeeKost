import { queryOptions } from "@tanstack/react-query";
import type {
	AnnualFinancialQueryInput,
	FinancialSummaryQueryInput,
	PaymentFilterInput,
	TransactionFilterInput,
} from "../common/validations/index.ts";
import {
	getAnnualFinancialMatrixServerFn,
	getAnnualReportMatrixServerFn,
	getCostCompositionServerFn,
	getDashboardContextServerFn,
	getDashboardOverviewServerFn,
	getEngagementDashboardServerFn,
	getFinancialSummaryServerFn,
	getMonthlyReportServerFn,
	getMyProfileServerFn,
	getPaymentStatsServerFn,
	getPaymentsServerFn,
	getProfitLossStatementServerFn,
	getPropertiesServerFn,
	getPropertyByIdServerFn,
	getRoomByIdServerFn,
	getRoomsByPropertyServerFn,
	getTenantByIdServerFn,
	getTenantsServerFn,
	getTopbarNotificationsServerFn,
	getTransactionByIdServerFn,
	getTransactionsServerFn,
	getUserAuditLogsServerFn,
	getUsersServerFn,
	globalSearchServerFn,
} from "../data/servers/index.ts";

/**
 * 1. Session / Auth & Dashboard Layout Context
 */
export const sessionContextQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard-context"] as const,
		queryFn: () => getDashboardContextServerFn(),
		staleTime: 1000 * 60 * 5, // 5 menit: Sesi tidak perlu dicek ulang terus-menerus di setiap klik halaman
	});

/**
 * 2. Dashboard Overview & Notifications
 */
export const dashboardOverviewQueryOptions = (propertyId?: string) =>
	queryOptions({
		queryKey: ["dashboard", "overview", propertyId || "all"] as const,
		queryFn: () => getDashboardOverviewServerFn(),
	});

export const topbarNotificationsQueryOptions = () =>
	queryOptions({
		queryKey: ["topbar-notifications"] as const,
		queryFn: () => getTopbarNotificationsServerFn(),
		refetchInterval: 30000,
	});

export const globalSearchQueryOptions = (query: string) =>
	queryOptions({
		queryKey: ["global-search", query] as const,
		queryFn: () => globalSearchServerFn({ data: { query } }),
		enabled: query.trim().length >= 2,
		staleTime: 5000,
	});

/**
 * 3. Properti Kos
 */
export const propertiesQueryOptions = () =>
	queryOptions({
		queryKey: ["properties"] as const,
		queryFn: () => getPropertiesServerFn(),
	});

export const propertyDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["properties", "detail", id] as const,
		queryFn: () => getPropertyByIdServerFn({ data: { id } }),
		enabled: Boolean(id),
	});

/**
 * 4. Kamar Kos
 */
export const roomsQueryOptions = (propertyId?: string) =>
	queryOptions({
		queryKey: ["rooms", propertyId || "all"] as const,
		queryFn: async () => {
			if (!propertyId) return [];
			return getRoomsByPropertyServerFn({ data: { propertyId } });
		},
	});

export const roomDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["rooms", "detail", id] as const,
		queryFn: async () => {
			if (!id) return null;
			return getRoomByIdServerFn({ data: { id } });
		},
		enabled: Boolean(id),
	});

/**
 * 5. Penghuni / Penyewa Kos
 */
export const tenantsQueryOptions = (propertyId?: string) =>
	queryOptions({
		queryKey: ["tenants", propertyId || "all"] as const,
		queryFn: () => getTenantsServerFn({ data: { propertyId } }),
	});

export const tenantDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["tenants", "detail", id] as const,
		queryFn: () => {
			if (!id) return null;
			return getTenantByIdServerFn({ data: { id } });
		},
		enabled: Boolean(id),
	});

/**
 * 6. Tagihan, Pembayaran & Invoice
 */
export const paymentsQueryOptions = (params: PaymentFilterInput = {}) =>
	queryOptions({
		queryKey: ["payments", params] as const,
		queryFn: () => getPaymentsServerFn({ data: params }),
	});

export const paymentStatsQueryOptions = (
	params: { propertyId?: string; month?: number; year?: number } = {},
) =>
	queryOptions({
		queryKey: ["payments", "stats", params] as const,
		queryFn: () => getPaymentStatsServerFn({ data: params }),
	});

export const invoicesQueryOptions = (params: PaymentFilterInput = {}) =>
	queryOptions({
		queryKey: ["invoices", params] as const,
		queryFn: () => getPaymentsServerFn({ data: params }),
	});

/**
 * 7. Arus Kas, Keuangan & Laba Rugi
 */
export const financeTransactionsQueryOptions = (
	filters?: TransactionFilterInput,
) =>
	queryOptions({
		queryKey: ["transactions", filters || {}] as const,
		queryFn: () => getTransactionsServerFn({ data: filters }),
	});

export const financeTransactionDetailQueryOptions = (id?: string) =>
	queryOptions({
		queryKey: ["transactions", "detail", id || ""] as const,
		queryFn: () => {
			if (!id) return null;
			return getTransactionByIdServerFn({ data: { id } });
		},
		enabled: Boolean(id),
	});

export const financialSummaryQueryOptions = (
	filters?: FinancialSummaryQueryInput,
) =>
	queryOptions({
		queryKey: ["financial-summary", filters || {}] as const,
		queryFn: () => getFinancialSummaryServerFn({ data: filters }),
	});

export const costCompositionQueryOptions = (
	propertyId?: string,
	month?: number,
	year?: number,
) =>
	queryOptions({
		queryKey: ["cost-composition", propertyId || "all", month, year] as const,
		queryFn: () =>
			getCostCompositionServerFn({ data: { propertyId, month, year } }),
	});

export const profitLossStatementQueryOptions = (
	propertyId?: string,
	month?: number,
	year?: number,
) =>
	queryOptions({
		queryKey: ["profit-loss", propertyId || "all", month, year] as const,
		queryFn: () =>
			getProfitLossStatementServerFn({ data: { propertyId, month, year } }),
	});

export const annualFinancialMatrixQueryOptions = (
	input?: AnnualFinancialQueryInput,
) =>
	queryOptions({
		queryKey: ["annual-matrix", input || {}] as const,
		queryFn: () => getAnnualFinancialMatrixServerFn({ data: input }),
	});

/**
 * 8. Laporan Eksekutif & AI Insight
 */
export const monthlyReportQueryOptions = (
	propertyId?: string,
	month?: number,
	year?: number,
) =>
	queryOptions({
		queryKey: [
			"monthly-report",
			propertyId || "all",
			month || new Date().getMonth() + 1,
			year || new Date().getFullYear(),
		] as const,
		queryFn: () =>
			getMonthlyReportServerFn({ data: { propertyId, month, year } }),
	});

export const annualReportMatrixQueryOptions = (
	propertyId?: string,
	year?: number,
) =>
	queryOptions({
		queryKey: [
			"annual-report-matrix",
			propertyId || "all",
			year || new Date().getFullYear(),
		] as const,
		queryFn: () =>
			getAnnualReportMatrixServerFn({
				data: { propertyId, year: year || new Date().getFullYear() },
			}),
	});

/**
 * 9. Engagement Hub
 */
export const engagementDashboardQueryOptions = () =>
	queryOptions({
		queryKey: ["engagement", "dashboard"] as const,
		queryFn: () => getEngagementDashboardServerFn(),
	});

/**
 * 10. User Management & Profil Admin
 */
export const usersQueryOptions = () =>
	queryOptions({
		queryKey: ["users"] as const,
		queryFn: () => getUsersServerFn(),
	});

export const userAuditLogsQueryOptions = () =>
	queryOptions({
		queryKey: ["users", "audit-logs"] as const,
		queryFn: () => getUserAuditLogsServerFn(),
	});

export const myProfileQueryOptions = () =>
	queryOptions({
		queryKey: ["my-profile"] as const,
		queryFn: () => getMyProfileServerFn(),
	});
