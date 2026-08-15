import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type { ProfitLossRow } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface FinanceProfitLossTableProps {
	selectedMonth: string;
	onMonthChange: (month: string) => void;
	onApply: () => void;
	data: ProfitLossRow[];
}

export function FinanceProfitLossTable({
	selectedMonth,
	onMonthChange,
	onApply,
	data,
}: FinanceProfitLossTableProps) {
	const columns = useMemo<ColumnDef<ProfitLossRow>[]>(
		() => [
			{
				accessorKey: "account",
				header: "Akun",
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div
							className={`${
								item.isSubItem
									? "pl-6 text-xs text-[#4c524d]"
									: "font-bold text-xs text-[#252925]"
							} ${item.isProfit ? "text-[#568062] font-bold text-sm" : ""}`}
						>
							{item.isSubItem && <span className="text-[#8fa594] mr-2">↳</span>}
							{item.account}
						</div>
					);
				},
			},
			{
				accessorKey: "period",
				header: "Pilih Bulan",
				cell: ({ row }) => (
					<span className="text-xs text-[#737873]">{row.original.period}</span>
				),
			},
			{
				accessorKey: "amount",
				header: () => <div className="text-right">Nilai</div>,
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div
							className={`text-right font-semibold text-xs ${
								item.isProfit
									? "text-[#568062] font-bold text-sm"
									: item.isTotal
										? "text-[#252925] font-bold"
										: "text-[#4c524d]"
							}`}
						>
							{formatRupiah(item.amount)}
						</div>
					);
				},
			},
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925]">
						Laporan Laba Rugi
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Struktur mengikuti pembukuan: pendapatan per kost, investasi,
						operasional, dan laba bersih.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Select
						value={selectedMonth}
						onValueChange={(val) => {
							if (val) onMonthChange(val);
						}}
					>
						<SelectTrigger className="w-36 h-8 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus:ring-[#8fa594]">
							<SelectValue placeholder="Pilih Bulan" />
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4]">
							{[
								"April",
								"Mei",
								"Juni",
								"Juli",
								"Agustus",
								"September",
								"Oktober",
								"November",
								"Desember",
							].map((m) => (
								<SelectItem key={m} value={m} className="text-xs">
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Tombol Terapkan: Berfungsi untuk mengonfirmasi / refresh data periode terpilih */}
					<Button
						type="button"
						className="h-8 px-3 text-xs bg-[#4f6958] hover:bg-[#425949] text-white font-semibold shadow-sm"
						onClick={onApply}
					>
						Terapkan
					</Button>
				</div>
			</div>

			{/* TanStack Table Container */}
			<div className="mt-4 border border-[#e4e9e4] rounded-lg overflow-hidden">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="bg-[#f3f7f3] border-b border-[#e4e9e4] text-[#737873] text-[11px]"
							>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="py-2.5 px-4 font-semibold">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-[#e4e9e4]">
						{table.getRowModel().rows.map((row) => {
							const orig = row.original;
							return (
								<tr
									key={row.id}
									className={`${
										orig.isTotal
											? "bg-[#fbfcfb]"
											: orig.isProfit
												? "bg-[#e8f2ea]/60"
												: ""
									} hover:bg-[#f3f7f3]/50 transition-colors`}
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="py-2.5 px-4">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Note Box */}
			<div className="mt-3.5 p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-lg text-[11px] text-[#737873] flex items-start gap-2">
				<Info className="w-4 h-4 text-[#5f896d] shrink-0 mt-0.5" />
				<div>
					<b className="text-[#252925]">Catatan Laporan:</b> Memisahkan belanja{" "}
					<b>Investasi (Capex)</b> dan <b>Operasional (Opex)</b> agar laba
					bersih riil per properti dapat dianalisis secara akurat sesuai kaidah
					akuntansi kos.
				</div>
			</div>
		</Card>
	);
}
