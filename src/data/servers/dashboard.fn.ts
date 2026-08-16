import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import type {
	DashboardOverviewData,
	GlobalSearchResultItem,
	TopbarNotificationItem,
} from "../../common/types/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { dashboardService } from "../services/dashboard.service.ts";

export const getDashboardOverviewServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<DashboardOverviewData> => {
	const activePropertyId = getCookie("hk_active_property_id");
	return executeWithLogging(
		"getDashboardOverviewServerFn",
		{ activePropertyId },
		(session) =>
			dashboardService.getOverviewData(activePropertyId, session.user),
		{
			method: "GET",
			requireAuth: false,
			summary: (res) =>
				`Total: ${res.stats.totalRooms} kamar (${res.stats.occupiedRooms} terisi, ${res.stats.vacantRooms} kosong) · Omzet: ${res.stats.monthlyIncome}`,
		},
	);
});

export const getTopbarNotificationsServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<TopbarNotificationItem[]> => {
	const activePropertyId = getCookie("hk_active_property_id");
	return executeWithLogging(
		"getTopbarNotificationsServerFn",
		{ activePropertyId },
		() => dashboardService.getNotifications(activePropertyId),
		{
			method: "GET",
			requireAuth: false,
			summary: (res) => `${res.length} notifikasi operasional`,
		},
	);
});

export const globalSearchServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { query: string }) => {
		return z
			.object({
				query: z.string(),
			})
			.parse(input);
	})
	.handler(async ({ data }): Promise<GlobalSearchResultItem[]> => {
		const activePropertyId = getCookie("hk_active_property_id");
		return executeWithLogging(
			"globalSearchServerFn",
			{ query: data.query, activePropertyId },
			() => dashboardService.globalSearch(data.query, activePropertyId),
			{
				method: "POST",
				requireAuth: false,
				summary: (res) => `${res.length} hasil ditemukan untuk "${data.query}"`,
			},
		);
	});
