import { z } from "zod";

export const propertySchema = z.object({
	name: z
		.string()
		.min(1, "Nama properti kos wajib diisi")
		.min(2, "Nama kos minimal 2 karakter"),
	address: z
		.string()
		.min(1, "Alamat kos wajib diisi")
		.min(5, "Alamat kos minimal 5 karakter"),
	description: z.string().optional().default(""),
	bankAccountInfo: z.string().optional().default(""),
	imageUrl: z.string().optional().default(""),
	totalRooms: z
		.number({ message: "Jumlah kamar harus berupa angka" })
		.int("Jumlah kamar harus berupa bilangan bulat")
		.min(1, "Jumlah kamar minimal 1 kamar")
		.max(200, "Jumlah kamar maksimal 200 kamar")
		.default(10),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
