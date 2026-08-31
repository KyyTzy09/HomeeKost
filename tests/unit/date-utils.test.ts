import { describe, expect, it } from "vitest";
import {
	calculateDueDate,
	formatDate,
	formatRentalPeriod,
	formatShortDueDate,
	getDurationMonths,
	getMonthName,
} from "../../src/lib/date-utils.ts";

describe("Date Utilities (date-utils.ts)", () => {
	describe("getDurationMonths", () => {
		it("harus mengonversi nama durasi sewa ke jumlah bulan yang benar", () => {
			expect(getDurationMonths("Bulanan")).toBe(1);
			expect(getDurationMonths("Triwulan")).toBe(3);
			expect(getDurationMonths("Semesteran")).toBe(6);
			expect(getDurationMonths("Tahunan")).toBe(12);
		});
	});

	describe("calculateDueDate", () => {
		it("harus menghitung tanggal jatuh tempo +1 bulan untuk durasi Bulanan", () => {
			const due = calculateDueDate("2026-01-15", "Bulanan");
			expect(due).toBe("2026-02-15");
		});

		it("harus menghitung tanggal jatuh tempo +3 bulan untuk durasi Triwulan", () => {
			const due = calculateDueDate("2026-01-10", "Triwulan");
			expect(due).toBe("2026-04-10");
		});

		it("harus menghitung tanggal jatuh tempo +6 bulan untuk durasi Semesteran", () => {
			const due = calculateDueDate("2026-01-01", "Semesteran");
			expect(due).toBe("2026-07-01");
		});

		it("harus menghitung tanggal jatuh tempo +12 bulan untuk durasi Tahunan", () => {
			const due = calculateDueDate("2026-01-01", "Tahunan");
			expect(due).toBe("2027-01-01");
		});

		it("harus mengembalikan string kosong untuk input tanggal tidak valid", () => {
			expect(calculateDueDate("", "Bulanan")).toBe("");
			expect(calculateDueDate("invalid-date", "Bulanan")).toBe("");
		});
	});

	describe("formatDate & formatShortDueDate", () => {
		it("harus memformat tanggal ISO YYYY-MM-DD ke nama bulan lokal Indonesia", () => {
			expect(formatDate("2026-08-17")).toBe("17 Agustus 2026");
			expect(formatShortDueDate("2026-12-25")).toBe("25 Desember 2026");
		});

		it("harus mengembalikan '—' jika tanggal null atau undefined", () => {
			expect(formatDate(null)).toBe("—");
			expect(formatDate(undefined)).toBe("—");
		});
	});

	describe("getMonthName", () => {
		it("harus mengembalikan nama bulan Bahasa Indonesia berdasarkan angka 1-12", () => {
			expect(getMonthName(1)).toBe("Januari");
			expect(getMonthName(8)).toBe("Agustus");
			expect(getMonthName(12)).toBe("Desember");
		});

		it("harus menangani angka bulan di luar 1-12", () => {
			expect(getMonthName(0)).toBe("Bulan tidak valid");
			expect(getMonthName(13)).toBe("Bulan tidak valid");
		});
	});

	describe("formatRentalPeriod", () => {
		it("harus memformat rentang tanggal kontrak jika startDate dan endDate diberikan", () => {
			const formatted = formatRentalPeriod({
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-06-30"),
			});
			expect(formatted).toBe("Januari – Juni 2026");
		});

		it("harus memformat rentang siklus invoice individual dari periodMonth dan billingCycle", () => {
			const semesterFormatted = formatRentalPeriod({
				periodMonth: 4,
				periodYear: 2024,
				billingCycle: "SEMI_ANNUAL",
			});
			expect(semesterFormatted).toBe("April – September 2024");

			const monthlyFormatted = formatRentalPeriod({
				periodMonth: 8,
				periodYear: 2026,
				billingCycle: "MONTHLY",
			});
			expect(monthlyFormatted).toBe("Agustus 2026");
		});
	});
});
