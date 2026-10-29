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


const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Mendapatkan batas awal hari (00:00:00.000) dalam zona waktu Indonesia (WIB UTC+7)
 */
export function getWibStartOfDay(dateInput?: Date | string): Date {
	const base = dateInput ? new Date(dateInput) : new Date();
	const wibTime = new Date(base.getTime() + WIB_OFFSET_MS);
	const y = wibTime.getUTCFullYear();
	const m = wibTime.getUTCMonth();
	const d = wibTime.getUTCDate();
	return new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - WIB_OFFSET_MS);
}

export interface EvaluateRentalStatusInput {
	totalAmount: number;
	paidAmount: number;
	dueDate: Date | string;
	databaseStatus?: string; // "PAID" | "PENDING" | "OVERDUE" | "CANCELLED"
	currentDate?: Date | string; // Opsional untuk pengujian
}

export type StandardRentalStatus = "Lunas" | "Belum Lunas" | "Terlambat";

export interface EvaluatedRentalStatus {
	status: StandardRentalStatus;
	statusKey: "PAID" | "UNPAID" | "OVERDUE";
	isSettled: boolean;
	isInstallment: boolean;
	paidAmount: number;
	remainingAmount: number;
	badgeText: string;
	badgeVariant: "green" | "amber" | "red";
	badgeClass: string;
}

/**
 * Evaluator terpusat untuk menentukan status pembayaran sewa secara deterministik
 * Mengeliminasi tumpang tindih antara Belum Lunas dan Terlambat
 */
export function evaluateRentalPaymentStatus(
	input: EvaluateRentalStatusInput,
): EvaluatedRentalStatus {
	const total = Math.max(0, Number(input.totalAmount) || 0);
	const paid = Math.max(0, Number(input.paidAmount) || 0);
	const remaining = Math.max(0, total - paid);
	const isSettled =
		(total > 0 && paid >= total) || input.databaseStatus === "PAID";
	const isInstallment = !isSettled && paid > 0 && remaining > 0;

	if (isSettled) {
		return {
			status: "Lunas",
			statusKey: "PAID",
			isSettled: true,
			isInstallment: false,
			paidAmount: total > 0 ? total : paid,
			remainingAmount: 0,
			badgeText: "Lunas",
			badgeVariant: "green",
			badgeClass: "bg-[#e8f0ea] text-[#4f6958] border-[#c8dacb]",
		};
	}

	const todayWib = getWibStartOfDay(input.currentDate);
	const dueWib = getWibStartOfDay(input.dueDate);
	const isOverdue =
		dueWib.getTime() < todayWib.getTime() ||
		input.databaseStatus === "OVERDUE";

	if (isOverdue) {
		return {
			status: "Terlambat",
			statusKey: "OVERDUE",
			isSettled: false,
			isInstallment,
			paidAmount: paid,
			remainingAmount: remaining,
			badgeText: isInstallment ? "Cicilan" : "Terlambat",
			badgeVariant: "red",
			badgeClass: "bg-[#fdf0ed] text-[#b8382e] border-[#f5c6c2]",
		};
	}

	return {
		status: "Belum Lunas",
		statusKey: "UNPAID",
		isSettled: false,
		isInstallment,
		paidAmount: paid,
		remainingAmount: remaining,
		badgeText: isInstallment ? "Cicilan" : "Belum Lunas",
		badgeVariant: "amber",
		badgeClass: "bg-[#fbf4ea] text-[#99773d] border-[#ebd8bc]",
	};
}
