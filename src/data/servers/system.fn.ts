import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SystemStatusData } from "../../common/types/system.types.ts";
import {
	type ServerAlertSettingsData,
	type ServerAlertSettingsFormValues,
	serverAlertSettingsSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { userRepository } from "../repositories/user.repository.ts";
import { serverAlertService } from "../services/server-alert.service.ts";
import { systemStatusService } from "../services/system-status.service.ts";
import {
	type ResetDataStats,
	systemService,
} from "../services/system.service.ts";

export const getSystemStatusServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<SystemStatusData> => {
	return executeWithLogging(
		"getSystemStatusServerFn",
		{},
		async () => {
			const status = await systemStatusService.getSystemStatus();
			// Pemeriksaan otomatis notifikasi WhatsApp jika kondisi mendekati kritis/kritis
			serverAlertService.checkAndSendAlertIfDue(status).catch((err) => {
				console.error("[ServerAlert] Error checking alert condition:", err);
			});
			return status;
		},
		{
			method: "GET",
			requireAuth: false,
			summary: (res) =>
				`Status sistem: ${res.overallStatusLabel} (RAM: ${res.server.memory.usedPercent}%, App: ${res.app.memoryUsedFormatted})`,
		},
	);
});

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
					let userRole =
						typeof (session.user as any)?.role === "string"
							? (session.user as any).role
							: (session.user as any)?.role?.name;

					if (!userRole && session?.user?.id) {
						const dbUser = await userRepository.findUserWithRoleAndAccess(
							session.user.id,
						);
						userRole = dbUser?.role?.name;
					}

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

export const getServerAlertSettingsServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<ServerAlertSettingsData> => {
	return executeWithLogging(
		"getServerAlertSettingsServerFn",
		{},
		async () => {
			return serverAlertService.getSettings();
		},
		{
			method: "GET",
			requireAuth: true,
			summary: (res) =>
				`Server Alert Settings: ${res.enabled ? "Aktif" : "Nonaktif"} (Target: ${res.targetPhone || "-"})`,
		},
	);
});

export const updateServerAlertSettingsServerFn = createServerFn({
	method: "POST",
})
	.validator((input: ServerAlertSettingsFormValues) => {
		return serverAlertSettingsSchema.parse(input);
	})
	.handler(async ({ data }): Promise<ServerAlertSettingsData> => {
		return executeWithLogging(
			"updateServerAlertSettingsServerFn",
			data,
			async () => {
				return serverAlertService.updateSettings(data);
			},
			{
				method: "POST",
				requireAuth: true,
				summary: (res) =>
					`Perbarui Pengaturan Alert Server: ${res.enabled ? "Aktif" : "Nonaktif"} (HP: ${res.targetPhone})`,
			},
		);
	});

export const sendTestServerAlertServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { targetPhone: string }) => {
		return z
			.object({
				targetPhone: z.string().min(8, "Nomor WhatsApp minimal 8 digit"),
			})
			.parse(input);
	})
	.handler(
		async ({ data }): Promise<{ success: boolean; message: string }> => {
			return executeWithLogging(
				"sendTestServerAlertServerFn",
				data,
				async () => {
					return serverAlertService.sendTestAlert(data.targetPhone);
				},
				{
					method: "POST",
					requireAuth: true,
					summary: (res) => res.message,
				},
			);
		},
	);
