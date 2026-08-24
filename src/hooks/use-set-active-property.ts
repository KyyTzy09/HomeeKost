import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { DashboardContextData } from "../common/types/index.ts";
import type { SetActivePropertyInput } from "../common/validations/index.ts";
import { setActivePropertyServerFn } from "../data/servers/index.ts";
import { sessionContextQueryOptions } from "./query-options.ts";

export interface SetActivePropertyResult {
	success: boolean;
	propertyId: string;
	propertyName: string;
}

export function useSetActiveProperty(): UseMutationResult<
	SetActivePropertyResult,
	Error,
	SetActivePropertyInput,
	{ previousContext?: DashboardContextData | null }
> {
	const setActiveProperty = useServerFn(setActivePropertyServerFn);
	const queryClient = useQueryClient();

	return useMutation<
		SetActivePropertyResult,
		Error,
		SetActivePropertyInput,
		{ previousContext?: DashboardContextData | null }
	>({
		mutationFn: async (input: SetActivePropertyInput) => {
			return setActiveProperty({ data: input });
		},
		onMutate: async (input: SetActivePropertyInput) => {
			const queryOpts = sessionContextQueryOptions();
			await queryClient.cancelQueries({ queryKey: queryOpts.queryKey });
			const previousContext = queryClient.getQueryData(queryOpts.queryKey);

			queryClient.setQueryData(queryOpts.queryKey, (old) => {
				if (!old) return old;
				const targetProp = old.accessibleProperties.find(
					(p) => p.id === input.propertyId,
				);
				if (!targetProp) return old;
				return {
					...old,
					activeProperty: targetProp,
				};
			});

			return { previousContext };
		},
		onError: (_err, _input, context) => {
			if (context?.previousContext !== undefined) {
				queryClient.setQueryData(
					sessionContextQueryOptions().queryKey,
					context.previousContext,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: sessionContextQueryOptions().queryKey,
			});
		},
	});
}
