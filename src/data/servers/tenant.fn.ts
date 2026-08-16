import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { TenantItem } from "../../common/types/index.ts";
import {
	type TenantFormValues,
	tenantSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { tenantService } from "../services/tenant.service.ts";

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
		return executeWithLogging(
			"getTenantsServerFn",
			data,
			() => tenantService.getTenants(data?.propertyId),
			{
				method: "GET",
				summary: (res) => `${res.length} penyewa ditemukan`,
			},
		);
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
		return executeWithLogging(
			"getTenantByIdServerFn",
			{ id },
			() => tenantService.getTenantById(id),
			{
				method: "GET",
				summary: (res) => (res ? `${res.name}` : "Not Found"),
			},
		);
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
		return executeWithLogging(
			"createTenantServerFn",
			{ propertyId, ...data },
			() => tenantService.createTenant(propertyId, data),
			{
				method: "POST",
				summary: (res) => `Sukses dibuat: ${res.name}`,
			},
		);
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
		return executeWithLogging(
			"updateTenantServerFn",
			{ id, propertyId, ...data },
			() => tenantService.updateTenant(id, propertyId, data),
			{
				method: "POST",
				summary: (res) => `Sukses diperbarui: ${res.name}`,
			},
		);
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
			return executeWithLogging(
				"deleteTenantServerFn",
				{ id },
				() => tenantService.deleteTenant(id),
				{
					method: "POST",
					summary: () => `Sukses dihapus: ${id}`,
				},
			);
		},
	);
