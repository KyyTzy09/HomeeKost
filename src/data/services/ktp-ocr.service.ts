import {
	geminiAdapter,
	type KtpExtractedData,
} from "../../ai/llm/gemini-adapter.ts";

export interface KtpOcrServiceResult {
	success: boolean;
	data?: KtpExtractedData;
	error?: string;
}

export class KtpOcrService {
	constructor(private readonly llmAdapter = geminiAdapter) {}

	private parseDataUrl(dataUrlOrBase64: string): {
		mimeType: string;
		base64: string;
	} {
		const match = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
		if (match) {
			return { mimeType: match[1], base64: match[2] };
		}
		return { mimeType: "image/jpeg", base64: dataUrlOrBase64 };
	}

	/**
	 * Memproses foto KTP menggunakan LLM Vision Adapter
	 * dengan Safe Fallback (Anti-Crash)
	 */
	async processKtpImage(base64OrDataUrl: string): Promise<KtpOcrServiceResult> {
		if (!base64OrDataUrl || base64OrDataUrl.length < 50) {
			return {
				success: false,
				error: "Gambar KTP tidak valid atau kosong.",
			};
		}

		try {
			const { mimeType, base64 } = this.parseDataUrl(base64OrDataUrl);
			const data = await this.llmAdapter.extractKtpVision(base64, mimeType);
			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error(
				"[KtpOcrService] Gagal mengekstrak KTP via LLM Vision Adapter:",
				error,
			);
			const rawMsg =
				error instanceof Error
					? error.message
					: "Gagal memproses gambar KTP dengan AI.";

			const friendlyMsg =
				rawMsg.includes("High Demand") ||
				rawMsg.includes("503") ||
				rawMsg.includes("overloaded") ||
				rawMsg.includes("429")
					? "Layanan AI sedang sibuk (antrean tinggi). Silakan lengkapi formulir secara manual."
					: rawMsg.includes("GEMINI_API_KEY")
						? "Konfigurasi kunci AI tidak ditemukan."
						: rawMsg;

			return {
				success: false,
				error: friendlyMsg,
			};
		}
	}
}

export const ktpOcrService = new KtpOcrService();
export type { KtpExtractedData };
