/**
 * Utilitas Kalkulasi Cicilan & Pembayaran Bertahap (Payment Utils)
 */

export interface InstallmentSummary {
	paidAmount: number;
	remainingAmount: number;
	isPartial: boolean;
	installmentCount: number;
}

/**
 * Menghitung ringkasan cicilan sewa dari total tagihan dan daftar transaksi kas yang terhubung
 */
export function calculateInstallmentSummary(
	totalAmount: number,
	transactions?: Array<{ amount: number | string | { toNumber?: () => number } }>,
): InstallmentSummary {
	const total = Math.max(0, Number(totalAmount) || 0);
	if (!transactions || transactions.length === 0) {
		return {
			paidAmount: 0,
			remainingAmount: total,
			isPartial: false,
			installmentCount: 0,
		};
	}

	const paidAmount = transactions.reduce((acc, tx) => {
		let val = 0;
		if (typeof tx.amount === "number") {
			val = tx.amount;
		} else if (
			typeof tx.amount === "object" &&
			tx.amount &&
			typeof (tx.amount as { toNumber?: () => number }).toNumber === "function"
		) {
			val = (tx.amount as { toNumber: () => number }).toNumber();
		} else {
			val = Number(tx.amount) || 0;
		}
		return acc + val;
	}, 0);

	const remainingAmount = Math.max(0, total - paidAmount);
	const isPartial = paidAmount > 0 && remainingAmount > 0;
	const installmentCount = transactions.length;

	return {
		paidAmount,
		remainingAmount,
		isPartial,
		installmentCount,
	};
}

/**
 * Mendapatkan format tanggal akhir bulan untuk pengingat batas pelunasan (misal: "31 Oktober 2026")
 */
export function getEndOfMonthString(year?: number, month?: number): string {
	const now = new Date();
	const targetYear = year || now.getFullYear();
	const targetMonth = month || now.getMonth() + 1; // 1-indexed

	const lastDay = new Date(targetYear, targetMonth, 0).getDate();
	const months = [
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
	const monthName = months[targetMonth - 1] || "Bulan ini";
	return `${lastDay} ${monthName} ${targetYear}`;
}
