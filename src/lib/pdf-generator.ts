import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatRupiah } from "./currency.ts";

export interface InvoicePdfData {
	invoiceNumber: string;
	propertyName: string;
	tenantName: string;
	roomNumber: string;
	tenantPhone?: string;
	period: string;
	createdDate: string;
	dueDate: string;
	amount: number;
	status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIAL";
	paidDate?: string | null;
	description?: string;
	bankName?: string;
	bankAccount?: string;
	accountHolder?: string;
	bankAccountInfo?: string | null;
}

/**
 * In-Memory PDF Generator Engine menggunakan `pdf-lib` murni
 * Sangat ringan (<10MB RAM) dan cepat (<50ms) untuk VPS Linux 2GB.
 */
export async function generateInvoicePdf(
	data: InvoicePdfData,
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	// Ukuran A4 standar (595.28 x 841.89 points)
	const page = pdfDoc.addPage([595.28, 841.89]);
	const { width, height } = page.getSize();

	const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	// Palet Sage & Cream Tokens
	const sageDark = rgb(0.31, 0.41, 0.35); // #4f6958
	const sageLight = rgb(0.91, 0.94, 0.92); // #e8f0ea
	const sagePale = rgb(0.95, 0.97, 0.95); // #f3f7f3
	const charcoal = rgb(0.15, 0.16, 0.15); // #252925
	const mutedGray = rgb(0.45, 0.47, 0.45); // #737873
	const borderGray = rgb(0.89, 0.91, 0.89); // #e4e9e4
	const greenSuccess = rgb(0.34, 0.5, 0.38); // #568062
	const amberWarning = rgb(0.69, 0.54, 0.29); // #b18a4b
	const redDanger = rgb(0.65, 0.37, 0.36); // #a65f5b

	const isPaid = data.status === "PAID";
	const isOverdue = data.status === "OVERDUE";
	const isPartial = data.status === "PARTIAL";

	const statusColor = isPaid
		? greenSuccess
		: isOverdue
			? redDanger
			: amberWarning;

	const stampText = isPaid
		? "LUNAS"
		: isOverdue
			? "TERLAMBAT"
			: isPartial
				? "CICILAN"
				: "BELUM LUNAS";

	const statusDescription = isPaid
		? "SUDAH DIVERIFIKASI LUNAS"
		: isOverdue
			? "TAGIHAN TERLAMBAT"
			: isPartial
				? "PEMBAYARAN CICILAN"
				: "BELUM LUNAS";

	const margin = 40;
	let currentY = height - margin;

	// ─── 1. Header & Branding ──────────────────────────────────────────
	// Logo Box
	page.drawRectangle({
		x: margin,
		y: currentY - 32,
		width: 36,
		height: 36,
		color: sageDark,
	});
	page.drawText("HK", {
		x: margin + 8,
		y: currentY - 22,
		size: 16,
		font: fontBold,
		color: rgb(1, 1, 1),
	});

	// Property Name
	page.drawText(data.propertyName || "HomeeKost Management", {
		x: margin + 48,
		y: currentY - 14,
		size: 16,
		font: fontBold,
		color: charcoal,
	});
	page.drawText("Sistem Manajemen Pengelolaan Hunian Kos Digital", {
		x: margin + 48,
		y: currentY - 28,
		size: 9,
		font: fontRegular,
		color: mutedGray,
	});

	// Right Header (Doc Type & Number)
	const docTypeTitle = isPaid
		? "KWITANSI PELUNASAN RESMI"
		: "INVOICE SEWA DIGITAL";
	const docTypeWidth = fontBold.widthOfTextAtSize(docTypeTitle, 9);

	// Badge background
	page.drawRectangle({
		x: width - margin - docTypeWidth - 16,
		y: currentY - 10,
		width: docTypeWidth + 16,
		height: 18,
		color: sageLight,
	});
	page.drawText(docTypeTitle, {
		x: width - margin - docTypeWidth - 8,
		y: currentY - 5,
		size: 9,
		font: fontBold,
		color: sageDark,
	});

	const invNumWidth = fontBold.widthOfTextAtSize(data.invoiceNumber, 14);
	page.drawText(data.invoiceNumber, {
		x: width - margin - invNumWidth,
		y: currentY - 26,
		size: 14,
		font: fontBold,
		color: charcoal,
	});

	const dateText = `Terbit: ${data.createdDate}`;
	const dateWidth = fontRegular.widthOfTextAtSize(dateText, 9);
	page.drawText(dateText, {
		x: width - margin - dateWidth,
		y: currentY - 38,
		size: 9,
		font: fontRegular,
		color: mutedGray,
	});

	// Separator Line
	currentY -= 50;
	page.drawLine({
		start: { x: margin, y: currentY },
		end: { x: width - margin, y: currentY },
		thickness: 1.5,
		color: sageDark,
		opacity: 0.3,
	});

	// ─── 2. Status Stamp ───────────────────────────────────────────────
	currentY -= 15;
	page.drawRectangle({
		x: width - margin - 120,
		y: currentY - 28,
		width: 120,
		height: 28,
		borderColor: statusColor,
		borderWidth: 1.5,
	});
	page.drawText(stampText, {
		x: width - margin - 105,
		y: currentY - 18,
		size: 13,
		font: fontBold,
		color: statusColor,
	});

	// ─── 3. Tenant & Rental Meta Box ──────────────────────────────────
	currentY -= 45;
	const metaBoxHeight = 70;
	page.drawRectangle({
		x: margin,
		y: currentY - metaBoxHeight,
		width: width - margin * 2,
		height: metaBoxHeight,
		color: sagePale,
		borderColor: borderGray,
		borderWidth: 1,
	});

	// Left Column: Tenant
	page.drawText("DITAGIHKAN KEPADA:", {
		x: margin + 14,
		y: currentY - 18,
		size: 8,
		font: fontBold,
		color: mutedGray,
	});
	page.drawText(data.tenantName, {
		x: margin + 14,
		y: currentY - 34,
		size: 13,
		font: fontBold,
		color: charcoal,
	});
	page.drawText(
		`Kamar: ${data.roomNumber} ${data.tenantPhone ? ` | Telp: ${data.tenantPhone}` : ""}`,
		{
			x: margin + 14,
			y: currentY - 48,
			size: 9,
			font: fontRegular,
			color: mutedGray,
		},
	);
	page.drawText(`Periode Sewa: ${data.period}`, {
		x: margin + 14,
		y: currentY - 60,
		size: 9,
		font: fontBold,
		color: sageDark,
	});

	// Right Column: Payment Status Meta
	page.drawText("STATUS DOKUMEN:", {
		x: width / 2 + 30,
		y: currentY - 18,
		size: 8,
		font: fontBold,
		color: mutedGray,
	});
	page.drawText(statusDescription, {
		x: width / 2 + 30,
		y: currentY - 34,
		size: 11,
		font: fontBold,
		color: statusColor,
	});
	page.drawText(
		isPaid
			? `Tanggal Lunas: ${data.paidDate || data.dueDate}`
			: `Batas Jatuh Tempo: ${data.dueDate}`,
		{
			x: width / 2 + 30,
			y: currentY - 50,
			size: 9,
			font: fontRegular,
			color: mutedGray,
		},
	);

	// ─── 4. Itemized Charges Table ─────────────────────────────────────
	currentY -= metaBoxHeight + 25;
	const tableWidth = width - margin * 2;

	// Table Header
	page.drawRectangle({
		x: margin,
		y: currentY - 24,
		width: tableWidth,
		height: 24,
		color: sageLight,
	});
	page.drawText("RINCIAN DESKRIPSI", {
		x: margin + 12,
		y: currentY - 16,
		size: 9,
		font: fontBold,
		color: sageDark,
	});
	page.drawText("NOMINAL (RP)", {
		x: width - margin - 90,
		y: currentY - 16,
		size: 9,
		font: fontBold,
		color: sageDark,
	});

	// Table Body Row
	currentY -= 24;
	const rowHeight = 44;
	page.drawRectangle({
		x: margin,
		y: currentY - rowHeight,
		width: tableWidth,
		height: rowHeight,
		borderColor: borderGray,
		borderWidth: 1,
	});
	page.drawText(
		data.description || `Biaya Sewa Kamar ${data.roomNumber} (${data.period})`,
		{
			x: margin + 12,
			y: currentY - 18,
			size: 10,
			font: fontBold,
			color: charcoal,
		},
	);
	page.drawText(
		"Fasilitas Termasuk: Wi-Fi Cepat, Air Bersih, Listrik & Keamanan 24 Jam",
		{
			x: margin + 12,
			y: currentY - 32,
			size: 8,
			font: fontRegular,
			color: mutedGray,
		},
	);

	const amountFormatted = formatRupiah(data.amount);
	const amountWidth = fontBold.widthOfTextAtSize(amountFormatted, 11);
	page.drawText(amountFormatted, {
		x: width - margin - amountWidth - 12,
		y: currentY - 24,
		size: 11,
		font: fontBold,
		color: charcoal,
	});

	// ─── 5. Total Banner ───────────────────────────────────────────────
	currentY -= rowHeight + 15;
	const totalBannerHeight = 38;
	page.drawRectangle({
		x: margin,
		y: currentY - totalBannerHeight,
		width: tableWidth,
		height: totalBannerHeight,
		color: sagePale,
		borderColor: sageLight,
		borderWidth: 1,
	});

	page.drawText(isPaid ? "TOTAL PEMBAYARAN DITERIMA:" : "TOTAL TAGIHAN SEWA:", {
		x: margin + 14,
		y: currentY - 22,
		size: 10,
		font: fontBold,
		color: sageDark,
	});

	const grandTotalFormatted = formatRupiah(data.amount);
	const grandTotalWidth = fontBold.widthOfTextAtSize(grandTotalFormatted, 14);
	page.drawText(grandTotalFormatted, {
		x: width - margin - grandTotalWidth - 14,
		y: currentY - 24,
		size: 14,
		font: fontBold,
		color: sageDark,
	});

	// ─── 6. Bank Transfer Instructions (Only for Pending Invoices) ────
	if (!isPaid) {
		currentY -= totalBannerHeight + 18;
		const bankBoxHeight = 56;
		page.drawRectangle({
			x: margin,
			y: currentY - bankBoxHeight,
			width: tableWidth,
			height: bankBoxHeight,
			color: sagePale,
			borderColor: borderGray,
			borderWidth: 1,
		});

		page.drawText("PETUNJUK TRANSFER PEMBAYARAN RESMI:", {
			x: margin + 12,
			y: currentY - 14,
			size: 8,
			font: fontBold,
			color: charcoal,
		});

		if (data.bankAccountInfo?.trim()) {
			page.drawText(data.bankAccountInfo.trim(), {
				x: margin + 12,
				y: currentY - 30,
				size: 11,
				font: fontBold,
				color: charcoal,
			});
			page.drawText("Transfer sesuai rekening resmi properti di atas", {
				x: margin + 12,
				y: currentY - 44,
				size: 8.5,
				font: fontRegular,
				color: mutedGray,
			});
		} else {
			page.drawText(`Bank: ${data.bankName || "BCA (Bank Central Asia)"}`, {
				x: margin + 12,
				y: currentY - 28,
				size: 9,
				font: fontRegular,
				color: mutedGray,
			});
			page.drawText(`No. Rekening: ${data.bankAccount || "8735081290"}`, {
				x: margin + 12,
				y: currentY - 42,
				size: 11,
				font: fontBold,
				color: charcoal,
			});
			page.drawText(
				`Atas Nama: ${data.accountHolder || "Bude Frisda / Pengelola Kos"}`,
				{
					x: width / 2 + 10,
					y: currentY - 42,
					size: 9,
					font: fontBold,
					color: mutedGray,
				},
			);
		}
		currentY -= bankBoxHeight;
	} else {
		currentY -= totalBannerHeight;
	}

	// ─── 7. Footer & Signature ─────────────────────────────────────────
	currentY -= 40;
	page.drawLine({
		start: { x: margin, y: currentY },
		end: { x: width - margin, y: currentY },
		thickness: 1,
		color: borderGray,
	});

	page.drawText(
		"Dokumen ini diterbitkan secara sah dan resmi melalui sistem manajemen operasional HomeeKost.",
		{
			x: margin,
			y: currentY - 16,
			size: 8,
			font: fontRegular,
			color: mutedGray,
		},
	);
	page.drawText(
		"Harap simpan dokumen PDF ini sebagai bukti transaksi sewa hunian Anda.",
		{
			x: margin,
			y: currentY - 28,
			size: 8,
			font: fontRegular,
			color: mutedGray,
		},
	);

	// Signature
	const sigTitle = "Pengelola Kos,";
	page.drawText(sigTitle, {
		x: width - margin - 120,
		y: currentY - 16,
		size: 9,
		font: fontRegular,
		color: mutedGray,
	});
	page.drawText(data.propertyName || "Manajemen Kos", {
		x: width - margin - 120,
		y: currentY - 50,
		size: 9,
		font: fontBold,
		color: charcoal,
	});

	return pdfDoc.save();
}
