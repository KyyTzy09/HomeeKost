import { describe, expect, it } from "vitest";
import {
	automationSettingsSchema,
	broadcastToSelectedRecipientsSchema,
	confirmPaymentSchema,
	roomSchema,
	sendSingleTemplateMessageSchema,
	tenantSchema,
	transactionFormSchema,
	updateTenantSchema,
	userFormSchema,
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
				createDifferenceInvoice: true,
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

	describe("confirmPaymentSchema", () => {
		it("harus meloloskan konfirmasi pelunasan penuh default tanpa amount spesifik", () => {
			const validFull = {
				invoiceId: "inv_123",
				paymentMethod: "TRANSFER" as const,
				paidDate: "2026-10-11",
				sendReceiptWhatsApp: true,
				isPartial: false,
			};
			const result = confirmPaymentSchema.safeParse(validFull);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isPartial).toBe(false);
			}
		});

		it("harus meloloskan konfirmasi pembayaran cicilan bertahap dengan nominal positif", () => {
			const validPartial = {
				invoiceId: "inv_123",
				paymentMethod: "CASH" as const,
				paidDate: "2026-10-11",
				isPartial: true,
				amount: 500000,
				notes: "Cicilan ke-1",
			};
			const result = confirmPaymentSchema.safeParse(validPartial);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isPartial).toBe(true);
				expect(result.data.amount).toBe(500000);
			}
		});

		it("harus menolak jika nominal cicilan bernilai 0 atau negatif", () => {
			const invalidAmount = {
				invoiceId: "inv_123",
				paymentMethod: "TRANSFER" as const,
				paidDate: "2026-10-11",
				isPartial: true,
				amount: 0,
			};
			const result = confirmPaymentSchema.safeParse(invalidAmount);
			expect(result.success).toBe(false);

			const negativeAmount = {
				...invalidAmount,
				amount: -100000,
			};
			const resultNegative = confirmPaymentSchema.safeParse(negativeAmount);
			expect(resultNegative.success).toBe(false);
		});

		it("harus menolak jika format tanggal pembayaran tidak valid", () => {
			const invalidDate = {
				invoiceId: "inv_123",
				paymentMethod: "QRIS" as const,
				paidDate: "11-10-2026", // Format salah (harus YYYY-MM-DD)
				isPartial: false,
			};
			const result = confirmPaymentSchema.safeParse(invalidDate);
			expect(result.success).toBe(false);
		});
	});

	describe("automationSettingsSchema", () => {
		it("harus meloloskan konfigurasi automasi laporan yang valid", () => {
			const validSettings = {
				scheduleDay: 5,
				scheduleTime: "08:30",
				autoSendWhatsApp: true,
				targetPhone: "081298765432",
			};
			const result = automationSettingsSchema.safeParse(validSettings);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.scheduleDay).toBe(5);
				expect(result.data.scheduleTime).toBe("08:30");
				expect(result.data.aiModel).toBe("gemini-3.5-flash-lite");
			}
		});

		it("harus menolak jika tanggal di luar 1-28", () => {
			const invalidDayZero = {
				scheduleDay: 0,
				scheduleTime: "08:00",
				targetPhone: "081298765432",
			};
			expect(automationSettingsSchema.safeParse(invalidDayZero).success).toBe(
				false,
			);

			const invalidDay29 = {
				scheduleDay: 29,
				scheduleTime: "08:00",
				targetPhone: "081298765432",
			};
			expect(automationSettingsSchema.safeParse(invalidDay29).success).toBe(
				false,
			);
		});

		it("harus menolak jika format waktu eksekusi bukan HH:mm", () => {
			const invalidTime = {
				scheduleDay: 1,
				scheduleTime: "8 pagi",
				targetPhone: "081298765432",
			};
			expect(automationSettingsSchema.safeParse(invalidTime).success).toBe(
				false,
			);
		});

		it("harus meloloskan jika autoSendWhatsApp dinonaktifkan meski targetPhone kosong", () => {
			const validNoWa = {
				scheduleDay: 1,
				scheduleTime: "08:00",
				autoSendWhatsApp: false,
				targetPhone: "",
			};
			const result = automationSettingsSchema.safeParse(validNoWa);
			expect(result.success).toBe(true);
		});

		it("harus menolak jika autoSendWhatsApp aktif tetapi nomor WhatsApp kosong atau kurang dari 10 digit", () => {
			const emptyPhone = {
				scheduleDay: 1,
				scheduleTime: "08:00",
				autoSendWhatsApp: true,
				targetPhone: "",
			};
			expect(automationSettingsSchema.safeParse(emptyPhone).success).toBe(false);

			const shortPhone = {
				scheduleDay: 1,
				scheduleTime: "08:00",
				autoSendWhatsApp: true,
				targetPhone: "08123",
			};
			expect(automationSettingsSchema.safeParse(shortPhone).success).toBe(false);
		});
	});

	describe("sendSingleTemplateMessageSchema", () => {
		it("harus meloloskan input template personal yang valid", () => {
			const valid = {
				tenantId: "tenant_123",
				templateContent: "Halo {nama}, selamat datang di {kos}!",
			};
			const result = sendSingleTemplateMessageSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		it("harus menolak jika tenantId atau templateContent kosong", () => {
			expect(
				sendSingleTemplateMessageSchema.safeParse({
					tenantId: "",
					templateContent: "Halo",
				}).success,
			).toBe(false);

			expect(
				sendSingleTemplateMessageSchema.safeParse({
					tenantId: "tenant_123",
					templateContent: "",
				}).success,
			).toBe(false);
		});
	});

	describe("broadcastToSelectedRecipientsSchema", () => {
		it("harus meloloskan payload broadcast selektif yang valid", () => {
			const valid = {
				tenantIds: ["tenant_1", "tenant_2"],
				templateContent: "Pemberitahuan untuk {nama} di kamar {kamar}",
				title: "Info Kebersihan",
			};
			const result = broadcastToSelectedRecipientsSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		it("harus menolak jika daftar tenantIds kosong", () => {
			const invalid = {
				tenantIds: [],
				templateContent: "Pemberitahuan",
			};
			const result = broadcastToSelectedRecipientsSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		});
	});

	describe("userFormSchema", () => {
		it("harus meloloskan pembuatan akun pengguna dengan password valid", () => {
			const validUser = {
				name: "Staf Operasional Kos",
				email: "staf.melati@homeekost.com",
				role: "ADMIN" as const,
				assignedProperty: "HomeeKost Cabang Melati",
				status: "ACTIVE" as const,
				password: "password123",
			};
			const result = userFormSchema.safeParse(validUser);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.password).toBe("password123");
			}
		});

		it("harus meloloskan edit akun pengguna dengan password kosong", () => {
			const editUser = {
				name: "Staf Operasional Kos",
				email: "staf.melati@homeekost.com",
				role: "ADMIN" as const,
				assignedProperty: "HomeeKost Cabang Melati",
				status: "ACTIVE" as const,
				password: "",
			};
			const result = userFormSchema.safeParse(editUser);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.password).toBe("");
			}
		});

		it("harus meloloskan jika field password tidak disertakan (default ke string kosong)", () => {
			const userWithoutPassword = {
				name: "SuperAdmin Baru",
				email: "owner2@homeekost.com",
				role: "SUPER_ADMIN" as const,
				assignedProperty: "Semua Kost",
				status: "ACTIVE" as const,
			};
			const result = userFormSchema.safeParse(userWithoutPassword);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.password).toBe("");
			}
		});

		it("harus menolak jika password kurang dari 8 karakter", () => {
			const invalidPasswordUser = {
				name: "Staf Melati",
				email: "staf@homeekost.com",
				role: "ADMIN" as const,
				assignedProperty: "Semua Kost",
				status: "ACTIVE" as const,
				password: "12345",
			};
			const result = userFormSchema.safeParse(invalidPasswordUser);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"Password minimal 8 karakter",
				);
			}
		});

		it("harus menolak jika format email tidak valid", () => {
			const invalidEmailUser = {
				name: "Staf Melati",
				email: "bukan-email-valid",
				role: "ADMIN" as const,
				assignedProperty: "Semua Kost",
				status: "ACTIVE" as const,
				password: "password123",
			};
			const result = userFormSchema.safeParse(invalidEmailUser);
			expect(result.success).toBe(false);
		});

		it("harus menolak jika nama pengguna kosong", () => {
			const emptyNameUser = {
				name: "",
				email: "staf@homeekost.com",
				role: "ADMIN" as const,
				assignedProperty: "Semua Kost",
				status: "ACTIVE" as const,
				password: "password123",
			};
			const result = userFormSchema.safeParse(emptyNameUser);
			expect(result.success).toBe(false);
		});
	});
});


