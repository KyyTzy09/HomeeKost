import type {
	RoomStatus as PrismaRoomStatus,
	Room,
} from "../../generated/prisma/client.js";

export type RoomBase = Room;
export type RoomPrismaStatus = PrismaRoomStatus;

export type RoomTypeEnum = "Standard" | "Deluxe" | "Suite";
export type RoomStatusEnum = "Kosong" | "Terisi" | "Maintenance";

export interface RoomDomainModel {
	id: string;
	propertyId: string;
	roomNo: string;
	type: RoomTypeEnum;
	price: string;
	status: RoomStatusEnum;
	tenantName?: string | null;
	dueDate?: string | null;
	facilities?: string | null;
}
