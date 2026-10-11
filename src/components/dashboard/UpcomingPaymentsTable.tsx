import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { UpcomingPaymentItem } from "../../common/types/index.ts";

interface UpcomingPaymentsTableProps {
	data: UpcomingPaymentItem[];
	onAction: (item: UpcomingPaymentItem) => void;
}

const columnHelper = createColumnHelper<UpcomingPaymentItem>();

export function UpcomingPaymentsTable({
	data,
	onAction,
}: UpcomingPaymentsTableProps) {
	const columns = useMemo(
		() => [
			columnHelper.accessor("tenant", {
				header: "Penghuni",
				cell: (info) => <b>{info.getValue()}</b>,
			}),
			columnHelper.accessor("room", {
				header: "Kamar",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("dueDate", {
				header: "Jatuh Tempo",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("amount", {
				header: "Nominal",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("badgeText", {
				header: "Status",
				cell: (info) => {
					const item = info.row.original;
					return (
						<span className={`badge ${item.badgeClass}`}>{item.badgeText}</span>
					);
				},
			}),
			columnHelper.display({
				id: "action",
				header: "",
				cell: (info) => {
					const item = info.row.original;
					return (
						<button
							type="button"
							className="row-action"
							onClick={(e) => {
								e.stopPropagation();
								onAction(item);
							}}
						>
							{item.actionText}
						</button>
					);
				},
			}),
		],
		[onAction],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (data.length === 0) {
		return (
			<div className="empty-state-box p-6 text-center text-xs text-[#737873]">
				Semua tagihan bulan ini telah lunas ✨
			</div>
		);
	}

	return (
		<div className="table-wrap">
			<table>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th key={header.id}>
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
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<td key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
