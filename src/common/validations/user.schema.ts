import { z } from "zod";

export const userFormSchema = z.object({
	name: z.string().min(1, "Nama lengkap pengguna wajib diisi").default(""),
	email: z
		.string()
		.min(1, "Email wajib diisi")
		.email("Format email tidak valid")
		.default(""),
	role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF"]).default("ADMIN"),
	assignedProperty: z
		.string()
		.min(1, "Pilih penugasan cabang kos")
		.default("Semua Kost"),
	status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
