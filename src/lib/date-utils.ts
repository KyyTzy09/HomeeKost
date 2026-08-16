import type { RentDuration } from "../common/types/index.ts";

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

/**
 * Mendapatkan representasi tanggal hari ini dalam format YYYY-MM-DD
 */
export function getTodayDateString(): string {
	return new Date().toISOString().split("T")[0];
}

/**
 * Mengonversi durasi sewa ke jumlah bulan
 */
export function getDurationMonths(duration: RentDuration): number {
	switch (duration) {
		case "Bulanan":
			return 1;
		case "Triwulan":
			return 3;
		case "Semesteran":
			return 6;
		case "Tahunan":
			return 12;
		default:
			return 1;
	}
}

/**
 * Menghitung tanggal jatuh tempo otomatis dari tanggal mulai sewa + durasi bulan
 * Format output: YYYY-MM-DD
 */
export function calculateDueDate(
	startDateStr: string,
	duration: RentDuration,
): string {
	if (!startDateStr) return "";
	const date = new Date(startDateStr);
	if (Number.isNaN(date.getTime())) return "";

	const monthsToAdd = getDurationMonths(duration);
	date.setMonth(date.getMonth() + monthsToAdd);

	return date.toISOString().split("T")[0];
}

/**
 * Memformat string atau Date menjadi format tanggal lengkap lokal Indonesia (contoh: 17 Agustus 2026)
 */
export function formatDate(value?: string | Date | null): string {
	if (!value) return "—";
	const d =
		typeof value === "string"
			? new Date(value.includes("T") ? value : `${value}T00:00:00`)
			: value;
	if (Number.isNaN(d.getTime())) return String(value);

	const day = String(d.getDate()).padStart(2, "0");
	const month = MONTH_NAMES[d.getMonth()];
	const year = d.getFullYear();

	return `${day} ${month} ${year}`;
}

/**
 * Memformat tanggal jatuh tempo menjadi format lengkap (contoh: 17 Agustus 2026)
 */
export function formatShortDueDate(value?: string | Date | null): string {
	return formatDate(value);
}

/**
 * Mendapatkan nama bulan lengkap dari indeks bulan (1 - 12)
 */
export function getMonthName(month: number): string {
	if (month >= 1 && month <= 12) {
		return MONTH_NAMES[month - 1];
	}
	return "Bulan tidak valid";
}

/**
 * Memformat rentang periode sewa berbatas awal dan akhir (contoh: Agustus 2026 – Desember 2026 atau Agustus 2026 – September 2026)
 */
export function formatRentalPeriod(params: {
	periodMonth?: number | null;
	periodYear?: number | null;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
	billingCycle?: string | null;
}): string {
	const { periodMonth, periodYear, startDate, endDate, billingCycle } = params;

	// Jika ada startDate dan endDate kontrak
	if (startDate && endDate) {
		const s = typeof startDate === "string" ? new Date(startDate) : startDate;
		const e = typeof endDate === "string" ? new Date(endDate) : endDate;

		if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
			const startMonth = MONTH_NAMES[s.getMonth()];
			const startYear = s.getFullYear();
			const endMonth = MONTH_NAMES[e.getMonth()];
			const endYear = e.getFullYear();

			if (startYear === endYear) {
				if (startMonth === endMonth) {
					return `${startMonth} ${startYear}`;
				}
				return `${startMonth} – ${endMonth} ${startYear}`;
			}
			return `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
		}
	}

	// Jika berbasis periodMonth dan periodYear
	const startM = periodMonth || new Date().getMonth() + 1;
	const startY = periodYear || new Date().getFullYear();
	const startMonthName = MONTH_NAMES[startM - 1] || "Agustus";

	let durationMonths = 1;
	if (billingCycle === "QUARTERLY" || billingCycle === "Triwulan") {
		durationMonths = 3;
	} else if (billingCycle === "SEMIANNUAL" || billingCycle === "Semesteran") {
		durationMonths = 6;
	} else if (billingCycle === "YEARLY" || billingCycle === "Tahunan") {
		durationMonths = 12;
	}

	if (durationMonths === 1) {
		// Satu bulan sewa: Tampilkan batas awal hingga akhir bulan / bulan berikutnya
		const nextDate = new Date(startY, startM, 1);
		const endMonthName = MONTH_NAMES[nextDate.getMonth()];
		const endYear = nextDate.getFullYear();
		if (startY === endYear) {
			return `${startMonthName} – ${endMonthName} ${startY}`;
		}
		return `${startMonthName} ${startY} – ${endMonthName} ${endYear}`;
	}

	const endD = new Date(startY, startM - 1 + durationMonths, 0);
	const endMonthName = MONTH_NAMES[endD.getMonth()];
	const endYear = endD.getFullYear();

	if (startY === endYear) {
		return `${startMonthName} – ${endMonthName} ${startY}`;
	}
	return `${startMonthName} ${startY} – ${endMonthName} ${endYear}`;
}
