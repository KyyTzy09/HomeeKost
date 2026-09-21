import { describe, expect, it } from "vitest";
import {
	computeDueDate,
	extractDueDay,
	getCycleMultiplier,
} from "../../src/components/payment/PaymentFormDialog.tsx";

describe("Payment Form Calculation Helpers", () => {
	describe("getCycleMultiplier", () => {
		it("harus mengembalikan 12 bulan untuk siklus Tahunan", () => {
			const res = getCycleMultiplier("Tahunan");
			expect(res.months).toBe(12);
			expect(res.label).toBe("Tahunan (12 Bulan)");
		});

		it("harus mengembalikan 6 bulan untuk siklus Semesteran", () => {
			const res = getCycleMultiplier("Semesteran");
			expect(res.months).toBe(6);
			expect(res.label).toBe("Semesteran (6 Bulan)");
		});

		it("harus mengembalikan 3 bulan untuk siklus Triwulan", () => {
			const res = getCycleMultiplier("Triwulan");
			expect(res.months).toBe(3);
			expect(res.label).toBe("Triwulan (3 Bulan)");
		});

		it("harus mengembalikan 1 bulan untuk siklus Bulanan", () => {
			const res = getCycleMultiplier("Bulanan");
			expect(res.months).toBe(1);
			expect(res.label).toBe("Bulanan (1 Bulan)");
		});

		it("harus default ke 1 bulan jika durasi tidak dikenal atau undefined", () => {
			expect(getCycleMultiplier(undefined).months).toBe(1);
			expect(getCycleMultiplier("").months).toBe(1);
			expect(getCycleMultiplier("Harian").months).toBe(1);
		});
	});

	describe("extractDueDay", () => {
		it("harus mengekstrak angka hari dari string format tanggal", () => {
			expect(extractDueDay("10 Mar")).toBe(10);
			expect(extractDueDay("15 Agu")).toBe(15);
			expect(extractDueDay("Tanggal 25 tiap bulan")).toBe(25);
			expect(extractDueDay("5")).toBe(5);
		});

		it("harus default ke 10 jika string kosong, null, atau tidak memiliki angka", () => {
			expect(extractDueDay("")).toBe(10);
			expect(extractDueDay(null)).toBe(10);
			expect(extractDueDay(undefined)).toBe(10);
			expect(extractDueDay("—")).toBe(10);
		});

		it("harus melakukan clamping antara 1 dan 28 untuk tanggal aman", () => {
			expect(extractDueDay("0")).toBe(1);
			expect(extractDueDay("31")).toBe(28);
			expect(extractDueDay("29 Feb")).toBe(28);
			expect(extractDueDay("28")).toBe(28);
			expect(extractDueDay("1")).toBe(1);
		});
	});

	describe("computeDueDate", () => {
		it("harus memformat dueDate menjadi YYYY-MM-DD dengan padding nol", () => {
			expect(computeDueDate("10 Mar", 2026, 9)).toBe("2026-09-10");
			expect(computeDueDate("5", 2026, 3)).toBe("2026-03-05");
			expect(computeDueDate("20 Agu", 2026, 12)).toBe("2026-12-20");
		});

		it("harus menangani fallback ke tanggal 10 saat dueDate string tidak valid", () => {
			expect(computeDueDate(undefined, 2026, 9)).toBe("2026-09-10");
			expect(computeDueDate("—", 2026, 1)).toBe("2026-01-10");
		});

		it("harus clamp tanggal lebih dari 28 ke 28", () => {
			expect(computeDueDate("31", 2026, 2)).toBe("2026-02-28");
		});
	});
});
