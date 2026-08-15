import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowDownRight,
	BedDouble,
	Cake,
	Calendar,
	CircleDollarSign,
	Clock,
	CreditCard,
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
import { useGetDashboardData } from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/")({
	head: () => ({
		meta: [
			{
				title: "Dashboard Operasional — HomeeKost Management",
			},
		],
	}),
	component: DashboardHomePage,
});

function DashboardHomePage() {
	const navigate = useNavigate();
	const { data: dashboardData, isLoading } = useGetDashboardData();
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [chartPeriod, setChartPeriod] = useState("6 Bulan");

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => {
			setToastMessage(null);
		}, 3000);
	};

	const stats = dashboardData?.stats || {
		totalRooms: 12,
		occupiedRooms: 10,
		vacantRooms: 2,
		monthlyIncome: "Rp6,8 jt",
		incomeGrowth: "8,2%",
		dueCount: 4,
		dueAmount: "Rp3,2 jt",
		monthlyExpense: "Rp2,1 jt",
	};

	const upcomingPayments: UpcomingPaymentItem[] =
		dashboardData?.upcomingPayments || [
			{
				id: "p1",
				tenant: "Alya Putri",
				room: "A-03",
				dueDate: "10 Agu",
				amount: "Rp850.000",
				badgeText: "3 hari lagi",
				badgeClass: "amber",
				actionText: "Reminder",
			},
			{
				id: "p2",
				tenant: "Nabila Putri",
				room: "B-02",
				dueDate: "12 Agu",
				amount: "Rp950.000",
				badgeText: "5 hari lagi",
				badgeClass: "green",
				actionText: "Invoice",
			},
			{
				id: "p3",
				tenant: "Fira Aulia",
				room: "A-07",
				dueDate: "08 Agu",
				amount: "Rp850.000",
				badgeText: "Terlambat",
				badgeClass: "red",
				actionText: "Reminder",
			},
			{
				id: "p4",
				tenant: "Sarah Anindita",
				room: "C-01",
				dueDate: "15 Agu",
				amount: "Rp1.200.000",
				badgeText: "8 hari lagi",
				badgeClass: "green",
				actionText: "Invoice",
			},
		];

	const todayAttentions = [
		{
			id: "att1",
			icon: <Cake className="w-4 h-4 text-[#b18a4b]" />,
			title: "Sarah ulang tahun besok",
			desc: "Kirim ucapan personal untuk menjaga engagement.",
			route: "/dashboard/engagement",
		},
		{
			id: "att2",
			icon: <CreditCard className="w-4 h-4 text-[#4f6958]" />,
			title: "3 pembayaran mendekati jatuh tempo",
			desc: "Pengingat otomatis akan berjalan sesuai jadwal.",
			route: "/dashboard/payments",
		},
		{
			id: "att3",
			icon: <Wrench className="w-4 h-4 text-[#718b78]" />,
			title: "Maintenance kamar B-04",
			desc: "Keluhan: lampu kamar perlu diganti.",
			route: "/dashboard/rooms",
		},
		{
			id: "att4",
			icon: <MessageSquare className="w-4 h-4 text-[#5f896d]" />,
			title: "2 penghuni perlu diperhatikan",
			desc: "Ada pertanyaan dari penghuni terkait perpanjangan sewa.",
			route: "/dashboard/tenants",
		},
	];

	const recentExpenses = [
		{
			id: "e1",
			title: "Abonemen WiFi",
			date: "03 Agu · Semua Kost",
			amount: "Rp777.000",
		},
		{
			id: "e2",
			title: "Listrik",
			date: "05 Agu · Kos A",
			amount: "Rp1.250.000",
		},
		{
			id: "e3",
			title: "Maintenance",
			date: "07 Agu · Kos B",
			amount: "Rp450.000",
		},
	];

	const propertySummary = [
		{
			id: "ps1",
			name: "Kost Melati Indah",
			rooms: "10 kamar",
			dueBadge: "3 mendekati",
			badgeColor: "amber",
		},
		{
			id: "ps2",
			name: "Kost Mawar Residence",
			rooms: "12 kamar",
			dueBadge: "4 mendekati",
			badgeColor: "amber",
		},
		{
			id: "ps3",
			name: "Kost Graha Asri",
			rooms: "9 kamar",
			dueBadge: "2 mendekati",
			badgeColor: "green",
		},
	];

	const recentActivities = [
		{
			id: "a1",
			time: "10 menit lalu",
			desc: "Invoice #INV-0021 dikirim ke Alya Putri via WhatsApp.",
			route: "/dashboard/invoices",
		},
		{
			id: "a2",
			time: "1 jam lalu",
			desc: "Pembayaran Rp850.000 dari Dinda Maharani diterima.",
			route: "/dashboard/payments",
		},
		{
			id: "a3",
			time: "2 jam lalu",
			desc: "Kamar A-05 diubah menjadi status kosong.",
			route: "/dashboard/rooms",
		},
		{
			id: "a4",
			time: "Hari ini, 08:40",
			desc: "Pengeluaran listrik Rp1.250.000 dicatat.",
			route: "/dashboard/finance",
		},
	];

	const handlePaymentAction = (item: UpcomingPaymentItem) => {
		if (item.actionText === "Reminder") {
			showToast(`Reminder WhatsApp dikirim ke ${item.tenant}`);
		} else {
			showToast(`Invoice dibuka untuk ${item.tenant}`);
		}
	};

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	return (
		<>
			{/* Toast Popup Notification */}
			<div className={`toast ${toastMessage ? "show" : ""}`} role="status">
				{toastMessage}
			</div>

			{/* Page Header */}
			<div className="page-head">
				<div>
					<h1>
						Selamat pagi, Frisda <span className="emoji">👋</span>
					</h1>
					<p>
						<b id="dashboardPropertyName">Kost Melati Indah</b> · Berikut
						ringkasan kondisi kos hari ini.
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
						<span>09 Agustus 2026</span>
						<span className="text-[10px] text-[#737873]">▾</span>
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
						<span className="up">↑ {stats.incomeGrowth}</span> dari bulan lalu
					</div>
				</Card>

				<Card
					className="stat clickable p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/payments" })}
				>
					<div className="stat-top">
						<span>Jatuh Tempo</span>
						<span className="stat-icon">
							<Clock className="w-4 h-4" />
						</span>
					</div>
					<div className="stat-value">{stats.dueCount}</div>
					<div className="stat-sub">
						<span className="warn">{stats.dueAmount}</span> perlu
						ditindaklanjuti
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

			{/* Main Grid: Chart.js Line & Donut */}
			<div className="grid-main">
				{/* Income & Expense Chart.js Area/Line Panel */}
				<Card
					className="panel clickable p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/finance" })}
				>
					<div className="panel-head">
						<div>
							<h2>Pendapatan & Pengeluaran</h2>
							<p>Perbandingan {chartPeriod} terakhir</p>
						</div>
						<div onClick={(e) => e.stopPropagation()}>
							<Select
								value={chartPeriod}
								onValueChange={(val) => val && setChartPeriod(val)}
							>
								<SelectTrigger className="h-[30px] text-[11px] px-2.5 rounded-[7px] border-[#e4e9e4] bg-white text-[#737873]">
									<SelectValue>{chartPeriod}</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-[#252925] text-xs">
									<SelectItem value="6 Bulan">6 Bulan</SelectItem>
									<SelectItem value="12 Bulan">12 Bulan</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="chart-wrap">
						<RevenueExpenseChart period={chartPeriod} />
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

				{/* Room Status & Occupancy Donut Panel with Chart.js */}
				<Card
					className="panel clickable p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]"
					onClick={() => navigate({ to: "/dashboard/rooms" })}
				>
					<div className="panel-head">
						<div>
							<h2>Status Kamar</h2>
							<p>Occupancy hari ini</p>
						</div>
						<span className="mini-link">Lihat semua</span>
					</div>

					<div className="occupancy">
						<OccupancyDonutChart occupied={18} vacant={6} maintenance={0} />

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
								<b>18</b>
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
								<b>6</b>
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
								<b>0</b>
							</div>
							<div className="bar">
								<i style={{ width: "75%" }} />
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
					onClick={() => navigate({ to: "/dashboard/payments" })}
				>
					<div className="panel-head">
						<div>
							<h2>Pembayaran Terdekat</h2>
							<p>Yang perlu diperhatikan minggu ini</p>
						</div>
						<span className="mini-link">Kelola pembayaran</span>
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
							<p>Hal kecil yang perlu ditindaklanjuti</p>
						</div>
					</div>

					{todayAttentions.length === 0 ? (
						<div className="empty-state-box">
							Tidak ada perhatian khusus hari ini
						</div>
					) : (
						<div className="attention">
							{todayAttentions.map((att) => (
								<div
									key={att.id}
									className="attention-item clickable"
									onClick={() => navigate({ to: att.route })}
								>
									<div className="att-icon">{att.icon}</div>
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
							<p>Transaksi biaya terbaru</p>
						</div>
						<span
							className="mini-link"
							onClick={() => navigate({ to: "/dashboard/finance" })}
						>
							Lihat semua
						</span>
					</div>

					{recentExpenses.length === 0 ? (
						<div className="empty-state-box">
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
									<strong>{exp.amount}</strong>
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
							<p>Ringkasan per kost</p>
						</div>
						<span
							className="mini-link"
							onClick={() => navigate({ to: "/dashboard/payments" })}
						>
							Lihat semua
						</span>
					</div>

					<div className="mini-list">
						{propertySummary.map((ps) => (
							<div key={ps.id} className="mini-list-row">
								<div>
									<b>{ps.name}</b>
									<span>{ps.rooms}</span>
								</div>
								<span className={`badge ${ps.badgeColor}`}>{ps.dueBadge}</span>
							</div>
						))}
					</div>
				</Card>
			</div>

			{/* Activity Timeline Panel */}
			<Card className="activity panel p-[19px] ring-0 border-[#e4e9e4] rounded-[10px]">
				<div className="panel-head">
					<div>
						<h2>Aktivitas Terbaru</h2>
						<p>Perubahan terakhir di HomeeKost</p>
					</div>
					<span className="mini-link">Lihat semua</span>
				</div>

				{recentActivities.length === 0 ? (
					<div className="empty-state-box">
						Belum ada aktivitas tercatat hari ini
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
