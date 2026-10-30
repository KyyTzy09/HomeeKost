import { describe, expect, it } from "vitest";
import { naturalCompare } from "../../src/lib/sort-utils.ts";

describe("naturalCompare Utility", () => {
	it("correctly sorts pure numeric strings with leading zeroes", () => {
		const list = ["03", "10", "01", "02", "20", "11"];
		const sorted = [...list].sort(naturalCompare);
		expect(sorted).toEqual(["01", "02", "03", "10", "11", "20"]);
	});

	it("correctly sorts pure alphabetical strings", () => {
		const list = ["Deluxe", "Suite", "Standard", "Anggrek", "Mawar"];
		const sorted = [...list].sort(naturalCompare);
		expect(sorted).toEqual(["Anggrek", "Deluxe", "Mawar", "Standard", "Suite"]);
	});

	it("correctly sorts mixed alphanumeric room codes with dashes and numbers", () => {
		const list = ["A-10", "B-02", "A-01", "A-2", "B-1", "A-11"];
		const sorted = [...list].sort(naturalCompare);
		expect(sorted).toEqual(["A-01", "A-2", "A-10", "A-11", "B-1", "B-02"]);
	});

	it("correctly sorts rooms with words and numbers", () => {
		const list = ["Kamar 12", "Kamar 2", "Kamar 1", "Kamar 20", "Kamar 10"];
		const sorted = [...list].sort(naturalCompare);
		expect(sorted).toEqual([
			"Kamar 1",
			"Kamar 2",
			"Kamar 10",
			"Kamar 12",
			"Kamar 20",
		]);
	});

	it("handles null and empty strings gracefully before actual values", () => {
		const list = ["02", null, "", "01"];
		const sorted = [...list].sort(naturalCompare);
		expect(sorted).toEqual([null, "", "01", "02"]);
	});
});
