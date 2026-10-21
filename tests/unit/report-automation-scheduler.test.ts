import { describe, expect, it } from "vitest";
import { isReportScheduleDue } from "../../src/lib/schedule-utils.ts";

describe("Report Automation Scheduler (schedule-utils.ts)", () => {
	describe("isReportScheduleDue", () => {
		it("harus mengembalikan true jika tanggal dan jam di WIB cocok persis", () => {
			// UTC 01:00:00 adalah 08:00:00 WIB di hari yang sama
			const now = new Date("2026-03-01T01:00:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 1,
				scheduleTime: "08:00",
			});
			expect(isDue).toBe(true);
		});

		it("harus mengembalikan false jika tanggal berbeda", () => {
			// 2026-03-02 01:00:00 UTC -> 2026-03-02 08:00:00 WIB (Hari ke-2, bukan 1)
			const now = new Date("2026-03-02T01:00:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 1,
				scheduleTime: "08:00",
			});
			expect(isDue).toBe(false);
		});

		it("harus mengembalikan false jika jam berbeda", () => {
			// 2026-03-01 02:00:00 UTC -> 2026-03-01 09:00:00 WIB (Jam 9, bukan 8)
			const now = new Date("2026-03-01T02:00:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 1,
				scheduleTime: "08:00",
			});
			expect(isDue).toBe(false);
		});

		it("harus mengonversi UTC timestamp ke WIB (+7 jam) dengan benar", () => {
			// UTC 01:30:00 -> 08:30:00 WIB (cocok dengan jadwal 08:00 karena dieksekusi di jam 08)
			const now = new Date("2026-04-05T01:30:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 5,
				scheduleTime: "08:00",
			});
			expect(isDue).toBe(true);
		});

		it("harus menangani pergantian tanggal lintas tengah malam UTC ke WIB", () => {
			// 2026-02-28 18:00:00 UTC -> 2026-03-01 01:00:00 WIB
			// Di UTC masih tanggal 28 Feb, tapi di WIB sudah tanggal 1 Mar jam 01:00
			const now = new Date("2026-02-28T18:00:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 1,
				scheduleTime: "01:00",
			});
			expect(isDue).toBe(true);
		});

		it("harus menggunakan fallback jam 08:00 jika scheduleTime tidak dispesifikasikan", () => {
			// UTC 01:00:00 -> 08:00:00 WIB
			const now = new Date("2026-05-01T01:00:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 1,
			});
			expect(isDue).toBe(true);
		});

		it("harus mengembalikan false jika fallback jam 08:00 tidak cocok", () => {
			// UTC 03:00:00 -> 10:00:00 WIB
			const now = new Date("2026-05-01T03:00:00.000Z");
			const isDue = isReportScheduleDue({
				now,
				scheduleDay: 1,
			});
			expect(isDue).toBe(false);
		});
	});
});
