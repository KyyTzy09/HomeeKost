export type TransactionType = "Income" | "Expense";
export type TransactionPaymentMethod = "Transfer" | "Cash" | "QRIS";

export interface TransactionItem {
	id: string | number;
	date: string;
	rawDate?: string;
	property: string;
	category: string;
	description: string;
	type: TransactionType;
	amount: number;
	method?: TransactionPaymentMethod;
	invoiceId?: string | null;
}

export interface SharedCostItem {
	id?: string | number;
	description: string;
	amount: number;
	split: string;
	props: string[];
}

export interface ProfitLossRow {
	account: string;
	period: string;
	amount: number;
	isTotal?: boolean;
	isProfit?: boolean;
	isSubItem?: boolean;
}
