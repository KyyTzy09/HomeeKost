import { describe, expect, it } from "vitest";
import type { EngagementRecipient } from "../../src/common/types/engagement.types.ts";
import {
	filterRecipientsByTemplate,
	personalizeMessage,
} from "../../src/lib/engagement-utils.ts";

describe("Engagement Utils - filterRecipientsByTemplate", () => {
	const fixedNow = new Date("2026-10-19T10:00:00.000Z");

	const mockRecipients: EngagementRecipient[] = [
		{
			tenantId: "t-1",
			name: "Budi Santoso",
			phone: "08123456789",
			roomNumber: "10",
			propertyId: "prop-1",
			propertyName: "Kost Harmoni",
			startDate: "2026-10-05T00:00:00.000Z", // 14 days ago (within 30 days)
			daysRemaining: 2, // Ultah H-2
			isOnTimePayment: true,
			lastPaymentDate: "2026-10-01T00:00:00.000Z",
			isSentToday: false,
		},
		{
			tenantId: "t-2",
			name: "Siti Rahma",
			phone: "08123456780",
			roomNumber: "2",
			propertyId: "prop-1",
			propertyName: "Kost Harmoni",
			startDate: "2026-09-25T00:00:00.000Z", // 24 days ago (within 30 days)
			daysRemaining: 0, // Ultah hari ini
			isOnTimePayment: false,
			lastPaymentDate: "2026-10-10T00:00:00.000Z",
			isSentToday: true,
		},
		{
			tenantId: "t-3",
			name: "Andi Wijaya",
			phone: "08123456781",
			roomNumber: "1",
			propertyId: "prop-2",
			propertyName: "Kost Mawar",
			startDate: "2026-10-15T00:00:00.000Z", // 4 days ago (within 30 days)
			daysRemaining: 6, // Ultah H-6 (outside 5 days)
			isOnTimePayment: true,
			lastPaymentDate: "2026-10-15T00:00:00.000Z",
			isSentToday: false,
		},
		{
			tenantId: "t-4",
			name: "Dewi Lestari",
			phone: "08123456782",
			roomNumber: "101",
			propertyId: "prop-1",
			propertyName: "Kost Harmoni",
			startDate: "2026-01-01T00:00:00.000Z", // > 9 months ago
			daysRemaining: null,
			isOnTimePayment: true,
			lastPaymentDate: "2026-10-05T00:00:00.000Z",
			isSentToday: false,
		},
		{
			tenantId: "t-5",
			name: "Eko Prasetyo",
			phone: "08123456783",
			roomNumber: "20",
			propertyId: "prop-2",
			propertyName: "Kost Mawar",
			startDate: "2025-12-01T00:00:00.000Z", // Old tenant
			daysRemaining: -1, // Past birthday
			isOnTimePayment: false,
			lastPaymentDate: null,
			isSentToday: false,
		},
	];

	it("returns empty array when recipients list is empty", () => {
		const result = filterRecipientsByTemplate([], "Sambutan", "ALL", fixedNow);
		expect(result).toEqual([]);
	});

	it("filters by propertyId correctly when propertyId !== ALL", () => {
		const result = filterRecipientsByTemplate(
			mockRecipients,
			"Umum",
			"prop-2",
			fixedNow,
		);
		expect(result.every((r) => r.propertyId === "prop-2")).toBe(true);
		expect(result.length).toBe(2);
	});

	it("includes all properties when propertyId is ALL or undefined", () => {
		const resultAll = filterRecipientsByTemplate(
			mockRecipients,
			"Umum",
			"ALL",
			fixedNow,
		);
		const resultUndefined = filterRecipientsByTemplate(
			mockRecipients,
			"Umum",
			undefined,
			fixedNow,
		);
		expect(resultAll.length).toBe(mockRecipients.length);
		expect(resultUndefined.length).toBe(mockRecipients.length);
	});

	describe("Category: Sambutan", () => {
		it("filters tenants joined within the last 30 days and sorts by startDate desc", () => {
			const result = filterRecipientsByTemplate(
				mockRecipients,
				"Sambutan",
				"ALL",
				fixedNow,
			);
			// Matching: t-3 (15 Okt), t-1 (5 Okt), t-2 (25 Sep)
			expect(result.map((r) => r.tenantId)).toEqual(["t-3", "t-1", "t-2"]);
		});

		it("falls back to top 5 newest tenants sorted by startDate desc when none joined within 30 days", () => {
			const oldRecipients: EngagementRecipient[] = [
				{ ...mockRecipients[3], tenantId: "old-1", startDate: "2025-01-01" },
				{ ...mockRecipients[3], tenantId: "old-2", startDate: "2025-06-01" },
				{ ...mockRecipients[3], tenantId: "old-3", startDate: "2025-03-01" },
				{ ...mockRecipients[3], tenantId: "old-4", startDate: "2024-12-01" },
				{ ...mockRecipients[3], tenantId: "old-5", startDate: "2025-08-01" },
				{ ...mockRecipients[3], tenantId: "old-6", startDate: "2024-01-01" },
			];

			const result = filterRecipientsByTemplate(
				oldRecipients,
				"Sambutan",
				"ALL",
				fixedNow,
			);
			expect(result.length).toBe(5);
			expect(result.map((r) => r.tenantId)).toEqual([
				"old-5", // 2025-08-01
				"old-2", // 2025-06-01
				"old-3", // 2025-03-01
				"old-1", // 2025-01-01
				"old-4", // 2024-12-01
			]);
		});
	});

	describe("Category: Ulang Tahun", () => {
		it("filters tenants with daysRemaining between 0 and 5 and sorts by daysRemaining asc", () => {
			const result = filterRecipientsByTemplate(
				mockRecipients,
				"Ulang Tahun",
				"ALL",
				fixedNow,
			);
			// Matching: t-2 (0 days), t-1 (2 days)
			// t-3 (6 days) and t-5 (-1 day) and t-4 (null) are excluded
			expect(result.map((r) => r.tenantId)).toEqual(["t-2", "t-1"]);
		});
	});

	describe("Category: Pembayaran", () => {
		it("filters tenants with isOnTimePayment === true and sorts by lastPaymentDate desc", () => {
			const result = filterRecipientsByTemplate(
				mockRecipients,
				"Pembayaran",
				"ALL",
				fixedNow,
			);
			// Matching: t-3 (15 Okt), t-4 (5 Okt), t-1 (1 Okt)
			// t-2 (isOnTimePayment: false) and t-5 (isOnTimePayment: false) are excluded
			expect(result.map((r) => r.tenantId)).toEqual(["t-3", "t-4", "t-1"]);
		});
	});

	describe("Category: General / Fallback (Kerja Bakti, Umum, null)", () => {
		it("returns all tenants sorted naturally by roomNumber asc", () => {
			const result = filterRecipientsByTemplate(
				mockRecipients,
				"Umum",
				"ALL",
				fixedNow,
			);
			// Room numbers: "10", "2", "1", "101", "20"
			// Natural sort: "1", "2", "10", "20", "101"
			expect(result.map((r) => r.roomNumber)).toEqual([
				"1",
				"2",
				"10",
				"20",
				"101",
			]);
		});
	});
});

