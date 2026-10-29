import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	ServerAlertSettingsData,
	ServerAlertSettingsFormValues,
} from "../common/validations/index.ts";
import {
	resetDataServerFn,
	sendTestServerAlertServerFn,
	updateServerAlertSettingsServerFn,
} from "../data/servers/system.fn.ts";
import type { ResetDataStats } from "../data/services/system.service.ts";
import { serverAlertSettingsQueryOptions } from "./query-options.ts";

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

/**
 * Hook untuk membaca pengaturan notifikasi WhatsApp kapasitas server
 */
export function useServerAlertSettings(): UseQueryResult<
	ServerAlertSettingsData,
	Error
> {
	return useQuery(serverAlertSettingsQueryOptions());
}

/**
 * Hook untuk memperbarui pengaturan nomor WhatsApp peringatan server
 */
export function useUpdateServerAlertSettings(): UseMutationResult<
	ServerAlertSettingsData,
	Error,
	ServerAlertSettingsFormValues
> {
	const queryClient = useQueryClient();

	return useMutation<
		ServerAlertSettingsData,
		Error,
		ServerAlertSettingsFormValues
	>({
		mutationFn: async (values) => {
			return updateServerAlertSettingsServerFn({ data: values });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["server-alert-settings"],
			});
		},
	});
}

/**
 * Hook untuk mengirim pesan WhatsApp uji coba ke nomor tujuan
 */
export function useSendTestServerAlert(): UseMutationResult<
	{ success: boolean; message: string },
	Error,
	{ targetPhone?: string; phone?: string } | void
> {
	return useMutation<
		{ success: boolean; message: string },
		Error,
		{ targetPhone?: string; phone?: string } | void
	>({
		mutationFn: async (payload) => {
			const targetPhone =
				payload && typeof payload === "object"
					? payload.targetPhone || payload.phone
					: undefined;
			return sendTestServerAlertServerFn({ data: { targetPhone } });
		},
	});
}
