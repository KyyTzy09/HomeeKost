import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { BedDouble, PieChart } from "lucide-react";
import { useMemo } from "react";
import { Card } from "../../common/shadcn/card.tsx";
import type {
	ExpenseItemBreakdown,
	PropertyRoomStatusSummary,
} from "../../common/types/index.ts";

interface ReportRoomExpenseBreakdownProps {
	propertyName: string;
	roomStatus: PropertyRoomStatusSummary;
	expenses: ExpenseItemBreakdown[];
}

const columnHelper = createColumnHelper<ExpenseItemBreakdown>();

export function ReportRoomExpenseBreakdown({
	propertyName,
	roomStatus,
	expenses,
}: ReportRoomExpenseBreakdownProps) {
	const formatRupiah = (val: number) => `Rp${val.toLocaleString("id-ID")}`;

	const columns = useMemo(
		() => [
			columnHelper.accessor("category", {
				header: "Kategori Pengeluaran",
				cell: (info) => (
					<div>
						<b className="text-xs text-[#252925]">{info.getValue()}</b>
						<p className="text-[10px] text-[#737873]">
							{info.row.original.description}
						</p>
					</div>
				),
			}),
			columnHelper.accessor("amount", {
				header: "Nominal",
				cell: (info) => (
					<span className="text-xs font-semibold text-[#a45149]">
						{formatRupiah(info.getValue())}
					</span>
				),
			}),
			columnHelper.accessor("percentage", {
				header: "Porsi Beban",
				cell: (info) => (
					<div className="flex items-center gap-2">
						<div className="w-16 bg-[#edf2ee] h-2 rounded-full overflow-hidden">
							<div
								className="bg-[#4f6958] h-full rounded-full"
								style={{ width: `${info.getValue()}%` }}
							/>
						</div>
						<span className="text-[11px] font-medium text-[#737873]">
							{info.getValue()}%
						</span>
					</div>
				),
			}),
		],
		[],
	);

	const table = useReactTable({
		data: expenses,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
			{/* Left Column: Tabel Rincian Beban Terbesar Properti Ini (Span 2) */}
			<Card className="lg:col-span-2 p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
				<div className="pb-3 border-b border-[#e4e9e4]">
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<PieChart className="w-4 h-4 text-[#4f6958]" />
						Rincian Beban Operasional · {propertyName}
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Komponen pengeluaran terbesar yang dicatat pada properti ini.
					</p>
				</div>

				<div className="overflow-x-auto mt-3">
					<table className="w-full text-left border-collapse">
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr
									key={headerGroup.id}
									className="border-b border-[#edf1ed] bg-[#fbfcfb]"
								>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className="py-2.5 px-3 text-[11px] font-semibold text-[#737873]"
										>
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
						<tbody className="divide-y divide-[#edf1ed]">
							{table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="hover:bg-[#fbfcfb] transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="py-2.5 px-3 text-xs">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>

			{/* Right Column: Ringkasan Okupansi Kamar Kos Ini */}
			<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
				<div>
					<div className="pb-3 border-b border-[#e4e9e4]">
						<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<BedDouble className="w-4 h-4 text-[#4f6958]" />
							Status Kamar
						</h2>
						<p className="text-[11px] text-[#737873] mt-0.5">
							Distribusi ketersediaan unit di {propertyName}
						</p>
					</div>

					<div className="space-y-3 mt-4">
						{/* Terisi */}
						<div className="p-3 bg-[#f5faf6] border border-[#d6e8d9] rounded-xl flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#568062]" />
								<span className="text-xs font-semibold text-[#252925]">
									Kamar Terisi
								</span>
							</div>
							<b className="text-xs font-bold text-[#568062]">
								{roomStatus.occupiedRooms} Kamar
							</b>
						</div>

						{/* Kosong */}
						<div className="p-3 bg-[#fdfbf7] border border-[#f1e6d2] rounded-xl flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#c28e3b]" />
								<span className="text-xs font-semibold text-[#252925]">
									Kamar Kosong
								</span>
							</div>
							<b className="text-xs font-bold text-[#c28e3b]">
								{roomStatus.emptyRooms} Kamar
							</b>
						</div>

						{/* Perbaikan */}
						<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#a0a8a1]" />
								<span className="text-xs font-semibold text-[#252925]">
									Dalam Maintenance
								</span>
							</div>
							<b className="text-xs font-bold text-[#737873]">
								{roomStatus.maintenanceRooms} Kamar
							</b>
						</div>
					</div>
				</div>

				<div className="mt-4 pt-3 border-t border-[#e4e9e4] text-[11px] text-[#737873]">
					Tingkat okupansi tercatat <b>{roomStatus.occupancyRate}%</b> (
					{roomStatus.occupiedRooms} dari {roomStatus.totalRooms} kamar aktif).
				</div>
			</Card>
		</div>
	);
}
