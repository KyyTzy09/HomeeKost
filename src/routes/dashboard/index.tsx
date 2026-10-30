import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowDownRight,
	ArrowRight,
	BedDouble,
	Cake,
	Calendar,
	CheckCircle2,
	CircleDollarSign,
	Clock,
	CreditCard,
	ExternalLink,
	MessageSquare,
	Sparkles,
	Wrench,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import { MONTH_NAMES_ID } from "../../common/constants/months.const.ts";
import type { UpcomingPaymentItem } from "../../common/types/index.ts";
import { OccupancyDonutChart } from "../../components/dashboard/OccupancyDonutChart.tsx";
import { RevenueExpenseChart } from "../../components/dashboard/RevenueExpenseChart.tsx";
import { UpcomingPaymentsTable } from "../../components/dashboard/UpcomingPaymentsTable.tsx";
import { DashboardSkeleton } from "../../components/layout/DashboardSkeleton.tsx";
import {
	dashboardOverviewQueryOptions,
	useDashboardContext,
	useGetDashboardData,
} from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/")({
	head: () => ({
		meta: [
			{
				title: "Dashboard Operasional — HomeeKost Management",
			},
		],
	}),
	loader: async ({ context }) => {
		const activePropertyId = context.dashboard?.activeProperty?.id;
		await context.queryClient.ensureQueryData(
			dashboardOverviewQueryOptions(activePropertyId),
		);
	},
	component: DashboardHomePage,
});

