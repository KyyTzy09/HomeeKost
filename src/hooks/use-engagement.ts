import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	BroadcastAnnouncementInput,
	BroadcastToSelectedRecipientsInput,
	SendBirthdayWishInput,
	SendSingleTemplateMessageInput,
} from "../common/validations/index.ts";
import {
	broadcastAnnouncementServerFn,
	broadcastToSelectedRecipientsFn,
	deleteAnnouncementServerFn,
	runDailyCronTasksServerFn,
	sendBirthdayWishServerFn,
	sendSingleTemplateMessageFn,
} from "../data/servers/index.ts";

import { engagementDashboardQueryOptions } from "./query-options.ts";

export const ENGAGEMENT_KEYS = {
	all: ["engagement"] as const,
	dashboard: () => ["engagement", "dashboard"] as const,
};

/**
 * Query untuk mengambil data Engagement Dashboard (Ultah Terdekat, Pengumuman, Log)
 */
export function useEngagementDashboard() {
	return useQuery(engagementDashboardQueryOptions());
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

/**
 * Mutation untuk mengirim pesan berdasarkan template ke satu penyewa via WhatsApp
 */
export function useSendSingleTemplateMessage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SendSingleTemplateMessageInput) =>
			sendSingleTemplateMessageFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ENGAGEMENT_KEYS.dashboard(),
			});
			queryClient.invalidateQueries({
				queryKey: ["engagement-dashboard"],
			});
		},
	});
}

/**
 * Mutation untuk broadcast pesan/template ke beberapa penyewa terpilih (Multi-Select)
 */
export function useBroadcastToSelectedRecipients() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: BroadcastToSelectedRecipientsInput) =>
			broadcastToSelectedRecipientsFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ENGAGEMENT_KEYS.dashboard(),
			});
			queryClient.invalidateQueries({
				queryKey: ["engagement-dashboard"],
			});
		},
	});
}
