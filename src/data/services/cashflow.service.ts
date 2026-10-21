import {
	type AnnualFinancialMatrix,
	type AnnualFinancialMonth,
	CATEGORY_LABEL_MAP,
	CATEGORY_REVERSE_MAP,
	type CategoryCostItem,
	type FinancialSummary,
	type MonthlyTrendPoint,
	type PaginatedTransactions,
	type ProfitLossRow,
	type SessionUser,
	type TransactionCategoryKey,
	type TransactionClassification,
	type TransactionItem,
	type TransactionPaymentMethod,
	type TransactionType,
	type TransactionTypeKey,
} from "../../common/types/index.ts";
import type {
	AnnualFinancialQueryInput,
	FinancialSummaryQueryInput,
	TransactionFilterOutput,
	TransactionFormValues,
} from "../../common/validations/index.ts";
import type {
	ExpenseClassification,
	PaymentMethod,
	TransactionType as PrismaTransactionType,
	TransactionCategory,
} from "../../generated/prisma/client.js";
import { formatShortDueDate, getMonthDateRange } from "../../lib/date-utils.ts";
import { propertyRepository } from "../repositories/property.repository.ts";
import {
	type TransactionRepository,
	transactionRepository,
} from "../repositories/transaction.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";

export class CashflowService {
	constructor(
		private readonly transactionRepo: TransactionRepository = transactionRepository,
		private readonly propertyRepo = propertyRepository,
		private readonly userRepo = new UserRepository(),
	) {}

	private async resolveAccessiblePropertyIds(
		user: SessionUser,
		requestedPropertyId?: string,
	): Promise<string[]> {
		const userData = await this.userRepo.findWithRole(user.id);
		const isSuperAdmin = userData?.role.name === "SUPER_ADMIN";

		if (isSuperAdmin) {
			if (
				requestedPropertyId &&
				requestedPropertyId !== "all" &&
				requestedPropertyId !== "Semua Kost"
			) {
				return [requestedPropertyId];
			}
			return []; // Empty means all properties for SuperAdmin
		}

		// Admin Staf: resolve assigned properties
		const accessibleProperties = await this.propertyRepo.findAccessibleByUserId(
			user.id,
		);
		const accessibleIds = accessibleProperties.map((p) => p.id);

		if (
			requestedPropertyId &&
			requestedPropertyId !== "all" &&
			requestedPropertyId !== "Semua Kost"
		) {
			if (!accessibleIds.includes(requestedPropertyId)) {
				throw new Error("Anda tidak memiliki hak akses untuk cabang kos ini.");
			}
			return [requestedPropertyId];
		}

		return accessibleIds;
	}

	private mapPrismaType(type: string): {
		type: TransactionType;
		typeKey: TransactionTypeKey;
	} {
		if (type === "INCOME" || type === "Income") {
			return { type: "Income", typeKey: "INCOME" };
		}
		return { type: "Expense", typeKey: "EXPENSE" };
	}

	private mapPrismaCategory(cat: string): {
		categoryKey: TransactionCategoryKey;
		categoryLabel: string;
	} {
		const upper = cat.toUpperCase();
		if (upper in CATEGORY_LABEL_MAP) {
			const key = upper as TransactionCategoryKey;
			return { categoryKey: key, categoryLabel: CATEGORY_LABEL_MAP[key] };
		}
		if (cat in CATEGORY_REVERSE_MAP) {
			const key = CATEGORY_REVERSE_MAP[cat];
			return { categoryKey: key, categoryLabel: CATEGORY_LABEL_MAP[key] };
		}
		return { categoryKey: "OTHER", categoryLabel: "Lain-lain" };
	}

	private mapPrismaMethod(method?: string | null): TransactionPaymentMethod {
		if (method === "CASH" || method === "Cash") return "Cash";
		if (method === "QRIS") return "QRIS";
		return "Transfer";
	}

	private formatRawDate(date: Date): string {
		const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
		return wibDate.toISOString().split("T")[0];
	}

