import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export async function requireAuthSession() {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session || !session.user) {
		throw new Error("Sesi tidak valid. Silakan login kembali.");
	}

	return session;
}
