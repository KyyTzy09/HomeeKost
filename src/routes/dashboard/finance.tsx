import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowDownRight,
	ArrowUpRight,
	Building2,
	Coins,
	Plus,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MONTH_NAMES_ID } from "#/common/constants/months.const.ts";
import FinanceDeleteDialog from "#/components/finance/FinanceDeleteDialog.tsx";
import {
	useCostComposition,
	useCreateTransaction,
	useDeleteTransaction,
	useExportAnnualCsv,
	useFinancialSummary,
	useProfitLossStatement,
	useRecentMonthlyTrends,
	useTransactions,
	useUpdateTransaction,
} from "#/hooks/use-transactions.ts";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type { TransactionItem } from "../../common/types/index.ts";
import type { TransactionFormValues } from "../../common/validations/index.ts";
import {
	FinanceCostComposition,
	FinanceFormDialog,
	FinanceNetProfitChart,
	FinanceProfitLossTable,
	FinanceTransactionTable,
	TransactionDetailDialog,
} from "../../components/finance/index.ts";
import {
	costCompositionQueryOptions,
	financeTransactionsQueryOptions,
	financialSummaryQueryOptions,
	profitLossStatementQueryOptions,
	propertiesQueryOptions,
	useDashboardContext,
	useProperties,
} from "../../hooks/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

export const Route = createFileRoute("/dashboard/finance")({
	head: () => ({
		meta: [{ title: "Laporan Keuangan & Arus Kas — HomeeKost Management" }],
	}),
	loader: async ({ context }) => {
		const isSuperAdmin = context.dashboard?.isSuperAdmin;
		const activePropertyId = isSuperAdmin
			? undefined
			: context.dashboard?.activeProperty?.id;
		const now = new Date();
		const month = now.getMonth() + 1;
		const year = now.getFullYear();

		await Promise.all([
			context.queryClient.ensureQueryData(
				financialSummaryQueryOptions({
					propertyId: activePropertyId,
					month,
					year,
				}),
			),
			context.queryClient.ensureQueryData(
				costCompositionQueryOptions(activePropertyId, month, year),
			),
			context.queryClient.ensureQueryData(
				profitLossStatementQueryOptions(activePropertyId, month, year),
			),
			context.queryClient.ensureQueryData(
				financeTransactionsQueryOptions({
					propertyId: activePropertyId,
					page: 1,
					limit: 10,
				}),
			),
			context.queryClient.ensureQueryData(propertiesQueryOptions()),
		]);
	},
	component: FinancePage,
});

