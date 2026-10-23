import { z } from "zod";

export const PAYMENT_STATUS = {
	ALL: "ALL",
	PAID: "PAID",
	PENDING: "PENDING",
	OVERDUE: "OVERDUE",
	CANCELLED: "CANCELLED",
} as const;

export const paymentFilterSchema = z.object({
	propertyId: z.string().optional(),
	status: z.enum(["ALL", "PENDING", "PAID", "OVERDUE", "PARTIAL"]).optional(),
	month: z.number().min(1).max(12).optional(),
	year: z.number().min(2020).max(2050).optional(),
	search: z.string().optional(),
	sortBy: z.enum(["dueDate", "amount", "createdAt"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	page: z.number().int().positive().optional(),
	limit: z.number().int().positive().max(100).optional(),
});

export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;

export const confirmPaymentSchema = z.object({
	invoiceId: z.string().min(1, "Invoice ID wajib disertakan"),
	paymentMethod: z.enum(["TRANSFER", "CASH", "QRIS"], {
		message: "Metode pembayaran wajib dipilih",
	}),
	paidDate: z
		.string()
		.min(1, "Tanggal pembayaran wajib diisi")
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
	notes: z.string().optional(),
	sendReceiptWhatsApp: z.boolean().optional().default(true),
	isPartial: z.boolean().optional().default(false),
	amount: z.number().positive("Nominal pembayaran harus lebih dari 0").optional(),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

export const createManualInvoiceSchema = z.object({
	contractId: z.string().min(1, "Kontrak sewa penghuni wajib dipilih"),
	periodMonth: z
		.number({ message: "Bulan periode wajib dipilih" })
		.min(1)
		.max(12),
	periodYear: z
		.number({ message: "Tahun periode wajib dipilih" })
		.min(2020)
		.max(2050),
	amount: z
		.number({ message: "Nominal tagihan harus berupa angka" })
		.min(1000, "Nominal minimal Rp 1.000"),
	dueDate: z
		.string()
		.min(1, "Tanggal jatuh tempo wajib diisi")
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
	notes: z.string().optional(),
	sendWhatsApp: z.boolean().optional().default(false),
});

export type CreateManualInvoiceInput = z.infer<
	typeof createManualInvoiceSchema
>;

export const generateMonthlyInvoicesSchema = z.object({
	propertyId: z.string().min(1, "Cabang kos wajib dipilih"),
	periodMonth: z.number().min(1).max(12),
	periodYear: z.number().min(2020).max(2050),
	dueDateDay: z.number().min(1).max(31).optional().default(10),
});

export type GenerateMonthlyInvoicesInput = z.infer<
	typeof generateMonthlyInvoicesSchema
>;

export const sendWhatsAppInvoiceSchema = z.object({
	invoiceId: z.string().min(1, "Invoice ID wajib diisi"),
	type: z.enum(["NEW_INVOICE", "REMINDER", "RECEIPT"]).default("NEW_INVOICE"),
});

export type SendWhatsAppInvoiceInput = z.infer<
	typeof sendWhatsAppInvoiceSchema
>;
