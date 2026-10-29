import { describe, expect, it } from "vitest";
import { getHealthGradeBadge } from "../../src/components/report/ReportAiInsightPanel.tsx";
import { generateDeterministicFinancialInsight } from "../../src/ai/llm/fallback-engine.ts";
import type { FinancialContextPayload } from "../../src/ai/types.ts";

describe("Financial Health Grade & Mid-Month Guardrail", () => {
	it("should return PRIMA for high performance metrics", () => {
		const badge = getHealthGradeBadge("PRIMA", true);
		expect(badge.label).toContain("PRIMA");
		expect(badge.label).toContain("🌟");
	});

	it("should map legacy NORMAL and SEHAT to middle tier WASPADA", () => {
		const badgeNormal = getHealthGradeBadge("NORMAL", true);
		expect(badgeNormal.label).toContain("WASPADA");
		expect(badgeNormal.label).toContain("⚠️");

		const badgeSehat = getHealthGradeBadge("SEHAT", true);
		expect(badgeSehat.label).toContain("WASPADA");
	});

	it("should return WASPADA for warning condition", () => {
		const badge = getHealthGradeBadge("WASPADA", true);
		expect(badge.label).toContain("WASPADA");
		expect(badge.label).toContain("⚠️");
	});

	it("should return BAHAYA for closed period with poor metrics and normalize KRITIS", () => {
		const badgeBahaya = getHealthGradeBadge("BAHAYA", true);
		expect(badgeBahaya.label).toContain("BAHAYA");
		expect(badgeBahaya.label).toContain("🚨");

		const badgeKritis = getHealthGradeBadge("KRITIS", true);
		expect(badgeKritis.label).toContain("BAHAYA");
	});

	it("GUARDRAIL: should NEVER return BAHAYA on ongoing/open month, downgrading to WASPADA (Dalam Pemantauan)", () => {
		const badgeOnGoingBahaya = getHealthGradeBadge("BAHAYA", false);
		expect(badgeOnGoingBahaya.label).not.toContain("BAHAYA");
		expect(badgeOnGoingBahaya.label).toContain("WASPADA");
		expect(badgeOnGoingBahaya.label).toContain("Dalam Pemantauan");

		const badgeOnGoingKritis = getHealthGradeBadge("KRITIS", false);
		expect(badgeOnGoingKritis.label).not.toContain("BAHAYA");
		expect(badgeOnGoingKritis.label).toContain("WASPADA");
	});

	it("Deterministic Fallback Engine: should assign WASPADA instead of BAHAYA for ongoing month with low margin", () => {
		const mockPayloadOngoing: FinancialContextPayload = {
			period: {
				month: 10,
				monthName: "Oktober",
				year: 2026,
				isClosedPeriod: false,
			},
			property: {
				id: "prop-1",
				name: "HomeeKost",
				isMultiProperty: false,
			},
			metrics: {
				totalIncome: 1500000,
				totalExpense: 3000000,
				operationalExpense: 3000000,
				investmentExpense: 0,
				netProfit: -1500000,
				profitMarginPercentage: -100,
			},
			occupancy: {
				totalRooms: 10,
				occupiedRooms: 8,
				vacantRooms: 2,
				maintenanceRooms: 0,
				occupancyRatePercentage: 80,
			},
			collection: {
				totalInvoices: 8,
				paidInvoices: 1,
				pendingInvoices: 7,
				overdueInvoices: 0,
				collectionRatePercentage: 12.5,
				totalOutstandingAmount: 10500000,
			},
			topExpenses: [
				{
					category: "Listrik & Air",
					amount: 2000000,
					percentageOfTotalExpense: 66.7,
				},
			],
			complaintExpenses: {
				totalCost: 0,
				percentageOfExpense: 0,
				complaintCount: 0,
			},
		};

		const resultOngoing = generateDeterministicFinancialInsight(mockPayloadOngoing);
		expect(resultOngoing.financialHealthGrade).toBe("WASPADA");

		const mockPayloadClosed: FinancialContextPayload = {
			...mockPayloadOngoing,
			period: {
				...mockPayloadOngoing.period,
				isClosedPeriod: true,
			},
		};

		const resultClosed = generateDeterministicFinancialInsight(mockPayloadClosed);
		expect(resultClosed.financialHealthGrade).toBe("BAHAYA");
	});

	it("Deterministic Fallback Engine: should assign PRIMA when expense ratio is < 25%", () => {
		const mockPayloadPrima: FinancialContextPayload = {
			period: {
				month: 10,
				monthName: "Oktober",
				year: 2026,
				isClosedPeriod: true,
			},
			property: {
				id: "prop-1",
				name: "HomeeKost",
				isMultiProperty: false,
			},
			metrics: {
				totalIncome: 10000000,
				totalExpense: 2000000, // Expense ratio 20% (< 25%)
				operationalExpense: 2000000,
				investmentExpense: 0,
				netProfit: 8000000,
				profitMarginPercentage: 80,
			},
			occupancy: {
				totalRooms: 10,
				occupiedRooms: 9,
				vacantRooms: 1,
				maintenanceRooms: 0,
				occupancyRatePercentage: 90,
			},
			collection: {
				totalInvoices: 9,
				paidInvoices: 9,
				pendingInvoices: 0,
				overdueInvoices: 0,
				collectionRatePercentage: 100,
				totalOutstandingAmount: 0,
			},
			topExpenses: [
				{
					category: "Operasional Rutin",
					amount: 2000000,
					percentageOfTotalExpense: 100,
				},
			],
			complaintExpenses: {
				totalCost: 0,
				percentageOfExpense: 0,
				complaintCount: 0,
			},
		};

		const resultPrima = generateDeterministicFinancialInsight(mockPayloadPrima);
		expect(resultPrima.financialHealthGrade).toBe("PRIMA");
	});

	it("Deterministic Fallback Engine: should assign WASPADA for middle-tier expense ratio (25% - 50%)", () => {
		const mockPayloadWaspada: FinancialContextPayload = {
			period: {
				month: 10,
				monthName: "Oktober",
				year: 2026,
				isClosedPeriod: true,
			},
			property: {
				id: "prop-1",
				name: "HomeeKost",
				isMultiProperty: false,
			},
			metrics: {
				totalIncome: 10000000,
				totalExpense: 3500000, // Expense ratio 35% (between 25% and 50%)
				operationalExpense: 3500000,
				investmentExpense: 0,
				netProfit: 6500000,
				profitMarginPercentage: 65,
			},
			occupancy: {
				totalRooms: 10,
				occupiedRooms: 9,
				vacantRooms: 1,
				maintenanceRooms: 0,
				occupancyRatePercentage: 90,
			},
			collection: {
				totalInvoices: 9,
				paidInvoices: 9,
				pendingInvoices: 0,
				overdueInvoices: 0,
				collectionRatePercentage: 100,
				totalOutstandingAmount: 0,
			},
			topExpenses: [
				{
					category: "Operasional Rutin",
					amount: 3500000,
					percentageOfTotalExpense: 100,
				},
			],
			complaintExpenses: {
				totalCost: 0,
				percentageOfExpense: 0,
				complaintCount: 0,
			},
		};

		const resultWaspada = generateDeterministicFinancialInsight(mockPayloadWaspada);
		expect(resultWaspada.financialHealthGrade).toBe("WASPADA");
	});
});
