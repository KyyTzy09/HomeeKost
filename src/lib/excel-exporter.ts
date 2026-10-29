import ExcelJS from "exceljs";
import type { AnnualFinancialMatrixResult } from "../data/repositories/report.repository.ts";
import { formatDate } from "./date-utils.ts";

const MONTH_NAMES = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

// Palette Warna Sage & Cream HomeeKost
const PALETTE = {
	sageDark: "4F6958",
	sageMedium: "5F896D",
	sageLight: "E8F0EA",
	sagePale: "F3F7F3",
	cream: "FAF9F5",
	white: "FFFFFF",
	textDark: "252925",
	textMuted: "737873",
	borderLight: "E4E9E4",
	borderDark: "4F6958",
	redMuted: "B66B68",
	greenMuted: "5F896D",
};

const IDR_FORMAT = '_-"Rp"* #,##0_-;[Red]-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
const PERCENT_FORMAT = "0.0%";

/**
 * Buat instance ExcelJS Workbook dengan format tabel rapi, formula deterministik, dan styling profesional.
 */
export async function createAnnualFinancialExcelWorkbook(
	matrix: AnnualFinancialMatrixResult,
): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "HomeeKost Management";
	workbook.created = new Date();
	workbook.properties.date1904 = false;

	// ─────────────────────────────────────────────────────────────
	// SHEET 1: LAPORAN KEUANGAN TAHUNAN KONSOLIDASI
	// ─────────────────────────────────────────────────────────────
	const ws = workbook.addWorksheet(`Laporan Tahunan ${matrix.year}`, {
		views: [{ showGridLines: true }],
		pageSetup: {
			orientation: "landscape",
			paperSize: 9, // A4
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0,
		},
	});

	// Atur Lebar Kolom
	ws.columns = [
		{ key: "month", width: 18 }, // A: Bulan
		{ key: "income", width: 24 }, // B: Pendapatan
		{ key: "opExpense", width: 24 }, // C: Biaya Operasional
		{ key: "invExpense", width: 24 }, // D: Biaya Investasi
		{ key: "totalExpense", width: 24 }, // E: Total Biaya
		{ key: "netProfit", width: 24 }, // F: Laba Bersih
		{ key: "margin", width: 18 }, // G: Margin Laba (%)
	];

	// 1. Header Metadata Dokumen (Baris 2–5)
	const titleCell = ws.getCell("A2");
	titleCell.value = "LAPORAN KEUANGAN TAHUNAN HOMEEKOST";
	titleCell.font = {
		name: "Arial",
		size: 15,
		bold: true,
		color: { argb: `FF${PALETTE.sageDark}` },
	};
	ws.mergeCells("A2:G2");
	ws.getRow(2).height = 28;

	const propCell = ws.getCell("A3");
	propCell.value = `Properti: ${matrix.propertyName}`;
	propCell.font = {
		name: "Arial",
		size: 11,
		bold: true,
		color: { argb: `FF${PALETTE.textDark}` },
	};
	ws.mergeCells("A3:G3");

	const yearCell = ws.getCell("A4");
	yearCell.value = `Tahun Pembukuan: ${matrix.year}`;
	yearCell.font = {
		name: "Arial",
		size: 10.5,
		color: { argb: `FF${PALETTE.textDark}` },
	};
	ws.mergeCells("A4:G4");

	const dateCell = ws.getCell("A5");
	const downloadDateStr = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
	dateCell.value = `Tanggal Unduh: ${downloadDateStr}`;
	dateCell.font = {
		name: "Arial",
		size: 9.5,
		italic: true,
		color: { argb: `FF${PALETTE.textMuted}` },
	};
	ws.mergeCells("A5:G5");

	// Baris 6 Kosong
	ws.getRow(6).height = 10;

	// 2. Baris Header Tabel (Baris 7)
	const headerRow = ws.getRow(7);
	headerRow.height = 26;
	const headers = [
		"Bulan",
		"Pendapatan (Rp)",
		"Biaya Operasional (Rp)",
		"Biaya Investasi (Rp)",
		"Total Biaya (Rp)",
		"Laba Bersih (Rp)",
		"Margin Laba",
	];

	headers.forEach((h, idx) => {
		const cell = headerRow.getCell(idx + 1);
		cell.value = h;
		cell.font = {
			name: "Arial",
			size: 10.5,
			bold: true,
			color: { argb: `FF${PALETTE.white}` },
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.sageDark}` },
		};
		cell.alignment = {
			vertical: "middle",
			horizontal: idx === 0 ? "left" : "center",
			indent: idx === 0 ? 1 : 0,
		};
		cell.border = {
			top: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			bottom: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
		};
	});

	// 3. 12 Baris Data Bulanan (Baris 8 s.d. 19: Jan s.d. Des)
	const dataStartRow = 8;
	for (let i = 0; i < 12; i++) {
		const rowIndex = dataStartRow + i;
		const row = ws.getRow(rowIndex);
		row.height = 20;

		const isEven = i % 2 === 1;
		const rowBgColor = isEven ? PALETTE.sagePale : PALETTE.white;

		const monthName = MONTH_NAMES[i];
		const inc = matrix.monthlyTotalIncome[i] || 0;
		const opExp = matrix.monthlyOperationalExpense[i] || 0;
		const invExp = matrix.monthlyInvestmentExpense[i] || 0;
		const totExp = matrix.monthlyTotalExpense[i] || 0;
		const profit = matrix.monthlyNetProfit[i] || 0;
		const marginPct = (matrix.monthlyProfitMargin[i] || 0) / 100;

		// A: Bulan
		const cellA = row.getCell(1);
		cellA.value = monthName;
		cellA.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: { argb: `FF${PALETTE.textDark}` },
		};
		cellA.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

		// B: Pendapatan (Rp)
		const cellB = row.getCell(2);
		cellB.value = inc;
		cellB.numFmt = IDR_FORMAT;
		cellB.font = { name: "Arial", size: 10 };
		cellB.alignment = { vertical: "middle", horizontal: "right" };

		// C: Biaya Operasional (Rp)
		const cellC = row.getCell(3);
		cellC.value = opExp;
		cellC.numFmt = IDR_FORMAT;
		cellC.font = { name: "Arial", size: 10 };
		cellC.alignment = { vertical: "middle", horizontal: "right" };

		// D: Biaya Investasi (Rp)
		const cellD = row.getCell(4);
		cellD.value = invExp;
		cellD.numFmt = IDR_FORMAT;
		cellD.font = { name: "Arial", size: 10 };
		cellD.alignment = { vertical: "middle", horizontal: "right" };

		// E: Total Biaya (Formula = C + D)
		const cellE = row.getCell(5);
		cellE.value = {
			formula: `C${rowIndex}+D${rowIndex}`,
			result: totExp,
		};
		cellE.numFmt = IDR_FORMAT;
		cellE.font = { name: "Arial", size: 10, bold: true };
		cellE.alignment = { vertical: "middle", horizontal: "right" };

		// F: Laba Bersih (Formula = B - E)
		const cellF = row.getCell(6);
		cellF.value = {
			formula: `B${rowIndex}-E${rowIndex}`,
			result: profit,
		};
		cellF.numFmt = IDR_FORMAT;
		cellF.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: {
				argb: profit < 0 ? `FF${PALETTE.redMuted}` : `FF${PALETTE.textDark}`,
			},
		};
		cellF.alignment = { vertical: "middle", horizontal: "right" };

		// G: Margin Laba (%) (Formula = IF(B>0, F/B, 0))
		const cellG = row.getCell(7);
		cellG.value = {
			formula: `IF(B${rowIndex}>0, F${rowIndex}/B${rowIndex}, 0)`,
			result: marginPct,
		};
		cellG.numFmt = PERCENT_FORMAT;
		cellG.font = { name: "Arial", size: 10 };
		cellG.alignment = { vertical: "middle", horizontal: "center" };

		// Styling Border & Background per sel
		for (let c = 1; c <= 7; c++) {
			const cell = row.getCell(c);
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: `FF${rowBgColor}` },
			};
			cell.border = {
				top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				bottom: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			};
		}
	}

	// Baris 20 Kosong Pemisah
	ws.getRow(20).height = 10;

	// 4. Baris TOTAL TAHUNAN (Baris 21)
	const totalRow = ws.getRow(21);
	totalRow.height = 24;

	totalRow.getCell(1).value = `TOTAL TAHUN ${matrix.year}`;
	totalRow.getCell(2).value = {
		formula: "SUM(B8:B19)",
		result: matrix.grandTotals.totalIncome,
	};
	totalRow.getCell(3).value = {
		formula: "SUM(C8:C19)",
		result: matrix.grandTotals.totalOperationalExpense,
	};
	totalRow.getCell(4).value = {
		formula: "SUM(D8:D19)",
		result: matrix.grandTotals.totalInvestmentExpense,
	};
	totalRow.getCell(5).value = {
		formula: "SUM(E8:E19)",
		result: matrix.grandTotals.totalExpense,
	};
	totalRow.getCell(6).value = {
		formula: "SUM(F8:F19)",
		result: matrix.grandTotals.netProfit,
	};
	totalRow.getCell(7).value = {
		formula: "IF(B21>0, F21/B21, 0)",
		result: matrix.grandTotals.profitMargin / 100,
	};

	for (let c = 1; c <= 7; c++) {
		const cell = totalRow.getCell(c);
		cell.font = {
			name: "Arial",
			size: 10.5,
			bold: true,
			color: { argb: `FF${PALETTE.textDark}` },
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.sageLight}` },
		};
		if (c >= 2 && c <= 6) {
			cell.numFmt = IDR_FORMAT;
			cell.alignment = { vertical: "middle", horizontal: "right" };
		} else if (c === 7) {
			cell.numFmt = PERCENT_FORMAT;
			cell.alignment = { vertical: "middle", horizontal: "center" };
		} else {
			cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
		}
		cell.border = {
			top: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			bottom: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
		};
	}

	// 5. Baris RATA-RATA BULANAN (Baris 22)
	const avgRow = ws.getRow(22);
	avgRow.height = 22;

	avgRow.getCell(1).value = "RATA-RATA BULANAN";
	avgRow.getCell(2).value = {
		formula: "AVERAGE(B8:B19)",
		result: Math.round(matrix.grandTotals.totalIncome / 12),
	};
	avgRow.getCell(3).value = {
		formula: "AVERAGE(C8:C19)",
		result: Math.round(matrix.grandTotals.totalOperationalExpense / 12),
	};
	avgRow.getCell(4).value = {
		formula: "AVERAGE(D8:D19)",
		result: Math.round(matrix.grandTotals.totalInvestmentExpense / 12),
	};
	avgRow.getCell(5).value = {
		formula: "AVERAGE(E8:E19)",
		result: Math.round(matrix.grandTotals.totalExpense / 12),
	};
	avgRow.getCell(6).value = {
		formula: "AVERAGE(F8:F19)",
		result: Math.round(matrix.grandTotals.netProfit / 12),
	};
	avgRow.getCell(7).value = {
		formula: "IF(B22>0, F22/B22, 0)",
		result: matrix.grandTotals.profitMargin / 100,
	};

	for (let c = 1; c <= 7; c++) {
		const cell = avgRow.getCell(c);
		cell.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: { argb: `FF${PALETTE.textDark}` },
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.cream}` },
		};
		if (c >= 2 && c <= 6) {
			cell.numFmt = IDR_FORMAT;
			cell.alignment = { vertical: "middle", horizontal: "right" };
		} else if (c === 7) {
			cell.numFmt = PERCENT_FORMAT;
			cell.alignment = { vertical: "middle", horizontal: "center" };
		} else {
			cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
		}
		cell.border = {
			top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			bottom: { style: "double", color: { argb: `FF${PALETTE.sageDark}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
		};
	}

	// ─────────────────────────────────────────────────────────────
	// SHEET 2: RINCIAN PENDAPATAN PER CABANG KOS (Multi-Property)
	// ─────────────────────────────────────────────────────────────
	if (matrix.propertyIncomes && matrix.propertyIncomes.length > 0) {
		const wsDetail = workbook.addWorksheet("Rincian Cabang Kos", {
			views: [{ showGridLines: true }],
			pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true },
		});

		wsDetail.columns = [
			{ key: "propName", width: 28 },
			...MONTH_NAMES.map((_, idx) => ({ key: `m_${idx}`, width: 16 })),
			{ key: "total", width: 20 },
		];

		const dTitle = wsDetail.getCell("A2");
		dTitle.value = `RINCIAN PENDAPATAN SEWA PER CABANG KOS (${matrix.year})`;
		dTitle.font = {
			name: "Arial",
			size: 13,
			bold: true,
			color: { argb: `FF${PALETTE.sageDark}` },
		};
		wsDetail.mergeCells("A2:N2");

		const dHeaderRow = wsDetail.getRow(4);
		dHeaderRow.height = 24;
		const dHeaders = [
			"Nama Cabang Kos",
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"Mei",
			"Jun",
			"Jul",
			"Agu",
			"Sep",
			"Okt",
			"Nov",
			"Des",
			"Total Setahun",
		];

		dHeaders.forEach((h, idx) => {
			const cell = dHeaderRow.getCell(idx + 1);
			cell.value = h;
			cell.font = {
				name: "Arial",
				size: 10,
				bold: true,
				color: { argb: `FF${PALETTE.white}` },
			};
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: `FF${PALETTE.sageDark}` },
			};
			cell.alignment = {
				vertical: "middle",
				horizontal: idx === 0 ? "left" : "center",
				indent: idx === 0 ? 1 : 0,
			};
			cell.border = {
				top: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
				left: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
				bottom: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
				right: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			};
		});

		let curRow = 5;
		for (const prop of matrix.propertyIncomes) {
			const row = wsDetail.getRow(curRow);
			row.height = 20;
			const cellName = row.getCell(1);
			cellName.value = prop.propertyName;
			cellName.font = { name: "Arial", size: 10, bold: true };
			cellName.alignment = {
				vertical: "middle",
				horizontal: "left",
				indent: 1,
			};

			for (let m = 0; m < 12; m++) {
				const val = prop.monthlyIncome[m] || 0;
				const c = row.getCell(m + 2);
				c.value = val;
				c.numFmt = IDR_FORMAT;
				c.font = { name: "Arial", size: 9.5 };
				c.alignment = { vertical: "middle", horizontal: "right" };
			}

			const cellTot = row.getCell(14);
			cellTot.value = {
				formula: `SUM(B${curRow}:M${curRow})`,
				result: prop.totalAnnualIncome,
			};
			cellTot.numFmt = IDR_FORMAT;
			cellTot.font = { name: "Arial", size: 10, bold: true };
			cellTot.alignment = { vertical: "middle", horizontal: "right" };

			for (let col = 1; col <= 14; col++) {
				const c = row.getCell(col);
				c.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: {
						argb: curRow % 2 === 0 ? `FF${PALETTE.sagePale}` : "FFFFFFFF",
					},
				};
				c.border = {
					top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
					left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
					bottom: {
						style: "thin",
						color: { argb: `FF${PALETTE.borderLight}` },
					},
					right: {
						style: "thin",
						color: { argb: `FF${PALETTE.borderLight}` },
					},
				};
			}
			curRow++;
		}
	}

	return workbook;
}

