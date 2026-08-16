import OpenAI from "openai";
import { SYSTEM_ROOT_PROMPT } from "../prompts/system-root.prompt.ts";
import {
	type AiFinancialInsightData,
	AiFinancialInsightSchema,
} from "../types.ts";

export interface GroqAdapterOptions {
	apiKey?: string;
	model?: string;
}

export class GroqAdapter {
	private apiKey: string;
	private model: string;

	constructor(options?: GroqAdapterOptions) {
		this.apiKey = options?.apiKey || process.env.GROQ_API_KEY || "";
		this.model =
			options?.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
	}

	async generateFinancialInsight(
		featurePrompt: string,
	): Promise<AiFinancialInsightData> {
		if (!this.apiKey) {
			throw new Error("GROQ_API_KEY tidak dikonfigurasi.");
		}

		const groq = new OpenAI({
			apiKey: this.apiKey,
			baseURL: "https://api.groq.com/openai/v1",
		});

		const response = await groq.chat.completions.create({
			model: this.model,
			temperature: 0.2,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: SYSTEM_ROOT_PROMPT,
				},
				{
					role: "user",
					content: featurePrompt,
				},
			],
		});

		const text = response.choices[0]?.message?.content;

		if (!text) {
			throw new Error("Groq (OpenAI SDK) tidak mengembalikan konten output.");
		}

		const cleanedText = text
			.replace(/^```json\s*/i, "")
			.replace(/\s*```$/i, "")
			.trim();

		const parsedJson = JSON.parse(cleanedText);
		return AiFinancialInsightSchema.parse(parsedJson);
	}
}

export const groqAdapter = new GroqAdapter();
