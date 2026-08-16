import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { DashboardOverviewData } from "../../common/types/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { dashboardService } from "../services/dashboard.service.ts";

export const getDashboardOverviewServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<DashboardOverviewData> => {
	const activePropertyId = getCookie("hk_active_property_id");
	return executeWithLogging(
		"getDashboardOverviewServerFn",
		{ activePropertyId },
		() => dashboardService.getOverviewData(activePropertyId),
		{
			method: "GET",
			requireAuth: false,
			summary: (res) =>
				`Total: ${res.stats.totalRooms} kamar (${res.stats.occupiedRooms} terisi, ${res.stats.vacantRooms} kosong) · Omzet: ${res.stats.monthlyIncome}`,
		},
	);
});
