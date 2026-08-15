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
import { requireAuthSession } from "../middlewares/auth.middleware.ts";
import { propertyService } from "../services/property.service.ts";
import { propertySessionService } from "../services/property-session.service.ts";

export const getPropertiesServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<PropertyItem[]> => {
	await requireAuthSession();
	return propertyService.getPropertiesWithStats();
});

export const getPropertyByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }): Promise<PropertyItem | null> => {
		await requireAuthSession();
		return propertyService.getPropertyById(id);
	});

export const createPropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: PropertyFormValues) => {
		return propertyFormSchema.parse(input);
	})
	.handler(async ({ data }): Promise<PropertyItem> => {
		await requireAuthSession();
		return propertyService.createProperty(data);
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
		await requireAuthSession();
		return propertyService.updateProperty(id, data);
	});

export const deletePropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(
		async ({ data: { id } }): Promise<{ success: boolean; id: string }> => {
			await requireAuthSession();
			return propertyService.deleteProperty(id);
		},
	);

export const setActivePropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: SetActivePropertyInput) => {
		return setActivePropertySchema.parse(input);
	})
	.handler(async ({ data: { propertyId } }) => {
		const session = await requireAuthSession();

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
	});
