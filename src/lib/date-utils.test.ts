import { describe, expect, it } from "vitest";
import {
	getMonthDateRange,
	getTodayDateString,
	parseIndonesianDate,
} from "./date-utils.ts";

describe("date-utils timezone and month boundaries", () => {
	it("should calculate correct start and end date for a month in WIB (UTC+7)", () => {
		const { startDate, endDate } = getMonthDateRange(10, 2026);

		// 1 Oktober 2026 00:00:00 WIB = 30 September 2026 17:00:00 UTC
		expect(startDate.toISOString()).toBe("2026-09-30T17:00:00.000Z");

		// 31 Oktober 2026 23:59:59.999 WIB = 31 Oktober 2026 16:59:59.999 UTC
		expect(endDate.toISOString()).toBe("2026-10-31T16:59:59.999Z");
	});

	it("should return valid YYYY-MM-DD date string for today", () => {
		const today = getTodayDateString();
		expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("should correctly parse Indonesian formatted date strings into timestamps", () => {
		const t1 = parseIndonesianDate("01 Okt 2026");
		const t2 = parseIndonesianDate("10 November 2026");
		const t3 = parseIndonesianDate("—");

		expect(t1).toBeGreaterThan(0);
		expect(t2).toBeGreaterThan(t1);
		expect(t3).toBe(0);
	});
});
