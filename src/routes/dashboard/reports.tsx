import { createFileRoute } from "@tanstack/react-router";
import {
	Building2,
	Calendar,
	CheckCircle2,
	Download,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type { AiMonthlyReportData } from "../../common/types/index.ts";
import type { AutomationSettingsFormValues } from "../../common/validations/index.ts";
import {
	AutomationSettingsDialog,
	ReportAiInsightPanel,
	ReportAutomationCard,
	ReportKpiCards,
	ReportRoomExpenseBreakdown,
} from "../../components/report/index.ts";

export const Route = createFileRoute("/dashboard/reports")({
	head: () => ({
		meta: [
			{
				title:
					"Laporan Eksekutif & AI Insight Finansial — HomeeKost Management",
			},
		],
	}),
	component: ReportsPage,
});

// ─── Initial Mock Report Data (Fokus 1 Cabang Kos Aktif: Kos A) ──────────────
const INITIAL_REPORT: AiMonthlyReportData = {
	id: 1,
	propertyId: "kos-a",
	propertyName: "Kos A (Kaliurang)",
	periodMonth: "Juli",
	periodYear: 2026,
	isClosedPeriod: true, // Tutup Buku Bulan Lalu
	totalIncome: 6_800_000,
	totalExpense: 2_100_000,
	netProfit: 4_700_000,
	roomStatus: {
		totalRooms: 8,
		occupiedRooms: 7,
		emptyRooms: 1,
		maintenanceRooms: 0,
		occupancyRate: 87.5,
	},
	narrativeSummary:
		"Pada periode Juli 2026 (Tutup Buku), Kos A mencatatkan performa keuangan yang sangat stabil dengan laba bersih mencapai Rp4.700.000 (margin laba 69,1%). Seluruh pembayaran sewa kamar terbayar tepat waktu tanpa piutang tertunggak. Pengeluaran operasional terbesar dialokasikan untuk tagihan listrik PLN dan iuran sampah lingkungan.",
	recommendations: [
		{
			id: 1,
			code: "01",
			title: "Pertahankan ketepatan penagihan sewa",
			description:
				"Tingkat ketepatan bayar penghuni Kos A mencapai 100% pada Juli. Jadwal WhatsApp reminder berkala (H-3 dan H-0) terbukti efektif.",
			priority: "HIGH",
		},
		{
			id: 2,
			code: "02",
			title: "Evaluasi efisiensi daya listrik AC",
			description:
				"Biaya listrik menyumbang 57% dari total pengeluaran kos bulan ini (Rp1,2 jt). Pertimbangkan servis cuci AC rutin untuk menjaga efisiensi konsumsi listrik.",
			priority: "MEDIUM",
		},
		{
			id: 3,
			code: "03",
			title: "Optimalisasi 1 kamar kosong (A-08)",
			description:
				"Tersisa 1 kamar kosong tipe Standard di lantai 2. Promosikan ke calon penghuni mahasiswa baru untuk mencapai target okupansi penuh 100%.",
			priority: "LOW",
		},
	],
	expenseBreakdown: [
		{
			id: 1,
			category: "Listrik & Daya PLN",
			amount: 1_200_000,
			percentage: 57.1,
			description: "Token listrik utama dan fasilitas bersama",
		},
		{
			id: 2,
			category: "Air Bersih PDAM",
			amount: 350_000,
			percentage: 16.7,
			description: "Tagihan air bersih bulanan",
		},
		{
			id: 3,
			category: "Abonemen WiFi Indihome",
			amount: 259_000,
			percentage: 12.3,
			description: "Porsi biaya bersama WiFi 100 Mbps",
		},
		{
			id: 4,
			category: "Kebersihan & Sampah",
			amount: 150_000,
			percentage: 7.1,
			description: "Iuran retribusi sampah lingkungan RW",
		},
		{
			id: 5,
			category: "Maintenance Ringan",
			amount: 141_000,
			percentage: 6.8,
			description: "Penggantian lampu koridor dan kran air",
		},
	],
	generatedAt: "01 Agustus 2026, 08:00 WIB",
	isAutomated: true,
};

function ReportsPage() {
	const [report] = useState<AiMonthlyReportData>(INITIAL_REPORT);
	const [selectedPeriod, setSelectedPeriod] = useState<string>(
		"Juli 2026 (Tutup Buku)",
	);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);

	// Automation settings state
	const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
	const [automationSettings, setAutomationSettings] =
		useState<AutomationSettingsFormValues>({
			scheduleDay: 1,
			aiModel: "gemini-1.5-flash",
			autoSendWhatsApp: true,
			targetPhone: "081234567890",
		});

	// Toast state
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => {
			setToastMessage(null);
		}, 3000);
	};

	// Actions
	const handleRegenerateAi = () => {
		setIsGenerating(true);
		setTimeout(() => {
			setIsGenerating(false);
			showToast("Analisis wawasan eksekutif AI berhasil diperbarui!");
		}, 1200);
	};

	const handleDownloadPdf = () => {
		showToast(
			`Dokumen PDF resmi laporan ${report.propertyName} periode ${selectedPeriod} siap diunduh!`,
		);
	};

	const handleSaveAutomationSettings = (
		values: AutomationSettingsFormValues,
	) => {
		setAutomationSettings(values);
		showToast(
			`Pengaturan automasi laporan berhasil disimpan (Setiap tanggal ${values.scheduleDay})`,
		);
	};

	return (
		<div className="space-y-6">
			{/* Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
					<span>{toastMessage}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<span className="text-[11px] font-semibold text-[#4f6958] bg-[#eef3ee] px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-[#d6dfd7]">
							<Building2 className="w-3.5 h-3.5" />
							{report.propertyName}
						</span>
						<span className="text-[11px] text-[#737873]">· Properti Aktif</span>
					</div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Laporan & Insight
					</h1>
					<p className="text-xs text-[#737873] mt-0.5">
						Ringkasan eksekutif bulanan dan analisis wawasan bisnis AI untuk{" "}
						{report.propertyName}.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					{/* Period Selector */}
					<div className="w-56">
						<Select
							value={selectedPeriod}
							onValueChange={(val) => {
								if (val) {
									setSelectedPeriod(val);
									showToast(`Periode laporan diubah ke ${val}`);
								}
							}}
						>
							<SelectTrigger className="border-[#e4e9e4] text-xs h-9 bg-white focus:ring-[#8fa594] w-full">
								<Calendar className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
								<SelectValue placeholder="Pilih Periode" />
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4]">
								<SelectItem value="Juli 2026" className="text-xs font-semibold">
									Juli 2026
								</SelectItem>
								<SelectItem value="Agustus 2026" className="text-xs">
									Agustus 2026
								</SelectItem>
								<SelectItem value="Juni 2026" className="text-xs">
									Juni 2026
								</SelectItem>
								<SelectItem value="Mei 2026" className="text-xs">
									Mei 2026
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Generate Ulang AI Button */}
					<Button
						type="button"
						variant="outline"
						className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-3.5 h-9 shadow-sm"
						onClick={handleRegenerateAi}
						disabled={isGenerating}
					>
						{isGenerating ? (
							<RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#4f6958]" />
						) : (
							<Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
						)}
						{isGenerating ? "Menganalisis..." : "Generate AI"}
					</Button>

					{/* Download PDF Button */}
					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm flex items-center gap-1.5"
						onClick={handleDownloadPdf}
					>
						<Download className="w-3.5 h-3.5" />
						Download Laporan PDF
					</Button>
				</div>
			</div>

			{/* 3 Top Stat KPI Cards */}
			<ReportKpiCards
				totalIncome={report.totalIncome}
				totalExpense={report.totalExpense}
				occupancyRate={report.roomStatus.occupancyRate}
				occupiedRooms={report.roomStatus.occupiedRooms}
				totalRooms={report.roomStatus.totalRooms}
				periodLabel={selectedPeriod}
			/>

			{/* Executive AI Narrative Insight & Strategic Recommendations (Clean Advisory) */}
			<ReportAiInsightPanel
				periodLabel={selectedPeriod}
				propertyName={report.propertyName}
				isClosedPeriod={report.isClosedPeriod}
				narrativeSummary={report.narrativeSummary}
				recommendations={report.recommendations}
			/>

			{/* Room Status & Expense Breakdown for Active Property */}
			<ReportRoomExpenseBreakdown
				propertyName={report.propertyName}
				roomStatus={report.roomStatus}
				expenses={report.expenseBreakdown}
			/>

			{/* Automasi Laporan Bulanan Card */}
			<ReportAutomationCard
				scheduleDay={automationSettings.scheduleDay}
				aiModel={automationSettings.aiModel}
				onOpenSettings={() => setIsSettingsOpen(true)}
			/>

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
