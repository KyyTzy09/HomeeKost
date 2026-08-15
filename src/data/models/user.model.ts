import type { Role, User } from "../../generated/prisma/client.js";

export type UserBase = User;
export type RoleBase = Role;

export type AppUserRoleModel = "SuperAdmin" | "Admin" | "Staff";
export type AppUserStatusModel = "Aktif" | "Nonaktif";

export interface UserDomainModel {
	id: string | number;
	name: string;
	email: string;
	role: AppUserRoleModel;
	status: AppUserStatusModel;
	assignedBranch: string;
	assignedBranchId?: string | null;
	lastActive: string;
	createdAt: string;
}

export interface UserAuditLogDomainModel {
	id: string | number;
	timestamp: string;
	userName: string;
	action: string;
	category: "AUTH" | "FINANCE" | "PROPERTY" | "TENANT" | "SYSTEM";
	details: string;
}
