import { prisma } from "../../db.ts";
import type {
	BillingCycle,
	PrismaClient,
} from "../../generated/prisma/client.js";

export class TenantRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findByPropertyId(propertyId: string) {
		return this.db.tenant.findMany({
			where: {
				status: "ACTIVE",
				rentalContracts: {
					some: {
						status: "ACTIVE",
						room: {
							propertyId,
						},
					},
				},
			},
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						room: true,
						invoices: {
							orderBy: { dueDate: "desc" },
							take: 3,
						},
					},
				},
			},
			orderBy: { name: "asc" },
		});
	}

	async findAll() {
		return this.db.tenant.findMany({
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						room: {
							include: {
								property: true,
							},
						},
						invoices: {
							orderBy: { dueDate: "desc" },
							take: 3,
						},
					},
				},
			},
			orderBy: { name: "asc" },
		});
	}

	async findById(id: string) {
		return this.db.tenant.findUnique({
			where: { id },
			include: {
				rentalContracts: {
					include: {
						room: {
							include: {
								property: true,
							},
						},
						invoices: {
							orderBy: { dueDate: "desc" },
						},
					},
					orderBy: { createdAt: "desc" },
				},
			},
		});
	}

	async findByNIK(nik: string) {
		return this.db.tenant.findUnique({
			where: { NIK: nik },
		});
	}

	async createTenantWithContract(data: {
		name: string;
		nik: string;
		phone: string;
		whatsappNumber?: string | null;
		email?: string | null;
		birthDate?: Date | null;
		occupation?: string | null;
		institution?: string | null;
		originAddress?: string | null;
		emergencyName?: string | null;
		emergencyRelation?: string | null;
		emergencyPhone?: string | null;
		vehicle?: string | null;
		deposit?: number | null;
		notes?: string | null;
		ktpUrl?: string | null;
		markPastPeriodsPaid?: boolean;
		roomId: string;
		billingCycle: BillingCycle;
		startDate: Date;
		endDate?: Date | null;
		dueDateDay: number;
		rentAmount: number;
		recordedById?: string;
	}) {
		return this.db.$transaction(
			async (tx) => {
				// 1. Check or create tenant
				let tenant = await tx.tenant.findUnique({
					where: { NIK: data.nik },
				});

				const tenantPayload = {
					name: data.name,
					phoneNumber: data.phone,
					whatsappNumber: data.whatsappNumber || data.phone,
					email: data.email || null,
					birthDate: data.birthDate ?? null,
					occupation: data.occupation ?? null,
					institution: data.institution ?? null,
					originAddress: data.originAddress ?? null,
					emergencyName: data.emergencyName ?? null,
					emergencyRelation: data.emergencyRelation ?? null,
					emergencyPhone: data.emergencyPhone ?? null,
					vehicle: data.vehicle ?? null,
					deposit: Number(data.deposit ?? 0),
					notes: data.notes ?? null,
					ktpUrl: data.ktpUrl ?? null,
					status: "ACTIVE" as const,
				};

				if (tenant) {
					tenant = await tx.tenant.update({
						where: { id: tenant.id },
						data: tenantPayload,
					});
				} else {
					tenant = await tx.tenant.create({
						data: {
							...tenantPayload,
							NIK: data.nik,
						},
					});
				}

				// 2. Set room status to OCCUPIED
				const room = await tx.room.update({
					where: { id: data.roomId },
					data: { status: "OCCUPIED" },
					include: { property: true },
				});

				// Hitung durasi siklus sewa dalam bulan
				let cycleMonths = 1;
				if (data.billingCycle === "QUARTERLY") cycleMonths = 3;
				else if (data.billingCycle === "SEMI_ANNUAL") cycleMonths = 6;
				else if (data.billingCycle === "ANNUALLY") cycleMonths = 12;

				const monthlyRent =
					Number(room.monthlyPrice) > 0
						? Number(room.monthlyPrice)
						: Number(data.rentAmount) / cycleMonths;
				const totalCycleRent = Number(data.rentAmount);
				const initialPayment = Number(data.deposit ?? 0);

				const calculatedEndDate =
					data.endDate ??
					new Date(
						data.startDate.getFullYear(),
						data.startDate.getMonth() + cycleMonths,
						data.startDate.getDate(),
					);

				// 3. Create active rental contract dengan periode akhir yang jelas
				const contract = await tx.rentalContract.create({
					data: {
						roomId: data.roomId,
						tenantId: tenant.id,
						billingCycle: data.billingCycle,
						startDate: data.startDate,
						endDate: calculatedEndDate,
						dueDateDay: data.dueDateDay,
						status: "ACTIVE",
					},
					include: {
						room: true,
					},
				});

				// 4. Determine user for transaction audit trail
				let createdByUserId = data.recordedById;
				if (!createdByUserId) {
					const adminUser = await tx.user.findFirst({
						select: { id: true },
					});
					createdByUserId = adminUser?.id;
				}

				const now = new Date();

				// 5. Intelligent Multi-Month Invoice & Cashflow Settlement
				if (data.markPastPeriodsPaid && data.startDate < now) {
					// SKENARIO KHUSUS: Migrasi Data Penghuni Lama (Banyak Periode Lampau LUNAS)
					const startY = data.startDate.getFullYear();
					const startM = data.startDate.getMonth();
					const curY = now.getFullYear();
					const curM = now.getMonth();
					const elapsedTotalMonths = Math.max(
						1,
						(curY - startY) * 12 + (curM - startM) + cycleMonths,
					);
					const invoiceBatch = [];
					let totalHistoricalPaid = 0;

					for (let i = 0; i < elapsedTotalMonths; i++) {
						const periodDate = new Date(
							data.startDate.getFullYear(),
							data.startDate.getMonth() + i,
							data.dueDateDay || data.startDate.getDate(),
						);
						const pMonth = periodDate.getMonth() + 1;
						const pYear = periodDate.getFullYear();
						const isPastOrCurrent = periodDate <= now;
						const invStatus = isPastOrCurrent
							? ("PAID" as const)
							: ("PENDING" as const);
						const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`;

						invoiceBatch.push({
							contractId: contract.id,
							invoiceNumber: invNum,
							periodMonth: pMonth,
							periodYear: pYear,
							amount: monthlyRent,
							dueDate: periodDate,
							paidAt: isPastOrCurrent ? periodDate : null,
							status: invStatus,
						});

						if (isPastOrCurrent) {
							totalHistoricalPaid += monthlyRent;
						}
					}

					// Fast Single Batch Query
					if (invoiceBatch.length > 0) {
						await tx.invoice.createMany({
							data: invoiceBatch,
						});
					}

					if (createdByUserId && totalHistoricalPaid > 0) {
						await tx.transaction.create({
							data: {
								propertyId: room.propertyId,
								createdBy: createdByUserId,
								type: "INCOME",
								category: "RENT",
								classification: "OPERATIONAL",
								paymentMethod: "TRANSFER",
								amount: totalHistoricalPaid,
								description: `Rekap Pembayaran Sewa Masa Lalu (${elapsedTotalMonths} Bulan) Kamar ${room.roomNumber} - ${data.name}`,
								transactionDate: data.startDate,
							},
						});
					}
				} else if (initialPayment >= totalCycleRent) {
					// Skenario 1: Bayar Lunas Penuh di Awal untuk Seluruh Siklus
					const cycleInvoices = [];
					for (let i = 0; i < cycleMonths; i++) {
						const periodDate = new Date(
							data.startDate.getFullYear(),
							data.startDate.getMonth() + i,
							data.dueDateDay || data.startDate.getDate(),
						);
						const pMonth = periodDate.getMonth() + 1;
						const pYear = periodDate.getFullYear();
						const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`;

						cycleInvoices.push({
							contractId: contract.id,
							invoiceNumber: invNum,
							periodMonth: pMonth,
							periodYear: pYear,
							amount: monthlyRent,
							dueDate: periodDate,
							paidAt: now,
							status: "PAID" as const,
						});
					}

					// Fast Single Batch Query
					await tx.invoice.createMany({
						data: cycleInvoices,
					});

					// Catat 1 kali mutasi pemasukan kas riil untuk total uang yang diterima
					if (createdByUserId) {
						const cycleLabel =
							cycleMonths === 3
								? "Triwulan"
								: cycleMonths === 6
									? "Semesteran"
									: cycleMonths === 12
										? "Tahunan"
										: "Bulanan";

						await tx.transaction.create({
							data: {
								propertyId: room.propertyId,
								createdBy: createdByUserId,
								type: "INCOME",
								category: "RENT",
								classification: "OPERATIONAL",
								paymentMethod: "TRANSFER",
								amount: initialPayment,
								description: `Pembayaran Sewa Awal Lunas (${cycleLabel} · ${cycleMonths} Bulan) Kamar ${room.roomNumber} - ${data.name}`,
								transactionDate: now,
							},
						});
					}
				} else if (initialPayment > 0) {
					// Skenario 2: Bayar Sebagian / Uang Muka (DP)
					const invNum = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

					if (createdByUserId) {
						await tx.transaction.create({
							data: {
								propertyId: room.propertyId,
								createdBy: createdByUserId,
								type: "INCOME",
								category: "RENT",
								classification: "OPERATIONAL",
								paymentMethod: "TRANSFER",
								amount: initialPayment,
								description: `Uang Muka (DP) / Deposit Sewa Awal Kamar ${room.roomNumber} - ${data.name}`,
								transactionDate: now,
							},
						});
					}

					// Terbitkan invoice tagihan untuk sisa kekurangan siklus
					const remainingAmount =
						totalCycleRent > initialPayment
							? totalCycleRent - initialPayment
							: monthlyRent;
					await tx.invoice.create({
						data: {
							contractId: contract.id,
							invoiceNumber: invNum,
							periodMonth: now.getMonth() + 1,
							periodYear: now.getFullYear(),
							amount: remainingAmount,
							dueDate: data.startDate,
							status: "PENDING",
						},
					});
				} else {
					// Skenario 3: Belum Bayar Sama Sekali (Pending)
					const invNum = `INV-${data.startDate.getFullYear()}${(data.startDate.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
					await tx.invoice.create({
						data: {
							contractId: contract.id,
							invoiceNumber: invNum,
							periodMonth: data.startDate.getMonth() + 1,
							periodYear: data.startDate.getFullYear(),
							amount: monthlyRent,
							dueDate: data.startDate,
							status: "PENDING",
						},
					});
				}

				return {
					tenant,
					contract,
					room,
				};
			},
			{
				timeout: 30000,
				maxWait: 10000,
			},
		);
	}

	async updateTenantWithContract(
		tenantId: string,
		data: {
			name: string;
			nik: string;
			phone: string;
			whatsappNumber?: string | null;
			email?: string | null;
			birthDate?: Date | null;
			occupation?: string | null;
			institution?: string | null;
			originAddress?: string | null;
			emergencyName?: string | null;
			emergencyRelation?: string | null;
			emergencyPhone?: string | null;
			vehicle?: string | null;
			deposit?: number | null;
			notes?: string | null;
			ktpUrl?: string | null;
			roomId?: string;
			billingCycle?: BillingCycle;
			startDate?: Date;
			dueDateDay?: number;
		},
	) {
		return this.db.$transaction(
			async (tx) => {
				// 1. Update Tenant profile
				const updatedTenant = await tx.tenant.update({
					where: { id: tenantId },
					data: {
						name: data.name,
						NIK: data.nik,
						phoneNumber: data.phone,
						whatsappNumber: data.whatsappNumber || data.phone,
						email: data.email || null,
						birthDate: data.birthDate ?? null,
						occupation: data.occupation ?? null,
						institution: data.institution ?? null,
						originAddress: data.originAddress ?? null,
						emergencyName: data.emergencyName ?? null,
						emergencyRelation: data.emergencyRelation ?? null,
						emergencyPhone: data.emergencyPhone ?? null,
						vehicle: data.vehicle ?? null,
						deposit: data.deposit !== undefined ? data.deposit : undefined,
						notes: data.notes ?? null,
						...(data.ktpUrl !== undefined && { ktpUrl: data.ktpUrl }),
					},
				});

				// 2. Find active rental contract
				const activeContract = await tx.rentalContract.findFirst({
					where: {
						tenantId,
						status: "ACTIVE",
					},
				});

				if (activeContract) {
					// If room changed
					if (data.roomId && data.roomId !== activeContract.roomId) {
						// Free previous room
						await tx.room.update({
							where: { id: activeContract.roomId },
							data: { status: "VACANT" },
						});

						// Occupy new room
						await tx.room.update({
							where: { id: data.roomId },
							data: { status: "OCCUPIED" },
						});

						// Update contract
						await tx.rentalContract.update({
							where: { id: activeContract.id },
							data: {
								roomId: data.roomId,
								...(data.billingCycle && { billingCycle: data.billingCycle }),
								...(data.startDate && { startDate: data.startDate }),
								...(data.dueDateDay && { dueDateDay: data.dueDateDay }),
							},
						});
					} else if (data.billingCycle || data.startDate || data.dueDateDay) {
						await tx.rentalContract.update({
							where: { id: activeContract.id },
							data: {
								...(data.billingCycle && { billingCycle: data.billingCycle }),
								...(data.startDate && { startDate: data.startDate }),
								...(data.dueDateDay && { dueDateDay: data.dueDateDay }),
							},
						});
					}
				}

				return updatedTenant;
			},
			{
				timeout: 30000,
				maxWait: 10000,
			},
		);
	}

	async deleteTenant(id: string) {
		return this.db.$transaction(
			async (tx) => {
				// Find active contracts
				const activeContracts = await tx.rentalContract.findMany({
					where: {
						tenantId: id,
						status: "ACTIVE",
					},
				});

				// Release all rooms
				for (const contract of activeContracts) {
					await tx.room.update({
						where: { id: contract.roomId },
						data: { status: "VACANT" },
					});

					await tx.rentalContract.update({
						where: { id: contract.id },
						data: { status: "TERMINATED" },
					});
				}

				// Mark tenant as INACTIVE
				return tx.tenant.update({
					where: { id },
					data: { status: "INACTIVE" },
				});
			},
			{
				timeout: 30000,
				maxWait: 10000,
			},
		);
	}
}

export const tenantRepository = new TenantRepository();
