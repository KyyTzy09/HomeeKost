/**
 * Natural numerical comparator for room numbers.
 * Correctly sorts room numbers naturally:
 * e.g. "1", "2", "3" ... "9", "10", "11", "12", "A1", "A2", "A10", "1A", "1B", etc.
 * Avoids lexicographical sorting issues where "10" comes before "2".
 */
export function compareRoomNumbers(a: string, b: string): number {
	return a.localeCompare(b, undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

/**
 * Membersihkan awalan "Kamar" atau "Room" dari string nomor kamar agar menjadi nomor murni.
 * Contoh:
 * - "Kamar 101" -> "101"
 * - "kamar 101" -> "101"
 * - "Room A-01" -> "A-01"
 * - "101" -> "101"
 */
export function cleanRoomNumber(roomNumber?: string | null): string {
	if (!roomNumber) return "";
	return roomNumber.replace(/^(kamar|room)\s*/i, "").trim();
}

/**
 * Memformat nomor kamar dengan awalan "Kamar " yang rapi dan terstandarisasi.
 * Menghindari duplikasi teks seperti "Kamar Kamar 101".
 * Contoh:
 * - formatRoomTitle("101") -> "Kamar 101"
 * - formatRoomTitle("Kamar 101") -> "Kamar 101"
 * - formatRoomTitle("Room 101") -> "Kamar 101"
 * - formatRoomTitle("") -> "Kamar —"
 */
export function formatRoomTitle(roomNumber?: string | null): string {
	if (!roomNumber || roomNumber.trim() === "" || roomNumber.trim() === "—") {
		return "Kamar —";
	}
	const cleaned = cleanRoomNumber(roomNumber);
	return cleaned ? `Kamar ${cleaned}` : "Kamar —";
}

