import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Building2,
	Calendar,
	CheckCircle2,
	Loader2,
	Printer,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type { AutomationSettingsFormValues } from "../../common/validations/index.ts";
import {
	AutomationSettingsDialog,
	ExecutiveReportDoc,
	ReportAiInsightPanel,
	ReportAnnualMatrixCard,
	ReportAutomationCard,
	ReportKpiCards,
	ReportRoomExpenseBreakdown,
} from "../../components/report/index.ts";
import {
	annualReportMatrixQueryOptions,
	monthlyReportQueryOptions,
	propertiesQueryOptions,
	useAnnualReportMatrix,
	useDashboardContext,
	useMonthlyReport,
	useProperties,
	useRegenerateAiInsight,
} from "../../hooks/index.ts";
import { downloadAnnualFinancialExcel } from "../../lib/excel-exporter.ts";

export const Route = createFileRoute("/dashboard/reports")({
	head: () => ({
		meta: [
			{
				title:
					"Laporan Eksekutif & AI Insight Finansial — HomeeKost Management",
			},
		],
	}),
	loader: async ({ context }) => {
		const activePropertyId = context.dashboard?.activeProperty?.id;
		const now = new Date();
		const month = now.getMonth() + 1;
		const year = now.getFullYear();

		await Promise.all([
			context.queryClient.ensureQueryData(
				monthlyReportQueryOptions(activePropertyId, month, year),
			),
			context.queryClient.ensureQueryData(
				annualReportMatrixQueryOptions(activePropertyId, year),
			),
			context.queryClient.ensureQueryData(propertiesQueryOptions()),
		]);
	},
	component: ReportsPage,
});

interface SelectOption<T = string | number> {
	label: string;
	value: T;
}

const MONTHS: SelectOption<number>[] = [
	{ value: 1, label: "Januari" },
	{ value: 2, label: "Februari" },
	{ value: 3, label: "Maret" },
	{ value: 4, label: "April" },
	{ value: 5, label: "Mei" },
	{ value: 6, label: "Juni" },
	{ value: 7, label: "Juli" },
	{ value: 8, label: "Agustus" },
	{ value: 9, label: "September" },
	{ value: 10, label: "Oktober" },
	{ value: 11, label: "November" },
	{ value: 12, label: "Desember" },
];

const currentYearNum = new Date().getFullYear();
const YEARS: SelectOption<number>[] = [
	{ label: "2024", value: 2024 },
	{ label: "2025", value: 2025 },
	{ label: "2026", value: 2026 },
	{ label: "2027", value: 2027 },
];

const DEFAULT_MONTH_OPTION = MONTHS[0];
const DEFAULT_YEAR_OPTION = YEARS[2];

const AUTOMATION_STORAGE_KEY = "homeekost_report_automation_settings";

const DEFAULT_AUTOMATION_SETTINGS: AutomationSettingsFormValues = {
	scheduleDay: 1,
	scheduleTime: "08:00",
	aiModel: "gemini-3.5-flash-lite",
	autoSendWhatsApp: false,
	targetPhone: "",
};

const loadStoredAutomationSettings = (): AutomationSettingsFormValues => {
	if (typeof window === "undefined") return DEFAULT_AUTOMATION_SETTINGS;
	try {
		const stored = localStorage.getItem(AUTOMATION_STORAGE_KEY);
		if (!stored) return DEFAULT_AUTOMATION_SETTINGS;
		const parsed = JSON.parse(stored);
		if (parsed && typeof parsed === "object") {
			// Bersihkan nomor dummy jika sebelumnya tersimpan
			if (parsed.targetPhone === "081234567890") {
				parsed.targetPhone = "";
				parsed.autoSendWhatsApp = false;
			}
			return { ...DEFAULT_AUTOMATION_SETTINGS, ...parsed };
		}
		return DEFAULT_AUTOMATION_SETTINGS;
	} catch {
		return DEFAULT_AUTOMATION_SETTINGS;
	}
};

