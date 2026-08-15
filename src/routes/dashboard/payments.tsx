import { createFileRoute } from "@tanstack/react-router";
import {
	Bell,
	CheckCircle2,
	Clock,
	CreditCard,
	Pencil,
	Plus,
	Send,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type { PaymentFormValues } from "../../common/validations/payment.schema.ts";
import {
	formatDueDate,
	formatRupiah,
	PaymentDeleteDialog,
	PaymentFormDialog,
	type PaymentItem,
	STATUS_BADGE,
	STATUS_LABEL,
} from "../../components/payment/index.ts";

export const Route = createFileRoute("/dashboard/payments")({
	head: () => ({
		meta: [{ title: "Pembayaran & Tagihan — HomeeKost Management" }],
	}),
	component: PaymentsPage,
});

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_PAYMENTS: PaymentItem[] = [
	{
		id: "pay-1",
		tenantName: "Alya Putri",
		roomNumber: "A-03",
		period: "Agustus 2026",
		dueDate: "2026-08-10",
		amount: 850_000,
		status: "PENDING",
		paidAt: null,
	},
	{
		id: "pay-2",
		tenantName: "Fira Aulia",
		roomNumber: "A-07",
		period: "Agustus 2026",
		dueDate: "2026-08-08",
		amount: 850_000,
		status: "OVERDUE",
		paidAt: null,
	},
	{
		id: "pay-3",
		tenantName: "Dinda Maharani",
		roomNumber: "B-01",
		period: "Agustus 2026",
		dueDate: "2026-08-20",
		amount: 900_000,
		status: "PAID",
		paidAt: "2026-08-19",
	},
	{
		id: "pay-4",
		tenantName: "Nabila Putri",
		roomNumber: "B-02",
		period: "Agustus 2026",
		dueDate: "2026-08-12",
		amount: 950_000,
		status: "PENDING",
		paidAt: null,
	},
	{
		id: "pay-5",
		tenantName: "Sarah Anindita",
		roomNumber: "C-01",
		period: "Agustus 2026",
		dueDate: "2026-08-15",
		amount: 1_200_000,
		status: "PAID",
		paidAt: "2026-08-14",
	},
	{
		id: "pay-6",
		tenantName: "Rina Kusuma",
		roomNumber: "C-03",
		period: "Agustus 2026",
		dueDate: "2026-08-05",
		amount: 800_000,
		status: "OVERDUE",
		paidAt: null,
	},
];

const MONTHS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

// ─── Page Component ────────────────────────────────────────────────────────
function PaymentsPage() {
	const [payments, setPayments] = useState<PaymentItem[]>(MOCK_PAYMENTS);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Filter state
	const [filterMonth, setFilterMonth] = useState("Agustus");
	const [filterStatus, setFilterStatus] = useState<
		"all" | "PAID" | "PENDING" | "OVERDUE"
	>("all");

	// Dialog state
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(
		null,
	);
	const [deletingPayment, setDeletingPayment] = useState<PaymentItem | null>(
		null,
	);

	// ─── Helpers ────────────────────────────────────────────────────────
	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// ─── Computed Stats ─────────────────────────────────────────────────
	const stats = useMemo(() => {
		const paid = payments.filter((p) => p.status === "PAID");
		const pending = payments.filter((p) => p.status === "PENDING");
		const overdue = payments.filter((p) => p.status === "OVERDUE");
		return {
			paidTotal: paid.reduce((s, p) => s + p.amount, 0),
			paidCount: paid.length,
			pendingTotal: pending.reduce((s, p) => s + p.amount, 0),
			pendingCount: pending.length,
			overdueTotal: overdue.reduce((s, p) => s + p.amount, 0),
			overdueCount: overdue.length,
		};
	}, [payments]);

	// ─── Attention items for reminder panel ────────────────────────────
	const attentionPayments = useMemo(
		() =>
			payments.filter((p) => p.status === "PENDING" || p.status === "OVERDUE"),
		[payments],
	);

	// ─── Filtered table rows ─────────────────────────────────────────────
	const filteredPayments = useMemo(() => {
		return payments.filter((p) => {
			const monthMatch = p.period.includes(filterMonth);
			const statusMatch = filterStatus === "all" || p.status === filterStatus;
			return monthMatch && statusMatch;
		});
	}, [payments, filterMonth, filterStatus]);

	// ─── Handlers ────────────────────────────────────────────────────────
	const handleOpenAdd = () => {
		setEditingPayment(null);
		setIsFormOpen(true);
	};

	const handleOpenEdit = (p: PaymentItem) => {
		setEditingPayment(p);
		setIsFormOpen(true);
	};

	const handleFormSubmit = (values: PaymentFormValues) => {
		if (editingPayment) {
			setPayments((prev) =>
				prev.map((p) =>
					p.id === editingPayment.id
						? {
							...p,
							tenantName: values.tenantName,
							roomNumber: values.roomNumber,
							period: values.period,
							dueDate: values.dueDate,
							amount: values.amount,
							status: values.status,
							paidAt: values.paidAt ?? null,
						}
						: p,
				),
			);
			showToast(`Data pembayaran ${values.tenantName} berhasil diperbarui`);
		} else {
			const newPayment: PaymentItem = {
				id: `pay-${Date.now()}`,
				tenantName: values.tenantName,
				roomNumber: values.roomNumber,
				period: values.period,
				dueDate: values.dueDate,
				amount: values.amount,
				status: values.status,
				paidAt: values.paidAt ?? null,
			};
			setPayments((prev) => [newPayment, ...prev]);
			showToast(`Pembayaran ${values.tenantName} berhasil dicatat`);
		}
	};

	const handleDeleteConfirm = () => {
		if (!deletingPayment) return;
		setPayments((prev) => prev.filter((p) => p.id !== deletingPayment.id));
		showToast(`Data pembayaran ${deletingPayment.tenantName} telah dihapus`);
		setDeletingPayment(null);
	};

	const handleSendReminder = (p: PaymentItem) => {
		showToast(`Reminder WhatsApp dikirim ke ${p.tenantName}`);
	};

	const handleMarkPaid = (p: PaymentItem) => {
		const today = new Date().toISOString().slice(0, 10);
		setPayments((prev) =>
			prev.map((item) =>
				item.id === p.id ? { ...item, status: "PAID", paidAt: today } : item,
			),
		);
		showToast(`Pembayaran ${p.tenantName} dikonfirmasi lunas`);
	};

	// ─── Render ──────────────────────────────────────────────────────────
	return (
		<>
			{/* Toast */}
			<div
				className={`toast ${toastMessage ? "show" : ""}`}
				role="status"
				aria-live="polite"
			>
				{toastMessage}
			</div>

			{/* Page Header */}
			<div className="page-head">
				<div>
					<h1>Pembayaran</h1>
					<p>Monitor pembayaran sewa dan tindak lanjuti yang jatuh tempo.</p>
				</div>
				<div className="actions">
					<Button
						type="button"
						onClick={handleOpenAdd}
						className="h-[38px] px-4 text-xs font-semibold rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white flex items-center gap-1.5"
					>
						<Plus className="w-3.5 h-3.5" />
						Catat Pembayaran
					</Button>
				</div>
			</div>

			{/* ── 3 KPI Stat Cards ──────────────────────────────────────────── */}
			<div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				{/* Sudah Dibayar */}
				<Card className="stat p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]">
					<div className="stat-top">
						<span>Sudah Dibayar</span>
						<span className="stat-icon">
							<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
						</span>
					</div>
					<div className="stat-value text-[#5f896d]">
						{formatRupiah(stats.paidTotal).replace("Rp", "Rp")}
					</div>
					<div className="stat-sub">
						<span className="up">{stats.paidCount} penghuni</span>
					</div>
				</Card>

				{/* Jatuh Tempo */}
				<Card className="stat p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]">
					<div className="stat-top">
						<span>Jatuh Tempo</span>
						<span className="stat-icon">
							<Clock className="w-4 h-4 text-[#b18a4b]" />
						</span>
					</div>
					<div className="stat-value">{formatRupiah(stats.pendingTotal)}</div>
					<div className="stat-sub">
						<span className="warn">{stats.pendingCount} penghuni</span>
					</div>
				</Card>

				{/* Terlambat */}
				<Card className="stat p-[18px_19px] ring-0 border-[#e4e9e4] rounded-[10px]">
					<div className="stat-top">
						<span>Terlambat</span>
						<span className="stat-icon">
							<TriangleAlert className="w-4 h-4 text-[#b66b68]" />
						</span>
					</div>
					<div className="stat-value text-[#b66b68]">
						{formatRupiah(stats.overdueTotal)}
					</div>
					<div className="stat-sub">
						<span className="warn">{stats.overdueCount} penghuni</span>
					</div>
				</Card>
			</div>

			{/* ── Payment Reminder Panel ─────────────────────────────────────── */}
			{attentionPayments.length > 0 && (
				<div className="card panel reminder-panel" style={{ marginBottom: 16 }}>
					<div className="panel-head">
						<div>
							<h2>Payment Reminder</h2>
							<p>
								Penghuni yang masa sewa atau pembayarannya mendekati tenggat
								akan mendapat pengingat otomatis.
							</p>
						</div>
						<span className="badge green">
							<Bell className="inline w-3 h-3 mr-1 -mt-0.5" />
							Otomatis
						</span>
					</div>
					<div className="attention">
						{attentionPayments.slice(0, 4).map((p) => (
							<div key={p.id} className="attention-item">
								<div className="att-icon">
									{p.status === "OVERDUE" ? (
										<TriangleAlert className="w-4 h-4 text-[#b66b68]" />
									) : (
										<CreditCard className="w-4 h-4 text-[#b18a4b]" />
									)}
								</div>
								<div>
									<strong>
										{p.tenantName} · {p.roomNumber}
									</strong>
									<span>
										{p.status === "OVERDUE"
											? `Terlambat sejak ${formatDueDate(p.dueDate)}`
											: `Jatuh tempo ${formatDueDate(p.dueDate)}`}{" "}
										· {formatRupiah(p.amount)}
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										className="row-action"
										onClick={() => handleSendReminder(p)}
									>
										<Send className="inline w-3 h-3 mr-1 -mt-0.5" />
										Kirim Reminder
									</button>
									<button
										type="button"
										className="row-action"
										style={{
											background: "#e8f2ea",
											color: "#568062",
											borderColor: "#c8e0cc",
										}}
										onClick={() => handleMarkPaid(p)}
									>
										<CheckCircle2 className="inline w-3 h-3 mr-1 -mt-0.5" />
										Konfirmasi Bayar
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ── Payment Table Panel ────────────────────────────────────────── */}
			<div className="card panel">
				{/* Toolbar: title + filters */}
				<div className="toolbar">
					<div>
						<b style={{ fontSize: 12 }}>Daftar pembayaran</b>
					</div>
					<div className="actions" style={{ gap: 8 }}>
						{/* Filter Bulan */}
						<Select
							value={filterMonth}
							onValueChange={(v) => v && setFilterMonth(v)}
						>
							<SelectTrigger className="h-[32px] px-3 text-[11px] font-medium rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] min-w-[130px] focus:ring-0">
								<SelectValue className="text-sm" />
							</SelectTrigger>
							<SelectContent>
								{MONTHS.map((m) => (
									<SelectItem key={m} value={m} className="text-[11px]">
										{m}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Filter Status */}
						<Select
							value={filterStatus}
							onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
						>
							<SelectTrigger className="h-[32px] px-3 text-[11px] font-medium rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] min-w-[130px] focus:ring-0">
								<SelectValue className={"text-sm"} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all" className="text-[11px]">
									Semua status
								</SelectItem>
								<SelectItem value="PAID" className="text-[11px]">
									Sudah bayar
								</SelectItem>
								<SelectItem value="PENDING" className="text-[11px]">
									Jatuh tempo
								</SelectItem>
								<SelectItem value="OVERDUE" className="text-[11px]">
									Terlambat
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Table */}
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Penghuni</th>
								<th>Kamar</th>
								<th>Periode</th>
								<th>Jatuh Tempo</th>
								<th>Nominal</th>
								<th>Status</th>
								<th>Aksi</th>
							</tr>
						</thead>
						<tbody>
							{filteredPayments.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										style={{
											textAlign: "center",
											padding: "32px 0",
											color: "#8a958d",
											fontSize: 11,
										}}
									>
										Tidak ada data pembayaran untuk filter ini.
									</td>
								</tr>
							) : (
								filteredPayments.map((p) => (
									<tr key={p.id}>
										<td>
											<b>{p.tenantName}</b>
										</td>
										<td>{p.roomNumber}</td>
										<td>{p.period}</td>
										<td>{formatDueDate(p.dueDate)}</td>
										<td>
											<span style={{ fontWeight: 500 }}>
												{formatRupiah(p.amount)}
											</span>
										</td>
										<td>
											<span className={STATUS_BADGE[p.status]}>
												{STATUS_LABEL[p.status]}
											</span>
										</td>
										<td>
											{/* Contextual action buttons per status */}
											<div
												style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
											>
												{(p.status === "PENDING" || p.status === "OVERDUE") && (
													<>
														<button
															type="button"
															className="row-action"
															onClick={() => handleSendReminder(p)}
															title="Kirim reminder WhatsApp"
														>
															Kirim Reminder
														</button>
														<button
															type="button"
															className="row-action"
															style={{
																background: "#e8f2ea",
																color: "#568062",
																borderColor: "#c8e0cc",
															}}
															onClick={() => handleMarkPaid(p)}
															title="Konfirmasi pembayaran masuk"
														>
															Konfirmasi Bayar
														</button>
													</>
												)}
												{p.status === "PAID" && (
													<button
														type="button"
														className="row-action"
														onClick={() => handleOpenEdit(p)}
														title="Lihat atau edit detail"
													>
														Lihat Detail
													</button>
												)}
												{/* Edit & Delete always available */}
												<button
													type="button"
													className="row-action"
													onClick={() => handleOpenEdit(p)}
													title="Edit data"
													style={{ padding: "4px 7px" }}
												>
													<Pencil className="w-3 h-3" />
												</button>
												<button
													type="button"
													className="row-action danger-text"
													onClick={() => setDeletingPayment(p)}
													title="Hapus data"
													style={{ padding: "4px 7px" }}
												>
													<Trash2 className="w-3 h-3" />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Table footer: row count */}
				<div
					style={{
						padding: "10px 0 2px",
						fontSize: 10,
						color: "#98a29a",
						fontWeight: 500,
						textAlign: "right",
					}}
				>
					{filteredPayments.length} data pembayaran
				</div>
			</div>

			{/* ── Modals ────────────────────────────────────────────────────── */}
			<PaymentFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				editingPayment={editingPayment}
				onSubmit={handleFormSubmit}
			/>

			<PaymentDeleteDialog
				payment={deletingPayment}
				onOpenChange={(open) => !open && setDeletingPayment(null)}
				onConfirm={handleDeleteConfirm}
			/>
		</>
	);
}
