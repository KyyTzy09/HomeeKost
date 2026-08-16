export interface DashboardStats {
	totalRooms: number;
	occupiedRooms: number;
	vacantRooms: number;
	maintenanceRooms: number;
	occupancyRate: number;
	monthlyIncome: string;
	monthlyIncomeRaw: number;
	incomeGrowth: string;
	dueCount: number;
	dueAmount: string;
	dueAmountRaw: number;
	monthlyExpense: string;
	monthlyExpenseRaw: number;
}

export interface UpcomingPaymentItem {
	id: string;
	tenant: string;
	room: string;
	dueDate: string;
	amount: string;
	amountRaw: number;
	badgeText: string;
	badgeClass: "amber" | "green" | "red";
	actionText: string;
	invoiceId?: string;
	phone?: string;
}

export interface DashboardRecentExpenseItem {
	id: string;
	title: string;
	date: string;
	amount: string;
}

export interface DashboardTodayAttentionItem {
	id: string;
	type: "birthday" | "due" | "maintenance" | "tenant";
	title: string;
	desc: string;
	route: string;
}

export interface DashboardPropertySummaryItem {
	id: string;
	name: string;
	rooms: string;
	dueBadge: string;
	badgeColor: "amber" | "green" | "red";
}

export interface DashboardRecentActivityItem {
	id: string;
	time: string;
	desc: string;
	route: string;
}

export interface DashboardChartData {
	labels: string[];
	income: number[];
	expense: number[];
}

export interface DashboardOverviewData {
	stats: DashboardStats;
	upcomingPayments: UpcomingPaymentItem[];
	recentExpenses: DashboardRecentExpenseItem[];
	todayAttentions: DashboardTodayAttentionItem[];
	propertySummaries: DashboardPropertySummaryItem[];
	recentActivities: DashboardRecentActivityItem[];
	chartData: {
		sixMonths: DashboardChartData;
		twelveMonths: DashboardChartData;
	};
}

export interface TopbarNotificationItem {
	id: string;
	title: string;
	desc: string;
	time: string;
	unread: boolean;
	route: string;
	type: "due" | "birthday" | "payment" | "complaint" | "announcement";
}

export interface GlobalSearchResultItem {
	id: string;
	title: string;
	subtitle: string;
	category: "Penghuni" | "Kamar" | "Invoice" | "Transaksi" | "Properti";
	url: string;
	badge?: string;
}
