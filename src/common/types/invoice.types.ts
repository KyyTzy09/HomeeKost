export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIAL";

export interface InvoiceItem {
	id: string;
	number: string;
	tenantName: string;
	roomNumber: string;
	tenantPhone?: string;
	period: string;
	createdDate: string;
	dueDate: string;
	paidAt?: string | null;
	description: string;
	amount: number;
	status: InvoiceStatus;
	facilitiesIncluded?: string[];
}
