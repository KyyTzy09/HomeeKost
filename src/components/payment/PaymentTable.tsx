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
	CheckCircle2,
	Clock,
	ExternalLink,
	MessageCircle,
	Plus,
	Search,
	Send,
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
import type { PaymentItem, PaymentStatus } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

export const PAYMENT_STATUS_OPTIONS = [
	{ label: "Semua Status", value: "ALL" },
	{ label: "Menunggu Bayar", value: "PENDING" },
	{ label: "Sudah Bayar (Lunas)", value: "PAID" },
	{ label: "Jatuh Tempo / Terlambat", value: "OVERDUE" },
];

interface PaymentTableProps {
	payments: PaymentItem[];
	totalCount?: number;
	currentPage?: number;
	totalPages?: number;
	pageSize?: number;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	statusFilter: string;
	onStatusFilterChange: (status: string) => void;
	sortBy: "dueDate" | "amount" | "createdAt";
	sortOrder: "asc" | "desc";
	onSortToggle: (sortBy: "dueDate" | "amount" | "createdAt") => void;
	onPageChange: (page: number) => void;
	isLoading?: boolean;
	onAddNew?: () => void;
	onGenerateMonthly?: () => void;
	onConfirmPayment: (payment: PaymentItem) => void;
	onSendWhatsApp: (payment: PaymentItem) => void;
	onDelete: (payment: PaymentItem) => void;
	isSendingWhatsApp?: boolean;
}

const columnHelper = createColumnHelper<PaymentItem>();

