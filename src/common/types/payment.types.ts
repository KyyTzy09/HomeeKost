export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIAL";

export interface PaymentTransactionItem {
	id: string;
	amount: number;
	paymentMethod: string;
	transactionDate: string;
	description?: string | null;
}

export interface PaymentItem {
	id: string;
	invoiceNumber: string;
	contractId: string;
	tenantId: string;
	tenantName: string;
	tenantPhone: string;
	roomId: string;
	roomNumber: string;
	propertyId: string;
	propertyName: string;
	period: string;
	periodMonth: number;
	periodYear: number;
	amount: number;
	dueDate: string;
	rawDueDate: string;
	dueDaysRemaining: number;
	dueStatusBadge: {
		text: string;
		variant: "green" | "amber" | "red" | "gray";
	};
	status: PaymentStatus;
	paidAt?: string | null;
	paymentMethod?: string;
	pdfUrl?: string | null;
	directWhatsAppUrl: string;
	paidAmount?: number;
	remainingAmount?: number;
	isPartial?: boolean;
	installmentCount?: number;
	transactions?: PaymentTransactionItem[];
}

export interface PaymentStats {
	totalInvoices: number;
	paidCount: number;
	pendingCount: number;
	overdueCount: number;
	totalAmount: number;
	paidAmount: number;
	unpaidAmount: number;
	collectionRate: number; // Persentase tagihan tertagih (%)
}

export interface PaymentFilterParams {
	propertyId?: string;
	status?: "ALL" | "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
	month?: number;
	year?: number;
	search?: string;
	sortBy?: "dueDate" | "amount" | "createdAt";
	sortOrder?: "asc" | "desc";
	page?: number;
	limit?: number;
}

export interface PaginatedPayments {
	data: PaymentItem[];
	totalCount: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
}

export interface ConfirmPaymentResult {
	success: boolean;
	invoiceId: string;
	transactionId?: string;
	whatsappSent: boolean;
	directWhatsAppUrl?: string;
}
