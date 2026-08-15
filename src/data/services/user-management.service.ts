import type {
	AppUserRole,
	AuditLogItem,
	UserItem,
} from "../../common/types/index.ts";
import type { UserFormValues } from "../../common/validations/index.ts";
import type { RoleName } from "../../generated/prisma/client.js";
import { propertyRepository } from "../repositories/property.repository.ts";
import { userRepository } from "../repositories/user.repository.ts";

export class UserManagementService {
	constructor(
		private readonly userRepo = userRepository,
		private readonly propertyRepo = propertyRepository,
	) {}

	async getUsers(): Promise<UserItem[]> {
		const rawUsers = await this.userRepo.findAll();

		return rawUsers.map((u) => {
			const roleName = (u.role?.name || "STAFF") as AppUserRole;
			const propertyName = u.assignedProperty?.name || "Semua Kost";

			return {
				id: u.id,
				name: u.name,
				email: u.email,
				role: roleName,
				assignedProperty: propertyName,
				status: "ACTIVE",
				createdAt: u.createdAt.toISOString().slice(0, 10),
			};
		});
	}

	async createUser(input: UserFormValues): Promise<UserItem> {
		const existingUser = await this.userRepo.findByEmail(input.email);
		if (existingUser) {
			throw new Error(`Email ${input.email} sudah terdaftar di sistem.`);
		}

		// Resolve roleId
		const role = await this.userRepo.findRoleByName(
			input.role as unknown as RoleName,
		);
		if (!role) {
			throw new Error(`Role ${input.role} tidak ditemukan dalam database.`);
		}

		// Resolve assignedPropertyId
		let propertyId: string | null = null;
		if (input.assignedProperty && input.assignedProperty !== "Semua Kost") {
			const properties = await this.propertyRepo.findAll();
			const matched = properties.find(
				(p) =>
					p.name.toLowerCase() === input.assignedProperty.toLowerCase() ||
					p.id === input.assignedProperty,
			);
			if (matched) {
				propertyId = matched.id;
			}
		}

		const created = await this.userRepo.createUser({
			name: input.name,
			email: input.email,
			roleId: role.id,
			assignedPropertyId: propertyId,
		});

		return {
			id: created.id,
			name: created.name,
			email: created.email,
			role: (created.role?.name || "STAFF") as AppUserRole,
			assignedProperty: created.assignedProperty?.name || "Semua Kost",
			status: "ACTIVE",
			createdAt: created.createdAt.toISOString().slice(0, 10),
		};
	}

	async updateUser(id: string, input: UserFormValues): Promise<UserItem> {
		const existing = await this.userRepo.findById(id);
		if (!existing) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		if (input.email !== existing.email) {
			const emailCheck = await this.userRepo.findByEmail(input.email);
			if (emailCheck && emailCheck.id !== id) {
				throw new Error(`Email ${input.email} sudah digunakan oleh akun lain.`);
			}
		}

		// Resolve role
		let roleId = existing.roleId;
		if (input.role && input.role !== existing.role?.name) {
			// Cegah penurunan role jika ini adalah SuperAdmin terakhir
			if (
				existing.role?.name === "SUPER_ADMIN" &&
				input.role !== "SUPER_ADMIN"
			) {
				const superAdminCount = await this.userRepo.countSuperAdmins();
				if (superAdminCount <= 1) {
					throw new Error(
						"Tidak dapat mengubah role. Sistem harus memiliki minimal satu SuperAdmin.",
					);
				}
			}

			const newRole = await this.userRepo.findRoleByName(
				input.role as unknown as RoleName,
			);
			if (newRole) {
				roleId = newRole.id;
			}
		}

		// Resolve assignedPropertyId
		let propertyId: string | null = null;
		if (input.assignedProperty && input.assignedProperty !== "Semua Kost") {
			const properties = await this.propertyRepo.findAll();
			const matched = properties.find(
				(p) =>
					p.name.toLowerCase() === input.assignedProperty.toLowerCase() ||
					p.id === input.assignedProperty,
			);
			if (matched) {
				propertyId = matched.id;
			}
		}

		const updated = await this.userRepo.updateUser(id, {
			name: input.name,
			email: input.email,
			roleId,
			assignedPropertyId: propertyId,
		});

		return {
			id: updated.id,
			name: updated.name,
			email: updated.email,
			role: (updated.role?.name || "STAFF") as AppUserRole,
			assignedProperty: updated.assignedProperty?.name || "Semua Kost",
			status: input.status,
			createdAt: updated.createdAt.toISOString().slice(0, 10),
		};
	}

	async deleteUser(
		id: string,
		requesterUserId?: string,
	): Promise<{ success: boolean; id: string }> {
		if (requesterUserId && id === requesterUserId) {
			throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
		}

		const existing = await this.userRepo.findById(id);
		if (!existing) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		if (existing.role?.name === "SUPER_ADMIN") {
			const superAdminCount = await this.userRepo.countSuperAdmins();
			if (superAdminCount <= 1) {
				throw new Error(
					"Tidak dapat menghapus satu-satunya akun SuperAdmin pada sistem.",
				);
			}
		}

		await this.userRepo.deleteUser(id);
		return { success: true, id };
	}

	async getAuditLogs(): Promise<AuditLogItem[]> {
		// Mock initial audit logs based on realistic system actions
		return [
			{
				id: 1,
				time: "Hari ini 10:20",
				userName: "Frisda",
				userRole: "SUPER_ADMIN",
				activity: "Tambah transaksi",
				detail: "Rp850.000 · Kos A (Token Listrik)",
			},
			{
				id: 2,
				time: "Kemarin 16:40",
				userName: "Rani Setyawati",
				userRole: "ADMIN",
				activity: "Edit penghuni",
				detail: "Alya Putri · Kamar A-03",
			},
			{
				id: 3,
				time: "10 Agu 09:15",
				userName: "Budi Santoso",
				userRole: "STAFF",
				activity: "Verifikasi pembayaran",
				detail: "Sewa Kamar B-01 · Lunas Rp850.000",
			},
			{
				id: 4,
				time: "08 Agu 14:00",
				userName: "Frisda",
				userRole: "SUPER_ADMIN",
				activity: "Tambah properti baru",
				detail: "Kos D (Seturan)",
			},
		];
	}
}

export const userManagementService = new UserManagementService();
