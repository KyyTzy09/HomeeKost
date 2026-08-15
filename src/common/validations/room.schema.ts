import { z } from "zod";

export const roomSchema = z.object({
	roomNo: z
		.string()
		.min(1, "Nomor kamar wajib diisi")
		.max(20, "Nomor kamar maksimal 20 karakter"),
	type: z.enum(["Standard", "Deluxe", "Suite"], {
		message: "Tipe kamar harus Standard, Deluxe, atau Suite",
	}),
	price: z.string().min(1, "Harga sewa per bulan wajib diisi"),
	status: z.enum(["Kosong", "Terisi", "Maintenance"], {
		message: "Status kamar tidak valid",
	}),
	facilities: z.string().optional(),
});

export type RoomFormValues = z.infer<typeof roomSchema>;
