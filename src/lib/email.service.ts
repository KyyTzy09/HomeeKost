import nodemailer from "nodemailer";

export interface SendPasswordResetEmailParams {
	to: string;
	name: string;
	resetUrl: string;
	roleName?: string;
	expiresInMinutes?: number;
	requestedAt?: string;
}

export interface EmailSendResult {
	success: boolean;
	messageId?: string;
	isSimulated?: boolean;
	error?: string;
}

/**
 * Generate High-Standard Professional HTML Verification Email Template
 * styled in HomeeKost Sage Green & Cream Design System
 */
export function generatePasswordResetEmailHtml({
	to,
	name,
	resetUrl,
	roleName = "Pengelola Kos",
	expiresInMinutes = 60,
	requestedAt,
}: {
	to?: string;
	name: string;
	resetUrl: string;
	roleName?: string;
	expiresInMinutes?: number;
	requestedAt?: string;
}): string {
	const currentYear = new Date().getFullYear();
	const timeDisplay =
		requestedAt ||
		`${new Date().toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "Asia/Jakarta",
		})} WIB`;

	return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verifikasi Pemulihan Kata Sandi — HomeeKost</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f6f3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #212621;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
    }
    table {
      border-collapse: separate;
      border-spacing: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f6f3;
      padding: 40px 16px;
    }
    .main-card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #dce5dd;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(45, 66, 52, 0.08);
    }
    .header-banner {
      background: linear-gradient(135deg, #3d5445 0%, #4f6958 100%);
      padding: 36px 32px 30px;
      text-align: center;
    }
    .badge-icon {
      display: inline-block;
      width: 52px;
      height: 52px;
      line-height: 52px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      font-size: 26px;
      margin-bottom: 14px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 21px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .brand-subtitle {
      color: #e3ede5;
      font-size: 12.5px;
      margin: 6px 0 0;
      font-weight: 400;
    }
    .content-body {
      padding: 36px 36px 28px;
    }
    .headline-title {
      font-size: 18px;
      font-weight: 700;
      color: #222d25;
      margin: 0 0 12px;
      letter-spacing: -0.2px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.65;
      color: #4f5f53;
      margin: 0 0 24px;
    }
    .account-card {
      background-color: #f7faf7;
      border: 1px solid #dce6de;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 28px;
    }
    .account-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 6px 0;
      border-bottom: 1px dashed #e2ebe3;
    }
    .account-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .account-label {
      color: #6d7d71;
      font-weight: 500;
    }
    .account-val {
      color: #233126;
      font-weight: 600;
      text-align: right;
    }
    .role-pill {
      display: inline-block;
      background-color: #e5efe7;
      color: #385340;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 28px;
    }
    .btn-verify {
      display: inline-block;
      background-color: #445d4d;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 15px 36px;
      border-radius: 12px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 16px rgba(68, 93, 77, 0.28);
      transition: background-color 0.2s ease;
    }
    .btn-verify:hover {
      background-color: #384c3f;
    }
    .notice-card {
      background-color: #edf4ee;
      border: 1px solid #cfded1;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .notice-card p {
      margin: 0;
      font-size: 12px;
      line-height: 1.55;
      color: #3f5545;
    }
    .url-box {
      background-color: #f8faf8;
      border: 1px solid #e2ece3;
      border-radius: 10px;
      padding: 12px 14px;
      margin: 20px 0;
      word-break: break-all;
    }
    .url-label {
      font-size: 11.5px;
      color: #637367;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .url-link {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      color: #3a5c43;
      line-height: 1.5;
      display: block;
      text-decoration: none;
    }
    .security-alert {
      background-color: #fcf9f2;
      border: 1px solid #eedfc5;
      border-radius: 12px;
      padding: 14px 18px;
      margin-top: 24px;
    }
    .security-alert p {
      margin: 0;
      font-size: 11.5px;
      line-height: 1.55;
      color: #7d592b;
    }
    .footer-section {
      background-color: #fafbfa;
      border-top: 1px solid #eef2ee;
      padding: 24px 36px;
      text-align: center;
      font-size: 11px;
      line-height: 1.6;
      color: #8c998e;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <!-- Header Banner -->
      <div class="header-banner">
        <div class="badge-icon">🔐</div>
        <h1 class="brand-title">HomeeKost Security</h1>
        <p class="brand-subtitle">Sistem Manajemen & Operasional Kos Multi-Cabang</p>
      </div>

      <!-- Main Body -->
      <div class="content-body">
        <h2 class="headline-title">Verifikasi Pemulihan Kata Sandi</h2>
        <p class="lead-text">
          Halo, <strong>${name}</strong>. Kami menerima permintaan resmi untuk mengatur ulang kata sandi akun pengelola Anda di platform <strong>HomeeKost</strong>.
        </p>

        <!-- Account Metadata Card -->
        <div class="account-card">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;">
            <tr>
              <td style="padding:5px 0; color:#6d7d71; font-weight:500;">Penerima / Nama:</td>
              <td style="padding:5px 0; color:#233126; font-weight:600; text-align:right;">${name}</td>
            </tr>
            ${
							to
								? `<tr>
              <td style="padding:5px 0; color:#6d7d71; font-weight:500; border-top:1px dashed #e2ebe3;">Alamat Email:</td>
              <td style="padding:5px 0; color:#233126; font-weight:600; text-align:right; border-top:1px dashed #e2ebe3;">${to}</td>
            </tr>`
								: ""
						}
            <tr>
              <td style="padding:5px 0; color:#6d7d71; font-weight:500; border-top:1px dashed #e2ebe3;">Peran Akun:</td>
              <td style="padding:5px 0; text-align:right; border-top:1px dashed #e2ebe3;">
                <span class="role-pill">${roleName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; color:#6d7d71; font-weight:500; border-top:1px dashed #e2ebe3;">Waktu Permintaan:</td>
              <td style="padding:5px 0; color:#233126; font-weight:500; text-align:right; border-top:1px dashed #e2ebe3;">${timeDisplay}</td>
            </tr>
          </table>
        </div>

        <!-- Primary Action Button -->
        <div class="cta-container">
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" class="btn-verify">
            Verifikasi &amp; Buat Kata Sandi Baru &rarr;
          </a>
        </div>

        <!-- Expiry Notice -->
        <div class="notice-card">
          <p>
            ⏱️ <strong>Batas Waktu Validitas:</strong> Tautan verifikasi ini berlaku selama <strong>${expiresInMinutes} menit</strong> dan hanya dapat digunakan 1 (satu) kali demi keamanan sistem.
          </p>
        </div>

        <!-- Fallback URL -->
        <div class="url-box">
          <div class="url-label">Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke peramban (browser) Anda:</div>
          <a href="${resetUrl}" class="url-link">${resetUrl}</a>
        </div>

        <!-- Security Warning -->
        <div class="security-alert">
          <p>
            🛡️ <strong>Penting:</strong> Jangan berikan tautan ini kepada siapa pun, termasuk staf HomeeKost. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Akun Anda tetap terlindungi dan kata sandi Anda tidak akan berubah.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        &copy; ${currentYear} HomeeKost Management Portal. Seluruh hak cipta dilindungi undang-undang.<br>
        Email ini dikirimkan otomatis oleh sistem otentikasi dan keamanan HomeeKost.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate Plaintext Fallback Email
 */
export function generatePasswordResetEmailText({
	to,
	name,
	resetUrl,
	roleName = "Pengelola Kos",
	expiresInMinutes = 60,
	requestedAt,
}: {
	to?: string;
	name: string;
	resetUrl: string;
	roleName?: string;
	expiresInMinutes?: number;
	requestedAt?: string;
}): string {
	return `=====================================================
HOMEEKOST SECURITY — VERIFIKASI PEMULIHAN KATA SANDI
=====================================================

Halo, ${name}

Kami menerima permintaan verifikasi untuk mengatur ulang kata sandi akun ${roleName} Anda pada sistem HomeeKost.

Rincian Akun:
- Nama Pengguna: ${name}
${to ? `- Alamat Email: ${to}\n` : ""}- Peran Akun: ${roleName}
${requestedAt ? `- Waktu Permintaan: ${requestedAt}\n` : ""}- Batas Waktu Tautan: ${expiresInMinutes} menit

Silakan buka tautan berikut di peramban (browser) Anda untuk memverifikasi dan membuat kata sandi baru:
${resetUrl}

Peringatan Keamanan:
Tautan ini bersifat rahasia dan hanya berlaku selama ${expiresInMinutes} menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan pesan ini. Kata sandi akun Anda akan tetap aman.

Salam hangat,
Tim Keamanan HomeeKost`;
}

export class EmailService {
	private transporter: nodemailer.Transporter | null = null;

	private getTransporter(): nodemailer.Transporter | null {
		if (this.transporter) return this.transporter;

		const user = process.env.SMTP_USER;
		const pass = process.env.SMTP_PASS;
		const host = process.env.SMTP_HOST || "smtp.gmail.com";
		const port = Number(process.env.SMTP_PORT) || 465;
		const secure =
			process.env.SMTP_SECURE !== undefined
				? process.env.SMTP_SECURE === "true"
				: port === 465;

		if (!user || !pass) {
			return null;
		}

		this.transporter = nodemailer.createTransport({
			host,
			port,
			secure,
			auth: {
				user,
				pass,
			},
		});

		return this.transporter;
	}

	/**
	 * Kirim Email Verifikasi Reset Password ke Pengelola Kos (SuperAdmin / Admin)
	 */
	async sendPasswordResetEmail({
		to,
		name,
		resetUrl,
		roleName,
		expiresInMinutes = 60,
		requestedAt,
	}: SendPasswordResetEmailParams): Promise<EmailSendResult> {
		const transporter = this.getTransporter();
		const from =
			process.env.EMAIL_FROM ||
			`"HomeeKost Security" <${process.env.SMTP_USER || "noreply@homeekost.com"}>`;

		const html = generatePasswordResetEmailHtml({
			to,
			name,
			resetUrl,
			roleName,
			expiresInMinutes,
			requestedAt,
		});
		const text = generatePasswordResetEmailText({
			to,
			name,
			resetUrl,
			roleName,
			expiresInMinutes,
			requestedAt,
		});

		// Jika kredensial SMTP belum dipasang di .env, sistem menyimulasikan pengiriman (anti-crash)
		if (!transporter) {
			console.log("---------------------------------------------------------");
			console.log("📧 [SIMULATED EMAIL - SMTP CREDENTIALS NOT CONFIGURED]");
			console.log(`To: ${to} (${name}) [${roleName || "Pengelola"}]`);
			console.log(`Subject: Verifikasi Pemulihan Kata Sandi Akun HomeeKost`);
			console.log(`Reset URL: ${resetUrl}`);
			console.log("---------------------------------------------------------");
			return {
				success: true,
				isSimulated: true,
				messageId: `simulated-${Date.now()}`,
			};
		}

		try {
			const info = await transporter.sendMail({
				from,
				to,
				subject: "Verifikasi Pemulihan Kata Sandi Akun HomeeKost",
				text,
				html,
			});

			return {
				success: true,
				messageId: info.messageId,
				isSimulated: false,
			};
		} catch (err: unknown) {
			const errorMsg =
				err instanceof Error ? err.message : "Gagal mengirim email via SMTP";
			console.error(
				"❌ Gagal mengirim email reset password via Nodemailer:",
				err,
			);
			return {
				success: false,
				error: errorMsg,
			};
		}
	}
}

export const emailService = new EmailService();
