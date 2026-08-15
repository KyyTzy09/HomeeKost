export type AppUserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";
export type AppUserStatus = "ACTIVE" | "INACTIVE";

export interface UserItem {
	id: string | number;
	name: string;
	email: string;
	role: AppUserRole;
	assignedProperty: string; // e.g. "Semua Kost", "Kos A", "Kos B"
	status: AppUserStatus;
	createdAt?: string;
}

export interface AuditLogItem {
	id: string | number;
	time: string;
	userName: string;
	userRole: AppUserRole;
	activity: string;
	detail: string;
}
