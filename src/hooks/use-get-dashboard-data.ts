import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { DashboardOverviewData } from "../common/types/index.ts";
import { getDashboardOverviewServerFn } from "../data/servers/index.ts";

export const DASHBOARD_OVERVIEW_QUERY_KEY = ["dashboard", "overview"] as const;

export function useGetDashboardData(): UseQueryResult<
	DashboardOverviewData,
	Error
> {
	const getDashboardOverview = useServerFn(getDashboardOverviewServerFn);

	return useQuery<DashboardOverviewData, Error>({
		queryKey: DASHBOARD_OVERVIEW_QUERY_KEY,
		queryFn: () => getDashboardOverview(),
	});
}
