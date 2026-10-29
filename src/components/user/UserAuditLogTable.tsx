import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Bot,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock,
	Filter,
	History,
	Search,
	ShieldCheck,
	UserCheck,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import type { AppUserRole, AuditActorRole, AuditLogItem } from "../../common/types/index.ts";

interface UserAuditLogTableProps {
	data: AuditLogItem[];
}

const columnHelper = createColumnHelper<AuditLogItem>();

export function UserAuditLogTable({ data }: UserAuditLogTableProps) {
	const [globalFilter, setGlobalFilter] = useState<string>("");
	const [roleFilter, setRoleFilter] = useState<"ALL" | AuditActorRole>("ALL");
	const [activityTypeFilter, setActivityTypeFilter] = useState<string>("ALL");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "time", desc: true },
	]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	// Filter data by Role & Activity Type before passing to TanStack Table
	const filteredData = useMemo(() => {
		return data.filter((item) => {
			// Role Filter
			if (roleFilter !== "ALL" && item.userRole !== roleFilter) {
				return false;
			}

			// Activity Type Filter
			if (activityTypeFilter !== "ALL") {
				const act = item.activity.toLowerCase();
				if (
					activityTypeFilter === "FINANCE" &&
					!act.includes("kas") &&
					!act.includes("pengeluaran") &&
					!act.includes("pemasukan") &&
					!act.includes("biaya") &&
					!act.includes("gaji")
				) {
					return false;
				}
				if (activityTypeFilter === "PAYMENT" && !act.includes("pembayaran")) {
					return false;
				}
				if (
					activityTypeFilter === "WHATSAPP" &&
					!act.includes("wa") &&
					!act.includes("notifikasi") &&
					!act.includes("broadcast")
				) {
					return false;
				}
				if (
					activityTypeFilter === "MAINTENANCE" &&
					!act.includes("perbaikan") &&
					!act.includes("fasilitas")
				) {
					return false;
				}
			}

			return true;
		});
	}, [data, roleFilter, activityTypeFilter]);

	const getRoleBadge = (role: AuditActorRole) => {
		switch (role) {
			case "SUPER_ADMIN":
				return {
					label: "SuperAdmin",
					className: "bg-[#e8f0ea] text-[#4f6958] border-[#cfe2d3]",
					icon: ShieldCheck,
				};
			case "ADMIN":
				return {
					label: "Admin",
					className: "bg-[#e6f0fa] text-[#2b6cb0] border-[#c2daf2]",
					icon: UserCheck,
				};
			case "SYSTEM":
				return {
					label: "Sistem",
					className: "bg-[#f4f7f4] text-[#55695a] border-[#d8e3d9]",
					icon: Bot,
				};
		}
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor("time", {
				id: "time",
				header: "Waktu Aktivitas",
				enableSorting: true,
				sortingFn: (rowA, rowB) => {
					const timeA = new Date(rowA.original.rawDate || rowA.original.time).getTime() || 0;
					const timeB = new Date(rowB.original.rawDate || rowB.original.time).getTime() || 0;
					return timeA - timeB;
				},
				cell: (info) => (
					<div className="flex items-center gap-1.5 whitespace-nowrap">
						<Clock className="w-3.5 h-3.5 text-[#8a958d] shrink-0" />
						<span className="text-xs font-semibold text-[#252925]">
							{info.getValue()}
						</span>
					</div>
				),
			}),
			columnHelper.accessor("userName", {
				header: "User Pengelola",
				enableSorting: true,
				cell: (info) => (
					<b className="text-xs text-[#252925] whitespace-nowrap">
						{info.getValue()}
					</b>
				),
			}),
			columnHelper.accessor("userRole", {
				header: "Peran (Role)",
				enableSorting: true,
				cell: (info) => {
					const role = info.getValue() as AuditActorRole;
					const badge = getRoleBadge(role);
					const RoleIcon = badge.icon;

					return (
						<span
							className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}
						>
							<RoleIcon className="w-3 h-3" />
							{badge.label}
						</span>
					);
				},
			}),
			columnHelper.accessor("activity", {
				header: "Aktivitas Operasional",
				enableSorting: true,
				cell: (info) => {
					const val = info.getValue();
					const isIncome =
						val.includes("Pemasukan") || val.includes("Pembayaran");
					const isExpense =
						val.includes("Pengeluaran") ||
						val.includes("Biaya") ||
						val.includes("Gaji");
					const isNotif =
						val.includes("WA") ||
						val.includes("Notifikasi") ||
						val.includes("Broadcast");

					const badgeClass = isIncome
						? "bg-[#e8f0ea] text-[#4f6958] border-[#cfe2d3]"
						: isExpense
							? "bg-[#fdf2f2] text-[#9b4a46] border-[#f4d2d1]"
							: isNotif
								? "bg-[#f4f7f4] text-[#4f6958] border-[#dbe6dc]"
								: "bg-[#fbfcfb] text-[#555f57] border-[#e4e9e4]";

					return (
						<span
							className={`inline-block text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${badgeClass}`}
						>
							{val}
						</span>
					);
				},
			}),
			columnHelper.accessor("detail", {
				header: "Detail Perubahan / Catatan",
				enableSorting: true,
				cell: (info) => (
					<span className="text-xs text-[#4c524d] font-medium leading-relaxed">
						{info.getValue()}
					</span>
				),
			}),
		],
		[],
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		state: {
			globalFilter,
			sorting,
			pagination,
		},
		initialState: {
			sorting: [{ id: "time", desc: true }],
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const totalRows = filteredData.length;
	const pageIndex = table.getState().pagination.pageIndex;
	const pageSize = table.getState().pagination.pageSize;
	const totalPages = table.getPageCount();

	const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
	const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

	const resetFilters = () => {
		setGlobalFilter("");
		setRoleFilter("ALL");
		setActivityTypeFilter("ALL");
		setSorting([{ id: "time", desc: true }]);
		table.setPageIndex(0);
	};

	const hasActiveFilters =
		globalFilter !== "" || roleFilter !== "ALL" || activityTypeFilter !== "ALL";

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] rounded-2xl space-y-4">
			{/* Header Title & Description */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<History className="w-4 h-4 text-[#4f6958]" />
						Riwayat Perubahan & Log Audit
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Aktivitas transaksi kas, verifikasi tagihan sewa, dan pengiriman
						otomasi pesan WhatsApp tercatat otomatis.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[11px] font-semibold text-[#4f6958] bg-[#f0f5f1] px-2.5 py-1 rounded-full border border-[#d6dfd7]">
						{totalRows} Total Log Tercatat
					</span>
				</div>
			</div>

			{/* Filter & Search Toolbar */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
				{/* Search Input */}
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a958d] pointer-events-none" />
					<Input
						value={globalFilter ?? ""}
						onChange={(e) => {
							setGlobalFilter(e.target.value);
							table.setPageIndex(0);
						}}
						placeholder="Cari aktivitas, pengelola, detail..."
						className="pl-8 pr-7 h-9 text-xs bg-white border-[#e4e9e4] rounded-lg focus-visible:ring-[#8fa594]/20 focus-visible:border-[#8fa594]"
					/>
					{globalFilter && (
						<button
							type="button"
							onClick={() => {
								setGlobalFilter("");
								table.setPageIndex(0);
							}}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-[#737873] hover:text-[#252925] cursor-pointer"
							aria-label="Bersihkan pencarian"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				{/* Category & Role Filters */}
				<div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
					{/* Activity Category Filter */}
					<Select
						value={activityTypeFilter}
						onValueChange={(val) => {
							if (val) {
								setActivityTypeFilter(val);
								table.setPageIndex(0);
							}
						}}
					>
						<SelectTrigger className="h-9 text-xs w-[170px] bg-white border-[#e4e9e4] rounded-lg">
							<Filter className="w-3.5 h-3.5 mr-1 text-[#737873] shrink-0" />
							<SelectValue>
								{activityTypeFilter === "ALL" && "Semua Aktivitas"}
								{activityTypeFilter === "PAYMENT" && "Pembayaran Sewa"}
								{activityTypeFilter === "FINANCE" && "Keuangan / Kas"}
								{activityTypeFilter === "WHATSAPP" && "Notifikasi WhatsApp"}
								{activityTypeFilter === "MAINTENANCE" && "Perbaikan Fasilitas"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							<SelectItem value="ALL">Semua Aktivitas</SelectItem>
							<SelectItem value="PAYMENT">Pembayaran Sewa</SelectItem>
							<SelectItem value="FINANCE">Keuangan / Kas</SelectItem>
							<SelectItem value="WHATSAPP">Notifikasi WhatsApp</SelectItem>
							<SelectItem value="MAINTENANCE">Perbaikan Fasilitas</SelectItem>
						</SelectContent>
					</Select>

					{/* Role Filter */}
					<Select
						value={roleFilter}
						onValueChange={(val) => {
							if (val) {
								setRoleFilter(val as "ALL" | AuditActorRole);
								table.setPageIndex(0);
							}
						}}
					>
						<SelectTrigger className="h-9 text-xs w-[150px] bg-white border-[#e4e9e4] rounded-lg">
							<SelectValue>
								{roleFilter === "ALL" && "Semua Peran"}
								{roleFilter === "SUPER_ADMIN" && "SuperAdmin"}
								{roleFilter === "ADMIN" && "Admin Kos"}
								{roleFilter === "SYSTEM" && "Sistem"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							<SelectItem value="ALL">Semua Peran</SelectItem>
							<SelectItem value="SUPER_ADMIN">SuperAdmin</SelectItem>
							<SelectItem value="ADMIN">Admin Kos</SelectItem>
							<SelectItem value="SYSTEM">Sistem</SelectItem>
						</SelectContent>
					</Select>

					{/* Reset Filters Button */}
					{hasActiveFilters && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={resetFilters}
							className="h-9 px-2 text-xs text-[#9b4a46] hover:bg-[#fdf2f2] hover:text-[#9b4a46]"
						>
							<X className="w-3.5 h-3.5 mr-1" />
							Reset
						</Button>
					)}
				</div>
			</div>

			{/* TanStack Table Element */}
			<div className="overflow-x-auto rounded-xl border border-[#edf1ed]">
				<table className="w-full text-left border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="border-b border-[#edf1ed] bg-[#fbfcfb]"
							>
								{headerGroup.headers.map((header) => {
									const isSortable = header.column.getCanSort();
									const sortDirection = header.column.getIsSorted();

									return (
										<th
											key={header.id}
											onClick={header.column.getToggleSortingHandler()}
											className={`py-2.5 px-3 text-[11px] font-semibold text-[#575e58] select-none ${
												isSortable ? "cursor-pointer hover:bg-[#f0f5f1]" : ""
											}`}
										>
											<div className="flex items-center gap-1.5">
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
												{isSortable && (
													<span className="text-[#8a958d]">
														{sortDirection === "asc" ? (
															<ArrowUp className="w-3 h-3 text-[#4f6958]" />
														) : sortDirection === "desc" ? (
															<ArrowDown className="w-3 h-3 text-[#4f6958]" />
														) : (
															<ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
														)}
													</span>
												)}
											</div>
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-[#edf1ed] bg-white">
						{table.getRowModel().rows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="py-10 text-center text-xs text-[#737873]"
								>
									<History className="w-7 h-7 text-[#c8d4ca] mx-auto mb-2" />
									<p className="font-semibold text-[#252925]">
										Tidak ada riwayat aktivitas yang cocok
									</p>
									<p className="text-[11px] text-[#8a958d] mt-0.5">
										Coba ubah kata kunci pencarian atau reset filter kategori.
									</p>
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
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
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-[#737873]">
				{/* Row Counts Information */}
				<div className="flex items-center gap-2">
					<span>
						Menampilkan <b>{startRow}</b> – <b>{endRow}</b> dari{" "}
						<b>{totalRows}</b> aktivitas
					</span>
				</div>

				{/* Page Navigation & Page Size Selector */}
				<div className="flex items-center gap-2.5">
					{/* Rows per page selector */}
					<div className="flex items-center gap-1.5">
						<span className="text-[11px]">Baris:</span>
						<Select
							value={String(pageSize)}
							onValueChange={(val) => {
								table.setPageSize(Number(val));
							}}
						>
							<SelectTrigger className="h-8 w-[68px] text-xs bg-white border-[#e4e9e4] rounded-md">
								<SelectValue>{pageSize}</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4] text-xs">
								<SelectItem value="5">5</SelectItem>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="20">20</SelectItem>
								<SelectItem value="50">50</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* First & Prev Page */}
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="h-8 w-8 p-0 border-[#e4e9e4] bg-white hover:bg-[#f3f7f3] disabled:opacity-40"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
							title="Halaman Pertama"
						>
							<ChevronsLeft className="w-3.5 h-3.5 text-[#4f6958]" />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="h-8 w-8 p-0 border-[#e4e9e4] bg-white hover:bg-[#f3f7f3] disabled:opacity-40"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							title="Halaman Sebelumnya"
						>
							<ChevronLeft className="w-3.5 h-3.5 text-[#4f6958]" />
						</Button>

						{/* Page indicator */}
						<span className="px-2.5 text-xs font-semibold text-[#252925]">
							Hal {totalPages === 0 ? 0 : pageIndex + 1} / {totalPages}
						</span>

						{/* Next & Last Page */}
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="h-8 w-8 p-0 border-[#e4e9e4] bg-white hover:bg-[#f3f7f3] disabled:opacity-40"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							title="Halaman Selanjutnya"
						>
							<ChevronRight className="w-3.5 h-3.5 text-[#4f6958]" />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="h-8 w-8 p-0 border-[#e4e9e4] bg-white hover:bg-[#f3f7f3] disabled:opacity-40"
							onClick={() => table.setPageIndex(totalPages - 1)}
							disabled={!table.getCanNextPage()}
							title="Halaman Terakhir"
						>
							<ChevronsRight className="w-3.5 h-3.5 text-[#4f6958]" />
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
}
