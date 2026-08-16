import { sanitizePhoneNumber } from "./phone-sanitizer.ts";

export interface FonnteSendTextOptions {
	target: string;
	message: string;
	countryCode?: string;
}

export interface FonnteSendFileOptions extends FonnteSendTextOptions {
	file?: Uint8Array | Buffer | Blob;
	url?: string;
	filename?: string;
}

export interface FonnteApiResponse {
	status: boolean;
	target?: string[];
	detail?: string;
	reason?: string;
	id?: string[];
}

export class FonnteClient {
	private readonly token: string;
	private readonly baseUrl: string = "https://api.fonnte.com";

	constructor(token?: string) {
		this.token = token || process.env.FONNTE_TOKEN || "";
	}

	/**
	 * Kirim pesan teks WhatsApp via Fonnte API
	 */
	async sendText(options: FonnteSendTextOptions): Promise<FonnteApiResponse> {
		const target = sanitizePhoneNumber(options.target);

		if (!this.token) {
			console.warn(
				`[FonnteClient] Warning: FONNTE_TOKEN tidak diset. Simulasi pengiriman pesan ke ${target}.`,
			);
			return {
				status: true,
				target: [target],
				detail:
					"MOCK_SUCCESS: Token Fonnte belum dikonfigurasi di environment.",
			};
		}

		try {
			console.log(`[FonnteClient] Mengirim pesan teks ke ${target}...`);
			const res = await fetch(`${this.baseUrl}/send`, {
				method: "POST",
				headers: {
					Authorization: this.token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					target,
					message: options.message,
					countryCode: options.countryCode || "62",
				}),
			});

			const json = (await res.json()) as FonnteApiResponse;
			console.log(`[FonnteClient] Respons Text Fonnte:`, json);
			return json;
		} catch (error) {
			console.error("[FonnteClient] Error sending message:", error);
			return {
				status: false,
				detail: error instanceof Error ? error.message : "Network error",
			};
		}
	}

	/**
	 * Kirim pesan WhatsApp dengan lampiran file/PDF langsung (Multipart Form-Data) via Fonnte API
	 */
	async sendFile(options: FonnteSendFileOptions): Promise<FonnteApiResponse> {
		const target = sanitizePhoneNumber(options.target);

		if (!this.token) {
			console.warn(
				`[FonnteClient] Warning: FONNTE_TOKEN tidak diset. Simulasi pengiriman file ke ${target}.`,
			);
			return {
				status: true,
				target: [target],
				detail:
					"MOCK_SUCCESS: Token Fonnte belum dikonfigurasi di environment.",
			};
		}

		try {
			// Mode 1: Direct File Buffer Upload (Multipart Form-Data)
			if (options.file) {
				const filename = options.filename || "Dokumen-HomeeKost.pdf";
				console.log(
					`[FonnteClient] Mengunggah file PDF (${filename}) langsung ke ${target} via Multipart Form-Data...`,
				);

				const formData = new FormData();
				formData.append("target", target);
				formData.append("message", options.message);
				formData.append("countryCode", options.countryCode || "62");
				formData.append("filename", filename);

				const fileObj =
					typeof File !== "undefined"
						? new File([options.file as unknown as BlobPart], filename, {
								type: "application/pdf",
							})
						: new Blob([options.file as unknown as BlobPart], {
								type: "application/pdf",
							});

				formData.append("file", fileObj, filename);

				const res = await fetch(`${this.baseUrl}/send`, {
					method: "POST",
					headers: {
						Authorization: this.token,
					},
					body: formData,
				});

				const json = (await res.json()) as FonnteApiResponse;
				console.log(`[FonnteClient] Respons File Fonnte:`, json);
				return json;
			}

			// Mode 2: Remote URL File Attachment
			console.log(
				`[FonnteClient] Mengirim file URL (${options.url}) ke ${target}...`,
			);
			const res = await fetch(`${this.baseUrl}/send`, {
				method: "POST",
				headers: {
					Authorization: this.token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					target,
					message: options.message,
					url: options.url,
					filename: options.filename || "Dokumen-HomeeKost.pdf",
					countryCode: options.countryCode || "62",
				}),
			});

			const json = (await res.json()) as FonnteApiResponse;
			console.log(`[FonnteClient] Respons URL File Fonnte:`, json);
			return json;
		} catch (error) {
			console.error("[FonnteClient] Error sending file:", error);
			return {
				status: false,
				detail: error instanceof Error ? error.message : "Network error",
			};
		}
	}
}

export const fonnteClient = new FonnteClient();
