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
	}) {
		return this.db.user.create({
			data: {
				name: data.name,
				email: data.email,
				roleId: data.roleId,
				assignedPropertyId: data.assignedPropertyId ?? null,
			},
			include: {
				role: true,
				assignedProperty: true,
			},
		});
	}

	async updateUser(
		id: string,
		data: {
			name?: string;
			email?: string;
			roleId?: string;
			assignedPropertyId?: string | null;
		},
	) {
		return this.db.user.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.email !== undefined && { email: data.email }),
				...(data.roleId !== undefined && { roleId: data.roleId }),
				...(data.assignedPropertyId !== undefined && {
					assignedPropertyId: data.assignedPropertyId,
				}),
			},
			include: {
				role: true,
				assignedProperty: true,
			},
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
