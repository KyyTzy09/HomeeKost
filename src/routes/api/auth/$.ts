import { createFileRoute } from "@tanstack/react-router";
import { auth } from "../../../lib/auth.ts";
import { logger } from "../../../lib/logger.ts";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const start = Date.now();
				const url = new URL(request.url);
				const res = await auth.handler(request);
				logger.info(
					"AUTH_API",
					`GET ${url.pathname} — Status: ${res.status} (${Date.now() - start}ms)`,
				);
				return res;
			},
			POST: async ({ request }: { request: Request }) => {
				const start = Date.now();
				const url = new URL(request.url);
				const res = await auth.handler(request);
				logger.info(
					"AUTH_API",
					`POST ${url.pathname} — Status: ${res.status} (${Date.now() - start}ms)`,
				);
				return res;
			},
		},
	},
});
