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
		it("harus menyusun pengingat tagihan tanggal 1 dengan sapaan Kak dan pengirim Admin Kos", () => {
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

			expect(msg).toContain("Halo Kak *Ahmad Priyadi*! 👋");
			expect(msg).toContain("Kost Harmoni");
			expect(msg).toContain("A-01");
			expect(msg).toContain("INV-202611-001");
			expect(msg).toContain("Rp1.500.000");
			expect(msg).toContain("8735081290");
			expect(msg).toContain("Bude Frisda");
			expect(msg).toContain("Admin Kos Kost Harmoni");
		});
	});

	describe("monthlyFifthReminder Template", () => {
		it("harus menyusun pengingat jatuh tempo tanggal 5 dengan sapaan Kak, batas akhir bayar, dan pengirim Admin Kos", () => {
			const msg = (whatsappTemplates as any).monthlyFifthReminder({
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

			expect(msg).toContain("Halo Kak *Ahmad Priyadi*! 👋");
			expect(msg).toContain("PENGINGAT BATAS AKHIR PEMBAYARAN HARI INI");
			expect(msg).toContain("Kost Harmoni");
			expect(msg).toContain("A-01");
			expect(msg).toContain("INV-202611-001");
			expect(msg).toContain("Rp1.500.000");
			expect(msg).toContain("8735081290");
			expect(msg).toContain("Bude Frisda");
			expect(msg).toContain("Admin Kos Kost Harmoni");
		});
	});

	describe("paymentReceipt Template on-time variation", () => {
		it("harus menyertakan doa kenyamanan hunian dan pengirim Admin Kos jika tepat waktu", () => {
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

			expect(msg).toContain("Halo Kak *Ahmad Priyadi*! 👋");
			expect(msg).toContain("telah kami terima dan diverifikasi lunas");
			expect(msg).toContain("Semoga selalu betah dan nyaman tinggal");
			expect(msg).toContain("Admin Kos Kost Harmoni");
		});

		it("harus menggunakan konfirmasi standar dan pengirim Admin Kos jika pembayaran terlambat", () => {
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

			expect(msg).toContain("Halo Kak *Ahmad Priyadi*! 👋");
			expect(msg).not.toContain("Semoga selalu betah dan nyaman tinggal");
			expect(msg).toContain("Terima kasih atas kerja samanya");
			expect(msg).toContain("Admin Kos Kost Harmoni");
		});
	});

	describe("executiveReportReminder Template", () => {
		it("harus menyusun pesan pengingat laporan tanpa hardcoded HomeeKost dan mencantumkan 4 angka kunci", () => {
			const msg = whatsappTemplates.executiveReportReminder({
				propertyName: "Kost Flamboyan",
				periodMonth: "Oktober",
				periodYear: 2026,
				totalIncome: 18000000,
				totalExpense: 2000000,
				netProfit: 16000000,
				profitMarginPercentage: 88.9,
				occupancyRate: 90,
				financialHealthGrade: "PRIMA 🌟",
			});

			expect(msg).toContain("📊 *LAPORAN KEUANGAN KOST* 📊");
			expect(msg).not.toContain("HOMEEKOST");
			expect(msg).toContain("Kost Flamboyan");
			expect(msg).toContain("Oktober 2026");
			expect(msg).toContain("Rp18.000.000");
			expect(msg).toContain("Rp2.000.000");
			expect(msg).toContain("Rp16.000.000");
			expect(msg).toContain("Margin: 88.9%");
			expect(msg).toContain("PRIMA 🌟");
			expect(msg).toContain("90%");
			expect(msg).toContain("/dashboard/reports");
		});
	});

	describe("Dynamic Property Bank Account Info (bankAccountInfo)", () => {
		it("harus menyertakan bankAccountInfo khusus cabang pada template newInvoice", () => {
			const msg = whatsappTemplates.newInvoice({
				tenantName: "Rian Pratama",
				propertyName: "Kost Sakura",
				roomNumber: "C-02",
				invoiceNumber: "INV-202611-009",
				period: "November 2026",
				dueDate: "05 November 2026",
				amount: 1200000,
				bankAccountInfo: "Mandiri 1370019283721 a.n. Pak Hendra",
			});

			expect(msg).toContain("Mandiri 1370019283721 a.n. Pak Hendra");
			expect(msg).not.toContain("8735081290");
		});

		it("harus menyertakan bankAccountInfo khusus cabang pada monthlyFirstReminder", () => {
			const msg = (whatsappTemplates as any).monthlyFirstReminder({
				tenantName: "Rian Pratama",
				propertyName: "Kost Sakura",
				roomNumber: "C-02",
				invoiceNumber: "INV-202611-009",
				period: "November 2026",
				amount: 1200000,
				bankAccountInfo: "BSI 7123984719 a.n. Ibu Siti",
			});

			expect(msg).toContain("BSI 7123984719 a.n. Ibu Siti");
			expect(msg).not.toContain("8735081290");
		});

		it("harus menyertakan bankAccountInfo khusus cabang pada monthlyFifthReminder", () => {
			const msg = (whatsappTemplates as any).monthlyFifthReminder({
				tenantName: "Rian Pratama",
				propertyName: "Kost Sakura",
				roomNumber: "C-02",
				invoiceNumber: "INV-202611-009",
				period: "November 2026",
				amount: 1200000,
				bankAccountInfo: "BSI 7123984719 a.n. Ibu Siti",
			});

			expect(msg).toContain("BSI 7123984719 a.n. Ibu Siti");
			expect(msg).not.toContain("8735081290");
		});

		it("harus menyertakan bankAccountInfo khusus cabang pada dueReminder & installmentReminder", () => {
			const dueMsg = whatsappTemplates.dueReminder({
				tenantName: "Rian Pratama",
				propertyName: "Kost Sakura",
				roomNumber: "C-02",
				invoiceNumber: "INV-202611-009",
				period: "November 2026",
				dueDate: "05 November 2026",
				daysRemaining: 1,
				amount: 1200000,
				bankAccountInfo: "BNI 0987654321 a.n. Kost Sakura Official",
			});

			expect(dueMsg).toContain("BNI 0987654321 a.n. Kost Sakura Official");

			const instMsg = (whatsappTemplates as any).installmentReminder({
				tenantName: "Rian Pratama",
				propertyName: "Kost Sakura",
				roomNumber: "C-02",
				invoiceNumber: "INV-202611-009",
				period: "November 2026",
				totalAmount: 1200000,
				totalPaid: 600000,
				remainingAmount: 600000,
				endOfMonthDate: "30 November 2026",
				bankAccountInfo: "BNI 0987654321 a.n. Kost Sakura Official",
			});

			expect(instMsg).toContain("BNI 0987654321 a.n. Kost Sakura Official");
		});
	});
});

