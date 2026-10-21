import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { buildKtpReviewerPrompt } from "../prompts/ktp-reviewer.ts";
import { SYSTEM_ROOT_PROMPT } from "../prompts/system-root.prompt.ts";
import {
	type AiFinancialInsightData,
	AiFinancialInsightSchema,
} from "../types.ts";

export const KtpExtractedSchema = z.object({
	nik: z.string().default(""),
	name: z.string().default(""),
	birthDate: z.string().default(""), // YYYY-MM-DD
	originAddress: z.string().default(""),
	occupation: z.enum(["Mahasiswa", "Karyawan", "Lainnya"]).default("Lainnya"),
	institution: z.string().default(""),
});

export type KtpExtractedData = z.infer<typeof KtpExtractedSchema>;

export interface GeminiAdapterOptions {
	apiKey?: string;
	apiKeys?: string[];
	model?: string;
}

export class GeminiAdapter {
	private explicitKeys: string[] = [];
	private currentKeyIndex = 0;
	private model: string;

	constructor(options?: GeminiAdapterOptions) {
		if (options?.apiKey) {
			this.explicitKeys = [options.apiKey];
		} else if (options?.apiKeys && options.apiKeys.length > 0) {
			this.explicitKeys = options.apiKeys;
		}
		this.model =
			options?.model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
	}

	/**
	 * Mengambil daftar seluruh API key yang valid:
	 * Prioritas:
	 * 1. Explicit keys dari opsi constructor
	 * 2. GEMINI_API_KEYS (format koma: "key1,key2,key3")
	 * 3. GEMINI_API_KEY atau GOOGLE_AI_KEY (single key legacy)
	 */
	public getApiKeys(): string[] {
		const keys: string[] = [];
		for (const k of this.explicitKeys) {
			const trimmed = k.trim();
			if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
		}

		const multiEnv = process.env.GEMINI_API_KEYS;
		if (multiEnv) {
			for (const k of multiEnv.split(",")) {
				const trimmed = k.trim();
				if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
			}
		}

		const singleGemini = process.env.GEMINI_API_KEY;
		if (singleGemini) {
			const trimmed = singleGemini.trim();
			if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
		}

		const googleAi = process.env.GOOGLE_AI_KEY;
		if (googleAi) {
			const trimmed = googleAi.trim();
			if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
		}

		return keys;
	}

	public getModel(): string {
		return this.model;
	}

	public getCurrentKeyIndex(): number {
		return this.currentKeyIndex;
	}

	private maskKey(key: string): string {
		if (!key) return "***";
		return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "***";
	}

	private isRateLimitOrQuotaError(err: unknown): boolean {
		if (!err) return false;
		const msg = err instanceof Error ? err.message : String(err);
		const status =
			(err as { status?: number; code?: number })?.status ||
			(err as { status?: number; code?: number })?.code;
		return (
			status === 429 ||
			status === 503 ||
			msg.includes("429") ||
			msg.includes("RESOURCE_EXHAUSTED") ||
			msg.includes("quota") ||
			msg.includes("Quota exceeded") ||
			msg.includes("rate limit") ||
			msg.includes("Too Many Requests") ||
			msg.includes("overloaded") ||
			msg.includes("High Demand")
		);
	}

	async generateFinancialInsight(
		featurePrompt: string,
	): Promise<AiFinancialInsightData> {
		const keys = this.getApiKeys();
		if (keys.length === 0) {
			throw new Error(
				"GEMINI_API_KEY atau GEMINI_API_KEYS tidak dikonfigurasi.",
			);
		}

		let lastError: unknown = null;
		const totalKeys = keys.length;

		// Coba setiap key mulai dari currentKeyIndex
		for (let i = 0; i < totalKeys; i++) {
			const keyIndex = (this.currentKeyIndex + i) % totalKeys;
			const apiKey = keys[keyIndex];
			const maskedKey = this.maskKey(apiKey);

			try {
				const ai = new GoogleGenAI({ apiKey });
				const response = await ai.models.generateContent({
					model: this.model,
					config: {
						systemInstruction: SYSTEM_ROOT_PROMPT,
						responseMimeType: "application/json",
						temperature: 0.2,
					},
					contents: featurePrompt,
				});

				const text = response.text;
				if (!text) {
					throw new Error("Gemini GenAI SDK tidak mengembalikan teks output.");
				}

				const cleanedText = text
					.replace(/^```json\s*/i, "")
					.replace(/\s*```$/i, "")
					.trim();

				const parsedJson = JSON.parse(cleanedText);
				const validated = AiFinancialInsightSchema.parse(parsedJson);

				// Berhasil! Simpan keyIndex aktif untuk request berikutnya agar hemat latency
				this.currentKeyIndex = keyIndex;
				return validated;
			} catch (err) {
				lastError = err;
				const errMsg = err instanceof Error ? err.message : String(err);
				console.warn(
					`[GeminiAdapter] Key #${keyIndex + 1} (${maskedKey}) gagal: ${errMsg}. ${
						i < totalKeys - 1
							? "Mencoba key berikutnya..."
							: "Seluruh key Gemini telah dicoba."
					}`,
				);
			}
		}

		this.currentKeyIndex = (this.currentKeyIndex + 1) % totalKeys;
		const lastMsg =
			lastError instanceof Error ? lastError.message : String(lastError);
		throw new Error(
			`Seluruh (${totalKeys}) Gemini API Key gagal diproses: ${lastMsg}`,
		);
	}

