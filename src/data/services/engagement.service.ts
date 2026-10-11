import type { SessionUser } from "../../common/types/index.ts";
import type { BroadcastAnnouncementInput } from "../../common/validations/index.ts";
import type {
	AnnouncementCategory,
	NotificationStatus,
	NotificationType,
} from "../../generated/prisma/client.js";
import { sleepWithJitter } from "../../lib/async-utils.ts";
import { formatDate, formatRentalPeriod } from "../../lib/date-utils.ts";
import { type FonnteClient, fonnteClient } from "../../lib/fonnte-client.ts";
import { getEndOfMonthString } from "../../lib/payment-utils.ts";
import {
	getWhatsAppDirectUrl,
	sanitizePhoneNumber,
} from "../../lib/phone-sanitizer.ts";
import { whatsappTemplates } from "../../lib/whatsapp-templates.ts";
import {
	type EngagementRepository,
	engagementRepository,
} from "../repositories/engagement.repository.ts";
import {
	type InvoiceRepository,
	invoiceRepository,
} from "../repositories/invoice.repository.ts";
import {
	type PropertyRepository,
	propertyRepository,
} from "../repositories/property.repository.ts";
import {
	type TenantRepository,
	tenantRepository,
} from "../repositories/tenant.repository.ts";

export class EngagementService {
	constructor(
		private readonly repo: EngagementRepository = engagementRepository,
		private readonly tenantRepo: TenantRepository = tenantRepository,
		private readonly propertyRepo: PropertyRepository = propertyRepository,
		private readonly invoiceRepo: InvoiceRepository = invoiceRepository,
		private readonly fonnte: FonnteClient = fonnteClient,
	) {}

	/**
	 * Dapatkan data Dashboard Engagement Hub dengan Isolasi RBAC
	 */
	async getEngagementDashboard(user?: SessionUser) {
		const userPropertyId = user?.assignedPropertyId;
		const isAdmin = user?.role?.name === "ADMIN";

		const propertyIds =
			isAdmin && userPropertyId ? [userPropertyId] : undefined;

		const [upcomingBirthdays, recentAnnouncements, recentLogs] =
			await Promise.all([
				this.repo.getUpcomingBirthdays(propertyIds, 30),
				this.repo.getRecentAnnouncements(propertyIds, 10),
				this.repo.getNotificationLogs(15),
			]);

		return {
			upcomingBirthdays,
			recentAnnouncements,
			recentLogs,
			totalUpcomingBirthdays: upcomingBirthdays.length,
		};
	}

	/**
	 * Kirim Ucapan Selamat Ulang Tahun Personal via WhatsApp
	 */
	async sendBirthdayWish(tenantId: string, user?: SessionUser) {
		const tenant = await this.tenantRepo.findById(tenantId);
		if (!tenant) {
			throw new Error("Data penyewa tidak ditemukan.");
		}

		// Cari kontrak aktif dan nama kos
		const activeContract = tenant.rentalContracts?.find(
			(c) => c.status === "ACTIVE",
		);

		const propertyName = activeContract?.room?.property?.name || "HomeeKost";
		const propertyId = activeContract?.room?.property?.id;

		// Validasi RBAC untuk Admin
		if (
			user?.role?.name === "ADMIN" &&
			user?.assignedPropertyId &&
			propertyId &&
			propertyId !== user.assignedPropertyId
		) {
			throw new Error(
				"Anda hanya dapat mengirimkan ucapan ke penyewa di cabang kos Anda.",
			);
		}

		const phone = tenant.whatsappNumber || tenant.phoneNumber;
		if (!phone) {
			throw new Error("Nomor WhatsApp penyewa tidak tersedia.");
		}

		const message = whatsappTemplates.birthdayWish({
			tenantName: tenant.name,
			propertyName,
		});

		const sanitizedPhone = sanitizePhoneNumber(phone);
		const directWhatsAppUrl = getWhatsAppDirectUrl(sanitizedPhone, message);

		const apiRes = await this.fonnte.sendText({
			target: sanitizedPhone,
			message,
		});

		const status: NotificationStatus = apiRes.status ? "SENT" : "FAILED";
		const log = await this.repo.recordNotificationLog(
			sanitizedPhone,
			"BIRTHDAY_WISH",
			status,
			`Ultah Kak ${tenant.name} (${propertyName}) — ${apiRes.detail || (apiRes.status ? "Success" : "Failed")}`,
		);

		return {
			success: apiRes.status,
			directWhatsAppUrl,
			message,
			detail: apiRes.detail,
			logId: log.id,
		};
	}

