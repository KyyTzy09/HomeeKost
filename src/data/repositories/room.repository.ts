import { compareRoomNumbers } from "../../common/helpers/room.helper.ts";
import { prisma } from "../../db.ts";
import type {
	PrismaClient,
	RoomStatus,
} from "../../generated/prisma/client.js";

export class RoomRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findByPropertyId(propertyId: string) {
		const rooms = await this.db.room.findMany({
			where: { propertyId },
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						tenant: true,
						invoices: {
							orderBy: { dueDate: "asc" },
							take: 12,
						},
					},
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { roomNumber: "asc" },
		});

		// Natural numeric sorting: Kamar 1, 2, 3 ... 9, 10, 11 (bukan 1, 10, 11, 2)
		return rooms.sort((a, b) => compareRoomNumbers(a.roomNumber, b.roomNumber));
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
						invoices: {
							orderBy: { dueDate: "asc" },
							take: 12,
						},
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
			include: {
				property: true,
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
		const updatedRoom = await this.db.room.update({
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
						invoices: {
							orderBy: { dueDate: "asc" },
							take: 12,
						},
					},
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
		});

		// Jika harga master kamar diubah, sinkronkan seluruh tagihan PENDING penghuni aktif di kamar ini
		if (data.price !== undefined && data.price > 0) {
			const activeContracts = await this.db.rentalContract.findMany({
				where: { roomId: id, status: "ACTIVE" },
				select: { id: true },
			});
			if (activeContracts.length > 0) {
				const contractIds = activeContracts.map((c) => c.id);
				await this.db.invoice.updateMany({
					where: {
						contractId: { in: contractIds },
						status: "PENDING",
					},
					data: {
						amount: data.price,
					},
				});
			}
		}

		return updatedRoom;
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
