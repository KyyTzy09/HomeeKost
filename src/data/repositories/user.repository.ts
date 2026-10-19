import { prisma } from "../../db.ts";
import type { PrismaClient, RoleName } from "../../generated/prisma/client.js";

export class UserRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findById(id: string) {
		return this.db.user.findUnique({
			where: { id },
			include: {
				role: true,
				assignedProperty: true,
			},
		});
	}

	async findByEmail(email: string) {
		return this.db.user.findUnique({
			where: { email },
			include: {
				role: true,
				assignedProperty: true,
			},
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

	async findRoleByName(name: RoleName) {
		return this.db.role.findUnique({
			where: { name },
		});
	}

	async findAllRoles() {
		return this.db.role.findMany();
	}

	async findWithRole(id: string) {
		return this.db.user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}

	async createUser(data: {
		name: string;
		email: string;
		roleId: string;
		assignedPropertyId?: string | null;
		passwordHash?: string | null;
	}) {
		return this.db.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: {
					name: data.name,
					email: data.email,
					roleId: data.roleId,
					assignedPropertyId: data.assignedPropertyId ?? null,
					passwordHash: data.passwordHash ?? null,
				},
				include: {
					role: true,
					assignedProperty: true,
				},
			});

			if (data.passwordHash) {
				await tx.account.create({
					data: {
						id: `acc_${user.id}`,
						userId: user.id,
						accountId: user.email,
						providerId: "credential",
						password: data.passwordHash,
					},
				});
			}

			return user;
		});
	}

	async updateUser(
		id: string,
		data: {
			name?: string;
			email?: string;
			roleId?: string;
			assignedPropertyId?: string | null;
			passwordHash?: string | null;
		},
	) {
		return this.db.$transaction(async (tx) => {
			const updated = await tx.user.update({
				where: { id },
				data: {
					...(data.name !== undefined && { name: data.name }),
					...(data.email !== undefined && { email: data.email }),
					...(data.roleId !== undefined && { roleId: data.roleId }),
					...(data.assignedPropertyId !== undefined && {
						assignedPropertyId: data.assignedPropertyId,
					}),
					...(data.passwordHash !== undefined && {
						passwordHash: data.passwordHash,
					}),
				},
				include: {
					role: true,
					assignedProperty: true,
				},
			});

			if (data.email) {
				await tx.account.updateMany({
					where: { userId: id, providerId: "credential" },
					data: { accountId: data.email },
				});
			}

			if (data.passwordHash) {
				const existingAccount = await tx.account.findFirst({
					where: { userId: id, providerId: "credential" },
				});

				if (existingAccount) {
					await tx.account.update({
						where: { id: existingAccount.id },
						data: { password: data.passwordHash },
					});
				} else {
					await tx.account.create({
						data: {
							id: `acc_${id}`,
							userId: id,
							accountId: updated.email,
							providerId: "credential",
							password: data.passwordHash,
						},
					});
				}
			}

			return updated;
		});
	}

	async deleteUser(id: string) {
		return this.db.user.delete({
			where: { id },
		});
	}

	async countUsers() {
		return this.db.user.count();
	}

	async countSuperAdmins() {
		return this.db.user.count({
			where: {
				role: {
					name: "SUPER_ADMIN",
				},
			},
		});
	}
}

export const userRepository = new UserRepository();
