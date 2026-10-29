import { z } from "zod";

/**
 * Skema Validasi Pengaturan Notifikasi WhatsApp Peringatan Kapasitas Server (VPS)
 */
export const serverAlertSettingsSchema = z
	.object({
		enabled: z.boolean().default(false),
		targetPhone: z.string().default(""),
		triggerCondition: z
			.enum(["CRITICAL_ONLY", "NEAR_CRITICAL_AND_CRITICAL"])
			.default("NEAR_CRITICAL_AND_CRITICAL"),
		cooldownHours: z.coerce.number().int().min(1).max(24).default(6),
	})
	.superRefine((data, ctx) => {
		if (data.enabled) {
			const cleaned = data.targetPhone.trim().replace(/[^0-9+]/g, "");
			if (!cleaned || cleaned.length < 8) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"Nomor WhatsApp wajib diisi minimal 8 digit saat notifikasi aktif (contoh: 08123456789)",
					path: ["targetPhone"],
				});
			}
		}
	});

export type ServerAlertSettingsFormValues = z.infer<
	typeof serverAlertSettingsSchema
>;

export interface ServerAlertSettingsData extends ServerAlertSettingsFormValues {
	lastNotifiedAt?: string | null;
	lastNotifiedStatus?: string | null;
}
