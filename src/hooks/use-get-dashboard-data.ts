import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardOverviewServerFn } from "../data/servers/index.ts";

export function useGetDashboardData() {
	const getDashboardOverview = useServerFn(getDashboardOverviewServerFn);

	return useQuery({
		queryKey: ["dashboard", "overview"],
		queryFn: () => getDashboardOverview(),
	});
}