	async getTransactions(
		input: TransactionFilterOutput,
		user: SessionUser,
	): Promise<PaginatedTransactions> {
		const propertyIds = await this.resolveAccessiblePropertyIds(
			user,
			input.propertyId,
		);

		let prismaType: PrismaTransactionType | undefined;
		if (input.type && input.type !== "ALL") {
			prismaType =
				input.type === "INCOME" || input.type === "Income"
					? "INCOME"
					: "EXPENSE";
		}

		let prismaCategory: TransactionCategory | undefined;
		if (input.category && input.category !== "all") {
			const mapped = this.mapPrismaCategory(input.category);
			prismaCategory = mapped.categoryKey as TransactionCategory;
		}

		const startDate = input.startDate
			? new Date(`${input.startDate}T00:00:00+07:00`)
			: undefined;
		const endDate = input.endDate
			? new Date(`${input.endDate}T23:59:59.999+07:00`)
			: undefined;

		const page = Number(input.page) || 1;
		const limit = Number(input.limit) || 10;
		const skip = (page - 1) * limit;

		const [rawList, totalCount] = await Promise.all([
			this.transactionRepo.findMany({
				propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
				search: input.search,
				type: prismaType,
				category: prismaCategory,
				startDate,
				endDate,
				sortBy: input.sortBy || "transactionDate",
				sortOrder: input.sortOrder || "desc",
				skip,
				take: limit,
			}),
			this.transactionRepo.count({
				propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
				search: input.search,
				type: prismaType,
				category: prismaCategory,
				startDate,
				endDate,
			}),
		]);

		const data: TransactionItem[] = rawList.map((t) => {
			const typeMapped = this.mapPrismaType(t.type);
			const categoryMapped = this.mapPrismaCategory(t.category);
			const rawDateStr = this.formatRawDate(t.transactionDate);

			return {
				id: t.id,
				propertyId: t.propertyId || "",
				propertyName: t.property?.name || "Kos",
				createdBy: t.createdBy,
				creatorName: t.creator?.name || "Staff",
				date: formatShortDueDate(rawDateStr),
				rawDate: rawDateStr,
				category: categoryMapped.categoryLabel,
				categoryKey: categoryMapped.categoryKey,
				description: t.description || "Transaksi Kas",
				type: typeMapped.type,
				typeKey: typeMapped.typeKey,
				classification:
					(t.classification as TransactionClassification) || "OPERATIONAL",
				amount: Number(t.amount),
				method: this.mapPrismaMethod(t.paymentMethod),
				invoiceId: t.invoiceId,
				complaintId: t.complaintId,
			};
		});

		return {
			data,
			totalCount,
			totalPages: Math.ceil(totalCount / limit) || 1,
			currentPage: page,
			pageSize: limit,
		};
	}

	async getTransactionById(
		id: string,
		user: SessionUser,
	): Promise<TransactionItem | null> {
		const t = await this.transactionRepo.findById(id);
		if (!t) return null;

		await this.resolveAccessiblePropertyIds(user, t.propertyId || undefined);

		const typeMapped = this.mapPrismaType(t.type);
		const categoryMapped = this.mapPrismaCategory(t.category);
		const rawDateStr = this.formatRawDate(t.transactionDate);

		return {
			id: t.id,
			propertyId: t.propertyId || "",
			propertyName: t.property?.name || "Kos",
			createdBy: t.createdBy,
			creatorName: t.creator?.name || "Staff",
			date: formatShortDueDate(rawDateStr),
			rawDate: rawDateStr,
			category: categoryMapped.categoryLabel,
			categoryKey: categoryMapped.categoryKey,
			description: t.description || "Transaksi Kas",
			type: typeMapped.type,
			typeKey: typeMapped.typeKey,
			classification:
				(t.classification as TransactionClassification) || "OPERATIONAL",
			amount: Number(t.amount),
			method: this.mapPrismaMethod(t.paymentMethod),
			invoiceId: t.invoiceId,
			complaintId: t.complaintId,
		};
	}

