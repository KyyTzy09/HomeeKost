import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import {
	type ResetDataStats,
	systemService,
} from "../services/system.service.ts";

export const resetDataServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { confirmation: string }) => {
		return z
			.object({
				confirmation: z.string().refine((val) => val === "RESET", {
					message: 'Ketik kata "RESET" dengan tepat untuk mengonfirmasi.',
				}),
			})
			.parse(input);
	})

	.handler(
		async ({
			data,
		}): Promise<{
			success: boolean;
			message: string;
			stats: ResetDataStats;
		}> => {
			return executeWithLogging(
				"resetDataServerFn",
				data,
				async (session) => {
					// Guard RBAC Ketat: Hanya SUPER_ADMIN yang berhak mereset data
					const userRole = (
						session.user as unknown as { role?: { name: string } }
					)?.role?.name;

					if (userRole !== "SUPER_ADMIN") {
						throw new Error(
							"Akses ditolak: Hanya pemilik (SuperAdmin) yang diizinkan melakukan reset data.",
						);
					}

					return systemService.resetOperationalData();
				},
				{
					method: "POST",
					summary: (res) =>
						`Sukses reset data: ${res.stats.deletedTransactions} transaksi, ${res.stats.deletedTenants} penyewa dihapus.`,
				},
			);
		},
	);
