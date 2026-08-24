import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { PropertyItem } from "../common/types/index.ts";
import type { PropertyFormValues } from "../common/validations/index.ts";
import {
	createPropertyServerFn,
	deletePropertyServerFn,
	updatePropertyServerFn,
} from "../data/servers/index.ts";
import {
	propertiesQueryOptions,
	propertyDetailQueryOptions,
} from "./query-options.ts";
import { DASHBOARD_CONTEXT_QUERY_KEY } from "./use-dashboard-context.ts";

export const PROPERTIES_QUERY_KEY = ["properties"] as const;

export function useProperties(): UseQueryResult<PropertyItem[], Error> {
	return useQuery(propertiesQueryOptions());
}

export function useProperty(
	id?: string,
): UseQueryResult<PropertyItem | null, Error> {
	return useQuery(propertyDetailQueryOptions(id || ""));
}

export function useCreateProperty(): UseMutationResult<
	PropertyItem,
	Error,
	PropertyFormValues
> {
	const queryClient = useQueryClient();

	return useMutation<PropertyItem, Error, PropertyFormValues>({
		mutationFn: async (data: PropertyFormValues) => {
			return createPropertyServerFn({ data });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
		},
	});
}

export function useUpdateProperty(): UseMutationResult<
	PropertyItem,
	Error,
	{ id: string; data: PropertyFormValues }
> {
	const queryClient = useQueryClient();

	return useMutation<
		PropertyItem,
		Error,
		{ id: string; data: PropertyFormValues }
	>({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: PropertyFormValues;
		}) => {
			return updatePropertyServerFn({ data: { id, data } });
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.invalidateQueries({
				queryKey: [...PROPERTIES_QUERY_KEY, variables.id],
			});
			queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
		},
	});
}

export function useDeleteProperty(): UseMutationResult<
	{ success: boolean; id: string },
	Error,
	string
> {
	const queryClient = useQueryClient();

	return useMutation<{ success: boolean; id: string }, Error, string>({
		mutationFn: async (id: string) => {
			return deletePropertyServerFn({ data: { id } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTEXT_QUERY_KEY });
		},
	});
}