	/**
	 * Multimodal Vision OCR untuk membaca identitas KTP Indonesia
	 * Dilengkapi multi-key failover dan fallback model otomatis
	 */
	async extractKtpVision(
		base64Data: string,
		mimeType = "image/jpeg",
	): Promise<KtpExtractedData> {
		const keys = this.getApiKeys();
		if (keys.length === 0) {
			throw new Error(
				"GEMINI_API_KEY atau GEMINI_API_KEYS tidak dikonfigurasi.",
			);
		}

		const prompt = buildKtpReviewerPrompt();
		const candidateModels = Array.from(
			new Set([
				this.model,
				"gemini-3.5-flash-lite",
				"gemini-3.5-flash",
				"gemini-2.5-flash",
				"gemini-1.5-flash",
			]),
		);

		let lastError: unknown = null;
		const totalKeys = keys.length;

		for (let i = 0; i < totalKeys; i++) {
			const keyIndex = (this.currentKeyIndex + i) % totalKeys;
			const apiKey = keys[keyIndex];
			const maskedKey = this.maskKey(apiKey);
			const ai = new GoogleGenAI({ apiKey });

			for (const modelCandidate of candidateModels) {
				try {
					// Timeout 12 detik untuk mencegah request menggantung
					const timeoutPromise = new Promise<never>((_, reject) =>
						setTimeout(
							() =>
								reject(
									new Error(
										`Timeout OCR setelah 12 detik pada model ${modelCandidate}`,
									),
								),
							12000,
						),
					);

					const generatePromise = ai.models.generateContent({
						model: modelCandidate,
						config: {
							responseMimeType: "application/json",
							temperature: 0.1,
						},
						contents: [
							{
								inlineData: {
									mimeType,
									data: base64Data,
								},
							},
							prompt,
						],
					});

					const response = await Promise.race([
						generatePromise,
						timeoutPromise,
					]);
					const text = response.text;

					if (!text) {
						continue;
					}

					const cleaned = text
						.replace(/^```json\s*/i, "")
						.replace(/^```\s*/i, "")
						.replace(/\s*```$/i, "")
						.trim();

					const parsed = JSON.parse(cleaned);

					this.currentKeyIndex = keyIndex;
					return KtpExtractedSchema.parse({
						nik: String(parsed.nik || "")
							.replace(/\D/g, "")
							.slice(0, 16),
						name: String(parsed.name || "").trim(),
						birthDate: String(parsed.birthDate || "").trim(),
						originAddress: String(parsed.originAddress || "").trim(),
						occupation:
							parsed.occupation === "Mahasiswa" ||
							parsed.occupation === "Karyawan"
								? parsed.occupation
								: "Lainnya",
						institution: String(parsed.institution || "").trim(),
					});
				} catch (err) {
					lastError = err;
					const errMsg = err instanceof Error ? err.message : String(err);
					console.warn(
						`[GeminiAdapter] OCR gagal pada key #${keyIndex + 1} (${maskedKey}) model ${modelCandidate} (${errMsg}). Mencoba fallback...`,
					);
					if (this.isRateLimitOrQuotaError(err)) {
						break; // Pindah ke key berikutnya jika terkena limit kuota
					}
				}
			}
		}

		this.currentKeyIndex = (this.currentKeyIndex + 1) % totalKeys;
		console.error(
			"[GeminiAdapter] Seluruh key dan model OCR gagal:",
			lastError,
		);
		throw new Error(
			"Layanan AI OCR sedang mengalami antrean tinggi (High Demand). Formulir dapat diisi secara manual.",
		);
	}
}

export const geminiAdapter = new GeminiAdapter();
