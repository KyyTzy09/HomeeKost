import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { TenantItem } from "../common/types/index.ts";
import type { TenantFormValues } from "../common/validations/index.ts";
import {
	createTenantServerFn,
	deleteTenantServerFn,
	getTenantByIdServerFn,
	getTenantsServerFn,
	updateTenantServerFn,
} from "../data/servers/index.ts";

export const TENANTS_QUERY_KEY = ["tenants"] as const;

export function useTenants(
	propertyId?: string,
): UseQueryResult<TenantItem[], Error> {
	const getTenants = useServerFn(getTenantsServerFn);

	return useQuery<TenantItem[], Error>({
		queryKey: [...TENANTS_QUERY_KEY, propertyId ?? "all"],
		queryFn: () => getTenants({ data: { propertyId } }),
	});
}

export function useTenant(
	id?: string,
): UseQueryResult<TenantItem | null, Error> {
	const getTenantById = useServerFn(getTenantByIdServerFn);

	return useQuery<TenantItem | null, Error>({
		queryKey: [...TENANTS_QUERY_KEY, "detail", id],
		queryFn: () => {
			if (!id) return null;
			return getTenantById({ data: { id } });
		},
		enabled: Boolean(id),
	});
}

export function useCreateTenant(): UseMutationResult<
	TenantItem,
	Error,
	{ propertyId: string; data: TenantFormValues }
> {
	const queryClient = useQueryClient();
	const createTenant = useServerFn(createTenantServerFn);

	return useMutation<
		TenantItem,
		Error,
		{ propertyId: string; data: TenantFormValues }
	>({
		mutationFn: (variables) => createTenant({ data: variables }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
			queryClient.invalidateQueries({
				queryKey: ["rooms", variables.propertyId],
			});
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			queryClient.invalidateQueries({
				queryKey: ["dashboard-overview", variables.propertyId],
			});
		},
	});
}

export function useUpdateTenant(): UseMutationResult<
	TenantItem,
	Error,
	{ id: string; propertyId: string; data: TenantFormValues }
> {
	const queryClient = useQueryClient();
	const updateTenant = useServerFn(updateTenantServerFn);

	return useMutation<
		TenantItem,
		Error,
		{ id: string; propertyId: string; data: TenantFormValues }
	>({
		mutationFn: (variables) => updateTenant({ data: variables }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
			queryClient.invalidateQueries({
				queryKey: ["rooms", variables.propertyId],
			});
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			queryClient.invalidateQueries({
				queryKey: ["dashboard-overview", variables.propertyId],
			});
		},
	});
}

export function useDeleteTenant(): UseMutationResult<
	{ success: boolean; id: string },
	Error,
	{ id: string; propertyId?: string }
> {
	const queryClient = useQueryClient();
	const deleteTenant = useServerFn(deleteTenantServerFn);

	return useMutation<
		{ success: boolean; id: string },
		Error,
		{ id: string; propertyId?: string }
	>({
		mutationFn: (variables) => deleteTenant({ data: { id: variables.id } }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
			if (variables.propertyId) {
				queryClient.invalidateQueries({
					queryKey: ["rooms", variables.propertyId],
				});
				queryClient.invalidateQueries({
					queryKey: ["dashboard-overview", variables.propertyId],
				});
			}
			queryClient.invalidateQueries({ queryKey: ["properties"] });
		},
	});
}
