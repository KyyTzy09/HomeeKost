import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowDownRight,
	BedDouble,
	Cake,
	Calendar,
	CheckCircle2,
	CircleDollarSign,
	Clock,
	CreditCard,
	ExternalLink,
	MessageSquare,
	Wrench,
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
					onClick={() => navigate({ to: "/dashboard/invoices" })}
				>
					<div className="stat-top">
						<span>Jatuh Tempo</span>
						<span className="stat-icon">
							<Clock className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.dueCount}</div>
					<div className="stat-sub">
						<span className="warn">{stats.dueAmount}</span> belum lunas
					</div>
				</Card>

				<Card
					className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/finance" })}
				>
					<div className="stat-top">
						<span>Pengeluaran</span>
						<span className="stat-icon">
							<ArrowDownRight className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.monthlyExpense}</div>
					<div className="stat-sub">Bulan berjalan</div>
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
							<p>Tagihan jatuh tempo yang perlu diperhatikan</p>
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
							onClick={() => navigate({ to: "/dashboard/invoices" })}
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