describe("Engagement Utils - personalizeMessage", () => {
	const recipient = {
		name: "Dewi Lestari",
		roomNumber: "102B",
		propertyName: "Kost Harmoni Asri",
	};

	it("replaces {nama}, {kamar}, and {kos} correctly", () => {
		const template =
			"Halo {nama}, selamat datang di {kos}! Kamu menempati kamar {kamar}.";
		const personalized = personalizeMessage(template, recipient);
		expect(personalized).toBe(
			"Halo Dewi Lestari, selamat datang di Kost Harmoni Asri! Kamu menempati kamar 102B.",
		);
	});

	it("replaces {kost} with propertyName as well", () => {
		const template = "Terima kasih telah membayar sewa di {kost}, {nama}.";
		const personalized = personalizeMessage(template, recipient);
		expect(personalized).toBe(
			"Terima kasih telah membayar sewa di Kost Harmoni Asri, Dewi Lestari.",
		);
	});

	it("is case-insensitive for placeholders ({NAMA}, {Kamar}, {KOST})", () => {
		const template = "Halo {NAMA}, kamar {Kamar} di {KOST}.";
		const personalized = personalizeMessage(template, recipient);
		expect(personalized).toBe(
			"Halo Dewi Lestari, kamar 102B di Kost Harmoni Asri.",
		);
	});

	it("handles multiple occurrences of tokens", () => {
		const template = "{nama}, sekali lagi terima kasih {nama}!";
		const personalized = personalizeMessage(template, recipient);
		expect(personalized).toBe(
			"Dewi Lestari, sekali lagi terima kasih Dewi Lestari!",
		);
	});

	it("handles empty or missing template and recipient properties gracefully", () => {
		expect(personalizeMessage("", recipient)).toBe("");
		expect(
			personalizeMessage("Halo {nama} {kamar} {kos}", {
				name: "",
				roomNumber: "",
				propertyName: "",
			}),
		).toBe("Halo   ");
	});
});
