import { prisma } from "../../db.ts";
import type {
	AnnouncementCategory,
	NotificationStatus,
	NotificationType,
	PrismaClient,
} from "../../generated/prisma/client.js";
import { calculateInstallmentSummary } from "../../lib/payment-utils.ts";

export interface UpcomingBirthdayResult {
	id: string;
	tenantId: string;
	name: string;
	roomNumber: string;
	propertyName: string;
	propertyId: string;
	birthDate: string; // e.g. "10 Agustus"
	rawBirthDate: string; // ISO
	daysRemaining: number;
	relativeLabel: string; // "Hari ini", "Besok", "10 hari lagi"
	phone: string;
}

export interface BroadcastRecipient {
	tenantId: string;
	name: string;
	phone: string;
	propertyName: string;
	roomNumber: string;
}

const MONTH_NAMES = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

export class EngagementRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	/**
	 * Dapatkan daftar penghuni aktif yang berulang tahun dalam N hari ke depan (Deduplikasi via Map)
	 */
	async getUpcomingBirthdays(
		propertyIds?: string[],
		withinDays: number = 30,
	): Promise<UpcomingBirthdayResult[]> {
		const contracts = await this.db.rentalContract.findMany({
			where: {
				status: "ACTIVE",
				tenant: {
					status: "ACTIVE",
					birthDate: { not: null },
				},
				...(propertyIds && propertyIds.length > 0
					? {
							room: {
								propertyId: { in: propertyIds },
							},
						}
					: {}),
			},
			include: {
				tenant: true,
				room: {
					include: {
						property: true,
					},
				},
			},
		});

		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const currentYear = now.getFullYear();

		const birthdayMap = new Map<string, UpcomingBirthdayResult>();

		for (const contract of contracts) {
			const bdate = contract.tenant.birthDate;
			if (!bdate) continue;

			const birthMonth = bdate.getMonth();
			const birthDay = bdate.getDate();

			// Ulang tahun tahun ini
			let nextBirthday = new Date(currentYear, birthMonth, birthDay);
			nextBirthday.setHours(0, 0, 0, 0);

			// Jika sudah lewat tahun ini, hitung tahun depan
			if (nextBirthday.getTime() < now.getTime()) {
				nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
				nextBirthday.setHours(0, 0, 0, 0);
			}

			const diffTime = nextBirthday.getTime() - now.getTime();
			const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

			if (daysRemaining >= 0 && daysRemaining <= withinDays) {
				let relativeLabel = `${daysRemaining} hari lagi`;
				if (daysRemaining === 0) relativeLabel = "Hari ini 🎉";
				else if (daysRemaining === 1) relativeLabel = "Besok";

				const phone =
					contract.tenant.whatsappNumber || contract.tenant.phoneNumber || "";

				const tenantId = contract.tenant.id;
				// Deduplikasi via Map: simpan atau pertahankan yang hari tersisa paling sedikit
				if (
					!birthdayMap.has(tenantId) ||
					(birthdayMap.get(tenantId)?.daysRemaining ?? 999) > daysRemaining
				) {
					birthdayMap.set(tenantId, {
						id: `${contract.tenant.id}-${contract.id}`,
						tenantId: contract.tenant.id,
						name: contract.tenant.name,
						roomNumber: contract.room.roomNumber,
						propertyName: contract.room.property.name,
						propertyId: contract.room.property.id,
						birthDate: `${birthDay} ${MONTH_NAMES[birthMonth]}`,
						rawBirthDate: bdate.toISOString(),
						daysRemaining,
						relativeLabel,
						phone,
					});
				}
			}
		}

		// Urutkan berdasarkan yang paling dekat
		return Array.from(birthdayMap.values()).sort(
			(a, b) => a.daysRemaining - b.daysRemaining,
		);
	}

	/**
	 * Dapatkan penghuni aktif yang tepat berulang tahun HARI INI
	 */
	async getTodaysBirthdays(propertyIds?: string[]) {
		const allUpcoming = await this.getUpcomingBirthdays(propertyIds, 0);
		return allUpcoming.filter((item) => item.daysRemaining === 0);
	}

	/**
	 * Dapatkan daftar nomor telepon penyewa aktif untuk broadcast pengumuman (Deduplikasi via Map)
	 */
	async getActiveTenantsForBroadcast(
		propertyId?: string | null,
	): Promise<BroadcastRecipient[]> {
		const contracts = await this.db.rentalContract.findMany({
			where: {
				status: "ACTIVE",
				tenant: {
					status: "ACTIVE",
				},
				...(propertyId
					? {
							room: {
								propertyId,
							},
						}
					: {}),
			},
			include: {
				tenant: true,
				room: {
					include: {
						property: true,
					},
				},
			},
		});

		const uniqueMap = new Map<string, BroadcastRecipient>();

		for (const c of contracts) {
			const phone = c.tenant.whatsappNumber || c.tenant.phoneNumber;
			if (!phone) continue;

			if (!uniqueMap.has(c.tenant.id)) {
				uniqueMap.set(c.tenant.id, {
					tenantId: c.tenant.id,
					name: c.tenant.name,
					phone,
					propertyName: c.room.property.name,
					roomNumber: c.room.roomNumber,
				});
			}
		}

		return Array.from(uniqueMap.values());
	}

	/**
	 * Buat catatan pengumuman baru
	 */
	async createAnnouncement(data: {
		propertyId?: string | null;
		title: string;
		content: string;
		category: AnnouncementCategory;
		isBroadcast: boolean;
		sentAt?: Date;
	}) {
		return this.db.announcement.create({
			data: {
				propertyId: data.propertyId || null,
				title: data.title,
				content: data.content,
				category: data.category,
				isBroadcast: data.isBroadcast,
				sentAt: data.sentAt || new Date(),
			},
			include: {
				property: true,
			},
		});
	}

	/**
	 * Dapatkan riwayat pengumuman terbaru
	 */
	async getRecentAnnouncements(propertyIds?: string[], limit: number = 10) {
		return this.db.announcement.findMany({
			where:
				propertyIds && propertyIds.length > 0
					? {
							OR: [{ propertyId: null }, { propertyId: { in: propertyIds } }],
						}
					: {},
			include: {
				property: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		});
	}

	/**
	 * Hapus pengumuman berdasarkan ID
	 */
	async deleteAnnouncement(id: string) {
		return this.db.announcement.delete({
			where: { id },
		});
	}

	/**
	 * Dapatkan riwayat log notifikasi WhatsApp
	 */
	async getNotificationLogs(limit: number = 20) {
		return this.db.notificationLog.findMany({
			orderBy: {
				sentAt: "desc",
			},
			take: limit,
		});
	}

	/**
	 * Cari invoice PENDING yang memerlukan pengingat jatuh tempo hari ini (H-3, H-0, atau Overdue)
	 */
	async getDueInvoicesForReminder() {
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		const pendingInvoices = await this.db.invoice.findMany({
			where: {
				status: {
					in: ["PENDING", "OVERDUE"],
				},
				contract: {
					status: "ACTIVE",
					tenant: {
						status: "ACTIVE",
					},
				},
			},
			include: {
				transactions: {
					orderBy: { transactionDate: "asc" },
				},
				contract: {
					include: {
						tenant: true,
						room: {
							include: {
								property: true,
							},
						},
					},
				},
			},
		});

		const curYear = now.getFullYear();
		const curMonth = now.getMonth() + 1;
		const lastDayOfMonth = new Date(curYear, curMonth, 0).getDate();
		const daysToEndOfMonth = lastDayOfMonth - now.getDate();

		const reminders: {
			invoice: (typeof pendingInvoices)[0];
			daysRemaining: number;
			type: "H3" | "H0" | "OVERDUE" | "INSTALLMENT_EOM";
			installmentSummary: {
				paidAmount: number;
				remainingAmount: number;
				isPartial: boolean;
				installmentCount: number;
			};
		}[] = [];

		for (const inv of pendingInvoices) {
			const installmentSummary = calculateInstallmentSummary(
				Number(inv.amount),
				inv.transactions,
			);

			const dueDate = new Date(inv.dueDate);
			dueDate.setHours(0, 0, 0, 0);

			const diffTime = dueDate.getTime() - now.getTime();
			const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			// 1. Tagihan cicilan bertahap yang belum lunas
			if (
				installmentSummary.isPartial &&
				installmentSummary.remainingAmount > 0
			) {
				// Prioritas A: Pengingat H-3 sebelum akhir bulan
				if (daysToEndOfMonth === 3) {
					reminders.push({
						invoice: inv,
						daysRemaining,
						type: "INSTALLMENT_EOM",
						installmentSummary,
					});
					continue;
				}

				// Prioritas B: Pengingat berdasarkan jadwal jatuh tempo tagihan
				if (daysRemaining === 3) {
					reminders.push({
						invoice: inv,
						daysRemaining: 3,
						type: "H3",
						installmentSummary,
					});
				} else if (daysRemaining === 0) {
					reminders.push({
						invoice: inv,
						daysRemaining: 0,
						type: "H0",
						installmentSummary,
					});
				} else if (daysRemaining < 0) {
					reminders.push({
						invoice: inv,
						daysRemaining,
						type: "OVERDUE",
						installmentSummary,
					});
				}
				continue;
			}

			// 2. Tagihan reguler (belum dibayar sama sekali)
			if (daysRemaining === 3) {
				reminders.push({
					invoice: inv,
					daysRemaining: 3,
					type: "H3",
					installmentSummary,
				});
			} else if (daysRemaining === 0) {
				reminders.push({
					invoice: inv,
					daysRemaining: 0,
					type: "H0",
					installmentSummary,
				});
			} else if (daysRemaining < 0) {
				reminders.push({
					invoice: inv,
					daysRemaining,
					type: "OVERDUE",
					installmentSummary,
				});
			}
		}

		return reminders;
	}

	/**
	 * Update status invoice menjadi OVERDUE jika sudah lewat jatuh tempo
	 */
	async updateOverdueInvoices(invoiceIds: string[]) {
		if (invoiceIds.length === 0) return { count: 0 };
		return this.db.invoice.updateMany({
			where: {
				id: { in: invoiceIds },
				status: "PENDING",
			},
			data: {
				status: "OVERDUE",
			},
		});
	}

	/**
	 * Catat log notifikasi ke database (Single)
	 */
	async recordNotificationLog(
		recipientNumber: string,
		messageType: NotificationType,
		status: NotificationStatus,
		notes?: string,
	) {
		return this.db.notificationLog.create({
			data: {
				recipientNumber,
				messageType,
				status,
				notes: notes ? notes.slice(0, 500) : null,
				sentAt: new Date(),
			},
		});
	}

	/**
	 * Catat log notifikasi secara Batch / Massal (Mencegah N+1 INSERT Query)
	 */
	async recordNotificationLogsBatch(
		logs: Array<{
			recipientNumber: string;
			messageType: NotificationType;
			status: NotificationStatus;
			notes?: string | null;
			sentAt?: Date;
		}>,
	) {
		if (logs.length === 0) return { count: 0 };
		return this.db.notificationLog.createMany({
			data: logs.map((l) => ({
				recipientNumber: l.recipientNumber,
				messageType: l.messageType,
				status: l.status,
				notes: l.notes ? l.notes.slice(0, 500) : null,
				sentAt: l.sentAt || new Date(),
			})),
		});
	}
}

export const engagementRepository = new EngagementRepository();
