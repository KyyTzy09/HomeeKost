import { z } from "zod";

export const invoiceSchema = z.object({
	number: z.string().min(1, "Nomor invoice wajib diisi").default(""),
	created: z.string().min(1, "Tanggal pembuatan wajib diisi").default(""),
	tenantName: z
		.string()
		.min(1, "Pilih atau masukkan nama penghuni")
		.default(""),
	roomNo: z.string().min(1, "Pilih atau masukkan nomor kamar").default(""),
	period: z.string().min(1, "Periode sewa wajib diisi").default(""),
	description: z.string().min(1, "Deskripsi tagihan wajib diisi").default(""),
	amount: z.coerce
		.number({
			message: "Nominal harus berupa angka",
		})
		.positive("Nominal tagihan harus lebih dari 0")
		.default(0),
	status: z
		.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"])
		.default("PENDING"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
