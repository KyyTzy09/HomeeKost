/**
 * Memformat angka numerik ke representasi mata uang Rupiah
 * Contoh: 850000 -> "Rp850.000"
 */
export function formatRupiah(amount: number): string {
	if (Number.isNaN(amount) || amount === null || amount === undefined) {
		return "Rp0";
	}
	return `Rp${Math.round(amount)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/**
 * Mem-parse string representasi Rupiah menjadi nilai numerik
 * Contoh: "Rp850.000" -> 850000
 */
export function parseRupiah(str: string): number {
	if (!str) return 0;
	const digits = str.replace(/[^0-9]/g, "");
	return digits ? Number.parseInt(digits, 10) : 0;
}

/**
 * Memformat angka numerik ke representasi ringkas Indonesia
 * Contoh: 100000 -> "100 rb", 1000000 -> "1 jt", 6250000 -> "6,25 jt", 0 -> "-"
 */
export function formatCompactRupiah(amount: number): string {
	if (
		amount === 0 ||
		Number.isNaN(amount) ||
		amount === null ||
		amount === undefined
	) {
		return "-";
	}

	const isNegative = amount < 0;
	const abs = Math.abs(amount);
	const prefix = isNegative ? "-" : "";

	const formatDecimal = (val: number): string => {
		if (Number.isInteger(val)) {
			return val.toString();
		}
		// Format desimal maksimal 2 digit, hilangkan trailing zero, ganti titik ke koma
		return val
			.toFixed(2)
			.replace(/\.?0+$/, "")
			.replace(".", ",");
	};

	if (abs >= 1_000_000_000) {
		return `${prefix}${formatDecimal(abs / 1_000_000_000)} M`;
	}

	if (abs >= 1_000_000) {
		return `${prefix}${formatDecimal(abs / 1_000_000)} jt`;
	}

	if (abs >= 1_000) {
		return `${prefix}${formatDecimal(abs / 1_000)} rb`;
	}

	return `${prefix}${abs.toString()}`;
}

