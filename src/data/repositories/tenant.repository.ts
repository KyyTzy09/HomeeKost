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
		roomId: string;
		billingCycle: BillingCycle;
		startDate: Date;
		endDate?: Date | null;
		dueDateDay: number;
		rentAmount: number;
		recordedById?: string;
	}) {
		return this.db.$transaction(async (tx) => {
			// 1. Check or create tenant
			let tenant = await tx.tenant.findUnique({
				where: { NIK: data.nik },
			});

			const initialPayment = Number(data.deposit ?? 0);
			const totalRent = Number(data.rentAmount);

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
				deposit: initialPayment,
				notes: data.notes ?? null,
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

			// 3. Create active rental contract
			const contract = await tx.rentalContract.create({
				data: {
					roomId: data.roomId,
					tenantId: tenant.id,
					billingCycle: data.billingCycle,
					startDate: data.startDate,
					endDate: data.endDate ?? null,
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
			const invoiceNum = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

			// 5. Intelligent Invoice & Cashflow Settlement
			if (initialPayment >= totalRent) {
				// Skenario 1: Bayar Lunas Penuh di Awal (Deposit / Bayar Awal >= Total Sewa)
				const inv = await tx.invoice.create({
					data: {
						contractId: contract.id,
						invoiceNumber: invoiceNum,
						periodMonth: now.getMonth() + 1,
						periodYear: now.getFullYear(),
						amount: totalRent,
						dueDate: data.startDate,
						paidAt: now,
						status: "PAID",
					},
				});

				if (createdByUserId) {
					await tx.transaction.create({
						data: {
							propertyId: room.propertyId,
							createdBy: createdByUserId,
							invoiceId: inv.id,
							type: "INCOME",
							category: "RENT",
							classification: "OPERATIONAL",
							paymentMethod: "TRANSFER",
							amount: totalRent,
							description: `Pembayaran Sewa Awal Lunas Kamar ${room.roomNumber} - ${data.name} (#${invoiceNum})`,
							transactionDate: now,
						},
					});
				}
			} else if (initialPayment > 0) {
				// Skenario 2: Bayar Sebagian / DP di Awal (0 < Deposit < Total Sewa)
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

				// Terbitkan invoice tagihan untuk sisa kekurangan
				const remainingAmount = totalRent - initialPayment;
				await tx.invoice.create({
					data: {
						contractId: contract.id,
						invoiceNumber: invoiceNum,
						periodMonth: now.getMonth() + 1,
						periodYear: now.getFullYear(),
						amount: remainingAmount,
						dueDate: data.startDate,
						status: "PENDING",
					},
				});
			} else {
				// Skenario 3: Belum Ada Pembayaran Sama Sekali (Deposit = 0)
				await tx.invoice.create({
					data: {
						contractId: contract.id,
						invoiceNumber: invoiceNum,
						periodMonth: now.getMonth() + 1,
						periodYear: now.getFullYear(),
						amount: totalRent,
						dueDate: data.startDate,
						status: "PENDING",
					},
				});
			}

			return {
				tenant,
				contract,
			};
		});
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
			roomId?: string;
			billingCycle?: BillingCycle;
			startDate?: Date;
			dueDateDay?: number;
		},
	) {
		return this.db.$transaction(async (tx) => {
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
		});
	}

	async deleteTenant(id: string) {
		return this.db.$transaction(async (tx) => {
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
		});
	}
}

export const tenantRepository = new TenantRepository();
