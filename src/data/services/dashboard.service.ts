import type { DashboardOverviewData } from "../../common/types/index.ts";

export class DashboardService {
	async getOverviewData(
		_propertyId?: string | null,
	): Promise<DashboardOverviewData> {
		// Mock / initial calculation data that matches KostManagement.html
		return {
			stats: {
				totalRooms: 12,
				occupiedRooms: 10,
				vacantRooms: 2,
				monthlyIncome: "Rp6,8 jt",
				incomeGrowth: "8,2%",
				dueCount: 4,
				dueAmount: "Rp3,2 jt",
				monthlyExpense: "Rp2,1 jt",
			},
			upcomingPayments: [
				{
					id: "p1",
					tenant: "Alya Putri",
					room: "A-03",
					dueDate: "10 Agu",
					amount: "Rp850.000",
					badgeText: "3 hari lagi",
					badgeClass: "amber",
					actionText: "Reminder",
				},
				{
					id: "p2",
					tenant: "Nabila Putri",
					room: "A-02",
					dueDate: "12 Agu",
					amount: "Rp850.000",
					badgeText: "5 hari lagi",
					badgeClass: "amber",
					actionText: "Reminder",
				},
				{
					id: "p3",
					tenant: "Rizky Pratama",
					room: "B-01",
					dueDate: "15 Agu",
					amount: "Rp900.000",
					badgeText: "8 hari lagi",
					badgeClass: "amber",
					actionText: "Reminder",
				},
				{
					id: "p4",
					tenant: "Siti Rahma",
					room: "B-04",
					dueDate: "18 Agu",
					amount: "Rp850.000",
					badgeText: "11 hari lagi",
					badgeClass: "amber",
					actionText: "Reminder",
				},
			],
		};
	}
}

export const dashboardService = new DashboardService();
