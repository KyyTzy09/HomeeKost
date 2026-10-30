import { describe, expect, it } from "vitest";
import {
	formatDatePart,
	formatDeterministicInvoiceNumber,
	formatRoomCodeForInvoice,
	getPropertyCode,
} from "../../src/lib/invoice-utils.ts";

describe("Deterministic Invoice Number Formatting (Revisi #11)", () => {
	it("harus memformat tanggal ke DDMMYYYY 8-digit secara tepat", () => {
		const date = new Date(2026, 9, 22); // 22 Oktober 2026
		expect(formatDatePart(date)).toBe("22102026");
	});

	it("harus memformat nomor kamar 1 digit ke 3 digit dengan padding 0", () => {
		expect(formatRoomCodeForInvoice("5")).toBe("005");
		expect(formatRoomCodeForInvoice("Kamar 5")).toBe("005");
	});

	it("harus memformat nomor kamar 2 digit ke 3 digit", () => {
		expect(formatRoomCodeForInvoice("13")).toBe("013");
		expect(formatRoomCodeForInvoice("Kamar 13")).toBe("013");
	});

	it("harus mengekstrak kode kos dari nama properti (1 Bahari, 2 Homeekost, 3 Hunian)", () => {
		expect(getPropertyCode("Kost Bahari")).toBe("1");
		expect(getPropertyCode("HomeeKost")).toBe("2");
		expect(getPropertyCode("HUNIANÉ")).toBe("3");
	});

	it("harus menghasilkan format persis sesuai contoh klien: Kamar 5 pada 22 Oktober 2026 di HomeeKost -> 22102026-005-2", () => {
		const invoiceNumber = formatDeterministicInvoiceNumber({
			date: new Date(2026, 9, 22),
			roomNumber: "5",
			property: "HomeeKost",
		});
		expect(invoiceNumber).toBe("22102026-005-2");
	});

	it("harus menangani sequence opsional jika ada lebih dari 1 invoice", () => {
		const invoiceNumberSeq = formatDeterministicInvoiceNumber({
			date: new Date(2026, 9, 22),
			roomNumber: "5",
			property: "Kos 1",
			sequence: 2,
		});
		expect(invoiceNumberSeq).toBe("22102026-005-1-2");
	});
});
