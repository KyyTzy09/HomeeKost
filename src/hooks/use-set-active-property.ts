import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { SetActivePropertyInput } from "../common/validations/index.ts";
import { setActivePropertyServerFn } from "../data/servers/index.ts";

export function useSetActiveProperty() {
	const setActiveProperty = useServerFn(setActivePropertyServerFn);
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async (input: SetActivePropertyInput) => {
			return setActiveProperty({ data: input });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			await router.invalidate();
		},
	});
}
