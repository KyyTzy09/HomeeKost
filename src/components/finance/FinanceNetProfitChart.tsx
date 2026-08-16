import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "../../common/shadcn/card.tsx";
import type { MonthlyTrendPoint } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface FinanceNetProfitChartProps {
	trends?: MonthlyTrendPoint[];
	isLoading?: boolean;
}

export function FinanceNetProfitChart({
	trends = [],
	isLoading = false,
}: FinanceNetProfitChartProps) {
	const [activeIdx, setActiveIdx] = useState<number | null>(null);

	const chartData = useMemo(() => {
		if (trends.length === 0) return [];

		const maxVal = Math.max(
			...trends.map((t) => Math.max(t.income, t.expense, t.netProfit, 1000000)),
		);

		const width = 660;
		const height = 150;
		const paddingX = 40;
		const paddingY = 20;

		const step =
			trends.length > 1 ? (width - paddingX * 2) / (trends.length - 1) : 0;

		return trends.map((t, idx) => {
			const cx = paddingX + idx * step;
			// Scale Y (0 is top in SVG, so invert)
			const normalized = Math.max(0, t.netProfit) / maxVal;
			const cy = height - paddingY - normalized * (height - paddingY * 2);

			return {
				...t,
				cx,
				cy,
			};
		});
	}, [trends]);

	const pathD = useMemo(() => {
		if (chartData.length === 0) return "";
		return chartData.reduce((acc, pt, idx) => {
			if (idx === 0) return `M ${pt.cx} ${pt.cy}`;
			return `${acc} L ${pt.cx} ${pt.cy}`;
		}, "");
	}, [chartData]);

	const areaD = useMemo(() => {
		if (chartData.length === 0) return "";
		const first = chartData[0];
		const last = chartData[chartData.length - 1];
		return `${pathD} L ${last.cx} 150 L ${first.cx} 150 Z`;
	}, [chartData, pathD]);

	const activePoint = activeIdx !== null ? chartData[activeIdx] : null;

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* ─── Header ───────────────────────────────────────────────────── */}
			<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-bold text-[#252925]">
							Tren Pertumbuhan Laba Bersih
						</h2>
						<span className="flex items-center gap-1 text-[10px] font-semibold text-[#568062] bg-[#e8f2ea] px-2 py-0.5 rounded-full">
							<TrendingUp className="w-3 h-3" />6 Bulan Terakhir
						</span>
					</div>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Pergerakan laba bersih bulanan (Total Pendapatan dikurangi Total
						Biaya)
					</p>
				</div>
			</div>

			{/* ─── SVG Chart Area ───────────────────────────────────────────── */}
			<div className="relative mt-4 w-full h-[180px]">
				{isLoading ? (
					<div className="w-full h-full flex items-center justify-center text-xs text-[#737873]">
						<div className="w-4 h-4 border-2 border-[#4f6958] border-t-transparent rounded-full animate-spin mr-2" />
						Memuat grafik tren...
					</div>
				) : chartData.length === 0 ? (
					<div className="w-full h-full flex items-center justify-center text-xs text-[#737873]">
						Belum ada data tren kas yang tercatat.
					</div>
				) : (
					<svg
						viewBox="0 0 700 160"
						className="w-full h-full overflow-visible"
						preserveAspectRatio="none"
					>
						<title>Grafik Tren Pertumbuhan Laba Bersih</title>
						<defs>
							<linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#4f6958" stopOpacity="0.25" />
								<stop offset="100%" stopColor="#4f6958" stopOpacity="0.0" />
							</linearGradient>
						</defs>

						{/* Grid Lines */}
						<line
							x1="20"
							y1="30"
							x2="680"
							y2="30"
							stroke="#e4e9e4"
							strokeDasharray="4 4"
						/>
						<line
							x1="20"
							y1="80"
							x2="680"
							y2="80"
							stroke="#e4e9e4"
							strokeDasharray="4 4"
						/>
						<line
							x1="20"
							y1="130"
							x2="680"
							y2="130"
							stroke="#e4e9e4"
							strokeDasharray="4 4"
						/>

						{/* Area Fill */}
						<path d={areaD} fill="url(#profitGradient)" />

						{/* Trend Line */}
						<path
							d={pathD}
							fill="none"
							stroke="#4f6958"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>

						{/* Data Points */}
						{chartData.map((pt, idx) => {
							const isHovered = activeIdx === idx;
							return (
								<g key={pt.month}>
									<circle
										cx={pt.cx}
										cy={pt.cy}
										r={isHovered ? "6" : "4"}
										fill={isHovered ? "#252925" : "#4f6958"}
										stroke="#ffffff"
										strokeWidth="2"
										className="cursor-pointer transition-all duration-150"
										onMouseEnter={() => setActiveIdx(idx)}
										onMouseLeave={() => setActiveIdx(null)}
									/>
									<text
										x={pt.cx}
										y="155"
										textAnchor="middle"
										className="text-[10px] fill-[#737873] font-medium select-none"
									>
										{pt.shortMonth}
									</text>
								</g>
							);
						})}
					</svg>
				)}

				{/* Floating Tooltip */}
				{activePoint && (
					<div
						className="absolute pointer-events-none bg-[#253129] text-white p-2.5 rounded-xl shadow-lg text-[11px] -translate-x-1/2 -translate-y-full z-10 space-y-1"
						style={{
							left: `${(activePoint.cx / 700) * 100}%`,
							top: `${(activePoint.cy / 160) * 100 - 10}%`,
						}}
					>
						<div className="font-bold border-b border-[#3b4c40] pb-1 text-[#e8f0ea]">
							{activePoint.month}
						</div>
						<div className="flex justify-between gap-3 text-[10px]">
							<span className="text-[#a4b6a8]">Pendapatan:</span>
							<span className="font-semibold text-[#8fa594]">
								{formatRupiah(activePoint.income)}
							</span>
						</div>
						<div className="flex justify-between gap-3 text-[10px]">
							<span className="text-[#a4b6a8]">Biaya:</span>
							<span className="font-semibold text-[#efd4d0]">
								{formatRupiah(activePoint.expense)}
							</span>
						</div>
						<div className="flex justify-between gap-3 text-[10px] font-bold pt-0.5 border-t border-[#3b4c40]">
							<span className="text-white">Laba Bersih:</span>
							<span className="text-[#568062]">
								{formatRupiah(activePoint.netProfit)}
							</span>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
