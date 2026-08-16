import { z } from "zod";

export const announcementCategoryEnum = z.enum([
	"KERJA_BAKTI",
	"MAINTENANCE",
	"ACARA",
	"UMUM",
]);

export const broadcastAnnouncementSchema = z.object({
	propertyId: z.string().optional().nullable(),
	category: announcementCategoryEnum.default("UMUM"),
	title: z.string().min(1, "Judul pengumuman wajib diisi").max(100),
	content: z.string().min(1, "Isi pesan pengumuman wajib diisi"),
	isBroadcast: z.boolean().default(true),
});

export type BroadcastAnnouncementInput = z.infer<
	typeof broadcastAnnouncementSchema
>;

export const sendBirthdayWishSchema = z.object({
	tenantId: z.string().min(1, "ID Penyewa wajib diisi"),
});

export type SendBirthdayWishInput = z.infer<typeof sendBirthdayWishSchema>;

export const engagementEventSchema = z.object({
	title: z.string().min(1, "Judul acara/pengumuman wajib diisi").default(""),
	property: z
		.string()
		.min(1, "Pilih target properti kos")
		.default("Semua Kost"),
	category: announcementCategoryEnum.default("UMUM"),
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
