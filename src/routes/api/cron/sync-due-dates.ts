import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { systemService } from "../../../data/services/system.service.ts";

export const Route = createFileRoute("/api/cron/sync-due-dates")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				return handleSyncRequest(request);
			},
			POST: async ({ request }: { request: Request }) => {
				return handleSyncRequest(request);
			},
		},
	},
});

async function handleSyncRequest(request: Request): Promise<Response> {
	const cronSecret = process.env.CRON_SECRET;
	const effectiveSecret = cronSecret || "homeekost-daily-cron-secret";
	const authHeader = request.headers.get("Authorization");
	const url = new URL(request.url);
	const queryKey =
		url.searchParams.get("key") || url.searchParams.get("secret");
	const bearerToken = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: null;
	const providedKey = bearerToken || queryKey;

	const isAuthorized =
		(providedKey &&
			providedKey.length === effectiveSecret.length &&
			crypto.timingSafeEqual(
				Buffer.from(providedKey),
				Buffer.from(effectiveSecret),
			)) ||
		process.env.NODE_ENV === "development";

	if (!isAuthorized) {
		return new Response(
			JSON.stringify({
				success: false,
				error:
					"Unauthorized: Token rahasia tidak valid. Gunakan ?key=HK-Cron atau Authorization Bearer token.",
			}),
			{
				status: 401,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const result = await systemService.syncContractAndInvoiceDueDates();
		return new Response(JSON.stringify(result, null, 2), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("[SyncDueDatesApi] Gagal menyinkronkan tanggal tenggat:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : "Internal Server Error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
