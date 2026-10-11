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

export interface PaymentFilterOption {
	label: string;
	value: string;
}

export interface PeriodFilterOption {
	label: string;
	value: string;
}

export const PAYMENT_STATUS_OPTIONS: PaymentFilterOption[] = [
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
	statusFilter: PaymentFilterOption;
	onStatusFilterChange: (status: PaymentFilterOption) => void;
	periodFilter?: string;
	onPeriodFilterChange?: (period: string) => void;
	periodOptions?: PeriodFilterOption[];
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
	periodFilter,
	onPeriodFilterChange,
	periodOptions = [],
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
				cell: (info) => {
					const item = info.row.original;
					return (
						<div>
							<span className="text-xs text-[#252925] font-medium block whitespace-nowrap">
								{info.getValue()}
							</span>
							<span className="text-[10.5px] text-[#737873] block mt-0.5 whitespace-nowrap">
								{item.status === "PAID"
									? `Lunas: ${item.paidAt || item.dueDate}`
									: `Tenggat: ${item.dueDate}`}
							</span>
						</div>
					);
				},
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
					return (
						<div>
							<span className="text-xs text-[#252925] font-medium block whitespace-nowrap">
								{info.getValue()}
							</span>
							{item.dueStatusBadge?.text && (
								<span
									className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
										item.dueStatusBadge.variant === "red"
											? "bg-[#fdf0ed] text-[#b8382e]"
											: item.dueStatusBadge.variant === "green"
												? "bg-[#e8f0ea] text-[#4f6958]"
												: "bg-[#fbf4ea] text-[#99773d]"
									}`}
								>
									{item.dueStatusBadge.text}
								</span>
							)}
						</div>
					);
				},
			}),
			columnHelper.accessor("amount", {
				id: "amount",
				header: () => (
					<button
						type="button"
						onClick={() => onSortToggle("amount")}
						className="flex items-center gap-1.5 hover:text-[#252925] transition-colors ml-auto"
					>
						<span>Total Tagihan</span>
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
				),
				cell: (info) => {
					const item = info.row.original;
					return (
						<div className="text-right">
							<span className="text-xs font-bold text-[#252925] whitespace-nowrap font-mono">
								{formatRupiah(info.getValue())}
							</span>
							{item.isPartial && item.remainingAmount !== undefined && (
								<span className="text-[10px] text-[#737873] block mt-0.5 whitespace-nowrap">
									Terbayar:{" "}
									<b className="text-[#4f6958]">
										{formatRupiah(item.paidAmount || 0)}
									</b>{" "}
									· Sisa:{" "}
									<b className="text-[#99773d]">
										{formatRupiah(item.remainingAmount)}
									</b>
								</span>
							)}
						</div>
					);
				},
			}),
			columnHelper.accessor("status", {
				id: "status",
				header: () => "Status Pembayaran",
				cell: (info) => {
					const status = info.getValue() as PaymentStatus;
					const badgeColors: Record<PaymentStatus, string> = {
						PAID: "bg-[#e8f0ea] text-[#4f6958] border-[#c8dacb]",
						PARTIAL: "bg-[#fbf4ea] text-[#99773d] border-[#ebd8bc]",
						PENDING: "bg-[#fbf4ea] text-[#99773d] border-[#ebd8bc]",
						OVERDUE: "bg-[#fdf0ed] text-[#b8382e] border-[#f5c6c2]",
						CANCELLED: "bg-[#f0f2f0] text-[#737873] border-[#d6dfd7]",
					};
					const statusLabels: Record<PaymentStatus, string> = {
						PAID: "✓ Lunas",
						PARTIAL: "🌓 Dicicil",
						PENDING: "⏳ Menunggu",
						OVERDUE: "⚠️ Terlambat",
						CANCELLED: "✕ Dibatalkan",
					};

					return (
						<span
							className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badgeColors[status] || badgeColors.PENDING}`}
						>
							{statusLabels[status] || status}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: () => <div className="text-right">Aksi Cepat</div>,
				cell: (info) => {
					const item = info.row.original;
					const isPaid = item.status === "PAID";

					return (
						<div className="flex items-center justify-end gap-1.5">
							{/* Konfirmasi Pembayaran Lunas / Catat Cicilan */}
							{!isPaid ? (
								<Button
									type="button"
									size="sm"
									className={`h-7 px-2.5 text-[11px] font-semibold text-white shadow-2xs rounded-lg ${
										item.isPartial
											? "bg-[#99773d] hover:bg-[#856633]"
											: "bg-[#4f6958] hover:bg-[#425949]"
									}`}
									onClick={() => onConfirmPayment(item)}
									title={
										item.isPartial
											? "Catat Cicilan Lanjutan atau Pelunasan"
											: "Verifikasi Pembayaran & Tandai Lunas"
									}
								>
									<CheckCircle2 className="w-3 h-3 mr-1" />
									{item.isPartial ? "Catat Cicilan" : "Konfirmasi"}
								</Button>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 px-2.5 text-[11px] font-semibold text-[#4f6958] border-[#c8dacb] bg-[#f5f9f6] rounded-lg"
									onClick={() => onSendWhatsApp(item)}
									title="Kirim Ulang Kwitansi Lunas via WhatsApp"
									disabled={isSendingWhatsApp}
								>
									<MessageCircle className="w-3 h-3 mr-1 text-[#568062]" />
									Kwitansi
								</Button>
							)}

							{/* Kirim Pengingat / Tagihan WhatsApp */}
							{!isPaid && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 px-2.5 text-[11px] font-semibold text-[#568062] border-[#e4e9e4] hover:bg-[#e8f0ea] rounded-lg"
									onClick={() => onSendWhatsApp(item)}
									title={
										item.isPartial
											? "Kirim Pengingat Sisa Cicilan ke WhatsApp Penghuni"
											: "Kirim Pesan Penagihan ke WhatsApp Penghuni"
									}
									disabled={isSendingWhatsApp}
								>
									<Send className="w-3 h-3 mr-1" />
									{item.isPartial ? "Ingatkan Sisa" : "Kirim WA"}
								</Button>
							)}

							{/* Hapus Tagihan */}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="w-7 h-7 text-[#737873] hover:text-[#a65f5b] hover:bg-[#f7e9e8] rounded-lg"
								onClick={() => onDelete(item)}
								title="Hapus Tagihan"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
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
				<div className="sm:col-span-6 relative">
					<Search className="w-3.5 h-3.5 text-[#737873] absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Cari nama penghuni, no. kamar, no. invoice..."
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

				{/* Period Filter */}
				<div className="sm:col-span-3">
					<Select
						value={periodFilter}
						onValueChange={(val) => {
							if (val) onPeriodFilterChange?.(val);
						}}
					>
						<SelectTrigger className="w-full h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
							<SelectValue placeholder="Semua Periode">
								{periodOptions.find((opt) => opt.value === periodFilter)
									?.label || "Semua Periode"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs max-h-56">
							{periodOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Status Filter */}
				<div className="sm:col-span-3">
					<Select
						value={statusFilter.value}
						onValueChange={(val) => {
							const matched = PAYMENT_STATUS_OPTIONS.find(
								(opt) => opt.value === val,
							);
							if (matched) onStatusFilterChange(matched);
						}}
					>
						<SelectTrigger className="w-full h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
							<SelectValue placeholder="Semua Status">
								{statusFilter.label}
							</SelectValue>
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
									className="py-12 text-center text-xs text-[#737873]"
								>
									<div className="flex items-center justify-center gap-2">
										<div className="w-4 h-4 border-2 border-[#4f6958] border-t-transparent rounded-full animate-spin" />
										<span>Memuat daftar tagihan & riwayat pembayaran...</span>
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-12 text-center text-xs text-[#737873]"
								>
									Tidak ada tagihan atau pembayaran yang sesuai dengan kriteria
									pencarian.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="hover:bg-[#fbfcfb] transition-colors border-b border-[#edf0ed]"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="py-3 px-3.5">
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

			{/* ─── Pagination Controls ──────────────────────────────────────── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 text-xs text-[#737873]">
				<div>
					Menampilkan <b>{payments.length}</b> dari <b>{totalCount}</b> data
					tagihan
				</div>

				<div className="flex items-center gap-1.5 self-end sm:self-auto">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onPageChange(Math.max(1, currentPage - 1))}
						disabled={currentPage <= 1 || isLoading}
						className="h-8 text-xs border-[#e4e9e4] hover:bg-[#f3f7f3]"
					>
						Sebelumnya
					</Button>
					<span className="px-2 font-medium">
						{currentPage} / {totalPages || 1}
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage >= totalPages || isLoading}
						className="h-8 text-xs border-[#e4e9e4] hover:bg-[#f3f7f3]"
					>
						Selanjutnya
					</Button>
				</div>
			</div>
		</Card>
	);
}
