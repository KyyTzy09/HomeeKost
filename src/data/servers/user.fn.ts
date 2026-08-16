import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
	AuditLogItem,
	UserItem,
	UserProfileDetail,
} from "../../common/types/index.ts";
import {
	type ChangePasswordFormValues,
	changePasswordSchema,
	type ProfileUpdateFormValues,
	profileUpdateSchema,
	type UserFormValues,
	userFormSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { userManagementService } from "../services/user-management.service.ts";

export const getUsersServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<UserItem[]> => {
	return executeWithLogging(
		"getUsersServerFn",
		{},
		() => userManagementService.getUsers(),
		{
			method: "GET",
			summary: (res) => `${res.length} user ditemukan`,
		},
	);
});

export const createUserServerFn = createServerFn({
	method: "POST",
})
	.validator((input: UserFormValues) => {
		return userFormSchema.parse(input);
	})
	.handler(async ({ data }): Promise<UserItem> => {
		return executeWithLogging(
			"createUserServerFn",
			data,
			(session) => userManagementService.createUser(data, session.user.id),
			{
				method: "POST",
				summary: (res) => `Sukses dibuat: ${res.name} (${res.role})`,
			},
		);
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
		return executeWithLogging(
			"updateUserServerFn",
			{ id, ...data },
			(session) => userManagementService.updateUser(id, data, session.user.id),
			{
				method: "POST",
				summary: (res) => `Sukses diperbarui: ${res.name}`,
			},
		);
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
			return executeWithLogging(
				"deleteUserServerFn",
				{ id },
				(session) => userManagementService.deleteUser(id, session.user.id),
				{
					method: "POST",
					summary: () => `Sukses dihapus: ${id}`,
				},
			);
		},
	);

export const getMyProfileServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<UserProfileDetail> => {
	return executeWithLogging(
		"getMyProfileServerFn",
		{},
		(session) => userManagementService.getMyProfile(session.user.id),
		{
			method: "GET",
			summary: (res) => `Profil ${res.name} (${res.role})`,
		},
	);
});

export const updateMyProfileServerFn = createServerFn({
	method: "POST",
})
	.validator((input: ProfileUpdateFormValues) => {
		return profileUpdateSchema.parse(input);
	})
	.handler(async ({ data }): Promise<UserProfileDetail> => {
		return executeWithLogging(
			"updateMyProfileServerFn",
			data,
			(session) => userManagementService.updateMyProfile(session.user.id, data),
			{
				method: "POST",
				summary: (res) => `Profil ${res.name} berhasil diperbarui`,
			},
		);
	});

export const changeMyPasswordServerFn = createServerFn({
	method: "POST",
})
	.validator((input: ChangePasswordFormValues) => {
		return changePasswordSchema.parse(input);
	})
	.handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
		return executeWithLogging(
			"changeMyPasswordServerFn",
			{},
			(session) =>
				userManagementService.changeMyPassword(session.user.id, data),
			{
				method: "POST",
				summary: (res) => res.message,
			},
		);
	});

export const getUserAuditLogsServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<AuditLogItem[]> => {
	return executeWithLogging(
		"getUserAuditLogsServerFn",
		{},
		() => userManagementService.getAuditLogs(),
		{
			method: "GET",
			summary: (res) => `${res.length} baris audit log`,
		},
	);
});