	async createTransaction(
		input: TransactionFormValues,
		user: SessionUser,
	): Promise<TransactionItem> {
		console.log("Creating transaction with input:", input, "for user:", user);
		await this.resolveAccessiblePropertyIds(user, input.propertyId);

		const typeKey: PrismaTransactionType =
			input.type === "Income" || input.type === "INCOME" ? "INCOME" : "EXPENSE";

		const categoryMapped = this.mapPrismaCategory(input.category);
		const paymentMethod: PaymentMethod =
			input.method === "Cash" || input.method === "CASH"
				? "CASH"
				: input.method === "QRIS"
					? "QRIS"
					: "TRANSFER";

		const classification: ExpenseClassification | null =
			typeKey === "EXPENSE"
				? input.classification === "Investasi" ||
					input.classification === "INVESTMENT"
					? "INVESTMENT"
					: "OPERATIONAL"
				: null;

		const txDate = input.date
			? new Date(`${input.date}T12:00:00.000Z`)
			: new Date();

		const created = await this.transactionRepo.create({
			propertyId: input.propertyId,
			createdBy: user.id,
			type: typeKey,
			category: categoryMapped.categoryKey as TransactionCategory,
			classification,
			paymentMethod,
			amount: input.amount,
			description: input.description,
			transactionDate: txDate,
		});

		const rawDateStr = this.formatRawDate(created.transactionDate);
		const typeResult = this.mapPrismaType(created.type);

		return {
			id: created.id,
			propertyId: created.propertyId || "",
			propertyName: created.property?.name || "Kos",
			createdBy: created.createdBy,
			creatorName: created.creator?.name || user.name,
			date: formatShortDueDate(rawDateStr),
			rawDate: rawDateStr,
			category: categoryMapped.categoryLabel,
			categoryKey: categoryMapped.categoryKey,
			description: created.description || "Transaksi Kas",
			type: typeResult.type,
			typeKey: typeResult.typeKey,
			classification:
				(created.classification as TransactionClassification) || "OPERATIONAL",
			amount: Number(created.amount),
			method: this.mapPrismaMethod(created.paymentMethod),
			invoiceId: created.invoiceId,
			complaintId: created.complaintId,
		};
	}

	async updateTransaction(
		id: string,
		input: TransactionFormValues,
		user: SessionUser,
	): Promise<TransactionItem> {
		const existing = await this.transactionRepo.findById(id);
		if (!existing) {
			throw new Error("Transaksi tidak ditemukan.");
		}

		const isSuperAdmin = user.role?.name === "SUPER_ADMIN";
		if (!isSuperAdmin && existing.createdBy !== user.id) {
			throw new Error(
				"Anda hanya dapat mengubah transaksi yang Anda buat sendiri.",
			);
		}

		await this.resolveAccessiblePropertyIds(user, input.propertyId);

		const typeKey: PrismaTransactionType =
			input.type === "Income" || input.type === "INCOME" ? "INCOME" : "EXPENSE";

		const categoryMapped = this.mapPrismaCategory(input.category);
		const paymentMethod: PaymentMethod =
			input.method === "Cash" || input.method === "CASH"
				? "CASH"
				: input.method === "QRIS"
					? "QRIS"
					: "TRANSFER";

		const classification: ExpenseClassification | null =
			typeKey === "EXPENSE"
				? input.classification === "Investasi" ||
					input.classification === "INVESTMENT"
					? "INVESTMENT"
					: "OPERATIONAL"
				: null;

		const txDate = input.date
			? new Date(`${input.date}T12:00:00.000Z`)
			: undefined;

		const updated = await this.transactionRepo.update(id, {
			propertyId: input.propertyId,
			type: typeKey,
			category: categoryMapped.categoryKey as TransactionCategory,
			classification,
			paymentMethod,
			amount: input.amount,
			description: input.description,
			transactionDate: txDate,
		});

		const rawDateStr = this.formatRawDate(updated.transactionDate);
		const typeResult = this.mapPrismaType(updated.type);

		return {
			id: updated.id,
			propertyId: updated.propertyId || "",
			propertyName: updated.property?.name || "Kos",
			createdBy: updated.createdBy,
			creatorName: updated.creator?.name || user.name,
			date: formatShortDueDate(rawDateStr),
			rawDate: rawDateStr,
			category: categoryMapped.categoryLabel,
			categoryKey: categoryMapped.categoryKey,
			description: updated.description || "Transaksi Kas",
			type: typeResult.type,
			typeKey: typeResult.typeKey,
			classification:
				(updated.classification as TransactionClassification) || "OPERATIONAL",
			amount: Number(updated.amount),
			method: this.mapPrismaMethod(updated.paymentMethod),
			invoiceId: updated.invoiceId,
			complaintId: updated.complaintId,
		};
	}

