/**
 * Utility functions for safely formatting and synchronizing
 * financial transaction descriptions across room transfers and tenant profile edits.
 */

/**
 * Escapes regex special characters in a string.
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Synchronizes the tenant name in a transaction description if it contains the old name.
 * Performs a case-insensitive replacement to support casing updates (e.g. lowercase to UPPERCASE).
 */
export function updateDescriptionTenantName(
	description: string | null | undefined,
	oldName: string,
	newName: string,
): string {
	if (!description || !oldName?.trim() || !newName?.trim()) {
		return description || "";
	}

	const trimmedOld = oldName.trim();
	const trimmedNew = newName.trim();

	// 1. Direct case-insensitive match
	const regex = new RegExp(escapeRegex(trimmedOld), "gi");
	if (regex.test(description)) {
		return description.replace(regex, trimmedNew);
	}

	// 2. Fallback: if description has standard format "... - [name]" and matches suffix
	const dashIndex = description.lastIndexOf(" - ");
	if (dashIndex !== -1) {
		const prefix = description.slice(0, dashIndex + 3);
		const suffix = description.slice(dashIndex + 3).trim();
		if (
			suffix.toLowerCase() === trimmedOld.toLowerCase() ||
			suffix.toLowerCase().includes(trimmedOld.toLowerCase())
		) {
			return `${prefix}${trimmedNew}`;
		}
	}

	return description;
}

/**
 * Synchronizes the room number in a transaction description (e.g. "Kamar A-1" -> "Kamar B-2").
 */
export function updateDescriptionRoom(
	description: string | null | undefined,
	oldRoomNumber: string,
	newRoomNumber: string,
): string {
	if (!description || !oldRoomNumber?.trim() || !newRoomNumber?.trim()) {
		return description || "";
	}

	const trimmedOld = oldRoomNumber.trim();
	const trimmedNew = newRoomNumber.trim();

	// Replace "Kamar [oldRoomNumber]" with "Kamar [newRoomNumber]"
	const roomRegex = new RegExp(`Kamar\\s+${escapeRegex(trimmedOld)}\\b`, "gi");
	if (roomRegex.test(description)) {
		return description.replace(roomRegex, `Kamar ${trimmedNew}`);
	}

	return description;
}
