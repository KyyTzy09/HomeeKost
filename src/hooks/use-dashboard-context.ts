import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { DashboardContextData } from "../common/types/index.ts";
import { getDashboardContextServerFn } from "../data/servers/index.ts";

export const DASHBOARD_CONTEXT_QUERY_KEY = [
	"auth",
	"dashboard-context",
] as const;

export function useGetDashboardContext(): UseQueryResult<
	DashboardContextData | null,
	Error
> {
	const getDashboardContext = useServerFn(getDashboardContextServerFn);

	return useQuery<DashboardContextData | null, Error>({
		queryKey: DASHBOARD_CONTEXT_QUERY_KEY,
		queryFn: () => getDashboardContext(),
	});
}

export function useDashboardContext() {
	const { data, isLoading, error } = useGetDashboardContext();

	return {
		user: data?.user ?? null,
		userName: data?.user.name ?? "Admin",
		userRole: data?.role ?? "ADMIN",
		isSuperAdmin: data?.isSuperAdmin ?? false,
		activeProperty: data?.activeProperty ?? null,
		accessibleProperties: data?.accessibleProperties ?? [],
		isLoading,
		error,
	};
}
