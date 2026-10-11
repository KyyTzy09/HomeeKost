import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	type BroadcastAnnouncementInput,
	broadcastAnnouncementSchema,
	type SendBirthdayWishInput,
	sendBirthdayWishSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { engagementService } from "../services/engagement.service.ts";

export const getEngagementDashboardServerFn = createServerFn({
	method: "GET",
}).handler(async () => {
	return executeWithLogging(
		"getEngagementDashboardServerFn",
		{},
		(session) => engagementService.getEngagementDashboard(session.user),
		{
			method: "GET",
			summary: (res) =>
				`${res.upcomingBirthdays.length} ultah terdekat, ${res.recentAnnouncements.length} pengumuman`,
		},
	);
});

export const sendBirthdayWishServerFn = createServerFn({
	method: "POST",
})
	.validator((input: SendBirthdayWishInput) => {
		return sendBirthdayWishSchema.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"sendBirthdayWishServerFn",
			data,
			(session) =>
				engagementService.sendBirthdayWish(data.tenantId, session.user),
			{
				method: "POST",
				summary: (res) =>
					`Kirim Ucapan Ultah ke #${data.tenantId}: ${res.success ? "Berhasil" : "Gagal"}`,
			},
		);
	});

export const broadcastAnnouncementServerFn = createServerFn({
	method: "POST",
})
	.validator((input: BroadcastAnnouncementInput) => {
		return broadcastAnnouncementSchema.parse(input);
	})
	.handler(async ({ data }) => {
		return executeWithLogging(
			"broadcastAnnouncementServerFn",
			data,
			(session) => engagementService.broadcastAnnouncement(data, session.user),
			{
				method: "POST",
				summary: (res) =>
					`Broadcast "${data.title}" terkirim ke ${res.sentCount} anak kos (Gagal: ${res.failedCount})`,
			},
		);
	});

export const deleteAnnouncementServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }) => {
		return executeWithLogging(
			"deleteAnnouncementServerFn",
			{ id },
			(session) => engagementService.deleteAnnouncement(id, session.user),
			{
				method: "POST",
				summary: () => `Pengumuman #${id} berhasil dihapus`,
			},
		);
	});

export const runDailyCronTasksServerFn = createServerFn({
	method: "POST",
}).handler(async () => {
	return executeWithLogging(
		"runDailyCronTasksServerFn",
		{},
		() => engagementService.runDailyCronTasks(),
		{
			method: "POST",
			summary: (res) =>
				`Cron Selesai: ${res.dueRemindersSent} reminder tagihan (${res.dueRemindersSkipped || 0} skipped), ${res.birthdayWishesSent} ucapan ultah (${res.birthdaysSkipped || 0} skipped), ${res.overdueUpdatedCount} overdue updated`,
		},
	);
});
