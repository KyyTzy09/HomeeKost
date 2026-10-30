import { describe, expect, it } from "vitest";
import {
	generatePasswordResetEmailHtml,
	generatePasswordResetEmailText,
} from "../../src/lib/email.service.ts";

describe("Email Template Utilities", () => {
	it("should generate professional HTML verification email with recipient details, role, and reset URL", () => {
		const html = generatePasswordResetEmailHtml({
			to: "admin.jogja@homeekost.com",
			name: "Admin Kos Jogja",
			roleName: "Admin Cabang Kos",
			resetUrl:
				"http://localhost:3000/reset-password?token=test-token-123&email=admin.jogja%40homeekost.com",
			expiresInMinutes: 60,
			requestedAt: "20 Oktober 2026, 08:30 WIB",
		});

		expect(html).toContain("Admin Kos Jogja");
		expect(html).toContain("admin.jogja@homeekost.com");
		expect(html).toContain("Admin Cabang Kos");
		expect(html).toContain("20 Oktober 2026, 08:30 WIB");
		expect(html).toContain("http://localhost:3000/reset-password?token=test-token-123&email=admin.jogja%40homeekost.com");
		expect(html).toContain("60 menit");
		expect(html).toContain("HomeeKost Security");
		expect(html).toContain("Verifikasi Pemulihan Kata Sandi");
		expect(html).toContain("Verifikasi &amp; Buat Kata Sandi Baru");
		expect(html).toContain("Penting:");
	});

	it("should generate plaintext reset email containing recipient name, role, and reset URL", () => {
		const text = generatePasswordResetEmailText({
			to: "owner@homeekost.com",
			name: "Owner HomeeKost",
			roleName: "SuperAdmin (Pemilik Kos)",
			resetUrl: "http://localhost:3000/reset-password?token=test-token-123",
			expiresInMinutes: 30,
			requestedAt: "20 Oktober 2026, 09:00 WIB",
		});

		expect(text).toContain("Halo, Owner HomeeKost");
		expect(text).toContain("owner@homeekost.com");
		expect(text).toContain("SuperAdmin (Pemilik Kos)");
		expect(text).toContain("http://localhost:3000/reset-password?token=test-token-123");
		expect(text).toContain("30 menit");
		expect(text).toContain("HOMEEKOST SECURITY — VERIFIKASI PEMULIHAN KATA SANDI");
	});
});

