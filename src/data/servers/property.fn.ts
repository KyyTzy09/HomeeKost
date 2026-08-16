import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import type { PropertyItem } from "../../common/types/index.ts";
import {
	type PropertyFormValues,
	propertyFormSchema,
	type SetActivePropertyInput,
	setActivePropertySchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { propertyService } from "../services/property.service.ts";
import { propertySessionService } from "../services/property-session.service.ts";

export const getPropertiesServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<PropertyItem[]> => {
	return executeWithLogging(
		"getPropertiesServerFn",
		{},
		() => propertyService.getPropertiesWithStats(),
		{
			method: "GET",
			summary: (res) => `${res.length} cabang properti ditemukan`,
		},
	);
});

export const getPropertyByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }): Promise<PropertyItem | null> => {
		return executeWithLogging(
			"getPropertyByIdServerFn",
			{ id },
			() => propertyService.getPropertyById(id),
			{
				method: "GET",
				summary: (res) => (res ? `${res.name}` : "Not Found"),
			},
		);
	});

export const createPropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: PropertyFormValues) => {
		return propertyFormSchema.parse(input);
	})
	.handler(async ({ data }): Promise<PropertyItem> => {
		return executeWithLogging(
			"createPropertyServerFn",
			data,
			() => propertyService.createProperty(data),
			{
				method: "POST",
				summary: (res) => `Sukses dibuat: ${res.name}`,
			},
		);
	});

export const updatePropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string; data: PropertyFormValues }) => {
		return z
			.object({
				id: z.string().min(1),
				data: propertyFormSchema,
			})
			.parse(input);
	})
	.handler(async ({ data: { id, data } }): Promise<PropertyItem> => {
		return executeWithLogging(
			"updatePropertyServerFn",
			{ id, ...data },
			() => propertyService.updateProperty(id, data),
			{
				method: "POST",
				summary: (res) => `Sukses diperbarui: ${res.name}`,
			},
		);
	});

export const deletePropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(
		async ({ data: { id } }): Promise<{ success: boolean; id: string }> => {
			return executeWithLogging(
				"deletePropertyServerFn",
				{ id },
				() => propertyService.deleteProperty(id),
				{
					method: "POST",
					summary: () => `Sukses dihapus: ${id}`,
				},
			);
		},
	);

export const setActivePropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: SetActivePropertyInput) => {
		return setActivePropertySchema.parse(input);
	})
	.handler(async ({ data: { propertyId } }) => {
		return executeWithLogging(
			"setActivePropertyServerFn",
			{ propertyId },
			async (session) => {
				const result = await propertySessionService.setActiveProperty(
					session.user.id,
					propertyId,
				);

				setCookie("hk_active_property_id", result.propertyId, {
					path: "/",
					maxAge: 60 * 60 * 24 * 30, // 30 hari
					sameSite: "lax",
				});

				return result;
			},
			{
				method: "POST",
				summary: (res) => `Active property changed to: ${res.propertyId}`,
			},
		);
	});
