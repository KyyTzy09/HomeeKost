export interface AiStrategicRecommendation {
	id: string | number;
	code: string;
	title: string;
	description: string;
	priority?: "HIGH" | "MEDIUM" | "LOW";
}

export interface ExpenseItemBreakdown {
	id: string | number;
	category: string;
	amount: number;
	percentage: number;
	description: string;
}

export interface PropertyRoomStatusSummary {
	totalRooms: number;
	occupiedRooms: number;
	emptyRooms: number;
	maintenanceRooms: number;
	occupancyRate: number;
}

export interface AiMonthlyReportData {
	id: string | number;
	propertyId: string;
	propertyName: string;
	periodMonth: string;
	periodYear: number;
	isClosedPeriod: boolean; // true = Tutup Buku (Bulan Lalu), false = Berjalan (Bulan Ini)
	totalIncome: number;
	totalExpense: number;
	netProfit: number;
	roomStatus: PropertyRoomStatusSummary;
	narrativeSummary: string;
	recommendations: AiStrategicRecommendation[];
	expenseBreakdown: ExpenseItemBreakdown[];
	generatedAt: string;
	isAutomated: boolean;
}
