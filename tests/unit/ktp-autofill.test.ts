import { describe, expect, it } from "vitest";
import { tenantSchema, updateTenantSchema } from "../../src/common/validations/tenant.schema.ts";

describe("KTP Autofill & Zero-Storage Tenant Schema Validation", () => {
	it("should allow tenant creation without ktpUrl (null/undefined)", () => {
		const validTenantData = {
			name: "Budi Santoso",
			phone: "081234567890",
			nik: "3201234567890001",
			occupationStatus: "Karyawan",
			institution: "PT Maju Mundur",
			emergencyName: "Siti",
			emergencyRelation: "Ibu",
			emergencyPhone: "081298765432",
			roomNo: "Kamar 01",
			rent: "1500000",
			duration: "Bulanan",
			startDate: "2026-10-01",
			dueDate: "2026-11-01",
			registrationDate: "2026-10-01",
			deposit: "500000",
			notes: "Catatan pendaftaran",
			agreement: true,
			ktpUrl: null,
		};

		const parsed = tenantSchema.safeParse(validTenantData);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.ktpUrl).toBeNull();
			expect(parsed.data.name).toBe("Budi Santoso");
			expect(parsed.data.nik).toBe("3201234567890001");
		}
	});

	it("should allow tenant creation with empty string ktpUrl", () => {
		const validTenantData = {
			name: "Dewi Lestari",
			phone: "081299998888",
			nik: "3201999988880002",
			occupationStatus: "Mahasiswa",
			roomNo: "Kamar 02",
			rent: "1700000",
			duration: "Bulanan",
			startDate: "2026-10-01",
			dueDate: "2026-11-01",
			registrationDate: "2026-10-01",
			agreement: true,
			ktpUrl: "",
		};

		const parsed = tenantSchema.safeParse(validTenantData);
		expect(parsed.success).toBe(true);
	});

	it("should allow tenant update without ktpUrl", () => {
		const updateData = {
			name: "Budi Santoso Updated",
			phone: "081234567890",
			nik: "3201234567890001",
			occupationStatus: "Karyawan",
			roomNo: "Kamar 01",
			rent: "1500000",
			duration: "Bulanan",
			startDate: "2026-10-01",
			dueDate: "2026-11-01",
			registrationDate: "2026-10-01",
			agreement: true,
			roomChangeMode: "CORRECTION",
		};

		const parsed = updateTenantSchema.safeParse(updateData);
		expect(parsed.success).toBe(true);
	});
});
