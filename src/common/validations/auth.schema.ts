import { z } from "zod";
import { resolveLoginIdentifier } from "../helpers/auth.helper.ts";

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, "Email atau username wajib diisi")
		.min(3, "Email atau username minimal 3 karakter"),
	password: z
		.string()
		.min(1, "Password wajib diisi")
		.min(6, "Password minimal 6 karakter"),
	rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Skema login dengan sanitasi & normalisasi username otomatis
 */
export const sanitizedLoginSchema = loginSchema.transform((data) => ({
	...data,
	email: resolveLoginIdentifier(data.email),
}));

export type SanitizedLoginInput = z.infer<typeof sanitizedLoginSchema>;
