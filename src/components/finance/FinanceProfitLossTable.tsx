import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { FileSpreadsheet, Info } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
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
import type { ProfitLossRow } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

export const MONTH_NAMES_ID = [
	{ label: "Januari", value: 1 },
	{ label: "Februari", value: 2 },
	{ label: "Maret", value: 3 },
	{ label: "April", value: 4 },
	{ label: "Mei", value: 5 },
	{ label: "Juni", value: 6 },
	{ label: "Juli", value: 7 },
	{ label: "Agustus", value: 8 },
	{ label: "September", value: 9 },
	{ label: "Oktober", value: 10 },
	{ label: "November", value: 11 },
	{ label: "Desember", value: 12 },
];

interface DateOption {
	label: string;
	value: number;
}

interface FinanceProfitLossTableProps {
	selectedMonth: DateOption;
	selectedYear: DateOption;
	onMonthChange: (value: DateOption) => void;
	onYearChange: (value: DateOption) => void;
	data: ProfitLossRow[];
	isLoading?: boolean;
	onExportCsv?: () => void;
	isExporting?: boolean;
	propertyName?: string;
}

const columnHelper = createColumnHelper<ProfitLossRow>();

export function FinanceProfitLossTable({
	selectedMonth,
	selectedYear,
	onMonthChange,
	onYearChange,
	data,
	isLoading = false,
	onExportCsv,
	isExporting = false,
	propertyName,
}: FinanceProfitLossTableProps) {
	const currentYear = new Date().getFullYear();
	const yearOptions: DateOption[] = [
		{ label: String(currentYear - 2), value: currentYear - 2 },
		{ label: String(currentYear - 1), value: currentYear - 1 },
		{ label: String(currentYear), value: currentYear },
		{ label: String(currentYear + 1), value: currentYear + 1 },
	];

	const columns = useMemo(
		() => [
			columnHelper.accessor("account", {
				id: "account",
				header: () => "Pos Akun Keuangan",
				cell: (info) => {
					const row = info.row.original;
					const isSub = row.isSubItem;
					const isProfit = row.isProfit;
					const isTotal = row.isTotal;

					return (
						<div
							className={`flex items-center gap-1.5 ${isSub
									? "pl-5 text-[#4c524d]"
									: isProfit
										? "text-[#252925] font-bold text-sm"
										: isTotal
											? "text-[#252925] font-bold text-xs"
											: "text-[#252925]"
								}`}
						>
							{isSub && <span className="text-[#8fa594]">↳</span>}
							<span>{info.getValue()}</span>
						</div>
					);
				},
			}),
			columnHelper.accessor("period", {
				id: "period",
				header: () => "Periode",
				cell: (info) => (
					<span className="text-xs text-[#737873] whitespace-nowrap">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("amount", {
				id: "amount",
				header: () => <div className="text-right">Jumlah (Rp)</div>,
				cell: (info) => {
					const row = info.row.original;
					const isProfit = row.isProfit;
					const isTotal = row.isTotal;

					return (
						<div
							className={`text-xs text-right whitespace-nowrap tabular-nums ${
								isProfit
									? "text-[#568062] font-bold text-sm"
									: isTotal
										? "text-[#252925] font-bold"
										: "text-[#4c524d] font-medium"
							}`}
						>
							{formatRupiah(info.getValue())}
						</div>
					);
				},
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
			{/* ─── Header & Period Selector ─────────────────────────────────── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e4e9e4]">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-bold text-[#252925]">
							Laporan Laba Rugi (P&L Statement)
						</h2>
						{propertyName && (
							<span className="text-[10.5px] font-semibold text-[#4f6958] bg-[#eef3ee] px-2 py-0.5 rounded-md border border-[#d6dfd7]">
								{propertyName}
							</span>
						)}
					</div>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Rekapitulasi pendapatan sewa, pengeluaran operasional & investasi,
						serta laba bersih
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={String(selectedMonth.value)}
						onValueChange={(val) => {
							const matched = MONTH_NAMES_ID.find(
								(m) => String(m.value) === val,
							);
							if (matched) onMonthChange(matched);
						}}
					>
						<SelectTrigger className="w-[125px] h-8.5 text-xs bg-[#fbfcfb] border-[#e4e9e4]">
							<SelectValue placeholder="Pilih Bulan">
								{selectedMonth.label}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							{MONTH_NAMES_ID.map((m) => (
								<SelectItem
									key={m.value}
									value={String(m.value)}
									disabled={m.value > new Date().getMonth() + 1 && selectedYear.value === new Date().getFullYear()}
								>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={String(selectedYear.value)}
						onValueChange={(val) => {
							const matched = yearOptions.find((y) => String(y.value) === val);
							if (matched) onYearChange(matched);
						}}
					>
						<SelectTrigger className="w-[95px] h-8.5 text-xs bg-[#fbfcfb] border-[#e4e9e4]">
							<SelectValue placeholder="Tahun">
								{selectedYear.label}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-white border-[#e4e9e4] text-xs">
							{yearOptions.map((y) => (
								<SelectItem
									key={y.value}
									value={String(y.value)}
									disabled={y.value > new Date().getFullYear()}
								>
									{y.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{onExportCsv && (
						<Button
							type="button"
							variant="outline"
							onClick={onExportCsv}
							disabled={isExporting}
							className="h-8.5 text-xs font-semibold px-3 border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f0ea]"
						>
							<FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-[#568062]" />
							{isExporting ? "Mengunduh..." : "Ekspor CSV 12 Bulan"}
						</Button>
					)}
				</div>
			</div>

			{/* ─── TanStack Table View ──────────────────────────────────────── */}
			<div className="overflow-hidden mt-4 border border-[#e4e9e4] rounded-xl">
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
										className="text-[11px] font-semibold text-[#4f6958] py-2.5 px-4"
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
										<span>Menghitung laporan laba rugi...</span>
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-8 text-center text-xs text-[#737873]"
								>
									Tidak ada data transaksi pada periode yang dipilih.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => {
								const original = row.original;
								const isHeaderTotal = original.isTotal;
								const isProfitRow = original.isProfit;

								let rowBg = "bg-white hover:bg-[#fbfcfb]";
								if (isProfitRow)
									rowBg = "bg-[#f3f7f3] font-bold hover:bg-[#edf5ee]";
								else if (isHeaderTotal)
									rowBg = "bg-[#faf9f5] font-semibold hover:bg-[#f4f2ec]";

								return (
									<TableRow
										key={row.id}
										className={`${rowBg} transition-colors border-b border-[#edf0ed]`}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className="py-2.5 px-4 text-xs text-[#252925]"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center gap-2 mt-3 text-[11px] text-[#737873]">
				<Info className="w-3.5 h-3.5 text-[#8fa594] shrink-0" />
				<span>
					Kalkulasi laba rugi dihitung otomatis dari seluruh transaksi sewa dan
					operasional yang telah diverifikasi di database.
				</span>
			</div>
		</Card>
	);
}
