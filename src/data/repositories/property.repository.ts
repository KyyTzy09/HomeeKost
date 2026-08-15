import { prisma } from "../../db.ts";
import type { PrismaClient } from "../../generated/prisma/client.js";

export class PropertyRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findAll() {
		return this.db.property.findMany({
			orderBy: { name: "asc" },
			select: {
				id: true,
				name: true,
				address: true,
				description: true,
				bankAccountInfo: true,
				imageUrl: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	async findById(id: string) {
		return this.db.property.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				address: true,
				description: true,
				bankAccountInfo: true,
				imageUrl: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	async findAccessibleByUserId(userId: string) {
		const user = await this.db.user.findUnique({
			where: { id: userId },
			include: {
				assignedProperty: true,
				propertyAccesses: {
					include: {
						property: true,
					},
				},
			},
		});

		if (!user) return [];

		const propertiesMap = new Map();
		if (user.assignedProperty) {
			propertiesMap.set(user.assignedProperty.id, user.assignedProperty);
		}

		for (const access of user.propertyAccesses) {
			if (access.property && !propertiesMap.has(access.property.id)) {
				propertiesMap.set(access.property.id, access.property);
			}
		}

		return Array.from(propertiesMap.values());
	}
}

export const propertyRepository = new PropertyRepository();
