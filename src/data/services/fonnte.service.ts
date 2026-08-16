import { prisma } from "../../db.ts";
import type {
	NotificationStatus,
	NotificationType,
	PrismaClient,
} from "../../generated/prisma/client.js";
import { type FonnteClient, fonnteClient } from "../../lib/fonnte-client.ts";
import {
	getWhatsAppDirectUrl,
	sanitizePhoneNumber,
} from "../../lib/phone-sanitizer.ts";
import {
	type DueReminderTemplateParams,
	type InvoiceTemplateParams,
	type PaymentReceiptTemplateParams,
	whatsappTemplates,
} from "../../lib/whatsapp-templates.ts";

export interface SendWhatsAppResult {
	success: boolean;
	directWhatsAppUrl: string;
	message: string;
	detail?: string;
	logId?: string;
}

export interface WhatsAppAttachmentOptions {
	file?: Uint8Array | Buffer;
	url?: string;
	filename?: string;
}

export class FonnteService {
	constructor(
		private readonly client: FonnteClient = fonnteClient,
		private readonly db: PrismaClient = prisma,
	) {}

	/**
	 * Simpan log notifikasi ke database
	 */
	private async logNotification(
		recipientNumber: string,
		messageType: NotificationType,
		status: NotificationStatus,
		notes?: string,
	) {
		try {
			return await this.db.notificationLog.create({
				data: {
					recipientNumber: sanitizePhoneNumber(recipientNumber),
					messageType,
					status,
					notes: notes ? notes.slice(0, 500) : null,
					sentAt: new Date(),
				},
			});
		} catch (err) {
			console.error("[FonnteService] Failed to record notification log:", err);
			return null;
		}
	}

	/**
	 * Kirim Tagihan Invoice via WhatsApp (Fonnte API) + File PDF Langsung / Fallback Direct URL
	 */
	async sendInvoiceNotification(
		phoneNumber: string,
		params: InvoiceTemplateParams,
		attachment?: WhatsAppAttachmentOptions,
	): Promise<SendWhatsAppResult> {
		const message = whatsappTemplates.newInvoice(params);
		const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
		const directWhatsAppUrl = getWhatsAppDirectUrl(sanitizedPhone, message);

		let apiRes: { status: boolean; detail?: string } = {
			status: false,
			detail: "Failed to send message",
		};

		if (attachment?.file || attachment?.url) {
			apiRes = await this.client.sendFile({
				target: sanitizedPhone,
				message,
				file: attachment.file,
				url: attachment.url,
				filename: attachment.filename || `Invoice-${params.invoiceNumber}.pdf`,
			});
		} else {
			apiRes = await this.client.sendText({
				target: sanitizedPhone,
				message,
			});
		}

		const status: NotificationStatus = apiRes.status ? "SENT" : "FAILED";
		const log = await this.logNotification(
			sanitizedPhone,
			"INVOICE",
			status,
			`Invoice #${params.invoiceNumber} — ${apiRes.detail || (apiRes.status ? "Success" : "Failed")}`,
		);

		return {
			success: apiRes.status,
			directWhatsAppUrl,
			message,
			detail: apiRes.detail,
			logId: log?.id,
		};
	}

	/**
	 * Kirim Pengingat Jatuh Tempo (H-3, Hari H, atau Overdue)
	 */
	async sendDueReminder(
		phoneNumber: string,
		params: DueReminderTemplateParams,
		attachment?: WhatsAppAttachmentOptions,
	): Promise<SendWhatsAppResult> {
		const message = whatsappTemplates.dueReminder(params);
		const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
		const directWhatsAppUrl = getWhatsAppDirectUrl(sanitizedPhone, message);

		let apiRes: { status: boolean; detail?: string } = {
			status: false,
			detail: "Failed to send message",
		};

		if (attachment?.file || attachment?.url) {
			apiRes = await this.client.sendFile({
				target: sanitizedPhone,
				message,
				file: attachment.file,
				url: attachment.url,
				filename: attachment.filename || `Invoice-${params.invoiceNumber}.pdf`,
			});
		} else {
			apiRes = await this.client.sendText({
				target: sanitizedPhone,
				message,
			});
		}

		const status: NotificationStatus = apiRes.status ? "SENT" : "FAILED";
		const log = await this.logNotification(
			sanitizedPhone,
			"DUE_DATE_REMINDER",
			status,
			`Reminder H${params.daysRemaining >= 0 ? `-${params.daysRemaining}` : `+${Math.abs(params.daysRemaining)} Overdue`} #${params.invoiceNumber} — ${apiRes.detail || (apiRes.status ? "Success" : "Failed")}`,
		);

		return {
			success: apiRes.status,
			directWhatsAppUrl,
			message,
			detail: apiRes.detail,
			logId: log?.id,
		};
	}

	/**
	 * Kirim Kwitansi / Konfirmasi Pembayaran Lunas (Teks Lengkap + Lampiran PDF Langsung)
	 */
	async sendPaymentReceipt(
		phoneNumber: string,
		params: PaymentReceiptTemplateParams,
		attachment?: WhatsAppAttachmentOptions,
	): Promise<SendWhatsAppResult> {
		const message = whatsappTemplates.paymentReceipt(params);
		const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
		const directWhatsAppUrl = getWhatsAppDirectUrl(sanitizedPhone, message);

		let apiRes: { status: boolean; detail?: string } = {
			status: false,
			detail: "Failed to send message",
		};

		if (attachment?.file || attachment?.url) {
			apiRes = await this.client.sendFile({
				target: sanitizedPhone,
				message,
				file: attachment.file,
				url: attachment.url,
				filename: attachment.filename || `Kwitansi-${params.invoiceNumber}.pdf`,
			});
		} else {
			apiRes = await this.client.sendText({
				target: sanitizedPhone,
				message,
			});
		}

		const status: NotificationStatus = apiRes.status ? "SENT" : "FAILED";
		const log = await this.logNotification(
			sanitizedPhone,
			"INVOICE",
			status,
			`Kwitansi Lunas #${params.invoiceNumber} — ${apiRes.detail || (apiRes.status ? "Success" : "Failed")}`,
		);

		return {
			success: apiRes.status,
			directWhatsAppUrl,
			message,
			detail: apiRes.detail,
			logId: log?.id,
		};
	}

	/**
	 * Dapatkan riwayat log notifikasi terbaru
	 */
	async getRecentNotificationLogs(limit: number = 20) {
		return this.db.notificationLog.findMany({
			orderBy: { sentAt: "desc" },
			take: limit,
		});
	}
}

export const fonnteService = new FonnteService();
