import { describe, expect, it } from "vitest";
import {
	evaluateRentalPaymentStatus,
} from "../../src/lib/payment-utils.ts";

describe("evaluateRentalPaymentStatus", () => {
	const mockCurrentDate = "2026-10-23T10:00:00+07:00"; // 23 Oktober 2026 WIB

	it("harus mengembalikan status 'Lunas' jika paidAmount >= totalAmount", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1000000,
			paidAmount: 1000000,
			dueDate: "2026-10-20",
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Lunas");
		expect(res.statusKey).toBe("PAID");
		expect(res.isSettled).toBe(true);
		expect(res.isInstallment).toBe(false);
		expect(res.remainingAmount).toBe(0);
		expect(res.badgeText).toBe("Lunas");
		expect(res.badgeVariant).toBe("green");
	});

	it("harus mengembalikan status 'Lunas' jika databaseStatus adalah PAID", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1000000,
			paidAmount: 0,
			dueDate: "2026-10-20",
			databaseStatus: "PAID",
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Lunas");
		expect(res.statusKey).toBe("PAID");
		expect(res.isSettled).toBe(true);
		expect(res.badgeVariant).toBe("green");
	});

	it("harus mengembalikan status 'Belum Lunas' jika jatuh tempo adalah HARI INI dan belum lunas", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1000000,
			paidAmount: 0,
			dueDate: "2026-10-23", // Tepat hari ini
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Belum Lunas");
		expect(res.statusKey).toBe("UNPAID");
		expect(res.isSettled).toBe(false);
		expect(res.isInstallment).toBe(false);
		expect(res.remainingAmount).toBe(1000000);
		expect(res.badgeText).toBe("Belum Lunas");
		expect(res.badgeVariant).toBe("amber");
	});

	it("harus mengembalikan status 'Belum Lunas' jika jatuh tempo masih di masa depan", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1200000,
			paidAmount: 0,
			dueDate: "2026-10-28", // H+5
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Belum Lunas");
		expect(res.statusKey).toBe("UNPAID");
		expect(res.isSettled).toBe(false);
		expect(res.badgeVariant).toBe("amber");
	});

	it("harus mengembalikan status 'Terlambat' jika jatuh tempo sudah lewat (kemarin)", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1000000,
			paidAmount: 0,
			dueDate: "2026-10-22", // Kemarin
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Terlambat");
		expect(res.statusKey).toBe("OVERDUE");
		expect(res.isSettled).toBe(false);
		expect(res.isInstallment).toBe(false);
		expect(res.remainingAmount).toBe(1000000);
		expect(res.badgeText).toBe("Terlambat");
		expect(res.badgeVariant).toBe("red");
	});

	it("harus menandai 'Cicilan' jika sudah bayar sebagian dan belum lewat jatuh tempo", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1000000,
			paidAmount: 400000,
			dueDate: "2026-10-25", // Masa depan
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Belum Lunas");
		expect(res.statusKey).toBe("UNPAID");
		expect(res.isSettled).toBe(false);
		expect(res.isInstallment).toBe(true);
		expect(res.paidAmount).toBe(400000);
		expect(res.remainingAmount).toBe(600000);
		expect(res.badgeText).toBe("Cicilan");
		expect(res.badgeVariant).toBe("amber");
	});

	it("harus menandai 'Cicilan' dengan variant merah jika sudah bayar sebagian tapi sudah lewat tempo", () => {
		const res = evaluateRentalPaymentStatus({
			totalAmount: 1000000,
			paidAmount: 500000,
			dueDate: "2026-10-15", // Sudah lewat
			currentDate: mockCurrentDate,
		});

		expect(res.status).toBe("Terlambat");
		expect(res.statusKey).toBe("OVERDUE");
		expect(res.isSettled).toBe(false);
		expect(res.isInstallment).toBe(true);
		expect(res.paidAmount).toBe(500000);
		expect(res.remainingAmount).toBe(500000);
		expect(res.badgeText).toBe("Cicilan");
		expect(res.badgeVariant).toBe("red");
	});
});
