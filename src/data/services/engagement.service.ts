import type { SessionUser } from "../../common/types/index.ts";
import type {
	BroadcastAnnouncementInput,
	BroadcastToSelectedRecipientsInput,
	SendSingleTemplateMessageInput,
} from "../../common/validations/index.ts";
import type {
	AnnouncementCategory,
	NotificationStatus,
	NotificationType,
} from "../../generated/prisma/client.js";
import { sleepWithJitter } from "../../lib/async-utils.ts";
import {
	formatRentalPeriod,
	getTodayDateString,
} from "../../lib/date-utils.ts";
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

		const [recipients, upcomingBirthdays, recentAnnouncements, recentLogs] =
			await Promise.all([
				this.repo.getActiveTenantsWithEngagementMetadata(propertyIds),
				this.repo.getUpcomingBirthdays(propertyIds, 30),
				this.repo.getRecentAnnouncements(propertyIds, 10),
				this.repo.getNotificationLogs(50),
			]);

		return {
			recipients,
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
	 * Kirim Pesan Berdasarkan Template ke Satu Penyewa Spesifik
	 */
	async sendSingleTemplateMessage(
		input: SendSingleTemplateMessageInput,
		user?: SessionUser,
	) {
		const tenant = await this.tenantRepo.findById(input.tenantId);
		if (!tenant) {
			throw new Error("Data penyewa tidak ditemukan.");
		}

		// Cari kontrak aktif dan relasi kamar & kos
		const activeContract = tenant.rentalContracts?.find(
			(c) => c.status === "ACTIVE",
		);
		if (!activeContract) {
			throw new Error("Penyewa tidak memiliki kontrak sewa aktif.");
		}

		const propertyName = activeContract.room?.property?.name || "HomeeKost";
		const propertyId = activeContract.room?.property?.id;
		const roomNumber = activeContract.room?.roomNumber || "-";

		// Validasi RBAC untuk Admin
		if (user?.role?.name === "ADMIN") {
			if (!user.assignedPropertyId) {
				throw new Error("Admin cabang belum di-assign ke cabang kos manapun.");
			}
			if (propertyId && propertyId !== user.assignedPropertyId) {
				throw new Error(
					"Anda hanya dapat mengirimkan pesan ke penyewa di cabang kos Anda.",
				);
			}
		}

		const phone = tenant.whatsappNumber || tenant.phoneNumber;
		if (!phone) {
			throw new Error("Nomor WhatsApp penyewa tidak tersedia.");
		}

		const sanitizedPhone = sanitizePhoneNumber(phone);
		if (!sanitizedPhone) {
			throw new Error("Nomor WhatsApp penyewa tidak valid.");
		}

		// Personalisasi placeholder {nama}, {kamar}, {kos}
		const message = input.templateContent
			.replace(/{nama}/gi, () => tenant.name)
			.replace(/{kamar}/gi, () => roomNumber)
			.replace(/{kos}/gi, () => propertyName)
			.replace(/{kost}/gi, () => propertyName);

		const apiRes = await this.fonnte.sendText({
			target: sanitizedPhone,
			message,
		});

		const status: NotificationStatus = apiRes.status ? "SENT" : "FAILED";
		const log = await this.repo.recordNotificationLog(
			sanitizedPhone,
			"ANNOUNCEMENT",
			status,
			`Pesan Template ke ${tenant.name} (${propertyName}) — ${apiRes.detail || (apiRes.status ? "Success" : "Failed")}`,
		);

		return {
			success: apiRes.status,
			message,
			detail: apiRes.detail,
			logId: log.id,
		};
	}

	/**
	 * Broadcast Pesan / Pengumuman Terseleksi ke Daftar Tenant Tertentu (Multi-Select)
	 */
	async broadcastToSelectedRecipients(
		input: BroadcastToSelectedRecipientsInput,
		user?: SessionUser,
	) {
		const uniqueTenantIds = Array.from(new Set(input.tenantIds || []));
		if (uniqueTenantIds.length === 0) {
			throw new Error("Pilih minimal 1 penyewa tujuan broadcast.");
		}

		const isAdmin = user?.role?.name === "ADMIN";
		const userPropertyId = user?.assignedPropertyId;
		if (isAdmin && !userPropertyId) {
			throw new Error("Admin cabang belum di-assign ke cabang kos manapun.");
		}
		const propertyIds =
			isAdmin && userPropertyId ? [userPropertyId] : undefined;

		// Ambil seluruh penyewa aktif dengan metadata untuk properti yang diizinkan
		const allRecipients =
			await this.repo.getActiveTenantsWithEngagementMetadata(propertyIds);

		const selectedSet = new Set(uniqueTenantIds);
		const targetRecipients = allRecipients.filter((r) =>
			selectedSet.has(r.tenantId),
		);

		if (targetRecipients.length === 0) {
			throw new Error(
				"Tidak ada penyewa aktif yang cocok dengan pilihan tujuan broadcast.",
			);
		}

		// Jika input.title disertakan, simpan juga sebagai catatan pengumuman
		if (input.title) {
			const targetPropertyId = isAdmin ? userPropertyId : null;
			await this.repo.createAnnouncement({
				propertyId: targetPropertyId,
				title: input.title,
				content: input.templateContent,
				category: "UMUM",
				isBroadcast: true,
				sentAt: new Date(),
			});
		}

		let sentCount = 0;
		let failedCount = uniqueTenantIds.length - targetRecipients.length;

		const notificationLogs: Array<{
			recipientNumber: string;
			messageType: NotificationType;
			status: NotificationStatus;
			notes?: string | null;
		}> = [];

		for (const r of targetRecipients) {
			const sanitizedPhone = sanitizePhoneNumber(r.phone);
			if (!sanitizedPhone) {
				failedCount++;
				continue;
			}

			const message = input.templateContent
				.replace(/{nama}/gi, () => r.name)
				.replace(/{kamar}/gi, () => r.roomNumber)
				.replace(/{kos}/gi, () => r.propertyName)
				.replace(/{kost}/gi, () => r.propertyName);

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
					notes: `Broadcast Selektif: ${input.title || "Pesan"} (Kamar ${r.roomNumber} - ${r.name})`,
				});

				if (res.status) {
					sentCount++;
				} else {
					failedCount++;
				}
			} catch (err) {
				console.error(
					`[EngagementService] Gagal broadcast selektif ke ${sanitizedPhone}:`,
					err,
				);
				notificationLogs.push({
					recipientNumber: sanitizedPhone,
					messageType: "ANNOUNCEMENT",
					status: "FAILED",
					notes: `Error Broadcast Selektif: ${input.title || "Pesan"} (Kamar ${r.roomNumber} - ${r.name})`,
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

		return {
			success: true,
			sentCount,
			failedCount,
			totalRecipients: input.tenantIds.length,
		};
	}

	/**
	 * Engine Otomasi Cron Harian (Pemeriksaan Jatuh Tempo & Ucapan Ulang Tahun Teroptimasi via Map)
	 */
	async runDailyCronTasks() {
		const startTime = Date.now();
		let overdueUpdatedCount = 0;
		let dueRemindersSent = 0;
		let dueRemindersSkipped = 0;
		let birthdayWishesSent = 0;
		let birthdaysSkipped = 0;

		const notificationLogsToBatch: Array<{
			recipientNumber: string;
			messageType: NotificationType;
			status: NotificationStatus;
			notes?: string | null;
		}> = [];

		// ─── Pre-flight Optimization: Ambil log notifikasi sukses hari ini (Anti-Spam Idempotency)
		// Query super cepat & ringan (< 5ms): hanya ambil kolom minimal yang berstatus SENT hari ini
		const todayStr = getTodayDateString();
		const startOfDay = new Date(`${todayStr}T00:00:00+07:00`);
		const endOfDay = new Date(`${todayStr}T23:59:59.999+07:00`);

		const todaySentLogs = await this.repo.getTodaySentNotificationLogs(
			startOfDay,
			endOfDay,
		);

		// Himpun set token unik & identifier yang sudah terkirim hari ini (O(1) in-memory lookup)
		const sentTokensToday = new Set<string>();
		const sentInvoiceIdsToday = new Set<string>();
		const sentBirthdayPhonesToday = new Set<string>();

		for (const log of todaySentLogs) {
			if (log.notes) {
				const tokenMatch = log.notes.match(/\[(TOKEN:[^\]]+)\]/);
				if (tokenMatch) {
					sentTokensToday.add(tokenMatch[1]);
				}
				const invMatch = log.notes.match(/\[([a-zA-Z0-9_-]{15,})\]/);
				if (invMatch) {
					sentInvoiceIdsToday.add(invMatch[1]);
				}
			}
			if (log.messageType === "BIRTHDAY_WISH") {
				sentBirthdayPhonesToday.add(log.recipientNumber);
			}
		}

		// ─── Task 0: Auto-generate Tagihan Invoice untuk Bulan Aktif / Periode Mendatang ─
		const now = new Date();
		const curMonth = now.getMonth() + 1;
		const curYear = now.getFullYear();

		try {
			const properties = await this.propertyRepo.findAll();
			await Promise.all(
				properties.map(async (prop) => {
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
				}),
			);
		} catch (cronGenErr) {
			console.error(
				"[EngagementService] Gagal auto-generate invoice pada cron:",
				cronGenErr,
			);
		}

		// ─── Task 1 & 2 Query: Query Reminders (Tgl 1 & Tgl 5) & Birthdays secara Paralel (<10ms) ─
		const dayOfMonth = now.getDate();
		const isFirstDayOfMonth = dayOfMonth === 1;
		const isFifthDayOfMonth = dayOfMonth === 5;
		const isReminderDay = isFirstDayOfMonth || isFifthDayOfMonth;

		const [dueReminders, todaysBirthdays] = await Promise.all([
			isReminderDay
				? this.repo.getFirstOfMonthInvoicesForReminder(curMonth, curYear)
				: Promise.resolve([]),
			this.repo.getTodaysBirthdays(),
		]);

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
				amount: number;
				documentUrl: string;
				bankAccountInfo?: string | null;
			}
		>();

		const appUrl = process.env.APP_URL || "http://localhost:3000";

		for (const item of dueReminders) {
			const inv = item.invoice;
			const tenant = inv.contract.tenant;
			const phone = tenant.whatsappNumber || tenant.phoneNumber;

			if (phone) {
				const sanitizedPhone = sanitizePhoneNumber(phone);
				if (!sanitizedPhone) continue;

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

				// Simpan ke antrean reminder Map keyed by invoice ID
				reminderQueue.set(inv.id, {
					phone: sanitizedPhone,
					tenantName: tenant.name,
					propertyName: inv.contract.room.property.name,
					roomNumber: inv.contract.room.roomNumber,
					invoiceNumber: inv.invoiceNumber,
					period,
					amount: Number(inv.amount),
					documentUrl,
					bankAccountInfo: inv.contract.room.property.bankAccountInfo,
				});
			}
		}

		// Eksekusi pengiriman pesan WhatsApp untuk tagihan tanggal 1 awal bulan & tanggal 5 jatuh tempo
		for (const [invId, rem] of reminderQueue.entries()) {
			const reminderTypeLabel = isFifthDayOfMonth ? "Tgl 5" : "Tgl 1";
			const invoiceToken = `TOKEN:REMINDER_${isFifthDayOfMonth ? "DAY5" : "DAY1"}:${invId}:${todayStr}`;

			// Pre-flight Idempotency Check: Lewati jika invoice ini sudah sukses dikirimi reminder hari ini
			if (sentTokensToday.has(invoiceToken) || sentInvoiceIdsToday.has(invId)) {
				dueRemindersSkipped++;
				continue;
			}

			const message = isFifthDayOfMonth
				? whatsappTemplates.monthlyFifthReminder({
						tenantName: rem.tenantName,
						propertyName: rem.propertyName,
						roomNumber: rem.roomNumber,
						invoiceNumber: rem.invoiceNumber,
						period: rem.period,
						amount: rem.amount,
						bankName: "BCA",
						bankAccount: "8735081290",
						accountHolder: "Bude Frisda",
						bankAccountInfo: rem.bankAccountInfo,
						documentUrl: rem.documentUrl,
					})
				: whatsappTemplates.monthlyFirstReminder({
						tenantName: rem.tenantName,
						propertyName: rem.propertyName,
						roomNumber: rem.roomNumber,
						invoiceNumber: rem.invoiceNumber,
						period: rem.period,
						amount: rem.amount,
						bankName: "BCA",
						bankAccount: "8735081290",
						accountHolder: "Bude Frisda",
						bankAccountInfo: rem.bankAccountInfo,
						documentUrl: rem.documentUrl,
					});

			const noteLabel = `[${invoiceToken}] Cron Tagihan ${reminderTypeLabel} (#${rem.invoiceNumber}) [${invId}]`;

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

				if (res.status) {
					dueRemindersSent++;
					sentTokensToday.add(invoiceToken);
					sentInvoiceIdsToday.add(invId);
				}
			} catch (err) {
				console.error(
					`[EngagementService] Gagal kirim reminder ke ${rem.phone}:`,
					err,
				);
				notificationLogsToBatch.push({
					recipientNumber: rem.phone,
					messageType: "DUE_DATE_REMINDER",
					status: "FAILED",
					notes: `Error Cron Tagihan ${reminderTypeLabel} (#${rem.invoiceNumber})`,
				});
			}

			// Pacing jeda anti-ban Meta (~800ms - 1200ms) antar nomor WhatsApp
			await sleepWithJitter(800, 400);
		}

		// Update massal status invoice yang telah melewati batas jatuh tempo menjadi OVERDUE dalam 1 query
		const overdueRes = await this.repo.updateAllOverdueInvoices(now);
		overdueUpdatedCount = overdueRes.count;

		// ─── Task 2: Birthday Reminder Engine (Hari H) ─────────────────
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

			const bdayToken = `TOKEN:BIRTHDAY:${bday.tenantId}:${todayStr}`;

			// Pre-flight Idempotency Check: Lewati jika anak kos ini sudah dikirimi ucapan ultah hari ini
			if (
				sentTokensToday.has(bdayToken) ||
				sentBirthdayPhonesToday.has(sanitizedPhone)
			) {
				birthdaysSkipped++;
				continue;
			}

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
					notes: `[${bdayToken}] Cron Ultah Kak ${bday.name} (${bday.propertyName})`,
				});

				if (res.status) {
					birthdayWishesSent++;
					sentTokensToday.add(bdayToken);
					sentBirthdayPhonesToday.add(sanitizedPhone);
				}
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
			dueRemindersSkipped,
			birthdayWishesSent,
			birthdaysSkipped,
			totalProcessedInvoices: dueReminders.length,
			totalTodaysBirthdays: birthdayQueue.size,
			totalLogsRecorded: notificationLogsToBatch.length,
			durationMs,
			timestamp: new Date().toISOString(),
		};
	}
}

export const engagementService = new EngagementService();
