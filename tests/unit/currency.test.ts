import { describe, expect, it } from "vitest";
import {
	formatCompactRupiah,
	formatRupiah,
	parseRupiah,
} from "../../src/lib/currency.ts";

describe("Currency Utility (currency.ts)", () => {
	describe("formatRupiah", () => {
		it("harus memformat angka positif ke format standar Rupiah dengan pemisah titik", () => {
			expect(formatRupiah(850000)).toBe("Rp850.000");
			expect(formatRupiah(1500000)).toBe("Rp1.500.000");
			expect(formatRupiah(12500000)).toBe("Rp12.500.000");
			expect(formatRupiah(100000000)).toBe("Rp100.000.000");
		});

		it("harus mengembalikan Rp0 untuk angka 0", () => {
			expect(formatRupiah(0)).toBe("Rp0");
		});

		it("harus melakukan pembulatan untuk angka desimal", () => {
			expect(formatRupiah(850000.4)).toBe("Rp850.000");
			expect(formatRupiah(850000.6)).toBe("Rp850.001");
		});

		it("harus menangani nilai null, undefined, atau NaN secara aman", () => {
			// @ts-expect-error test edge case
			expect(formatRupiah(null)).toBe("Rp0");
			// @ts-expect-error test edge case
			expect(formatRupiah(undefined)).toBe("Rp0");
			expect(formatRupiah(Number.NaN)).toBe("Rp0");
		});
	});

	describe("parseRupiah", () => {
		it("harus mem-parse string format Rupiah ke integer murni", () => {
			expect(parseRupiah("Rp850.000")).toBe(850000);
			expect(parseRupiah("Rp1.500.000")).toBe(1500000);
			expect(parseRupiah("Rp 12.500.000")).toBe(12500000);
			expect(parseRupiah("850000")).toBe(850000);
		});

		it("harus mengembalikan 0 untuk string kosong atau non-digit", () => {
			expect(parseRupiah("")).toBe(0);
			expect(parseRupiah("Rp -")).toBe(0);
			expect(parseRupiah("abc")).toBe(0);
		});

		it("harus menangani string kotor dengan spasi atau karakter acak", () => {
			expect(parseRupiah("  Rp 5.100.000,- ")).toBe(5100000);
		});
	});

	describe("formatCompactRupiah", () => {
		it("harus memformat ribuan ke satuan 'rb'", () => {
			expect(formatCompactRupiah(100000)).toBe("100 rb");
			expect(formatCompactRupiah(850000)).toBe("850 rb");
			expect(formatCompactRupiah(50000)).toBe("50 rb");
		});

		it("harus memformat jutaan ke satuan 'jt'", () => {
			expect(formatCompactRupiah(1000000)).toBe("1 jt");
			expect(formatCompactRupiah(6250000)).toBe("6,25 jt");
			expect(formatCompactRupiah(10500000)).toBe("10,5 jt");
			expect(formatCompactRupiah(50000000)).toBe("50 jt");
		});

		it("harus memformat miliaran ke satuan 'M'", () => {
			expect(formatCompactRupiah(1000000000)).toBe("1 M");
			expect(formatCompactRupiah(1250000000)).toBe("1,25 M");
		});

		it("harus mengembalikan '-' untuk angka 0, null, undefined, atau NaN", () => {
			expect(formatCompactRupiah(0)).toBe("-");
			// @ts-expect-error test edge case
			expect(formatCompactRupiah(null)).toBe("-");
			// @ts-expect-error test edge case
			expect(formatCompactRupiah(undefined)).toBe("-");
		});

		it("harus memformat angka negatif secara tepat", () => {
			expect(formatCompactRupiah(-1500000)).toBe("-1,5 jt");
			expect(formatCompactRupiah(-100000)).toBe("-100 rb");
		});
	});
});

