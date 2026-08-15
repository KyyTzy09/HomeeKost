export interface PropertySummary {
	id: string;
	name: string;
	address: string;
	description?: string | null;
	bankAccountInfo?: string | null;
	imageUrl?: string | null;
}

export interface PropertyItem {
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
