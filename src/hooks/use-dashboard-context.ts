import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardContextServerFn } from "../data/servers/index.ts";

export function useGetDashboardContext() {
	const getDashboardContext = useServerFn(getDashboardContextServerFn);

	return useQuery({
		queryKey: ["auth", "dashboard-context"],
		queryFn: () => getDashboardContext(),
	});
}