function FinancePage() {
	const dashboardContext = useDashboardContext();
	const activePropertyId = dashboardContext.activeProperty?.id;
	const isSuperAdmin = dashboardContext.isSuperAdmin;
	const currentUserId = dashboardContext.user?.id;

	const { data: properties = [] } = useProperties();

	const [selectedProperty, setSelectedProperty] = useState<{
		label: string;
		value: string;
	}>({
		label: isSuperAdmin
			? "Semua Cabang Kos (Konsolidasi)"
			: (dashboardContext.activeProperty?.name || "Cabang Ditugaskan"),
		value: isSuperAdmin ? "ALL" : (activePropertyId || ""),
	});

	// Effective Property ID based on RBAC:
	// If SuperAdmin and selected "ALL" -> undefined (consolidated / all properties)
	// If SuperAdmin and selected specific property -> selectedProperty.value
	// If Admin (Branch Manager) -> activePropertyId (only their assigned property)
	const effectivePropertyId = useMemo(() => {
		if (!isSuperAdmin) {
			return activePropertyId;
		}
		return selectedProperty.value === "ALL"
			? undefined
			: selectedProperty.value;
	}, [isSuperAdmin, activePropertyId, selectedProperty.value]);

	const now = new Date();
	const [selectedMonth, setSelectedMonth] = useState<{
		label: string;
		value: number;
	}>({
		label: MONTH_NAMES_ID[now.getMonth()].label,
		value: now.getMonth() + 1,
	});
	const [selectedYear, setSelectedYear] = useState<{
		label: string;
		value: number;
	}>({ label: now.getFullYear().toString(), value: now.getFullYear() });

	// Filter and Sort states
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [typeFilter, setTypeFilter] = useState<{
		label: string;
		value: string;
	}>({ label: "Semua Jenis", value: "ALL" });
	const [categoryFilter, setCategoryFilter] = useState<{
		label: string;
		value: string;
	}>({
		label: "Semua Kategori",
		value: "all",
	});
	const [sortBy, setSortBy] = useState<"transactionDate" | "amount">(
		"transactionDate",
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [currentPage, setCurrentPage] = useState<number>(1);

	// Modal states
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<TransactionItem | null>(null);
	const [detailTransaction, setDetailTransaction] =
		useState<TransactionItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Toast state
	const [toastMsg, setToastMsg] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMsg(msg);
		setTimeout(() => setToastMsg(null), 3500);
	};

	// Queries
	const { data: transactionsData, isLoading: isLoadingTransactions } =
		useTransactions({
			propertyId: effectivePropertyId,
			search: searchQuery,
			type: typeFilter.value as "ALL" | "INCOME" | "EXPENSE",
			category: categoryFilter.value,
			sortBy,
			sortOrder,
			page: currentPage,
			limit: 10,
		});

	const { data: financialSummary, isLoading: isLoadingSummary } =
		useFinancialSummary({
			propertyId: effectivePropertyId,
			month: selectedMonth.value,
			year: selectedYear.value,
		});

	const { data: costComposition = [], isLoading: isLoadingCostComposition } =
		useCostComposition({
			propertyId: effectivePropertyId,
			month: selectedMonth.value,
			year: selectedYear.value,
		});

	const { data: monthlyTrends = [], isLoading: isLoadingTrends } =
		useRecentMonthlyTrends({
			propertyId: effectivePropertyId,
			count: 6,
		});

	const { data: profitLossData = [], isLoading: isLoadingProfitLoss } =
		useProfitLossStatement({
			propertyId: effectivePropertyId,
			month: selectedMonth.value,
			year: selectedYear.value,
		});

	// Mutations
	const createTxMutation = useCreateTransaction();
	const updateTxMutation = useUpdateTransaction();
	const deleteTxMutation = useDeleteTransaction();
	const exportCsvMutation = useExportAnnualCsv();

	// Handlers
	const handleSortToggle = (newSortBy: "transactionDate" | "amount") => {
		if (sortBy === newSortBy) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(newSortBy);
			setSortOrder("desc");
		}
	};

	const handleFormSubmit = async (values: TransactionFormValues) => {
		try {
			if (editingTransaction) {
				await updateTxMutation.mutateAsync({
					id: editingTransaction.id,
					data: values,
				});
				showToast("Transaksi berhasil diperbarui.");
			} else {
				await createTxMutation.mutateAsync(values);
				showToast("Transaksi baru berhasil dicatat.");
			}
			setIsFormOpen(false);
			setEditingTransaction(null);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menyimpan transaksi.");
		}
	};

	const handleDelete = async (tx: TransactionItem) => {
		try {
			await deleteTxMutation.mutateAsync(tx.id);
			showToast("Transaksi berhasil dihapus.");
			setIsDetailOpen(false);
			setDetailTransaction(null);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menghapus transaksi.");
		}
	};

	const handleExportCsv = async () => {
		try {
			const result = await exportCsvMutation.mutateAsync({
				propertyId: effectivePropertyId,
				year: selectedYear.value,
			});

			const blob = new Blob([result.csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.setAttribute("href", url);
			link.setAttribute("download", result.filename);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			showToast(`File ${result.filename} berhasil diunduh.`);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal mengekspor laporan tahunan.");
		}
	};

	return (
		<>
			<FinanceDeleteDialog
				finance={detailTransaction as TransactionItem}
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				onConfirm={() => {
					if (detailTransaction) {
						handleDelete(detailTransaction);
					}
				}}
			/>

			<div className="space-y-6 pb-12">
				{/* Toast Notification Popup */}
				{toastMsg && (
					<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
						<Coins className="w-4 h-4 text-[#8fa594]" />
						<span>{toastMsg}</span>
					</div>
				)}

				{/* ─── Page Header ────────────────────────────────────────────── */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-[11px] font-semibold text-[#4f6958] bg-[#eef3ee] px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-[#d6dfd7]">
								<Building2 className="w-3.5 h-3.5" />
								{isSuperAdmin
									? selectedProperty.label
									: (dashboardContext.activeProperty?.name || "Cabang Ditugaskan")}
							</span>
							<span className="text-[11px] text-[#737873]">
								· {isSuperAdmin ? "SuperAdmin View" : "Admin Cabang"}
							</span>
						</div>
						<h1 className="text-xl sm:text-2xl font-bold text-[#252925] tracking-tight">
							Laporan Keuangan & Arus Kas
						</h1>
						<p className="text-xs text-[#737873] mt-1">
							Pencatatan arus kas masuk, pengeluaran operasional, laba rugi, dan
							transparansi multi-cabang
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						{/* Property Filter Dropdown (SuperAdmin Only) */}
						{isSuperAdmin && properties && properties.length > 0 && (
							<div className="w-56 sm:w-64">
								<Select
									value={selectedProperty.value}
									onValueChange={(val) => {
										if (val === "ALL") {
											setSelectedProperty({
												label: "Semua Cabang Kos (Konsolidasi)",
												value: "ALL",
											});
										} else {
											const matched = properties.find((p) => p.id === val);
											if (matched) {
												setSelectedProperty({
													label: matched.name,
													value: matched.id,
												});
											}
										}
									}}
								>
									<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-9 bg-white focus:ring-[#8fa594] shadow-sm font-medium">
										<Building2 className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
										<SelectValue placeholder="Pilih Cabang Kos">
											{selectedProperty.label}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="bg-white border-[#e4e9e4]">
										<SelectItem value="ALL" className="text-xs font-semibold">
											Semua Cabang Kos (Konsolidasi)
										</SelectItem>
										{properties.map((p) => (
											<SelectItem key={p.id} value={p.id} className="text-xs">
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<Button
							type="button"
							onClick={() => {
								setEditingTransaction(null);
								setIsFormOpen(true);
							}}
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-sm"
						>
							<Plus className="w-3.5 h-3.5 mr-1.5" />
							Catat Transaksi
						</Button>
					</div>
				</div>

				{/* ─── Summary Metric Cards ───────────────────────────────────── */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Total Income Card */}
					<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
						<div className="flex items-start justify-between">
							<div>
								<span className="text-[11px] text-[#737873] font-medium block">
									Pemasukan Bulan Ini
								</span>
								<h3 className="text-lg sm:text-xl font-bold text-[#252925] mt-1">
									{isLoadingSummary
										? "..."
										: formatRupiah(financialSummary?.totalIncome || 0)}
								</h3>
							</div>
							<div className="w-8 h-8 rounded-lg bg-[#e8f2ea] text-[#568062] flex items-center justify-center">
								<ArrowDownRight className="w-4 h-4" />
							</div>
						</div>
						<div className="mt-3 flex items-center gap-1.5 text-[11px]">
							<span
								className={`font-semibold ${
									(financialSummary?.momGrowth.incomeGrowthPercent || 0) >= 0
										? "text-[#568062]"
										: "text-[#a65f5b]"
								}`}
							>
								{(financialSummary?.momGrowth.incomeGrowthPercent || 0) >= 0
									? "+"
									: ""}
								{financialSummary?.momGrowth.incomeGrowthPercent || 0}%
							</span>
							<span className="text-[#737873]">vs bulan lalu</span>
						</div>
					</Card>

					{/* Total Expense Card */}
					<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
						<div className="flex items-start justify-between">
							<div>
								<span className="text-[11px] text-[#737873] font-medium block">
									Total Pengeluaran
								</span>
								<h3 className="text-lg sm:text-xl font-bold text-[#252925] mt-1">
									{isLoadingSummary
										? "..."
										: formatRupiah(financialSummary?.totalExpense || 0)}
								</h3>
							</div>
							<div className="w-8 h-8 rounded-lg bg-[#f7e9e8] text-[#a65f5b] flex items-center justify-center">
								<ArrowUpRight className="w-4 h-4" />
							</div>
						</div>
						<div className="mt-3 flex items-center gap-1.5 text-[11px]">
							<span className="text-[#737873]">
								Operasional:{" "}
								<b>{formatRupiah(financialSummary?.operationalExpense || 0)}</b>
							</span>
						</div>
					</Card>

					{/* Net Profit Card */}
					<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
						<div className="flex items-start justify-between">
							<div>
								<span className="text-[11px] text-[#737873] font-medium block">
									Laba Bersih Kas
								</span>
								<h3
									className={`text-lg sm:text-xl font-bold mt-1 ${
										(financialSummary?.netProfit || 0) >= 0
											? "text-[#568062]"
											: "text-[#a65f5b]"
									}`}
								>
									{isLoadingSummary
										? "..."
										: formatRupiah(financialSummary?.netProfit || 0)}
								</h3>
							</div>
							<div className="w-8 h-8 rounded-lg bg-[#f3f7f3] text-[#4f6958] flex items-center justify-center">
								<TrendingUp className="w-4 h-4" />
							</div>
						</div>
						<div className="mt-3 flex items-center gap-1.5 text-[11px]">
							<span
								className={`font-semibold ${
									(financialSummary?.momGrowth.profitGrowthPercent || 0) >= 0
										? "text-[#568062]"
										: "text-[#a65f5b]"
								}`}
							>
								{(financialSummary?.momGrowth.profitGrowthPercent || 0) >= 0
									? "+"
									: ""}
								{financialSummary?.momGrowth.profitGrowthPercent || 0}%
							</span>
							<span className="text-[#737873]">pertumbuhan profit</span>
						</div>
					</Card>

					{/* Expense Ratio Card */}
					<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] relative overflow-hidden">
						<div className="flex items-start justify-between">
							<div>
								<span className="text-[11px] text-[#737873] font-medium block">
									Rasio Beban Kas
								</span>
								<h3 className="text-lg sm:text-xl font-bold text-[#252925] mt-1">
									{isLoadingSummary
										? "..."
										: `${financialSummary?.expenseRatio || 0}%`}
								</h3>
							</div>
							<div className="w-8 h-8 rounded-lg bg-[#f6f0e4] text-[#b18a4b] flex items-center justify-center">
								<Coins className="w-4 h-4" />
							</div>
						</div>
						<div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#737873]">
							<span>
								Periode: <b>{financialSummary?.periodLabel || "Bulan Ini"}</b>
							</span>
						</div>
					</Card>
				</div>

				{/* ─── Charts Row: Net Profit Trend + Cost Composition ─────────── */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
					<div className="lg:col-span-8">
						<FinanceNetProfitChart
							trends={monthlyTrends}
							isLoading={isLoadingTrends}
						/>
					</div>
					<div className="lg:col-span-4">
						<FinanceCostComposition
							items={costComposition}
							totalExpense={financialSummary?.totalExpense || 0}
							expenseRatio={financialSummary?.expenseRatio || 0}
							isLoading={isLoadingCostComposition}
						/>
					</div>
				</div>

				{/* ─── Profit and Loss Statement Table ─────────────────────────── */}
				<FinanceProfitLossTable
					selectedMonth={selectedMonth}
					selectedYear={selectedYear}
					onMonthChange={setSelectedMonth}
					onYearChange={setSelectedYear}
					data={profitLossData}
					isLoading={isLoadingProfitLoss}
					onExportCsv={handleExportCsv}
					isExporting={exportCsvMutation.isPending}
					propertyName={
						isSuperAdmin && selectedProperty.value === "ALL"
							? "Semua Cabang Kos (Konsolidasi)"
							: selectedProperty.label
					}
				/>

				{/* ─── Main Transactions Table with Filters & Search ────────────── */}
				<FinanceTransactionTable
					transactions={transactionsData?.data || []}
					totalCount={transactionsData?.totalCount || 0}
					currentPage={transactionsData?.currentPage || 1}
					totalPages={transactionsData?.totalPages || 1}
					pageSize={transactionsData?.pageSize || 10}
					searchQuery={searchQuery}
					onSearchChange={(q) => {
						setSearchQuery(q);
						setCurrentPage(1);
					}}
					typeFilter={typeFilter}
					onTypeFilterChange={(type) => {
						setTypeFilter(type);
						setCurrentPage(1);
					}}
					categoryFilter={categoryFilter}
					onCategoryFilterChange={(cat) => {
						setCategoryFilter(cat);
						setCurrentPage(1);
					}}
					sortBy={sortBy}
					sortOrder={sortOrder}
					onSortToggle={handleSortToggle}
					onPageChange={setCurrentPage}
					isLoading={isLoadingTransactions}
					onAddNew={() => {
						setEditingTransaction(null);
						setIsFormOpen(true);
					}}
					onDetail={(tx) => {
						setDetailTransaction(tx);
						setIsDetailOpen(true);
					}}
					onEdit={(tx) => {
						setEditingTransaction(tx);
						setIsFormOpen(true);
					}}
					onDelete={(tx) => {
						setDetailTransaction(tx);
						setIsDeleteDialogOpen(true);
					}}
					currentUserId={currentUserId}
					isSuperAdmin={isSuperAdmin}
				/>

				{/* ─── Dialogs ─────────────────────────────────────────────────── */}
				<FinanceFormDialog
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					editingTransaction={editingTransaction}
					properties={properties}
					defaultPropertyId={effectivePropertyId || properties[0]?.id || activePropertyId}
					onSubmit={handleFormSubmit}
					isSubmitting={
						createTxMutation.isPending || updateTxMutation.isPending
					}
				/>

				<TransactionDetailDialog
					open={isDetailOpen}
					onOpenChange={setIsDetailOpen}
					transaction={detailTransaction}
					onEdit={(tx) => {
						setIsDetailOpen(false);
						setEditingTransaction(tx);
						setIsFormOpen(true);
					}}
					onDelete={handleDelete}
					currentUserId={currentUserId}
					isSuperAdmin={isSuperAdmin}
				/>
			</div>
		</>
	);
}
