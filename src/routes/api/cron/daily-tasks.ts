import { createFileRoute } from "@tanstack/react-router";
import { engagementService } from "../../../data/services/engagement.service.ts";

export const Route = createFileRoute("/api/cron/daily-tasks")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				return handleCronRequest(request);
			},
			POST: async ({ request }: { request: Request }) => {
				return handleCronRequest(request);
			},
		},
	},
});

async function handleCronRequest(request: Request): Promise<Response> {
	const cronSecret = process.env.CRON_SECRET || "homeekost-daily-cron-secret";

	// Cek header Authorization atau query param ?key= / ?secret=
	const authHeader = request.headers.get("Authorization");
	const url = new URL(request.url);
	const queryKey =
		url.searchParams.get("key") || url.searchParams.get("secret");

	const isAuthorized =
		(authHeader && authHeader === `Bearer ${cronSecret}`) ||
		queryKey === cronSecret ||
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
		const result = await engagementService.runDailyCronTasks();
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("[CronApi] Error executing daily cron tasks:", error);
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
