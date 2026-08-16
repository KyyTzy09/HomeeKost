import { GoogleGenAI } from "@google/genai";
import { SYSTEM_ROOT_PROMPT } from "../prompts/system-root.prompt.ts";
import {
	type AiFinancialInsightData,
	AiFinancialInsightSchema,
} from "../types.ts";

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
}

export const geminiAdapter = new GeminiAdapter();
