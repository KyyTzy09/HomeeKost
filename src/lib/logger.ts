/**
 * Logger Utility untuk HomeeKost (Development & Debugging)
 * Mendukung formatting warna di Terminal (Server) dan styled console di Browser (Client).
 */

const isServer = typeof window === "undefined";
const isDev = process.env.NODE_ENV !== "production";

// ANSI Color Codes untuk Node.js Terminal
const ANSI = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	sage: "\x1b[38;2;79;105;88m", // #4f6958
	sageLight: "\x1b[38;2;113;139;120m", // #718b78
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	blue: "\x1b[34m",
	gray: "\x1b[90m",
	white: "\x1b[37m",
	bgSage: "\x1b[48;2;79;105;88m\x1b[37m",
};

function formatTime(): string {
	const now = new Date();
	return now.toTimeString().split(" ")[0];
}

function formatDuration(ms: number): string {
	if (ms < 50) return `${ANSI.green}${ms}ms${ANSI.reset}`;
	if (ms < 200) return `${ANSI.yellow}${ms}ms${ANSI.reset}`;
	return `${ANSI.red}${ms}ms${ANSI.reset}`;
}

export interface LogRpcOptions {
	name: string;
	method?: "GET" | "POST";
	input?: unknown;
	user?: {
		name?: string;
		email?: string;
		role?: string;
	} | null;
	durationMs: number;
	error?: Error | unknown;
	summary?: string;
}

export const logger = {
	/**
	 * Log pemanggilan Server Function (RPC)
	 */
	serverFn({
		name,
		method = "POST",
		input,
		user,
		durationMs,
		error,
		summary,
	}: LogRpcOptions) {
		if (!isDev) return;

		const time = formatTime();

		if (isServer) {
			if (error) {
				console.error(
					`\n${ANSI.red}${ANSI.bold}┌─ ❌ [RPC ERROR] ${name} ${ANSI.reset}${ANSI.dim}(${method}) — ${time} — ${formatDuration(durationMs)}${ANSI.reset}\n` +
						`│  ${ANSI.dim}User   :${ANSI.reset} ${user ? `${user.name || user.email} (${user.role || "User"})` : "Anonymous / Guest"}\n` +
						`│  ${ANSI.dim}Input  :${ANSI.reset} ${input !== undefined ? JSON.stringify(input) : "{}"}\n` +
						`│  ${ANSI.red}${ANSI.bold}Error  :${ANSI.reset} ${error instanceof Error ? error.message : String(error)}\n` +
						`└───────────────────────────────────────────────────────────────────`,
				);
			} else {
				console.log(
					`\n${ANSI.sage}${ANSI.bold}┌─ 🚀 [RPC CALL] ${name} ${ANSI.reset}${ANSI.dim}(${method}) — ${time} — ${formatDuration(durationMs)}${ANSI.reset}\n` +
						`│  ${ANSI.dim}User   :${ANSI.reset} ${user ? `${ANSI.cyan}${user.name || user.email}${ANSI.reset} (${user.role || "User"})` : "Guest / Sessionless"}\n` +
						`│  ${ANSI.dim}Input  :${ANSI.reset} ${input !== undefined ? JSON.stringify(input) : "{}"}\n` +
						`│  ${ANSI.dim}Status :${ANSI.reset} ${ANSI.green}200 OK${ANSI.reset}${summary ? ` · ${summary}` : ""}\n` +
						`└───────────────────────────────────────────────────────────────────`,
				);
			}
		} else {
			// Client Console Formatting
			const statusColor = error ? "#b66b68" : "#568062";
			const bgColor = error ? "#f7e9e8" : "#e8f2ea";

			console.groupCollapsed(
				`%c RPC %c ${name} %c ${durationMs}ms `,
				`background:#4f6958; color:#fff; border-radius:3px 0 0 3px; padding:2px 5px; font-weight:bold;`,
				`background:${bgColor}; color:${statusColor}; padding:2px 6px; font-weight:600;`,
				`background:#edf0ed; color:#737873; border-radius:0 3px 3px 0; padding:2px 5px;`,
			);
			if (user) console.log("User:", user);
			if (input !== undefined) console.log("Input:", input);
			if (error) console.error("Error:", error);
			if (summary) console.log("Summary:", summary);
			console.groupEnd();
		}
	},

	/**
	 * Log navigasi route (Client Router)
	 */
	route(to: string, from?: string) {
		if (!isDev) return;
		if (!isServer) {
			console.log(
				`%c Nav %c ${from || "—"} ➜ ${to} `,
				"background:#718b78; color:#fff; border-radius:3px 0 0 3px; padding:2px 5px; font-weight:bold;",
				"background:#f3f7f3; color:#252925; border-radius:0 3px 3px 0; padding:2px 6px; font-weight:500;",
			);
		}
	},

	/**
	 * Log umum dengan tag
	 */
	info(tag: string, message: string, data?: unknown) {
		if (!isDev) return;
		const time = formatTime();
		if (isServer) {
			console.log(
				`${ANSI.cyan}[${tag}]${ANSI.reset} ${ANSI.dim}${time}${ANSI.reset} ${message}`,
				data !== undefined ? data : "",
			);
		} else {
			console.log(
				`%c ${tag} %c ${message} `,
				"background:#718b78; color:#fff; border-radius:3px; padding:1px 4px; font-weight:bold;",
				"color:#252925;",
				data !== undefined ? data : "",
			);
		}
	},

	/**
	 * Log error
	 */
	error(tag: string, error: unknown, meta?: unknown) {
		const time = formatTime();
		if (isServer) {
			console.error(
				`${ANSI.red}[ERROR:${tag}]${ANSI.reset} ${ANSI.dim}${time}${ANSI.reset}`,
				error,
				meta !== undefined ? meta : "",
			);
		} else {
			console.error(`[${tag}]`, error, meta !== undefined ? meta : "");
		}
	},
};
