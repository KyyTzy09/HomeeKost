import { describe, expect, it } from "vitest";
import { compareRoomNumbers } from "../../src/common/helpers/room.helper.ts";

describe("Natural Room Sorting (compareRoomNumbers)", () => {
	it("harus mengurutkan nomor kamar numerik murni secara alami (1, 2, 3 ... 10, 11) bukan alfabetis", () => {
		const rawRooms = ["1", "10", "11", "12", "2", "20", "3", "4", "5", "9"];
		const sorted = [...rawRooms].sort(compareRoomNumbers);

		expect(sorted).toEqual([
			"1",
			"2",
			"3",
			"4",
			"5",
			"9",
			"10",
			"11",
			"12",
			"20",
		]);
	});

	it("harus mengurutkan nomor kamar dengan akhiran huruf (1A, 1B, 2A, 10A)", () => {
		const rawRooms = ["10B", "1A", "2A", "10A", "1B", "2B"];
		const sorted = [...rawRooms].sort(compareRoomNumbers);

		expect(sorted).toEqual(["1A", "1B", "2A", "2B", "10A", "10B"]);
	});

	it("harus mengurutkan nomor kamar dengan prefix kata (Kamar 1, Kamar 10, Kamar 2)", () => {
		const rawRooms = [
			"Kamar 10",
			"Kamar 1",
			"Kamar 3",
			"Kamar 2",
			"Kamar 20",
		];
		const sorted = [...rawRooms].sort(compareRoomNumbers);

		expect(sorted).toEqual([
			"Kamar 1",
			"Kamar 2",
			"Kamar 3",
			"Kamar 10",
			"Kamar 20",
		]);
	});

	it("harus mengurutkan nomor kamar dengan kode blok lantai (A1, A10, A2, B1, B2, B10)", () => {
		const rawRooms = ["B10", "A10", "A1", "B2", "A2", "B1"];
		const sorted = [...rawRooms].sort(compareRoomNumbers);

		expect(sorted).toEqual(["A1", "A2", "A10", "B1", "B2", "B10"]);
	});

	it("harus menangani nomor kamar berformat angka tiga digit / lantai hotel (101, 102, 201, 202)", () => {
		const rawRooms = ["202", "101", "201", "102"];
		const sorted = [...rawRooms].sort(compareRoomNumbers);

		expect(sorted).toEqual(["101", "102", "201", "202"]);
	});
});
