export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TENANT" | "STAFF";

export interface UserSessionData {
	id: string;
	name: string;
	email: string;
	image: string | null;
	roleId: string;
	assignedPropertyId: string | null;
}

export interface DashboardContextData {
	user: UserSessionData;
	role: UserRole;
	isSuperAdmin: boolean;
	activeProperty: import("./property.types.ts").PropertySummary | null;
	accessibleProperties: import("./property.types.ts").PropertySummary[];
}
