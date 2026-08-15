import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "../db.ts";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 hari
		updateAge: 60 * 60 * 24, // Update token setiap 1 hari
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 7, // 7 hari
			strategy: "jwt", // Stateless — session disimpan di cookie JWT, tidak query tabel sessions
		},
	},
	account: {
		storeStateStrategy: "cookie",
	},
	plugins: [
		tanstackStartCookies(), // Harus plugin terakhir
	],
});