/**
 * Generate binary buffer (.xlsx) untuk response server atau download client
 */
export async function generateAnnualFinancialExcelBuffer(
	matrix: AnnualFinancialMatrixResult,
): Promise<Uint8Array> {
	const workbook = await createAnnualFinancialExcelWorkbook(matrix);
	const buffer = await workbook.xlsx.writeBuffer();
	return new Uint8Array(buffer);
}

/**
 * Helper untuk men-trigger download langsung file Excel (.xlsx) di browser client
 */
export async function downloadAnnualFinancialExcel(
	matrix: AnnualFinancialMatrixResult,
	filename?: string,
): Promise<void> {
	const buffer = await generateAnnualFinancialExcelBuffer(matrix);
	const blob = new Blob([buffer as BlobPart], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	const cleanPropName = matrix.propertyName
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	const targetFilename =
		filename || `Laporan-Keuangan-Tahunan-${cleanPropName}-${matrix.year}.xlsx`;

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = targetFilename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// EKSPOR LAPORAN KEUANGAN BULANAN (2 SHEET: LABA RUGI & BUKU KAS)
// ─────────────────────────────────────────────────────────────

export interface MonthlyFinancialExcelData {
	propertyName: string;
	month: number;
	year: number;
	monthName: string;
	summary: {
		totalIncome: number;
		totalExpense: number;
		operationalExpense: number;
		investmentExpense: number;
		netProfit: number;
		profitMarginPercentage?: number;
	};
	profitLossRows: Array<{
		account: string;
		period?: string;
		amount: number;
		isTotal?: boolean;
		isProfit?: boolean;
		isSubItem?: boolean;
	}>;
	transactions: Array<{
		id: string;
		date?: string;
		rawDate?: string;
		type?: string;
		typeKey?: "INCOME" | "EXPENSE" | string;
		category: string;
		description?: string;
		amount: number;
		method?: string;
		propertyName?: string;
	}>;
}

/**
 * Buat instance ExcelJS Workbook untuk Laporan Keuangan Bulanan
 * Sheet 1: Laba Rugi & Indikator Finansial
 * Sheet 2: Buku Kas & Rincian Seluruh Transaksi 1 Bulan Penuh
 */
export async function createMonthlyFinancialExcelWorkbook(
	data: MonthlyFinancialExcelData,
): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "HomeeKost Management";
	workbook.created = new Date();
	workbook.properties.date1904 = false;

	const downloadDateStr = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	// ─────────────────────────────────────────────────────────────
	// SHEET 1: LAPORAN LABA RUGI BULANAN
	// ─────────────────────────────────────────────────────────────
	const wsPL = workbook.addWorksheet(`Laba Rugi ${data.monthName}`, {
		views: [{ showGridLines: true }],
		pageSetup: {
			orientation: "portrait",
			paperSize: 9, // A4
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0,
		},
	});

	wsPL.columns = [
		{ key: "account", width: 34 },
		{ key: "period", width: 22 },
		{ key: "amount", width: 24 },
		{ key: "percentage", width: 20 },
	];

	// Header metadata
	const titlePL = wsPL.getCell("A2");
	titlePL.value = "HOMEEKOST — LAPORAN LABA RUGI BULANAN";
	titlePL.font = {
		name: "Arial",
		size: 14,
		bold: true,
		color: { argb: `FF${PALETTE.sageDark}` },
	};
	wsPL.mergeCells("A2:D2");
	wsPL.getRow(2).height = 26;

	const propPL = wsPL.getCell("A3");
	propPL.value = `Properti / Cabang: ${data.propertyName}`;
	propPL.font = {
		name: "Arial",
		size: 11,
		bold: true,
		color: { argb: `FF${PALETTE.textDark}` },
	};
	wsPL.mergeCells("A3:D3");

	const periodPL = wsPL.getCell("A4");
	periodPL.value = `Periode Pembukuan: ${data.monthName} ${data.year}`;
	periodPL.font = {
		name: "Arial",
		size: 10.5,
		color: { argb: `FF${PALETTE.textDark}` },
	};
	wsPL.mergeCells("A4:D4");

	const datePL = wsPL.getCell("A5");
	datePL.value = `Tanggal Unduh: ${downloadDateStr}`;
	datePL.font = {
		name: "Arial",
		size: 9.5,
		italic: true,
		color: { argb: `FF${PALETTE.textMuted}` },
	};
	wsPL.mergeCells("A5:D5");

	wsPL.getRow(6).height = 10;

	// KPI Cards (Row 7-8)
	const kpiHeaders = [
		"Total Pemasukan",
		"Beban Operasional",
		"Beban Investasi",
		"Laba Bersih",
	];
	const kpiHeaderRow = wsPL.getRow(7);
	kpiHeaderRow.height = 20;
	kpiHeaders.forEach((kpi, idx) => {
		const cell = kpiHeaderRow.getCell(idx + 1);
		cell.value = kpi;
		cell.font = {
			name: "Arial",
			size: 9.5,
			bold: true,
			color: { argb: `FF${PALETTE.sageDark}` },
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.sageLight}` },
		};
		cell.alignment = { vertical: "middle", horizontal: "center" };
		cell.border = {
			top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			bottom: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
		};
	});

	const kpiValues = [
		data.summary.totalIncome,
		data.summary.operationalExpense,
		data.summary.investmentExpense,
		data.summary.netProfit,
	];
	const kpiValueRow = wsPL.getRow(8);
	kpiValueRow.height = 24;
	kpiValues.forEach((val, idx) => {
		const cell = kpiValueRow.getCell(idx + 1);
		cell.value = val;
		cell.numFmt = IDR_FORMAT;
		cell.font = {
			name: "Arial",
			size: 11,
			bold: true,
			color: {
				argb:
					idx === 3 && val < 0
						? `FF${PALETTE.redMuted}`
						: `FF${PALETTE.textDark}`,
			},
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.sagePale}` },
		};
		cell.alignment = { vertical: "middle", horizontal: "center" };
		cell.border = {
			top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			bottom: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
		};
	});

	wsPL.getRow(9).height = 12;

	// Table Header (Row 10)
	const plHeaderRow = wsPL.getRow(10);
	plHeaderRow.height = 24;
	const plHeaders = [
		"Akun Pembukuan",
		"Periode",
		"Nominal (Rp)",
		"Rasio Terhadap Pemasukan",
	];
	plHeaders.forEach((h, idx) => {
		const cell = plHeaderRow.getCell(idx + 1);
		cell.value = h;
		cell.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: { argb: `FF${PALETTE.white}` },
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.sageDark}` },
		};
		cell.alignment = {
			vertical: "middle",
			horizontal: idx === 0 ? "left" : idx === 2 ? "right" : "center",
			indent: idx === 0 ? 1 : 0,
		};
		cell.border = {
			top: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			bottom: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
		};
	});

	// Table Data Rows (Row 11+)
	const totalIncome = data.summary.totalIncome || 1;
	data.profitLossRows.forEach((row, i) => {
		const rowIdx = 11 + i;
		const r = wsPL.getRow(rowIdx);
		r.height = row.isTotal ? 22 : 19;

		const cellA = r.getCell(1);
		cellA.value = row.account;
		cellA.font = {
			name: "Arial",
			size: row.isTotal ? 10.5 : row.isSubItem ? 9.5 : 10,
			bold: Boolean(row.isTotal || row.isProfit),
			color: {
				argb: row.isProfit
					? `FF${PALETTE.sageDark}`
					: `FF${PALETTE.textDark}`,
			},
		};
		cellA.alignment = {
			vertical: "middle",
			horizontal: "left",
			indent: row.isSubItem ? 2 : row.isTotal ? 1 : 1,
		};

		const cellB = r.getCell(2);
		cellB.value = row.period || `${data.monthName} ${data.year}`;
		cellB.font = {
			name: "Arial",
			size: 9.5,
			color: { argb: `FF${PALETTE.textMuted}` },
		};
		cellB.alignment = { vertical: "middle", horizontal: "center" };

		const cellC = r.getCell(3);
		cellC.value = row.amount;
		cellC.numFmt = IDR_FORMAT;
		cellC.font = {
			name: "Arial",
			size: row.isTotal ? 10.5 : 10,
			bold: Boolean(row.isTotal || row.isProfit),
			color: {
				argb:
					row.amount < 0
						? `FF${PALETTE.redMuted}`
						: `FF${PALETTE.textDark}`,
			},
		};
		cellC.alignment = { vertical: "middle", horizontal: "right" };

		const cellD = r.getCell(4);
		const ratio = Math.abs(row.amount) / totalIncome;
		cellD.value = ratio;
		cellD.numFmt = PERCENT_FORMAT;
		cellD.font = {
			name: "Arial",
			size: 9.5,
			color: { argb: `FF${PALETTE.textMuted}` },
		};
		cellD.alignment = { vertical: "middle", horizontal: "center" };

		const bg = row.isProfit
			? PALETTE.sageLight
			: row.isTotal
				? PALETTE.sagePale
				: i % 2 === 1
					? PALETTE.sagePale
					: PALETTE.white;

		[cellA, cellB, cellC, cellD].forEach((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: `FF${bg}` },
			};
			cell.border = {
				top: {
					style: row.isTotal ? "thin" : "hair",
					color: { argb: `FF${PALETTE.borderLight}` },
				},
				left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				bottom: {
					style: row.isProfit ? "double" : row.isTotal ? "medium" : "hair",
					color: {
						argb: row.isProfit
							? `FF${PALETTE.sageDark}`
							: `FF${PALETTE.borderLight}`,
					},
				},
				right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			};
		});
	});

	// ─────────────────────────────────────────────────────────────
	// SHEET 2: BUKU KAS & MUTASI TRANSAKSI
	// ─────────────────────────────────────────────────────────────
	const wsTx = workbook.addWorksheet(`Buku Kas ${data.monthName}`, {
		views: [{ showGridLines: true }],
		pageSetup: {
			orientation: "landscape",
			paperSize: 9, // A4
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0,
		},
	});

	wsTx.columns = [
		{ key: "no", width: 7 },
		{ key: "date", width: 18 },
		{ key: "type", width: 16 },
		{ key: "category", width: 22 },
		{ key: "description", width: 36 },
		{ key: "income", width: 24 },
		{ key: "expense", width: 24 },
	];

	// Header metadata
	const titleTx = wsTx.getCell("A2");
	titleTx.value = "HOMEEKOST — BUKU KAS & DAFTAR TRANSAKSI";
	titleTx.font = {
		name: "Arial",
		size: 14,
		bold: true,
		color: { argb: `FF${PALETTE.sageDark}` },
	};
	wsTx.mergeCells("A2:G2");
	wsTx.getRow(2).height = 26;

	const propTx = wsTx.getCell("A3");
	propTx.value = `Properti / Cabang: ${data.propertyName}`;
	propTx.font = {
		name: "Arial",
		size: 11,
		bold: true,
		color: { argb: `FF${PALETTE.textDark}` },
	};
	wsTx.mergeCells("A3:G3");

	const periodTx = wsTx.getCell("A4");
	periodTx.value = `Periode Pembukuan: ${data.monthName} ${data.year} (${data.transactions.length} Transaksi Tercatat)`;
	periodTx.font = {
		name: "Arial",
		size: 10.5,
		color: { argb: `FF${PALETTE.textDark}` },
	};
	wsTx.mergeCells("A4:G4");

	const dateTx = wsTx.getCell("A5");
	dateTx.value = `Tanggal Unduh: ${downloadDateStr}`;
	dateTx.font = {
		name: "Arial",
		size: 9.5,
		italic: true,
		color: { argb: `FF${PALETTE.textMuted}` },
	};
	wsTx.mergeCells("A5:G5");

	wsTx.getRow(6).height = 10;

	// Table Header (Row 7)
	const txHeaderRow = wsTx.getRow(7);
	txHeaderRow.height = 24;
	const txHeaders = [
		"No",
		"Tanggal Transaksi",
		"Jenis",
		"Kategori",
		"Keterangan / Catatan",
		"Pemasukan (Rp)",
		"Pengeluaran (Rp)",
	];

	txHeaders.forEach((h, idx) => {
		const cell = txHeaderRow.getCell(idx + 1);
		cell.value = h;
		cell.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: { argb: `FF${PALETTE.white}` },
		};
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: `FF${PALETTE.sageDark}` },
		};
		cell.alignment = {
			vertical: "middle",
			horizontal: idx >= 5 ? "right" : idx === 4 ? "left" : "center",
			indent: idx === 4 ? 1 : 0,
		};
		cell.border = {
			top: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			left: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
			bottom: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
			right: { style: "thin", color: { argb: `FF${PALETTE.sageDark}` } },
		};
	});

	// Transactions Data Rows (Row 8+)
	const sortedTx = [...data.transactions].sort((a, b) => {
		const dateA = new Date(a.rawDate || a.date || 0).getTime();
		const dateB = new Date(b.rawDate || b.date || 0).getTime();
		return dateA - dateB;
	});

	const txStartRow = 8;
	if (sortedTx.length === 0) {
		const emptyRow = wsTx.getRow(txStartRow);
		emptyRow.height = 26;
		const cell = emptyRow.getCell(1);
		cell.value = "Belum ada mutasi transaksi pada periode ini.";
		cell.font = {
			name: "Arial",
			size: 10,
			italic: true,
			color: { argb: `FF${PALETTE.textMuted}` },
		};
		cell.alignment = { vertical: "middle", horizontal: "center" };
		wsTx.mergeCells(`A${txStartRow}:G${txStartRow}`);

		for (let col = 1; col <= 7; col++) {
			emptyRow.getCell(col).border = {
				top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				bottom: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			};
		}
	} else {
		sortedTx.forEach((tx, idx) => {
			const rowIdx = txStartRow + idx;
			const r = wsTx.getRow(rowIdx);
			r.height = 20;

			const isIncome =
				tx.typeKey?.toUpperCase() === "INCOME" ||
				tx.type?.toUpperCase() === "INCOME" ||
				tx.type === "Pemasukan";

			const cellA = r.getCell(1); // No
			cellA.value = idx + 1;
			cellA.alignment = { vertical: "middle", horizontal: "center" };

			const cellB = r.getCell(2); // Tanggal
			cellB.value = tx.date || formatDate(tx.rawDate);
			cellB.alignment = { vertical: "middle", horizontal: "center" };

			const cellC = r.getCell(3); // Jenis
			cellC.value = isIncome ? "Pemasukan" : "Pengeluaran";
			cellC.alignment = { vertical: "middle", horizontal: "center" };
			cellC.font = {
				name: "Arial",
				size: 9.5,
				bold: true,
				color: {
					argb: isIncome
						? `FF${PALETTE.greenMuted}`
						: `FF${PALETTE.redMuted}`,
				},
			};

			const cellD = r.getCell(4); // Kategori
			cellD.value = tx.category || "-";
			cellD.alignment = { vertical: "middle", horizontal: "center" };

			const cellE = r.getCell(5); // Deskripsi
			cellE.value = tx.description || "-";
			cellE.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

			const cellF = r.getCell(6); // Pemasukan
			cellF.value = isIncome ? tx.amount : 0;
			cellF.numFmt = IDR_FORMAT;
			cellF.alignment = { vertical: "middle", horizontal: "right" };

			const cellG = r.getCell(7); // Pengeluaran
			cellG.value = isIncome ? 0 : tx.amount;
			cellG.numFmt = IDR_FORMAT;
			cellG.alignment = { vertical: "middle", horizontal: "right" };

			const bg = idx % 2 === 1 ? PALETTE.sagePale : PALETTE.white;
			[cellA, cellB, cellC, cellD, cellE, cellF, cellG].forEach((cell) => {
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: `FF${bg}` },
				};
				if (cell !== cellC) {
					cell.font = {
						name: "Arial",
						size: 9.5,
						color: { argb: `FF${PALETTE.textDark}` },
					};
				}
				cell.border = {
					top: { style: "hair", color: { argb: `FF${PALETTE.borderLight}` } },
					left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
					bottom: {
						style: "hair",
						color: { argb: `FF${PALETTE.borderLight}` },
					},
					right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				};
			});
		});

		// Summary Total Row (lastRow + 1)
		const txEndRow = txStartRow + sortedTx.length - 1;
		const totalRowIdx = txEndRow + 1;
		const totalRow = wsTx.getRow(totalRowIdx);
		totalRow.height = 24;

		// Hitung total deterministik agar sel langsung terisi nilai (precomputed result) di semua penampil Excel
		const calculatedTotalIncome = sortedTx.reduce((sum, tx) => {
			const isIncome =
				tx.typeKey?.toUpperCase() === "INCOME" ||
				tx.type?.toUpperCase() === "INCOME" ||
				tx.type === "Pemasukan";
			return sum + (isIncome ? Number(tx.amount || 0) : 0);
		}, 0);

		const calculatedTotalExpense = sortedTx.reduce((sum, tx) => {
			const isIncome =
				tx.typeKey?.toUpperCase() === "INCOME" ||
				tx.type?.toUpperCase() === "INCOME" ||
				tx.type === "Pemasukan";
			return sum + (isIncome ? 0 : Number(tx.amount || 0));
		}, 0);

		const calculatedNetCash = calculatedTotalIncome - calculatedTotalExpense;

		for (let col = 1; col <= 7; col++) {
			const cell = totalRow.getCell(col);
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: `FF${PALETTE.sageLight}` },
			};
			cell.border = {
				top: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
				left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				bottom: { style: "double", color: { argb: `FF${PALETTE.sageDark}` } },
				right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			};
		}

		const totalLabelCell = totalRow.getCell(1);
		totalLabelCell.value = "TOTAL MUTASI KAS BULAN INI:";
		totalLabelCell.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: { argb: `FF${PALETTE.sageDark}` },
		};
		totalLabelCell.alignment = {
			vertical: "middle",
			horizontal: "right",
			indent: 1,
		};
		wsTx.mergeCells(`A${totalRowIdx}:E${totalRowIdx}`);

		const totalIncomeCell = totalRow.getCell(6);
		totalIncomeCell.value = {
			formula: `SUM(F${txStartRow}:F${txEndRow})`,
			result: calculatedTotalIncome,
		};
		totalIncomeCell.numFmt = IDR_FORMAT;
		totalIncomeCell.font = {
			name: "Arial",
			size: 10.5,
			bold: true,
			color: { argb: `FF${PALETTE.sageDark}` },
		};
		totalIncomeCell.alignment = { vertical: "middle", horizontal: "right" };

		const totalExpenseCell = totalRow.getCell(7);
		totalExpenseCell.value = {
			formula: `SUM(G${txStartRow}:G${txEndRow})`,
			result: calculatedTotalExpense,
		};
		totalExpenseCell.numFmt = IDR_FORMAT;
		totalExpenseCell.font = {
			name: "Arial",
			size: 10.5,
			bold: true,
			color: { argb: `FF${PALETTE.sageDark}` },
		};
		totalExpenseCell.alignment = { vertical: "middle", horizontal: "right" };

		// Net Cash Balance Row (lastRow + 2)
		const netRowIdx = totalRowIdx + 1;
		const netRow = wsTx.getRow(netRowIdx);
		netRow.height = 24;

		for (let col = 1; col <= 7; col++) {
			const cell = netRow.getCell(col);
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: `FF${PALETTE.sagePale}` },
			};
			cell.border = {
				top: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				left: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
				bottom: { style: "medium", color: { argb: `FF${PALETTE.sageDark}` } },
				right: { style: "thin", color: { argb: `FF${PALETTE.borderLight}` } },
			};
		}

		const netLabelCell = netRow.getCell(1);
		netLabelCell.value =
			"SURPLUS / LABA BERSIH KAS (Pemasukan - Pengeluaran):";
		netLabelCell.font = {
			name: "Arial",
			size: 10,
			bold: true,
			color: { argb: `FF${PALETTE.textDark}` },
		};
		netLabelCell.alignment = {
			vertical: "middle",
			horizontal: "right",
			indent: 1,
		};
		wsTx.mergeCells(`A${netRowIdx}:E${netRowIdx}`);

		const netValueCell = netRow.getCell(6);
		netValueCell.value = {
			formula: `F${totalRowIdx}-G${totalRowIdx}`,
			result: calculatedNetCash,
		};
		netValueCell.numFmt = IDR_FORMAT;
		netValueCell.font = {
			name: "Arial",
			size: 11,
			bold: true,
			color: {
				argb:
					calculatedNetCash >= 0
						? `FF${PALETTE.sageDark}`
						: `FF${PALETTE.redMuted}`,
			},
		};
		netValueCell.alignment = { vertical: "middle", horizontal: "right" };
		wsTx.mergeCells(`F${netRowIdx}:G${netRowIdx}`);
	}

	return workbook;
}

/**
 * Generate binary buffer (.xlsx) untuk Laporan Keuangan Bulanan
 */
export async function generateMonthlyFinancialExcelBuffer(
	data: MonthlyFinancialExcelData,
): Promise<Uint8Array> {
	const workbook = await createMonthlyFinancialExcelWorkbook(data);
	const buffer = await workbook.xlsx.writeBuffer();
	return new Uint8Array(buffer);
}

/**
 * Helper untuk men-trigger download langsung file Excel Laporan Keuangan Bulanan (.xlsx) di browser client
 */
export async function downloadMonthlyFinancialExcel(
	data: MonthlyFinancialExcelData,
	filename?: string,
): Promise<void> {
	const buffer = await generateMonthlyFinancialExcelBuffer(data);
	const blob = new Blob([buffer as BlobPart], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	const cleanPropName = data.propertyName
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	const cleanMonthName = data.monthName.toLowerCase();
	const targetFilename =
		filename ||
		`Laporan-Keuangan-Bulanan-${cleanPropName}-${cleanMonthName}-${data.year}.xlsx`;

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = targetFilename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}