export function DashboardHomePage() {
	const navigate = useNavigate();
	const { userName, activeProperty } = useDashboardContext();
	const { data: dashboardData, isLoading } = useGetDashboardData(
		activeProperty?.id,
	);
	const [toastMessage, setToastMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);
	const [chartPeriod, setChartPeriod] = useState<{
		label: string;
		value: string;
	}>({ label: "6 Bulan", value: "6 Bulan" });

	const showToast = (text: string, type: "success" | "error" = "success") => {
		setToastMessage({ text, type });
		setTimeout(() => {
			setToastMessage(null);
		}, 3000);
	};

	const stats = dashboardData?.stats || {
		totalRooms: 0,
		occupiedRooms: 0,
		vacantRooms: 0,
		maintenanceRooms: 0,
		occupancyRate: 0,
		monthlyIncome: "Rp0",
		monthlyIncomeRaw: 0,
		incomeGrowth: "0%",
		dueCount: 0,
		dueAmount: "Rp0",
		dueAmountRaw: 0,
		monthlyExpense: "Rp0",
		monthlyExpenseRaw: 0,
	};

	const upcomingPayments: UpcomingPaymentItem[] =
		dashboardData?.upcomingPayments || [];

	const todayAttentions = dashboardData?.todayAttentions || [];
	const recentExpenses = dashboardData?.recentExpenses || [];
	const propertySummary = dashboardData?.propertySummaries || [];
	const recentActivities = dashboardData?.recentActivities || [];

	const handlePaymentAction = (item: UpcomingPaymentItem) => {
		if (item.phone) {
			const cleanPhone = item.phone.replace(/[^0-9]/g, "");
			const waTarget = cleanPhone.startsWith("0")
				? `62${cleanPhone.slice(1)}`
				: cleanPhone;
			const msg = encodeURIComponent(
				`Halo ${item.tenant}, pengingat tagihan sewa kamar ${item.room} sebesar ${item.amount} jatuh tempo pada ${item.dueDate}. Mohon konfirmasi jika telah melakukan pembayaran. Terima kasih.`,
			);
			window.open(`https://wa.me/${waTarget}?text=${msg}`, "_blank");
			showToast(`Membuka WhatsApp untuk mengirim pengingat ke ${item.tenant}`);
		} else {
			navigate({ to: "/dashboard/invoices" });
			showToast(`Membuka halaman invoice untuk ${item.tenant}`);
		}
	};

	const getAttentionIcon = (type: string) => {
		switch (type) {
			case "birthday":
				return <Cake className="w-4 h-4 text-[#b18a4b]" />;
			case "due":
				return <CreditCard className="w-4 h-4 text-[#4f6958]" />;
			case "maintenance":
				return <Wrench className="w-4 h-4 text-[#718b78]" />;
			default:
				return <MessageSquare className="w-4 h-4 text-[#5f896d]" />;
		}
	};

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

	// Monthly report alert calculation (hanya jika ada alert notifikasi aktif dari server)
	const now = new Date();
	const reportAlert = dashboardData?.monthlyReportAlert;
	const hasActiveReportAlert = Boolean(reportAlert?.hasReport);
	const prevMonth = reportAlert?.month ?? (now.getMonth() === 0 ? 12 : now.getMonth());
	const prevYear = reportAlert?.year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
	const prevMonthName =
		reportAlert?.monthName ||
		MONTH_NAMES_ID[prevMonth - 1]?.label ||
		`Bulan ${prevMonth}`;

	const bannerStorageKey = `hk_dismiss_report_banner_${prevYear}_${prevMonth}`;
	const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		try {
			return localStorage.getItem(bannerStorageKey) === "true";
		} catch {
			return false;
		}
	});

	const handleDismissBanner = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsBannerDismissed(true);
		try {
			localStorage.setItem(bannerStorageKey, "true");
		} catch {
			// ignore storage errors
		}
	};

	const handleNavigateToReport = () => {
		navigate({
			to: "/dashboard/reports",
			search: {
				month: prevMonth,
				year: prevYear,
			},
		});
	};

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	return (
		<>
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
			<div className="page-head">
				<div>
					<h1>
						Selamat datang, {userName || "Pengelola"}{" "}
						<span className="emoji">👋</span>
					</h1>
					<p>
						<b id="dashboardPropertyName">
							{activeProperty?.name || "Semua Cabang Kos"}
						</b>{" "}
						· Ringkasan operasional dan kondisi hunian hari ini.
					</p>
				</div>
				<div className="actions">
					<Button
						variant="outline"
						className="h-[38px] px-3.5 rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] text-xs font-semibold hover:shadow-xs flex items-center gap-1.5"
						type="button"
						id="dashboardDateBtn"
					>
						<Calendar className="w-3.5 h-3.5 text-[#4f6958]" />
						<span>{todayFormatted}</span>
					</Button>
				</div>
			</div>

			{/* Monthly Report Reminder Banner (Hanya muncul jika ada notifikasi aktif) */}
			{!isBannerDismissed && hasActiveReportAlert && (
				<div
					onClick={handleNavigateToReport}
					className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl bg-gradient-to-r from-[#eef4f0] via-[#f7f9f7] to-[#e8f0ea] border border-[#d2dfd4] shadow-xs cursor-pointer hover:border-[#adc4b2] hover:shadow-sm transition-all duration-200 -mt-1 mb-5"
					role="alert"
				>
					<div className="flex items-start sm:items-center gap-3.5 min-w-0">
						<div className="w-10 h-10 rounded-xl bg-white border border-[#d2dfd4] flex items-center justify-center text-[#3d5645] shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
							<Sparkles className="w-5 h-5 text-[#4f6958]" />
						</div>
						<div className="min-w-0">
							<h2 className="text-xs sm:text-sm font-bold text-[#252925] tracking-tight">
								Laporan Finansial & AI Insight {prevMonthName} {prevYear} Telah Tersedia
							</h2>
							<p className="text-[11px] sm:text-xs text-[#525b54] mt-0.5 leading-relaxed">
								Rekapitulasi laba rugi, okupansi kamar, dan rekomendasi AI operasional bulan lalu siap dievaluasi.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
						<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d5645] group-hover:text-[#252925] group-hover:translate-x-0.5 transition-all">
							Buka Laporan
							<ArrowRight className="w-3.5 h-3.5" />
						</span>
						<button
							type="button"
							onClick={handleDismissBanner}
							className="p-1 rounded-lg text-[#737873] hover:text-[#252925] hover:bg-[#e0eae2] transition-colors cursor-pointer"
							title="Tutup pengingat ini"
							aria-label="Tutup pengingat"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{/* 4 KPI Stat Cards with Lucide Icons */}
			<div className="stats">
				<Card
					className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/rooms" })}
				>
					<div className="stat-top">
						<span>Total Kamar</span>
						<span className="stat-icon">
							<BedDouble className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.totalRooms}</div>
					<div className="stat-sub">
						<span className="up">{stats.occupiedRooms} terisi</span> ·{" "}
						{stats.vacantRooms} kosong
						{stats.maintenanceRooms > 0 &&
							` · ${stats.maintenanceRooms} perbaikan`}
					</div>
				</Card>

				<Card
					className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/finance" })}
				>
					<div className="stat-top">
						<span>Pendapatan Bulan Ini</span>
						<span className="stat-icon">
							<CircleDollarSign className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.monthlyIncome}</div>
					<div className="stat-sub">
						<span className="up">{stats.incomeGrowth}</span> dari bulan lalu
					</div>
				</Card>

				<Card
					className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => {
						const hasOverdue = upcomingPayments.some(
							(p) => p.badgeClass === "red",
						);
						navigate({
							to: "/dashboard/payments",
							search: {
								status: hasOverdue ? "OVERDUE" : "PENDING",
							},
						});
					}}
				>
					<div className="stat-top">
						<span>Jatuh Tempo Bulan Ini</span>
						<span className="stat-icon">
							<Clock className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.dueCount}</div>
					<div className="stat-sub">
						{stats.dueCount === 0 ? (
							<span className="up">Semua lunas</span>
						) : (
							<>
								<span className="warn">{stats.dueAmount}</span> belum lunas
							</>
						)}
					</div>
				</Card>

				<Card
					className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/finance" })}
				>
					<div className="stat-top">
						<span>Pengeluaran Bulan Ini</span>
						<span className="stat-icon">
							<ArrowDownRight className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.monthlyExpense}</div>
					<div className="stat-sub">
						{stats.monthlyExpenseRaw > 0 ? (
							<span className="text-[#55695a] font-medium">Bulan berjalan</span>
						) : (
							<span>Belum ada pengeluaran</span>
						)}
					</div>
				</Card>
			</div>

			{/* Main Grid: Line Chart & Donut Chart */}
			<div className="grid-main">
				{/* Income & Expense Chart Panel */}
				<Card
					className="panel clickable p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/finance" })}
				>
					<div className="panel-head">
						<div>
							<h2>Pendapatan & Pengeluaran</h2>
							<p>Perbandingan arus kas {chartPeriod.label} terakhir</p>
						</div>
						<div onClick={(e) => e.stopPropagation()} className="w-32">
							<Select
								value={chartPeriod.value}
								onValueChange={(val) =>
									val && setChartPeriod({ label: val, value: val })
								}
							>
								<SelectTrigger className="w-full h-[30px] text-[11px] px-2.5 rounded-[7px] border-[#e4e9e4] bg-white text-[#737873]">
									<SelectValue>{chartPeriod.label}</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-[#252925] text-xs">
									<SelectItem value="6 Bulan">6 Bulan</SelectItem>
									<SelectItem value="12 Bulan">12 Bulan</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="chart-wrap">
						<RevenueExpenseChart
							period={chartPeriod.value}
							chartData={dashboardData?.chartData}
						/>
					</div>

					<div className="legend">
						<span>
							<i className="dot"></i>Pendapatan
						</span>
						<span>
							<i className="dot gray"></i>Pengeluaran
						</span>
					</div>
				</Card>

				{/* Room Status & Occupancy Donut Panel */}
				<Card
					className="panel clickable p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/rooms" })}
				>
					<div className="panel-head">
						<div>
							<h2>Status Kamar</h2>
							<p>Okupansi: {stats.occupancyRate}%</p>
						</div>
						<span className="mini-link">Lihat semua</span>
					</div>

					<div className="occupancy">
						<OccupancyDonutChart
							occupied={stats.occupiedRooms}
							vacant={stats.vacantRooms}
							maintenance={stats.maintenanceRooms}
						/>

						<div className="occ-list">
							<div className="occ-row">
								<span className="occ-name">
									<span
										style={{
											width: 7,
											height: 7,
											borderRadius: "50%",
											background: "#718b78",
										}}
									/>
									Terisi
								</span>
								<b>{stats.occupiedRooms}</b>
							</div>
							<div className="occ-row">
								<span className="occ-name">
									<span
										style={{
											width: 7,
											height: 7,
											borderRadius: "50%",
											background: "#dce7de",
										}}
									/>
									Kosong
								</span>
								<b>{stats.vacantRooms}</b>
							</div>
							<div className="occ-row">
								<span className="occ-name">
									<span
										style={{
											width: 7,
											height: 7,
											borderRadius: "50%",
											background: "#c8a46b",
										}}
									/>
									Maintenance
								</span>
								<b>{stats.maintenanceRooms}</b>
							</div>
							<div className="bar">
								<i
									style={{
										width: `${stats.occupancyRate}%`,
									}}
								/>
							</div>
						</div>
					</div>
				</Card>
			</div>

			{/* Grid Bottom 1: Tables & Attention */}
			<div className="grid-bottom">
				{/* Upcoming Payments TanStack Table */}
				<Card
					className="panel clickable p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/invoices" })}
				>
					<div className="panel-head">
						<div>
							<h2>Pembayaran Terdekat</h2>
							<p>Tagihan jatuh tempo bulan ini yang perlu diperhatikan</p>
						</div>
						<span className="mini-link flex items-center gap-1">
							Kelola tagihan <ExternalLink className="w-3 h-3" />
						</span>
					</div>

					<UpcomingPaymentsTable
						data={upcomingPayments}
						onAction={handlePaymentAction}
					/>
				</Card>

				{/* Today Attention Panel with Lucide Icons */}
				<Card className="panel p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]">
					<div className="panel-head">
						<div>
							<h2>Perhatian Hari Ini</h2>
							<p>Agenda & pengingat operasional penting</p>
						</div>
					</div>

					{todayAttentions.length === 0 ? (
						<div className="empty-state-box p-6 text-center text-xs text-[#737873]">
							Semua pembayaran dan agenda kos hari ini dalam kondisi prima ✨
						</div>
					) : (
						<div className="attention">
							{todayAttentions.map((att) => (
								<div
									key={att.id}
									className="attention-item clickable"
									onClick={() => navigate({ to: att.route })}
								>
									<div className="att-icon">{getAttentionIcon(att.type)}</div>
									<div>
										<strong>{att.title}</strong>
										<span>{att.desc}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>

			{/* Grid Bottom 2: Recent Expenses & Property Summary */}
			<div className="grid-bottom pdf-dashboard-grid">
				{/* Recent Expenses List */}
				<Card className="panel p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]">
					<div className="panel-head">
						<div>
							<h2>Pengeluaran Terakhir</h2>
							<p>Transaksi biaya kas keluar terbaru</p>
						</div>
						<span
							className="mini-link cursor-pointer"
							onClick={() => navigate({ to: "/dashboard/finance" })}
						>
							Lihat semua
						</span>
					</div>

					{recentExpenses.length === 0 ? (
						<div className="empty-state-box p-6 text-center text-xs text-[#737873]">
							Belum ada transaksi pengeluaran bulan ini
						</div>
					) : (
						<div className="mini-list">
							{recentExpenses.map((exp) => (
								<div key={exp.id} className="mini-list-row">
									<div>
										<b>{exp.title}</b>
										<span>{exp.date}</span>
									</div>
									<strong className="text-[#a45149] font-mono">
										{exp.amount}
									</strong>
								</div>
							))}
						</div>
					)}
				</Card>

				{/* Rooms Approaching Due Date List */}
				<Card className="panel p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]">
					<div className="panel-head">
						<div>
							<h2>Kamar Mendekati Pembayaran</h2>
							<p>Ringkasan per cabang kos</p>
						</div>
						<span
							className="mini-link cursor-pointer"
							onClick={() => navigate({ to: "/dashboard/payments" })}
						>
							Lihat semua
						</span>
					</div>

					{propertySummary.length === 0 ? (
						<div className="empty-state-box p-6 text-center text-xs text-[#737873]">
							Belum ada data properti terdaftar
						</div>
					) : (
						<div className="mini-list">
							{propertySummary.map((ps) => (
								<div key={ps.id} className="mini-list-row">
									<div>
										<b>{ps.name}</b>
										<span>{ps.rooms}</span>
									</div>
									<span className={`badge ${ps.badgeColor}`}>
										{ps.dueBadge}
									</span>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>

			{/* Activity Timeline Panel */}
			<Card className="activity panel p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]">
				<div className="panel-head">
					<div>
						<h2>Aktivitas & Log Notifikasi</h2>
						<p>Audit riwayat pesan WhatsApp & mutasi terbaru</p>
					</div>
					<span
						className="mini-link cursor-pointer"
						onClick={() => navigate({ to: "/dashboard/engagement" })}
					>
						Lihat log
					</span>
				</div>

				{recentActivities.length === 0 ? (
					<div className="empty-state-box p-6 text-center text-xs text-[#737873]">
						Belum ada log notifikasi WhatsApp yang tercatat
					</div>
				) : (
					<div className="activity-list">
						{recentActivities.map((act) => (
							<div
								key={act.id}
								className="activity-item clickable"
								onClick={() => navigate({ to: act.route })}
							>
								<small>{act.time}</small>
								<p>
									<b>{act.desc}</b>
								</p>
							</div>
						))}
					</div>
				)}
			</Card>
		</>
	);
}
