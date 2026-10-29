export interface PaymentItem {
	id: string;
	tenantName: string;
	roomNumber: string;
	period: string;
	dueDate: string; // ISO date string YYYY-MM-DD
	amount: number;
	status: "PAID" | "PENDING" | "OVERDUE";
	paidAt: string | null;
}

export const STATUS_LABEL: Record<PaymentItem["status"], string> = {
	PAID: "Lunas",
	PENDING: "Belum Lunas",
	OVERDUE: "Terlambat",
};

export const STATUS_BADGE: Record<PaymentItem["status"], string> = {
	PAID: "badge green",
	PENDING: "badge amber",
	OVERDUE: "badge red",
};

export function formatDueDate(isoDate: string): string {
	const d = new Date(isoDate);
	return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
	}).format(amount);
}
