import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowDownUp,
	ArrowUp,
	Eye,
	Loader2,
	Pencil,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../common/shadcn/table.tsx";
import type { TransactionItem } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

const CATEGORY_FILTER_OPTIONS = [
	{ label: "Semua Kategori", value: "all" },
	{ label: "Sewa Kamar", value: "RENT" },
	{ label: "Listrik & Air", value: "UTILITIES" },
	{ label: "WiFi / Internet", value: "INTERNET" },
	{ label: "Perbaikan & Maintenance", value: "MAINTENANCE" },
	{ label: "Gaji & Kebersihan", value: "SALARY" },
	{ label: "Lain-lain", value: "OTHER" },
];

const TYPES_LIST = [
	{ label: "Semua Jenis", value: "ALL" },
	{ label: "Pemasukan", value: "INCOME" },
	{ label: "Pengeluaran", value: "EXPENSE" },
];

interface FilterOption {
	label: string;
	value: string;
}

interface FinanceTransactionTableProps {
	transactions: TransactionItem[];
	totalCount?: number;
	currentPage?: number;
	totalPages?: number;
	pageSize?: number;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	typeFilter: FilterOption;
	onTypeFilterChange: (value: FilterOption) => void;
	categoryFilter: FilterOption;
	onCategoryFilterChange: (value: FilterOption) => void;
	sortBy: "transactionDate" | "amount";
	sortOrder: "asc" | "desc";
	onSortToggle: (sortBy: "transactionDate" | "amount") => void;
	onPageChange: (page: number) => void;
	isLoading?: boolean;
	onAddNew?: () => void;
	onDetail: (tx: TransactionItem) => void;
	onEdit: (tx: TransactionItem) => void;
	onDelete: (tx: TransactionItem) => void;
	currentUserId?: string;
	isSuperAdmin?: boolean;
}

const columnHelper = createColumnHelper<TransactionItem>();

