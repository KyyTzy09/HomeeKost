import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { TenantItem } from "../../common/types/index.ts";
import { formatShortDueDate } from "../../lib/date-utils.ts";
import { formatDisplayPhone } from "../../lib/phone-utils.ts";

interface TenantTableProps {
	data: TenantItem[];
	onDetail: (tenant: TenantItem) => void;
	onEdit: (tenant: TenantItem) => void;
	onDelete: (tenant: TenantItem) => void;
}

const columnHelper = createColumnHelper<TenantItem>();

export function TenantTable({
	data,
	onDetail,
	onEdit,
	onDelete,
}: TenantTableProps) {
	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				header: "Penghuni",
				cell: (info) => (
					<b className="text-[12px] font-bold text-[#252925]">
						{info.getValue()}
					</b>
				),
			}),
			columnHelper.accessor("roomNo", {
				header: "Kamar",
				cell: (info) => (
					<span className="text-[11.5px] font-semibold text-[#506257]">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("phone", {
				header: "WhatsApp",
				cell: (info) => (
					<span className="text-[11.5px] text-[#454b46] font-mono">
						{formatDisplayPhone(info.getValue())}
					</span>
				),
			}),
			columnHelper.accessor("startDate", {
				header: "Mulai Sewa",
				cell: (info) => (
					<span className="text-[11.5px] text-[#737873]">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("dueDate", {
				header: "Jatuh Tempo",
				cell: (info) => (
					<span className="text-[11.5px] text-[#737873]">
						{formatShortDueDate(info.getValue())}
					</span>
				),
			}),
			columnHelper.accessor("paymentStatus", {
				header: "Pembayaran",
				cell: (info) => {
					const status = info.getValue();
					const isLancar = status === "Lancar";
					return (
						<span
							className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
								isLancar
									? "bg-[#e8f2ea] text-[#568062]"
									: "bg-[#f7e9e8] text-[#a65f5b]"
							}`}
						>
							{status}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: () => null,
				cell: (info) => {
					const tenant = info.row.original;
					return (
						<div className="flex items-center justify-end gap-2">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDetail(tenant);
								}}
								className="text-[10.5px] font-semibold text-[#4f6958] hover:underline cursor-pointer bg-transparent border-0 p-0"
							>
								Detail
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(tenant);
								}}
								className="text-[10.5px] font-semibold text-[#506257] hover:underline cursor-pointer bg-transparent border-0 p-0"
							>
								Edit
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(tenant);
								}}
								className="text-[10.5px] font-semibold text-[#b66b68] hover:underline cursor-pointer bg-transparent border-0 p-0"
							>
								Check-Out
							</button>
						</div>
					);
				},
			}),
		],
		[onDetail, onEdit, onDelete],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	return (
		<div className="space-y-3">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse min-w-[650px]">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="border-b border-[#eef1ee]">
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="text-left py-2.5 px-2 text-[9.5px] font-semibold uppercase tracking-wider text-[#8b918c]"
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
					<tbody>
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									onClick={() => onDetail(row.original)}
									className="border-b border-[#eef1ee] hover:bg-[#f8faf8] transition-colors cursor-pointer"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="py-3 px-2 text-[#454b46]">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={columns.length}
									className="text-center py-8 text-[#737873] text-[12px]"
								>
									Tidak ada data penghuni yang cocok dengan pencarian atau
									filter.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{table.getPageCount() > 1 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#edf1ed]">
					<span className="text-[11.5px] text-[#737873]">
						Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
						{table.getPageCount()} ({data.length} total penghuni)
					</span>

					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							className="h-[32px] px-2.5 text-[11px] font-semibold border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3]"
						>
							<ChevronLeft className="w-3.5 h-3.5 mr-1" />
							Sebelumnya
						</Button>

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							className="h-[32px] px-2.5 text-[11px] font-semibold border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3]"
						>
							Selanjutnya
							<ChevronRight className="w-3.5 h-3.5 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
