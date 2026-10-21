import { z } from "zod";

export const automationSettingsSchema = z
	.object({
		scheduleDay: z
			.number()
			.min(1, "Hari jadwal minimal tanggal 1")
			.max(28, "Hari jadwal maksimal tanggal 28")
			.default(1),
		scheduleTime: z
			.string()
			.regex(
				/^([01]\d|2[0-3]):([0-5]\d)$/,
				"Format waktu harus HH:mm (contoh: 08:00)",
			)
			.default("08:00"),
		aiModel: z
			.enum([
				"gemini-3.5-flash",
				"gemini-2.5-flash",
				"gemini-1.5-flash",
				"gemini-3-flash",
				"llama-3.3-70b-versatile",
			])
			.default("gemini-3.5-flash")
			.optional(),
		autoSendWhatsApp: z.boolean().default(true),
		targetPhone: z
			.string()
			.regex(
				/^([0-9+]{10,16})?$/,
				"Nomor WhatsApp harus berupa angka (10-16 digit)",
			)
			.optional()
			.or(z.literal(""))
			.default(""),
	})
	.refine(
		(data) => {
			if (data.autoSendWhatsApp) {
				return Boolean(
					data.targetPhone && data.targetPhone.trim().length >= 10,
				);
			}
			return true;
		},
		{
			message:
				"Nomor WhatsApp penerima wajib diisi (minimal 10 digit) jika kirim otomatis diaktifkan",
			path: ["targetPhone"],
		},
	);

export type AutomationSettingsFormValues = z.infer<
	typeof automationSettingsSchema
>;
