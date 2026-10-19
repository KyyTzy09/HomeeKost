import { createFileRoute } from "@tanstack/react-router";
import { reportService } from "../../../data/services/report.service.ts";

export const Route = createFileRoute("/api/cron/monthly-reports")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				return handleMonthlyCronRequest(request);
			},
			POST: async ({ request }: { request: Request }) => {
				return handleMonthlyCronRequest(request);
			},
		},
	},
});

async function handleMonthlyCronRequest(request: Request): Promise<Response> {
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
		const propertyId = url.searchParams.get("propertyId") || undefined;
		const targetPhone =
			url.searchParams.get("phone") ||
			url.searchParams.get("targetPhone") ||
			undefined;
		const monthParam = url.searchParams.get("month");
		const yearParam = url.searchParams.get("year");
		const sendWhatsAppParam = url.searchParams.get("sendWhatsApp");
		const idempotencyKey = url.searchParams.get("idempotencyKey") || undefined;
		const forceSendParam = url.searchParams.get("forceSend");
		const forceSend = forceSendParam === "true";

		const month = monthParam ? Number.parseInt(monthParam, 10) : undefined;
		const year = yearParam ? Number.parseInt(yearParam, 10) : undefined;
		const sendWhatsApp =
			sendWhatsAppParam !== null ? sendWhatsAppParam === "true" : true;

		const result = await reportService.runMonthlyReportCron({
			propertyId,
			targetPhone,
			sendWhatsApp,
			month,
			year,
			idempotencyKey,
			forceSend,
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error(
			"[CronApi] Error executing monthly report cron tasks:",
			error,
		);
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
