import { Activity } from "lucide-react";
import type { AiMonthlyReportData } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface ExecutiveReportDocProps {
	report: AiMonthlyReportData;
	activePropertyLogo?: string | null;
	activePropertyAddress?: string | null;
}

export function ExecutiveReportDoc({
	report,
	activePropertyLogo,
	activePropertyAddress,
}: ExecutiveReportDocProps) {
	const logoUrl = report.propertyImageUrl || activePropertyLogo || "/logo.png";
	const address =
		report.propertyAddress ||
		activePropertyAddress ||
		"Sistem Manajemen Operasional Kos Multi-Cabang";

	const getHealthBadge = (grade?: string) => {
		switch (grade) {
			case "PRIMA":
				return {
					text: "PRIMA",
					bg: "bg-[#e8f2ea]",
					color: "text-[#3e724d]",
					border: "border-[#b9dbbf]",
				};
			case "SEHAT":
				return {
					text: "SEHAT",
					bg: "bg-[#edf4ee]",
					color: "text-[#4f6958]",
					border: "border-[#cde0d1]",
				};
			case "WASPADA":
				return {
					text: "WASPADA",
					bg: "bg-[#fbf4e6]",
					color: "text-[#b18a4b]",
					border: "border-[#eed7b0]",
				};
			case "KRITIS":
				return {
					text: "KRITIS",
					bg: "bg-[#fceeed]",
					color: "text-[#b66b68]",
					border: "border-[#f0c3c1]",
				};
			default:
				return {
					text: "NORMAL",
					bg: "bg-[#f3f7f3]",
					color: "text-[#55705d]",
					border: "border-[#dce6df]",
				};
		}
	};

	const health = getHealthBadge(report.financialHealthGrade);

	return (
		<div
			id="printable-executive-report"
			className="bg-white border border-[#d8e2da] rounded-xl p-8 max-w-[840px] mx-auto text-[#252925] shadow-xs print:border-0 print:shadow-none print:p-0 print:max-w-none"
		>
			{/* 1. KOP SURAT RESMI */}
			<div className="flex items-center justify-between pb-6 border-b-2 border-[#4f6958] gap-4">
				<div className="flex items-center gap-4">
					<div className="w-16 h-16 rounded-xl border border-[#e4e9e4] bg-[#faf9f5] flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
						<img
							src={logoUrl}
							alt={report.propertyName}
							className="w-full h-full object-contain"
							onError={(e) => {
								(e.target as HTMLImageElement).src = "/logo.png";
							}}
						/>
					</div>
					<div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4f6958] block mb-0.5">
							Laporan Keuangan & Kinerja Bisnis
						</span>
						<h1 className="text-xl font-bold tracking-tight text-[#252925] leading-tight">
							{report.propertyName}
						</h1>
						<p className="text-[11px] text-[#737873] mt-0.5 max-w-[450px]">
							{address}
						</p>
					</div>
				</div>

				<div className="text-right shrink-0">
					<div className="inline-block bg-[#f3f7f3] border border-[#dce6df] px-3 py-1 rounded-lg text-right">
						<span className="text-[9.5px] uppercase font-bold text-[#737873] block">
							Periode Laporan
						</span>
						<strong className="text-sm font-bold text-[#252925] block">
							{report.periodMonth} {report.periodYear}
						</strong>
					</div>
					<span className="text-[9.5px] text-[#8fa594] block mt-1">
						Status: {report.isClosedPeriod ? "Tutup Buku" : "Data Berjalan"}
					</span>
				</div>
			</div>

			{/* 2. GRID 4 KPI FINANSIAL UTAMA */}
			<div className="grid grid-cols-4 gap-3 my-6">
				<div className="p-3.5 rounded-lg border border-[#e4e9e4] bg-[#fbfcfb]">
					<span className="text-[10px] uppercase font-bold tracking-wider text-[#737873] block mb-1">
						Total Pendapatan
					</span>
					<strong className="text-base font-bold text-[#4f6958] block leading-tight">
						{formatRupiah(report.totalIncome)}
					</strong>
					<span className="text-[9.5px] text-[#568062] font-semibold mt-0.5 block">
						Realisasi Penerimaan
					</span>
				</div>

				<div className="p-3.5 rounded-lg border border-[#e4e9e4] bg-[#fbfcfb]">
					<span className="text-[10px] uppercase font-bold tracking-wider text-[#737873] block mb-1">
						Total Beban
					</span>
					<strong className="text-base font-bold text-[#b66b68] block leading-tight">
						{formatRupiah(report.totalExpense)}
					</strong>
					<span className="text-[9.5px] text-[#737873] mt-0.5 block">
						Ops: {formatRupiah(report.operationalExpense)}
					</span>
				</div>

				<div className="p-3.5 rounded-lg border border-[#e4e9e4] bg-[#fbfcfb]">
					<span className="text-[10px] uppercase font-bold tracking-wider text-[#737873] block mb-1">
						Laba Bersih Kas
					</span>
					<strong
						className={`text-base font-bold block leading-tight ${
							report.netProfit >= 0 ? "text-[#3e724d]" : "text-[#b66b68]"
						}`}
					>
						{formatRupiah(report.netProfit)}
					</strong>
					<span className="text-[9.5px] text-[#737873] mt-0.5 block">
						Margin: {report.profitMarginPercentage.toFixed(1)}%
					</span>
				</div>

				<div className="p-3.5 rounded-lg border border-[#e4e9e4] bg-[#fbfcfb]">
					<span className="text-[10px] uppercase font-bold tracking-wider text-[#737873] block mb-1">
						Keterisian Unit
					</span>
					<strong className="text-base font-bold text-[#252925] block leading-tight">
						{report.roomStatus.occupancyRate.toFixed(1)}%
					</strong>
					<span className="text-[9.5px] text-[#737873] mt-0.5 block">
						{report.roomStatus.occupiedRooms} dari{" "}
						{report.roomStatus.totalRooms} kamar terisi
					</span>
				</div>
			</div>

			{/* 3. RINGKASAN EKSEKUTIF & SOROTAN KUNCI FAKTUAL */}
			<div className="mb-6 border border-[#e4e9e4] rounded-lg p-4 bg-[#fafbfa]">
				<div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#e8efe9]">
					<h3 className="text-xs font-bold uppercase tracking-wider text-[#252925] flex items-center gap-1.5">
						<Activity className="w-3.5 h-3.5 text-[#4f6958]" />
						Ringkasan Analisis & Evaluasi Performa
					</h3>
					<span
						className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${health.bg} ${health.color} ${health.border}`}
					>
						Kesehatan Finansial: {health.text}
					</span>
				</div>

				<p className="text-[11.5px] text-[#37443c] leading-relaxed mb-3">
					{report.narrativeSummary}
				</p>

				{/* Key Highlights */}
				{report.keyHighlights && report.keyHighlights.length > 0 && (
					<div className="pt-2.5 border-t border-[#e8efe9]">
						<strong className="text-[10.5px] font-bold uppercase tracking-wider text-[#4f6958] block mb-1.5">
							Sorotan Fakta Kunci:
						</strong>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
							{report.keyHighlights.map((hl) => (
								<div
									key={hl}
									className="text-[10.5px] text-[#48564c] bg-white border border-[#e4e9e4] rounded-md p-2 leading-snug flex items-start gap-1.5"
								>
									<span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] mt-1 shrink-0" />
									<span>{hl}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* 4. TABEL RINCIAN BEBAN PENGELUARAN */}
			<div className="mb-6">
				<h3 className="text-xs font-bold uppercase tracking-wider text-[#252925] mb-2">
					Rincian Alokasi Beban Pengeluaran
				</h3>
				<div className="border border-[#e4e9e4] rounded-lg overflow-hidden">
					<table className="w-full text-[11px] border-collapse">
						<thead>
							<tr className="bg-[#f4f7f4] border-b border-[#e4e9e4] text-[#4f6958]">
								<th className="py-2 px-3 text-left font-bold uppercase text-[9.5px] w-12">
									No
								</th>
								<th className="py-2 px-3 text-left font-bold uppercase text-[9.5px]">
									Kategori Beban
								</th>
								<th className="py-2 px-3 text-left font-bold uppercase text-[9.5px]">
									Keterangan Alokasi
								</th>
								<th className="py-2 px-3 text-right font-bold uppercase text-[9.5px] w-28">
									Porsi (%)
								</th>
								<th className="py-2 px-3 text-right font-bold uppercase text-[9.5px] w-36">
									Nominal (Rp)
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#edf1ed]">
							{report.expenseBreakdown.length > 0 ? (
								report.expenseBreakdown.map((exp, idx) => (
									<tr key={exp.id || idx} className="hover:bg-[#fafbfa]">
										<td className="py-2 px-3 text-left text-[#737873]">
											{idx + 1}
										</td>
										<td className="py-2 px-3 font-semibold text-[#252925]">
											{exp.category}
										</td>
										<td className="py-2 px-3 text-[#566057]">
											{exp.description || "Alokasi pengeluaran operasional kos"}
										</td>
										<td className="py-2 px-3 text-right text-[#737873] font-mono">
											{exp.percentage.toFixed(1)}%
										</td>
										<td className="py-2 px-3 text-right font-semibold text-[#252925] font-mono">
											{formatRupiah(exp.amount)}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={5}
										className="py-4 text-center text-[#737873] italic"
									>
										Tidak tercatat pengeluaran pada periode ini.
									</td>
								</tr>
							)}
						</tbody>
						<tfoot>
							<tr className="bg-[#f7faf7] border-t-2 border-[#d8e2da] font-bold text-[#252925]">
								<td colSpan={3} className="py-2.5 px-3 uppercase text-[10px]">
									Total Beban Pengeluaran
								</td>
								<td className="py-2.5 px-3 text-right font-mono text-[10px]">
									100.0%
								</td>
								<td className="py-2.5 px-3 text-right font-mono text-xs text-[#b66b68]">
									{formatRupiah(report.totalExpense)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			{/* 5. TANDA TANGAN & PENGESAHAN DOKUMEN */}
			<div className="pt-6 border-t border-[#e4e9e4] flex items-end justify-between text-[11px] text-[#737873]">
				<div>
					<p className="text-[10px] text-[#8fa594]">
						Dokumen ini digenerate secara otomatis dan terverifikasi oleh
						database HomeeKost.
					</p>
					<p className="text-[10px] text-[#8fa594] mt-0.5">
						Waktu Cetak: {report.generatedAt}
					</p>
				</div>

				<div className="text-center min-w-[160px]">
					<p className="text-[10px] text-[#737873] mb-12">
						Pengelola / Pemilik Kos,
					</p>
					<div className="border-b border-[#252925] pb-0.5">
						<strong className="text-xs text-[#252925] block">
							{report.propertyName}
						</strong>
					</div>
					<span className="text-[9.5px] text-[#8fa594] block mt-0.5">
						HomeeKost Management System
					</span>
				</div>
			</div>
		</div>
	);
}
