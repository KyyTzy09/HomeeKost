import type { Property } from "../../generated/prisma/client.js";

export type PropertyBase = Property;

export interface PropertySummaryModel {
	id: string;
	code: string;
	name: string;
	address: string;
}

export interface PropertyDomainModel {
	id: string;
	code: string;
	name: string;
	address: string;
	description?: string | null;
	bankAccountInfo?: string | null;
	imageUrl?: string | null;
	rooms: number;
	tenants: number;
}
