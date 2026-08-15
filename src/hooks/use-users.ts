import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { AuditLogItem, UserItem } from "../common/types/index.ts";
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

export function useUsers(): UseQueryResult<UserItem[], Error> {
	return useQuery<UserItem[], Error>({
		queryKey: USERS_QUERY_KEY,
		queryFn: async () => {
			return getUsersServerFn();
		},
	});
}

export function useUserAuditLogs(): UseQueryResult<AuditLogItem[], Error> {
	return useQuery<AuditLogItem[], Error>({
		queryKey: USER_AUDIT_LOGS_QUERY_KEY,
		queryFn: async () => {
			return getUserAuditLogsServerFn();
		},
	});
}

export function useCreateUser(): UseMutationResult<
	UserItem,
	Error,
	UserFormValues
> {
	const queryClient = useQueryClient();

	return useMutation<UserItem, Error, UserFormValues>({
		mutationFn: async (data: UserFormValues) => {
			return createUserServerFn({ data });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: USER_AUDIT_LOGS_QUERY_KEY });
		},
	});
}

export function useUpdateUser(): UseMutationResult<
	UserItem,
	Error,
	{ id: string; data: UserFormValues }
> {
	const queryClient = useQueryClient();

	return useMutation<UserItem, Error, { id: string; data: UserFormValues }>({
		mutationFn: async ({ id, data }: { id: string; data: UserFormValues }) => {
			return updateUserServerFn({ data: { id, data } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: USER_AUDIT_LOGS_QUERY_KEY });
		},
	});
}

export function useDeleteUser(): UseMutationResult<
	{ success: boolean; id: string },
	Error,
	string
> {
	const queryClient = useQueryClient();

	return useMutation<{ success: boolean; id: string }, Error, string>({
		mutationFn: async (id: string) => {
			return deleteUserServerFn({ data: { id } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: USER_AUDIT_LOGS_QUERY_KEY });
		},
	});
}
