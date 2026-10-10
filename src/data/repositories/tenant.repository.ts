import { prisma } from "../../db.ts";
import type {
	BillingCycle,
	PrismaClient,
} from "../../generated/prisma/client.js";

export interface CreateTenantContractParams {
	tenantPayload: {
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
	};
	contractPayload: {
		roomId: string;
		billingCycle: BillingCycle;
		startDate: Date;
		endDate: Date;
		dueDateDay: number;
	};
	invoices: Array<{
		invoiceNumber: string;
		periodMonth: number;
		periodYear: number;
		amount: number;
		dueDate: Date;
		paidAt?: Date | null;
		status: "PAID" | "PENDING" | "OVERDUE";
	}>;
	transactions: Array<{
		propertyId: string;
		createdBy?: string | null;
		type: "INCOME" | "EXPENSE";
		category:
			| "RENT"
			| "UTILITIES"
			| "INTERNET"
			| "MAINTENANCE"
			| "SALARY"
			| "OTHER";
		classification: "OPERATIONAL" | "INVESTMENT";
		paymentMethod: "TRANSFER" | "CASH" | "QRIS";
		amount: number;
		description: string;
		transactionDate: Date;
	}>;
}

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
							orderBy: { dueDate: "asc" },
							take: 12,
						},
					},
					orderBy: { createdAt: "desc" },
					take: 1,
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
							orderBy: { dueDate: "asc" },
							take: 12,
						},
					},
					orderBy: { createdAt: "desc" },
					take: 1,
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

	async createTenantWithContract(params: CreateTenantContractParams) {
		return this.db.$transaction(
			async (tx) => {
				// 1. Check or create/update tenant
				let tenant = await tx.tenant.findUnique({
					where: { NIK: params.tenantPayload.nik },
				});

				const payload = {
					name: params.tenantPayload.name,
					phoneNumber: params.tenantPayload.phone,
					whatsappNumber:
						params.tenantPayload.whatsappNumber ||
						params.tenantPayload.phone,
					email: params.tenantPayload.email || null,
					birthDate: params.tenantPayload.birthDate ?? null,
					occupation: params.tenantPayload.occupation ?? null,
					institution: params.tenantPayload.institution ?? null,
					originAddress: params.tenantPayload.originAddress ?? null,
					emergencyName: params.tenantPayload.emergencyName ?? null,
					emergencyRelation: params.tenantPayload.emergencyRelation ?? null,
					emergencyPhone: params.tenantPayload.emergencyPhone ?? null,
					vehicle: params.tenantPayload.vehicle ?? null,
					deposit: Number(params.tenantPayload.deposit ?? 0),
					notes: params.tenantPayload.notes ?? null,
					ktpUrl: params.tenantPayload.ktpUrl ?? null,
					status: "ACTIVE" as const,
				};

				if (tenant) {
					tenant = await tx.tenant.update({
						where: { id: tenant.id },
						data: payload,
					});
				} else {
					tenant = await tx.tenant.create({
						data: {
							...payload,
							NIK: params.tenantPayload.nik,
						},
					});
				}

				// 2. Set room status to OCCUPIED
				const room = await tx.room.update({
					where: { id: params.contractPayload.roomId },
					data: { status: "OCCUPIED" },
					include: { property: true },
				});

				// Pastikan tidak ada kontrak aktif lama yang menggantung pada kamar ini
				await tx.rentalContract.updateMany({
					where: {
						roomId: params.contractPayload.roomId,
						status: "ACTIVE",
					},
					data: { status: "TERMINATED" },
				});

				// 3. Create active rental contract
				const contract = await tx.rentalContract.create({
					data: {
						roomId: params.contractPayload.roomId,
						tenantId: tenant.id,
						billingCycle: params.contractPayload.billingCycle,
						startDate: params.contractPayload.startDate,
						endDate: params.contractPayload.endDate,
						dueDateDay: params.contractPayload.dueDateDay,
						status: "ACTIVE",
					},
					include: {
						room: true,
					},
				});

				// 4. Batch create invoices
				if (params.invoices.length > 0) {
					await tx.invoice.createMany({
						data: params.invoices.map((inv) => ({
							...inv,
							contractId: contract.id,
						})),
					});
				}

				// 5. Batch create distributed monthly cashflow transactions
				if (params.transactions.length > 0) {
					let fallbackUserId: string | null = null;
					const needsFallback = params.transactions.some((t) => !t.createdBy);
					if (needsFallback) {
						const admin = await tx.user.findFirst({
							select: { id: true },
						});
						fallbackUserId = admin?.id || "";
					}

					await tx.transaction.createMany({
						data: params.transactions.map((t) => ({
							propertyId: room.propertyId,
							createdBy: t.createdBy || fallbackUserId || "",
							type: t.type,
							category: t.category,
							classification: t.classification,
							paymentMethod: t.paymentMethod,
							amount: t.amount,
							description: t.description,
							transactionDate: t.transactionDate,
						})),
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
			roomChangeMode?: "CORRECTION" | "TRANSFER" | null;
		},
	) {
		return this.db.$transaction(
			async (tx) => {
				// 1. Check duplicate NIK with other tenants
				if (data.nik) {
					const existingWithNik = await tx.tenant.findFirst({
						where: {
							NIK: data.nik,
							id: { not: tenantId },
						},
						select: { name: true },
					});
					if (existingWithNik) {
						throw new Error(
							`NIK ${data.nik} sudah digunakan oleh penghuni lain (${existingWithNik.name}).`,
						);
					}
				}

				// 2. Update Tenant profile
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

				// 3. Find active rental contract
				const activeContract = await tx.rentalContract.findFirst({
					where: {
						tenantId,
						status: "ACTIVE",
					},
				});

				if (activeContract) {
					// If room changed
					if (data.roomId && data.roomId !== activeContract.roomId) {
						// 3a. Verify target room exists & is not occupied by another tenant
						const targetRoom = await tx.room.findUnique({
							where: { id: data.roomId },
						});
						if (!targetRoom) {
							throw new Error("Kamar tujuan tidak ditemukan.");
						}
						if (
							targetRoom.status === "OCCUPIED" &&
							targetRoom.id !== activeContract.roomId
						) {
							throw new Error(
								`Kamar ${targetRoom.roomNumber} sudah ditempati oleh penghuni lain.`,
							);
						}

						// 3b. Free previous room
						await tx.room.update({
							where: { id: activeContract.roomId },
							data: { status: "VACANT" },
						});

						// 3c. Occupy new room
						await tx.room.update({
							where: { id: data.roomId },
							data: { status: "OCCUPIED" },
						});

						// 3d. Update or recreate contract depending on roomChangeMode
						if (data.roomChangeMode === "TRANSFER") {
							// Mode Pindah Kamar Resmi: akhiri kontrak lama, buat kontrak baru
							const now = new Date();
							await tx.rentalContract.update({
								where: { id: activeContract.id },
								data: {
									status: "TERMINATED",
									endDate: now,
								},
							});

							await tx.rentalContract.create({
								data: {
									roomId: data.roomId,
									tenantId,
									billingCycle:
										data.billingCycle || activeContract.billingCycle,
									startDate: data.startDate || now,
									dueDateDay: data.dueDateDay ?? activeContract.dueDateDay,
									status: "ACTIVE",
								},
							});
						} else {
							// Mode Koreksi Data (Default): perbarui kamar pada kontrak berjalan
							await tx.rentalContract.update({
								where: { id: activeContract.id },
								data: {
									roomId: data.roomId,
									...(data.billingCycle && {
										billingCycle: data.billingCycle,
									}),
									...(data.startDate && { startDate: data.startDate }),
									...(data.dueDateDay && { dueDateDay: data.dueDateDay }),
								},
							});
						}
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

					// Pastikan seluruh kontrak aktif pada kamar ini benar-benar TERMINATED agar kamar kembali kosong
					await tx.rentalContract.updateMany({
						where: {
							roomId: contract.roomId,
							status: "ACTIVE",
						},
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
