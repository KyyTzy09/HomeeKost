export type AppUserRole = "SUPER_ADMIN" | "ADMIN";
export type AppUserStatus = "ACTIVE" | "INACTIVE";

export interface UserItem {
	id: string | number;
	name: string;
	email: string;
	role: AppUserRole;
	assignedProperty: string; // e.g. "Semua Kost", "Kos A", "Kos B"
	assignedPropertyId?: string | null;
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

export interface UserProfileDetail {
	id: string;
	name: string;
	email: string;
	phoneNumber?: string;
	role: AppUserRole;
	assignedProperty: string;
	assignedPropertyId?: string | null;
	accessibleProperties: Array<{
		id: string;
		name: string;
		address: string;
		totalRooms: number;
	}>;
	createdAt?: string;
}
