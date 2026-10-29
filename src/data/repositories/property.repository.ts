import { prisma } from "../../db.ts";
import type { PrismaClient } from "../../generated/prisma/client.js";

export class PropertyRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findAll() {
		return this.db.property.findMany({
			orderBy: { name: "asc" },
			include: {
				rooms: {
					select: {
						id: true,
						status: true,
					},
				},
			},
		});
	}

	async findById(id: string) {
		return this.db.property.findUnique({
			where: { id },
			include: {
				rooms: {
					include: {
						rentalContracts: {
							where: { status: "ACTIVE" },
							include: {
								tenant: true,
							},
						},
					},
				},
			},
		});
	}

	async findAccessibleByUserId(userId: string) {
		const user = await this.db.user.findUnique({
			where: { id: userId },
			include: {
				assignedProperty: {
					include: {
						rooms: {
							select: {
								id: true,
								status: true,
							},
						},
					},
				},
				propertyAccesses: {
					include: {
						property: {
							include: {
								rooms: {
									select: {
										id: true,
										status: true,
									},
								},
							},
						},
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

	async createProperty(data: {
		name: string;
		address: string;
		description?: string | null;
		bankAccountInfo?: string | null;
		imageUrl?: string | null;
	}) {
		return this.db.property.create({
			data: {
				name: data.name,
				address: data.address,
				description: data.description ?? null,
				bankAccountInfo: data.bankAccountInfo ?? null,
				imageUrl: data.imageUrl ?? null,
			},
			include: {
				rooms: true,
			},
		});
	}

	async updateProperty(
		id: string,
		data: {
			name?: string;
			address?: string;
			description?: string | null;
			bankAccountInfo?: string | null;
			imageUrl?: string | null;
		},
	) {
		return this.db.property.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.address !== undefined && { address: data.address }),
				...(data.description !== undefined && {
					description: data.description,
				}),
				...(data.bankAccountInfo !== undefined && {
					bankAccountInfo: data.bankAccountInfo,
				}),
				...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
			},
			include: {
				rooms: true,
			},
		});
	}

	async deleteProperty(id: string) {
		return this.db.property.delete({
			where: { id },
		});
	}
}

export const propertyRepository = new PropertyRepository();