	/**
	 * Broadcast Pengumuman Kos ke Seluruh / Sebagian Penghuni Aktif (Batch Insert Log)
	 */
	async broadcastAnnouncement(
		input: BroadcastAnnouncementInput,
		user?: SessionUser,
	) {
		const isAdmin = user?.role?.name === "ADMIN";
		const userPropertyId = user?.assignedPropertyId;

		// Validasi RBAC Ketat
		let targetPropertyId = input.propertyId || null;
		if (isAdmin) {
			if (!userPropertyId) {
				throw new Error("Admin cabang belum di-assign ke cabang kos manapun.");
			}
			targetPropertyId = userPropertyId;
		}

		// 1. Simpan catatan pengumuman ke database
		const announcement = await this.repo.createAnnouncement({
			propertyId: targetPropertyId,
			title: input.title,
			content: input.content,
			category: input.category as AnnouncementCategory,
			isBroadcast: input.isBroadcast,
			sentAt: new Date(),
		});

		let sentCount = 0;
		let failedCount = 0;

		// 2. Jika opsi kirim broadcast diaktifkan, tembakkan WhatsApp ke seluruh penyewa aktif
		if (input.isBroadcast) {
			const recipients =
				await this.repo.getActiveTenantsForBroadcast(targetPropertyId);

			const notificationLogs: Array<{
				recipientNumber: string;
				messageType: NotificationType;
				status: NotificationStatus;
				notes?: string | null;
			}> = [];

			for (const r of recipients) {
				const message = whatsappTemplates.announcement({
					category: input.category,
					title: input.title,
					message: input.content,
					propertyName: r.propertyName,
				});

				const sanitizedPhone = sanitizePhoneNumber(r.phone);
				if (!sanitizedPhone) continue;

				try {
					const res = await this.fonnte.sendText({
						target: sanitizedPhone,
						message,
					});

					const status: NotificationStatus = res.status ? "SENT" : "FAILED";
					notificationLogs.push({
						recipientNumber: sanitizedPhone,
						messageType: "ANNOUNCEMENT",
						status,
						notes: `Broadcast: ${input.title} (Kamar ${r.roomNumber} - ${r.name})`,
					});

					if (res.status) sentCount++;
					else failedCount++;
				} catch (err) {
					console.error(
						`[EngagementService] Gagal broadcast ke ${r.phone}:`,
						err,
					);
					notificationLogs.push({
						recipientNumber: sanitizedPhone,
						messageType: "ANNOUNCEMENT",
						status: "FAILED",
						notes: `Broadcast Error: ${input.title} (Kamar ${r.roomNumber} - ${r.name})`,
					});
					failedCount++;
				}

				// Pacing jeda anti-ban Meta (~800ms - 1200ms) antar nomor WhatsApp
				await sleepWithJitter(800, 400);
			}

			// Batch Insert semua log notifikasi broadcast sekaligus (Zero N+1 Query)
			if (notificationLogs.length > 0) {
				await this.repo.recordNotificationLogsBatch(notificationLogs);
			}
		}

		return {
			success: true,
			announcementId: announcement.id,
			sentCount,
			failedCount,
			isBroadcast: input.isBroadcast,
		};
	}

	/**
	 * Hapus pengumuman kos
	 */
	async deleteAnnouncement(id: string, _user?: SessionUser) {
		await this.repo.deleteAnnouncement(id);
		return { success: true, id };
	}

