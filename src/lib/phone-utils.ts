/**
 * Mengonversi nomor WhatsApp ke format canonical internasional (e.g. 6281234567890)
 * untuk penyimpanan database dan pengiriman WhatsApp gateway.
 */
export function sanitizePhone(phone: string): string {
	if (!phone) return "";
	let cleaned = phone.replace(/[^0-9]/g, "");
	if (cleaned.startsWith("0")) {
		cleaned = `62${cleaned.slice(1)}`;
	} else if (cleaned.startsWith("8")) {
		cleaned = `62${cleaned}`;
	}
	return cleaned;
}

/**
 * Memformat nomor telepon menjadi format lokal yang mudah dibaca pada UI
 * Contoh: 6281234567890 -> 0812 3456 7890
 */
export function formatDisplayPhone(phone: string): string {
	if (!phone) return "—";
	let digits = phone.replace(/[^0-9]/g, "");
	if (digits.startsWith("62")) {
		digits = `0${digits.slice(2)}`;
	} else if (digits.startsWith("8")) {
		digits = `0${digits}`;
	}

	// Format menjadi 08XX XXXX XXXX
	if (digits.length <= 4) return digits;
	if (digits.length <= 8) {
		return `${digits.slice(0, 4)} ${digits.slice(4)}`;
	}
	if (digits.length <= 12) {
		return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
	}
	return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
}
