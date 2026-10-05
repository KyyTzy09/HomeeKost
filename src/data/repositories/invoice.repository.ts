import { prisma } from "../../db.ts";
import type {
	InvoiceStatus,
	PaymentMethod,
	Prisma,
	PrismaClient,
} from "../../generated/prisma/client.js";

export interface InvoiceFindManyParams {
	propertyIds?: string[];
	status?: InvoiceStatus;
	month?: number;
	year?: number;
	search?: string;
	sortBy?: "dueDate" | "amount" | "createdAt";
	sortOrder?: "asc" | "desc";
	skip?: number;
	take?: number;
}

export class InvoiceRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	private buildWhereClause(
		params: InvoiceFindManyParams,
	): Prisma.InvoiceWhereInput {
		const where: Prisma.InvoiceWhereInput = {};

		if (params.propertyIds && params.propertyIds.length > 0) {
			where.contract = {
				room: {
					propertyId: { in: params.propertyIds },
				},
			};
		}

		if (params.status) {
			where.status = params.status;
		}

		if (params.month) {
			where.periodMonth = params.month;
		}

		if (params.year) {
			where.periodYear = params.year;
		}

		if (params.search?.trim()) {
			const search = params.search.trim();
			where.OR = [
				{ invoiceNumber: { contains: search, mode: "insensitive" } },
				{
					contract: {
						tenant: {
							name: { contains: search, mode: "insensitive" },
						},
					},
				},
				{
					contract: {
						tenant: {
							phoneNumber: { contains: search, mode: "insensitive" },
						},
					},
				},
				{
					contract: {
						room: {
							roomNumber: { contains: search, mode: "insensitive" },
						},
					},
				},
				{
					contract: {
						room: {
							property: {
								name: { contains: search, mode: "insensitive" },
							},
						},
					},
				},
			];
		}

		return where;
	}

	async findMany(params: InvoiceFindManyParams) {
		const where = this.buildWhereClause(params);
		const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};

		if (params.sortBy === "amount") {
			orderBy.amount = params.sortOrder || "desc";
		} else if (params.sortBy === "createdAt") {
			orderBy.createdAt = params.sortOrder || "desc";
		} else {
			orderBy.dueDate = params.sortOrder || "asc";
		}

		return this.db.invoice.findMany({
			where,
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
				transactions: true,
			},
			orderBy,
			skip: params.skip,
			take: params.take,
		});
	}

	async count(params: InvoiceFindManyParams): Promise<number> {
		const where = this.buildWhereClause(params);
		return this.db.invoice.count({ where });
	}

	async findById(id: string) {
		return this.db.invoice.findUnique({
			where: { id },
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
				transactions: true,
			},
		});
	}

	async getStats(propertyIds?: string[], month?: number, year?: number) {
		const baseWhere: Prisma.InvoiceWhereInput = {};
		if (propertyIds && propertyIds.length > 0) {
			baseWhere.contract = {
				room: {
					propertyId: { in: propertyIds },
				},
			};
		}
		if (month) baseWhere.periodMonth = month;
		if (year) baseWhere.periodYear = year;

		const [
			totalInvoices,
			paidInvoices,
			pendingInvoices,
			overdueInvoices,
			allInvoices,
		] = await Promise.all([
			this.db.invoice.count({ where: baseWhere }),
			this.db.invoice.count({
				where: { ...baseWhere, status: "PAID" },
			}),
			this.db.invoice.count({
				where: { ...baseWhere, status: "PENDING" },
			}),
			this.db.invoice.count({
				where: { ...baseWhere, status: "OVERDUE" },
			}),
			this.db.invoice.findMany({
				where: baseWhere,
				select: { amount: true, status: true },
			}),
		]);

		let totalAmount = 0;
		let paidAmount = 0;
		let unpaidAmount = 0;

		for (const inv of allInvoices) {
			const amt = Number(inv.amount);
			totalAmount += amt;
			if (inv.status === "PAID") {
				paidAmount += amt;
			} else if (inv.status !== "CANCELLED") {
				unpaidAmount += amt;
			}
		}

		const collectionRate =
			totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

		return {
			totalInvoices,
			paidCount: paidInvoices,
			pendingCount: pendingInvoices,
			overdueCount: overdueInvoices,
			totalAmount,
			paidAmount,
			unpaidAmount,
			collectionRate,
		};
	}

	/**
	 * Konfirmasi Pembayaran Lunas (Atomic Prisma Transaction)
	 * Memperbarui status Invoice menjadi PAID dan secara otomatis mencatat Pemasukan Kas (Transaction).
	 */
	async markAsPaid(
		invoiceId: string,
		paymentMethod: PaymentMethod,
		paidDate: Date,
		createdByUserId: string,
		_notes?: string,
	) {
		return this.db.$transaction(async (tx) => {
			const invoice = await tx.invoice.findUnique({
				where: { id: invoiceId },
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
			});

			if (!invoice) {
				throw new Error("Invoice tidak ditemukan.");
			}

			if (invoice.status === "PAID") {
				throw new Error("Invoice ini sudah ditandai lunas sebelumnya.");
			}

			// 1. Update Invoice status
			const updatedInvoice = await tx.invoice.update({
				where: { id: invoiceId },
				data: {
					status: "PAID",
					paidAt: paidDate,
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
			});

			// 2. Buat catatan Pemasukan Kas Otomatis (INCOME - RENT)
			const propertyId = invoice.contract.room.propertyId;
			const tenantName = invoice.contract.tenant.name;
			const roomNo = invoice.contract.room.roomNumber;
			const periodStr = `${invoice.periodMonth}/${invoice.periodYear}`;

			const createdTx = await tx.transaction.create({
				data: {
					propertyId,
					createdBy: createdByUserId,
					invoiceId: invoice.id,
					type: "INCOME",
					category: "RENT",
					classification: "OPERATIONAL",
					paymentMethod,
					amount: invoice.amount,
					description: `Pembayaran Sewa Kamar ${roomNo} (${periodStr}) - ${tenantName}`,
					transactionDate: paidDate,
				},
			});

			return { invoice: updatedInvoice, transaction: createdTx };
		});
	}

	async findContractById(id: string) {
		return this.db.rentalContract.findUnique({
			where: { id },
			include: {
				tenant: true,
				room: {
					include: { property: true },
				},
			},
		});
	}

	async findActiveContractByTenantId(tenantId: string) {
		return this.db.rentalContract.findFirst({
			where: {
				tenantId,
				status: "ACTIVE",
			},
			include: {
				tenant: true,
				room: {
					include: { property: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async findByInvoiceNumber(invoiceNumber: string) {
		return this.db.invoice.findUnique({
			where: { invoiceNumber },
		});
	}

	async findExistingInvoice(
		contractId: string,
		periodMonth: number,
		periodYear: number,
	) {
		return this.db.invoice.findFirst({
			where: {
				contractId,
				periodMonth,
				periodYear,
			},
		});
	}

	/**
	 * Buat Invoice Tagihan Manual
	 */
	async createInvoice(data: {
		contractId: string;
		invoiceNumber: string;
		periodMonth: number;
		periodYear: number;
		amount: number | Prisma.Decimal;
		dueDate: Date;
		status?: InvoiceStatus;
	}) {
		return this.db.invoice.create({
			data: {
				contractId: data.contractId,
				invoiceNumber: data.invoiceNumber,
				periodMonth: data.periodMonth,
				periodYear: data.periodYear,
				amount: data.amount,
				dueDate: data.dueDate,
				status: data.status || "PENDING",
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
		});
	}

	/**
	 * Generate Tagihan Bulanan Massal untuk semua kontrak aktif di properti tertentu
	 */
	async generateMonthlyInvoicesForProperty(
		propertyId: string,
		periodMonth: number,
		periodYear: number,
		dueDateDay: number = 10,
	) {
		const contracts = await this.db.rentalContract.findMany({
			where: {
				status: "ACTIVE",
				room: {
					propertyId,
				},
			},
			include: {
				room: true,
				tenant: true,
				invoices: {
					where: {
						periodMonth,
						periodYear,
					},
					select: { id: true },
				},
			},
		});

		const timestamp = Date.now().toString().slice(-4);
		const toCreate = [];

		for (let i = 0; i < contracts.length; i++) {
			const contract = contracts[i];
			// Lewati jika sudah ada invoice untuk periode ini
			if (contract.invoices.length > 0) {
				continue;
			}

			const monthPadded = String(periodMonth).padStart(2, "0");
			const invoiceNumber = `INV-${periodYear}${monthPadded}-${timestamp}${String(i + 1).padStart(3, "0")}`;
			const dueDate = new Date(periodYear, periodMonth - 1, dueDateDay);
			const amount = Number(contract.room.price);

			toCreate.push({
				contractId: contract.id,
				invoiceNumber,
				periodMonth,
				periodYear,
				amount,
				dueDate,
				status: "PENDING" as const,
			});
		}

		if (toCreate.length === 0) return [];

		await this.db.invoice.createMany({
			data: toCreate,
		});

		return this.db.invoice.findMany({
			where: {
				contractId: { in: toCreate.map((c) => c.contractId) },
				periodMonth,
				periodYear,
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
		});
	}

	async deleteInvoice(id: string) {
		return this.db.$transaction(async (tx) => {
			const invoice = await tx.invoice.findUnique({
				where: { id },
				select: { id: true, status: true, invoiceNumber: true },
			});

			if (!invoice) {
				throw new Error("Tagihan tidak ditemukan atau sudah dihapus.");
			}

			// Hapus transaksi kas masuk terkait jika ada (agar kas bersih dari double-input)
			await tx.transaction.deleteMany({
				where: { invoiceId: id },
			});

			return tx.invoice.delete({
				where: { id },
			});
		});
	}
}

export const invoiceRepository = new InvoiceRepository();
