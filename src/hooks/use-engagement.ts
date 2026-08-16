import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	BroadcastAnnouncementInput,
	SendBirthdayWishInput,
} from "../common/validations/index.ts";
import {
	broadcastAnnouncementServerFn,
	deleteAnnouncementServerFn,
	getEngagementDashboardServerFn,
	runDailyCronTasksServerFn,
	sendBirthdayWishServerFn,
} from "../data/servers/index.ts";

export const ENGAGEMENT_KEYS = {
	all: ["engagement"] as const,
	dashboard: () => [...ENGAGEMENT_KEYS.all, "dashboard"] as const,
};

/**
 * Query untuk mengambil data Engagement Dashboard (Ultah Terdekat, Pengumuman, Log)
 */
export function useEngagementDashboard() {
	return useQuery({
		queryKey: ENGAGEMENT_KEYS.dashboard(),
		queryFn: () => getEngagementDashboardServerFn(),
	});
}

/**
 * Mutation untuk mengirim ucapan selamat ulang tahun personal via WhatsApp
 */
export function useSendBirthdayWish() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SendBirthdayWishInput) =>
			sendBirthdayWishServerFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ENGAGEMENT_KEYS.dashboard(),
			});
		},
	});
}

/**
 * Mutation untuk broadcast pengumuman kos via WhatsApp
 */
export function useBroadcastAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: BroadcastAnnouncementInput) =>
			broadcastAnnouncementServerFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ENGAGEMENT_KEYS.dashboard(),
			});
		},
	});
}

/**
 * Mutation untuk menghapus pengumuman kos
 */
export function useDeleteAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteAnnouncementServerFn({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ENGAGEMENT_KEYS.dashboard(),
			});
		},
	});
}

/**
 * Mutation untuk menjalankan trigger cron harian secara manual
 */
export function useRunDailyCronTasks() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => runDailyCronTasksServerFn(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ENGAGEMENT_KEYS.dashboard(),
			});
			queryClient.invalidateQueries({ queryKey: ["payments"] });
		},
	});
}
