import ExcelJS from "exceljs";
import type { AnnualFinancialMatrixResult } from "../data/repositories/report.repository.ts";

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
