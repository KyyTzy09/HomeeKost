import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { DashboardContextData } from "../common/types/index.ts";
import { sessionContextQueryOptions } from "./query-options.ts";

export const DASHBOARD_CONTEXT_QUERY_KEY = ["dashboard-context"] as const;

export function useGetDashboardContext(): UseQueryResult<
	DashboardContextData | null,
	Error
> {
	return useQuery(sessionContextQueryOptions());
}

export function useDashboardContext() {
	const { data, isLoading, error } = useGetDashboardContext();

	return {
		user: data?.user ?? null,
		userName: data?.user?.name ?? "Admin",
		userRole: data?.role ?? "ADMIN",
		isSuperAdmin: data?.isSuperAdmin ?? false,
		activeProperty: data?.activeProperty ?? null,
		accessibleProperties: data?.accessibleProperties ?? [],
		isLoading,
		error,
	};
}
