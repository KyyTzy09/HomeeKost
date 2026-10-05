import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { SYSTEM_ROOT_PROMPT } from "../prompts/system-root.prompt.ts";
import {
	type AiFinancialInsightData,
	AiFinancialInsightSchema,
} from "../types.ts";
import { buildKtpReviewerPrompt } from "../prompts/ktp-reviewer.ts";

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
	model?: string;
}

export class GeminiAdapter {
	private apiKey: string;
	private model: string;

	constructor(options?: GeminiAdapterOptions) {
		this.apiKey =
			options?.apiKey ||
			process.env.GEMINI_API_KEY ||
			process.env.GOOGLE_AI_KEY ||
			"";
		this.model =
			options?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
	}

	private get aiClient(): GoogleGenAI {
		if (!this.apiKey) {
			throw new Error("GEMINI_API_KEY tidak dikonfigurasi.");
		}

		return new GoogleGenAI({ apiKey: this.apiKey });
	}

	async generateFinancialInsight(
		featurePrompt: string,
	): Promise<AiFinancialInsightData> {
		if (!this.apiKey) {
			throw new Error("GEMINI_API_KEY tidak dikonfigurasi.");
		}

		const ai = this.aiClient;

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

		// Clean potential markdown backticks if any
		const cleanedText = text
			.replace(/^```json\s*/i, "")
			.replace(/\s*```$/i, "")
			.trim();

		const parsedJson = JSON.parse(cleanedText);
		return AiFinancialInsightSchema.parse(parsedJson);
	}

	/**
	 * Multimodal Vision OCR untuk membaca identitas KTP Indonesia
	 */
	async extractKtpVision(
		base64Data: string,
		mimeType: string = "image/jpeg",
	): Promise<KtpExtractedData> {
		if (!this.apiKey) {
			throw new Error("GEMINI_API_KEY tidak dikonfigurasi.");
		}

		const ai = this.aiClient;
		const prompt = buildKtpReviewerPrompt();

		// Daftar model kandidat dengan fallback jika terjadi High Demand (503 / 429)
		const candidateModels = Array.from(
			new Set([this.model, "gemini-2.0-flash", "gemini-1.5-flash"]),
		);

		let lastError: unknown = null;

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

				const response = await Promise.race([generatePromise, timeoutPromise]);
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
					`[GeminiAdapter] Gagal pada model ${modelCandidate} (${errMsg}). Mencoba fallback model berikutnya jika ada...`,
				);
			}
		}

		console.error("[GeminiAdapter] Seluruh model OCR gagal:", lastError);
		throw new Error(
			"Layanan AI OCR sedang mengalami antrean tinggi (High Demand). Formulir dapat diisi secara manual.",
		);
	}
}

export const geminiAdapter = new GeminiAdapter();
