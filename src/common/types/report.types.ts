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
	periodMonthNumber: number;
	periodYear: number;
	isClosedPeriod: boolean; // true = Tutup Buku (Bulan Lalu), false = Berjalan (Bulan Ini)
	totalIncome: number;
	totalExpense: number;
	operationalExpense: number;
	investmentExpense: number;
	netProfit: number;
	profitMarginPercentage: number;
	roomStatus: PropertyRoomStatusSummary;
	financialHealthGrade?: "PRIMA" | "SEHAT" | "WASPADA" | "KRITIS";
	narrativeSummary: string;
	trendAnalysis?: {
		incomeTrend: string;
		expenseTrend: string;
		occupancyImpact: string;
	};
	complaintCostImpact?: string;
	recommendations: AiStrategicRecommendation[];
	expenseBreakdown: ExpenseItemBreakdown[];
	generatedAt: string;
	isAutomated: boolean;
	aiProviderUsed?: string;
	refreshCountToday?: number;
	remainingRefreshesToday?: number;
	canRefreshToday?: boolean;
}

export interface AnnualReportMatrixData {
	year: number;
	propertyName: string;
	propertyIncomes: Array<{
		propertyId: string;
		propertyName: string;
		monthlyIncome: number[];
		totalAnnualIncome: number;
	}>;
	monthlyTotalIncome: number[];
	monthlyOperationalExpense: number[];
	monthlyInvestmentExpense: number[];
	monthlyTotalExpense: number[];
	monthlyNetProfit: number[];
	monthlyProfitMargin: number[];
	grandTotals: {
		totalIncome: number;
		totalOperationalExpense: number;
		totalInvestmentExpense: number;
		totalExpense: number;
		netProfit: number;
		profitMargin: number;
	};
}
