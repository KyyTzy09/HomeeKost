import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RoomItem } from "../../common/types/index.ts";
import {
	type RoomFormValues,
	roomFormSchema,
} from "../../common/validations/index.ts";
import { executeWithLogging } from "../middlewares/logging.middleware.ts";
import { roomService } from "../services/room.service.ts";

export const getRoomsByPropertyServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { propertyId: string }) => {
		return z.object({ propertyId: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { propertyId } }): Promise<RoomItem[]> => {
		return executeWithLogging(
			"getRoomsByPropertyServerFn",
			{ propertyId },
			() => roomService.getRoomsByProperty(propertyId),
			{
				method: "GET",
				summary: (res) => `${res.length} kamar ditemukan`,
			},
		);
	});

export const getRoomByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }): Promise<RoomItem | null> => {
		return executeWithLogging(
			"getRoomByIdServerFn",
			{ id },
			() => roomService.getRoomById(id),
			{
				method: "GET",
				summary: (res) => (res ? `Kamar ${res.roomNo}` : "Not Found"),
			},
		);
	});

export const createRoomServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { propertyId: string; data: RoomFormValues }) => {
		return z
			.object({
				propertyId: z.string().min(1),
				data: roomFormSchema,
			})
			.parse(input);
	})
	.handler(async ({ data: { propertyId, data } }): Promise<RoomItem> => {
		return executeWithLogging(
			"createRoomServerFn",
			{ propertyId, ...data },
			() => roomService.createRoom(propertyId, data),
			{
				method: "POST",
				summary: (res) => `Sukses dibuat: Kamar ${res.roomNo}`,
			},
		);
	});

export const updateRoomServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string; data: RoomFormValues }) => {
		return z
			.object({
				id: z.string().min(1),
				data: roomFormSchema,
			})
			.parse(input);
	})
	.handler(async ({ data: { id, data } }): Promise<RoomItem> => {
		return executeWithLogging(
			"updateRoomServerFn",
			{ id, ...data },
			() => roomService.updateRoom(id, data),
			{
				method: "POST",
				summary: (res) => `Sukses diubah: Kamar ${res.roomNo}`,
			},
		);
	});

export const deleteRoomServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(
		async ({ data: { id } }): Promise<{ success: boolean; id: string }> => {
			return executeWithLogging(
				"deleteRoomServerFn",
				{ id },
				() => roomService.deleteRoom(id),
				{
					method: "POST",
					summary: () => `Sukses dihapus: ${id}`,
				},
			);
		},
	);
