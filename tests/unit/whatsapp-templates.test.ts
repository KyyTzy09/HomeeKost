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

	describe("partialPaymentReceipt Template", () => {
		it("harus menyusun bukti penerimaan cicilan dengan nominal diterima dan sisa tagihan", () => {
			const msg = (whatsappTemplates as any).partialPaymentReceipt({
				tenantName: "Budi Santoso",
				propertyName: "HomeeKost Melati",
				roomNumber: "A-01",
				invoiceNumber: "INV-202610-001",
				period: "Oktober 2026",
				paidDate: "11 Oktober 2026",
				paymentMethod: "Transfer Bank",
				paidThisTime: 500000,
				totalAmount: 1500000,
				totalPaid: 500000,
				remainingAmount: 1000000,
			});

			expect(msg).toContain("BUKTI PENERIMAAN CICILAN SEWA");
			expect(msg).toContain("Budi Santoso");
			expect(msg).toContain("Rp500.000");
			expect(msg).toContain("Rp1.500.000");
			expect(msg).toContain("Rp1.000.000");
			expect(msg).toContain("Transfer Bank");
		});
	});

	describe("installmentReminder Template", () => {
		it("harus menyusun pengingat sisa cicilan dengan batas akhir bulan dan rekening tujuan", () => {
			const msg = (whatsappTemplates as any).installmentReminder({
				tenantName: "Budi Santoso",
				propertyName: "HomeeKost Melati",
				roomNumber: "A-01",
				invoiceNumber: "INV-202610-001",
				period: "Oktober 2026",
				totalAmount: 1500000,
				totalPaid: 500000,
				remainingAmount: 1000000,
				endOfMonthDate: "31 Oktober 2026",
				bankAccount: "BCA 1234567890",
				accountHolder: "Bude Frisda",
			});

			expect(msg).toContain("PENGINGAT SISA CICILAN SEWA");
			expect(msg).toContain("Budi Santoso");
			expect(msg).toContain("31 Oktober 2026");
			expect(msg).toContain("Rp1.000.000");
			expect(msg).toContain("BCA 1234567890");
			expect(msg).toContain("Bude Frisda");
		});
	});

	describe("monthlyFirstReminder Template", () => {
		it("harus menyusun pengingat tagihan tanggal 1 tanpa kata 'Kak', menyebut masa bayar tanggal 1 s/d 5, dan klausul denda", () => {
			const msg = (whatsappTemplates as any).monthlyFirstReminder({
				tenantName: "Ahmad Priyadi",
				propertyName: "Kost Harmoni",
				roomNumber: "A-01",
				invoiceNumber: "INV-202611-001",
				period: "November 2026",
				amount: 1500000,
				bankAccount: "8735081290",
				accountHolder: "Bude Frisda",
				documentUrl: "http://localhost:3000/api/invoices/123/document",
			});

			expect(msg).toContain("Halo *Ahmad Priyadi*");
			expect(msg).not.toContain("Halo Kak");
			expect(msg).toContain("Hari ini sudah tanggal 1 November 2026");
			expect(msg).toContain("Tanggal 1 s/d 5 November 2026");
			expect(msg).toContain("dikenakan denda keterlambatan");
			expect(msg).toContain("Rp1.500.000");
			expect(msg).toContain("8735081290");
			expect(msg).toContain("Bude Frisda");
		});
	});

	describe("paymentReceipt Template on-time variation", () => {
		it("harus menyertakan apresiasi kedisiplinan dan tanpa kata 'Kak' jika pembayaran tepat waktu", () => {
			const msg = whatsappTemplates.paymentReceipt({
				tenantName: "Ahmad Priyadi",
				propertyName: "Kost Harmoni",
				roomNumber: "A-01",
				invoiceNumber: "INV-202611-001",
				period: "November 2026",
				paidDate: "01 Nov 2026",
				amount: 1500000,
				paymentMethod: "Transfer Bank",
				isOnTime: true,
			});

			expect(msg).toContain("Halo *Ahmad Priyadi*");
			expect(msg).not.toContain("Halo Kak");
			expect(msg).toContain("tepat waktu");
			expect(msg).toContain("mengapresiasi kedisiplinan");
		});

		it("harus menggunakan konfirmasi formal standar jika pembayaran terlambat", () => {
			const msg = whatsappTemplates.paymentReceipt({
				tenantName: "Ahmad Priyadi",
				propertyName: "Kost Harmoni",
				roomNumber: "A-01",
				invoiceNumber: "INV-202611-001",
				period: "November 2026",
				paidDate: "08 Nov 2026",
				amount: 1500000,
				paymentMethod: "Transfer Bank",
				isOnTime: false,
			});

			expect(msg).toContain("Halo *Ahmad Priyadi*");
			expect(msg).not.toContain("Halo Kak");
			expect(msg).not.toContain("tepat waktu");
			expect(msg).toContain("telah kami terima dan diverifikasi");
		});
	});
});

