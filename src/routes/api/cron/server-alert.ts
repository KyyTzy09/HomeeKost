import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { serverAlertService } from "../../../data/services/server-alert.service.ts";

export const Route = createFileRoute("/api/cron/server-alert")({
	server: {
		handlers: {
			GET: async () => {
				return new Response(
					JSON.stringify({
						success: false,
						error:
							"Method Not Allowed. Eksekusi cron wajib menggunakan method POST.",
					}),
					{
						status: 405,
						headers: { "Content-Type": "application/json" },
					},
				);
			},
			POST: async ({ request }: { request: Request }) => {
				return handleServerAlertCronRequest(request);
			},
		},
	},
});

async function handleServerAlertCronRequest(
	request: Request,
): Promise<Response> {
	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret && process.env.NODE_ENV === "production") {
		console.error(
			"[CronApi] CRON_SECRET belum dikonfigurasi di environment production!",
		);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Server configuration error: CRON_SECRET is missing.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

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
				error: "Unauthorized: Invalid or missing cron secret token",
			}),
			{
				status: 401,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const result = await serverAlertService.checkAndSendAlertIfDue();
		return new Response(JSON.stringify({ success: true, ...result }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("[CronApi] Error executing server alert cron:", error);
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
