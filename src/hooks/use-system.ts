import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { resetDataServerFn } from "../data/servers/system.fn.ts";
import type { ResetDataStats } from "../data/services/system.service.ts";

export interface ResetDataResult {
	success: boolean;
	message: string;
	stats: ResetDataStats;
}

export function useResetData(): UseMutationResult<
	ResetDataResult,
	Error,
	{ confirmation: string }
> {
	const queryClient = useQueryClient();

	return useMutation<ResetDataResult, Error, { confirmation: string }>({
		mutationFn: async ({ confirmation }) => {
			return resetDataServerFn({ data: { confirmation } });
		},
		onSuccess: () => {
			// Invalidate all operational queries across dashboard
			queryClient.invalidateQueries();
		},
	});
}
