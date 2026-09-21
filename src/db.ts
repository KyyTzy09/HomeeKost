import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "./database-url.ts";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaPg({
	connectionString: getDatabaseUrl(),
});

declare global {
	var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter });

// Selalu cache prisma di globalThis agar container serverless yang masih hidup (warm lambdas)
// tidak membuat pool koneksi database berulang-ulang
globalThis.__prisma = prisma;
