/**
 * Membandingkan dua string menggunakan Natural Alphanumeric Sort (Human Order).
 * Menghindari masalah pengurutan ASCII biasa di mana "10" muncul sebelum "2",
 * atau "A-10" muncul sebelum "A-2".
 *
 * Contoh hasil:
 * - "01" < "02" < "03" < "10"
 * - "A" < "B" < "C"
 * - "A-01" < "A-2" < "A-10" < "B-1"
 * - "Kamar 1" < "Kamar 2" < "Kamar 10"
 *
 * @param a Nilai string pertama
 * @param b Nilai string kedua
 * @returns -1 jika a < b, 1 jika a > b, 0 jika sama
 */
export function naturalCompare(
	a?: string | null,
	b?: string | null,
): number {
	const valA = a?.trim() || "";
	const valB = b?.trim() || "";

	if (!valA && !valB) return 0;
	if (!valA) return -1;
	if (!valB) return 1;

	return valA.localeCompare(valB, "id-ID", {
		numeric: true,
		sensitivity: "base",
	});
}