export function FinanceTransactionTable({
	transactions,
	totalCount = 0,
	currentPage = 1,
	totalPages = 1,
	searchQuery,
	onSearchChange,
	typeFilter,
	onTypeFilterChange,
	categoryFilter,
	onCategoryFilterChange,
	sortBy,
	sortOrder,
	onSortToggle,
	onPageChange,
	isLoading = false,
	onAddNew,
	onDetail,
	onEdit,
	onDelete,
	currentUserId,
	isSuperAdmin = false,
}: FinanceTransactionTableProps) {
	const canModify = (tx: TransactionItem) => {
		if (isSuperAdmin) return true;
		return tx.createdBy === currentUserId;
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor("date", {
				id: "date",
				header: () => (
					<button
						type="button"
						onClick={() => onSortToggle("transactionDate")}
						className="flex items-center gap-1.5 hover:text-[#252925] transition-colors"
					>
						<span>Tanggal</span>
						{sortBy === "transactionDate" ? (
							sortOrder === "asc" ? (
								<ArrowUp className="w-3 h-3 text-[#4f6958]" />
							) : (
								<ArrowDown className="w-3 h-3 text-[#4f6958]" />
							)
						) : (
							<ArrowDownUp className="w-3 h-3 text-[#8fa594]" />
						)}
					</button>
				),
				cell: (info) => (
					<span className="text-xs text-[#737873] whitespace-nowrap">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("propertyName", {
				id: "propertyName",
				header: () => "Kost",
				cell: (info) => (
					<span className="text-xs font-semibold text-[#252925] whitespace-nowrap">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("category", {
				id: "category",
				header: () => "Kategori",
				cell: (info) => (
					<span className="inline-block px-2 py-0.5 rounded-md bg-[#f3f7f3] text-[#4f6958] text-[11px] font-medium whitespace-nowrap">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("description", {
				id: "description",
				header: () => "Keterangan",
				cell: (info) => (
					<span
						className="text-xs font-medium text-[#252925] block max-w-[240px] truncate"
						title={info.getValue()}
					>
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("type", {
				id: "type",
				header: () => "Jenis",
				cell: (info) => {
					const isIncome = info.getValue() === "Income";
					return (
						<span
							className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
								isIncome
									? "bg-[#e8f2ea] text-[#568062]"
									: "bg-[#f7e9e8] text-[#a65f5b]"
							}`}
						>
							{isIncome ? "Pemasukan" : "Pengeluaran"}
						</span>
					);
				},
			}),
			columnHelper.accessor("amount", {
				id: "amount",
				header: () => (
					<div className="flex justify-end w-full">
						<button
							type="button"
							onClick={() => onSortToggle("amount")}
							className="flex items-center gap-1.5 hover:text-[#252925] transition-colors"
						>
							<span>Nominal</span>
							{sortBy === "amount" ? (
								sortOrder === "asc" ? (
									<ArrowUp className="w-3 h-3 text-[#4f6958]" />
								) : (
									<ArrowDown className="w-3 h-3 text-[#4f6958]" />
								)
							) : (
								<ArrowDownUp className="w-3 h-3 text-[#8fa594]" />
							)}
						</button>
					</div>
				),
				cell: (info) => {
					const tx = info.row.original;
					const isIncome = tx.type === "Income";
					return (
						<div
							className={`text-xs font-bold text-right whitespace-nowrap ${
								isIncome ? "text-[#568062]" : "text-[#a65f5b]"
							}`}
						>
							{isIncome ? "+" : "-"} {formatRupiah(info.getValue())}
						</div>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: () => <div className="text-right">Aksi</div>,
				cell: ({ row }) => {
					const tx = row.original;
					const editable = canModify(tx);

					return (
						<div
							className="flex items-center justify-end gap-1"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							role="group"
						>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="w-7 h-7 text-[#737873] hover:text-[#4f6958] hover:bg-[#e8f0ea]"
								onClick={() => onDetail(tx)}
								title="Lihat Detail"
							>
								<Eye className="w-3.5 h-3.5" />
							</Button>

							{editable && (
								<>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="w-7 h-7 text-[#737873] hover:text-[#4f6958] hover:bg-[#e8f0ea]"
										onClick={() => onEdit(tx)}
										title="Edit Transaksi"
									>
										<Pencil className="w-3.5 h-3.5" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="w-7 h-7 text-[#737873] hover:text-[#a65f5b] hover:bg-[#f7e9e8]"
										onClick={() => onDelete(tx)}
										title="Hapus Transaksi"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</Button>
								</>
							)}
						</div>
					);
				},
			}),
		],
		[
			sortBy,
			sortOrder,
			onSortToggle,
			isSuperAdmin,
			currentUserId,
			onDetail,
			onEdit,
			onDelete,
		],
	);

	const table = useReactTable({
		data: transactions,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualSorting: true,
		manualPagination: true,
	});

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* ─── Header & Controls ────────────────────────────────────────── */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e4e9e4]">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-bold text-[#252925]">
							Riwayat Transaksi Kas
						</h2>
						<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f0ea] text-[#4f6958]">
							{totalCount} Transaksi
						</span>
					</div>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Daftar seluruh arus kas masuk dan keluar per properti dengan
						pencarian dan filter
					</p>
				</div>
			</div>

			{/* ─── Filters & Search Toolbar ─────────────────────────────────── */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 py-4">
				{/* Search Bar */}
				<div className="lg:col-span-5 relative">
					<Search className="w-3.5 h-3.5 text-[#737873] absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Cari transaksi, keterangan, properti, staf..."
						className="pl-8.5 pr-8 h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => onSearchChange("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737873] hover:text-[#252925]"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				{/* Type Filter */}
				<div className="lg:col-span-3">
					<Select
						value={typeFilter.value}
						onValueChange={(val) => {
							const matched = TYPES_LIST.find((o) => o.value === val);
							if (matched) onTypeFilterChange(matched);
						}}
					>
						<SelectTrigger className="h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] w-full">
							<SelectValue placeholder="Semua Jenis">
								{typeFilter.label}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							{TYPES_LIST.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Category Filter */}
				<div className="lg:col-span-4">
					<Select
						value={categoryFilter.value}
						onValueChange={(val) => {
							const matched = CATEGORY_FILTER_OPTIONS.find(
								(o) => o.value === val,
							);
							if (matched) onCategoryFilterChange(matched);
						}}
					>
						<SelectTrigger className="h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] w-full">
							<SelectValue placeholder="Pilih Kategori">
								{categoryFilter.label}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							{CATEGORY_FILTER_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* ─── TanStack Table Grid ──────────────────────────────────────── */}
			<div className="overflow-hidden border border-[#e4e9e4] rounded-xl">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="bg-[#f5f8f5] hover:bg-[#f5f8f5]"
							>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="text-[11px] font-semibold text-[#4f6958] py-2.5 px-3.5"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-8 text-center text-xs text-[#737873]"
								>
									<div className="flex items-center justify-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin text-[#4f6958]" />
										<span>Memuat data transaksi...</span>
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-8 text-center text-xs text-[#737873]"
								>
									<div className="flex items-center justify-center gap-2">
										<span>Belum ada transaksi</span>
									</div>
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="hover:bg-[#fbfcfb] transition-colors cursor-pointer"
									onClick={() => onDetail(row.original)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="py-2.5 px-3.5 text-xs text-[#252925]"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* ─── Pagination Bar ───────────────────────────────────────────── */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#e4e9e4] mt-4">
				<div className="text-[11px] text-[#737873]">
					Menampilkan Halaman <b className="text-[#252925]">{currentPage}</b>{" "}
					dari <b className="text-[#252925]">{totalPages}</b> ({totalCount}{" "}
					total transaksi)
				</div>

				<div className="flex items-center gap-1.5">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={currentPage <= 1 || isLoading}
						onClick={() => onPageChange(currentPage - 1)}
						className="h-8 px-3 text-xs border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f0ea]"
					>
						Sebelumnya
					</Button>
					<div className="px-2 text-xs font-semibold text-[#252925]">
						{currentPage}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={currentPage >= totalPages || isLoading}
						onClick={() => onPageChange(currentPage + 1)}
						className="h-8 px-3 text-xs border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f0ea]"
					>
						Selanjutnya
					</Button>
				</div>
			</div>
		</Card>
	);
}
