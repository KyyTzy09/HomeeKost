import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "../db.ts";

const rawAppUrl = process.env.APP_URL;
const rawBetterAuthUrl = process.env.BETTER_AUTH_URL;

const cleanOrigin = (url?: string) => url?.trim().replace(/\/+$/, "");

const origins = [
	"https://homeekost.web.id",
	"https://homee-kost.vercel.app",
	"http://localhost:3000",
	"http://localhost:5173",
];

const cleanedAppUrl = cleanOrigin(rawAppUrl);
if (cleanedAppUrl) {
	origins.push(cleanedAppUrl);
}

const cleanedBetterAuthUrl = cleanOrigin(rawBetterAuthUrl);
if (cleanedBetterAuthUrl) {
	origins.push(cleanedBetterAuthUrl);
}

const trustedOrigins = Array.from(new Set(origins));

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
	trustedOrigins,
	plugins: [
		tanstackStartCookies(), // Harus plugin terakhir
	],
});
