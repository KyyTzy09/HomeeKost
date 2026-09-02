import { prisma } from "../../db.ts";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

export interface MonthlyFinancialSummary {
	totalIncome: number;
	totalExpense: number;
	operationalExpense: number;
	investmentExpense: number;
	netProfit: number;
	profitMarginPercentage: number;
	roomStatus: {
		totalRooms: number;
		occupiedRooms: number;
		vacantRooms: number;
		maintenanceRooms: number;
		occupancyRate: number;
	};
	collection: {
		totalInvoices: number;
		paidInvoices: number;
		pendingInvoices: number;
		overdueInvoices: number;
		collectionRate: number;
		totalOutstanding: number;
	};
	expenseBreakdown: Array<{
		id: number;
		category: string;
		amount: number;
		percentage: number;
		description: string;
	}>;
	complaintExpenses: {
		totalCost: number;
		totalComplaints: number;
		percentageOfExpense: number;
	};
}

export interface AnnualPropertyIncomeRow {
	propertyId: string;
	propertyName: string;
	monthlyIncome: number[]; // 12 elements (index 0 = Jan, 11 = Dec)
	totalAnnualIncome: number;
}

export interface AnnualFinancialMatrixResult {
	year: number;
	propertyName: string;
	propertyIncomes: AnnualPropertyIncomeRow[];
	monthlyTotalIncome: number[]; // 12 elements
	monthlyOperationalExpense: number[]; // 12 elements
	monthlyInvestmentExpense: number[]; // 12 elements
	monthlyTotalExpense: number[]; // 12 elements
	monthlyNetProfit: number[]; // 12 elements
	monthlyProfitMargin: number[]; // 12 elements (percentage)
	grandTotals: {
		totalIncome: number;
		totalOperationalExpense: number;
		totalInvestmentExpense: number;
		totalExpense: number;
		netProfit: number;
		profitMargin: number;
	};
}

