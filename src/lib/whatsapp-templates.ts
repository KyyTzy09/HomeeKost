import { formatRupiah } from "./currency.ts";

export interface InvoiceTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	dueDate: string;
	amount: number;
	bankName?: string;
	bankAccount?: string;
	accountHolder?: string;
	documentUrl?: string;
}

export interface PaymentReceiptTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	paidDate: string;
	amount: number;
	paymentMethod: string;
	documentUrl?: string;
}

export interface DueReminderTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	dueDate: string;
	daysRemaining: number; // 3 = H-3, 0 = Hari ini, negative = Overdue
	amount: number;
	bankAccount?: string;
	accountHolder?: string;
	documentUrl?: string;
}

export interface BirthdayWishTemplateParams {
	tenantName: string;
	propertyName: string;
}

export interface AnnouncementTemplateParams {
	category: string;
	title: string;
	message: string;
	propertyName?: string;
}

export const whatsappTemplates = {
	/**
	 * Template Tagihan Bulanan Baru (Lengkap dengan Rincian + Rekening + Link Dokumen Digital)
	 */
	newInvoice(p: InvoiceTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital Resmi:*\n${p.documentUrl}\n`
			: "";

		return `Halo Kak *${p.tenantName}*! 👋

Berikut rincian tagihan sewa kos untuk periode *${p.period}*:

🏠 *Properti:* ${p.propertyName}
🚪 *Kamar:* ${p.roomNumber}
📄 *No. Invoice:* ${p.invoiceNumber}
📅 *Jatuh Tempo:* ${p.dueDate}
💰 *Total Tagihan:* *${formatRupiah(p.amount)}*

💳 *Metode Pembayaran:*
- Bank: *${p.bankName || "BCA"}*
- No. Rekening: *${p.bankAccount || "8735081290"}*
- Atas Nama: *${p.accountHolder || "Bude Frisda"}*
${docSection}
Mohon lakukan pembayaran sebelum tanggal jatuh tempo dan kirimkan bukti transfer ke nomor ini. Terima kasih! 🙏✨
_— Pengelola ${p.propertyName}_`;
	},

	/**
	 * Template Pengingat Jatuh Tempo (H-3, Hari H, atau Terlambat/Overdue)
	 */
	dueReminder(p: DueReminderTemplateParams): string {
		let statusHeadline = `Pengingat Tagihan Sewa (${p.period})`;
		let statusNote = `Jatuh tempo pembayaran adalah tanggal *${p.dueDate}* (${p.daysRemaining} hari lagi).`;

		if (p.daysRemaining === 0) {
			statusHeadline = `⚠️ *HARI INI JATUH TEMPO* — Tagihan Sewa (${p.period})`;
			statusNote = `Hari ini adalah batas akhir pembayaran tagihan sewa Anda (*${p.dueDate}*).`;
		} else if (p.daysRemaining < 0) {
			const daysLate = Math.abs(p.daysRemaining);
			statusHeadline = `🚨 *PEMBERITAHUAN TUNGGAKAN* — Tagihan Sewa (${p.period})`;
			statusNote = `Tagihan sewa Anda telah melewati jatuh tempo *${daysLate} hari* (Jatuh tempo: ${p.dueDate}). Mohon segera melakukan pelunasan.`;
		}

		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice:* ${p.documentUrl}\n`
			: "";

		return `Halo Kak *${p.tenantName}*,

${statusHeadline}

🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💰 *Nominal:* *${formatRupiah(p.amount)}*

${statusNote}
${docSection}
Pembayaran dapat ditransfer ke rekening:
🏦 *${p.bankAccount || "BCA 8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*

Jika sudah melakukan transfer, abaikan pesan ini atau kirimkan bukti pembayaran kepada kami. Terima kasih! 🙏`;
	},

	/**
	 * Template Konfirmasi Pembayaran Lunas (Kwitansi Digital Lengkap + Link Dokumen)
	 */
	paymentReceipt(p: PaymentReceiptTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Kwitansi Lunas Resmi:*\n${p.documentUrl}\n`
			: "";

		return `🎉 *PEMBAYARAN DITERIMA & LUNAS* 🎉

Halo Kak *${p.tenantName}*,
Terima kasih, pembayaran sewa kos Anda untuk periode *${p.period}* telah kami terima dan diverifikasi.

📄 *No. Kwitansi:* ${p.invoiceNumber}
🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
💳 *Metode Bayar:* ${p.paymentMethod}
🗓️ *Tanggal Bayar:* ${p.paidDate}
💵 *Jumlah Diterima:* *${formatRupiah(p.amount)}* (LUNAS)
${docSection}
Bukti pembayaran resmi ini tersimpan secara digital di sistem pengelola kos. Semoga nyaman tinggal di *${p.propertyName}*! 🌿🏡`;
	},

	/**
	 * Template Ucapan Selamat Ulang Tahun Penghuni Kos
	 */
	birthdayWish(p: BirthdayWishTemplateParams): string {
		return `🎂🎉 *SELAMAT ULANG TAHUN, KAK ${p.tenantName}!* 🎉🎂

Keluarga besar *${p.propertyName}* mengucapkan selamat bertambah usia! 🎈✨

Semoga di usia yang baru ini senantiasa diberikan kesehatan, kebahagiaan, kemudahan dalam setiap urusan/pekerjaan, serta tercapai segala cita-cita yang diimpikan.

Terima kasih telah menjadi bagian berharga dari keluarga hunian kami. Semoga betah dan selalu nyaman tinggal di *${p.propertyName}*! 🌿🏡
_— Manajemen & Pengelola ${p.propertyName}_`;
	},

	/**
	 * Template Broadcast Pengumuman Kos
	 */
	announcement(p: AnnouncementTemplateParams): string {
		const categoryLabels: Record<string, string> = {
			KERJA_BAKTI: "🧹 KERJA BAKTI & KEBERSIHAN",
			MAINTENANCE: "🔧 MAINTENANCE & PERBAIKAN",
			ACARA: "🎉 ACARA / KEGIATAN BERSAMA",
			UMUM: "📢 PENGUMUMAN PENTING",
		};

		const categoryBadge = categoryLabels[p.category] || "📢 PENGUMUMAN";
		const propertyBadge = p.propertyName
			? `\n🏠 *Lokasi:* ${p.propertyName}`
			: "";

		return `*${categoryBadge}*
━━━━━━━━━━━━━━━━━━━━━
📌 *${p.title}*${propertyBadge}

${p.message}

━━━━━━━━━━━━━━━━━━━━━
_Mohon diperhatikan oleh seluruh penghuni demi kenyamanan bersama. Terima kasih!_ 🙏
_— Manajemen Pengelola Kos_`;
	},
};
