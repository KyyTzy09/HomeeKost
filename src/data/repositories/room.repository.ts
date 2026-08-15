import { prisma } from "../../db.ts";
import type {
	PrismaClient,
	RoomStatus,
} from "../../generated/prisma/client.js";

export class RoomRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findByPropertyId(propertyId: string) {
		return this.db.room.findMany({
			where: { propertyId },
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						tenant: true,
					},
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { roomNumber: "asc" },
		});
	}

	async findById(id: string) {
		return this.db.room.findUnique({
			where: { id },
			include: {
				property: true,
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						tenant: true,
					},
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
		});
	}

	async findByRoomNumber(propertyId: string, roomNumber: string) {
		return this.db.room.findFirst({
			where: {
				propertyId,
				roomNumber,
			},
		});
	}

	async createRoom(data: {
		propertyId: string;
		roomNumber: string;
		type: string;
		price: number;
		facilities?: string | null;
		status?: RoomStatus;
	}) {
		return this.db.room.create({
			data: {
				propertyId: data.propertyId,
				roomNumber: data.roomNumber,
				type: data.type,
				price: data.price,
				facilities: data.facilities ?? null,
				status: data.status ?? "VACANT",
			},
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						tenant: true,
					},
				},
			},
		});
	}

	async updateRoom(
		id: string,
		data: {
			roomNumber?: string;
			type?: string;
			price?: number;
			facilities?: string | null;
			status?: RoomStatus;
		},
	) {
		return this.db.room.update({
			where: { id },
			data: {
				...(data.roomNumber !== undefined && { roomNumber: data.roomNumber }),
				...(data.type !== undefined && { type: data.type }),
				...(data.price !== undefined && { price: data.price }),
				...(data.facilities !== undefined && {
					facilities: data.facilities,
				}),
				...(data.status !== undefined && { status: data.status }),
			},
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						tenant: true,
					},
				},
			},
		});
	}

	async deleteRoom(id: string) {
		return this.db.room.delete({
			where: { id },
		});
	}

	async countRoomsByProperty(propertyId: string) {
		return this.db.room.count({
			where: { propertyId },
		});
	}
}

export const roomRepository = new RoomRepository();
