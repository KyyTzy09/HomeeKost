import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserFormValues } from "../common/validations/index.ts";
import {
	createUserServerFn,
	deleteUserServerFn,
	getUserAuditLogsServerFn,
	getUsersServerFn,
	updateUserServerFn,
} from "../data/servers/index.ts";

export const USERS_QUERY_KEY = ["users"] as const;
export const USER_AUDIT_LOGS_QUERY_KEY = ["user-audit-logs"] as const;

export function useUsers() {
	return useQuery({
		queryKey: USERS_QUERY_KEY,
		queryFn: async () => {
			return getUsersServerFn();
		},
	});
}

export function useUserAuditLogs() {
	return useQuery({
		queryKey: USER_AUDIT_LOGS_QUERY_KEY,
		queryFn: async () => {
			return getUserAuditLogsServerFn();
		},
	});
}

export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UserFormValues) => {
			return createUserServerFn({ data });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: USER_AUDIT_LOGS_QUERY_KEY });
		},
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: UserFormValues }) => {
			return updateUserServerFn({ data: { id, data } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: USER_AUDIT_LOGS_QUERY_KEY });
		},
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return deleteUserServerFn({ data: { id } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: USER_AUDIT_LOGS_QUERY_KEY });
		},
	});
}
