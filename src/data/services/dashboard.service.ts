import type {
	DashboardOverviewData,
	DashboardPropertySummaryItem,
	DashboardRecentActivityItem,
	DashboardRecentExpenseItem,
	DashboardTodayAttentionItem,
	GlobalSearchResultItem,
	SessionUser,
	TopbarNotificationItem,
	UpcomingPaymentItem,
} from "../../common/types/index.ts";
import { prisma } from "../../db.ts";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { formatRupiah } from "../../lib/currency.ts";

function formatRelativeNotificationTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	if (diffMinutes < 5) return "Baru saja";
	if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
	if (diffHours < 24 && date.getDate() === now.getDate()) {
		return `Hari ini ${hours}:${minutes}`;
	}
	if (
		diffDays === 1 ||
		(diffHours < 48 && date.getDate() === now.getDate() - 1)
	) {
		return `Kemarin ${hours}:${minutes}`;
	}
	return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
}

const MONTH_NAMES_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
];

export class DashboardService {
	constructor(private readonly db: PrismaClient = prisma) {}

	private formatJuta(val: number): string {
		if (val === 0) return "Rp0";
		const jt = val / 1_000_000;
		if (jt >= 1) {
			return `Rp${jt.toLocaleString("id-ID", {
				minimumFractionDigits: jt % 1 === 0 ? 0 : 1,
				maximumFractionDigits: 1,
			})} jt`;
		}
		return formatRupiah(val);
	}

