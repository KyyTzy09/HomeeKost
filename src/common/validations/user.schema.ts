import { z } from "zod";

export const userFormSchema = z.object({
	name: z.string().min(1, "Nama lengkap pengguna wajib diisi").default(""),
	email: z
		.string()
		.min(1, "Email wajib diisi")
		.email("Format email tidak valid")
		.default(""),
	role: z.enum(["SUPER_ADMIN", "ADMIN"]).default("ADMIN"),
	assignedProperty: z
		.string()
		.min(1, "Pilih penugasan cabang kos")
		.default("Semua Kost"),
	status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const profileUpdateSchema = z.object({
	name: z.string().min(1, "Nama lengkap wajib diisi").default(""),
	email: z
		.string()
		.min(1, "Email wajib diisi")
		.email("Format email tidak valid")
		.default(""),
	phoneNumber: z
		.string()
		.regex(/^[0-9+]{10,16}$/, "Nomor WhatsApp harus 10-16 digit angka")
		.optional()
		.or(z.literal(""))
		.default(""),
	newPassword: z
		.string()
		.min(8, "Password baru minimal 8 karakter")
		.optional()
		.or(z.literal("")),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
		newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
		confirmNewPassword: z
			.string()
			.min(8, "Konfirmasi password baru minimal 8 karakter"),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: "Konfirmasi password baru tidak cocok",
		path: ["confirmNewPassword"],
	});

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
