import { AlertTriangle, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";
import type { PaymentStats } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface PaymentMetricsProps {
	stats?: PaymentStats;
	isLoading?: boolean;
	periodLabel?: string;
}

export function PaymentMetrics({
	stats,
	isLoading = false,
	periodLabel = "Bulan Ini",
}: PaymentMetricsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{/* Total Tagihan */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
				<div className="flex items-start justify-between">
					<div>
						<span className="text-[11px] text-[#737873] font-medium block">
							Total Tagihan {periodLabel}
						</span>
						<h3 className="text-lg sm:text-xl font-bold text-[#252925] mt-1">
							{isLoading ? "..." : formatRupiah(stats?.totalAmount || 0)}
						</h3>
					</div>
					<div className="w-8 h-8 rounded-lg bg-[#f3f7f3] text-[#4f6958] flex items-center justify-center">
						<CreditCard className="w-4 h-4" />
					</div>
				</div>
				<div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#737873]">
					<span>
						Jumlah: <b>{stats?.totalInvoices || 0} invoice</b>
					</span>
				</div>
			</Card>

			{/* Sudah Dibayar (Lunas) */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
				<div className="flex items-start justify-between">
					<div>
						<span className="text-[11px] text-[#737873] font-medium block">
							Sudah Terbayar (Lunas)
						</span>
						<h3 className="text-lg sm:text-xl font-bold text-[#568062] mt-1">
							{isLoading ? "..." : formatRupiah(stats?.paidAmount || 0)}
						</h3>
					</div>
					<div className="w-8 h-8 rounded-lg bg-[#e8f2ea] text-[#568062] flex items-center justify-center">
						<CheckCircle2 className="w-4 h-4" />
					</div>
				</div>
				<div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#737873]">
					<span>
						<b>{stats?.paidCount || 0} lunas</b> · Collection rate:{" "}
						<b className="text-[#568062]">{stats?.collectionRate || 0}%</b>
					</span>
				</div>
			</Card>

			{/* Belum Lunas (Pending) */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
				<div className="flex items-start justify-between">
					<div>
						<span className="text-[11px] text-[#737873] font-medium block">
							Belum Lunas
						</span>
						<h3 className="text-lg sm:text-xl font-bold text-[#b18a4b] mt-1">
							{isLoading ? "..." : `${stats?.pendingCount || 0} Tagihan`}
						</h3>
					</div>
					<div className="w-8 h-8 rounded-lg bg-[#fbf4e6] text-[#b18a4b] flex items-center justify-center">
						<Clock className="w-4 h-4" />
					</div>
				</div>
				<div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#737873]">
					<span>
						Sisa belum tertagih: <b>{formatRupiah(stats?.unpaidAmount || 0)}</b>
					</span>
				</div>
			</Card>

			{/* Terlambat (Overdue) */}
			<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
				<div className="flex items-start justify-between">
					<div>
						<span className="text-[11px] text-[#737873] font-medium block">
							Terlambat
						</span>
						<h3 className="text-lg sm:text-xl font-bold text-[#a65f5b] mt-1">
							{isLoading ? "..." : `${stats?.overdueCount || 0} Kamar`}
						</h3>
					</div>
					<div className="w-8 h-8 rounded-lg bg-[#f7e9e8] text-[#a65f5b] flex items-center justify-center">
						<AlertTriangle className="w-4 h-4" />
					</div>
				</div>
				<div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#737873]">
					<span className="text-[#a65f5b] font-semibold">
						{stats?.overdueCount
							? "Perlu follow-up WhatsApp"
							: "Tidak ada tunggakan"}
					</span>
				</div>
			</Card>
		</div>
	);
}
