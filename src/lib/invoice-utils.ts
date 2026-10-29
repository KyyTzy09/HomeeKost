/**
 * Utilitas Penomoran Nota & Kuitansi Deterministik
 * Mengikuti format resmi revisi klien:
 * [Tanggal][Bulan][Tahun]-[3 Digit Nomor Kamar]-[Kode Kos]
 * Contoh: Kamar 5 pada 22 Oktober 2026 di Kos 1 -> 22102026-005-1
 */

/**
 * Format tanggal menjadi format 8-digit DDMMYYYY
 */
export function formatDatePart(date: Date): string {
	const d = new Date(date);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = String(d.getFullYear());
	return `${day}${month}${year}`;
}

/**
 * Memformat nomor kamar menjadi minimal 3 digit deterministik
 * Contoh: "5" -> "005", "13" -> "013", "101" -> "101", "Kamar 5" -> "005"
 */
export function formatRoomCodeForInvoice(roomNumber: string): string {
	if (!roomNumber) return "000";
	const clean = roomNumber.replace(/^(kamar|room)\s*/i, "").trim();
	if (/^\d+$/.test(clean)) {
		return clean.padStart(3, "0");
	}
	// Untuk format alfanumerik seperti "A2" -> "0A2", "M-101" -> "101"
	const digitsOnly = clean.replace(/\D/g, "");
	if (digitsOnly.length > 0) {
		return digitsOnly.padStart(3, "0");
	}
	return clean.padStart(3, "0").slice(-3);
}

/**
 * Ekstraksi kode kos dari nama properti atau mapping cabang
 * Contoh: "Kos 1" -> "1", "HomeeKost Cabang 2" -> "2", "HomeeKost" -> "1"
 */
export function getPropertyCode(
	propertyOrName?: { id?: string; name?: string } | string | null,
): string {
	if (!propertyOrName) return "1";
	const name =
		typeof propertyOrName === "string"
			? propertyOrName
			: propertyOrName.name || "";

	// 1. Ekstraksi angka jika tertera eksplisit di nama kos (misal: "Kos 1", "Melati 2")
	const numMatch = name.match(/\d+/);
	if (numMatch) {
		return numMatch[0];
	}

	// 2. Mapping deterministik cabang utama yang terdaftar di database:
	// 1 = Bahari, 2 = Homeekost, 3 = Hunian
	const lower = name.toLowerCase();
	if (lower.includes("bahari")) return "1";
	if (lower.includes("homee")) return "2";
	if (lower.includes("hunian")) return "3";

	return "1";
}

export interface DeterministicInvoiceParams {
	date: Date;
	roomNumber: string;
	property?: { id?: string; name?: string } | string | null;
	sequence?: number;
}

/**
 * Buat nomor nota / invoice deterministik sesuai pola [Tanggal][Bulan][Tahun]-[3 Digit Nomor Kamar]-[Kode Kos]
 */
export function formatDeterministicInvoiceNumber(
	params: DeterministicInvoiceParams,
): string {
	const datePart = formatDatePart(params.date);
	const roomPart = formatRoomCodeForInvoice(params.roomNumber);
	const propCode = getPropertyCode(params.property);
	const base = `${datePart}-${roomPart}-${propCode}`;

	if (params.sequence && params.sequence > 1) {
		return `${base}-${params.sequence}`;
	}
	return base;
}
