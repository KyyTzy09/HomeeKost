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

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Mendapatkan representasi tanggal hari ini dalam format YYYY-MM-DD sesuai waktu lokal Indonesia (WIB UTC+7)
 */
export function getTodayDateString(): string {
	const now = new Date();
	const wibDate = new Date(now.getTime() + WIB_OFFSET_MS);
	return wibDate.toISOString().split("T")[0];
}

/**
 * Menghitung batas awal dan akhir bulan dalam zona waktu Indonesia (WIB UTC+7)
 * Menghasilkan objek Date yang valid untuk query PostgreSQL Prisma
 */
export function getMonthDateRange(
	month: number,
	year: number,
): { startDate: Date; endDate: Date } {
	// Bulan 1-12
	// Batas awal: tanggal 1 pukul 00:00:00.000 WIB
	const startUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - WIB_OFFSET_MS;
	// Batas akhir: tanggal terakhir pukul 23:59:59.999 WIB
	const endUtcMs = Date.UTC(year, month, 0, 23, 59, 59, 999) - WIB_OFFSET_MS;

	return {
		startDate: new Date(startUtcMs),
		endDate: new Date(endUtcMs),
	};
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
 * Memformat rentang periode sewa berbatas awal dan akhir lengkap dengan tanggal, bulan, dan tahun (contoh: 21 September 2026 – 21 September 2027)
 */
export function formatRentalPeriod(params: {
	periodMonth?: number | null;
	periodYear?: number | null;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
	billingCycle?: string | null;
	dueDate?: Date | string | null;
}): string {
	const { periodMonth, periodYear, startDate, endDate, billingCycle, dueDate } =
		params;

	let durationMonths = 1;
	if (billingCycle === "QUARTERLY" || billingCycle === "Triwulan") {
		durationMonths = 3;
	} else if (
		billingCycle === "SEMI_ANNUAL" ||
		billingCycle === "SEMIANNUAL" ||
		billingCycle === "Semesteran"
	) {
		durationMonths = 6;
	} else if (
		billingCycle === "ANNUALLY" ||
		billingCycle === "YEARLY" ||
		billingCycle === "Tahunan"
	) {
		durationMonths = 12;
	}

	const clampDate = (year: number, monthIndex: number, d: number): Date => {
		const daysInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
		const safeDay = Math.min(d, daysInTargetMonth);
		return new Date(year, monthIndex, safeDay);
	};

	// Ekstrak hari (day) dari startDate atau dueDate
	let day = 1;
	if (startDate) {
		const s = typeof startDate === "string" ? new Date(startDate) : startDate;
		if (!Number.isNaN(s.getTime())) {
			day = s.getDate();
		}
	} else if (dueDate) {
		const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
		if (!Number.isNaN(d.getTime())) {
			day = d.getDate();
		}
	}

	// 1. Jika berbasis periodMonth dan periodYear (khusus siklus individual invoice)
	if (periodMonth && periodYear) {
		const startM = periodMonth;
		const startY = periodYear;

		let invoiceStart: Date;
		let invoiceEnd: Date;

		if (day === 1) {
			invoiceStart = new Date(startY, startM - 1, 1);
			invoiceEnd = new Date(startY, startM - 1 + durationMonths, 0);
		} else {
			invoiceStart = clampDate(startY, startM - 1, day);
			invoiceEnd = clampDate(startY, startM - 1 + durationMonths, day);
		}

		// Jika ada endDate kontrak eksplisit dan durasinya mencakup sampai akhir kontrak
		if (endDate && durationMonths >= 12) {
			const e = typeof endDate === "string" ? new Date(endDate) : endDate;
			if (!Number.isNaN(e.getTime())) {
				invoiceEnd = e;
			}
		}

		return `${formatDate(invoiceStart)} – ${formatDate(invoiceEnd)}`;
	}

	// 2. Fallback jika hanya ada startDate dan endDate kontrak
	if (startDate && endDate) {
		const s = typeof startDate === "string" ? new Date(startDate) : startDate;
		const e = typeof endDate === "string" ? new Date(endDate) : endDate;

		if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
			return `${formatDate(s)} – ${formatDate(e)}`;
		}
	}

	if (startDate) {
		return formatDate(startDate);
	}

	return "Periode Sewa";
}

/**
 * Melakukan parsing string tanggal format Indonesia (contoh: "01 Okt 2026", "10 November 2026", "—")
 * menjadi timestamp numerik (milidetik) untuk kebutuhan sorting.
 */
export function parseIndonesianDate(str?: string | null): number {
	if (!str || str === "—") return 0;
	const parts = str.trim().split(/\s+/);
	if (parts.length === 3) {
		const day = Number.parseInt(parts[0], 10) || 1;
		const monthStr = parts[1].toLowerCase();
		const year = Number.parseInt(parts[2], 10) || 2026;
		const monthMap: Record<string, number> = {
			jan: 0,
			januari: 0,
			feb: 1,
			februari: 1,
			mar: 2,
			maret: 2,
			apr: 3,
			april: 3,
			mei: 4,
			jun: 5,
			juni: 5,
			jul: 6,
			juli: 6,
			agu: 7,
			agustus: 7,
			sep: 8,
			september: 8,
			okt: 9,
			oktober: 9,
			nov: 10,
			november: 10,
			des: 11,
			desember: 11,
		};
		const month = monthMap[monthStr] ?? 0;
		return new Date(year, month, day).getTime();
	}
	const parsed = Date.parse(str);
	return Number.isNaN(parsed) ? 0 : parsed;
}
