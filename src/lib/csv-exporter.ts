import type { AnnualFinancialMatrixResult } from "../data/repositories/report.repository.ts";
import { formatRupiah } from "./currency.ts";

const SHORT_MONTHS = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MEI",
	"JUN",
	"JUL",
	"AGU",
	"SEP",
	"OKT",
	"NOV",
	"DES",
];

/**
 * Helper untuk membersihkan nilai sel CSV
 */
function escapeCsvCell(cell: string | number): string {
	const str = String(cell);
	if (
		str.includes(",") ||
		str.includes(";") ||
		str.includes('"') ||
		str.includes("\n")
	) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Format angka numerik murni tanpa simbol agar mudah diolah / dijumlahkan di Excel
 */
function formatNumber(num: number): string {
	return Math.round(num).toString();
}

/**
 * Generator CSV Matriks Finansial Tahunan (12 Bulan) dengan UTF-8 BOM
 */
export function generateAnnualFinancialCsv(
	matrix: AnnualFinancialMatrixResult,
): string {
	const lines: string[] = [];

	// 1. Header Metadata Dokumen
	lines.push(escapeCsvCell("HOMEEKOST MANAGEMENT — LAPORAN KEUANGAN TAHUNAN"));
	lines.push(
		`${escapeCsvCell("Tahun Buku")},${escapeCsvCell(matrix.year.toString())}`,
	);
	lines.push(
		`${escapeCsvCell("Properti / Cabang")},${escapeCsvCell(matrix.propertyName)}`,
	);
	lines.push(`${escapeCsvCell("Mata Uang")},${escapeCsvCell("IDR (Rupiah)")}`);
	lines.push(
		`${escapeCsvCell("Tanggal Unduh")},${escapeCsvCell(new Date().toLocaleDateString("id-ID", { dateStyle: "full" }))}`,
	);
	lines.push(""); // Baris Kosong Pemisah

	// 2. Baris Header Kolom Tabel
	const tableHeader = [
		escapeCsvCell("KOMPONEN KEUANGAN"),
		...SHORT_MONTHS.map((m) => escapeCsvCell(m)),
		escapeCsvCell("TOTAL TAHUNAN"),
	];
	lines.push(tableHeader.join(","));

	// 3. Section A: PENDAPATAN SEWA PER KOS
	lines.push(escapeCsvCell("[A] PENDAPATAN SEWA PER CABANG KOS"));

	for (const prop of matrix.propertyIncomes) {
		const row = [
			escapeCsvCell(`- ${prop.propertyName}`),
			...prop.monthlyIncome.map((val) => escapeCsvCell(formatNumber(val))),
			escapeCsvCell(formatNumber(prop.totalAnnualIncome)),
		];
		lines.push(row.join(","));
	}

	// Baris Total Pendapatan
	const totalIncomeRow = [
		escapeCsvCell("TOTAL PENDAPATAN (OMZET)"),
		...matrix.monthlyTotalIncome.map((val) => escapeCsvCell(formatNumber(val))),
		escapeCsvCell(formatNumber(matrix.grandTotals.totalIncome)),
	];
	lines.push(totalIncomeRow.join(","));
	lines.push(""); // Baris Kosong

	// 4. Section B: BEBAN PENGELUARAN
	lines.push(escapeCsvCell("[B] BEBAN PENGELUARAN KAS"));

	const opExpenseRow = [
		escapeCsvCell("- Beban Operasional Rutin (Listrik, Air, WiFi, Sampah)"),
		...matrix.monthlyOperationalExpense.map((val) =>
			escapeCsvCell(formatNumber(val)),
		),
		escapeCsvCell(formatNumber(matrix.grandTotals.totalOperationalExpense)),
	];
	lines.push(opExpenseRow.join(","));

	const invExpenseRow = [
		escapeCsvCell("- Beban Investasi & Renovasi (Aset, Kasur, AC)"),
		...matrix.monthlyInvestmentExpense.map((val) =>
			escapeCsvCell(formatNumber(val)),
		),
		escapeCsvCell(formatNumber(matrix.grandTotals.totalInvestmentExpense)),
	];
	lines.push(invExpenseRow.join(","));

	const totalExpenseRow = [
		escapeCsvCell("TOTAL SELURUH PENGELUARAN"),
		...matrix.monthlyTotalExpense.map((val) =>
			escapeCsvCell(formatNumber(val)),
		),
		escapeCsvCell(formatNumber(matrix.grandTotals.totalExpense)),
	];
	lines.push(totalExpenseRow.join(","));
	lines.push(""); // Baris Kosong

	// 5. Section C: HASIL BERSIH & MARGIN
	lines.push(escapeCsvCell("[C] HASIL BERSIH (PROFITABILITAS)"));

	const netProfitRow = [
		escapeCsvCell("LABA BERSIH (NET PROFIT)"),
		...matrix.monthlyNetProfit.map((val) => escapeCsvCell(formatNumber(val))),
		escapeCsvCell(formatNumber(matrix.grandTotals.netProfit)),
	];
	lines.push(netProfitRow.join(","));

	const profitMarginRow = [
		escapeCsvCell("MARGIN LABA (%)"),
		...matrix.monthlyProfitMargin.map((val) =>
			escapeCsvCell(`${val.toFixed(1)}%`),
		),
		escapeCsvCell(`${matrix.grandTotals.profitMargin.toFixed(1)}%`),
	];
	lines.push(profitMarginRow.join(","));
	lines.push(""); // Baris Kosong

	// 6. Rangkuman Eksekutif dalam Tabel
	lines.push(escapeCsvCell("[D] RINGKASAN EKSEKUTIF TAHUNAN"));
	lines.push(
		`${escapeCsvCell("Total Omzet Setahun")},${escapeCsvCell(formatRupiah(matrix.grandTotals.totalIncome))}`,
	);
	lines.push(
		`${escapeCsvCell("Total Beban Operasional")},${escapeCsvCell(formatRupiah(matrix.grandTotals.totalOperationalExpense))}`,
	);
	lines.push(
		`${escapeCsvCell("Total Beban Investasi")},${escapeCsvCell(formatRupiah(matrix.grandTotals.totalInvestmentExpense))}`,
	);
	lines.push(
		`${escapeCsvCell("Total Laba Bersih Tahunan")},${escapeCsvCell(formatRupiah(matrix.grandTotals.netProfit))}`,
	);
	lines.push(
		`${escapeCsvCell("Rata-rata Margin Laba")},${escapeCsvCell(`${matrix.grandTotals.profitMargin.toFixed(1)}%`)}`,
	);

	// Tambahkan UTF-8 BOM (\uFEFF) di awal string agar Excel otomatis membaca karakter bahasa Indonesia & angka dengan benar
	return `\uFEFF${lines.join("\r\n")}`;
}
