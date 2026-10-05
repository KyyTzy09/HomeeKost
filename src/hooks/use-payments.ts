import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaymentFilterParams } from "../common/types/index.ts";
import type {
	ConfirmPaymentInput,
	CreateManualInvoiceInput,
	GenerateMonthlyInvoicesInput,
	SendWhatsAppInvoiceInput,
} from "../common/validations/index.ts";
import {
	confirmPaymentServerFn,
	createManualInvoiceServerFn,
	deleteInvoiceServerFn,
	generateMonthlyInvoicesServerFn,
	sendWhatsAppInvoiceServerFn,
} from "../data/servers/payment.fn.ts";
import {
	invoicesQueryOptions,
	paymentStatsQueryOptions,
	paymentsQueryOptions,
} from "./query-options.ts";

export const PAYMENT_QUERY_KEY = ["payments"] as const;
export const PAYMENT_STATS_QUERY_KEY = ["payments", "stats"] as const;

export function usePayments(params: PaymentFilterParams = {}) {
	return useQuery(paymentsQueryOptions(params));
}

export function usePaymentStats(
	params: { propertyId?: string; month?: number; year?: number } = {},
) {
	return useQuery(paymentStatsQueryOptions(params));
}

export function useInvoices(params: PaymentFilterParams = {}) {
	return useQuery(invoicesQueryOptions(params));
}

export function useConfirmPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ConfirmPaymentInput) => confirmPaymentServerFn({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
		},
	});
}

export function useCreateManualInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateManualInvoiceInput) =>
			createManualInvoiceServerFn({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			queryClient.invalidateQueries({ queryKey: PAYMENT_STATS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
		},
	});
}

export function useGenerateMonthlyInvoices() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: GenerateMonthlyInvoicesInput) =>
			generateMonthlyInvoicesServerFn({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
		},
	});
}

export function useSendWhatsAppInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SendWhatsAppInvoiceInput) =>
			sendWhatsAppInvoiceServerFn({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEY });
		},
	});
}

export function useDeleteInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteInvoiceServerFn({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: PAYMENT_STATS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["cashflow-overview"] });
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["reports"] });
		},
	});
}
