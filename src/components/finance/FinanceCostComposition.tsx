import { Card } from "../../common/shadcn/card.tsx";
import type { CategoryCostItem } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface FinanceCostCompositionProps {
	items?: CategoryCostItem[];
	totalExpense?: number;
	expenseRatio?: number;
	isLoading?: boolean;
}

export function FinanceCostComposition({
	items = [],
	totalExpense = 0,
	isLoading = false,
}: FinanceCostCompositionProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
			<div>
				<div className="pb-3 border-b border-[#e4e9e4]">
					<h2 className="text-sm font-bold text-[#252925]">
						Komposisi Biaya
					</h2>
					<p className="text-[11px] text-[#737873]">
						Berdasarkan kategori pengeluaran operasional & perbaikan
					</p>
				</div>

				{/* Progress Bars Breakdown */}
				<div className="mt-5 space-y-4">
					{isLoading ? (
						<div className="py-8 text-center text-xs text-[#737873]">
							<div className="w-4 h-4 border-2 border-[#4f6958] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
							Memuat komposisi biaya...
						</div>
					) : items.length === 0 ? (
						<div className="py-8 text-center text-xs text-[#737873]">
							Belum ada catatan pengeluaran pada periode ini.
						</div>
					) : (
						items.map((item) => (
							<div key={item.categoryKey || item.category}>
								<div className="flex justify-between text-xs mb-1.5">
									<div className="flex items-center gap-2">
										<span
											className="w-2.5 h-2.5 rounded-full"
											style={{ backgroundColor: item.color || "#4f6958" }}
										/>
										<span className="font-semibold text-[#252925]">
											{item.category}
										</span>
									</div>
									<b className="text-[#4f6958]">
										{formatRupiah(item.amount)} ({item.percentage}%)
									</b>
								</div>
								<div className="h-2.5 w-full bg-[#edf0ed] rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all duration-500"
										style={{
											width: `${Math.min(100, Math.max(2, item.percentage))}%`,
											backgroundColor: item.color || "#4f6958",
										}}
									/>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Total Pengeluaran di Bagian Bawah Card (Tanpa Badge) */}
			<div className="mt-6 pt-3 border-t border-[#e4e9e4] flex items-center justify-between text-xs">
				<span className="text-[#737873] font-medium">Total Pengeluaran</span>
				<span className="text-sm font-bold text-[#252925]">
					{formatRupiah(totalExpense)}
				</span>
			</div>
		</Card>
	);
}
