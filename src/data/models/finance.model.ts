import type {
	Invoice,
	InvoiceStatus,
	Transaction,
	TransactionCategory,
	TransactionType,
} from "../../generated/prisma/client.js";

export type InvoiceBase = Invoice;
export type TransactionBase = Transaction;

export type InvoiceStatusEnum = InvoiceStatus;
export type TransactionTypeEnum = TransactionType;
export type TransactionCategoryEnum = TransactionCategory;
