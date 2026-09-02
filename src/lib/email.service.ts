import nodemailer from "nodemailer";

export interface SendPasswordResetEmailParams {
	to: string;
	name: string;
	resetUrl: string;
	expiresInMinutes?: number;
}

export interface EmailSendResult {
	success: boolean;
	messageId?: string;
	isSimulated?: boolean;
	error?: string;
}

/**
 * Generate Responsive HTML Email Template in HomeeKost Sage & Cream theme
 */
export function generatePasswordResetEmailHtml({
	name,
	resetUrl,
	expiresInMinutes = 60,
}: {
	name: string;
	resetUrl: string;
	expiresInMinutes?: number;
}): string {
	return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemulihan Kata Sandi — HomeeKost</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f7f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #252925;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 560px;
      margin: 32px auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e9e3;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(47, 69, 55, 0.06);
    }
    .email-header {
      background-color: #4f6958;
      padding: 28px 32px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .email-header p {
      color: #e2ede4;
      font-size: 12px;
      margin: 6px 0 0 0;
    }
    .email-body {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #252925;
      margin-bottom: 12px;
    }
    .content-text {
      font-size: 13.5px;
      line-height: 1.6;
      color: #526055;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn-reset {
      display: inline-block;
      background-color: #4f6958;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13.5px;
      padding: 13px 28px;
      border-radius: 10px;
      letter-spacing: 0.2px;
    }
    .note-box {
      background-color: #f7faf8;
      border: 1px solid #dbe6dd;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 24px;
    }
    .note-box p {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #5c6c60;
    }
    .raw-url {
      word-break: break-all;
      font-size: 11.5px;
      color: #4f6958;
      margin-top: 8px;
      display: block;
    }
    .email-footer {
      background-color: #fafbfa;
      border-top: 1px solid #edf2ee;
      padding: 20px 32px;
      text-align: center;
      font-size: 11px;
      color: #8c978e;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>HomeeKost Management</h1>
      <p>Sistem Pengelolaan Kos Multi-Cabang</p>
    </div>
    <div class="email-body">
      <div class="greeting">Halo, ${name}</div>
      <p class="content-text">
        Kami menerima permintaan untuk mengatur ulang kata sandi akun SuperAdmin Anda pada platform <strong>HomeeKost</strong>. Klik tombol di bawah ini untuk membuat kata sandi baru:
      </p>
      
      <div class="btn-container">
        <a href="${resetUrl}" target="_blank" class="btn-reset">Atur Ulang Kata Sandi</a>
      </div>

      <div class="note-box">
        <p>
          ⏱️ <strong>Batas Waktu:</strong> Tautan pemulihan ini berlaku selama <strong>${expiresInMinutes} menit</strong>.<br>
          🛡️ <strong>Keamanan:</strong> Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Kata sandi akun Anda akan tetap aman.
        </p>
      </div>

      <p class="content-text" style="margin-top: 24px; font-size: 12px;">
        Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke peramban (browser) Anda:
        <span class="raw-url">${resetUrl}</span>
      </p>
    </div>
    <div class="email-footer">
      &copy; ${new Date().getFullYear()} HomeeKost. Seluruh hak cipta dilindungi undang-undang.<br>
      Email ini dikirim otomatis oleh sistem keamanan HomeeKost.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate Plaintext Fallback Email
 */
export function generatePasswordResetEmailText({
	name,
	resetUrl,
	expiresInMinutes = 60,
}: {
	name: string;
	resetUrl: string;
	expiresInMinutes?: number;
}): string {
	return `Halo, ${name}

Kami menerima permintaan untuk mengatur ulang kata sandi akun SuperAdmin Anda di HomeeKost.

Silakan buka tautan berikut untuk membuat kata sandi baru:
${resetUrl}

Tautan ini berlaku selama ${expiresInMinutes} menit.
Jika Anda tidak merasa melakukan permintaan ini, abaikan pesan ini.

Salam,
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
	 * Kirim Email Reset Password ke SuperAdmin
	 */
	async sendPasswordResetEmail({
		to,
		name,
		resetUrl,
		expiresInMinutes = 60,
	}: SendPasswordResetEmailParams): Promise<EmailSendResult> {
		const transporter = this.getTransporter();
		const from =
			process.env.EMAIL_FROM ||
			`"HomeeKost Management" <${process.env.SMTP_USER || "noreply@homeekost.com"}>`;

		const html = generatePasswordResetEmailHtml({
			name,
			resetUrl,
			expiresInMinutes,
		});
		const text = generatePasswordResetEmailText({
			name,
			resetUrl,
			expiresInMinutes,
		});

		// Jika kredensial SMTP belum dipasang di .env, sistem menyimulasikan pengiriman (anti-crash)
		if (!transporter) {
			console.log("---------------------------------------------------------");
			console.log("📧 [SIMULATED EMAIL - SMTP CREDENTIALS NOT CONFIGURED]");
			console.log(`To: ${to} (${name})`);
			console.log(`Subject: Atur Ulang Kata Sandi Akun HomeeKost`);
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
				subject: "Atur Ulang Kata Sandi Akun HomeeKost",
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
			console.error("❌ Gagal mengirim email reset password via Nodemailer:", err);
			return {
				success: false,
				error: errorMsg,
			};
		}
	}
}

export const emailService = new EmailService();
