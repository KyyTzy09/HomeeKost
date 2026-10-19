import { z } from "zod";

/**
 * Skema Rekomendasi Strategis Taktis (Tepat 3 butir)
 */
export const StrategicRecommendationSchema = z.object({
	code: z.enum(["01", "02", "03"]),
	title: z.string().min(3),
	description: z.string().min(10),
	priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type StrategicRecommendation = z.infer<
	typeof StrategicRecommendationSchema
>;

/**
 * Skema Output Terstruktur Analisis Finansial Eksekutif AI (Faktual & Deterministik)
 */
export const AiFinancialInsightSchema = z.object({
	executiveSummary: z.string().min(20),
	financialHealthGrade: z.enum(["PRIMA", "SEHAT", "WASPADA", "KRITIS"]),
	keyHighlights: z.array(z.string()).min(2).max(4).optional().default([]),
	trendAnalysis: z.object({
		incomeTrend: z.string(),
		expenseTrend: z.string(),
		occupancyImpact: z.string(),
	}),
	complaintCostImpact: z.string(),
	strategicRecommendations: z
		.array(StrategicRecommendationSchema)
		.optional()
		.default([]),
});

export type AiFinancialInsightData = z.infer<typeof AiFinancialInsightSchema>;

/**
 * Payload Data Finansial dari PostgreSQL untuk Context Prompt RAG
 */
export interface FinancialContextPayload {
	period: {
		month: number;
		monthName: string;
		year: number;
		isClosedPeriod: boolean;
		asOfDate?: string;
		dayOfMonth?: number;
		totalDaysInMonth?: number;
		monthProgressPercentage?: number;
	};
	property: {
		id?: string;
		name: string;
		isMultiProperty: boolean;
	};
	metrics: {
		totalIncome: number;
		totalExpense: number;
		operationalExpense: number;
		investmentExpense: number;
		netProfit: number;
		profitMarginPercentage: number;
	};
	occupancy: {
		totalRooms: number;
		occupiedRooms: number;
		vacantRooms: number;
		maintenanceRooms: number;
		occupancyRatePercentage: number;
	};
	collection: {
		totalInvoices: number;
		paidInvoices: number;
		pendingInvoices: number;
		overdueInvoices: number;
		collectionRatePercentage: number;
		totalOutstandingAmount: number;
	};
	topExpenses: Array<{
		category: string;
		amount: number;
		percentageOfTotalExpense: number;
	}>;
	complaintExpenses: {
		totalCost: number;
		totalComplaints: number;
		percentageOfExpense: number;
	};
}
