import { describe, expect, it } from "vitest";
import {
	roomSchema,
	tenantSchema,
	transactionFormSchema,
	updateTenantSchema,
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

	describe("updateTenantSchema", () => {
		it("harus meloloskan pembaruan data identitas tanpa field kontrak sewa/agreement", () => {
			const updateData = {
				name: "Budi Santoso Edit",
				nik: "3302142404090006",
				phone: "6281234567890",
				birthDate: "2000-05-15",
				occupationStatus: "Karyawan" as const,
				institution: "PT Teknologi Maju",
				originAddress: "Jl. Sudirman No. 45, Jakarta",
			};
			const result = updateTenantSchema.safeParse(updateData);
			expect(result.success).toBe(true);
		});

		it("harus meloloskan data dengan field nullable dan nomor darurat ber-spasi atau dash", () => {
			const updateDataWithNulls = {
				name: "Siti Rahma",
				nik: "3201014506990001",
				phone: "6281234567890",
				birthDate: null,
				originAddress: null,
				email: null,
				occupationStatus: "Mahasiswa" as const,
				institution: null,
				emergencyName: null,
				emergencyRelation: null,
				emergencyPhone: "0812 3456 7890", // format ber-spasi
				vehicle: null,
				deposit: null,
				notes: null,
				ktpUrl: null,
			};
			const result = updateTenantSchema.safeParse(updateDataWithNulls);
			expect(result.success).toBe(true);
		});

		it("harus menolak pembaruan data jika nama kosong atau NIK tidak valid", () => {
			const invalidUpdate = {
				name: "",
				nik: "123",
				phone: "6281234567890",
				occupationStatus: "Karyawan" as const,
			};
			const result = updateTenantSchema.safeParse(invalidUpdate);
			expect(result.success).toBe(false);
		});

		it("harus meloloskan perubahan kamar dengan mode CORRECTION dan TRANSFER serta flag updatePendingInvoiceAmount", () => {
			const updateCorrection = {
				name: "Budi Santoso",
				nik: "3302142404090006",
				phone: "6281234567890",
				occupationStatus: "Karyawan" as const,
				roomNo: "B-02",
				roomChangeMode: "CORRECTION" as const,
				updatePendingInvoiceAmount: true,
			};
			const resCorrection = updateTenantSchema.safeParse(updateCorrection);
			expect(resCorrection.success).toBe(true);

			const updateTransfer = {
				name: "Budi Santoso",
				nik: "3302142404090006",
				phone: "6281234567890",
				occupationStatus: "Karyawan" as const,
				roomNo: "C-05",
				roomChangeMode: "TRANSFER" as const,
				updatePendingInvoiceAmount: false,
			};
			const resTransfer = updateTenantSchema.safeParse(updateTransfer);
			expect(resTransfer.success).toBe(true);
		});

		it("harus menolak roomChangeMode selain CORRECTION atau TRANSFER", () => {
			const invalidMode = {
				name: "Budi Santoso",
				nik: "3302142404090006",
				phone: "6281234567890",
				occupationStatus: "Karyawan" as const,
				roomNo: "B-02",
				roomChangeMode: "INVALID_MODE",
			};
			const res = updateTenantSchema.safeParse(invalidMode);
			expect(res.success).toBe(false);
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
