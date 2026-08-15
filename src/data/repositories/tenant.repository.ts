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
	}) {
		return this.db.$transaction(async (tx) => {
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
				deposit: data.deposit ?? 0,
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
			await tx.room.update({
				where: { id: data.roomId },
				data: { status: "OCCUPIED" },
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

			// 4. Create initial invoice
			const now = new Date();
			const invoiceNum = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

			await tx.invoice.create({
				data: {
					contractId: contract.id,
					invoiceNumber: invoiceNum,
					periodMonth: now.getMonth() + 1,
					periodYear: now.getFullYear(),
					amount: data.rentAmount,
					dueDate: data.startDate,
					status: "PENDING",
				},
			});

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
