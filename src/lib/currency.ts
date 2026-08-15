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
