/**
 * Helper untuk normalisasi username atau email login HomeeKost.
 * Memetakan alias username (misal "owner" atau "admin") ke alamat email terdaftar resmi.
 */
export function resolveLoginIdentifier(identifier: string): string {
	const trimmed = identifier.trim().toLowerCase();

	if (!trimmed.includes("@")) {
		if (trimmed === "owner") {
			return "owner@homeekost.com";
		}
		if (trimmed === "admin" || trimmed === "admin.melati") {
			return "admin.melati@homeekost.com";
		}
		return `${trimmed}@homeekost.com`;
	}

	return trimmed;
}
