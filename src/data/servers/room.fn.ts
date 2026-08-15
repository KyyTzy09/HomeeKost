import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import type { RoomItem } from "../../common/types/index.ts";
import {
	type RoomFormValues,
	roomFormSchema,
} from "../../common/validations/index.ts";
import { auth } from "../../lib/auth.ts";
import { roomService } from "../services/room.service.ts";

async function requireAuthSession() {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session || !session.user) {
		throw new Error("Sesi tidak valid. Silakan login kembali.");
	}

	return session;
}

export const getRoomsByPropertyServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { propertyId: string }) => {
		return z.object({ propertyId: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { propertyId } }): Promise<RoomItem[]> => {
		await requireAuthSession();
		return roomService.getRoomsByProperty(propertyId);
	});

export const getRoomByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(async ({ data: { id } }): Promise<RoomItem | null> => {
		await requireAuthSession();
		return roomService.getRoomById(id);
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
		await requireAuthSession();
		return roomService.createRoom(propertyId, data);
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
		await requireAuthSession();
		return roomService.updateRoom(id, data);
	});

export const deleteRoomServerFn = createServerFn({
	method: "POST",
})
	.validator((input: { id: string }) => {
		return z.object({ id: z.string().min(1) }).parse(input);
	})
	.handler(
		async ({ data: { id } }): Promise<{ success: boolean; id: string }> => {
			await requireAuthSession();
			return roomService.deleteRoom(id);
		},
	);
