import type {
	TransactionType as PrismaTransactionType,
	TransactionCategory,
} from "../../generated/prisma/client.js";

export type TransactionType = "Income" | "Expense";
export type TransactionTypeKey = "INCOME" | "EXPENSE";
export type TransactionPaymentMethod = "Transfer" | "Cash" | "QRIS";
export type TransactionClassification = "OPERATIONAL" | "INVESTMENT";

export type TransactionCategoryKey =
	| "RENT"
	| "UTILITIES"
	| "INTERNET"
	| "MAINTENANCE"
	| "SALARY"
	| "OTHER";

export const CATEGORY_LABEL_MAP: Record<TransactionCategoryKey, string> = {
	RENT: "Sewa Kamar",
	UTILITIES: "Listrik & Air",
	INTERNET: "WiFi / Internet",
	MAINTENANCE: "Perbaikan & Pemeliharaan",
	SALARY: "Gaji & Kebersihan",
	OTHER: "Lain-lain",
};

export const CATEGORY_REVERSE_MAP: Record<string, TransactionCategoryKey> = {
	"Sewa Kamar": "RENT",
	Pendapatan: "RENT",
	"Listrik & Air": "UTILITIES",
	Utilitas: "UTILITIES",
	"WiFi / Internet": "INTERNET",
	Internet: "INTERNET",
	"Perbaikan & Pemeliharaan": "MAINTENANCE",
	Maintenance: "MAINTENANCE",
	"Gaji & Kebersihan": "SALARY",
	Operasional: "OTHER",
	Investasi: "OTHER",
	"Lain-lain": "OTHER",
};

export interface TransactionFindManyParams {
	propertyIds?: string[];
	search?: string;
	type?: PrismaTransactionType;
	category?: TransactionCategory;
	startDate?: Date;
	endDate?: Date;
	sortBy?: "transactionDate" | "amount";
	sortOrder?: "asc" | "desc";
	skip?: number;
	take?: number;
}

export interface TransactionItem {
	id: string;
	propertyId: string;
	propertyName: string;
	createdBy: string;
	creatorName: string;
	date: string;
	rawDate: string;
	category: string;
	categoryKey: TransactionCategoryKey;
	description: string;
	type: TransactionType;
	typeKey: TransactionTypeKey;
	classification?: TransactionClassification;
	amount: number;
	method: TransactionPaymentMethod;
	invoiceId?: string | null;
	complaintId?: string | null;
}

export interface TransactionFilterParams {
	propertyId?: string;
	search?: string;
	type?: "ALL" | "INCOME" | "EXPENSE";
	category?: string;
	startDate?: string;
	endDate?: string;
	sortBy?: "transactionDate" | "amount";
	sortOrder?: "asc" | "desc";
	page?: number;
	limit?: number;
}

export interface PaginatedTransactions {
	data: TransactionItem[];
	totalCount: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
}

export interface FinancialSummary {
	periodMonth: number;
	periodYear: number;
	periodLabel: string;
	totalIncome: number;
	totalExpense: number;
	netProfit: number;
	operationalExpense: number;
	investmentExpense: number;
	expenseRatio: number;
	momGrowth: {
		incomeGrowthPercent: number;
		expenseGrowthPercent: number;
		profitGrowthPercent: number;
	};
}

export interface CategoryCostItem {
	category: string;
	categoryKey: TransactionCategoryKey;
	amount: number;
	percentage: number;
	color?: string;
}

export interface MonthlyTrendPoint {
	month: string;
	shortMonth: string;
	income: number;
	expense: number;
	netProfit: number;
	cx?: number;
	cy?: number;
}

export interface ProfitLossRow {
	account: string;
	period: string;
	amount: number;
	isTotal?: boolean;
	isProfit?: boolean;
	isSubItem?: boolean;
}

export interface AnnualFinancialMonth {
	month: number;
	monthName: string;
	income: number;
	operationalExpense: number;
	investmentExpense: number;
	totalExpense: number;
	netProfit: number;
}

export interface AnnualFinancialMatrix {
	year: number;
	propertyId?: string;
	propertyName?: string;
	months: AnnualFinancialMonth[];
	totals: {
		income: number;
		operationalExpense: number;
		investmentExpense: number;
		totalExpense: number;
		netProfit: number;
	};
	monthlyAverage: {
		income: number;
		totalExpense: number;
		netProfit: number;
	};
}

export interface SharedCostItem {
	id?: string | number;
	description: string;
	amount: number;
	split: string;
	props: string[];
}
