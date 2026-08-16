import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type {
	DashboardOverviewData,
	GlobalSearchResultItem,
	TopbarNotificationItem,
} from "../common/types/index.ts";
import {
	getDashboardOverviewServerFn,
	getTopbarNotificationsServerFn,
	globalSearchServerFn,
} from "../data/servers/index.ts";

export const DASHBOARD_OVERVIEW_QUERY_KEY = ["dashboard", "overview"] as const;
export const TOPBAR_NOTIFICATIONS_QUERY_KEY = ["topbar-notifications"] as const;

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

export function useTopbarNotifications(): UseQueryResult<
	TopbarNotificationItem[],
	Error
> {
	const getTopbarNotifications = useServerFn(getTopbarNotificationsServerFn);

	return useQuery<TopbarNotificationItem[], Error>({
		queryKey: TOPBAR_NOTIFICATIONS_QUERY_KEY,
		queryFn: () => getTopbarNotifications(),
		refetchInterval: 30000,
	});
}

export function useGlobalSearch(
	query: string,
): UseQueryResult<GlobalSearchResultItem[], Error> {
	const globalSearch = useServerFn(globalSearchServerFn);

	return useQuery<GlobalSearchResultItem[], Error>({
		queryKey: ["global-search", query] as const,
		queryFn: () => globalSearch({ data: { query } }),
		enabled: query.trim().length >= 2,
		staleTime: 5000,
	});
}
