import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDownUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "../../common/shadcn/card.tsx";
import type { TransactionItem } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface FinanceTransactionTableProps {
	transactions: TransactionItem[];
	onDetail: (tx: TransactionItem) => void;
	onEdit: (tx: TransactionItem) => void;
	onDelete: (tx: TransactionItem) => void;
}

export function FinanceTransactionTable({
	transactions,
	onDetail,
	onEdit,
	onDelete,
}: FinanceTransactionTableProps) {
	const [txFilter, setTxFilter] = useState<"all" | "Income" | "Expense">("all");
	const [txSortDate, setTxSortDate] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 5,
	});

	// Filtered & Sorted Transactions Data
	const filteredData = useMemo(() => {
		let result = transactions.filter((t) => {
			const matchesType = txFilter === "all" || t.type === txFilter;
			const q = searchQuery.trim().toLowerCase();
			const matchesSearch =
				!q ||
				t.description.toLowerCase().includes(q) ||
				t.property.toLowerCase().includes(q) ||
				t.category.toLowerCase().includes(q);
			return matchesType && matchesSearch;
		});

		if (txSortDate) {
			result = [...result].sort((a, b) =>
				(a.rawDate || a.date).localeCompare(b.rawDate || b.date),
			);
		}

		return result;
	}, [transactions, txFilter, searchQuery, txSortDate]);

	const columns = useMemo<ColumnDef<TransactionItem>[]>(
		() => [
			{
				accessorKey: "date",
				header: "Tanggal",
				cell: ({ row }) => (
					<span className="text-[#737873] whitespace-nowrap font-medium text-xs">
						{row.original.date}
					</span>
				),
			},
			{
				accessorKey: "property",
				header: "Kost",
				cell: ({ row }) => (
					<span className="font-semibold text-[#252925] text-xs">
						{row.original.property}
					</span>
				),
			},
			{
				accessorKey: "category",
				header: "Kategori",
				cell: ({ row }) => (
					<span className="text-[#737873] text-xs">
						{row.original.category}
					</span>
				),
			},
			{
				accessorKey: "description",
				header: "Nama Pembayaran / Deskripsi",
				cell: ({ row }) => (
					<span className="text-[#252925] font-medium text-xs">
						{row.original.description}
					</span>
				),
			},
			{
				accessorKey: "type",
				header: "Jenis",
				cell: ({ row }) => {
					const isIncome = row.original.type === "Income";
					return (
						<span
							className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
								isIncome
									? "bg-[#e8f2ea] text-[#568062]"
									: "bg-[#f7e9e8] text-[#a65f5b]"
							}`}
						>
							{row.original.type}
						</span>
					);
				},
			},
			{
				accessorKey: "amount",
				header: () => <div className="text-right">Nominal</div>,
				cell: ({ row }) => {
					const isIncome = row.original.type === "Income";
					return (
						<div
							className={`text-right font-semibold text-xs whitespace-nowrap ${
								isIncome ? "text-[#568062]" : "text-[#252925]"
							}`}
						>
							{formatRupiah(row.original.amount)}
						</div>
					);
				},
			},
			{
				id: "actions",
				header: () => <div className="text-right">Aksi</div>,
				cell: ({ row }) => {
					const tx = row.original;
					return (
						<div className="text-right whitespace-nowrap space-x-1">
							<button
								type="button"
								className="px-2 py-1 text-[11px] text-[#4f6958] font-semibold hover:bg-[#e8f0ea] rounded transition-colors"
								onClick={() => onDetail(tx)}
							>
								Detail
							</button>
							<button
								type="button"
								className="px-2 py-1 text-[11px] text-[#252925] font-semibold hover:bg-[#f3f7f3] rounded transition-colors"
								onClick={() => onEdit(tx)}
							>
								Edit Data
							</button>
							<button
								type="button"
								className="px-2 py-1 text-[11px] text-[#a65f5b] font-semibold hover:bg-[#f7e9e8] rounded transition-colors"
								onClick={() => onDelete(tx)}
							>
								Hapus
							</button>
						</div>
					);
				},
			},
		],
		[onDetail, onEdit, onDelete],
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			pagination,
		},
		onPaginationChange: setPagination,
	});

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925]">
						History Transaksi
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Seluruh mutasi pemasukan dan pengeluaran kos tercatat lengkap.
					</p>
				</div>

				{/* Filter Toolbar Segmented Container */}
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setTxSortDate(!txSortDate)}
						className={`h-8 px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
							txSortDate
								? "bg-[#e8f0ea] text-[#4f6958] border-[#4f6958]/30 shadow-sm"
								: "bg-white text-[#737873] border-[#e4e9e4] hover:bg-[#f3f7f3]"
						}`}
					>
						<ArrowDownUp className="w-3 h-3" />
						<span>Urutkan tanggal</span>
					</button>

					{/* Segmented Button Group */}
					<div className="flex items-center p-1 bg-[#f0f4f0] border border-[#e4e9e4] rounded-xl gap-1">
						<button
							type="button"
							onClick={() => {
								setTxFilter("all");
								setPagination((p) => ({ ...p, pageIndex: 0 }));
							}}
							className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
								txFilter === "all"
									? "bg-white text-[#252925] font-bold shadow-sm border border-[#d5dfd6]"
									: "text-[#737873] hover:text-[#252925]"
							}`}
						>
							Semua
						</button>

						<button
							type="button"
							onClick={() => {
								setTxFilter("Income");
								setPagination((p) => ({ ...p, pageIndex: 0 }));
							}}
							className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
								txFilter === "Income"
									? "bg-white text-[#568062] font-bold shadow-sm border border-[#d5dfd6]"
									: "text-[#737873] hover:text-[#568062]"
							}`}
						>
							Pemasukan
						</button>

						<button
							type="button"
							onClick={() => {
								setTxFilter("Expense");
								setPagination((p) => ({ ...p, pageIndex: 0 }));
							}}
							className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
								txFilter === "Expense"
									? "bg-white text-[#a65f5b] font-bold shadow-sm border border-[#d5dfd6]"
									: "text-[#737873] hover:text-[#a65f5b]"
							}`}
						>
							Pengeluaran
						</button>
					</div>
				</div>
			</div>

			{/* Search Toolbar */}
			<div className="py-3">
				<div className="relative max-w-sm">
					<Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#737873]" />
					<input
						type="text"
						placeholder="Cari nama pembayaran, deskripsi, atau kost..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setPagination((p) => ({ ...p, pageIndex: 0 }));
						}}
						className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e4e9e4] rounded-lg bg-[#fbfcfb] outline-none focus:border-[#8fa594]"
					/>
				</div>
			</div>

			{/* TanStack Table Container */}
			<div className="border border-[#e4e9e4] rounded-lg overflow-hidden">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="bg-[#f3f7f3] border-b border-[#e4e9e4] text-[#737873] text-[11px]"
							>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="py-2.5 px-3 font-semibold">
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
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="hover:bg-[#fbfcfb] transition-colors">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="py-3 px-3">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}

						{table.getRowModel().rows.length === 0 && (
							<tr>
								<td
									colSpan={columns.length}
									className="py-8 text-center text-xs text-[#737873]"
								>
									Tidak ada transaksi yang cocok dengan filter atau pencarian.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			{table.getPageCount() > 1 && (
				<div className="flex justify-between items-center mt-4 text-xs text-[#737873]">
					<span>
						Menampilkan {table.getRowModel().rows.length} dari{" "}
						{filteredData.length} transaksi
					</span>
					<div className="flex gap-1.5">
						<button
							type="button"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							className="px-2.5 py-1 rounded-lg border border-[#e4e9e4] disabled:opacity-40 hover:bg-[#f3f7f3] font-medium"
						>
							Sebelumnya
						</button>
						{Array.from({ length: table.getPageCount() }, (_, i) => i).map(
							(pageIdx) => (
								<button
									key={pageIdx}
									type="button"
									onClick={() => table.setPageIndex(pageIdx)}
									className={`w-7 h-7 rounded-lg font-semibold border ${
										pageIdx === table.getState().pagination.pageIndex
											? "bg-[#4f6958] text-white border-[#4f6958]"
											: "bg-white text-[#737873] border-[#e4e9e4] hover:bg-[#f3f7f3]"
									}`}
								>
									{pageIdx + 1}
								</button>
							),
						)}
						<button
							type="button"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							className="px-2.5 py-1 rounded-lg border border-[#e4e9e4] disabled:opacity-40 hover:bg-[#f3f7f3] font-medium"
						>
							Berikutnya
						</button>
					</div>
				</div>
			)}
		</Card>
	);
}
