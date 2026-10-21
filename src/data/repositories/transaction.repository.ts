import type { TransactionFindManyParams } from "../../common/types/index.ts";
import { prisma } from "../../db.ts";
import type {
	ExpenseClassification,
	PaymentMethod,
	Prisma,
	PrismaClient,
	TransactionCategory,
	TransactionType,
} from "../../generated/prisma/client.js";

export class TransactionRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	private buildWhereClause(
		params: TransactionFindManyParams,
	): Prisma.TransactionWhereInput {
		const where: Prisma.TransactionWhereInput = {};

		if (params.propertyIds && params.propertyIds.length > 0) {
			where.propertyId = { in: params.propertyIds };
		}

		if (params.type) {
			where.type = params.type;
		}

		if (params.category) {
			where.category = params.category;
		}

		if (params.startDate || params.endDate) {
			where.transactionDate = {};
			if (params.startDate) {
				where.transactionDate.gte = params.startDate;
			}
			if (params.endDate) {
				where.transactionDate.lte = params.endDate;
			}
		}

		if (params.search?.trim()) {
			const search = params.search.trim();
			where.OR = [
				{ description: { contains: search, mode: "insensitive" } },
				{ property: { name: { contains: search, mode: "insensitive" } } },
				{ creator: { name: { contains: search, mode: "insensitive" } } },
			];
		}

		return where;
	}

	async findMany(params: TransactionFindManyParams) {
		const where = this.buildWhereClause(params);
		const orderBy: Prisma.TransactionOrderByWithRelationInput = {};

		if (params.sortBy === "amount") {
			orderBy.amount = params.sortOrder || "desc";
		} else {
			orderBy.transactionDate = params.sortOrder || "desc";
		}

		return this.db.transaction.findMany({
			where,
			orderBy,
			skip: params.skip,
			take: params.take,
			include: {
				property: {
					select: {
						id: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				invoice: {
					select: {
						id: true,
						invoiceNumber: true,
					},
				},
				complaint: {
					select: {
						id: true,
						description: true,
					},
				},
			},
		});
	}

	async count(params: TransactionFindManyParams) {
		const where = this.buildWhereClause(params);
		return this.db.transaction.count({ where });
	}

	async findById(id: string) {
		return this.db.transaction.findUnique({
			where: { id },
			include: {
				property: {
					select: {
						id: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				invoice: true,
				complaint: true,
			},
		});
	}

	async create(data: {
		propertyId: string;
		createdBy: string;
		type: TransactionType;
		category: TransactionCategory;
		classification?: ExpenseClassification | null;
		paymentMethod?: PaymentMethod;
		amount: number | Prisma.Decimal;
		description?: string | null;
		transactionDate: Date;
		invoiceId?: string | null;
		complaintId?: string | null;
	}) {
		return this.db.transaction.create({
			data: {
				propertyId: data.propertyId,
				createdBy: data.createdBy,
				type: data.type,
				category: data.category,
				classification: data.classification ?? null,
				paymentMethod: data.paymentMethod ?? "TRANSFER",
				amount: data.amount,
				description: data.description ?? null,
				transactionDate: data.transactionDate,
				invoiceId: data.invoiceId ?? null,
				complaintId: data.complaintId ?? null,
			},
			include: {
				property: {
					select: {
						id: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}

	async update(
		id: string,
		data: {
			propertyId?: string;
			type?: TransactionType;
			category?: TransactionCategory;
			classification?: ExpenseClassification | null;
			paymentMethod?: PaymentMethod;
			amount?: number | Prisma.Decimal;
			description?: string | null;
			transactionDate?: Date;
		},
	) {
		return this.db.transaction.update({
			where: { id },
			data: {
				...(data.propertyId && { propertyId: data.propertyId }),
				...(data.type && { type: data.type }),
				...(data.category && { category: data.category }),
				...(data.classification !== undefined && {
					classification: data.classification,
				}),
				...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
				...(data.amount !== undefined && { amount: data.amount }),
				...(data.description !== undefined && {
					description: data.description,
				}),
				...(data.transactionDate && {
					transactionDate: data.transactionDate,
				}),
			},
			include: {
				property: {
					select: {
						id: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}

	async delete(id: string) {
		return this.db.transaction.delete({
			where: { id },
		});
	}

	async deleteWithCascade(
		id: string,
		existing: {
			invoiceId?: string | null;
			type: string;
			category: string;
			description?: string | null;
			propertyId?: string | null;
			transactionDate: Date;
		},
	) {
		return this.db.$transaction(async (tx) => {
			let targetInvoiceId = existing.invoiceId;

			// Jika invoiceId null, cari invoice terkait pembayaran sewa jika ada
			if (
				!targetInvoiceId &&
				existing.type === "INCOME" &&
				existing.category === "RENT" &&
				existing.propertyId
			) {
				const txMonth = existing.transactionDate.getMonth() + 1;
				const txYear = existing.transactionDate.getFullYear();
				const match = existing.description?.match(/Kamar\s+([A-Za-z0-9_-]+)/i);
				if (match) {
					const roomNumber = match[1].trim();
					const room = await tx.room.findFirst({
						where: { roomNumber, propertyId: existing.propertyId },
						select: { id: true },
					});
					if (room) {
						const inv = await tx.invoice.findFirst({
							where: {
								contract: { roomId: room.id },
								periodMonth: txMonth,
								periodYear: txYear,
							},
							select: { id: true },
						});
						if (inv) {
							targetInvoiceId = inv.id;
						}
					}
				}
			}

			if (targetInvoiceId) {
				// 1. Hapus semua transaksi kas masuk yang terikat ke invoice ini
				await tx.transaction.deleteMany({
					where: { invoiceId: targetInvoiceId },
				});
				// 2. Hapus invoice terkait (agar sinkron di halaman Pembayaran)
				await tx.invoice
					.delete({
						where: { id: targetInvoiceId },
					})
					.catch(() => null);
			}

			// 3. Pastikan transaksi ini terhapus jika belum terhapus
			await tx.transaction.deleteMany({
				where: { id },
			});
		});
	}

	async aggregateAmounts(params: {
		propertyIds?: string[];
		type?: TransactionType;
		classification?: ExpenseClassification;
		startDate?: Date;
		endDate?: Date;
	}) {
		const where: Prisma.TransactionWhereInput = {};

		if (params.propertyIds && params.propertyIds.length > 0) {
			where.propertyId = { in: params.propertyIds };
		}
		if (params.type) {
			where.type = params.type;
		}
		if (params.classification) {
			where.classification = params.classification;
		}
		if (params.startDate || params.endDate) {
			where.transactionDate = {};
			if (params.startDate) {
				where.transactionDate.gte = params.startDate;
			}
			if (params.endDate) {
				where.transactionDate.lte = params.endDate;
			}
		}

		const result = await this.db.transaction.aggregate({
			where,
			_sum: {
				amount: true,
			},
			_count: {
				id: true,
			},
		});

		return {
			totalAmount: Number(result._sum.amount ?? 0),
			count: result._count.id,
		};
	}

	async groupByCategory(params: {
		propertyIds?: string[];
		type: TransactionType;
		startDate?: Date;
		endDate?: Date;
	}) {
		const where: Prisma.TransactionWhereInput = {
			type: params.type,
		};

		if (params.propertyIds && params.propertyIds.length > 0) {
			where.propertyId = { in: params.propertyIds };
		}
		if (params.startDate || params.endDate) {
			where.transactionDate = {};
			if (params.startDate) {
				where.transactionDate.gte = params.startDate;
			}
			if (params.endDate) {
				where.transactionDate.lte = params.endDate;
			}
		}

		const groups = await this.db.transaction.groupBy({
			by: ["category"],
			where,
			_sum: {
				amount: true,
			},
			_count: {
				id: true,
			},
		});

		return groups.map((g) => ({
			category: g.category,
			amount: Number(g._sum.amount ?? 0),
			count: g._count.id,
		}));
	}

	async findForAnnualMatrix(params: {
		propertyIds?: string[];
		startDate: Date;
		endDate: Date;
	}) {
		const where: Prisma.TransactionWhereInput = {
			transactionDate: {
				gte: params.startDate,
				lte: params.endDate,
			},
		};

		if (params.propertyIds && params.propertyIds.length > 0) {
			where.propertyId = { in: params.propertyIds };
		}

		return this.db.transaction.findMany({
			where,
			select: {
				id: true,
				propertyId: true,
				type: true,
				category: true,
				classification: true,
				amount: true,
				transactionDate: true,
				property: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}
}

export const transactionRepository = new TransactionRepository();
