import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { GeminiAdapter } from "../../src/ai/llm/gemini-adapter.ts";

describe("GeminiAdapter Key Management & Rotation", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		delete process.env.GEMINI_API_KEYS;
		delete process.env.GEMINI_API_KEY;
		delete process.env.GOOGLE_AI_KEY;
		delete process.env.GEMINI_MODEL;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("harus menggunakan default model gemini-3.5-flash", () => {
		const adapter = new GeminiAdapter({ apiKey: "test-key" });
		expect(adapter.getModel()).toBe("gemini-3.5-flash");
	});

	it("harus menghormati GEMINI_MODEL dari environment", () => {
		process.env.GEMINI_MODEL = "gemini-custom-model";
		const adapter = new GeminiAdapter({ apiKey: "test-key" });
		expect(adapter.getModel()).toBe("gemini-custom-model");
	});

	it("harus membaca multiple keys dari GEMINI_API_KEYS dipisahkan koma", () => {
		process.env.GEMINI_API_KEYS = "key-alpha, key-beta , key-gamma";
		const adapter = new GeminiAdapter();
		const keys = adapter.getApiKeys();

		expect(keys).toHaveLength(3);
		expect(keys).toEqual(["key-alpha", "key-beta", "key-gamma"]);
	});

	it("harus menggabungkan GEMINI_API_KEYS dan GEMINI_API_KEY tanpa duplikasi", () => {
		process.env.GEMINI_API_KEYS = "key-1, key-2";
		process.env.GEMINI_API_KEY = "key-2"; // duplikat, tidak boleh double
		process.env.GOOGLE_AI_KEY = "key-3";
		const adapter = new GeminiAdapter();
		const keys = adapter.getApiKeys();

		expect(keys).toEqual(["key-1", "key-2", "key-3"]);
	});

	it("harus memprioritaskan explicit keys dari constructor options", () => {
		process.env.GEMINI_API_KEYS = "env-key-1, env-key-2";
		const adapter = new GeminiAdapter({
			apiKeys: ["manual-key-1", "manual-key-2"],
		});
		const keys = adapter.getApiKeys();

		expect(keys[0]).toBe("manual-key-1");
		expect(keys[1]).toBe("manual-key-2");
		expect(keys).toContain("env-key-1");
	});

	it("harus mulai dari currentKeyIndex 0", () => {
		const adapter = new GeminiAdapter({ apiKey: "test-key" });
		expect(adapter.getCurrentKeyIndex()).toBe(0);
	});
});
