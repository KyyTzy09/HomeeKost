import { describe, expect, it } from "vitest";
import {
	roomSchema,
	tenantSchema,
	transactionFormSchema,
} from "../../src/common/validations/index.ts";

describe("Zod Validation Schemas", () => {
	describe("tenantSchema", () => {
		const validTenantData = {
			name: "Budi Santoso",
			nik: "3302142404090006",
			phone: "6281234567890",
			birthDate: "2000-05-15",
			occupationStatus: "Mahasiswa" as const,
			roomNo: "A-01",
			rent: "Rp850.000",
			duration: "Bulanan" as const,
			startDate: "2026-08-01",
			dueDate: "2026-09-01",
			registrationDate: "2026-08-01",
			agreement: true,
		};

		it("harus meloloskan data penyewa yang valid dan lengkap", () => {
			const result = tenantSchema.safeParse(validTenantData);
			expect(result.success).toBe(true);
		});

		it("harus menolak NIK yang bukan 16 digit angka", () => {
			const result = tenantSchema.safeParse({
				...validTenantData,
				nik: "12345", // Kurang dari 16 digit
			});
			expect(result.success).toBe(false);
		});

		it("harus menolak jika persetujuan (agreement) bernilai false", () => {
			const result = tenantSchema.safeParse({
				...validTenantData,
				agreement: false,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("roomSchema", () => {
		it("harus meloloskan kamar dengan nomor dan harga valid", () => {
			const validRoom = {
				roomNo: "A-01",
				type: "Standard" as const,
				price: "Rp850.000",
				facilities: "AC, WiFi, Kasur Springbed",
				status: "Kosong" as const,
			};
			const result = roomSchema.safeParse(validRoom);
			expect(result.success).toBe(true);
		});
	});

	describe("transactionFormSchema", () => {
		it("harus meloloskan transaksi pemasukan dengan nominal dan kategori valid", () => {
			const validFinance = {
				propertyId: "prop_melati_01",
				date: "2026-08-15",
				type: "INCOME" as const,
				category: "RENT",
				classification: "OPERATIONAL" as const,
				amount: 850000,
				method: "Transfer" as const,
				description: "Pembayaran sewa kamar A-01",
			};
			const result = transactionFormSchema.safeParse(validFinance);
			expect(result.success).toBe(true);
		});
	});
});
