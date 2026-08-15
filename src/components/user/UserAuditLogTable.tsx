import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { History } from "lucide-react";
import { useMemo } from "react";
import { Card } from "../../common/shadcn/card.tsx";
import type { AuditLogItem } from "../../common/types/index.ts";

interface UserAuditLogTableProps {
	data: AuditLogItem[];
}

const columnHelper = createColumnHelper<AuditLogItem>();

export function UserAuditLogTable({ data }: UserAuditLogTableProps) {
	const columns = useMemo(
		() => [
			columnHelper.accessor("time", {
				header: "Waktu",
				cell: (info) => (
					<span className="text-xs font-semibold text-[#252925]">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("userName", {
				header: "User Pengelola",
				cell: (info) => (
					<div className="flex items-center gap-1.5">
						<b className="text-xs text-[#252925]">{info.getValue()}</b>
						<span className="text-[10px] text-[#737873]">
							({info.row.original.userRole})
						</span>
					</div>
				),
			}),
			columnHelper.accessor("activity", {
				header: "Aktivitas",
				cell: (info) => (
					<span className="text-xs text-[#4f6958] font-medium bg-[#f0f5f1] px-2 py-0.5 rounded">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("detail", {
				header: "Detail Perubahan",
				cell: (info) => (
					<span className="text-xs text-[#4c524d] font-medium">
						{info.getValue()}
					</span>
				),
			}),
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
			<div className="pb-3 border-b border-[#e4e9e4]">
				<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
					<History className="w-4 h-4 text-[#4f6958]" />
					Riwayat Perubahan & Log Audit
				</h2>
				<p className="text-[11px] text-[#737873] mt-0.5">
					Aktivitas transaksi, pembaruan data penghuni, dan tindakan operasional
					yang dilakukan oleh pengguna.
				</p>
			</div>

			<div className="overflow-x-auto mt-2">
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
							<tr key={row.id} className="hover:bg-[#fbfcfb] transition-colors">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="py-2.5 px-3 text-xs">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
