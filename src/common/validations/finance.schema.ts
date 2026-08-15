import { z } from "zod";

export const transactionSchema = z.object({
	date: z.string().min(1, "Tanggal transaksi wajib diisi").default(""),
	property: z
		.string()
		.min(1, "Pilih properti kos terkait")
		.default("Semua Kost"),
	category: z
		.string()
		.min(1, "Pilih kategori transaksi")
		.default("Operasional"),
	type: z.enum(["Income", "Expense"]).default("Expense"),
	description: z
		.string()
		.min(1, "Keterangan transaksi wajib diisi")
		.default(""),
	amount: z.coerce
		.number({
			message: "Nominal harus berupa angka",
		})
		.positive("Nominal transaksi harus lebih dari 0")
		.default(0),
	method: z.enum(["Transfer", "Cash", "QRIS"]).default("Transfer"),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

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
