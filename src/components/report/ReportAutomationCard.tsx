import { Bot, CheckCircle2, Clock } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";

interface ReportAutomationCardProps {
	scheduleDay: number;
	aiModel: string;
	onOpenSettings: () => void;
}

export function ReportAutomationCard({
	scheduleDay,
	aiModel,
	onOpenSettings,
}: ReportAutomationCardProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<Clock className="w-4 h-4 text-[#4f6958]" />
						Automasi Laporan Bulanan
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Laporan eksekutif dibuat otomatis setiap tanggal {scheduleDay} pukul
						08:00 WIB
					</p>
				</div>

				<span className="text-[11px] font-semibold bg-[#e8f2ea] text-[#568062] px-2.5 py-0.5 rounded-full flex items-center gap-1">
					<CheckCircle2 className="w-3.5 h-3.5" />
					Aktif
				</span>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<b className="text-xs text-[#252925]">
							Engine RAG:{" "}
							{aiModel === "gemini-1.5-flash"
								? "Google Gemini 1.5 Flash"
								: "Groq LLaMA 3.3 70B"}
						</b>
						<span className="text-[10px] text-[#4f6958] bg-[#f0f5f1] px-2 py-0.5 rounded font-medium">
							Zero-Hallucination
						</span>
					</div>
					<p className="text-[11px] text-[#737873] leading-relaxed max-w-2xl">
						Data angka finansial dan okupansi dikalkulasi murni secara
						deterministik dari database PostgreSQL. Model AI hanya merangkum
						wawasan bisnis dan rekomendasi taktis tanpa rekayasa angka.
					</p>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] font-semibold shrink-0"
					onClick={onOpenSettings}
				>
					<Bot className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
					Atur Automasi
				</Button>
			</div>
		</Card>
	);
}
