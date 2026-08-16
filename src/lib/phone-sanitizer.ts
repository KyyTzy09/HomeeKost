/**
 * Utility untuk sanitasi dan normalisasi nomor WhatsApp / Telepon Indonesia.
 * Menjamin format internasional '628xxxxxxxxxx' tanpa tanda plus, spasi, atau karakter non-numerik.
 */

export function sanitizePhoneNumber(phone: string | null | undefined): string {
	if (!phone) return "";

	// Hapus semua karakter non-digit kecuali tanda plus di awal jika ada
	let cleaned = phone.trim().replace(/[^0-9+]/g, "");

	// Hapus tanda plus jika ada di awal
	if (cleaned.startsWith("+")) {
		cleaned = cleaned.slice(1);
	}

	// Jika diawali '08', ganti menjadi '628'
	if (cleaned.startsWith("08")) {
		cleaned = `628${cleaned.slice(2)}`;
	} else if (cleaned.startsWith("8")) {
		// Jika langsung '8xxx', tambahkan '62'
		cleaned = `62${cleaned}`;
	}

	return cleaned;
}

/**
 * Validasi apakah nomor telepon valid format Indonesia (minimal 10 digit, diawali 628)
 */
export function isValidIndonesianPhone(
	phone: string | null | undefined,
): boolean {
	const sanitized = sanitizePhoneNumber(phone);
	return /^628[1-9][0-9]{7,11}$/.test(sanitized);
}

/**
 * Menghasilkan URL direct link WhatsApp Web / App (wa.me) sebagai fallback
 */
export function getWhatsAppDirectUrl(phone: string, message: string): string {
	const sanitized = sanitizePhoneNumber(phone);
	const encodedMsg = encodeURIComponent(message);
	return `https://wa.me/${sanitized}?text=${encodedMsg}`;
}
