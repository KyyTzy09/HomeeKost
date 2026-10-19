import { CheckCircle2, Clock, SlidersHorizontal } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";

interface ReportAutomationCardProps {
	scheduleDay: number;
	scheduleTime?: string;
	onOpenSettings: () => void;
}

export function ReportAutomationCard({
	scheduleDay,
	scheduleTime = "08:00",
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
						Laporan eksekutif dibuat otomatis setiap tanggal {scheduleDay} pukul{" "}
						{scheduleTime} WIB
					</p>
				</div>

				<span className="text-[11px] font-semibold bg-[#e8f2ea] text-[#568062] px-2.5 py-0.5 rounded-full flex items-center gap-1">
					<CheckCircle2 className="w-3.5 h-3.5" />
					Aktif
				</span>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
				<div className="space-y-1">
					<b className="text-xs text-[#252925] block">
						Rekapitulasi Keuangan & Evaluasi Operasional Otomatis
					</b>
					<p className="text-[11px] text-[#737873] leading-relaxed max-w-2xl">
						Sistem secara terjadwal merangkum data pemasukan sewa, pengeluaran
						operasional, laba bersih, serta tingkat okupansi kamar untuk
						dikirimkan langsung sebagai notifikasi ringkasan eksekutif ke
						pengelola atau pemilik kos.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0 flex-wrap">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8 text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] font-semibold cursor-pointer"
						onClick={onOpenSettings}
					>
						<SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
						Atur Jadwal Automasi
					</Button>
				</div>
			</div>
		</Card>
	);
}
