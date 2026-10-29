import { describe, expect, it } from "vitest";
import {
	createMonthlyFinancialExcelWorkbook,
	generateMonthlyFinancialExcelBuffer,
	type MonthlyFinancialExcelData,
} from "../../src/lib/excel-exporter.ts";

describe("Monthly Financial Excel Exporter", () => {
	const sampleData: MonthlyFinancialExcelData = {
		propertyName: "HomeeKost Cabang Melati",
		month: 10,
		year: 2026,
		monthName: "Oktober",
		summary: {
			totalIncome: 15000000,
			totalExpense: 3500000,
			operationalExpense: 2500000,
			investmentExpense: 1000000,
			netProfit: 11500000,
			profitMarginPercentage: 76.7,
		},
		profitLossRows: [
			{ account: "Pendapatan Sewa Kamar", period: "Oktober 2026", amount: 15000000 },
			{ account: "Total Pemasukan", period: "Oktober 2026", amount: 15000000, isTotal: true },
			{ account: "Biaya Listrik (PLN)", period: "Oktober 2026", amount: -1500000, isSubItem: true },
			{ account: "Biaya Air (PDAM)", period: "Oktober 2026", amount: -500000, isSubItem: true },
			{ account: "Total Beban Operasional", period: "Oktober 2026", amount: -2500000, isTotal: true },
			{ account: "Laba Bersih (Net Profit)", period: "Oktober 2026", amount: 11500000, isProfit: true },
		],
		transactions: [
			{
				id: "tx-1",
				date: "02 Oktober 2026",
				rawDate: "2026-10-02T10:00:00Z",
				typeKey: "INCOME",
				type: "INCOME",
				category: "Sewa Kamar",
				description: "Pembayaran Sewa Kamar A-01",
				amount: 1500000,
			},
			{
				id: "tx-2",
				date: "05 Oktober 2026",
				rawDate: "2026-10-05T14:30:00Z",
				typeKey: "EXPENSE",
				type: "EXPENSE",
				category: "Listrik",
				description: "Token Listrik Induk Kos",
				amount: 500000,
			},
		],
	};

	it("harus membuat workbook dengan 2 sheet (Laba Rugi & Buku Kas) bertema Sage & Cream", async () => {
		const workbook = await createMonthlyFinancialExcelWorkbook(sampleData);

		expect(workbook).toBeDefined();
		expect(workbook.worksheets.length).toBe(2);

		const wsPL = workbook.getWorksheet("Laba Rugi Oktober");
		expect(wsPL).toBeDefined();
		expect(wsPL?.getCell("A2").value).toBe("HOMEEKOST — LAPORAN LABA RUGI BULANAN");
		expect(wsPL?.getCell("A3").value).toContain("HomeeKost Cabang Melati");
		expect(wsPL?.getCell("A4").value).toContain("Oktober 2026");

		// Validasi KPI Row (Row 7-8)
		expect(wsPL?.getCell("A7").value).toBe("Total Pemasukan");
		expect(wsPL?.getCell("A8").value).toBe(15000000);
		expect(wsPL?.getCell("D8").value).toBe(11500000);

		// Validasi Sheet 2 (Buku Kas)
		const wsTx = workbook.getWorksheet("Buku Kas Oktober");
		expect(wsTx).toBeDefined();
		expect(wsTx?.getCell("A2").value).toBe("HOMEEKOST — BUKU KAS & DAFTAR TRANSAKSI");
		expect(wsTx?.getCell("A4").value).toContain("2 Transaksi Tercatat");

		// Baris transaksi pertama (Row 8)
		expect(wsTx?.getCell("C8").value).toBe("Pemasukan");
		expect(wsTx?.getCell("D8").value).toBe("Sewa Kamar");
		expect(wsTx?.getCell("F8").value).toBe(1500000);
		expect(wsTx?.getCell("G8").value).toBe(0);

		// Baris transaksi kedua (Row 9)
		expect(wsTx?.getCell("C9").value).toBe("Pengeluaran");
		expect(wsTx?.getCell("D9").value).toBe("Listrik");
		expect(wsTx?.getCell("F9").value).toBe(0);
		expect(wsTx?.getCell("G9").value).toBe(500000);

		// Baris Total (Row 10)
		expect(wsTx?.getCell("A10").value).toBe("TOTAL MUTASI KAS BULAN INI:");
		expect(wsTx?.getCell("F10").value).toEqual({
			formula: "SUM(F8:F9)",
			result: 1500000,
		});
		expect(wsTx?.getCell("G10").value).toEqual({
			formula: "SUM(G8:G9)",
			result: 500000,
		});

		// Baris Surplus / Laba Bersih Kas (Row 11)
		expect(wsTx?.getCell("A11").value).toContain("SURPLUS / LABA BERSIH KAS");
		expect(wsTx?.getCell("F11").value).toEqual({
			formula: "F10-G10",
			result: 1000000,
		});
	});

	it("harus menangani kondisi tanpa transaksi (0 data) secara aman tanpa crash", async () => {
		const emptyData: MonthlyFinancialExcelData = {
			...sampleData,
			transactions: [],
		};

		const workbook = await createMonthlyFinancialExcelWorkbook(emptyData);
		expect(workbook.worksheets.length).toBe(2);

		const wsTx = workbook.getWorksheet("Buku Kas Oktober");
		expect(wsTx?.getCell("A8").value).toBe("Belum ada mutasi transaksi pada periode ini.");
	});

	it("harus menangani transaksi dari cashflowService dengan type 'Income'/'Expense' secara akurat", async () => {
		const serviceData: MonthlyFinancialExcelData = {
			...sampleData,
			transactions: [
				{
					id: "cmvtozotv0003ukk8h53szwn4",
					date: "29 Oktober 2026",
					rawDate: "2026-10-29",
					category: "Sewa Kamar",
					categoryKey: "RENT",
					description: "Pembayaran Sewa Kamar 13 (10/2026) - Mira Setiawan",
					type: "Income",
					typeKey: "INCOME",
					amount: 8400000,
				},
				{
					id: "cmvtozotv0003ukk8h53szwn5",
					date: "30 Oktober 2026",
					rawDate: "2026-10-30",
					category: "Listrik",
					categoryKey: "UTILITIES",
					description: "Beli Token Listrik Utama",
					type: "Expense",
					typeKey: "EXPENSE",
					amount: 250000,
				},
			],
		};

		const workbook = await createMonthlyFinancialExcelWorkbook(serviceData);
		const wsTx = workbook.getWorksheet("Buku Kas Oktober");

		expect(wsTx?.getCell("C8").value).toBe("Pemasukan");
		expect(wsTx?.getCell("F8").value).toBe(8400000);
		expect(wsTx?.getCell("G8").value).toBe(0);

		expect(wsTx?.getCell("C9").value).toBe("Pengeluaran");
		expect(wsTx?.getCell("F9").value).toBe(0);
		expect(wsTx?.getCell("G9").value).toBe(250000);
	});

	it("harus menghasilkan Uint8Array buffer (.xlsx) valid berukuran lebih dari 0 byte", async () => {
		const buffer = await generateMonthlyFinancialExcelBuffer(sampleData);
		expect(buffer).toBeInstanceOf(Uint8Array);
		expect(buffer.length).toBeGreaterThan(1000);
	});
});
