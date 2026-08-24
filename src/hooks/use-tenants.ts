import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { TenantItem } from "../common/types/index.ts";
import type { TenantFormValues } from "../common/validations/index.ts";
import {
	createTenantServerFn,
	deleteTenantServerFn,
	updateTenantServerFn,
} from "../data/servers/index.ts";

import {
	tenantDetailQueryOptions,
	tenantsQueryOptions,
} from "./query-options.ts";

export const TENANTS_QUERY_KEY = ["tenants"] as const;

export function useTenants(
	propertyId?: string,
): UseQueryResult<TenantItem[], Error> {
	return useQuery(tenantsQueryOptions(propertyId));
}

export function useTenant(
	id?: string,
): UseQueryResult<TenantItem | null, Error> {
	return useQuery(tenantDetailQueryOptions(id || ""));
}

export function useCreateTenant(): UseMutationResult<
	TenantItem,
	Error,
	{ propertyId: string; data: TenantFormValues }
> {
	const queryClient = useQueryClient();

	return useMutation<
		TenantItem,
		Error,
		{ propertyId: string; data: TenantFormValues }
	>({
		mutationFn: (variables) => createTenantServerFn({ data: variables }),
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

	return useMutation<
		TenantItem,
		Error,
		{ id: string; propertyId: string; data: TenantFormValues }
	>({
		mutationFn: (variables) => updateTenantServerFn({ data: variables }),
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

	return useMutation<
		{ success: boolean; id: string },
		Error,
		{ id: string; propertyId?: string }
	>({
		mutationFn: (variables) =>
			deleteTenantServerFn({ data: { id: variables.id } }),
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
