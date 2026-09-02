import {
	CalendarDays,
	Download,
	FileSpreadsheet,
	Loader2,
	TrendingUp,
} from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type { AnnualReportMatrixData } from "../../common/types/index.ts";
import { formatCompactRupiah, formatRupiah } from "../../lib/currency.ts";

interface ReportAnnualMatrixCardProps {
	data?: AnnualReportMatrixData | null;
	isLoading?: boolean;
	onExportExcel?: () => void;
	isExportingExcel?: boolean;
	onExportCsv?: () => void;
	isExporting?: boolean;
}

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
];

export function ReportAnnualMatrixCard({
	data,
	isLoading,
	onExportExcel,
	isExportingExcel,
	onExportCsv,
	isExporting,
}: ReportAnnualMatrixCardProps) {
	if (isLoading) {
		return (
			<Card className="p-6 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex items-center justify-center py-12">
				<div className="flex items-center gap-2 text-xs text-[#737873]">
					<Loader2 className="w-4 h-4 animate-spin text-[#4f6958]" />
					<span>Memuat matriks performa keuangan tahunan...</span>
				</div>
			</Card>
		);
	}

	if (!data) return null;

	const maxIncome = Math.max(...data.monthlyTotalIncome, 1);

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* Card Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e4e9e4]">
				<div>
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-bold uppercase tracking-wider bg-[#edf4ee] text-[#4f6958] px-2 py-0.5 rounded border border-[#d6dfd7] flex items-center gap-1">
							<CalendarDays className="w-3 h-3" />
							Tahun {data.year}
						</span>
						<h2 className="text-sm font-bold text-[#252925] flex items-center gap-1.5">
							Matriks Keuangan Tahunan
						</h2>
					</div>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Rekapitulasi pendapatan sewa per kos, beban operasional, dan laba
						bersih 12 bulan untuk {data.propertyName}.
					</p>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
					{onExportCsv && (
						<Button
							type="button"
							variant="outline"
							onClick={onExportCsv}
							disabled={isExporting}
							className="border-[#d6dfd7] bg-white text-[#2d3b30] hover:bg-[#edf4ee] text-xs font-semibold h-9 px-3.5 shadow-2xs flex items-center gap-1.5 cursor-pointer"
						>
							{isExporting ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Download className="w-3.5 h-3.5 text-[#4f6958]" />
							)}
							{isExporting ? "Mengekspor..." : "Ekspor CSV (.CSV)"}
						</Button>
					)}
					{onExportExcel && (
						<Button
							type="button"
							onClick={onExportExcel}
							disabled={isExportingExcel}
							className="bg-[#4f6958] text-white hover:bg-[#3d5244] text-xs font-semibold h-9 px-3.5 shadow-2xs flex items-center gap-1.5 cursor-pointer"
						>
							{isExportingExcel ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<FileSpreadsheet className="w-3.5 h-3.5" />
							)}
							{isExportingExcel ? "Menyusun Excel..." : "Ekspor Excel (.XLSX)"}
						</Button>
					)}
				</div>
			</div>

			{/* Mini Visual Chart Bar Tren Pendapatan 12 Bulan */}
			<div className="mt-4 p-4 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
				<div className="flex items-center justify-between mb-2.5">
					<span className="text-[11px] font-bold text-[#252925] flex items-center gap-1.5">
						<TrendingUp className="w-3.5 h-3.5 text-[#4f6958]" />
						Tren Arus Kas Pendapatan Bulanan (Jan – Des)
					</span>
					<span className="text-[10px] text-[#737873]">
						Total Akumulasi:{" "}
						<strong className="text-[#252925]">
							{formatRupiah(data.grandTotals.totalIncome)}
						</strong>
					</span>
				</div>

				<div className="grid grid-cols-12 gap-1.5 items-end h-24 pt-2">
					{data.monthlyTotalIncome.map((inc, idx) => {
						const heightPct = Math.max((inc / maxIncome) * 100, 6);
						const isZero = inc === 0;

						return (
							<div
								key={MONTH_LABELS[idx]}
								className="flex flex-col items-center h-full justify-end group relative"
							>
								{/* Tooltip on Hover */}
								<div className="absolute -top-7 hidden group-hover:flex z-10 bg-[#253129] text-white text-[10px] font-medium py-0.5 px-1.5 rounded shadow whitespace-nowrap">
									{MONTH_LABELS[idx]}: {formatRupiah(inc)}
								</div>

								<div
									className={`w-full rounded-t-sm transition-all duration-300 ${
										isZero
											? "bg-[#e5ece5] h-1"
											: "bg-[#557860] group-hover:bg-[#3d5a46]"
									}`}
									style={{ height: isZero ? "4px" : `${heightPct}%` }}
								/>
								<span className="text-[9.5px] font-semibold text-[#737873] mt-1">
									{MONTH_LABELS[idx]}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Tabel Matriks 12 Bulan Rapi */}
			<div className="mt-4 overflow-x-auto border border-[#e4e9e4] rounded-xl">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="bg-[#f5f8f5] border-b border-[#e4e9e4]">
							<th className="py-2.5 px-3 font-bold text-[#252925] whitespace-nowrap min-w-[200px]">
								Komponen Finansial
							</th>
							{MONTH_LABELS.map((m) => (
								<th
									key={m}
									className="py-2.5 px-2 font-semibold text-[#4f6958] text-center min-w-[65px]"
								>
									{m}
								</th>
							))}
							<th className="py-2.5 px-3 font-bold text-[#252925] text-right bg-[#edf3ed] min-w-[110px]">
								Total Setahun
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#edf1ed]">
						{/* Sub-header Pendapatan Sewa */}
						<tr className="bg-[#fbfcfb]">
							<td
								colSpan={14}
								className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#4f6958]"
							>
								[A] Pendapatan Sewa per Cabang Kos
							</td>
						</tr>

						{data.propertyIncomes.map((prop) => (
							<tr
								key={prop.propertyId}
								className="hover:bg-[#fbfcfb] text-[11px]"
							>
								<td className="py-2 px-3 pl-5 text-[#4c524d] font-medium">
									· {prop.propertyName}
								</td>
								{prop.monthlyIncome.map((val, i) => (
									<td
										key={`${prop.propertyId}-${MONTH_LABELS[i]}`}
										className="py-2 px-2 text-center text-[#556358] tabular-nums font-medium text-[11px]"
									>
										{formatCompactRupiah(val)}
									</td>
								))}
								<td className="py-2 px-3 text-right font-bold text-[#252925] tabular-nums bg-[#fafcfa]">
									{formatRupiah(prop.totalAnnualIncome)}
								</td>
							</tr>
						))}

						{/* Total Pendapatan */}
						<tr className="bg-[#f5faf6] font-bold text-[11px]">
							<td className="py-2 px-3 text-[#3e724d]">Total Omzet</td>
							{data.monthlyTotalIncome.map((val, i) => (
								<td
									key={`tot-inc-${MONTH_LABELS[i]}`}
									className="py-2 px-2 text-center text-[#3e724d] tabular-nums font-semibold"
								>
									{formatCompactRupiah(val)}
								</td>
							))}
							<td className="py-2 px-3 text-right text-[#3e724d] tabular-nums font-bold bg-[#edf5ee]">
								{formatRupiah(data.grandTotals.totalIncome)}
							</td>
						</tr>

						{/* Sub-header Pengeluaran */}
						<tr className="bg-[#fbfcfb]">
							<td
								colSpan={14}
								className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#a45149]"
							>
								[B] Beban Pengeluaran
							</td>
						</tr>

						{/* Beban Operasional */}
						<tr className="text-[11px] hover:bg-[#fbfcfb]">
							<td className="py-2 px-3 pl-5 text-[#4c524d]">
								· Beban Operasional Rutin
							</td>
							{data.monthlyOperationalExpense.map((val, i) => (
								<td
									key={`op-exp-${MONTH_LABELS[i]}`}
									className="py-2 px-2 text-center text-[#556358] tabular-nums font-medium text-[11px]"
								>
									{formatCompactRupiah(val)}
								</td>
							))}
							<td className="py-2 px-3 text-right font-semibold text-[#a45149] tabular-nums bg-[#fafcfa]">
								{formatRupiah(data.grandTotals.totalOperationalExpense)}
							</td>
						</tr>

						{/* Beban Investasi */}
						<tr className="text-[11px] hover:bg-[#fbfcfb]">
							<td className="py-2 px-3 pl-5 text-[#4c524d]">
								· Beban Investasi / Renovasi
							</td>
							{data.monthlyInvestmentExpense.map((val, i) => (
								<td
									key={`inv-exp-${MONTH_LABELS[i]}`}
									className="py-2 px-2 text-center text-[#556358] tabular-nums font-medium text-[11px]"
								>
									{formatCompactRupiah(val)}
								</td>
							))}
							<td className="py-2 px-3 text-right font-semibold text-[#a45149] tabular-nums bg-[#fafcfa]">
								{formatRupiah(data.grandTotals.totalInvestmentExpense)}
							</td>
						</tr>

						{/* Total Pengeluaran */}
						<tr className="bg-[#fdf4f4] font-bold text-[11px]">
							<td className="py-2 px-3 text-[#a45149]">Total Pengeluaran</td>
							{data.monthlyTotalExpense.map((val, i) => (
								<td
									key={`tot-exp-${MONTH_LABELS[i]}`}
									className="py-2 px-2 text-center text-[#a45149] tabular-nums font-semibold"
								>
									{formatCompactRupiah(val)}
								</td>
							))}
							<td className="py-2 px-3 text-right text-[#a45149] tabular-nums font-bold bg-[#fbeaea]">
								{formatRupiah(data.grandTotals.totalExpense)}
							</td>
						</tr>

						{/* Laba Bersih */}
						<tr className="bg-[#edf5ee] font-bold text-[11.5px] border-t-2 border-[#cde0d1]">
							<td className="py-2.5 px-3 text-[#253129]">
								LABA BERSIH (NET PROFIT)
							</td>
							{data.monthlyNetProfit.map((val, i) => (
								<td
									key={`net-${MONTH_LABELS[i]}`}
									className={`py-2.5 px-2 text-center tabular-nums font-bold ${
										val >= 0 ? "text-[#3e724d]" : "text-[#b66b68]"
									}`}
								>
									{formatCompactRupiah(val)}
								</td>
							))}
							<td className="py-2.5 px-3 text-right font-bold text-[#253129] tabular-nums bg-[#e2ede3]">
								{formatRupiah(data.grandTotals.netProfit)}
							</td>
						</tr>
					</tbody>
				</table>
				<div className="p-2.5 bg-[#f9faf9] border-t border-[#e4e9e4] text-[10.5px] text-[#737873] flex items-center justify-between">
					<span>
						* Angka kolom bulanan disajikan dalam format ringkas (rb: Ribu, jt: Juta, M: Miliar)
					</span>
					<span>
						Margin Laba Bersih Rata-rata:{" "}
						<strong>{data.grandTotals.profitMargin}%</strong>
					</span>
				</div>
			</div>
		</Card>
	);
}
