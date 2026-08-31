import { describe, expect, it } from "vitest";
import {
	getWhatsAppDirectUrl,
	isValidIndonesianPhone,
	sanitizePhoneNumber,
} from "../../src/lib/phone-sanitizer.ts";
import { formatDisplayPhone, sanitizePhone } from "../../src/lib/phone-utils.ts";

describe("Phone Sanitizer & Formatting Utilities", () => {
	describe("sanitizePhone & sanitizePhoneNumber (Canonical 628xxx format)", () => {
		it("harus mengubah format '08xxx' menjadi '628xxx'", () => {
			expect(sanitizePhoneNumber("081234567890")).toBe("6281234567890");
			expect(sanitizePhone("081234567890")).toBe("6281234567890");
		});

		it("harus mengubah format '+628xxx' atau '628xxx' tetap menjadi '628xxx'", () => {
			expect(sanitizePhoneNumber("+6281234567890")).toBe("6281234567890");
			expect(sanitizePhone("6281234567890")).toBe("6281234567890");
		});

		it("harus menambahkan '62' jika nomor diawali langsung '8xxx'", () => {
			expect(sanitizePhoneNumber("81234567890")).toBe("6281234567890");
			expect(sanitizePhone("81234567890")).toBe("6281234567890");
		});

		it("harus membersihkan spasi, tanda strip, atau karakter non-digit", () => {
			expect(sanitizePhoneNumber("0812-3456-7890")).toBe("6281234567890");
			expect(sanitizePhoneNumber("+62 (812) 3456 7890")).toBe("6281234567890");
			expect(sanitizePhone("0812 3456 7890")).toBe("6281234567890");
		});

		it("harus menangani string kosong / null secara aman", () => {
			expect(sanitizePhoneNumber("")).toBe("");
			expect(sanitizePhoneNumber(null)).toBe("");
			expect(sanitizePhoneNumber(undefined)).toBe("");
			expect(sanitizePhone("")).toBe("");
		});
	});

	describe("formatDisplayPhone (UI Display 08xx xxxx xxxx)", () => {
		it("harus memformat nomor canonical '628xxx' ke format tampilan bersegmen '08xx xxxx xxxx'", () => {
			expect(formatDisplayPhone("628123456789")).toBe("0812 3456 789");
			expect(formatDisplayPhone("6281234567890")).toBe("0812 3456 7890");
		});

		it("harus mengembalikan tanda strip jika input kosong", () => {
			expect(formatDisplayPhone("")).toBe("—");
		});
	});

	describe("isValidIndonesianPhone", () => {
		it("harus mengembalikan true untuk nomor HP Indonesia yang valid (10-14 digit, diawali 628)", () => {
			expect(isValidIndonesianPhone("081234567890")).toBe(true);
			expect(isValidIndonesianPhone("6285712345678")).toBe(true);
			expect(isValidIndonesianPhone("+62 899-1234-5678")).toBe(true);
		});

		it("harus mengembalikan false untuk nomor terlalu pendek atau tidak diawali 08/628", () => {
			expect(isValidIndonesianPhone("08123")).toBe(false); // terlalu pendek
			expect(isValidIndonesianPhone("0217654321")).toBe(false); // nomor telepon rumah Jakarta
			expect(isValidIndonesianPhone("1234567890")).toBe(false); // bukan nomor seluler
			expect(isValidIndonesianPhone("")).toBe(false);
		});
	});

	describe("getWhatsAppDirectUrl (wa.me link generator)", () => {
		it("harus menghasilkan url wa.me dengan nomor tersanitasi dan pesan ter-encode", () => {
			const url = getWhatsAppDirectUrl("0812-3456-7890", "Halo Penghuni Kos!");
			expect(url).toBe("https://wa.me/6281234567890?text=Halo%20Penghuni%20Kos!");
		});
	});
});
