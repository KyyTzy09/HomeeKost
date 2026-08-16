import { z } from "zod";

export const automationSettingsSchema = z.object({
	scheduleDay: z
		.number()
		.min(1, "Hari jadwal minimal tanggal 1")
		.max(28, "Hari jadwal maksimal tanggal 28")
		.default(1),
	aiModel: z
		.enum(["gemini-1.5-flash", "gemini-3-flash", "llama-3.3-70b-versatile"])
		.default("gemini-1.5-flash"),
	autoSendWhatsApp: z.boolean().default(true),
	targetPhone: z
		.string()
		.min(1, "Nomor WhatsApp penerima wajib diisi")
		.regex(/^[0-9+]{10,16}$/, "Nomor WhatsApp harus berupa angka (10-16 digit)")
		.default("081234567890"),
});

export type AutomationSettingsFormValues = z.infer<
	typeof automationSettingsSchema
>;
