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

	// 5. Susun Tepat 3 Rekomendasi Taktis
	const recommendations: AiFinancialInsightData["strategicRecommendations"] = [
		{
			code: "01",
			title: topExpense
				? `Evaluasi & Efisiensi Biaya ${topExpense.category}`
				: "Jaga Efisiensi Beban Operasional Rutin",
			description: topExpense
				? `Pos ${topExpense.category} menyumbang ${topExpense.percentageOfTotalExpense.toFixed(1)}% dari total pengeluaran (${formatRupiah(topExpense.amount)}). Lakukan pemeriksaan rutin dan audit pemakaian fasilitas untuk menjaga margin laba.`
				: "Pertahankan kontrol pengeluaran operasional harian agar margin keuntungan tetap terjaga di atas target.",
			priority:
				topExpense && topExpense.percentageOfTotalExpense > 35
					? "HIGH"
					: "MEDIUM",
		},
		{
			code: "02",
			title:
				occupancy.vacantRooms > 0
					? `Optimalisasi Promosi ${occupancy.vacantRooms} Kamar Kosong`
					: "Pertahankan Kepuasan & Retensi Penghuni",
			description:
				occupancy.vacantRooms > 0
					? `Tingkatkan eksposur promosi atau program diskon awal sewa untuk mengisi ${occupancy.vacantRooms} kamar yang masih kosong guna mendongkrak omzet.`
					: "Tingkat hunian sudah 100%. Fokuskan perhatian pada kebersihan dan kenyamanan fasilitas bersama untuk memperpanjang durasi tinggal penghuni.",
			priority: occupancy.vacantRooms > 0 ? "HIGH" : "LOW",
		},
		{
			code: "03",
			title:
				collection.overdueInvoices > 0
					? "Perketat Jadwal Pengingat WhatsApp Jatuh Tempo"
					: "Jadwalkan Maintenance Preventif Berkala",
			description:
				collection.overdueInvoices > 0
					? `Terdapat ${collection.overdueInvoices} tagihan yang belum lunas. Optimalkan fitur WhatsApp Reminder otomatis (H-3 dan Hari H) untuk mempercepat perputaran kas.`
					: "Lakukan inspeksi rutin fasilitas air, kelistrikan, dan AC untuk mencegah lonjakan biaya perbaikan mendadak di masa mendatang.",
			priority: collection.overdueInvoices > 0 ? "HIGH" : "MEDIUM",
		},
	];

	return {
		executiveSummary,
		financialHealthGrade: grade,
		trendAnalysis: {
			incomeTrend,
			expenseTrend,
			occupancyImpact,
		},
		complaintCostImpact,
		strategicRecommendations: recommendations,
	};
}
