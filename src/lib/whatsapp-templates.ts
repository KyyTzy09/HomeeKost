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

🏠 *${p.propertyName}*
🚪 *Kamar:* ${p.roomNumber}
📄 *No. Invoice:* ${p.invoiceNumber}
📅 *Jatuh Tempo:* ${p.dueDate}
💰 *Total Tagihan:* *${formatRupiah(p.amount)}*

💳 *Metode Pembayaran:*
- Bank: *${p.bankName || "BCA"}*
- No. Rekening: *${p.bankAccount || "8735081290"}*
- Atas Nama: *${p.accountHolder || "Bude Frisda"}*
${docSection}
Jika sudah melakukan transfer, silakan kirimkan bukti pembayarannya ke sini ya Kak.

Terima kasih banyak atas perhatian dan kerja sama baiknya Kak, have a nice day! 😊🙏
_— Admin Kos ${p.propertyName}_`;
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

		return `Halo Kak *${p.tenantName}*! 👋

${statusHeadline}

🏠 *${p.propertyName}* (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💰 *Nominal:* *${formatRupiah(p.amount)}*

${statusNote}
${docSection}
Pembayaran dapat ditransfer ke rekening:
🏦 *${p.bankAccount || "BCA 8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*

Terima kasih banyak atas perhatian dan kerja sama baiknya Kak, have a nice day! 😊🙏
_— Admin Kos ${p.propertyName}_`;
	},

	/**
	 * Template Pengingat Tagihan Tanggal 1 Awal Bulan (Masa Bayar 1-5 & Peringatan Denda)
	 */
	monthlyFirstReminder(p: MonthlyFirstReminderTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital Resmi:*\n${p.documentUrl}\n`
			: "";

		return `Halo Kak *${p.tenantName}*! 👋

Mengingatkan untuk pembayaran sewa kost di *${p.propertyName}* (Kamar ${p.roomNumber}) periode *${p.period}*:

📄 *No. Invoice:* ${p.invoiceNumber}
💰 *Total Tagihan:* *${formatRupiah(p.amount)}*

💳 *Pembayaran dapat ditransfer ke rekening:*
🏦 *${p.bankName || "BCA"} ${p.bankAccount || "8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*
${docSection}
Masa pembayaran sewa adalah tanggal 1 s.d. 5 ya Kak. Pembayaran setelah tanggal 5 akan dikenakan denda keterlambatan sesuai ketentuan kost.

Terima kasih banyak bagi yang sudah melakukan pembayaran tepat waktu, have a nice day Kak! 😊🙏
_— Admin Kos ${p.propertyName}_`;
	},

	/**
	 * Template Pengingat Jatuh Tempo Tanggal 5 (Batas Akhir Bayar & Peringatan Denda)
	 */
	monthlyFifthReminder(p: MonthlyFirstReminderTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital Resmi:*\n${p.documentUrl}\n`
			: "";

		return `Halo Kak *${p.tenantName}*! 👋

⚠️ *PENGINGAT BATAS AKHIR PEMBAYARAN HARI INI*

Mengingatkan kembali bahwa hari ini (Tanggal 5) adalah batas akhir pembayaran sewa kost di *${p.propertyName}* (Kamar ${p.roomNumber}) periode *${p.period}*:

📄 *No. Invoice:* ${p.invoiceNumber}
💰 *Total Tagihan:* *${formatRupiah(p.amount)}*

💳 *Pembayaran dapat ditransfer ke rekening:*
🏦 *${p.bankName || "BCA"} ${p.bankAccount || "8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*
${docSection}
Mohon melakukan pelunasan hari ini agar terhindar dari denda keterlambatan ya Kak. Jika sudah melakukan transfer, silakan kirimkan bukti pembayarannya ke sini.

Terima kasih banyak atas perhatian dan kerja samanya Kak! 😊🙏
_— Admin Kos ${p.propertyName}_`;
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
				? `Terima kasih banyak! Pembayaran sewa kos Anda di *${p.propertyName}* untuk periode *${p.period}* telah kami terima dan diverifikasi lunas. 🙏✨`
				: `Pembayaran sewa kos Anda di *${p.propertyName}* untuk periode *${p.period}* telah kami terima dan diverifikasi lunas. 🙏✨`;

		const closingText =
			p.isOnTime === true
				? `Bukti pembayaran resmi ini tersimpan secara digital di sistem kami. Semoga selalu betah dan nyaman tinggal di *${p.propertyName}*! 🌿🏡`
				: `Bukti pembayaran resmi ini tersimpan secara digital di sistem kami. Terima kasih atas kerja samanya. 🙏`;

		return `🎉 *PEMBAYARAN DITERIMA & LUNAS* 🎉

Halo Kak *${p.tenantName}*! 👋
${appreciationText}

📄 *No. Kwitansi:* ${p.invoiceNumber}
🏠 *${p.propertyName}* (Kamar ${p.roomNumber})
💳 *Metode Bayar:* ${p.paymentMethod}
🗓️ *Tanggal Bayar:* ${p.paidDate}
💵 *Jumlah Diterima:* *${formatRupiah(p.amount)}* (LUNAS)
${docSection}
${closingText}

Terima kasih banyak atas perhatian dan kerja sama baiknya Kak, have a nice day! 😊🙏
_— Admin Kos ${p.propertyName}_`;
	},

	/**
	 * Template Bukti Penerimaan Cicilan Sewa Bertahap
	 */
	partialPaymentReceipt(p: PartialPaymentReceiptTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Kwitansi Digital:*\n${p.documentUrl}\n`
			: "";

		return `🧾 *BUKTI PENERIMAAN CICILAN SEWA*

Halo Kak *${p.tenantName}*! 👋
Pembayaran sewa kos Anda di *${p.propertyName}* untuk periode *${p.period}* telah kami terima:

🏠 *${p.propertyName}* (Kamar ${p.roomNumber})
📄 *No. Invoice:* ${p.invoiceNumber}
💳 *Metode Bayar:* ${p.paymentMethod}
🗓️ *Tanggal Bayar:* ${p.paidDate}
💵 *Nominal Diterima:* *${formatRupiah(p.paidThisTime)}*

📊 *Rincian Status Tagihan:*
- Total Tagihan: ${formatRupiah(p.totalAmount)}
- Total Terbayar: ${formatRupiah(p.totalPaid)}
- ⚠️ *Sisa Tagihan:* *${formatRupiah(p.remainingAmount)}*
${docSection}
Bukti pembayaran resmi ini tersimpan secara digital di sistem kami.

Terima kasih banyak atas perhatian dan kerja sama baiknya Kak, have a nice day! 😊🙏
_— Admin Kos ${p.propertyName}_`;
	},

	/**
	 * Template Pengingat Sisa Cicilan Menjelang Akhir Bulan
	 */
	installmentReminder(p: InstallmentReminderTemplateParams): string {
		const docSection = p.documentUrl
			? `\n📄 *Tautan Invoice Digital:* ${p.documentUrl}\n`
			: "";

		return `🔔 *PENGINGAT SISA CICILAN SEWA*

Halo Kak *${p.tenantName}*! 👋
Mengingatkan kembali perihal sisa tagihan sewa kos di *${p.propertyName}* (Kamar ${p.roomNumber}) untuk periode *${p.period}*:

📄 *No. Invoice:* ${p.invoiceNumber}
💵 *Total Tagihan:* ${formatRupiah(p.totalAmount)}
✅ *Sudah Dibayar:* ${formatRupiah(p.totalPaid)}
⏳ *Sisa Pelunasan:* *${formatRupiah(p.remainingAmount)}*
📅 *Batas Waktu Pelunasan:* Sebelum akhir bulan (${p.endOfMonthDate})
${docSection}
Pembayaran dapat ditransfer ke rekening:
🏦 *${p.bankAccount || "BCA 8735081290"}* a.n. *${p.accountHolder || "Bude Frisda"}*

Terima kasih banyak atas perhatian dan kerja sama baiknya Kak, have a nice day! 😊🙏
_— Admin Kos ${p.propertyName}_`;
	},

	/**
	 * Template Ucapan Selamat Ulang Tahun Penghuni Kos
	 */
	birthdayWish(p: BirthdayWishTemplateParams): string {
		return `🎂🎉 *SELAMAT ULANG TAHUN, KAK ${p.tenantName}!* 🎉🎂

Keluarga besar *${p.propertyName}* mengucapkan selamat bertambah usia! 🎈✨

Semoga di usia yang baru ini senantiasa diberikan kesehatan, kebahagiaan, kemudahan dalam setiap urusan/pekerjaan, serta tercapai segala cita-cita yang diimpikan.

Terima kasih telah menjadi bagian berharga dari keluarga hunian kami. Semoga betah dan selalu nyaman tinggal di *${p.propertyName}*! 🌿🏡
_— Admin Kos ${p.propertyName}_`;
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
		const sender = p.propertyName
			? `_— Admin Kos ${p.propertyName}_`
			: "_— Admin Kos_";

		return `*${categoryBadge}*
━━━━━━━━━━━━━━━━━━━━━
📌 *${p.title}*${propertyBadge}

${p.message}

━━━━━━━━━━━━━━━━━━━━━
_Mohon diperhatikan oleh seluruh penghuni demi kenyamanan bersama. Terima kasih!_ 🙏
${sender}`;
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
