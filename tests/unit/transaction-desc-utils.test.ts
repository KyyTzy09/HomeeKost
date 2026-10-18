import { describe, expect, it } from "vitest";
import {
	updateDescriptionRoom,
	updateDescriptionTenantName,
} from "../../src/lib/transaction-desc-utils";

describe("transaction-desc-utils", () => {
	describe("updateDescriptionTenantName", () => {
		it("harus mengganti nama tenant dari huruf kecil ke UPPERCASE", () => {
			const desc = "Pembayaran Sewa Kamar 101 (10/2026) - budi santoso";
			const updated = updateDescriptionTenantName(
				desc,
				"budi santoso",
				"BUDI SANTOSO",
			);
			expect(updated).toBe(
				"Pembayaran Sewa Kamar 101 (10/2026) - BUDI SANTOSO",
			);
		});

		it("harus case-insensitive mencocokkan nama lama meskipun casing berbeda", () => {
			const desc = "Pembayaran Sewa Kamar 101 (10/2026) - Budi Santoso";
			const updated = updateDescriptionTenantName(
				desc,
				"budi santoso",
				"BUDI SANTOSO",
			);
			expect(updated).toBe(
				"Pembayaran Sewa Kamar 101 (10/2026) - BUDI SANTOSO",
			);
		});

		it("harus mengganti nama pada catatan cicilan bertahap", () => {
			const desc =
				"Cicilan ke-2 Sewa Kamar 203 (10/2026) - siti aisyah (Bayar setengah)";
			const updated = updateDescriptionTenantName(
				desc,
				"siti aisyah",
				"SITI AISYAH",
			);
			expect(updated).toBe(
				"Cicilan ke-2 Sewa Kamar 203 (10/2026) - SITI AISYAH (Bayar setengah)",
			);
		});

		it("harus mengembalikan deskripsi asli jika nama lama tidak cocok", () => {
			const desc = "Pembayaran Sewa Kamar 101 (10/2026) - Joko Widodo";
			const updated = updateDescriptionTenantName(
				desc,
				"Budi Santoso",
				"BUDI SANTOSO",
			);
			expect(updated).toBe("Pembayaran Sewa Kamar 101 (10/2026) - Joko Widodo");
		});

		it("harus menangani deskripsi kosong atau input tidak valid secara aman", () => {
			expect(updateDescriptionTenantName("", "Budi", "BUDI")).toBe("");
			expect(
				updateDescriptionTenantName(null as unknown as string, "Budi", "BUDI"),
			).toBe("");
			expect(
				updateDescriptionTenantName("Pembayaran - Budi", "", "BUDI"),
			).toBe("Pembayaran - Budi");
		});
	});

	describe("updateDescriptionRoom", () => {
		it("harus memperbarui nomor kamar pada deskripsi transaksi saat pindah kamar", () => {
			const desc = "Pembayaran Sewa Kamar 101 (10/2026) - BUDI SANTOSO";
			const updated = updateDescriptionRoom(desc, "101", "102");
			expect(updated).toBe(
				"Pembayaran Sewa Kamar 102 (10/2026) - BUDI SANTOSO",
			);
		});

		it("harus memperbarui nomor kamar berformat teks/angka unik (misal A-01 -> B-02)", () => {
			const desc = "Pelunasan Sewa Kamar A-01 (10/2026) - BUDI SANTOSO";
			const updated = updateDescriptionRoom(desc, "A-01", "B-02");
			expect(updated).toBe(
				"Pelunasan Sewa Kamar B-02 (10/2026) - BUDI SANTOSO",
			);
		});

		it("harus mengembalikan deskripsi asli jika nomor kamar lama tidak cocok", () => {
			const desc = "Pembayaran Sewa Kamar 101 (10/2026) - BUDI SANTOSO";
			const updated = updateDescriptionRoom(desc, "105", "102");
			expect(updated).toBe(
				"Pembayaran Sewa Kamar 101 (10/2026) - BUDI SANTOSO",
			);
		});
	});
});