	async deleteTransaction(
		id: string,
		user: SessionUser,
	): Promise<{ success: boolean; id: string }> {
		const existing = await this.transactionRepo.findById(id);
		if (!existing) {
			throw new Error("Transaksi tidak ditemukan.");
		}

		const isSuperAdmin = user.role?.name === "SUPER_ADMIN";
		if (!isSuperAdmin && existing.createdBy !== user.id) {
			throw new Error(
				"Anda hanya dapat menghapus transaksi yang Anda buat sendiri.",
			);
		}

		await this.transactionRepo.deleteWithCascade(id, existing);
		return { success: true, id };
	}

	async getFinancialSummary(
		input: FinancialSummaryQueryInput,
		user: SessionUser,
	): Promise<FinancialSummary> {
		const propertyIds = await this.resolveAccessiblePropertyIds(
			user,
			input.propertyId,
		);

		const now = new Date();
		const targetMonth = input.month || now.getMonth() + 1; // 1-12
		const targetYear = input.year || now.getFullYear();

		const { startDate: startOfMonth, endDate: endOfMonth } = getMonthDateRange(
			targetMonth,
			targetYear,
		);

		const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
		const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
		const { startDate: startOfPrevMonth, endDate: endOfPrevMonth } =
			getMonthDateRange(prevMonth, prevYear);

		const props = propertyIds.length > 0 ? propertyIds : undefined;

		const [
			incomeCurrent,
			expenseCurrent,
			operationalCurrent,
			investmentCurrent,
			incomePrev,
			expensePrev,
		] = await Promise.all([
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "INCOME",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				classification: "OPERATIONAL",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				classification: "INVESTMENT",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "INCOME",
				startDate: startOfPrevMonth,
				endDate: endOfPrevMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				startDate: startOfPrevMonth,
				endDate: endOfPrevMonth,
			}),
		]);

		const totalIncome = incomeCurrent.totalAmount;
		const totalExpense = expenseCurrent.totalAmount;
		const netProfit = totalIncome - totalExpense;

		const prevIncome = incomePrev.totalAmount;
		const prevExpense = expensePrev.totalAmount;
		const prevNetProfit = prevIncome - prevExpense;

		const calculateGrowth = (current: number, prev: number) => {
			if (prev === 0) return current > 0 ? 100 : 0;
			return Math.round(((current - prev) / prev) * 100 * 10) / 10;
		};

		const monthsId = [
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

		return {
			periodMonth: targetMonth,
			periodYear: targetYear,
			periodLabel: `${monthsId[targetMonth - 1]} ${targetYear}`,
			totalIncome,
			totalExpense,
			netProfit,
			operationalExpense: operationalCurrent.totalAmount,
			investmentExpense: investmentCurrent.totalAmount,
			expenseRatio:
				totalIncome > 0
					? Math.round((totalExpense / totalIncome) * 100 * 10) / 10
					: 0,
			momGrowth: {
				incomeGrowthPercent: calculateGrowth(totalIncome, prevIncome),
				expenseGrowthPercent: calculateGrowth(totalExpense, prevExpense),
				profitGrowthPercent: calculateGrowth(netProfit, prevNetProfit),
			},
		};
	}

	async getCostComposition(
		input: FinancialSummaryQueryInput,
		user: SessionUser,
	): Promise<CategoryCostItem[]> {
		const propertyIds = await this.resolveAccessiblePropertyIds(
			user,
			input.propertyId,
		);

		const now = new Date();
		const targetMonth = input.month || now.getMonth() + 1;
		const targetYear = input.year || now.getFullYear();

		const { startDate: startOfMonth, endDate: endOfMonth } = getMonthDateRange(
			targetMonth,
			targetYear,
		);

		const groups = await this.transactionRepo.groupByCategory({
			propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
			type: "EXPENSE",
			startDate: startOfMonth,
			endDate: endOfMonth,
		});

		const totalExpense = groups.reduce((acc, g) => acc + g.amount, 0);

		const colors: Record<TransactionCategoryKey, string> = {
			RENT: "#568062",
			UTILITIES: "#718b78",
			INTERNET: "#2b6cb0",
			MAINTENANCE: "#b18a4b",
			SALARY: "#8fa594",
			OTHER: "#b66b68",
		};

		return groups.map((g) => {
			const catKey = g.category as TransactionCategoryKey;
			const label = CATEGORY_LABEL_MAP[catKey] || "Lain-lain";
			const percentage =
				totalExpense > 0
					? Math.round((g.amount / totalExpense) * 1000) / 10
					: 0;

			return {
				category: label,
				categoryKey: catKey,
				amount: g.amount,
				percentage,
				color: colors[catKey] || "#718b78",
			};
		});
	}

	async getRecentMonthlyTrends(
		input: { propertyId?: string; count?: number },
		user: SessionUser,
	): Promise<MonthlyTrendPoint[]> {
		const propertyIds = await this.resolveAccessiblePropertyIds(
			user,
			input.propertyId,
		);

		const count = input.count || 6;
		const now = new Date();
		const results: MonthlyTrendPoint[] = [];

		const monthsId = [
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
		const shortMonths = [
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

		for (let i = count - 1; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const m = d.getMonth() + 1;
			const y = d.getFullYear();

			const { startDate: start, endDate: end } = getMonthDateRange(m, y);

			const [incomeAgg, expenseAgg] = await Promise.all([
				this.transactionRepo.aggregateAmounts({
					propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
					type: "INCOME",
					startDate: start,
					endDate: end,
				}),
				this.transactionRepo.aggregateAmounts({
					propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
					type: "EXPENSE",
					startDate: start,
					endDate: end,
				}),
			]);

			const income = incomeAgg.totalAmount;
			const expense = expenseAgg.totalAmount;

			results.push({
				month: `${monthsId[m - 1]} ${y}`,
				shortMonth: shortMonths[m - 1],
				income,
				expense,
				netProfit: income - expense,
			});
		}

		return results;
	}

	async getProfitLossStatement(
		input: FinancialSummaryQueryInput,
		user: SessionUser,
	): Promise<ProfitLossRow[]> {
		const propertyIds = await this.resolveAccessiblePropertyIds(
			user,
			input.propertyId,
		);

		const now = new Date();
		const targetMonth = input.month || now.getMonth() + 1;
		const targetYear = input.year || now.getFullYear();

		const { startDate: startOfMonth, endDate: endOfMonth } = getMonthDateRange(
			targetMonth,
			targetYear,
		);

		const monthsId = [
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
		const periodLabel = `${monthsId[targetMonth - 1]} ${targetYear}`;

		const props = propertyIds.length > 0 ? propertyIds : undefined;

		const [
			incomeTotal,
			expenseTotal,
			operationalTotal,
			investmentTotal,
			allProps,
		] = await Promise.all([
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "INCOME",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				classification: "OPERATIONAL",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.transactionRepo.aggregateAmounts({
				propertyIds: props,
				type: "EXPENSE",
				classification: "INVESTMENT",
				startDate: startOfMonth,
				endDate: endOfMonth,
			}),
			this.propertyRepo.findAll(),
		]);

		const rows: ProfitLossRow[] = [
			{
				account: "Total Pendapatan",
				period: periodLabel,
				amount: incomeTotal.totalAmount,
				isTotal: true,
			},
		];

		// Sub items per property
		for (const p of allProps) {
			if (props && !props.includes(p.id)) continue;
			const propIncome = await this.transactionRepo.aggregateAmounts({
				propertyIds: [p.id],
				type: "INCOME",
				startDate: startOfMonth,
				endDate: endOfMonth,
			});
			if (propIncome.totalAmount > 0) {
				rows.push({
					account: p.name,
					period: periodLabel,
					amount: propIncome.totalAmount,
					isSubItem: true,
				});
			}
		}

		rows.push(
			{
				account: "Total Biaya",
				period: periodLabel,
				amount: expenseTotal.totalAmount,
				isTotal: true,
			},
			{
				account: "Operasional (Listrik, WiFi, Gaji)",
				period: periodLabel,
				amount: operationalTotal.totalAmount,
				isSubItem: true,
			},
			{
				account: "Investasi / Aset Baru",
				period: periodLabel,
				amount: investmentTotal.totalAmount,
				isSubItem: true,
			},
			{
				account: "Laba Bersih",
				period: periodLabel,
				amount: incomeTotal.totalAmount - expenseTotal.totalAmount,
				isProfit: true,
			},
		);

		return rows;
	}

	async getAnnualFinancialMatrix(
		input: AnnualFinancialQueryInput,
		user: SessionUser,
	): Promise<AnnualFinancialMatrix> {
		const propertyIds = await this.resolveAccessiblePropertyIds(
			user,
			input.propertyId,
		);

		const targetYear = input.year || new Date().getFullYear();
		const startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
		const endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

		const rawTransactions = await this.transactionRepo.findForAnnualMatrix({
			propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
			startDate,
			endDate,
		});

		const monthsId = [
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

		const monthsData: AnnualFinancialMonth[] = Array.from(
			{ length: 12 },
			(_, idx) => ({
				month: idx + 1,
				monthName: monthsId[idx],
				income: 0,
				operationalExpense: 0,
				investmentExpense: 0,
				totalExpense: 0,
				netProfit: 0,
			}),
		);

		for (const t of rawTransactions) {
			const mIdx = new Date(t.transactionDate).getUTCMonth(); // 0-11
			const amount = Number(t.amount);

			if (t.type === "INCOME") {
				monthsData[mIdx].income += amount;
			} else {
				if (t.classification === "INVESTMENT") {
					monthsData[mIdx].investmentExpense += amount;
				} else {
					monthsData[mIdx].operationalExpense += amount;
				}
				monthsData[mIdx].totalExpense += amount;
			}
		}

		for (const m of monthsData) {
			m.netProfit = m.income - m.totalExpense;
		}

		const totals = monthsData.reduce(
			(acc, m) => ({
				income: acc.income + m.income,
				operationalExpense: acc.operationalExpense + m.operationalExpense,
				investmentExpense: acc.investmentExpense + m.investmentExpense,
				totalExpense: acc.totalExpense + m.totalExpense,
				netProfit: acc.netProfit + m.netProfit,
			}),
			{
				income: 0,
				operationalExpense: 0,
				investmentExpense: 0,
				totalExpense: 0,
				netProfit: 0,
			},
		);

		return {
			year: targetYear,
			propertyId: input.propertyId,
			months: monthsData,
			totals,
			monthlyAverage: {
				income: Math.round(totals.income / 12),
				totalExpense: Math.round(totals.totalExpense / 12),
				netProfit: Math.round(totals.netProfit / 12),
			},
		};
	}

	async exportAnnualFinancialCsv(
		input: AnnualFinancialQueryInput,
		user: SessionUser,
	): Promise<string> {
		const matrix = await this.getAnnualFinancialMatrix(input, user);

		let propName = "Semua Properti Kos";
		if (input.propertyId && input.propertyId !== "all") {
			const p = await this.propertyRepo.findById(input.propertyId);
			if (p) propName = p.name;
		}

		const lines: string[] = [];
		// UTF-8 BOM for Excel
		lines.push("\uFEFF");
		lines.push(`"LAPORAN KEUANGAN TAHUNAN HOMEEKOST"`);
		lines.push(`"Properti: ${propName}"`);
		lines.push(`"Tahun Pembukuan: ${matrix.year}"`);
		lines.push(`"Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}"`);
		lines.push("");

		// Table Headers
		lines.push(
			`"Bulan","Pendapatan (Rp)","Biaya Operasional (Rp)","Biaya Investasi (Rp)","Total Biaya (Rp)","Laba Bersih (Rp)"`,
		);

		// Monthly Rows
		for (const m of matrix.months) {
			lines.push(
				`"${m.monthName}",${m.income},${m.operationalExpense},${m.investmentExpense},${m.totalExpense},${m.netProfit}`,
			);
		}

		lines.push("");
		// Totals & Averages
		lines.push(
			`"TOTAL TAHUN ${matrix.year}",${matrix.totals.income},${matrix.totals.operationalExpense},${matrix.totals.investmentExpense},${matrix.totals.totalExpense},${matrix.totals.netProfit}`,
		);
		lines.push(
			`"RATA-RATA BULANAN",${matrix.monthlyAverage.income},-, -,${matrix.monthlyAverage.totalExpense},${matrix.monthlyAverage.netProfit}`,
		);

		return lines.join("\n");
	}
}

export const cashflowService = new CashflowService();
