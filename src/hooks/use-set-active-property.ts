import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { SetActivePropertyInput } from "../common/validations/index.ts";
import { setActivePropertyServerFn } from "../data/servers/index.ts";

export interface SetActivePropertyResult {
	success: boolean;
	propertyId: string;
	propertyName: string;
}

export function useSetActiveProperty(): UseMutationResult<
	SetActivePropertyResult,
	Error,
	SetActivePropertyInput
> {
	const setActiveProperty = useServerFn(setActivePropertyServerFn);
	const queryClient = useQueryClient();

	return useMutation<SetActivePropertyResult, Error, SetActivePropertyInput>({
		mutationFn: async (input: SetActivePropertyInput) => {
			return setActiveProperty({ data: input });
		},
		onSuccess: async () => {
			// Hanya invalidate context sesi agar Topbar, Sidebar, dan activeProperty ter-update
			await queryClient.invalidateQueries({ queryKey: ["dashboard-context"] });
		},
	});
}
