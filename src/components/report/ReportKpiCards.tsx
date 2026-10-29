import { ArrowDownRight, ArrowUpRight, Percent, Wallet } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";
import { formatRupiah } from "../../lib/currency.ts";

interface ReportKpiCardsProps {
	totalIncome: number;
	totalExpense: number;
	netProfit: number;
	profitMarginPercentage: number;
	occupancyRate: number;
	occupiedRooms: number;
	totalRooms: number;
	periodLabel: string;
	incomeGrowthPercent?: number;
	expenseGrowthPercent?: number;
}

export function ReportKpiCards({
	totalIncome,
	totalExpense,
	netProfit,
	profitMarginPercentage,
	occupancyRate,
	occupiedRooms,
	totalRooms,
	periodLabel,
	incomeGrowthPercent,
	expenseGrowthPercent,
}: ReportKpiCardsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
			{/* KPI 1: Pendapatan Omzet */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Pendapatan (Omzet)
					</span>
					<div className="w-6 h-6 rounded-md bg-[#e8f2ea] text-[#568062] flex items-center justify-center text-xs">
						<ArrowUpRight className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="text-lg font-bold text-[#252925] mt-1.5 tabular-nums">
					{formatRupiah(totalIncome)}
				</div>
				{typeof incomeGrowthPercent === "number" ? (
					<div className="mt-1 flex items-center gap-1.5 text-[10px]">
						<span
							className={`font-semibold ${
								incomeGrowthPercent >= 0 ? "text-[#568062]" : "text-[#a65f5b]"
							}`}
						>
							{incomeGrowthPercent >= 0 ? "+" : ""}
							{incomeGrowthPercent}%
						</span>
						<span className="text-[#737873]">vs bulan lalu</span>
					</div>
				) : (
					<div className="text-[10px] text-[#737873] mt-0.5">{periodLabel}</div>
				)}
			</Card>

			{/* KPI 2: Total Pengeluaran */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Total Pengeluaran
					</span>
					<div className="w-6 h-6 rounded-md bg-[#f9ebea] text-[#a45149] flex items-center justify-center text-xs">
						<ArrowDownRight className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="text-lg font-bold text-[#252925] mt-1.5 tabular-nums">
					{formatRupiah(totalExpense)}
				</div>
				{typeof expenseGrowthPercent === "number" ? (
					<div className="mt-1 flex items-center gap-1.5 text-[10px]">
						<span
							className={`font-semibold ${
								expenseGrowthPercent <= 0 ? "text-[#568062]" : "text-[#a65f5b]"
							}`}
						>
							{expenseGrowthPercent > 0 ? "+" : ""}
							{expenseGrowthPercent}%
						</span>
						<span className="text-[#737873]">vs bulan lalu</span>
					</div>
				) : (
					<div className="text-[10px] text-[#737873] mt-0.5">{periodLabel}</div>
				)}
			</Card>

			{/* KPI 3: Laba Bersih */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Laba Bersih (Net Profit)
					</span>
					<div className="w-6 h-6 rounded-md bg-[#e8f0ea] text-[#4f6958] flex items-center justify-center text-xs">
						<Wallet className="w-3.5 h-3.5" />
					</div>
				</div>
				<div
					className={`text-lg font-bold mt-1.5 tabular-nums ${netProfit >= 0 ? "text-[#3e724d]" : "text-[#b66b68]"}`}
				>
					{formatRupiah(netProfit)}
				</div>
				<div className="text-[10px] text-[#737873] mt-0.5">
					Margin: <strong>{profitMarginPercentage}%</strong>
				</div>
			</Card>

			{/* KPI 4: Okupansi */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Tingkat Okupansi
					</span>
					<div className="w-6 h-6 rounded-md bg-[#e8f0ea] text-[#4f6958] flex items-center justify-center text-xs">
						<Percent className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="text-lg font-bold text-[#252925] mt-1.5 tabular-nums">
					{occupancyRate}%
				</div>
				<div className="text-[10px] text-[#737873] mt-0.5">
					{occupiedRooms} dari {totalRooms} kamar terisi
				</div>
			</Card>
		</div>
	);
}