	/**
	 * Engine Otomasi Cron Harian (Pemeriksaan Jatuh Tempo & Ucapan Ulang Tahun Teroptimasi via Map)
	 */
	async runDailyCronTasks() {
		const startTime = Date.now();
		let overdueUpdatedCount = 0;
		let dueRemindersSent = 0;
		let birthdayWishesSent = 0;

		const notificationLogsToBatch: Array<{
			recipientNumber: string;
			messageType: NotificationType;
			status: NotificationStatus;
			notes?: string | null;
		}> = [];

		// ─── Task 0: Auto-generate Tagihan Invoice untuk Bulan Aktif / Periode Mendatang ─
		try {
			const now = new Date();
			const curMonth = now.getMonth() + 1;
			const curYear = now.getFullYear();

			const properties = await this.propertyRepo.findAll();
			for (const prop of properties) {
				// Generate invoice bulan berjalan (jika belum ada)
				await this.invoiceRepo.generateMonthlyInvoicesForProperty(
					prop.id,
					curMonth,
					curYear,
				);

				// Jika tanggal sudah mendekati akhir bulan (>= 25), siapkan juga invoice bulan depan
				if (now.getDate() >= 25) {
					const nextMonthDate = new Date(curYear, curMonth, 1);
					const nextMonth = nextMonthDate.getMonth() + 1;
					const nextYear = nextMonthDate.getFullYear();
					await this.invoiceRepo.generateMonthlyInvoicesForProperty(
						prop.id,
						nextMonth,
						nextYear,
					);
				}
			}
		} catch (cronGenErr) {
			console.error(
				"[EngagementService] Gagal auto-generate invoice pada cron:",
				cronGenErr,
			);
		}

		// ─── Task 1: Pemeriksaan Tagihan Jatuh Tempo (H-3, H-0, Overdue) ─
		const dueReminders = await this.repo.getDueInvoicesForReminder();
		const overdueInvoiceIds: string[] = [];

		// Map untuk deduplikasi per nomor telepon & pengelompokan penagihan
		const reminderQueue = new Map<
			string,
			{
				phone: string;
				tenantName: string;
				propertyName: string;
				roomNumber: string;
				invoiceNumber: string;
				period: string;
				dueDateStr: string;
				daysRemaining: number;
				amount: number;
				documentUrl: string;
				isPartial: boolean;
				paidAmount: number;
				remainingAmount: number;
				endOfMonthDate: string;
				reminderType: "H3" | "H0" | "OVERDUE" | "INSTALLMENT_EOM";
			}
		>();

		const appUrl = process.env.APP_URL || "http://localhost:3000";

		for (const item of dueReminders) {
			const inv = item.invoice;
			const tenant = inv.contract.tenant;
			const phone = tenant.whatsappNumber || tenant.phoneNumber;

			if (item.type === "OVERDUE" && inv.status === "PENDING") {
				overdueInvoiceIds.push(inv.id);
			}

			if (phone) {
				const sanitizedPhone = sanitizePhoneNumber(phone);
				if (!sanitizedPhone) continue;

				const dueDate = new Date(inv.dueDate);
				const period = formatRentalPeriod({
					periodMonth: inv.periodMonth,
					periodYear: inv.periodYear,
					startDate: inv.contract.startDate,
					endDate: inv.contract.endDate,
					billingCycle: inv.contract.billingCycle,
					dueDate: inv.dueDate,
				});

				const documentUrl =
					inv.pdfUrl || `${appUrl}/api/invoices/${inv.id}/document`;

				const endOfMonthDate = getEndOfMonthString(
					inv.periodYear ?? undefined,
					inv.periodMonth ?? undefined,
				);

				// Simpan ke antrean reminder Map keyed by invoice ID
				reminderQueue.set(inv.id, {
					phone: sanitizedPhone,
					tenantName: tenant.name,
					propertyName: inv.contract.room.property.name,
					roomNumber: inv.contract.room.roomNumber,
					invoiceNumber: inv.invoiceNumber,
					period,
					dueDateStr: formatDate(dueDate),
					daysRemaining: item.daysRemaining,
					amount: Number(inv.amount),
					documentUrl,
					isPartial: item.installmentSummary?.isPartial ?? false,
					paidAmount: item.installmentSummary?.paidAmount ?? 0,
					remainingAmount:
						item.installmentSummary?.remainingAmount ?? Number(inv.amount),
					endOfMonthDate,
					reminderType: item.type,
				});
			}
		}

		// Eksekusi pengiriman pesan WhatsApp untuk tagihan jatuh tempo & cicilan
		for (const [invId, rem] of reminderQueue.entries()) {
			let message: string;
			let noteLabel: string;

			if (rem.isPartial && rem.remainingAmount > 0) {
				message = whatsappTemplates.installmentReminder({
					tenantName: rem.tenantName,
					propertyName: rem.propertyName,
					roomNumber: rem.roomNumber,
					invoiceNumber: rem.invoiceNumber,
					period: rem.period,
					totalAmount: rem.amount,
					totalPaid: rem.paidAmount,
					remainingAmount: rem.remainingAmount,
					endOfMonthDate: rem.endOfMonthDate,
					documentUrl: rem.documentUrl,
				});
				noteLabel = `Cron Reminder Sisa Cicilan (#${rem.invoiceNumber}) [${invId}]`;
			} else {
				message = whatsappTemplates.dueReminder({
					tenantName: rem.tenantName,
					propertyName: rem.propertyName,
					roomNumber: rem.roomNumber,
					invoiceNumber: rem.invoiceNumber,
					period: rem.period,
					dueDate: rem.dueDateStr,
					daysRemaining: rem.daysRemaining,
					amount: rem.amount,
					bankAccount: "8735081290",
					accountHolder: "Bude Frisda",
					documentUrl: rem.documentUrl,
				});
				noteLabel = `Cron Reminder H${rem.daysRemaining >= 0 ? `-${rem.daysRemaining}` : `+${Math.abs(rem.daysRemaining)}`} (#${rem.invoiceNumber}) [${invId}]`;
			}

			try {
				const res = await this.fonnte.sendText({
					target: rem.phone,
					message,
				});

				const status: NotificationStatus = res.status ? "SENT" : "FAILED";
				notificationLogsToBatch.push({
					recipientNumber: rem.phone,
					messageType: "DUE_DATE_REMINDER",
					status,
					notes: `${noteLabel} — ${res.detail || (res.status ? "Success" : "Failed")}`,
				});

				if (res.status) dueRemindersSent++;
			} catch (err) {
				console.error(
					`[EngagementService] Gagal kirim reminder ke ${rem.phone}:`,
					err,
				);
				notificationLogsToBatch.push({
					recipientNumber: rem.phone,
					messageType: "DUE_DATE_REMINDER",
					status: "FAILED",
					notes: `Error Cron Reminder (#${rem.invoiceNumber})`,
				});
			}

			// Pacing jeda anti-ban Meta (~800ms - 1200ms) antar nomor WhatsApp
			await sleepWithJitter(800, 400);
		}

		// Update massal status invoice OVERDUE dalam 1 query
		if (overdueInvoiceIds.length > 0) {
			const updateRes =
				await this.repo.updateOverdueInvoices(overdueInvoiceIds);
			overdueUpdatedCount = updateRes.count;
		}

		// ─── Task 2: Birthday Reminder Engine (Hari H) ─────────────────
		const todaysBirthdays = await this.repo.getTodaysBirthdays();
		const birthdayQueue = new Map<string, (typeof todaysBirthdays)[0]>();

		// Map deduplikasi untuk memastikan 1 penyewa hanya dapat 1 ucapan jika punya multi-kamar
		for (const bday of todaysBirthdays) {
			if (bday.phone && !birthdayQueue.has(bday.tenantId)) {
				birthdayQueue.set(bday.tenantId, bday);
			}
		}

		for (const bday of birthdayQueue.values()) {
			const sanitizedPhone = sanitizePhoneNumber(bday.phone);
			if (!sanitizedPhone) continue;

			const message = whatsappTemplates.birthdayWish({
				tenantName: bday.name,
				propertyName: bday.propertyName,
			});

			try {
				const res = await this.fonnte.sendText({
					target: sanitizedPhone,
					message,
				});

				const status: NotificationStatus = res.status ? "SENT" : "FAILED";
				notificationLogsToBatch.push({
					recipientNumber: sanitizedPhone,
					messageType: "BIRTHDAY_WISH",
					status,
					notes: `Cron Ultah Kak ${bday.name} (${bday.propertyName})`,
				});

				if (res.status) birthdayWishesSent++;
			} catch (err) {
				console.error(
					`[EngagementService] Gagal kirim ucapan ultah ke ${sanitizedPhone}:`,
					err,
				);
				notificationLogsToBatch.push({
					recipientNumber: sanitizedPhone,
					messageType: "BIRTHDAY_WISH",
					status: "FAILED",
					notes: `Error Cron Ultah Kak ${bday.name}`,
				});
			}

			// Pacing jeda anti-ban Meta (~800ms - 1200ms) antar nomor WhatsApp
			await sleepWithJitter(800, 400);
		}

		// ─── Task 3: Batch Insert Semua Log Notifikasi dalam 1 Query ──
		if (notificationLogsToBatch.length > 0) {
			await this.repo.recordNotificationLogsBatch(notificationLogsToBatch);
		}

		const durationMs = Date.now() - startTime;

		return {
			success: true,
			overdueUpdatedCount,
			dueRemindersSent,
			birthdayWishesSent,
			totalProcessedInvoices: dueReminders.length,
			totalTodaysBirthdays: birthdayQueue.size,
			totalLogsRecorded: notificationLogsToBatch.length,
			durationMs,
			timestamp: new Date().toISOString(),
		};
	}
}

export const engagementService = new EngagementService();
