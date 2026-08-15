import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { DashboardOverviewData } from "../../common/types/index.ts";
import { dashboardService } from "../services/dashboard.service.ts";

export const getDashboardOverviewServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<DashboardOverviewData> => {
	const activePropertyId = getCookie("hk_active_property_id");
	return dashboardService.getOverviewData(activePropertyId);
});
