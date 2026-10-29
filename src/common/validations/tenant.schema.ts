import { z } from "zod";

export const tenantSchema = z.object({
	name: z.string().min(1, "Nama lengkap wajib diisi"),
	birthDate: z
		.string()
		.nullable()
		.optional()
		.refine(
			(val) => !val || new Date(val) <= new Date(),
			"Tanggal lahir tidak boleh melebihi hari ini",
		),
	nik: z
		.string()
		.min(1, "NIK wajib diisi")
		.regex(
			/^\d{16}$/,
			"NIK harus terdiri dari 16 digit angka nasional Indonesia",
		),
	phone: z
		.string()
		.min(1, "Nomor WhatsApp wajib diisi")
		.regex(
			/^[0-9+]{10,16}$/,
			"Nomor WhatsApp harus berupa angka (10-16 digit)",
		),
	originAddress: z.string().nullable().optional(),
	email: z
		.string()
		.email("Format email tidak valid")
		.nullable()
		.optional()
		.or(z.literal(""))
		.or(z.literal(null)),
	occupationStatus: z.enum(["Mahasiswa", "Karyawan", "Lainnya"], {
		message: "Status pekerjaan harus dipilih",
	}),
	institution: z.string().nullable().optional(),
	roomNo: z.string().min(1, "Nomor kamar wajib dipilih"),
	rent: z.string().min(1, "Harga sewa per bulan wajib diisi"),
	duration: z.enum(["Bulanan", "Triwulan", "Semesteran", "Tahunan"], {
		message: "Lama sewa harus dipilih",
	}),
	startDate: z.string().min(1, "Tanggal mulai sewa wajib diisi"),
	dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
	vehicle: z.string().nullable().optional(),
	deposit: z.string().nullable().optional(),
	emergencyName: z.string().nullable().optional(),
	emergencyRelation: z.string().nullable().optional(),
	emergencyPhone: z
		.string()
		.regex(
			/^[0-9+ -]{9,20}$/,
			"Nomor telepon darurat harus berupa angka (9-20 digit)",
		)
		.nullable()
		.optional()
		.or(z.literal(""))
		.or(z.literal(null)),
	registrationDate: z.string().min(1, "Tanggal pendaftaran wajib diisi"),
	notes: z.string().nullable().optional(),
	ktpUrl: z.string().nullable().optional(),
	markPastPeriodsPaid: z.boolean().nullable().optional(),
	agreement: z.boolean().refine((val) => val === true, {
		message: "Persetujuan formulir wajib dicentang",
	}),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

export const updateTenantSchema = tenantSchema.extend({
	roomNo: z.string().nullable().optional(),
	rent: z.string().nullable().optional(),
	duration: z.enum(["Bulanan", "Triwulan", "Semesteran", "Tahunan"]).nullable().optional(),
	startDate: z.string().nullable().optional(),
	dueDate: z.string().nullable().optional(),
	registrationDate: z.string().nullable().optional(),
	agreement: z.boolean().nullable().optional(),
	roomChangeMode: z.enum(["CORRECTION", "TRANSFER"]).nullable().optional(),
	updatePendingInvoiceAmount: z.boolean().nullable().optional(),
	createDifferenceInvoice: z.boolean().nullable().optional(),
	contractUpdateScope: z.enum(["ALL_HISTORY", "CURRENT_ONLY"]).nullable().optional(),
});

export type UpdateTenantFormValues = z.infer<typeof updateTenantSchema>;
