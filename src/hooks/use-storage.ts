import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	type UploadDocumentInput,
	type UploadImageInput,
	uploadDocumentServerFn,
	uploadImageServerFn,
} from "../data/servers/index.ts";
import type { StorageUploadResult } from "../data/services/storage.service.ts";

export function useUploadImage(): UseMutationResult<
	StorageUploadResult,
	Error,
	UploadImageInput
> {
	return useMutation<StorageUploadResult, Error, UploadImageInput>({
		mutationFn: async (input: UploadImageInput) => {
			return uploadImageServerFn({ data: input });
		},
	});
}

export function useUploadDocument(): UseMutationResult<
	StorageUploadResult,
	Error,
	UploadDocumentInput
> {
	return useMutation<StorageUploadResult, Error, UploadDocumentInput>({
		mutationFn: async (input: UploadDocumentInput) => {
			return uploadDocumentServerFn({ data: input });
		},
	});
}