export function PaymentTable({
	payments,
	totalCount = 0,
	currentPage = 1,
	totalPages = 1,
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	sortBy,
	sortOrder,
	onSortToggle,
	onPageChange,
	isLoading = false,
	onAddNew,
	onGenerateMonthly,
	onConfirmPayment,
	onSendWhatsApp,
	onDelete,
	isSendingWhatsApp = false,
}: PaymentTableProps) {
	const columns = useMemo(
		() => [
			columnHelper.accessor("invoiceNumber", {
				id: "invoiceNumber",
				header: () => "No. Invoice & Kamar",
				cell: (info) => {
					const item = info.row.original;
					return (
						<div>
							<span className="font-bold text-[#252925] text-xs block">
								{info.getValue()}
							</span>
							<span className="text-[11px] text-[#737873] block mt-0.5">
								Kamar <b className="text-[#4f6958]">{item.roomNumber}</b> ·{" "}
								{item.propertyName}
							</span>
						</div>
					);
				},
			}),
			columnHelper.accessor("tenantName", {
				id: "tenantName",
				header: () => "Nama Penghuni",
				cell: (info) => {
					const item = info.row.original;
					return (
						<div>
							<span className="font-semibold text-[#252925] text-xs block">
								{info.getValue()}
							</span>
							{item.tenantPhone && (
								<div className="flex items-center gap-1 mt-0.5">
									<span className="text-[11px] text-[#737873]">
										{item.tenantPhone}
									</span>
									<a
										href={item.directWhatsAppUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center text-[10px] text-[#568062] hover:underline"
										title="Buka Chat WhatsApp Web"
									>
										<ExternalLink className="w-2.5 h-2.5 ml-0.5" />
									</a>
								</div>
							)}
						</div>
					);
				},
			}),
			columnHelper.accessor("period", {
				id: "period",
				header: () => "Periode",
				cell: (info) => (
					<span className="text-xs text-[#252925] font-medium whitespace-nowrap">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("dueDate", {
				id: "dueDate",
				header: () => (
					<button
						type="button"
						onClick={() => onSortToggle("dueDate")}
						className="flex items-center gap-1.5 hover:text-[#252925] transition-colors"
					>
						<span>Jatuh Tempo</span>
						{sortBy === "dueDate" ? (
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
				cell: (info) => {
					const item = info.row.original;
					const badge = item.dueStatusBadge;

					let badgeStyle = "bg-[#f3f7f3] text-[#4f6958]";
					if (badge.variant === "green") {
						badgeStyle = "bg-[#e8f2ea] text-[#568062]";
					} else if (badge.variant === "amber") {
						badgeStyle = "bg-[#fbf4e6] text-[#b18a4b]";
					} else if (badge.variant === "red") {
						badgeStyle = "bg-[#f7e9e8] text-[#a65f5b]";
					}

					return (
						<div>
							<span className="text-xs font-semibold text-[#252925] block whitespace-nowrap">
								{info.getValue()}
							</span>
							<span
								className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${badgeStyle}`}
							>
								{badge.text}
							</span>
						</div>
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
				cell: (info) => (
					<div className="text-xs font-bold text-right text-[#252925] whitespace-nowrap">
						{formatRupiah(info.getValue())}
					</div>
				),
			}),
			columnHelper.accessor("status", {
				id: "status",
				header: () => "Status",
				cell: (info) => {
					const status = info.getValue() as PaymentStatus;
					if (status === "PAID") {
						return (
							<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#e8f2ea] text-[#568062] whitespace-nowrap">
								<CheckCircle2 className="w-3 h-3" />
								Lunas
							</span>
						);
					}
					if (status === "OVERDUE") {
						return (
							<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f7e9e8] text-[#a65f5b] whitespace-nowrap">
								<Clock className="w-3 h-3" />
								Terlambat
							</span>
						);
					}
					return (
						<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fbf4e6] text-[#b18a4b] whitespace-nowrap">
							<Clock className="w-3 h-3" />
							Menunggu
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: () => <div className="text-right">Aksi & WhatsApp</div>,
				cell: ({ row }) => {
					const item = row.original;
					const isPaid = item.status === "PAID";

					return (
						<div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
							{/* Tombol Verifikasi Bayar jika belum lunas */}
							{!isPaid && (
								<Button
									type="button"
									size="sm"
									onClick={() => onConfirmPayment(item)}
									className="h-7.5 px-2.5 text-[11px] font-semibold bg-[#4f6958] hover:bg-[#425949] text-white shadow-xs rounded-lg"
								>
									<CheckCircle2 className="w-3 h-3 mr-1" />
									Verifikasi Bayar
								</Button>
							)}

							{/* Tombol Kirim Tagihan / Kwitansi via Fonnte WA */}
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={isSendingWhatsApp}
								onClick={() => onSendWhatsApp(item)}
								className="h-7.5 px-2.5 text-[11px] font-semibold border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f0ea] shadow-xs rounded-lg"
								title="Kirim Pesan WhatsApp Otomatis via Fonnte API"
							>
								<Send className="w-3 h-3 mr-1 text-[#568062]" />
								{isPaid ? "Kirim Kwitansi WA" : "Kirim WA"}
							</Button>

							{/* Tombol Direct Link wa.me */}
							<a
								href={item.directWhatsAppUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center w-7.5 h-7.5 rounded-lg border border-[#e4e9e4] text-[#568062] hover:bg-[#e8f0ea] transition-colors"
								title="Buka di WhatsApp Web / App (Manual)"
							>
								<MessageCircle className="w-3.5 h-3.5" />
							</a>

							{/* Tombol Hapus jika belum lunas */}
							{!isPaid && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => onDelete(item)}
									className="w-7.5 h-7.5 text-[#737873] hover:text-[#a65f5b] hover:bg-[#f7e9e8] rounded-lg"
									title="Hapus Tagihan"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</Button>
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
			onConfirmPayment,
			onSendWhatsApp,
			onDelete,
			isSendingWhatsApp,
		],
	);

	const table = useReactTable({
		data: payments,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualSorting: true,
		manualPagination: true,
	});

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* ─── Header & Action Buttons ──────────────────────────────────── */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e4e9e4]">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-bold text-[#252925]">
							Daftar Tagihan & Pelunasan Sewa
						</h2>
						<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f0ea] text-[#4f6958]">
							{totalCount} Tagihan
						</span>
					</div>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Pantau jatuh tempo sewa, verifikasi bukti bayar, dan kirim tagihan
						otomatis ke WhatsApp anak kos
					</p>
				</div>

				<div className="flex items-center gap-2">
					{onGenerateMonthly && (
						<Button
							type="button"
							variant="outline"
							onClick={onGenerateMonthly}
							className="h-8.5 px-3 text-xs font-semibold border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f0ea] shadow-xs rounded-lg"
						>
							<Clock className="w-3.5 h-3.5 mr-1.5 text-[#568062]" />
							Generate Tagihan Bulanan
						</Button>
					)}

					{onAddNew && (
						<Button
							type="button"
							onClick={onAddNew}
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-3.5 h-8.5 rounded-lg shadow-sm"
						>
							<Plus className="w-3.5 h-3.5 mr-1.5" />
							Buat Tagihan Manual
						</Button>
					)}
				</div>
			</div>

			{/* ─── Filters & Search Toolbar ─────────────────────────────────── */}
			<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-4">
				{/* Search Bar */}
				<div className="sm:col-span-8 relative">
					<Search className="w-3.5 h-3.5 text-[#737873] absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Cari nama penghuni, no. kamar, no. invoice, atau no. telepon..."
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

				{/* Status Filter */}
				<div className="sm:col-span-4">
					<Select
						value={statusFilter}
						onValueChange={(val) => {
							if (val) onStatusFilterChange(val);
						}}
					>
						<SelectTrigger className="h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] w-full">
							<SelectValue placeholder="Pilih Status Tagihan" />
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							{PAYMENT_STATUS_OPTIONS.map((opt) => (
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
										<div className="w-4 h-4 border-2 border-[#4f6958] border-t-transparent rounded-full animate-spin" />
										<span>Memuat daftar tagihan...</span>
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-8 text-center text-xs text-[#737873]"
								>
									Belum ada catatan tagihan sewa yang sesuai dengan filter.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="hover:bg-[#fbfcfb] transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="py-3 px-3.5 text-xs text-[#252925]"
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
					total tagihan)
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
