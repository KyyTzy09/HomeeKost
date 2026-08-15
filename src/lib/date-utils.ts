import type { RentDuration } from "../common/types/index.ts";

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
 * Memformat string YYYY-MM-DD menjadi format ringkas (contoh: 15 Agu)
 */
export function formatShortDueDate(dateStr: string): string {
	if (!dateStr) return "—";
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return dateStr;

	const months = [
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
	];
	const day = String(date.getDate()).padStart(2, "0");
	const month = months[date.getMonth()];
	return `${day} ${month}`;
}

/**
 * Memformat string YYYY-MM-DD menjadi format lengkap lokal ID (contoh: 07 Agu 2026)
 */
export function formatDate(value?: string | Date | null): string {
	if (!value) return "—";
	const d =
		typeof value === "string"
			? new Date(value.includes("T") ? value : `${value}T00:00:00`)
			: value;
	if (Number.isNaN(d.getTime())) return String(value);
	return d.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}