export class ReportRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	private getCategoryLabel(category: string): string {
		const labels: Record<string, string> = {
			ELECTRICITY: "Listrik & Daya PLN",
			WATER: "Air Bersih PDAM",
			INTERNET: "Abonemen WiFi Indihome",
			CLEANING: "Kebersihan & Sampah",
			MAINTENANCE: "Maintenance & Perbaikan",
			SUPPLIES: "Perlengkapan & Logistik",
			SALARY: "Gaji Staf Pengelola",
			SECURITY: "Iuran Keamanan Lingkungan",
			TAX: "PBB & Pajak Usaha",
			OTHER: "Operasional Lain-lain",
			RENT: "Pendapatan Sewa Kos",
		};
		return labels[category] || category;
	}

	/**
	 * Menghitung seluruh metrik keuangan bulanan secara deterministik dari database PostgreSQL
	 */
	async getMonthlyFinancialSummary(
		propertyIds?: string[],
		month?: number,
		year?: number,
	): Promise<MonthlyFinancialSummary> {
		const now = new Date();
		const targetMonth = month || now.getMonth() + 1;
		const targetYear = year || now.getFullYear();

		const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0);
		const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

		// 1. Agregasi Kamar & Okupansi
		const roomWhere: Prisma.RoomWhereInput =
			propertyIds && propertyIds.length > 0
				? { propertyId: { in: propertyIds } }
				: {};

		const rooms = await this.db.room.findMany({
			where: roomWhere,
			select: { status: true },
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

		// 2. Agregasi Invoices (Penagihan Sewa)
		const invoiceWhere: Prisma.InvoiceWhereInput = {
			periodMonth: targetMonth,
			periodYear: targetYear,
			...(propertyIds && propertyIds.length > 0
				? { contract: { room: { propertyId: { in: propertyIds } } } }
				: {}),
		};

		const invoices = await this.db.invoice.findMany({
			where: invoiceWhere,
			select: { amount: true, status: true, dueDate: true, paidAt: true },
		});

		const totalInvoices = invoices.length;
		let paidInvoices = 0;
		let pendingInvoices = 0;
		let overdueInvoices = 0;
		let totalInvoicePaidAmount = 0;
		let totalOutstanding = 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (const inv of invoices) {
			const amt = Number(inv.amount);
			if (inv.status === "PAID") {
				paidInvoices++;
				totalInvoicePaidAmount += amt;
			} else if (inv.status === "OVERDUE" || new Date(inv.dueDate) < today) {
				overdueInvoices++;
				totalOutstanding += amt;
			} else {
				pendingInvoices++;
				totalOutstanding += amt;
			}
		}

		const collectionRate =
			totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 100;

		// 3. Agregasi Mutasi Kas (Transactions)
		const txWhere: Prisma.TransactionWhereInput = {
			transactionDate: { gte: startDate, lte: endDate },
			...(propertyIds && propertyIds.length > 0
				? { propertyId: { in: propertyIds } }
				: {}),
		};

		const transactions = await this.db.transaction.findMany({
			where: txWhere,
			select: {
				type: true,
				category: true,
				classification: true,
				amount: true,
				complaintId: true,
				description: true,
			},
		});

		let txIncomeAmount = 0;
		let operationalExpense = 0;
		let investmentExpense = 0;
		let complaintTotalCost = 0;
		let complaintCount = 0;

		const expenseCategoryMap = new Map<string, number>();

		for (const tx of transactions) {
			const amt = Number(tx.amount);
			if (tx.type === "INCOME") {
				txIncomeAmount += amt;
			} else if (tx.type === "EXPENSE") {
				if (tx.classification === "INVESTMENT") {
					investmentExpense += amt;
				} else {
					operationalExpense += amt;
				}

				const catKey = tx.category || "OTHER";
				expenseCategoryMap.set(
					catKey,
					(expenseCategoryMap.get(catKey) || 0) + amt,
				);

				if (tx.complaintId) {
					complaintTotalCost += amt;
					complaintCount++;
				}
			}
		}

		// Total Pendapatan = Invoices yang dibayar atau transaksi pemasukan kas (ambil nilai terbesar agar akurat)
		const totalIncome = Math.max(totalInvoicePaidAmount, txIncomeAmount);
		const totalExpense = operationalExpense + investmentExpense;
		const netProfit = totalIncome - totalExpense;
		const profitMarginPercentage =
			totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

		// 4. Susun Breakdown Pengeluaran Terbesar
		const sortedCategories = Array.from(expenseCategoryMap.entries()).sort(
			(a, b) => b[1] - a[1],
		);

		const expenseBreakdown = sortedCategories.map(([cat, amt], idx) => {
			const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
			return {
				id: idx + 1,
				category: this.getCategoryLabel(cat),
				amount: amt,
				percentage: Number(pct.toFixed(1)),
				description: `Pengeluaran ${this.getCategoryLabel(cat)} bulan ini`,
			};
		});

		const complaintPercentage =
			totalExpense > 0 ? (complaintTotalCost / totalExpense) * 100 : 0;

		return {
			totalIncome,
			totalExpense,
			operationalExpense,
			investmentExpense,
			netProfit,
			profitMarginPercentage: Number(profitMarginPercentage.toFixed(1)),
			roomStatus: {
				totalRooms,
				occupiedRooms,
				vacantRooms,
				maintenanceRooms,
				occupancyRate: Number(occupancyRate.toFixed(1)),
			},
			collection: {
				totalInvoices,
				paidInvoices,
				pendingInvoices,
				overdueInvoices,
				collectionRate: Number(collectionRate.toFixed(1)),
				totalOutstanding,
			},
			expenseBreakdown,
			complaintExpenses: {
				totalCost: complaintTotalCost,
				totalComplaints: complaintCount,
				percentageOfExpense: Number(complaintPercentage.toFixed(1)),
			},
		};
	}

	/**
	 * Menghitung Matriks Keuangan Tahunan (12 Bulan) untuk Seluruh Properti / Properti Tertentu
	 */
	async getAnnualFinancialMatrix(
		year: number,
		propertyIds?: string[],
	): Promise<AnnualFinancialMatrixResult> {
		const targetYear = year || new Date().getFullYear();
		const startDate = new Date(targetYear, 0, 1, 0, 0, 0);
		const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

		const propertyWhere: Prisma.PropertyWhereInput =
			propertyIds && propertyIds.length > 0 ? { id: { in: propertyIds } } : {};

		const properties = await this.db.property.findMany({
			where: propertyWhere,
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		});

		// Initialize arrays for 12 months (Jan–Dec)
		const monthlyOperationalExpense = new Array(12).fill(0);
		const monthlyInvestmentExpense = new Array(12).fill(0);
		const monthlyTotalExpense = new Array(12).fill(0);
		const monthlyTotalIncome = new Array(12).fill(0);
		const monthlyNetProfit = new Array(12).fill(0);
		const monthlyProfitMargin = new Array(12).fill(0);

		// Map propertyId -> array of 12 monthly invoice income values
		const propertyInvoiceIncomeMap = new Map<string, number[]>();
		// Map propertyId -> array of 12 monthly tx income values
		const propertyTxIncomeMap = new Map<string, number[]>();
		for (const p of properties) {
			propertyInvoiceIncomeMap.set(p.id, new Array(12).fill(0));
			propertyTxIncomeMap.set(p.id, new Array(12).fill(0));
		}

		// 1. Query Invoices for the whole year
		const invoices = await this.db.invoice.findMany({
			where: {
				periodYear: targetYear,
				status: "PAID",
				...(propertyIds && propertyIds.length > 0
					? { contract: { room: { propertyId: { in: propertyIds } } } }
					: {}),
			},
			select: {
				periodMonth: true,
				amount: true,
				contract: {
					select: {
						room: {
							select: {
								propertyId: true,
							},
						},
					},
				},
			},
		});

		for (const inv of invoices) {
			const m = (inv.periodMonth || 1) - 1; // 0-indexed
			if (m >= 0 && m < 12) {
				const amt = Number(inv.amount);
				const pId = inv.contract.room.propertyId;
				const arr = propertyInvoiceIncomeMap.get(pId);
				if (arr) {
					arr[m] += amt;
				}
			}
		}

		// 2. Query Transactions for the whole year
		const transactions = await this.db.transaction.findMany({
			where: {
				transactionDate: { gte: startDate, lte: endDate },
				...(propertyIds && propertyIds.length > 0
					? { propertyId: { in: propertyIds } }
					: {}),
			},
			select: {
				propertyId: true,
				type: true,
				classification: true,
				amount: true,
				transactionDate: true,
			},
		});

		for (const tx of transactions) {
			const m = new Date(tx.transactionDate).getMonth();
			const amt = Number(tx.amount);

			if (tx.type === "INCOME") {
				if (tx.propertyId) {
					const arr = propertyTxIncomeMap.get(tx.propertyId);
					if (arr) {
						arr[m] += amt;
					}
				}
			} else if (tx.type === "EXPENSE") {
				if (tx.classification === "INVESTMENT") {
					monthlyInvestmentExpense[m] += amt;
				} else {
					monthlyOperationalExpense[m] += amt;
				}
				monthlyTotalExpense[m] += amt;
			}
		}

		// Consolidate monthly income per property (take Math.max of invoice vs transaction income)
		const propertyIncomeMap = new Map<string, number[]>();
		for (const p of properties) {
			const invArr =
				propertyInvoiceIncomeMap.get(p.id) || new Array(12).fill(0);
			const txArr = propertyTxIncomeMap.get(p.id) || new Array(12).fill(0);
			const finalArr = new Array(12).fill(0);
			for (let m = 0; m < 12; m++) {
				finalArr[m] = Math.max(invArr[m], txArr[m]);
				monthlyTotalIncome[m] += finalArr[m];
			}
			propertyIncomeMap.set(p.id, finalArr);
		}

		// 3. Compute Net Profit & Margin for each month
		for (let m = 0; m < 12; m++) {
			monthlyNetProfit[m] = monthlyTotalIncome[m] - monthlyTotalExpense[m];
			monthlyProfitMargin[m] =
				monthlyTotalIncome[m] > 0
					? Number(
							((monthlyNetProfit[m] / monthlyTotalIncome[m]) * 100).toFixed(1),
						)
					: 0;
		}

		// 4. Construct rows per property
		const propertyIncomes: AnnualPropertyIncomeRow[] = properties.map((p) => {
			const monthly = propertyIncomeMap.get(p.id) || new Array(12).fill(0);
			const total = monthly.reduce((sum, v) => sum + v, 0);
			return {
				propertyId: p.id,
				propertyName: p.name,
				monthlyIncome: monthly,
				totalAnnualIncome: total,
			};
		});

		// 5. Grand Totals
		const totalIncome = monthlyTotalIncome.reduce((s, v) => s + v, 0);
		const totalOperationalExpense = monthlyOperationalExpense.reduce(
			(s, v) => s + v,
			0,
		);
		const totalInvestmentExpense = monthlyInvestmentExpense.reduce(
			(s, v) => s + v,
			0,
		);
		const totalExpense = totalOperationalExpense + totalInvestmentExpense;
		const netProfit = totalIncome - totalExpense;
		const profitMargin =
			totalIncome > 0
				? Number(((netProfit / totalIncome) * 100).toFixed(1))
				: 0;

		const propertyNameLabel =
			properties.length === 1
				? properties[0]?.name || "Kos"
				: "Semua Cabang Kos (Konsolidasi)";

		return {
			year: targetYear,
			propertyName: propertyNameLabel,
			propertyIncomes,
			monthlyTotalIncome,
			monthlyOperationalExpense,
			monthlyInvestmentExpense,
			monthlyTotalExpense,
			monthlyNetProfit,
			monthlyProfitMargin,
			grandTotals: {
				totalIncome,
				totalOperationalExpense,
				totalInvestmentExpense,
				totalExpense,
				netProfit,
				profitMargin,
			},
		};
	}

	/**
	 * Cari Laporan Finansial AI yang telah disimpan di database
	 */
	async findStoredAiReport(
		propertyId: string | null,
		periodMonth: number,
		periodYear: number,
	) {
		return this.db.aiFinancialReport.findFirst({
			where: {
				propertyId: propertyId || null,
				periodMonth,
				periodYear,
			},
			orderBy: {
				updatedAt: "desc",
			},
		});
	}

	/**
	 * Simpan atau perbarui Laporan Finansial AI di database
	 */
	async saveStoredAiReport(data: {
		propertyId: string | null;
		periodMonth: number;
		periodYear: number;
		totalIncome: number;
		totalExpense: number;
		netProfit: number;
		occupancyRate: number;
		aiNarrativeSummary: Prisma.InputJsonValue;
		pdfFileUrl?: string | null;
	}) {
		const existing = await this.findStoredAiReport(
			data.propertyId,
			data.periodMonth,
			data.periodYear,
		);

		if (existing) {
			return this.db.aiFinancialReport.update({
				where: { id: existing.id },
				data: {
					totalIncome: data.totalIncome,
					totalExpense: data.totalExpense,
					netProfit: data.netProfit,
					occupancyRate: data.occupancyRate,
					aiNarrativeSummary: data.aiNarrativeSummary,
					pdfFileUrl: data.pdfFileUrl ?? existing.pdfFileUrl,
					updatedAt: new Date(),
				},
			});
		}

		return this.db.aiFinancialReport.create({
			data: {
				propertyId: data.propertyId,
				periodMonth: data.periodMonth,
				periodYear: data.periodYear,
				totalIncome: data.totalIncome,
				totalExpense: data.totalExpense,
				netProfit: data.netProfit,
				occupancyRate: data.occupancyRate,
				aiNarrativeSummary: data.aiNarrativeSummary,
				pdfFileUrl: data.pdfFileUrl ?? null,
			},
		});
	}
}

export const reportRepository = new ReportRepository();
