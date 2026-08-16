import { logger } from "../../lib/logger.ts";
import { requireAuthSession } from "./auth.middleware.ts";

export type SessionType = Awaited<ReturnType<typeof requireAuthSession>>;

export interface LoggedHandlerOptions<T> {
	method?: "GET" | "POST";
	summary?: (result: T) => string;
	requireAuth?: boolean;
}

/**
 * Higher-order server execution wrapper yang secara otomatis mencatat
 * durasi, caller user/role, input arguments, dan response status ke terminal logger.
 */
export async function executeWithLogging<T>(
	name: string,
	input: unknown,
	handler: (session: SessionType) => Promise<T>,
	options: LoggedHandlerOptions<T> = {},
): Promise<T> {
	const start = Date.now();
	let session: SessionType | null = null;

	try {
		if (options.requireAuth !== false) {
			session = await requireAuthSession();
		}

		const result = await handler(session as SessionType);
		const durationMs = Date.now() - start;

		logger.serverFn({
			name,
			method: options.method || "POST",
			input,
			user: session?.user
				? {
						name: session.user.name,
						email: session.user.email,
						role:
							(session.user as unknown as { role?: { name: string } })?.role
								?.name || "User",
					}
				: null,
			durationMs,
			summary: options.summary ? options.summary(result) : undefined,
		});

		return result;
	} catch (error) {
		const durationMs = Date.now() - start;

		logger.serverFn({
			name,
			method: options.method || "POST",
			input,
			user: session?.user
				? {
						name: session.user.name,
						email: session.user.email,
						role:
							(session.user as unknown as { role?: { name: string } })?.role
								?.name || "User",
					}
				: null,
			durationMs,
			error,
		});

		throw error;
	}
}
