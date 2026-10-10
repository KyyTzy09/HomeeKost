import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { RoomItem } from "../common/types/index.ts";
import type { RoomFormValues } from "../common/validations/index.ts";
import {
	createRoomServerFn,
	deleteRoomServerFn,
	updateRoomServerFn,
} from "../data/servers/index.ts";
import { roomDetailQueryOptions, roomsQueryOptions } from "./query-options.ts";
import { PROPERTIES_QUERY_KEY } from "./use-properties.ts";

export const ROOMS_QUERY_KEY = ["rooms"] as const;

export function useRooms(
	propertyId?: string,
): UseQueryResult<RoomItem[], Error> {
	return useQuery(roomsQueryOptions(propertyId));
}

export function useRoom(id?: string): UseQueryResult<RoomItem | null, Error> {
	return useQuery(roomDetailQueryOptions(id || ""));
}

export function useCreateRoom(): UseMutationResult<
	RoomItem,
	Error,
	{ propertyId: string; data: RoomFormValues }
> {
	const queryClient = useQueryClient();

	return useMutation<
		RoomItem,
		Error,
		{ propertyId: string; data: RoomFormValues }
	>({
		mutationFn: async (vars: { propertyId: string; data: RoomFormValues }) => {
			return createRoomServerFn({
				data: { propertyId: vars.propertyId, data: vars.data },
			});
		},
		onSuccess: (_: RoomItem, variables: { propertyId: string }) => {
			queryClient.invalidateQueries({
				queryKey: [...ROOMS_QUERY_KEY, variables.propertyId],
			});
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
		},
	});
}

export function useUpdateRoom(): UseMutationResult<
	RoomItem,
	Error,
	{ id: string; propertyId: string; data: RoomFormValues }
> {
	const queryClient = useQueryClient();

	return useMutation<
		RoomItem,
		Error,
		{ id: string; propertyId: string; data: RoomFormValues }
	>({
		mutationFn: async (vars: {
			id: string;
			propertyId: string;
			data: RoomFormValues;
		}) => {
			return updateRoomServerFn({
				data: { id: vars.id, data: vars.data },
			});
		},
		onSuccess: (_: RoomItem, variables: { id: string; propertyId: string }) => {
			queryClient.invalidateQueries({
				queryKey: [...ROOMS_QUERY_KEY, variables.propertyId],
			});
			queryClient.invalidateQueries({
				queryKey: [...ROOMS_QUERY_KEY, "detail", variables.id],
			});
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
		},
	});
}

export function useDeleteRoom(): UseMutationResult<
	{ success: boolean; id: string },
	Error,
	{ id: string; propertyId: string }
> {
	const queryClient = useQueryClient();

	return useMutation<
		{ success: boolean; id: string },
		Error,
		{ id: string; propertyId: string }
	>({
		mutationFn: async (vars: { id: string; propertyId: string }) => {
			return deleteRoomServerFn({ data: { id: vars.id } });
		},
		onSuccess: (
			_: { success: boolean; id: string },
			variables: { propertyId: string },
		) => {
			queryClient.invalidateQueries({
				queryKey: [...ROOMS_QUERY_KEY, variables.propertyId],
			});
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
		},
	});
}