function ReportsPage() {
	const { user, userRole, isSuperAdmin, activeProperty } =
		useDashboardContext();
	const { data: properties } = useProperties();

	const now = new Date();
	const currentMonthNumber = now.getMonth() + 1;
	const initialMonth =
		MONTHS.find((m) => m.value === currentMonthNumber) || DEFAULT_MONTH_OPTION;
	const initialYear =
		YEARS.find((y) => y.value === currentYearNum) || DEFAULT_YEAR_OPTION;

	const [selectedMonth, setSelectedMonth] =
		useState<SelectOption<number>>(initialMonth);
	const [selectedYear, setSelectedYear] =
		useState<SelectOption<number>>(initialYear);
	const [selectedProperty, setSelectedProperty] = useState<
		SelectOption<string>
	>({
		label: "Semua Cabang Kos",
		value: "ALL",
	});

	// Automation settings state
	const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
	const [automationSettings, setAutomationSettings] =
		useState<AutomationSettingsFormValues>(DEFAULT_AUTOMATION_SETTINGS);

	useEffect(() => {
		const loaded = loadStoredAutomationSettings();
		setAutomationSettings(loaded);
	}, []);

	// Toast state
	const [toastMessage, setToastMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);

	const showToast = (text: string, type: "success" | "error" = "success") => {
		setToastMessage({ text, type });
		setTimeout(() => {
			setToastMessage(null);
		}, 3500);
	};

	// Effective Property ID based on RBAC
	const effectivePropertyId = useMemo(() => {
		if (userRole === "ADMIN" && user?.assignedPropertyId) {
			return user.assignedPropertyId;
		}
		return selectedProperty.value === "ALL"
			? undefined
			: selectedProperty.value;
	}, [userRole, user?.assignedPropertyId, selectedProperty.value]);

	// 1. Query Laporan Bulanan & AI
	const {
		data: monthlyReport,
		isLoading: isMonthlyLoading,
		isError: isMonthlyError,
		refetch: refetchMonthly,
	} = useMonthlyReport(
		effectivePropertyId,
		selectedMonth.value,
		selectedYear.value,
	);

	// 2. Query Matriks Tahunan (12 Bulan)
	const {
		data: annualMatrix,
		isLoading: isAnnualLoading,
		refetch: refetchAnnual,
	} = useAnnualReportMatrix(selectedYear.value, effectivePropertyId);

	// 3. Mutations
	const regenerateAiMutation = useRegenerateAiInsight();

	const handleRegenerateAi = async () => {
		if (monthlyReport && monthlyReport.canRefreshToday === false) {
			showToast(
				"Batas regenerasi AI Insight telah tercapai (maksimal 2 kali per hari untuk periode ini). Silakan coba lagi besok.",
				"error",
			);
			return;
		}

		try {
			await regenerateAiMutation.mutateAsync({
				propertyId: effectivePropertyId,
				month: selectedMonth.value,
				year: selectedYear.value,
			});
			await Promise.all([refetchMonthly(), refetchAnnual()]);
			showToast("Analisis wawasan eksekutif AI berhasil diperbarui!");
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : "Gagal memperbarui AI Insight.",
				"error",
			);
		}
	};

	// Export Excel State
	const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

	const handleExportAnnualExcel = async () => {
		if (!annualMatrix) {
			showToast("Data matriks keuangan tahunan belum tersedia.", "error");
			return;
		}

		try {
			setIsExportingExcel(true);
			await downloadAnnualFinancialExcel(annualMatrix);
			showToast(
				`File Excel Laporan-Keuangan-Tahunan-${annualMatrix.year}.xlsx berhasil diunduh dengan format styling rapi!`,
			);
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : "Gagal mengekspor laporan Excel.",
				"error",
			);
		} finally {
			setIsExportingExcel(false);
		}
	};

	const handlePrintPdf = () => {
		window.print();
	};

	const handleSaveAutomationSettings = (
		values: AutomationSettingsFormValues,
	) => {
		setAutomationSettings(values);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(values));
			} catch {
				// Ignore write error
			}
		}
		showToast(
			`Pengaturan automasi laporan bulanan berhasil disimpan (Setiap tanggal ${values.scheduleDay} pukul ${values.scheduleTime || "08:00"} WIB)`,
		);
	};

	const periodLabel = `${selectedMonth.label} ${selectedYear.label}`;

	return (
		<div className="space-y-6">
			{/* Toast Notification */}
			{toastMessage && (
				<div
					className={`fixed bottom-6 right-6 z-50 text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
						toastMessage.type === "error" ? "bg-[#7d2d2a]" : "bg-[#253129]"
					}`}
				>
					{toastMessage.type === "error" ? (
						<AlertCircle className="w-4 h-4 text-[#f09a96]" />
					) : (
						<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
					)}
					<span>{toastMessage.text}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
				<div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Laporan & AI Insight
					</h1>
					<p className="text-xs text-[#737873] mt-0.5">
						Evaluasi kesehatan arus kas bulanan berbasis AI dan rekapitulasi
						tahunan lengkap untuk kos-kosan Anda.
					</p>
				</div>

				{/* Filter & Action Controls */}
				<div className="flex flex-wrap items-center gap-2.5">
					{/* Property Filter (SuperAdmin Only) */}
					{isSuperAdmin && properties && (
						<div className="w-48">
							<Select
								value={selectedProperty.value}
								onValueChange={(val) => {
									if (val === "ALL") {
										setSelectedProperty({
											label: "Semua Cabang Kos",
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
								<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-9 bg-white focus:ring-[#8fa594]">
									<Building2 className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
									<SelectValue placeholder="Semua Cabang Kos">
										{selectedProperty.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4]">
									<SelectItem value="ALL" className="text-xs font-semibold">
										Semua Cabang Kos
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

					{/* Month Selector */}
					<div className="w-36">
						<Select
							value={selectedMonth.value.toString()}
							onValueChange={(val) => {
								const matched = MONTHS.find((m) => m.value.toString() === val);
								if (matched) setSelectedMonth(matched);
							}}
						>
							<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-9 bg-white focus:ring-[#8fa594]">
								<Calendar className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
								<SelectValue placeholder="Pilih Bulan">
									{selectedMonth.label}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4]">
								{MONTHS.map((m) => (
									<SelectItem
										key={m.value}
										value={m.value.toString()}
										className="text-xs"
									>
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Year Selector */}
					<div className="w-28">
						<Select
							value={selectedYear.value.toString()}
							onValueChange={(val) => {
								const matched = YEARS.find((y) => y.value.toString() === val);
								if (matched) setSelectedYear(matched);
							}}
						>
							<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-9 bg-white focus:ring-[#8fa594]">
								<SelectValue placeholder="Tahun">
									{selectedYear.label}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4]">
								{YEARS.map((y) => (
									<SelectItem
										key={y.value}
										value={y.value.toString()}
										className="text-xs font-mono"
									>
										{y.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Generate Ulang AI Button dengan Indikator Kuota Harian (Maks 2x / hari) */}
					<Button
						type="button"
						variant="outline"
						className={`border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-3.5 h-9 shadow-2xs ${
							monthlyReport &&
							monthlyReport.canRefreshToday === false &&
							!regenerateAiMutation.isPending
								? "opacity-60 cursor-not-allowed bg-[#f7faf7]"
								: ""
						}`}
						onClick={handleRegenerateAi}
						disabled={
							regenerateAiMutation.isPending ||
							isMonthlyLoading ||
							(monthlyReport ? monthlyReport.canRefreshToday === false : false)
						}
						title={
							monthlyReport?.remainingRefreshesToday !== undefined
								? `Sisa kuota refresh AI hari ini: ${monthlyReport.remainingRefreshesToday}/2`
								: "Refresh analisis AI (Maksimal 2x per hari)"
						}
					>
						{regenerateAiMutation.isPending ? (
							<RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#4f6958]" />
						) : (
							<Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
						)}
						{regenerateAiMutation.isPending
							? "Menganalisis..."
							: `Refresh AI (${monthlyReport?.remainingRefreshesToday ?? 2}/2)`}
					</Button>

					{/* Cetak / Download PDF Button */}
					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-3.5 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer"
						onClick={handlePrintPdf}
					>
						<Printer className="w-3.5 h-3.5" />
						Cetak PDF
					</Button>
				</div>
			</div>

			{/* Loading State */}
			{isMonthlyLoading && (
				<div className="p-12 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-3 print:hidden">
					<Loader2 className="w-6 h-6 animate-spin text-[#4f6958]" />
					<p className="text-xs text-[#737873] font-medium">
						Menghitung data keuangan deterministik & menyusun AI Insight...
					</p>
				</div>
			)}

			{/* Error State */}
			{isMonthlyError && !isMonthlyLoading && (
				<div className="p-6 bg-[#fdf4f4] border border-[#f0c3c1] rounded-xl flex items-center gap-3 text-xs text-[#a45149] print:hidden">
					<AlertCircle className="w-5 h-5 shrink-0" />
					<span>
						Gagal memuat laporan untuk periode {periodLabel}. Silakan coba
						beberapa saat lagi.
					</span>
				</div>
			)}

			{/* Loaded Report Content */}
			{monthlyReport && !isMonthlyLoading && (
				<>
					{/* Printable A4 Executive Report Sheet (Visible during window.print()) */}
					<div className="hidden print:block">
						<ExecutiveReportDoc
							report={monthlyReport}
							activePropertyLogo={activeProperty?.imageUrl}
							activePropertyAddress={activeProperty?.address}
						/>
					</div>

					<div className="space-y-6 print:hidden">
						{/* 4 Top Stat KPI Cards */}
						<ReportKpiCards
							totalIncome={monthlyReport.totalIncome}
							totalExpense={monthlyReport.totalExpense}
							netProfit={monthlyReport.netProfit}
							profitMarginPercentage={monthlyReport.profitMarginPercentage}
							occupancyRate={monthlyReport.roomStatus.occupancyRate}
							occupiedRooms={monthlyReport.roomStatus.occupiedRooms}
							totalRooms={monthlyReport.roomStatus.totalRooms}
							periodLabel={periodLabel}
						/>

						{/* Executive AI Narrative Insight & Strategic Recommendations */}
						<ReportAiInsightPanel
							periodLabel={periodLabel}
							propertyName={monthlyReport.propertyName}
							isClosedPeriod={monthlyReport.isClosedPeriod}
							financialHealthGrade={monthlyReport.financialHealthGrade}
							narrativeSummary={monthlyReport.narrativeSummary}
							keyHighlights={monthlyReport.keyHighlights}
							trendAnalysis={monthlyReport.trendAnalysis}
							complaintCostImpact={monthlyReport.complaintCostImpact}
							recommendations={monthlyReport.recommendations}
							aiProviderUsed={monthlyReport.aiProviderUsed}
						/>

						{/* Room Status & Expense Breakdown */}
						<ReportRoomExpenseBreakdown
							propertyName={monthlyReport.propertyName}
							roomStatus={monthlyReport.roomStatus}
							expenses={monthlyReport.expenseBreakdown}
						/>

						{/* Matriks Keuangan Tahunan (12 Bulan) & Ekspor Excel */}
						<ReportAnnualMatrixCard
							data={annualMatrix}
							isLoading={isAnnualLoading}
							onExportExcel={handleExportAnnualExcel}
							isExportingExcel={isExportingExcel}
						/>

						{/* Automasi Laporan Bulanan Card */}
						<ReportAutomationCard
							scheduleDay={automationSettings.scheduleDay}
							scheduleTime={automationSettings.scheduleTime}
							onOpenSettings={() => setIsSettingsOpen(true)}
						/>
					</div>
				</>
			)}

			{/* Automation Settings Dialog */}
			<AutomationSettingsDialog
				open={isSettingsOpen}
				onOpenChange={setIsSettingsOpen}
				initialValues={automationSettings}
				onSubmit={handleSaveAutomationSettings}
			/>
		</div>
	);
}
