export interface DashboardStats {
	totalRooms: number;
	occupiedRooms: number;
	vacantRooms: number;
	monthlyIncome: string;
	incomeGrowth: string;
	dueCount: number;
	dueAmount: string;
	monthlyExpense: string;
}

export interface UpcomingPaymentItem {
	id: string;
	tenant: string;
	room: string;
	dueDate: string;
	amount: string;
	badgeText: string;
	badgeClass: "amber" | "green" | "red";
	actionText: string;
}

export interface DashboardOverviewData {
	stats: DashboardStats;
	upcomingPayments: UpcomingPaymentItem[];
}
