import type { SessionUser } from "../../common/types/index.ts";
import type { BroadcastAnnouncementInput } from "../../common/validations/index.ts";
import type {
	AnnouncementCategory,
	NotificationStatus,
} from "../../generated/prisma/client.js";
import { formatDate, formatRentalPeriod } from "../../lib/date-utils.ts";
import { type FonnteClient, fonnteClient } from "../../lib/fonnte-client.ts";
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
	type TenantRepository,
	tenantRepository,
} from "../repositories/tenant.repository.ts";

export class EngagementService {
	constructor(
		private readonly repo: EngagementRepository = engagementRepository,
		private readonly tenantRepo: TenantRepository = tenantRepository,
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
	 * Broadcast Pengumuman Kos ke Seluruh / Sebagian Penghuni Aktif
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
					await this.repo.recordNotificationLog(
						sanitizedPhone,
						"ANNOUNCEMENT",
						status,
						`Broadcast: ${input.title} (Kamar ${r.roomNumber} - ${r.name})`,
					);

					if (res.status) sentCount++;
					else failedCount++;
				} catch (err) {
					console.error(
						`[EngagementService] Gagal broadcast ke ${r.phone}:`,
						err,
					);
					failedCount++;
				}
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
	 * Engine Otomasi Cron Harian (Pemeriksaan Jatuh Tempo & Ucapan Ulang Tahun)
	 */
	async runDailyCronTasks() {
		const startTime = Date.now();
		let overdueUpdatedCount = 0;
		let dueRemindersSent = 0;
		let birthdayWishesSent = 0;

		// ─── Task 1: Pemeriksaan Tagihan Jatuh Tempo (H-3, H-0, Overdue) ─
		const dueReminders = await this.repo.getDueInvoicesForReminder();
		const overdueInvoiceIds: string[] = [];

		for (const item of dueReminders) {
			const inv = item.invoice;
			const tenant = inv.contract.tenant;
			const phone = tenant.whatsappNumber || tenant.phoneNumber;

			if (item.type === "OVERDUE" && inv.status === "PENDING") {
				overdueInvoiceIds.push(inv.id);
			}

			if (phone) {
				const dueDate = new Date(inv.dueDate);
				const period = formatRentalPeriod({
					periodMonth: inv.periodMonth,
					periodYear: inv.periodYear,
					startDate: inv.contract.startDate,
					endDate: inv.contract.endDate,
					billingCycle: inv.contract.billingCycle,
				});

				const appUrl = process.env.APP_URL || "http://localhost:3000";
				const documentUrl =
					inv.pdfUrl || `${appUrl}/api/invoices/${inv.id}/document`;

				const message = whatsappTemplates.dueReminder({
					tenantName: tenant.name,
					propertyName: inv.contract.room.property.name,
					roomNumber: inv.contract.room.roomNumber,
					invoiceNumber: inv.invoiceNumber,
					period,
					dueDate: formatDate(dueDate),
					daysRemaining: item.daysRemaining,
					amount: Number(inv.amount),
					bankAccount: "8735081290",
					accountHolder: "Bude Frisda",
					documentUrl,
				});

				const sanitizedPhone = sanitizePhoneNumber(phone);
				const res = await this.fonnte.sendText({
					target: sanitizedPhone,
					message,
				});

				const status: NotificationStatus = res.status ? "SENT" : "FAILED";
				await this.repo.recordNotificationLog(
					sanitizedPhone,
					"DUE_DATE_REMINDER",
					status,
					`Cron Reminder H${item.daysRemaining >= 0 ? `-${item.daysRemaining}` : `+${Math.abs(item.daysRemaining)}`} (#${inv.invoiceNumber})`,
				);

				if (res.status) dueRemindersSent++;
			}
		}

		// Update massal status invoice OVERDUE
		if (overdueInvoiceIds.length > 0) {
			const updateRes =
				await this.repo.updateOverdueInvoices(overdueInvoiceIds);
			overdueUpdatedCount = updateRes.count;
		}

		// ─── Task 2: Birthday Reminder Engine (Hari H) ─────────────────
		const todaysBirthdays = await this.repo.getTodaysBirthdays();

		for (const bday of todaysBirthdays) {
			if (bday.phone) {
				const message = whatsappTemplates.birthdayWish({
					tenantName: bday.name,
					propertyName: bday.propertyName,
				});

				const sanitizedPhone = sanitizePhoneNumber(bday.phone);
				const res = await this.fonnte.sendText({
					target: sanitizedPhone,
					message,
				});

				const status: NotificationStatus = res.status ? "SENT" : "FAILED";
				await this.repo.recordNotificationLog(
					sanitizedPhone,
					"BIRTHDAY_WISH",
					status,
					`Cron Ultah Kak ${bday.name} (${bday.propertyName})`,
				);

				if (res.status) birthdayWishesSent++;
			}
		}

		const durationMs = Date.now() - startTime;

		return {
			success: true,
			overdueUpdatedCount,
			dueRemindersSent,
			birthdayWishesSent,
			totalProcessedInvoices: dueReminders.length,
			totalTodaysBirthdays: todaysBirthdays.length,
			durationMs,
			timestamp: new Date().toISOString(),
		};
	}
}

export const engagementService = new EngagementService();
