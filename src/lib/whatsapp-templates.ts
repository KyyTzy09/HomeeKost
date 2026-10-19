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
	isOnTime?: boolean;
}

export interface MonthlyFirstReminderTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	amount: number;
	bankName?: string;
	bankAccount?: string;
	accountHolder?: string;
	documentUrl?: string;
}

export interface PartialPaymentReceiptTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	paidDate: string;
	paymentMethod: string;
	paidThisTime: number;
	totalAmount: number;
	totalPaid: number;
	remainingAmount: number;
	documentUrl?: string;
}

export interface InstallmentReminderTemplateParams {
	tenantName: string;
	propertyName: string;
	roomNumber: string;
	invoiceNumber: string;
	period: string;
	totalAmount: number;
	totalPaid: number;
	remainingAmount: number;
	endOfMonthDate: string;
	bankAccount?: string;
	accountHolder?: string;
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
	 * Template Pengingat Tagihan Tanggal 1 Awal Bulan (Masa Bayar 1-5 & Peringatan Denda)
	 */
	monthlyFirstReminder(p: MonthlyFirstReminderTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital Resmi:*\n${p.documentUrl}\n`
			: "";

		return `Halo *${p.tenantName}*,

Hari ini sudah tanggal 1 ${p.period}. Jangan lupa untuk melakukan pembayaran tagihan sewa kos Anda:

🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💰 *Total Tagihan:* *${formatRupiah(p.amount)}*

📅 *Masa Pembayaran:* Tanggal 1 s/d 5 ${p.period}
⚠️ *Penting:* Batas waktu pembayaran adalah tanggal 5. Pembayaran yang melewati tanggal 5 akan dikenakan denda keterlambatan sesuai kebijakan kos.

💳 *Pembayaran dapat ditransfer ke rekening:*
🏦 *${p.bankName || "BCA"} ${p.bankAccount || "8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*
${docSection}
Jika Anda sudah melakukan transfer, silakan kirimkan bukti pembayaran ke nomor ini. Terima kasih! 🙏✨
— Pengelola ${p.propertyName}`;
	},

	/**
	 * Template Konfirmasi Pembayaran Lunas (Kwitansi Digital Lengkap + Link Dokumen)
	 */
	paymentReceipt(p: PaymentReceiptTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Kwitansi Lunas Resmi:*\n${p.documentUrl}\n`
			: "";

		const appreciationText =
			p.isOnTime === true
				? `Terima kasih banyak! Pembayaran sewa kos Anda untuk periode *${p.period}* telah kami terima dan diverifikasi tepat waktu. Kami sangat mengapresiasi kedisiplinan dan kerja sama Anda! 🙏✨`
				: `Pembayaran sewa kos Anda untuk periode *${p.period}* telah kami terima dan diverifikasi.`;

		const closingText =
			p.isOnTime === true
				? `Bukti pembayaran resmi ini tersimpan secara digital di sistem pengelola kos. Semoga nyaman tinggal di *${p.propertyName}*! 🌿🏡`
				: `Bukti pembayaran resmi ini tersimpan secara digital di sistem pengelola kos. Terima kasih atas kerja samanya. 🙏`;

		return `🎉 *PEMBAYARAN DITERIMA & LUNAS* 🎉

Halo *${p.tenantName}*,
${appreciationText}

📄 *No. Kwitansi:* ${p.invoiceNumber}
🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
💳 *Metode Bayar:* ${p.paymentMethod}
🗓️ *Tanggal Bayar:* ${p.paidDate}
💵 *Jumlah Diterima:* *${formatRupiah(p.amount)}* (LUNAS)
${docSection}
${closingText}`;
	},

	/**
	 * Template Bukti Penerimaan Cicilan Sewa Bertahap
	 */
	partialPaymentReceipt(p: PartialPaymentReceiptTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Kwitansi Digital:*\n${p.documentUrl}\n`
			: "";

		return `🧾 *BUKTI PENERIMAAN CICILAN SEWA*

Halo Kak *${p.tenantName}*,
Pembayaran sewa kos Anda untuk periode *${p.period}* telah kami terima:

🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💳 *Metode Bayar:* ${p.paymentMethod}
🗓️ *Tanggal Bayar:* ${p.paidDate}
💵 *Nominal Diterima:* *${formatRupiah(p.paidThisTime)}*

📊 *Rincian Status Tagihan:*
- Total Tagihan: ${formatRupiah(p.totalAmount)}
- Total Terbayar: ${formatRupiah(p.totalPaid)}
- ⚠️ *Sisa Tagihan:* *${formatRupiah(p.remainingAmount)}*
${docSection}
Bukti pembayaran resmi ini tersimpan digital di sistem pengelola kos. Terima kasih! 🙏✨
_— Pengelola ${p.propertyName}_`;
	},

	/**
	 * Template Pengingat Sisa Cicilan Menjelang Akhir Bulan
	 */
	installmentReminder(p: InstallmentReminderTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital:* ${p.documentUrl}\n`
			: "";

		return `🔔 *PENGINGAT SISA CICILAN SEWA*

Halo Kak *${p.tenantName}*,
Mengingatkan kembali perihal sisa tagihan sewa kos untuk periode *${p.period}*:

🏠 *Properti:* ${p.propertyName} (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💵 *Total Tagihan:* ${formatRupiah(p.totalAmount)}
✅ *Sudah Dibayar:* ${formatRupiah(p.totalPaid)}
⏳ *Sisa Pelunasan:* *${formatRupiah(p.remainingAmount)}*
📅 *Batas Waktu Pelunasan:* Sebelum akhir bulan (${p.endOfMonthDate})
${docSection}
Pembayaran dapat ditransfer ke rekening:
🏦 *${p.bankAccount || "BCA 8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*

Mohon lakukan pelunasan sisa tagihan sebelum tanggal tersebut. Terima kasih banyak atas kerjasamanya! 🙏✨
_— Pengelola ${p.propertyName}_`;
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

	/**
	 * Template Pengingat Notifikasi Laporan Keuangan Eksekutif (Teks Saja - Tanpa File PDF)
	 */
	executiveReportReminder(p: {
		propertyName: string;
		periodMonth: string;
		periodYear: number;
		totalIncome: number;
		totalExpense: number;
		netProfit: number;
		profitMarginPercentage: number;
		occupancyRate: number;
		financialHealthGrade: string;
		dashboardUrl?: string;
	}): string {
		const appUrl = process.env.APP_URL || "http://localhost:3000";
		const reportUrl = p.dashboardUrl || `${appUrl}/dashboard/reports`;

		return `📊 *LAPORAN KEUANGAN KOST* 📊
━━━━━━━━━━━━━━━━━━━━━
Halo Bapak/Ibu Pengelola,
Laporan Keuangan Eksekutif untuk *${p.propertyName}* periode *${p.periodMonth} ${p.periodYear}* telah selesai diperbarui dan siap ditinjau.

💰 *Ringkasan Keuangan:*
• Total Pemasukan: *${formatRupiah(p.totalIncome)}*
• Total Pengeluaran: *${formatRupiah(p.totalExpense)}*
• Laba Bersih: *${formatRupiah(p.netProfit)}* (Margin: ${p.profitMarginPercentage}%)
• Status Finansial: *${p.financialHealthGrade}*
• Okupansi Kamar: *${p.occupancyRate}%*

Silakan buka Web Dashboard untuk melihat rincian laporan dan wawasan bisnis lengkap:
🔗 ${reportUrl}
━━━━━━━━━━━━━━━━━━━━━
_Pesan otomatis dari Sistem Manajemen Kost_`;
	},
};
