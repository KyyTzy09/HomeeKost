import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../../lib/auth.ts";
import { userRepository } from "../repositories/user.repository.ts";

export async function requireAuthSession() {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session || !session.user) {
		throw new Error("Sesi tidak valid. Silakan login kembali.");
	}

	const dbUser = await userRepository.findUserWithRoleAndAccess(session.user.id);
	if (!dbUser) {
		throw new Error("Pengguna tidak ditemukan.");
	}

	return {
		...session,
		user: {
			...session.user,
			...dbUser,
			role: dbUser.role,
		},
	};
}
