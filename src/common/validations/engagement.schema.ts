import { z } from "zod";

export const engagementEventSchema = z.object({
	title: z.string().min(1, "Judul acara/pengumuman wajib diisi").default(""),
	property: z
		.string()
		.min(1, "Pilih target properti kos")
		.default("Semua Kost"),
	category: z
		.enum(["KERJA_BAKTI", "MAINTENANCE", "ACARA", "UMUM"])
		.default("UMUM"),
	date: z.string().min(1, "Tanggal pelaksanaan wajib diisi").default(""),
	reminder: z.string().default("1 hari sebelumnya"),
	content: z.string().min(1, "Isi pengumuman wajib diisi").default(""),
	isBroadcast: z.boolean().default(true),
});

export type EngagementEventFormValues = z.infer<typeof engagementEventSchema>;

export const engagementTemplateSchema = z.object({
	name: z.string().min(1, "Nama template wajib diisi").default(""),
	content: z.string().min(1, "Isi template pesan wajib diisi").default(""),
});

export type EngagementTemplateFormValues = z.infer<
	typeof engagementTemplateSchema
>;
