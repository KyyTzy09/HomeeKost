import { describe, expect, it } from "vitest";

/**
 * Formula helper untuk menghitung Net Occupancy Rate
 * Sesuai logika di DashboardService dan ReportRepository
 */
export function calculateNetOccupancyRate(
	totalRooms: number,
	occupiedRooms: number,
	maintenanceRooms: number,
): number {
	const operableRooms = totalRooms - maintenanceRooms;
	if (operableRooms <= 0) return 0;
	return Number(((occupiedRooms / operableRooms) * 100).toFixed(1));
}

describe("Net Occupancy Rate Calculation", () => {
	it("harus mengecualikan kamar maintenance dari pembagi kapasitas sewa aktif", () => {
		// 10 kamar total: 8 terisi, 1 kosong, 1 maintenance
		// Operable rooms: 10 - 1 = 9 kamar
		// Net Occupancy: 8 / 9 * 100 = 88.9%
		const rate = calculateNetOccupancyRate(10, 8, 1);
		expect(rate).toBe(88.9);
	});

	it("harus mencatat 100% jika seluruh kamar siap huni telah terisi penuh meskipun ada kamar maintenance", () => {
		// 10 kamar total: 8 terisi, 0 kosong, 2 maintenance
		// Operable rooms: 10 - 2 = 8 kamar
		// Net Occupancy: 8 / 8 * 100 = 100.0%
		const rate = calculateNetOccupancyRate(10, 8, 2);
		expect(rate).toBe(100);
	});

	it("harus menghitung normal jika tidak ada kamar maintenance (0 maintenance)", () => {
		// 10 kamar total: 7 terisi, 3 kosong, 0 maintenance
		// Operable rooms: 10 kamar
		// Net Occupancy: 7 / 10 * 100 = 70.0%
		const rate = calculateNetOccupancyRate(10, 7, 0);
		expect(rate).toBe(70);
	});

	it("harus mengembalikan 0 jika seluruh kamar sedang dalam masa renovasi / maintenance total", () => {
		// 5 kamar total: 0 terisi, 0 kosong, 5 maintenance
		// Operable rooms: 0
		const rate = calculateNetOccupancyRate(5, 0, 5);
		expect(rate).toBe(0);
	});

	it("harus mengembalikan 0 jika properti belum memiliki kamar sama sekali", () => {
		const rate = calculateNetOccupancyRate(0, 0, 0);
		expect(rate).toBe(0);
	});
});
