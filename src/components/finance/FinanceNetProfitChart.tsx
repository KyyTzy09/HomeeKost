import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { Card } from "../../common/shadcn/card.tsx";
import { formatRupiah } from "../../lib/currency.ts";

interface MonthlyTrendPoint {
	month: string;
	shortMonth: string;
	netProfit: number;
	income: number;
	expense: number;
	cx: number;
	cy: number;
}

const TREND_DATA: MonthlyTrendPoint[] = [
	{
		month: "April 2026",
		shortMonth: "Apr",
		netProfit: 2450000,
		income: 15200000,
		expense: 12750000,
		cx: 75,
		cy: 118,
	},
	{
		month: "Mei 2026",
		shortMonth: "Mei",
		netProfit: 2739000,
		income: 16450000,
		expense: 13711000,
		cx: 150,
		cy: 95,
	},
	{
		month: "Juni 2026",
		shortMonth: "Jun",
		netProfit: 2100000,
		income: 14800000,
		expense: 12700000,
		cx: 225,
		cy: 125,
	},
	{
		month: "Juli 2026",
		shortMonth: "Jul",
		netProfit: 3150000,
		income: 17200000,
		expense: 14050000,
		cx: 300,
		cy: 86,
	},
	{
		month: "Agustus 2026",
		shortMonth: "Agu",
		netProfit: 2800000,
		income: 16900000,
		expense: 14100000,
		cx: 375,
		cy: 104,
	},
	{
		month: "September 2026",
		shortMonth: "Sep",
		netProfit: 3600000,
		income: 18100000,
		expense: 14500000,
		cx: 450,
		cy: 72,
	},
	{
		month: "Oktober 2026",
		shortMonth: "Okt",
		netProfit: 3200000,
		income: 17500000,
		expense: 14300000,
		cx: 525,
		cy: 91,
	},
	{
		month: "November 2026",
		shortMonth: "Nov",
		netProfit: 4700000,
		income: 19800000,
		expense: 15100000,
		cx: 600,
		cy: 62,
	},
	{
		month: "Desember 2026",
		shortMonth: "Des",
		netProfit: 4100000,
		income: 19000000,
		expense: 14900000,
		cx: 665,
		cy: 78,
	},
];

export function FinanceNetProfitChart() {
	const [activePoint, setActivePoint] = useState<MonthlyTrendPoint | null>(
		TREND_DATA[1] ?? null, // Default to Mei
	);

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
			<div>
				<div className="flex items-start justify-between pb-3 border-b border-[#e4e9e4]">
					<div>
						<h2 className="text-sm font-bold text-[#252925]">
							Tren Laba Bersih
						</h2>
						<p className="text-[11px] text-[#737873]">
							Periode April - Desember 2026
						</p>
					</div>

					<div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f2ea] text-[#568062] rounded-lg text-xs font-semibold">
						<TrendingUp className="w-3.5 h-3.5" />
						<span>+18.4% Tren Naik</span>
					</div>
				</div>

				{/* Quick Analytical Summary */}
				<div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl text-center">
					<div>
						<span className="text-[10px] text-[#737873] block">Rata-rata</span>
						<b className="text-xs font-bold text-[#252925]">Rp3,21 jt</b>
					</div>
					<div>
						<span className="text-[10px] text-[#737873] block">Tertinggi</span>
						<b className="text-xs font-bold text-[#568062]">Nov (Rp4,7 jt)</b>
					</div>
					<div>
						<span className="text-[10px] text-[#737873] block">Terendah</span>
						<b className="text-xs font-bold text-[#a65f5b]">Jun (Rp2,1 jt)</b>
					</div>
				</div>

				{/* Active Tooltip / Details */}
				{activePoint && (
					<div className="mt-3 px-3 py-1.5 bg-[#f3f7f3] border border-[#dce7de] rounded-lg flex items-center justify-between text-xs">
						<span className="font-semibold text-[#252925]">
							{activePoint.month}:
						</span>
						<div className="space-x-3 text-[11px]">
							<span className="text-[#568062] font-bold">
								Laba: {formatRupiah(activePoint.netProfit)}
							</span>
							<span className="text-[#737873]">
								(Masuk: {formatRupiah(activePoint.income)} · Keluar:{" "}
								{formatRupiah(activePoint.expense)})
							</span>
						</div>
					</div>
				)}

				{/* SVG Interactive Line Chart */}
				<div className="mt-3 h-44 w-full">
					<svg
						className="w-full h-full overflow-visible"
						viewBox="0 0 700 215"
						preserveAspectRatio="none"
						role="img"
						aria-label="Grafik Tren Laba Bersih"
					>
						<title>Grafik Tren Laba Bersih</title>
						{/* Background Grid Lines */}
						<line
							x1="45"
							y1="25"
							x2="680"
							y2="25"
							stroke="#edf0ed"
							strokeWidth="1"
						/>
						<line
							x1="45"
							y1="70"
							x2="680"
							y2="70"
							stroke="#edf0ed"
							strokeWidth="1"
						/>
						<line
							x1="45"
							y1="115"
							x2="680"
							y2="115"
							stroke="#edf0ed"
							strokeWidth="1"
						/>
						<line
							x1="45"
							y1="160"
							x2="680"
							y2="160"
							stroke="#edf0ed"
							strokeWidth="1"
						/>

						{/* Trend Polyline */}
						<polyline
							points="75,118 150,95 225,125 300,86 375,104 450,72 525,91 600,62 665,78"
							fill="none"
							stroke="#5d7865"
							strokeWidth="3"
						/>

						{/* Coordinate Points with Active State & Hover */}
						{TREND_DATA.map((pt) => {
							const isActive = activePoint?.month === pt.month;
							return (
								<g
									key={`pt-${pt.month}`}
									onClick={() => setActivePoint(pt)}
									onMouseEnter={() => setActivePoint(pt)}
									className="cursor-pointer group"
								>
									{isActive && (
										<circle
											cx={pt.cx}
											cy={pt.cy}
											r="8"
											fill="#5d7865"
											opacity="0.25"
										/>
									)}
									<circle
										cx={pt.cx}
										cy={pt.cy}
										r={isActive ? 6 : 4.5}
										fill={isActive ? "#425949" : "#5d7865"}
										stroke="#ffffff"
										strokeWidth={isActive ? 2 : 1}
										className="transition-all duration-150 group-hover:r-6"
									/>
								</g>
							);
						})}

						{/* Month Labels on Axis */}
						{TREND_DATA.map((pt) => (
							<text
								key={`lbl-${pt.shortMonth}`}
								x={pt.cx - 10}
								y="190"
								fontSize="11"
								fill={activePoint?.month === pt.month ? "#252925" : "#737873"}
								fontWeight={activePoint?.month === pt.month ? "700" : "500"}
								fontFamily="Inter"
							>
								{pt.shortMonth}
							</text>
						))}
					</svg>
				</div>
			</div>
		</Card>
	);
}
