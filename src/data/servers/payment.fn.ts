import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
	ConfirmPaymentResult,
	PaginatedPayments,
	PaymentStats,
} from "../../common/types/index.ts";
import {
	type ConfirmPaymentInput,
	type CreateManualInvoiceInput,
	confirmPaymentSchema,
	createManualInvoiceSchema,
	type GenerateMonthlyInvoicesInput,
	generateMonthlyInvoicesSchema,
	type PaymentFilterInput,
	paymentFilterSchema,
	type SendWhatsAppInvoiceInput,
	sendWhatsAppInvoiceSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { paymentService } from "../services/payment.service.ts";

export const getPaymentsServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: PaymentFilterInput) => {
		return paymentFilterSchema.parse(input || {});
	})
	.handler(async ({ data }): Promise<PaginatedPayments> => {
		return executeWithLogging(
			"getPaymentsServerFn",
			data,
			(session) => paymentService.getPayments(data, session.user),
			{
				method: "GET",
				summary: (res) =>
					`${res.data.length} tagihan (total: ${res.totalCount}, hal: ${res.currentPage}/${res.totalPages})`,
			},
		);
	});

export const getPaymentStatsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		(input?: { propertyId?: string; month?: number; year?: number }) => {
			return z
				.object({
					propertyId: z.string().optional(),
					month: z.number().optional(),
					year: z.number().optional(),
				})
				.parse(input || {});
		},
	)
	.handler(async ({ data }): Promise<PaymentStats> => {
		return executeWithLogging(
			"getPaymentStatsServerFn",
			data,
			(session) => paymentService.getPaymentStats(data, session.user),
			{
				method: "GET",
				summary: (res) =>
					`Total: ${res.totalInvoices} tagihan (Lunas: ${res.paidCount}, Pending: ${res.pendingCount}, Overdue: ${res.overdueCount})`,
			},
		);
	});

export const confirmPaymentServerFn = createServerFn({
	method: "POST",
})
	.validator((input: ConfirmPaymentInput) => {
		return confirmPaymentSchema.parse(input);
	})
	.handler(async ({ data }): Promise<ConfirmPaymentResult> => {
		return executeWithLogging(
			"confirmPaymentServerFn",
			data,
			(session) => paymentService.confirmPayment(data, session.user),
			{
				method: "POST",
				summary: (res) =>
					`Invoice #${data.invoiceId} berhasil lunas (Kas ID: ${res.transactionId}, WA: ${res.whatsappSent ? "Sent" : "No"})`,
			},
		);
	});

export const createManualInvoiceServerFn = createServerFn({
	method: "POST",
})
	.validator((input: CreateManualInvoiceInput) => {
		return createManualInvoiceSchema.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"createManualInvoiceServerFn",
			data,
			(session) => paymentService.createManualInvoice(data, session.user),
			{
				method: "POST",
				summary: (res) =>
					`Invoice #${res.invoiceNumber} dibuat (WA: ${res.whatsappSent ? "Sent" : "No"})`,
			},
		);
	});

export const generateMonthlyInvoicesServerFn = createServerFn({
	method: "POST",
})
	.validator((input: GenerateMonthlyInvoicesInput) => {
		return generateMonthlyInvoicesSchema.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"generateMonthlyInvoicesServerFn",
			data,
			(session) => paymentService.generateMonthlyInvoices(data, session.user),
			{
				method: "POST",
				summary: (res) =>
					`${res.generatedCount} invoice bulanan berhasil di-generate`,
			},
		);
	});

export const sendWhatsAppInvoiceServerFn = createServerFn({
	method: "POST",
})
	.validator((input: SendWhatsAppInvoiceInput) => {
		return sendWhatsAppInvoiceSchema.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"sendWhatsAppInvoiceServerFn",
			data,
			(session) =>
				paymentService.sendWhatsAppMessage(
					data.invoiceId,
					data.type,
					session.user,
				),
			{
				method: "POST",
				summary: (res) =>
					`Kirim WA (${data.type}) #${data.invoiceId}: ${res.success ? "Berhasil" : "Gagal / Fallback URL"}`,
			},
		);
	});

export const deleteInvoiceServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }) => {
		return executeWithLogging(
			"deleteInvoiceServerFn",
			{ id },
			(session) => paymentService.deleteInvoice(id, session.user),
			{
				method: "POST",
				summary: () => `Invoice #${id} berhasil dihapus`,
			},
		);
	});
