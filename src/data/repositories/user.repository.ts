import { prisma } from "../../db.ts";
import type { PrismaClient } from "../../generated/prisma/client.js";

export class UserRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findById(id: string) {
		return this.db.user.findUnique({
			where: { id },
		});
	}

	async findByEmail(email: string) {
		return this.db.user.findUnique({
			where: { email },
		});
	}

	async findUserWithRoleAndAccess(id: string) {
		return this.db.user.findUnique({
			where: { id },
			include: {
				role: true,
				assignedProperty: true,
				propertyAccesses: {
					include: {
						property: true,
					},
				},
			},
		});
	}

	async findAll() {
		return this.db.user.findMany({
			include: {
				role: true,
				assignedProperty: true,
			},
			orderBy: { createdAt: "desc" },
		});
	}
}

export const userRepository = new UserRepository();
