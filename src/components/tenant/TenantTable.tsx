import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TenantItem } from "../../common/types/index.ts";
import { formatShortDueDate } from "../../lib/date-utils.ts";
import { formatDisplayPhone } from "../../lib/phone-utils.ts";

interface TenantTableProps {
	data: TenantItem[];
	onDetail: (tenant: TenantItem) => void;
	onEdit: (tenant: TenantItem) => void;
	onDelete: (tenant: TenantItem) => void;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	onSortToggle?: (column: string) => void;
}

const columnHelper = createColumnHelper<TenantItem>();

export function TenantTable({
	data,
	onDetail,
	onEdit,
	onDelete,
	sortBy = "roomNo",
	sortOrder = "asc",
	onSortToggle,
}: TenantTableProps) {
	const [visibleCount, setVisibleCount] = useState<number>(15);
	const observerTarget = useRef<HTMLDivElement | null>(null);

	// Reset pagination limit when dataset changes (e.g. search, filter, or property switch)
	useEffect(() => {
		setVisibleCount(15);
	}, [data]);

	const hasMore = visibleCount < data.length;

	// Infinite scroll intersection observer
	useEffect(() => {
		if (!hasMore) return;
		const el = observerTarget.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setVisibleCount((prev) => Math.min(prev + 15, data.length));
				}
			},
			{ threshold: 0.1, rootMargin: "150px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, data.length]);

	const visibleData = useMemo(() => {
		return data.slice(0, visibleCount);
	}, [data, visibleCount]);

	const renderSortHeader = (title: string, columnKey: string) => {
		if (!onSortToggle) return title;
		const isActive = sortBy === columnKey;
		return (
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onSortToggle(columnKey);
				}}
				className="flex items-center gap-1.5 hover:text-[#252925] transition-colors cursor-pointer group uppercase tracking-wider text-[9.5px] font-semibold text-[#8b918c]"
			>
				<span>{title}</span>
				{isActive ? (
					sortOrder === "asc" ? (
						<ArrowUp className="w-3 h-3 text-[#4f6958]" />
					) : (
						<ArrowDown className="w-3 h-3 text-[#4f6958]" />
					)
				) : (
					<ArrowDownUp className="w-3 h-3 text-[#8fa594] opacity-50 group-hover:opacity-100 transition-opacity" />
				)}
			</button>
		);
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				id: "name",
				header: () => renderSortHeader("Penghuni", "name"),
				cell: (info) => (
					<b className="text-[12px] font-bold text-[#252925]">
						{info.getValue()}
					</b>
				),
			}),
			columnHelper.accessor("roomNo", {
				id: "roomNo",
				header: () => renderSortHeader("Kamar", "roomNo"),
				cell: (info) => (
					<span className="text-[11.5px] font-semibold text-[#506257]">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("phone", {
				id: "phone",
				header: "WhatsApp",
				cell: (info) => (
					<span className="text-[11.5px] text-[#454b46] font-mono">
						{formatDisplayPhone(info.getValue())}
					</span>
				),
			}),
			columnHelper.accessor("startDate", {
				id: "startDate",
				header: () => renderSortHeader("Mulai Sewa", "startDate"),
				cell: (info) => (
					<span className="text-[11.5px] text-[#737873]">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("dueDate", {
				id: "dueDate",
				header: () => renderSortHeader("Jatuh Tempo", "dueDate"),
				cell: (info) => (
					<span className="text-[11.5px] text-[#737873]">
						{formatShortDueDate(info.getValue())}
					</span>
				),
			}),
			columnHelper.accessor("paymentStatus", {
				id: "paymentStatus",
				header: () => renderSortHeader("Pembayaran", "paymentStatus"),
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
		data: visibleData,
		columns,
		getCoreRowModel: getCoreRowModel(),
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

			{/* ─── Infinite Scroll Footer ───────────────────────────────────────── */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#edf1ed] text-xs text-[#737873]">
				<div>
					Menampilkan <b>{visibleData.length}</b> dari <b>{data.length}</b>{" "}
					total penghuni
				</div>

				{hasMore ? (
					<div
						ref={observerTarget}
						className="flex items-center gap-2 self-center sm:self-auto py-1"
					>
						<button
							type="button"
							onClick={() =>
								setVisibleCount((prev) => Math.min(prev + 15, data.length))
							}
							className="text-[11px] font-semibold text-[#4f6958] hover:underline cursor-pointer"
						>
							Scroll ke bawah untuk memuat data berikutnya
						</button>
					</div>
				) : (
					<div className="text-[11px] text-[#8fa594] font-medium self-center sm:self-auto">
						{data.length > 0 ? "✓ Seluruh data penghuni telah dimuat" : ""}
					</div>
				)}
			</div>
		</div>
	);
}
