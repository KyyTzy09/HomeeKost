import { z } from "zod";

export const tenantSchema = z.object({
	name: z.string().min(1, "Nama lengkap wajib diisi"),
	birthDate: z
		.string()
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
		.min(10, "Nomor WhatsApp minimal 10 digit")
		.max(16, "Nomor WhatsApp maksimal 16 digit"),
	originAddress: z.string().optional(),
	email: z
		.string()
		.email("Format email tidak valid")
		.optional()
		.or(z.literal("")),
	occupationStatus: z.enum(["Mahasiswa", "Karyawan", "Lainnya"], {
		message: "Status pekerjaan harus dipilih",
	}),
	institution: z.string().optional(),
	roomNo: z.string().min(1, "Nomor kamar wajib dipilih"),
	rent: z.string().min(1, "Harga sewa per bulan wajib diisi"),
	duration: z.enum(["Bulanan", "Triwulan", "Semesteran", "Tahunan"], {
		message: "Lama sewa harus dipilih",
	}),
	startDate: z.string().min(1, "Tanggal mulai sewa wajib diisi"),
	dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
	vehicle: z.string().optional(),
	deposit: z.string().optional(),
	emergencyName: z.string().optional(),
	emergencyRelation: z.string().optional(),
	emergencyPhone: z.string().optional(),
	registrationDate: z.string().min(1, "Tanggal pendaftaran wajib diisi"),
	notes: z.string().optional(),
	agreement: z.boolean().refine((val) => val === true, {
		message: "Persetujuan formulir wajib dicentang",
	}),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;
