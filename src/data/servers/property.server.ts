import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setCookie } from "@tanstack/react-start/server";
import {
	type SetActivePropertyInput,
	setActivePropertySchema,
} from "../../common/validations/index.ts";
import { auth } from "../../lib/auth.ts";
import { propertySessionService } from "../services/property-session.service.ts";

export const setActivePropertyServerFn = createServerFn({
	method: "POST",
})
	.validator((input: SetActivePropertyInput) => {
		return setActivePropertySchema.parse(input);
	})
	.handler(async ({ data: { propertyId } }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session || !session.user) {
			throw new Error("Sesi tidak valid. Silakan login kembali.");
		}

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
