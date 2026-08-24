import { formatRupiah } from "../../lib/currency.ts";
import type {
	AiFinancialInsightData,
	FinancialContextPayload,
} from "../types.ts";

/**
 * Deterministic Rule-Based Fallback Engine
 * Menjamin sistem selalu menghasilkan narasi wawasan eksekutif 100% tanpa risiko downtime API.
 */
export function generateDeterministicFinancialInsight(
	payload: FinancialContextPayload,
): AiFinancialInsightData {
	const { period, property, metrics, occupancy, collection, topExpenses } =
		payload;

	// 1. Tentukan Financial Health Grade
	let grade: AiFinancialInsightData["financialHealthGrade"] = "SEHAT";

	if (
		metrics.profitMarginPercentage >= 60 &&
		occupancy.occupancyRatePercentage >= 85 &&
		collection.collectionRatePercentage >= 90
	) {
		grade = "PRIMA";
	} else if (
		metrics.profitMarginPercentage >= 40 &&
		occupancy.occupancyRatePercentage >= 70
	) {
		grade = "SEHAT";
	} else if (
		metrics.profitMarginPercentage < 15 ||
		collection.collectionRatePercentage < 50
	) {
		grade = "KRITIS";
	} else {
		grade = "WASPADA";
	}

	// 2. Format Deskripsi Beban Terbesar
	const topExpense = topExpenses[0];
	const topExpenseText = topExpense
		? `Beban pengeluaran terbesar dialokasikan untuk ${topExpense.category} sebesar ${formatRupiah(topExpense.amount)} (${topExpense.percentageOfTotalExpense.toFixed(1)}% dari total beban).`
		: "Pengeluaran operasional bulan ini tercatat efisien dan terkendali.";

	// 3. Susun Executive Summary (2-3 kalimat padat)
	const periodStatus = period.isClosedPeriod ? "(Tutup Buku)" : "(Berjalan)";
	const executiveSummary = `Pada periode ${period.monthName} ${period.year} ${periodStatus}, ${property.name} mencatatkan total pendapatan ${formatRupiah(metrics.totalIncome)} dengan laba bersih mencapai ${formatRupiah(metrics.netProfit)} (margin laba ${metrics.profitMarginPercentage.toFixed(1)}%). ${topExpenseText} Tingkat okupansi kamar mencapai ${occupancy.occupancyRatePercentage.toFixed(1)}% dengan tingkat ketepatan penagihan sewa ${collection.collectionRatePercentage.toFixed(1)}%.`;

	// 4. Susun Analisis Tren
	const incomeTrend =
		collection.pendingInvoices > 0 || collection.overdueInvoices > 0
			? `Realisasi pendapatan ${formatRupiah(metrics.totalIncome)} dengan sisa tagihan berjalan/tertunggak sebesar ${formatRupiah(collection.totalOutstandingAmount)} (${collection.overdueInvoices} tagihan overdue). Penagihan proaktif disarankan.`
			: `Realisasi pendapatan sewa optimal sebesar ${formatRupiah(metrics.totalIncome)} dengan kelancaran pembayaran 100% lunas tepat waktu.`;

	const expenseTrend =
		metrics.investmentExpense > 0
			? `Total pengeluaran sebesar ${formatRupiah(metrics.totalExpense)} terdiri dari beban operasional rutin ${formatRupiah(metrics.operationalExpense)} dan investasi aset/renovasi ${formatRupiah(metrics.investmentExpense)}.`
			: `Total pengeluaran operasional rutin tercatat ${formatRupiah(metrics.totalExpense)} yang didominasi oleh pos ${topExpense?.category || "operasional umum"}.`;

	const occupancyImpact =
		occupancy.vacantRooms > 0
			? `Terdapat ${occupancy.vacantRooms} kamar kosong (${occupancy.occupancyRatePercentage.toFixed(1)}% terisi). Pengisian unit kosong berpotensi menambah estimasi pendapatan bulanan.`
			: `Okupansi unit mencapai kapasitas maksimal 100% (${occupancy.occupiedRooms} dari ${occupancy.totalRooms} kamar terisi), memaksimalkan perolehan pendapatan sewa.`;

	const complaintCostImpact =
		payload.complaintExpenses.totalCost > 0
			? `Biaya penanganan komplain dan perbaikan fasilitas menyerap dana sebesar ${formatRupiah(payload.complaintExpenses.totalCost)} (${payload.complaintExpenses.percentageOfExpense.toFixed(1)}% dari total pengeluaran).`
			: "Tidak tercatat pengeluaran biaya perbaikan kerusakan fasilitas yang signifikan pada periode ini.";

	// 5. Susun Sorotan Fakta Kunci (Key Highlights Faktual)
	const keyHighlights: string[] = [
		topExpense
			? `Beban pengeluaran utama pada pos ${topExpense.category} dengan total ${formatRupiah(topExpense.amount)} (${topExpense.percentageOfTotalExpense.toFixed(1)}% dari total pengeluaran).`
			: "Pengeluaran operasional bulan ini tercatat efisien dan terkendali.",
		occupancy.vacantRooms > 0
			? `Tingkat okupansi unit ${occupancy.occupancyRatePercentage.toFixed(1)}% (${occupancy.occupiedRooms} terisi, ${occupancy.vacantRooms} kamar kosong).`
			: `Okupansi unit mencapai kapasitas penuh 100% (${occupancy.occupiedRooms} kamar terisi).`,
		collection.overdueInvoices > 0
			? `Terdapat ${collection.overdueInvoices} tagihan overdue belum lunas dengan sisa piutang ${formatRupiah(collection.totalOutstandingAmount)}.`
			: `Ketepatan penagihan sewa tercatat 100% lunas tepat waktu (${collection.paidInvoices} invoice lunas).`,
	];

	return {
		executiveSummary,
		financialHealthGrade: grade,
		keyHighlights,
		trendAnalysis: {
			incomeTrend,
			expenseTrend,
			occupancyImpact,
		},
		complaintCostImpact,
		strategicRecommendations: [],
	};
}
