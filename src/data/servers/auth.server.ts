import { createServerFn } from "@tanstack/react-start";
import {
	getCookie,
	getRequestHeaders,
	setCookie,
} from "@tanstack/react-start/server";
import type { DashboardContextData } from "../../common/types/index.ts";
import { auth } from "../../lib/auth.ts";
import { authContextService } from "../services/auth-context.service.ts";

export const getDashboardContextServerFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<DashboardContextData | null> => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session || !session.user) {
		return null;
	}

	const cookiePropId = getCookie("hk_active_property_id");
	const context = await authContextService.resolveDashboardContext(
		session.user.id,
		cookiePropId,
	);

	if (!context) {
		return null;
	}

	// Jika activeProperty baru ditentukan dan belum ada di cookie, set cookie
	if (context.isSuperAdmin && context.activeProperty && !cookiePropId) {
		setCookie("hk_active_property_id", context.activeProperty.id, {
			path: "/",
			maxAge: 60 * 60 * 24 * 30, // 30 hari
			sameSite: "lax",
		});
	}

	return context;
});
