import {
	Activity,
	AlertCircle,
	CheckCircle2,
	Info,
	Sparkles,
	TrendingUp,
	Zap,
} from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";
import type { AiStrategicRecommendation } from "../../common/types/index.ts";

interface ReportAiInsightPanelProps {
	periodLabel: string;
	propertyName: string;
	isClosedPeriod: boolean;
	financialHealthGrade?: "PRIMA" | "SEHAT" | "WASPADA" | "KRITIS";
	narrativeSummary: string;
	keyHighlights?: string[];
	trendAnalysis?: {
		incomeTrend: string;
		expenseTrend: string;
		occupancyImpact: string;
	};
	complaintCostImpact?: string;
	recommendations?: AiStrategicRecommendation[];
	aiProviderUsed?: string;
}

export function getHealthGradeBadge(
	grade?: "PRIMA" | "SEHAT" | "WASPADA" | "KRITIS",
) {
	switch (grade) {
		case "PRIMA":
			return {
				label: "Kesehatan Finansial: PRIMA 🌟",
				className: "bg-[#e8f2ea] text-[#3e724d] border-[#b9dbbf]",
				icon: CheckCircle2,
			};
		case "SEHAT":
			return {
				label: "Kesehatan Finansial: SEHAT ✨",
				className: "bg-[#edf4ee] text-[#4f6958] border-[#cde0d1]",
				icon: Activity,
			};
		case "WASPADA":
			return {
				label: "Kesehatan Finansial: WASPADA ⚠️",
				className: "bg-[#fbf4e6] text-[#b18a4b] border-[#eed7b0]",
				icon: AlertCircle,
			};
		case "KRITIS":
			return {
				label: "Kesehatan Finansial: KRITIS 🚨",
				className: "bg-[#fceeed] text-[#b66b68] border-[#f0c3c1]",
				icon: AlertCircle,
			};
		default:
			return {
				label: "Status Finansial Normal",
				className: "bg-[#f3f7f3] text-[#55705d] border-[#dce6df]",
				icon: Info,
			};
	}
}

export function ReportAiInsightPanel({
	periodLabel,
	propertyName,
	isClosedPeriod,
	financialHealthGrade = "SEHAT",
	narrativeSummary,
	keyHighlights = [],
	trendAnalysis,
	complaintCostImpact,
	recommendations = [],
}: ReportAiInsightPanelProps) {
	const gradeBadge = getHealthGradeBadge(financialHealthGrade);
	const GradeIcon = gradeBadge.icon;

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* Panel Head */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<Sparkles className="w-4 h-4 text-[#4f6958]" />
						Executive AI Insight · {propertyName}
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Analisis operasional & performa bisnis {periodLabel}
						{isClosedPeriod ? " (Tutup Buku)" : " (Data Berjalan)"}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<span
						className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border shadow-2xs ${gradeBadge.className}`}
					>
						<GradeIcon className="w-3.5 h-3.5" />
						{gradeBadge.label}
					</span>
				</div>
			</div>

			{/* Ringkasan Narasi Eksekutif */}
			<div className="mt-4 p-4 bg-[#f8faf8] border-l-4 border-[#5d7865] border-y border-r border-[#e5ece5] rounded-r-xl">
				<h3 className="text-xs font-bold text-[#252925] mb-1 flex items-center gap-1.5">
					<TrendingUp className="w-3.5 h-3.5 text-[#4f6958]" />
					Ringkasan Eksekutif
				</h3>
				<p className="text-xs text-[#37443c] leading-relaxed">
					{narrativeSummary}
				</p>
			</div>

			{/* Sorotan Kunci Fakta Data (Key Highlights) */}
			{keyHighlights.length > 0 && (
				<div className="mt-3.5 p-3.5 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
					<h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4f6958] mb-2 flex items-center gap-1.5">
						<Zap className="w-3.5 h-3.5 text-[#4f6958]" />
						Sorotan Fakta Kinerja Finansial
					</h3>
					<div className="space-y-1.5">
						{keyHighlights.map((highlight) => (
							<div
								key={highlight}
								className="flex items-start gap-2 text-xs text-[#425046] leading-relaxed"
							>
								<span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] mt-1.5 shrink-0" />
								<span>{highlight}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Mini Analisis Tren */}
			{trendAnalysis && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[10px] font-bold uppercase tracking-wider text-[#4f6958] block mb-1">
							Penerimaan & Omzet
						</span>
						<p className="text-[11.5px] text-[#556057] leading-relaxed">
							{trendAnalysis.incomeTrend}
						</p>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[10px] font-bold uppercase tracking-wider text-[#4f6958] block mb-1">
							Struktur Beban Biaya
						</span>
						<p className="text-[11.5px] text-[#556057] leading-relaxed">
							{trendAnalysis.expenseTrend}
						</p>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[10px] font-bold uppercase tracking-wider text-[#4f6958] block mb-1">
							Dampak Okupansi Unit
						</span>
						<p className="text-[11.5px] text-[#556057] leading-relaxed">
							{trendAnalysis.occupancyImpact}
						</p>
					</div>
				</div>
			)}

			{/* Biaya Komplain & Fasilitas */}
			{complaintCostImpact && (
				<div className="mt-3 p-3 bg-[#fafbfa] border border-[#e2e8e3] rounded-xl text-xs text-[#556057] flex items-center gap-2">
					<Info className="w-4 h-4 text-[#8fa594] shrink-0" />
					<span className="text-[11px] leading-relaxed">
						<strong>Dampak Biaya Fasilitas & Komplain:</strong>{" "}
						{complaintCostImpact}
					</span>
				</div>
			)}

			{/* Tampilkan Rekomendasi hanya jika ada (backward compatibility) */}
			{recommendations.length > 0 && (
				<div className="mt-5">
					<h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#737873] flex items-center gap-1.5">
						<Zap className="w-3.5 h-3.5 text-[#4f6958]" />
						Rekomendasi Taktis
					</h3>

					<div className="space-y-2.5">
						{recommendations.map((rec) => {
							const isHigh = rec.priority === "HIGH";
							const isMed = rec.priority === "MEDIUM";

							return (
								<div
									key={rec.id}
									className="p-3.5 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl flex items-start gap-3.5 hover:bg-[#f7faf7] transition-colors"
								>
									<div className="w-7 h-7 rounded-lg bg-[#e8f0ea] text-[#4f6958] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
										{rec.code}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 mb-0.5">
											<strong className="text-xs font-bold text-[#252925]">
												{rec.title}
											</strong>
											{rec.priority && (
												<span
													className={`text-[9.5px] font-bold px-2 py-0.2 rounded-md ${
														isHigh
															? "bg-[#fceeed] text-[#b66b68]"
															: isMed
																? "bg-[#fbf4e6] text-[#b18a4b]"
																: "bg-[#e8f2ea] text-[#568062]"
													}`}
												>
													Prioritas {rec.priority}
												</span>
											)}
										</div>
										<span className="text-[11px] text-[#737873] leading-relaxed block">
											{rec.description}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</Card>
	);
}
