import { compareRoomNumbers } from "../../common/helpers/index.ts";
import type { RoomItem, RoomStatusType } from "../../common/types/index.ts";
import type { RoomFormValues } from "../../common/validations/index.ts";
import type { RoomStatus } from "../../generated/prisma/client.js";
import { roomRepository } from "../repositories/room.repository.ts";

export class RoomService {
	constructor(private readonly roomRepo = roomRepository) {}

	private mapStatusToUI(status: RoomStatus): RoomStatusType {
		switch (status) {
			case "OCCUPIED":
				return "Terisi";
			case "MAINTENANCE":
				return "Maintenance";
			default:
				return "Kosong";
		}
	}

	private mapStatusToPrisma(status: RoomStatusType): RoomStatus {
		switch (status) {
			case "Terisi":
				return "OCCUPIED";
			case "Maintenance":
				return "MAINTENANCE";
			default:
				return "VACANT";
		}
	}

	private formatDueDay(day?: number | null): string | null {
		if (!day) return null;
		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"Mei",
			"Jun",
			"Jul",
			"Agu",
			"Sep",
			"Okt",
			"Nov",
			"Des",
		];
		const currentMonth = months[new Date().getMonth()];
		return `${String(day).padStart(2, "0")} ${currentMonth}`;
	}

	async getRoomsByProperty(propertyId: string): Promise<RoomItem[]> {
		const rooms = await this.roomRepo.findByPropertyId(propertyId);

		return rooms
			.map((r) => {
				const activeContract = r.rentalContracts[0];
				const tenantName = activeContract?.tenant?.name || null;
				const dueDate = activeContract?.dueDateDay
					? this.formatDueDay(activeContract.dueDateDay)
					: null;

				const priceNum = Number(r.price) || 0;
				const formattedPrice = `Rp${priceNum.toLocaleString("id-ID")}`;

				return {
					id: r.id,
					propertyId: r.propertyId,
					roomNo: r.roomNumber,
					type: (r.type || "Standard") as "Standard" | "Deluxe" | "Suite",
					price: formattedPrice,
					status: this.mapStatusToUI(r.status),
					tenantName,
					dueDate,
					facilities: r.facilities || "",
				};
			})
			.sort((a, b) => compareRoomNumbers(a.roomNo, b.roomNo));
	}

	async getRoomById(id: string): Promise<RoomItem | null> {
		const r = await this.roomRepo.findById(id);
		if (!r) return null;

		const activeContract = r.rentalContracts[0];
		const tenantName = activeContract?.tenant?.name || null;
		const dueDate = activeContract?.dueDateDay
			? this.formatDueDay(activeContract.dueDateDay)
			: null;

		const priceNum = Number(r.price) || 0;
		const formattedPrice = `Rp${priceNum.toLocaleString("id-ID")}`;

		return {
			id: r.id,
			propertyId: r.propertyId,
			roomNo: r.roomNumber,
			type: (r.type || "Standard") as "Standard" | "Deluxe" | "Suite",
			price: formattedPrice,
			status: this.mapStatusToUI(r.status),
			tenantName,
			dueDate,
			facilities: r.facilities || "",
		};
	}

	async createRoom(
		propertyId: string,
		input: RoomFormValues,
	): Promise<RoomItem> {
		// Check for duplicate roomNumber in this property
		const existing = await this.roomRepo.findByRoomNumber(
			propertyId,
			input.roomNo,
		);
		if (existing) {
			throw new Error(
				`Kamar dengan nomor ${input.roomNo} sudah ada pada properti ini.`,
			);
		}

		const priceNum = Number(String(input.price).replace(/\D/g, "")) || 0;
		const prismaStatus = this.mapStatusToPrisma(input.status);

		const created = await this.roomRepo.createRoom({
			propertyId,
			roomNumber: input.roomNo,
			type: input.type,
			price: priceNum,
			facilities: input.facilities,
			status: prismaStatus,
		});

		return {
			id: created.id,
			propertyId: created.propertyId,
			roomNo: created.roomNumber,
			type: (created.type || "Standard") as "Standard" | "Deluxe" | "Suite",
			price: `Rp${priceNum.toLocaleString("id-ID")}`,
			status: this.mapStatusToUI(created.status),
			tenantName: null,
			dueDate: null,
			facilities: created.facilities || "",
		};
	}

	async updateRoom(id: string, input: RoomFormValues): Promise<RoomItem> {
		const existing = await this.roomRepo.findById(id);
		if (!existing) {
			throw new Error("Kamar tidak ditemukan.");
		}

		if (input.roomNo !== existing.roomNumber) {
			const duplicate = await this.roomRepo.findByRoomNumber(
				existing.propertyId,
				input.roomNo,
			);
			if (duplicate && duplicate.id !== id) {
				throw new Error(
					`Kamar dengan nomor ${input.roomNo} sudah ada pada properti ini.`,
				);
			}
		}

		const priceNum = Number(String(input.price).replace(/\D/g, "")) || 0;
		const prismaStatus = this.mapStatusToPrisma(input.status);

		const updated = await this.roomRepo.updateRoom(id, {
			roomNumber: input.roomNo,
			type: input.type,
			price: priceNum,
			facilities: input.facilities,
			status: prismaStatus,
		});

		const activeContract = updated.rentalContracts[0];
		const tenantName = activeContract?.tenant?.name || null;
		const dueDate = activeContract?.dueDateDay
			? this.formatDueDay(activeContract.dueDateDay)
			: null;

		return {
			id: updated.id,
			propertyId: updated.propertyId,
			roomNo: updated.roomNumber,
			type: (updated.type || "Standard") as "Standard" | "Deluxe" | "Suite",
			price: `Rp${priceNum.toLocaleString("id-ID")}`,
			status: this.mapStatusToUI(updated.status),
			tenantName,
			dueDate,
			facilities: updated.facilities || "",
		};
	}

	async deleteRoom(id: string): Promise<{ success: boolean; id: string }> {
		const existing = await this.roomRepo.findById(id);
		if (!existing) {
			throw new Error("Kamar tidak ditemukan.");
		}

		if (existing.rentalContracts.length > 0) {
			throw new Error(
				"Tidak dapat menghapus kamar yang masih memiliki kontrak sewa aktif. Silakan selesaikan kontrak sewa terlebih dahulu.",
			);
		}

		await this.roomRepo.deleteRoom(id);
		return { success: true, id };
	}
}

export const roomService = new RoomService();
