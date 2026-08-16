import { buildFinancialFeaturePrompt } from "../prompts/financial-context.ts";
import type {
	AiFinancialInsightData,
	FinancialContextPayload,
} from "../types.ts";
import { generateDeterministicFinancialInsight } from "./fallback-engine.ts";
import { geminiAdapter } from "./gemini-adapter.ts";
import { groqAdapter } from "./groq-adapter.ts";

export interface AiManagerExecutionResult {
	data: AiFinancialInsightData;
	providerUsed: "GEMINI" | "GROQ" | "FALLBACK_RULE_BASED";
	durationMs: number;
}

export class AiManager {
	async analyzeFinancialPerformance(
		payload: FinancialContextPayload,
	): Promise<AiManagerExecutionResult> {
		const startTime = Date.now();
		const featurePrompt = buildFinancialFeaturePrompt(payload);

		// 1. Coba Google Gemini API (Primary)
		if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY) {
			try {
				const geminiResult =
					await geminiAdapter.generateFinancialInsight(featurePrompt);
				return {
					data: geminiResult,
					providerUsed: "GEMINI",
					durationMs: Date.now() - startTime,
				};
			} catch (geminiErr) {
				console.warn(
					"[AiManager] Gemini API gagal, mencoba fallback ke Groq:",
					geminiErr instanceof Error ? geminiErr.message : geminiErr,
				);
			}
		}

		// 2. Coba Groq Cloud API (Secondary)
		if (process.env.GROQ_API_KEY) {
			try {
				const groqResult =
					await groqAdapter.generateFinancialInsight(featurePrompt);
				return {
					data: groqResult,
					providerUsed: "GROQ",
					durationMs: Date.now() - startTime,
				};
			} catch (groqErr) {
				console.warn(
					"[AiManager] Groq API gagal, beralih ke Fallback Rule-Based Engine:",
					groqErr instanceof Error ? groqErr.message : groqErr,
				);
			}
		}

		// 3. Deterministic Local Rule-Based Engine (Guaranteed 100% Availability)
		const fallbackResult = generateDeterministicFinancialInsight(payload);
		return {
			data: fallbackResult,
			providerUsed: "FALLBACK_RULE_BASED",
			durationMs: Date.now() - startTime,
		};
	}
}

export const aiManager = new AiManager();
