import { ArrowDownRight, ArrowUpRight, Percent } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";

interface ReportKpiCardsProps {
	totalIncome: number;
	totalExpense: number;
	occupancyRate: number;
	occupiedRooms: number;
	totalRooms: number;
	periodLabel: string;
}

export function ReportKpiCards({
	totalIncome,
	totalExpense,
	occupancyRate,
	occupiedRooms,
	totalRooms,
	periodLabel,
}: ReportKpiCardsProps) {
	const formatJuta = (val: number) => {
		const jt = val / 1_000_000;
		return `Rp${jt.toLocaleString("id-ID", {
			minimumFractionDigits: jt % 1 === 0 ? 0 : 1,
			maximumFractionDigits: 2,
		})} jt`;
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
			{/* KPI 1: Pendapatan */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Pendapatan
					</span>
					<div className="w-6 h-6 rounded-md bg-[#e8f2ea] text-[#568062] flex items-center justify-center text-xs">
						<ArrowUpRight className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="text-xl font-bold text-[#252925] mt-1.5">
					{formatJuta(totalIncome)}
				</div>
				<div className="text-[10px] text-[#737873] mt-0.5">{periodLabel}</div>
			</Card>

			{/* KPI 2: Pengeluaran */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Pengeluaran
					</span>
					<div className="w-6 h-6 rounded-md bg-[#f9ebea] text-[#a45149] flex items-center justify-center text-xs">
						<ArrowDownRight className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="text-xl font-bold text-[#252925] mt-1.5">
					{formatJuta(totalExpense)}
				</div>
				<div className="text-[10px] text-[#737873] mt-0.5">{periodLabel}</div>
			</Card>

			{/* KPI 3: Okupansi */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_10px_rgba(48,65,53,0.04)]">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold text-[#737873]">
						Occupancy
					</span>
					<div className="w-6 h-6 rounded-md bg-[#e8f0ea] text-[#4f6958] flex items-center justify-center text-xs">
						<Percent className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="text-xl font-bold text-[#252925] mt-1.5">
					{occupancyRate}%
				</div>
				<div className="text-[10px] text-[#737873] mt-0.5">
					{occupiedRooms} / {totalRooms} kamar terisi
				</div>
			</Card>
		</div>
	);
}
