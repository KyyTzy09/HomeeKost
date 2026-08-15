import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuthSession } from "../middlewares/auth.middleware.ts";
import {
	type StorageUploadResult,
	storageService,
} from "../services/storage.service.ts";

const uploadImageInputSchema = z.object({
	dataUrl: z.string().min(1, "Data gambar wajib diisi"),
	folder: z.string().optional().default("homeekost/properties"),
	filename: z.string().optional(),
});

export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;

const uploadDocumentInputSchema = z.object({
	dataUrl: z.string().min(1, "Data dokumen wajib diisi"),
	folder: z.string().optional().default("homeekost/documents"),
	filename: z.string().optional(),
	mimeType: z.string().optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

export const uploadImageServerFn = createServerFn({
	method: "POST",
})
	.validator((input: UploadImageInput) => {
		return uploadImageInputSchema.parse(input);
	})
	.handler(async ({ data }): Promise<StorageUploadResult> => {
		await requireAuthSession();
		return storageService.uploadImage(data.dataUrl, {
			folder: data.folder,
			filename: data.filename,
		});
	});

export const uploadDocumentServerFn = createServerFn({
	method: "POST",
})
	.validator((input: UploadDocumentInput) => {
		return uploadDocumentInputSchema.parse(input);
	})
	.handler(async ({ data }): Promise<StorageUploadResult> => {
		await requireAuthSession();
		return storageService.uploadDocument(data.dataUrl, {
			folder: data.folder,
			filename: data.filename,
			mimeType: data.mimeType,
		});
	});
