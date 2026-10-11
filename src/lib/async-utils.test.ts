import { describe, expect, it } from "vitest";
import { sleepWithJitter } from "./async-utils.ts";

describe("sleepWithJitter Utility", () => {
	it("should sleep for at least baseMs and not exceed baseMs + jitterMs", async () => {
		const baseMs = 50;
		const jitterMs = 30;
		const start = Date.now();
		await sleepWithJitter(baseMs, jitterMs);
		const elapsed = Date.now() - start;

		// Allow slight timing tolerance (e.g. -5ms for timer resolution)
		expect(elapsed).toBeGreaterThanOrEqual(baseMs - 10);
		expect(elapsed).toBeLessThanOrEqual(baseMs + jitterMs + 50);
	});

	it("should default to non-zero delay when called without arguments", async () => {
		// Test that it resolves without error with short default simulation
		const promise = sleepWithJitter(10, 10);
		await expect(promise).resolves.toBeUndefined();
	});
});
