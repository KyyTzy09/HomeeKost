import { describe, expect, it } from "vitest";
import {
	generatePasswordResetEmailHtml,
	generatePasswordResetEmailText,
} from "../../src/lib/email.service.ts";

describe("Email Template Utilities", () => {
	it("should generate HTML reset email containing recipient name and reset URL", () => {
		const html = generatePasswordResetEmailHtml({
			name: "Owner HomeeKost",
			resetUrl: "http://localhost:3000/reset-password?token=test-token-123&email=owner%40homeekost.com",
			expiresInMinutes: 60,
		});

		expect(html).toContain("Owner HomeeKost");
		expect(html).toContain("http://localhost:3000/reset-password?token=test-token-123&email=owner%40homeekost.com");
		expect(html).toContain("60 menit");
		expect(html).toContain("HomeeKost Management");
		expect(html).toContain("Atur Ulang Kata Sandi");
	});

	it("should generate plaintext reset email containing recipient name and reset URL", () => {
		const text = generatePasswordResetEmailText({
			name: "Owner HomeeKost",
			resetUrl: "http://localhost:3000/reset-password?token=test-token-123",
			expiresInMinutes: 30,
		});

		expect(text).toContain("Halo, Owner HomeeKost");
		expect(text).toContain("http://localhost:3000/reset-password?token=test-token-123");
		expect(text).toContain("30 menit");
	});
});
