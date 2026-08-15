import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import type { TenantItem } from "../../common/types/index.ts";
import {
	type TenantFormValues,
	tenantSchema,
} from "../../common/validations/index.ts";
import { auth } from "../../lib/auth.ts";
import { tenantService } from "../services/tenant.service.ts";

async function requireAuthSession() {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session || !session.user) {
		throw new Error("Sesi login Anda tidak valid atau telah berakhir.");
	}

	return session;
}

export const getTenantsServerFn = createServerFn({
	method: "GET",
})
	.validator((input?: { propertyId?: string }) => {
		return z
			.object({
				propertyId: z.string().optional(),
			})
			.optional()
			.parse(input);
	})
	.handler(async ({ data }): Promise<TenantItem[]> => {
		await requireAuthSession();
		return tenantService.getTenants(data?.propertyId);
	});

export const getTenantByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { id: string }) => {
		return z
			.object({
				id: z.string().min(1),
			})
			.parse(input);
	})
	.handler(async ({ data: { id } }): Promise<TenantItem | null> => {
		await requireAuthSession();
		return tenantService.getTenantById(id);
	});

export const createTenantServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { propertyId: string; data: TenantFormValues }) => {
		return z
			.object({
				propertyId: z.string().min(1),
				data: tenantSchema,
			})
			.parse(input);
	})
	.handler(async ({ data: { propertyId, data } }): Promise<TenantItem> => {
		await requireAuthSession();
		return tenantService.createTenant(propertyId, data);
	});

export const updateTenantServerFn = createServerFn({
	method: "POST",
})
	.validator(
		(input: { id: string; propertyId: string; data: TenantFormValues }) => {
			return z
				.object({
					id: z.string().min(1),
					propertyId: z.string().min(1),
					data: tenantSchema,
				})
				.parse(input);
		},
	)
	.handler(async ({ data: { id, propertyId, data } }): Promise<TenantItem> => {
		await requireAuthSession();
		return tenantService.updateTenant(id, propertyId, data);
	});

export const deleteTenantServerFn = createServerFn({
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
			await requireAuthSession();
			return tenantService.deleteTenant(id);
		},
	);
