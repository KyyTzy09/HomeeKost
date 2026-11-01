import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { TenantItem } from "../../common/types/index.ts";
import {
	type TenantFormValues,
	tenantSchema,
	type UpdateTenantFormValues,
	updateTenantSchema,
} from "../../common/validations/index.ts";
import { assertUserPropertyAccess } from "../middlewares/auth.middleware.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import {
	type KtpExtractedData,
	ktpOcrService,
	roomService,
	tenantService,
} from "../services/index.ts";

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
			(session) => {
				let effectivePropId = data?.propertyId;
				if (
					session.user.role?.name === "ADMIN" &&
					session.user.assignedPropertyId
				) {
					effectivePropId = session.user.assignedPropertyId;
				} else if (effectivePropId) {
					assertUserPropertyAccess(session.user, effectivePropId);
				}
				return tenantService.getTenants(effectivePropId);
			},
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
			async (session) => {
				const tenant = await tenantService.getTenantById(id);
				if (tenant?.roomId) {
					const room = await roomService.getRoomById(tenant.roomId);
					if (room) {
						assertUserPropertyAccess(session.user, room.propertyId);
					}
				}
				return tenant;
			},
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
			(session) => {
				assertUserPropertyAccess(session.user, propertyId);
				return tenantService.createTenant(propertyId, data, session.user);
			},
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
		(input: {
			id: string;
			propertyId: string;
			data: UpdateTenantFormValues;
		}) => {
			return z
				.object({
					id: z.string().min(1),
					propertyId: z.string().min(1),
					data: updateTenantSchema,
				})
				.parse(input);
		},
	)
	.handler(async ({ data: { id, propertyId, data } }): Promise<TenantItem> => {
		return executeWithLogging(
			"updateTenantServerFn",
			{ id, propertyId, ...data },
			(session) => {
				assertUserPropertyAccess(session.user, propertyId);
				return tenantService.updateTenant(id, propertyId, data);
			},
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
				async (session) => {
					const tenant = await tenantService.getTenantById(id);
					if (tenant?.roomId) {
						const room = await roomService.getRoomById(tenant.roomId);
						if (room) {
							assertUserPropertyAccess(session.user, room.propertyId);
						}
					}
					return tenantService.deleteTenant(id);
				},
				{
					method: "POST",
					summary: () => `Sukses dihapus: ${id}`,
				},
			);
		},
	);

export const scanKtpServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { imageBase64: string }) => {
		return z
			.object({
				imageBase64: z
					.string()
					.min(1, "Data gambar KTP diperlukan")
					.max(
						10 * 1024 * 1024,
						"Ukuran gambar KTP melebihi batas maksimal (7MB)",
					),
			})
			.parse(input);
	})
	.handler(
		async ({
			data: { imageBase64 },
		}): Promise<{
			success: boolean;
			ktpUrl?: string;
			data?: KtpExtractedData;
			error?: string;
		}> => {
			return executeWithLogging(
				"scanKtpServerFn",
				{ hasImage: Boolean(imageBase64) },
				async () => {
					// 100% In-Memory OCR Pass-Through: tidak menyimpan file fisik ke storage disk VPS
					const ocrResult = await ktpOcrService.processKtpImage(imageBase64);

					return {
						success: ocrResult.success,
						data: ocrResult.data,
						error: ocrResult.error,
					};
				},
				{
					method: "POST",
					summary: (res) =>
						res.success
							? `KTP berhasil dipindai (in-memory): ${res.data?.name || "OK"}`
							: `KTP scan fallback: ${res.error || "Gagal"}`,
				},
			);
		},
	);
