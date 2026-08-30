import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
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

	async generateFinancialInsight(
		featurePrompt: string,
	): Promise<AiFinancialInsightData> {
		if (!this.apiKey) {
			throw new Error("GEMINI_API_KEY tidak dikonfigurasi.");
		}

		const ai = new GoogleGenAI({ apiKey: this.apiKey });

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

		const ai = new GoogleGenAI({ apiKey: this.apiKey });

		const prompt = `Anda adalah asisten AI OCR khusus membaca dokumen KTP (Kartu Tanda Penduduk) Republik Indonesia.
Tugas Anda adalah membaca foto KTP yang diberikan dan mengekstrak data identitas secara presisi ke format JSON terstruktur murni:
{
  "nik": "16 digit NIK",
  "name": "NAMA LENGKAP SESUAI KTP",
  "birthDate": "YYYY-MM-DD",
  "originAddress": "ALAMAT LENGKAP (Jalan, RT/RW, Kel/Desa, Kecamatan, Kota/Kabupaten, Provinsi)",
  "occupation": "Mahasiswa" ATAU "Karyawan" ATAU "Lainnya",
  "institution": ""
}

Instruksi Spesifik & Validasi:
1. "nik": Harus 16 digit angka nasional Indonesia. Hilangkan spasi atau tanda baca.
2. "name": Nama lengkap dengan huruf kapital atau Title Case yang rapi.
3. "birthDate": Konversi Tempat/Tgl Lahir ke format ISO date YYYY-MM-DD. Contoh: "2001-08-17".
4. "originAddress": Gabungkan baris Alamat, RT/RW, Kel/Desa, Kecamatan, dan Kota/Kab menjadi satu alamat domisili asal yang lengkap.
5. "occupation":
   - Jika tertera "PELAJAR/MAHASISWA" atau "MAHASISWA", pilih "Mahasiswa".
   - Jika tertera "KARYAWAN SWASTA", "PNS", "WIRASWASTA", "BURUH", "PEGAWAI", pilih "Karyawan".
   - Jika selain itu, pilih "Lainnya".
6. Output HANYA JSON murni yang valid tanpa teks pembuka, tanpa markdown block backticks.`;

		const response = await ai.models.generateContent({
			model: this.model,
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

		const text = response.text;
		if (!text) {
			throw new Error("Gemini Vision tidak mengembalikan teks output.");
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
				parsed.occupation === "Mahasiswa" || parsed.occupation === "Karyawan"
					? parsed.occupation
					: "Lainnya",
			institution: String(parsed.institution || "").trim(),
		});
	}
}

export const geminiAdapter = new GeminiAdapter();
