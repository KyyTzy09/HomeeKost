import { Sparkles } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";
import type { AiStrategicRecommendation } from "../../common/types/index.ts";

interface ReportAiInsightPanelProps {
	periodLabel: string;
	propertyName: string;
	isClosedPeriod: boolean;
	narrativeSummary: string;
	recommendations: AiStrategicRecommendation[];
}

export function ReportAiInsightPanel({
	periodLabel,
	propertyName,
	isClosedPeriod,
	narrativeSummary,
	recommendations,
}: ReportAiInsightPanelProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* Panel Head */}
			<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<Sparkles className="w-4 h-4 text-[#4f6958]" />
						Insight Bulanan · {propertyName}
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Dihasilkan berdasarkan data operasional {periodLabel}
						{isClosedPeriod ? " (Tutup Buku)" : " (Data Berjalan)"}
					</p>
				</div>

				<span className="text-[11px] font-semibold bg-[#e8f2ea] text-[#568062] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-[#cfe2d3]">
					<span className="w-1.5 h-1.5 rounded-full bg-[#568062] animate-pulse" />
					AI Insight
				</span>
			</div>

			{/* Ringkasan Narasi Eksekutif */}
			<div className="mt-4 p-4 bg-[#f8faf8] border-l-4 border-[#5d7865] border-y border-r border-[#e5ece5] rounded-r-xl">
				<h3 className="text-xs font-bold text-[#252925] mb-1">Ringkasan</h3>
				<p className="text-xs text-[#4c524d] leading-relaxed">
					{narrativeSummary}
				</p>
			</div>

			{/* Rekomendasi Strategis (Murni Rekomendasi tanpa tombol berlebihan) */}
			<div className="mt-5">
				<h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#737873]">
					Rekomendasi Strategis
				</h3>

				<div className="space-y-2.5">
					{recommendations.map((rec) => (
						<div
							key={rec.id}
							className="p-3.5 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl flex items-start gap-3.5 hover:bg-[#f7faf7] transition-colors"
						>
							<div className="w-7 h-7 rounded-lg bg-[#e8f0ea] text-[#4f6958] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
								{rec.code}
							</div>
							<div className="min-w-0 flex-1">
								<strong className="text-xs font-bold text-[#252925] block">
									{rec.title}
								</strong>
								<span className="text-[11px] text-[#737873] leading-relaxed block mt-0.5">
									{rec.description}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
