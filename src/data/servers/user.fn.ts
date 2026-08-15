import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import type { AuditLogItem, UserItem } from "../../common/types/index.ts";
import {
	type UserFormValues,
	userFormSchema,
} from "../../common/validations/index.ts";
import { auth } from "../../lib/auth.ts";
import { userManagementService } from "../services/user-management.service.ts";

// Guard helper to ensure caller is authenticated
async function requireAuthSession() {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session || !session.user) {
		throw new Error("Sesi login Anda tidak valid atau telah berakhir.");
	}

	return session;
}

export const getUsersServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<UserItem[]> => {
	await requireAuthSession();
	return userManagementService.getUsers();
});

export const createUserServerFn = createServerFn({
	method: "POST",
})
	.validator((input: UserFormValues) => {
		return userFormSchema.parse(input);
	})
	.handler(async ({ data }): Promise<UserItem> => {
		const session = await requireAuthSession();
		return userManagementService.createUser(data, session.user.id);
	});

export const updateUserServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string; data: UserFormValues }) => {
		return z
			.object({
				id: z.string().min(1),
				data: userFormSchema,
			})
			.parse(input);
	})
	.handler(async ({ data: { id, data } }): Promise<UserItem> => {
		const session = await requireAuthSession();
		return userManagementService.updateUser(id, data, session.user.id);
	});

export const deleteUserServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z
			.object({
				id: z.string().min(1),
			})
			.parse(input);
	})
	.handler(
		async ({ data: { id } }): Promise<{ success: boolean; id: string }> => {
			const session = await requireAuthSession();
			return userManagementService.deleteUser(id, session.user.id);
		},
	);

export const getUserAuditLogsServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<AuditLogItem[]> => {
	await requireAuthSession();
	return userManagementService.getAuditLogs();
});
