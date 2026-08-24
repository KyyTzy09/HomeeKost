import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type {
	DashboardOverviewData,
	GlobalSearchResultItem,
	TopbarNotificationItem,
} from "../common/types/index.ts";
import {
	dashboardOverviewQueryOptions,
	globalSearchQueryOptions,
	topbarNotificationsQueryOptions,
} from "./query-options.ts";

export const DASHBOARD_OVERVIEW_QUERY_KEY = ["dashboard", "overview"] as const;
export const TOPBAR_NOTIFICATIONS_QUERY_KEY = ["topbar-notifications"] as const;

export function useGetDashboardData(
	propertyId?: string,
): UseQueryResult<DashboardOverviewData, Error> {
	return useQuery(dashboardOverviewQueryOptions(propertyId));
}

export function useTopbarNotifications(): UseQueryResult<
	TopbarNotificationItem[],
	Error
> {
	return useQuery(topbarNotificationsQueryOptions());
}

export function useGlobalSearch(
	query: string,
): UseQueryResult<GlobalSearchResultItem[], Error> {
	return useQuery(globalSearchQueryOptions(query));
}
