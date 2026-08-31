import { describe, expect, it } from "vitest";
import { whatsappTemplates } from "../../src/lib/whatsapp-templates.ts";

describe("WhatsApp Notification Message Templates", () => {
	describe("newInvoice Template", () => {
		it("harus menyusun pesan tagihan lengkap dengan rincian kamar, invoice, dan rekening", () => {
			const msg = whatsappTemplates.newInvoice({
				tenantName: "Ahmad Dahlan",
				propertyName: "HomeeKost Cabang Melati",
				roomNumber: "A-01",
				invoiceNumber: "INV-202608-1001",
				period: "Agustus 2026",
				dueDate: "10 Agustus 2026",
				amount: 850000,
				bankName: "BCA",
				bankAccount: "1234567890",
				accountHolder: "Frisda Utami",
			});

			expect(msg).toContain("Ahmad Dahlan");
			expect(msg).toContain("HomeeKost Cabang Melati");
			expect(msg).toContain("A-01");
			expect(msg).toContain("INV-202608-1001");
			expect(msg).toContain("Rp850.000");
			expect(msg).toContain("1234567890");
		});
	});

	describe("dueReminder Template", () => {
		it("harus memformat pesan H-3 dengan hitungan hari tersisa", () => {
			const msg = whatsappTemplates.dueReminder({
				tenantName: "Siti Rahma",
				propertyName: "HomeeKost Cabang Mawar",
				roomNumber: "B-03",
				invoiceNumber: "INV-202608-1002",
				period: "Agustus 2026",
				dueDate: "10 Agustus 2026",
				daysRemaining: 3,
				amount: 1200000,
			});

			expect(msg).toContain("3 hari lagi");
			expect(msg).toContain("Rp1.200.000");
		});

		it("harus memformat pesan H-0 (Hari Ini Jatuh Tempo)", () => {
			const msg = whatsappTemplates.dueReminder({
				tenantName: "Siti Rahma",
				propertyName: "HomeeKost Cabang Mawar",
				roomNumber: "B-03",
				invoiceNumber: "INV-202608-1002",
				period: "Agustus 2026",
				dueDate: "10 Agustus 2026",
				daysRemaining: 0,
				amount: 1200000,
			});

			expect(msg).toContain("HARI INI JATUH TEMPO");
		});

		it("harus memformat pesan Overdue (Tunggakan Lewat Jatuh Tempo)", () => {
			const msg = whatsappTemplates.dueReminder({
				tenantName: "Siti Rahma",
				propertyName: "HomeeKost Cabang Mawar",
				roomNumber: "B-03",
				invoiceNumber: "INV-202608-1002",
				period: "Agustus 2026",
				dueDate: "10 Agustus 2026",
				daysRemaining: -4,
				amount: 1200000,
			});

			expect(msg).toContain("PEMBERITAHUAN TUNGGAKAN");
			expect(msg).toContain("4 hari");
		});
	});

	describe("birthdayWish Template", () => {
		it("harus menyusun ucapan selamat ulang tahun hangat", () => {
			const msg = whatsappTemplates.birthdayWish({
				tenantName: "Fajar Pratama",
				propertyName: "HomeeKost Cabang Melati",
			});

			expect(msg).toContain("SELAMAT ULANG TAHUN");
			expect(msg).toContain("Fajar Pratama");
			expect(msg).toContain("HomeeKost Cabang Melati");
		});
	});
});
