import { z } from "zod";

export const transactionCategoryEnum = z.enum([
	"RENT",
	"UTILITIES",
	"INTERNET",
	"MAINTENANCE",
	"SALARY",
	"OTHER",
]);

export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);
export const paymentMethodEnum = z.enum(["TRANSFER", "CASH", "QRIS"]);
export const expenseClassificationEnum = z.enum(["OPERATIONAL", "INVESTMENT"]);

export const transactionFormSchema = z.object({
	propertyId: z.string().min(1, "Pilih properti kos terkait"),
	date: z.string().min(1, "Tanggal transaksi wajib diisi").default(""),
	category: z
		.string()
		.min(1, "Pilih kategori transaksi")
		.default("OPERATIONAL"),
	type: z.enum(["Income", "Expense", "INCOME", "EXPENSE"]).default("Expense"),
	classification: z
		.enum(["OPERATIONAL", "INVESTMENT", "Operasional", "Investasi"])
		.optional()
		.default("OPERATIONAL"),
	description: z
		.string()
		.min(1, "Keterangan transaksi wajib diisi")
		.max(255, "Keterangan maksimal 255 karakter")
		.default(""),
	amount: z.coerce
		.number({
			message: "Nominal harus berupa angka",
		})
		.positive("Nominal transaksi harus lebih dari 0")
		.min(1000, "Nominal minimal Rp 1.000")
		.default(0),
	method: z
		.enum(["Transfer", "Cash", "QRIS", "TRANSFER", "CASH"])
		.default("Transfer"),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// Alias for backwards compatibility
export const transactionSchema = transactionFormSchema;

export const transactionFilterSchema = z.object({
	propertyId: z.string().optional(),
	search: z.string().optional(),
	type: z.enum(["ALL", "INCOME", "EXPENSE", "Income", "Expense"]).optional(),
	category: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	sortBy: z
		.enum(["transactionDate", "amount"])
		.optional()
		.default("transactionDate"),
	sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
	page: z.coerce.number().int().positive().optional().default(1),
	limit: z.coerce.number().int().positive().optional().default(10),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

export const financialSummaryQuerySchema = z.object({
	propertyId: z.string().optional(),
	month: z.coerce.number().int().min(1).max(12).optional(),
	year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type FinancialSummaryQueryInput = z.infer<
	typeof financialSummaryQuerySchema
>;

export const annualFinancialQuerySchema = z.object({
	propertyId: z.string().optional(),
	year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type AnnualFinancialQueryInput = z.infer<
	typeof annualFinancialQuerySchema
>;

export const allocationSchema = z.object({
	description: z
		.string()
		.min(1, "Keterangan biaya bersama wajib diisi")
		.default(""),
	amount: z.coerce
		.number({
			message: "Nominal harus berupa angka",
		})
		.positive("Nominal total harus lebih dari 0")
		.default(0),
	split: z.string().default("Rata per kos"),
	props: z
		.array(z.string())
		.min(1, "Pilih minimal satu kos yang menanggung biaya"),
});

export type AllocationFormValues = z.infer<typeof allocationSchema>;
