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
