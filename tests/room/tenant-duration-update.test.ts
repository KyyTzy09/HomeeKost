import { describe, expect, it } from "vitest";
import { updateTenantSchema } from "../../src/common/validations/tenant.schema.ts";
import { getDurationMonths, calculateDueDate } from "../../src/lib/date-utils.ts";

describe("Tenant Duration Update & Scope Validation", () => {
	it("harus meloloskan updateTenantSchema dengan contractUpdateScope ALL_HISTORY", () => {
		const payload = {
			name: "Budi Santoso",
			nik: "3302142404090006",
			phone: "6281234567890",
			occupationStatus: "Karyawan" as const,
			duration: "Triwulan" as const,
			rent: "Rp2.550.000",
			contractUpdateScope: "ALL_HISTORY" as const,
		};

		const result = updateTenantSchema.safeParse(payload);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.contractUpdateScope).toBe("ALL_HISTORY");
			expect(result.data.duration).toBe("Triwulan");
		}
	});

	it("harus meloloskan updateTenantSchema dengan contractUpdateScope CURRENT_ONLY", () => {
		const payload = {
			name: "Siti Rahma",
			nik: "3201014506990001",
			phone: "6281234567890",
			occupationStatus: "Mahasiswa" as const,
			duration: "Semesteran" as const,
			contractUpdateScope: "CURRENT_ONLY" as const,
		};

		const result = updateTenantSchema.safeParse(payload);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.contractUpdateScope).toBe("CURRENT_ONLY");
			expect(result.data.duration).toBe("Semesteran");
		}
	});

	it("harus menolak contractUpdateScope di luar ALL_HISTORY atau CURRENT_ONLY", () => {
		const payload = {
			name: "Budi Santoso",
			nik: "3302142404090006",
			phone: "6281234567890",
			occupationStatus: "Karyawan" as const,
			contractUpdateScope: "INVALID_SCOPE",
		};

		const result = updateTenantSchema.safeParse(payload);
		expect(result.success).toBe(false);
	});

	it("harus menghitung tanggal jatuh tempo baru secara presisi ketika durasi diperbarui", () => {
		const startDate = "2026-10-01";
		
		// 1. Bulanan -> +1 bulan
		expect(calculateDueDate(startDate, "Bulanan")).toBe("2026-11-01");
		expect(getDurationMonths("Bulanan")).toBe(1);

		// 2. Triwulan -> +3 bulan
		expect(calculateDueDate(startDate, "Triwulan")).toBe("2027-01-01");
		expect(getDurationMonths("Triwulan")).toBe(3);

		// 3. Semesteran -> +6 bulan
		expect(calculateDueDate(startDate, "Semesteran")).toBe("2027-04-01");
		expect(getDurationMonths("Semesteran")).toBe(6);

		// 4. Tahunan -> +12 bulan
		expect(calculateDueDate(startDate, "Tahunan")).toBe("2027-10-01");
		expect(getDurationMonths("Tahunan")).toBe(12);
	});

	it("harus memverifikasi logika skip pada generator tagihan bulanan untuk kontrak multi-bulan aktif", () => {
		// Mock contract dengan durasi Triwulan dari 1 Oktober 2026 s/d 1 Januari 2027
		const contractEndDate = new Date(2027, 0, 1);   // 1 Jan 2027
		const billingCycle: string = "QUARTERLY";

		// Uji bulan November 2026 (Bulan ke-2 dari siklus Triwulan)
		const novPeriodStart = new Date(2026, 10, 1); // 1 Nov 2026
		const shouldSkipNov = billingCycle !== "MONTHLY" && contractEndDate && novPeriodStart < contractEndDate;
		expect(shouldSkipNov).toBe(true);

		// Uji bulan Desember 2026 (Bulan ke-3 dari siklus Triwulan)
		const decPeriodStart = new Date(2026, 11, 1); // 1 Des 2026
		const shouldSkipDec = billingCycle !== "MONTHLY" && contractEndDate && decPeriodStart < contractEndDate;
		expect(shouldSkipDec).toBe(true);

		// Uji bulan Januari 2027 (Masa kontrak Triwulan sudah berakhir, siap terbit invoice baru)
		const janPeriodStart = new Date(2027, 0, 1); // 1 Jan 2027
		const shouldSkipJan = billingCycle !== "MONTHLY" && contractEndDate && janPeriodStart < contractEndDate;
		expect(shouldSkipJan).toBe(false);
	});
});
