export type RoomType = "Standard" | "Deluxe" | "Suite";
export type RoomStatus = "Kosong" | "Terisi" | "Maintenance";
export type RoomStatusType = RoomStatus;

export interface RoomItem {
	id: string;
	propertyId: string;
	roomNo: string;
	type: RoomType;
	price: string;
	status: RoomStatus;
	tenantName?: string | null;
	dueDate?: string | null;
	facilities?: string | null;
}