	async getOverviewData(
		propertyId?: string | null,
		user?: SessionUser,
	): Promise<DashboardOverviewData> {
		const userPropertyId = user?.assignedPropertyId;
		let effectivePropertyId = propertyId;

		if (user?.role?.name === "ADMIN" && userPropertyId) {
			effectivePropertyId = userPropertyId;
		}

		const propertyFilter: Prisma.PropertyWhereInput = effectivePropertyId
			? { id: effectivePropertyId }
			: {};

		const propertyIds = effectivePropertyId ? [effectivePropertyId] : undefined;

		const now = new Date();
		const currentMonth = now.getMonth() + 1;
		const currentYear = now.getFullYear();

		const startOfCurrentMonth = new Date(
			currentYear,
			currentMonth - 1,
			1,
			0,
			0,
			0,
		);
		const endOfCurrentMonth = new Date(
			currentYear,
			currentMonth,
			0,
			23,
			59,
			59,
		);

		// 1. Agregasi Kamar & Status
		const roomWhere: Prisma.RoomWhereInput = propertyIds
			? { propertyId: { in: propertyIds } }
			: {};

		const rooms = await this.db.room.findMany({
			where: roomWhere,
			select: { id: true, status: true },
		});

		const totalRooms = rooms.length;
		let occupiedRooms = 0;
		let vacantRooms = 0;
		let maintenanceRooms = 0;

		for (const r of rooms) {
			if (r.status === "OCCUPIED") occupiedRooms++;
			else if (r.status === "MAINTENANCE") maintenanceRooms++;
			else vacantRooms++;
		}

		const occupancyRate =
			totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

		// 2. Agregasi Pendapatan Bulan Ini & Bulan Lalu
		const currentMonthPaidInvoices = await this.db.invoice.findMany({
			where: {
				periodMonth: currentMonth,
				periodYear: currentYear,
				status: "PAID",
				...(propertyIds
					? { contract: { room: { propertyId: { in: propertyIds } } } }
					: {}),
			},
			select: { amount: true },
		});

		const currentMonthTxIncome = await this.db.transaction.aggregate({
			where: {
				type: "INCOME",
				transactionDate: {
					gte: startOfCurrentMonth,
					lte: endOfCurrentMonth,
				},
				...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
			},
			_sum: { amount: true },
		});

		const paidInvSum = currentMonthPaidInvoices.reduce(
			(acc, i) => acc + Number(i.amount),
			0,
		);
		const txIncSum = Number(currentMonthTxIncome._sum.amount ?? 0);
		const currentMonthIncome = Math.max(paidInvSum, txIncSum);

		// Bulan lalu untuk growth %
		const lastMonthPaidInvoices = await this.db.invoice.findMany({
			where: {
				periodMonth: currentMonth === 1 ? 12 : currentMonth - 1,
				periodYear: currentMonth === 1 ? currentYear - 1 : currentYear,
				status: "PAID",
				...(propertyIds
					? { contract: { room: { propertyId: { in: propertyIds } } } }
					: {}),
			},
			select: { amount: true },
		});

		const lastMonthIncome = lastMonthPaidInvoices.reduce(
			(acc, i) => acc + Number(i.amount),
			0,
		);

		let incomeGrowth = "0%";
		if (lastMonthIncome > 0) {
			const growth =
				((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
			incomeGrowth = `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`;
		} else if (currentMonthIncome > 0) {
			incomeGrowth = "+100%";
		}

		// 3. Pengeluaran Bulan Ini
		const currentMonthExpenseAgg = await this.db.transaction.aggregate({
			where: {
				type: "EXPENSE",
				transactionDate: {
					gte: startOfCurrentMonth,
					lte: endOfCurrentMonth,
				},
				...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
			},
			_sum: { amount: true },
		});

		const currentMonthExpense = Number(currentMonthExpenseAgg._sum.amount ?? 0);

		// 4. Tagihan Jatuh Tempo & Belum Lunas
		const pendingInvoices = await this.db.invoice.findMany({
			where: {
				status: { in: ["PENDING", "OVERDUE"] },
				...(propertyIds
					? { contract: { room: { propertyId: { in: propertyIds } } } }
					: {}),
			},
			include: {
				contract: {
					include: {
						tenant: {
							select: {
								id: true,
								name: true,
								whatsappNumber: true,
								phoneNumber: true,
							},
						},
						room: {
							select: {
								roomNumber: true,
								property: { select: { name: true } },
							},
						},
					},
				},
			},
			orderBy: { dueDate: "asc" },
		});

		const dueCount = pendingInvoices.length;
		const dueAmountRaw = pendingInvoices.reduce(
			(sum, inv) => sum + Number(inv.amount),
			0,
		);

		// 5. Format 5 Upcoming Payments
		const todayDate = new Date();
		todayDate.setHours(0, 0, 0, 0);

		const upcomingPayments: UpcomingPaymentItem[] = pendingInvoices
			.slice(0, 6)
			.map((inv) => {
				const due = new Date(inv.dueDate);
				due.setHours(0, 0, 0, 0);
				const diffDays = Math.ceil(
					(due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
				);

				let badgeText = `${diffDays} hari lagi`;
				let badgeClass: "amber" | "green" | "red" = "amber";

				if (diffDays < 0 || inv.status === "OVERDUE") {
					badgeText = `Terlambat ${Math.abs(diffDays)} hari`;
					badgeClass = "red";
				} else if (diffDays === 0) {
					badgeText = "Hari ini";
					badgeClass = "amber";
				} else if (diffDays > 7) {
					badgeClass = "green";
				}

				const formattedDueDate = `${due.getDate()} ${MONTH_NAMES_SHORT[due.getMonth()]} ${due.getFullYear()}`;

				return {
					id: inv.id,
					tenant: inv.contract.tenant.name,
					room: inv.contract.room.roomNumber,
					dueDate: formattedDueDate,
					amount: formatRupiah(Number(inv.amount)),
					amountRaw: Number(inv.amount),
					badgeText,
					badgeClass,
					actionText: "Reminder",
					invoiceId: inv.id,
					phone:
						inv.contract.tenant.whatsappNumber ||
						inv.contract.tenant.phoneNumber,
				};
			});

		// 6. Perhatian Hari Ini (Today Attention)
		const todayAttentions: DashboardTodayAttentionItem[] = [];

		// Cek Ulang Tahun Penghuni dalam 7 hari ke depan
		const activeTenants = await this.db.tenant.findMany({
			where: {
				status: "ACTIVE",
				birthDate: { not: null },
				...(propertyIds
					? {
							rentalContracts: {
								some: {
									status: "ACTIVE",
									room: { propertyId: { in: propertyIds } },
								},
							},
						}
					: {}),
			},
			select: { name: true, birthDate: true },
		});

		for (const t of activeTenants) {
			if (t.birthDate) {
				const bDate = new Date(t.birthDate);
				const thisYearBday = new Date(
					now.getFullYear(),
					bDate.getMonth(),
					bDate.getDate(),
				);
				const diffDays = Math.ceil(
					(thisYearBday.getTime() - todayDate.getTime()) /
						(1000 * 60 * 60 * 24),
				);

				if (diffDays >= 0 && diffDays <= 7) {
					const whenText =
						diffDays === 0
							? "ulang tahun hari ini!"
							: diffDays === 1
								? "ulang tahun besok"
								: `ulang tahun ${diffDays} hari lagi`;
					todayAttentions.push({
						id: `bday-${t.name}`,
						type: "birthday",
						title: `${t.name} ${whenText}`,
						desc: "Kirim ucapan personal via WhatsApp untuk menjaga kedekatan.",
						route: "/dashboard/engagement",
					});
				}
			}
		}

		// Cek Tagihan Jatuh Tempo Mendesak
		if (dueCount > 0) {
			todayAttentions.push({
				id: "att-due-invoices",
				type: "due",
				title: `${dueCount} pembayaran perlu ditindaklanjuti`,
				desc: `Total tagihan ${formatRupiah(dueAmountRaw)}. Pengingat WhatsApp otomatis siap dikirim.`,
				route: "/dashboard/invoices",
			});
		}

		// Cek Komplain & Maintenance Kamar Aktif
		const activeComplaints = await this.db.complaint.findMany({
			where: {
				status: { in: ["PENDING", "IN_PROGRESS"] },
				...(propertyIds ? { room: { propertyId: { in: propertyIds } } } : {}),
			},
			include: { room: { select: { roomNumber: true } } },
			take: 2,
		});

		for (const c of activeComplaints) {
			todayAttentions.push({
				id: `complaint-${c.id}`,
				type: "maintenance",
				title: `Maintenance Kamar ${c.room.roomNumber}`,
				desc: `Keluhan: ${c.description.slice(0, 50)}${c.description.length > 50 ? "..." : ""}`,
				route: "/dashboard/rooms",
			});
		}

		// 7. Pengeluaran Terakhir (Recent Expenses)
		const recentExpenseTxs = await this.db.transaction.findMany({
			where: {
				type: "EXPENSE",
				...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
			},
			include: {
				property: { select: { name: true } },
			},
			orderBy: { transactionDate: "desc" },
			take: 3,
		});

		const recentExpenses: DashboardRecentExpenseItem[] = recentExpenseTxs.map(
			(tx) => {
				const txDate = new Date(tx.transactionDate);
				const dateLabel = `${txDate.getDate()} ${MONTH_NAMES_SHORT[txDate.getMonth()]} · ${tx.property?.name || "Semua Kost"}`;
				return {
					id: tx.id,
					title: tx.description || tx.category || "Biaya Operasional",
					date: dateLabel,
					amount: formatRupiah(Number(tx.amount)),
				};
			},
		);

		// 8. Ringkasan Per Cabang Kos (Property Summary)
		const allProperties = await this.db.property.findMany({
			where: propertyFilter,
			include: {
				rooms: { select: { id: true } },
			},
			orderBy: { name: "asc" },
		});

		const propertySummaries: DashboardPropertySummaryItem[] = await Promise.all(
			allProperties.map(async (prop) => {
				const propDueCount = await this.db.invoice.count({
					where: {
						status: { in: ["PENDING", "OVERDUE"] },
						contract: { room: { propertyId: prop.id } },
					},
				});

				return {
					id: prop.id,
					name: prop.name,
					rooms: `${prop.rooms.length} kamar`,
					dueBadge:
						propDueCount > 0 ? `${propDueCount} mendekati` : "Semua lunas",
					badgeColor: propDueCount > 0 ? "amber" : "green",
				};
			}),
		);

		// 9. Aktivitas Terbaru (Recent Activities)
		const recentLogs = await this.db.notificationLog.findMany({
			orderBy: { sentAt: "desc" },
			take: 4,
		});

		const recentActivities: DashboardRecentActivityItem[] = recentLogs.map(
			(log) => {
				const diffMins = Math.round(
					(now.getTime() - new Date(log.sentAt).getTime()) / (1000 * 60),
				);
				let timeText = "Baru saja";
				if (diffMins > 60) {
					const hours = Math.floor(diffMins / 60);
					timeText = `${hours} jam lalu`;
				} else if (diffMins > 0) {
					timeText = `${diffMins} menit lalu`;
				}

				return {
					id: log.id,
					time: timeText,
					desc:
						log.notes ||
						`Pesan ${log.messageType} dikirim ke nomor ${log.recipientNumber}`,
					route: "/dashboard/engagement",
				};
			},
		);

		// 10. Multi-Month Trends Chart Data (6 & 12 Bulan Terakhir)
		const sixMonthsLabels: string[] = [];
		const sixMonthsIncome: number[] = [];
		const sixMonthsExpense: number[] = [];

		const twelveMonthsLabels: string[] = [];
		const twelveMonthsIncome: number[] = [];
		const twelveMonthsExpense: number[] = [];

		for (let i = 11; i >= 0; i--) {
			const d = new Date(currentYear, currentMonth - 1 - i, 1);
			const m = d.getMonth() + 1;
			const y = d.getFullYear();
			const lbl = `${MONTH_NAMES_SHORT[m - 1]} '${String(y).slice(2)}`;

			const s = new Date(y, m - 1, 1, 0, 0, 0);
			const e = new Date(y, m, 0, 23, 59, 59);

			// Invoices paid in that month
			const mInvoices = await this.db.invoice.findMany({
				where: {
					periodMonth: m,
					periodYear: y,
					status: "PAID",
					...(propertyIds
						? { contract: { room: { propertyId: { in: propertyIds } } } }
						: {}),
				},
				select: { amount: true },
			});

			const mInc = mInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0);

			// Expenses in that month
			const mExpenseAgg = await this.db.transaction.aggregate({
				where: {
					type: "EXPENSE",
					transactionDate: { gte: s, lte: e },
					...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
				},
				_sum: { amount: true },
			});

			const mExp = Number(mExpenseAgg._sum.amount ?? 0);

			twelveMonthsLabels.push(lbl);
			twelveMonthsIncome.push(mInc);
			twelveMonthsExpense.push(mExp);

			if (i < 6) {
				sixMonthsLabels.push(lbl);
				sixMonthsIncome.push(mInc);
				sixMonthsExpense.push(mExp);
			}
		}

		return {
			stats: {
				totalRooms,
				occupiedRooms,
				vacantRooms,
				maintenanceRooms,
				occupancyRate: Number(occupancyRate.toFixed(1)),
				monthlyIncome: this.formatJuta(currentMonthIncome),
				monthlyIncomeRaw: currentMonthIncome,
				incomeGrowth,
				dueCount,
				dueAmount: this.formatJuta(dueAmountRaw),
				dueAmountRaw,
				monthlyExpense: this.formatJuta(currentMonthExpense),
				monthlyExpenseRaw: currentMonthExpense,
			},
			upcomingPayments,
			recentExpenses,
			todayAttentions,
			propertySummaries,
			recentActivities,
			chartData: {
				sixMonths: {
					labels: sixMonthsLabels,
					income: sixMonthsIncome,
					expense: sixMonthsExpense,
				},
				twelveMonths: {
					labels: twelveMonthsLabels,
					income: twelveMonthsIncome,
					expense: twelveMonthsExpense,
				},
			},
		};
	}

	async getNotifications(
		propertyId?: string | null,
	): Promise<TopbarNotificationItem[]> {
		const propertyIds = propertyId ? [propertyId] : undefined;
		const notifs: Array<TopbarNotificationItem & { rawDate: Date }> = [];
		const now = new Date();

		try {
			// 1. Tagihan Jatuh Tempo & Overdue
			const threeDaysAhead = new Date();
			threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

			const dueInvoices = await this.db.invoice.findMany({
				where: {
					status: { in: ["PENDING", "OVERDUE"] },
					dueDate: { lte: threeDaysAhead },
					...(propertyIds
						? { contract: { room: { propertyId: { in: propertyIds } } } }
						: {}),
				},
				include: {
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
				orderBy: { dueDate: "asc" },
				take: 10,
			});

			for (const inv of dueInvoices) {
				const isOverdue = inv.status === "OVERDUE" || inv.dueDate < now;
				const tenantName = inv.contract.tenant.name;
				const roomNo = inv.contract.room.roomNumber;
				const propName = inv.contract.room.property.name;
				const amountStr = formatRupiah(Number(inv.amount));

				const diffDays = Math.ceil(
					(inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
				);
				const timeLabel = isOverdue
					? "Jatuh tempo terlewat"
					: diffDays === 0
						? "Jatuh tempo hari ini"
						: `Jatuh tempo dlm ${diffDays} hari`;

				notifs.push({
					id: `notif-inv-${inv.id}`,
					title: isOverdue
						? "Tagihan Overdue (Jatuh Tempo)"
						: "Tagihan Mendekati Jatuh Tempo",
					desc: `${propName} · Kamar ${roomNo} (${tenantName}) ${amountStr}.`,
					time: timeLabel,
					unread: isOverdue || diffDays <= 1,
					route: "/dashboard/payments",
					type: "due",
					rawDate: inv.dueDate,
				});
			}

			// 2. Ulang Tahun Penghuni dalam 7 hari
			const tenants = await this.db.tenant.findMany({
				where: {
					status: "ACTIVE",
					birthDate: { not: null },
					...(propertyIds
						? {
								rentalContracts: {
									some: {
										status: "ACTIVE",
										room: { propertyId: { in: propertyIds } },
									},
								},
							}
						: {}),
				},
				include: {
					rentalContracts: {
						where: { status: "ACTIVE" },
						include: {
							room: {
								include: {
									property: true,
								},
							},
						},
					},
				},
			});

			for (const t of tenants) {
				if (!t.birthDate) continue;
				const dob = new Date(t.birthDate);
				const bdayThisYear = new Date(
					now.getFullYear(),
					dob.getMonth(),
					dob.getDate(),
				);
				if (
					bdayThisYear <
					new Date(now.getFullYear(), now.getMonth(), now.getDate())
				) {
					bdayThisYear.setFullYear(now.getFullYear() + 1);
				}

				const diffDays = Math.ceil(
					(bdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
				);

				if (diffDays >= 0 && diffDays <= 7) {
					const room = t.rentalContracts[0]?.room;
					const roomInfo = room
						? `Kamar ${room.roomNumber} (${room.property.name})`
						: "Penghuni";
					const timeLabel =
						diffDays === 0
							? "Hari ini 🎉"
							: diffDays === 1
								? "Besok 🎉"
								: `${diffDays} hari lagi`;

					notifs.push({
						id: `notif-bday-${t.id}`,
						title: "Ulang Tahun Penghuni",
						desc: `${t.name} · ${roomInfo} berulang tahun ${diffDays === 0 ? "hari ini" : timeLabel}.`,
						time: timeLabel,
						unread: diffDays <= 1,
						route: "/dashboard/engagement",
						type: "birthday",
						rawDate: bdayThisYear,
					});
				}
			}

			// 3. Pembayaran Terbaru Diterima (7 hari terakhir)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const recentPaidInvoices = await this.db.invoice.findMany({
				where: {
					status: "PAID",
					paidAt: { gte: sevenDaysAgo },
					...(propertyIds
						? { contract: { room: { propertyId: { in: propertyIds } } } }
						: {}),
				},
				include: {
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
				orderBy: { paidAt: "desc" },
				take: 5,
			});

			for (const inv of recentPaidInvoices) {
				const tenantName = inv.contract.tenant.name;
				const roomNo = inv.contract.room.roomNumber;
				const amountStr = formatRupiah(Number(inv.amount));

				notifs.push({
					id: `notif-paid-${inv.id}`,
					title: "Pembayaran Diterima",
					desc: `${amountStr} dari ${tenantName} (Kamar ${roomNo}) telah lunas.`,
					time: inv.paidAt
						? formatRelativeNotificationTime(inv.paidAt)
						: "Baru saja",
					unread: false,
					route: "/dashboard/invoices",
					type: "payment",
					rawDate: inv.paidAt || now,
				});
			}

			// 4. Komplain Fasilitas Aktif
			const activeComplaints = await this.db.complaint.findMany({
				where: {
					status: { in: ["PENDING", "IN_PROGRESS"] },
					...(propertyIds ? { room: { propertyId: { in: propertyIds } } } : {}),
				},
				include: {
					room: {
						include: {
							property: true,
						},
					},
				},
				orderBy: { reportedDate: "desc" },
				take: 5,
			});

			for (const comp of activeComplaints) {
				notifs.push({
					id: `notif-comp-${comp.id}`,
					title: `Komplain: ${comp.category}`,
					desc: `${comp.room.property.name} · Kamar ${comp.room.roomNumber}: ${comp.description}`,
					time: formatRelativeNotificationTime(comp.reportedDate),
					unread: comp.status === "PENDING",
					route: "/dashboard/finance",
					type: "complaint",
					rawDate: comp.reportedDate,
				});
			}

			// Urutkan: unread terlebih dahulu, lalu berdasarkan tanggal
			notifs.sort((a, b) => {
				if (a.unread !== b.unread) {
					return a.unread ? -1 : 1;
				}
				return b.rawDate.getTime() - a.rawDate.getTime();
			});

			return notifs.slice(0, 15).map(({ rawDate, ...item }) => item);
		} catch (err) {
			console.error("Gagal mengambil notifikasi topbar:", err);
			return [];
		}
	}

	async globalSearch(
		query: string,
		propertyId?: string | null,
	): Promise<GlobalSearchResultItem[]> {
		const cleanQuery = (query || "").trim();
		if (!cleanQuery || cleanQuery.length < 2) {
			return [];
		}

		const results: GlobalSearchResultItem[] = [];
		const propertyIds = propertyId ? [propertyId] : undefined;

		try {
			// 1. Cari Penghuni (Tenants)
			const tenants = await this.db.tenant.findMany({
				where: {
					OR: [
						{ name: { contains: cleanQuery, mode: "insensitive" } },
						{ phoneNumber: { contains: cleanQuery, mode: "insensitive" } },
						{ email: { contains: cleanQuery, mode: "insensitive" } },
						{ NIK: { contains: cleanQuery, mode: "insensitive" } },
					],
					...(propertyIds
						? {
								rentalContracts: {
									some: {
										room: { propertyId: { in: propertyIds } },
									},
								},
							}
						: {}),
				},
				include: {
					rentalContracts: {
						where: { status: "ACTIVE" },
						include: {
							room: {
								include: {
									property: true,
								},
							},
						},
					},
				},
				take: 5,
			});

			for (const t of tenants) {
				const activeContract = t.rentalContracts[0];
				const location = activeContract
					? `${activeContract.room.property.name} · Kamar ${activeContract.room.roomNumber}`
					: "Belum ditempatkan";

				results.push({
					id: `tenant-${t.id}`,
					title: t.name,
					subtitle: `${location} · ${t.phoneNumber}`,
					category: "Penghuni",
					url: `/dashboard/tenants`,
					badge: t.status === "ACTIVE" ? "Aktif" : "Nonaktif",
				});
			}

			// 2. Cari Kamar (Rooms)
			const rooms = await this.db.room.findMany({
				where: {
					roomNumber: { contains: cleanQuery, mode: "insensitive" },
					...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
				},
				include: {
					property: true,
				},
				take: 5,
			});

			for (const r of rooms) {
				const roomPrice = Number(r.price || 0);
				results.push({
					id: `room-${r.id}`,
					title: `Kamar ${r.roomNumber}`,
					subtitle: `${r.property.name} · ${r.type} · ${formatRupiah(roomPrice)}/bln`,
					category: "Kamar",
					url: `/dashboard/rooms`,
					badge:
						r.status === "OCCUPIED"
							? "Terisi"
							: r.status === "VACANT"
								? "Kosong"
								: "Perbaikan",
				});
			}

			// 3. Cari Invoice / Tagihan (Invoices)
			const invoices = await this.db.invoice.findMany({
				where: {
					OR: [
						{ invoiceNumber: { contains: cleanQuery, mode: "insensitive" } },
						{
							contract: {
								tenant: {
									name: { contains: cleanQuery, mode: "insensitive" },
								},
							},
						},
					],
					...(propertyIds
						? { contract: { room: { propertyId: { in: propertyIds } } } }
						: {}),
				},
				include: {
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
				take: 5,
			});

			for (const inv of invoices) {
				results.push({
					id: `inv-${inv.id}`,
					title: inv.invoiceNumber,
					subtitle: `${inv.contract.tenant.name} · Kamar ${inv.contract.room.roomNumber} (${formatRupiah(Number(inv.amount))})`,
					category: "Invoice",
					url: `/dashboard/invoices`,
					badge:
						inv.status === "PAID"
							? "Lunas"
							: inv.status === "OVERDUE"
								? "Overdue"
								: "Menunggu",
				});
			}

			// 4. Cari Transaksi Keuangan (Transactions)
			const transactions = await this.db.transaction.findMany({
				where: {
					OR: [{ description: { contains: cleanQuery, mode: "insensitive" } }],
					...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
				},
				include: {
					property: true,
				},
				take: 5,
			});

			for (const tx of transactions) {
				results.push({
					id: `tx-${tx.id}`,
					title: tx.description || tx.category,
					subtitle: `${tx.property?.name || "Semua Kost"} · ${formatRupiah(Number(tx.amount))}`,
					category: "Transaksi",
					url: `/dashboard/finance`,
					badge: tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
				});
			}

			// 5. Cari Properti Kos (Properties)
			const properties = await this.db.property.findMany({
				where: {
					OR: [
						{ name: { contains: cleanQuery, mode: "insensitive" } },
						{ address: { contains: cleanQuery, mode: "insensitive" } },
					],
					...(propertyIds ? { id: { in: propertyIds } } : {}),
				},
				take: 3,
			});

			for (const p of properties) {
				results.push({
					id: `prop-${p.id}`,
					title: p.name,
					subtitle: p.address,
					category: "Properti",
					url: `/dashboard/properties/${p.id}`,
				});
			}

			return results;
		} catch (err) {
			console.error("Gagal melakukan pencarian global:", err);
			return [];
		}
	}
}

export const dashboardService = new DashboardService();
