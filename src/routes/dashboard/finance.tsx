import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle2,
	Coins,
	Download,
	Plus,
	Share2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type {
	ProfitLossRow,
	SharedCostItem,
	TransactionItem,
} from "../../common/types/index.ts";
import type {
	AllocationFormValues,
	TransactionFormValues,
} from "../../common/validations/index.ts";
import {
	AllocationFormDialog,
	FinanceCostComposition,
	FinanceFormDialog,
	FinanceNetProfitChart,
	FinanceProfitLossTable,
	FinanceTransactionTable,
	TransactionDetailDialog,
} from "../../components/finance/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

export const Route = createFileRoute("/dashboard/finance")({
	head: () => ({
		meta: [{ title: "Laporan Keuangan & Arus Kas — HomeeKost Management" }],
	}),
	component: FinancePage,
});

// ─── Initial Mock Data ────────────────────────────────────────────────────────
const INITIAL_TRANSACTIONS: TransactionItem[] = [
	{
		id: 1,
		date: "01 Mei",
		rawDate: "2026-05-01",
		property: "Kost Bahari",
		category: "Pendapatan",
		description: "Sewa Bulanan · Jeni",
		type: "Income",
		amount: 1300000,
		method: "Transfer",
	},
	{
		id: 2,
		date: "03 Mei",
		rawDate: "2026-05-03",
		property: "Semua Kost",
		category: "Operasional",
		description: "Abonemen WiFi",
		type: "Expense",
		amount: 777000,
		method: "Transfer",
	},
	{
		id: 3,
		date: "11 Mei",
		rawDate: "2026-05-11",
		property: "HomeeKost",
		category: "Investasi",
		description: "Box Paket",
		type: "Expense",
		amount: 1850000,
		method: "Cash",
	},
	{
		id: 4,
		date: "15 Mei",
		rawDate: "2026-05-15",
		property: "HomeeKost",
		category: "Investasi",
		description: "DP Teralis",
		type: "Expense",
		amount: 500000,
		method: "Transfer",
	},
	{
		id: 5,
		date: "20 Mei",
		rawDate: "2026-05-20",
		property: "Kos A",
		category: "Pendapatan",
		description: "Sewa Bulanan · Alya Putri",
		type: "Income",
		amount: 850000,
		method: "Transfer",
	},
	{
		id: 6,
		date: "25 Mei",
		rawDate: "2026-05-25",
		property: "Kos B",
		category: "Operasional",
		description: "Gaji Penjaga Kost",
		type: "Expense",
		amount: 1500000,
		method: "Transfer",
	},
];

const INITIAL_SHARED_COSTS: SharedCostItem[] = [
	{
		id: 1,
		description: "Abonemen WiFi",
		amount: 777000,
		split: "Rata per kos",
		props: ["Kos A", "Kos B", "Kos C"],
	},
	{
		id: 2,
		description: "Gaji Penjaga Kost",
		amount: 1500000,
		split: "Rata per kos",
		props: ["Kos A", "Kos B", "Kos C"],
	},
	{
		id: 3,
		description: "Sampah",
		amount: 200000,
		split: "Rata per kos",
		props: ["Kos A", "Kos B", "Kos C"],
	},
];

const PROFIT_LOSS_DATA: Record<string, ProfitLossRow[]> = {
	Mei: [
		{
			account: "Total Pendapatan",
			period: "Mei 2026",
			amount: 16450000,
			isTotal: true,
		},
		{
			account: "Kost Bahari",
			period: "Mei 2026",
			amount: 10100000,
			isSubItem: true,
		},
		{
			account: "HomeeKost",
			period: "Mei 2026",
			amount: 6350000,
			isSubItem: true,
		},
		{
			account: "Total Biaya",
			period: "Mei 2026",
			amount: 13711000,
			isTotal: true,
		},
		{
			account: "Investasi",
			period: "Mei 2026",
			amount: 10043000,
			isSubItem: true,
		},
		{
			account: "Operasional",
			period: "Mei 2026",
			amount: 3668000,
			isSubItem: true,
		},
		{
			account: "Laba Bersih",
			period: "Mei 2026",
			amount: 2739000,
			isProfit: true,
		},
	],
	Agustus: [
		{
			account: "Total Pendapatan",
			period: "Agustus 2026",
			amount: 18500000,
			isTotal: true,
		},
		{
			account: "Kost Bahari",
			period: "Agustus 2026",
			amount: 11500000,
			isSubItem: true,
		},
		{
			account: "HomeeKost",
			period: "Agustus 2026",
			amount: 7000000,
			isSubItem: true,
		},
		{
			account: "Total Biaya",
			period: "Agustus 2026",
			amount: 6750000,
			isTotal: true,
		},
		{
			account: "Investasi",
			period: "Agustus 2026",
			amount: 2500000,
			isSubItem: true,
		},
		{
			account: "Operasional",
			period: "Agustus 2026",
			amount: 4250000,
			isSubItem: true,
		},
		{
			account: "Laba Bersih",
			period: "Agustus 2026",
			amount: 11750000,
			isProfit: true,
		},
	],
};

function FinancePage() {
	// Transactions & Shared Costs state
	const [transactions, setTransactions] =
		useState<TransactionItem[]>(INITIAL_TRANSACTIONS);
	const [sharedCosts, setSharedCosts] =
		useState<SharedCostItem[]>(INITIAL_SHARED_COSTS);
	const [selectedMonth, setSelectedMonth] = useState<string>("Mei");

	// Dialog & Toast states
	const [isTxFormOpen, setIsTxFormOpen] = useState<boolean>(false);
	const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);

	const [isAllocFormOpen, setIsAllocFormOpen] = useState<boolean>(false);
	const [editingAlloc, setEditingAlloc] = useState<SharedCostItem | null>(null);

	const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
	const [detailTx, setDetailTx] = useState<TransactionItem | null>(null);

	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => {
			setToastMessage(null);
		}, 3000);
	};

	// Handlers for Transactions
	const handleSaveTransaction = (values: TransactionFormValues) => {
		if (editingTx) {
			setTransactions((prev) =>
				prev.map((t) =>
					t.id === editingTx.id
						? {
								...t,
								date: values.date,
								rawDate: values.date,
								property: values.property,
								category: values.category,
								type: values.type,
								description: values.description,
								amount: values.amount,
								method: values.method,
							}
						: t,
				),
			);
			showToast("Transaksi berhasil diperbarui");
		} else {
			const newTx: TransactionItem = {
				id: Date.now(),
				date: values.date,
				rawDate: values.date,
				property: values.property,
				category: values.category,
				type: values.type,
				description: values.description,
				amount: values.amount,
				method: values.method,
			};
			setTransactions((prev) => [newTx, ...prev]);
			showToast(
				`${values.type === "Income" ? "Pendapatan" : "Biaya"} berhasil ditambahkan`,
			);
		}
		setEditingTx(null);
	};

	const handleDeleteTransaction = (tx: TransactionItem) => {
		setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
		showToast("Transaksi berhasil dihapus");
	};

	// Handlers for Shared Costs
	const handleSaveAllocation = (values: AllocationFormValues) => {
		if (editingAlloc) {
			setSharedCosts((prev) =>
				prev.map((sc) =>
					sc.description === editingAlloc.description
						? {
								...sc,
								description: values.description,
								amount: values.amount,
								split: values.split,
								props: values.props,
							}
						: sc,
				),
			);
			showToast("Alokasi biaya bersama berhasil diperbarui");
		} else {
			const newAlloc: SharedCostItem = {
				id: Date.now(),
				description: values.description,
				amount: values.amount,
				split: values.split,
				props: values.props,
			};
			setSharedCosts((prev) => [...prev, newAlloc]);
			showToast("Biaya bersama berhasil disimpan");
		}
		setEditingAlloc(null);
	};

	const activeProfitLoss =
		PROFIT_LOSS_DATA[selectedMonth] || PROFIT_LOSS_DATA.Mei;

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
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Keuangan
					</h1>
					<p className="text-xs text-[#737873] mt-1">
						Ringkasan pendapatan, biaya, alokasi biaya bersama, dan laba bersih.
					</p>
				</div>
				<div className="flex items-center gap-2.5">
					<Button
						type="button"
						variant="outline"
						className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 shadow-sm"
						onClick={() => showToast("Laporan keuangan siap diunduh")}
					>
						<Download className="w-3.5 h-3.5 mr-1.5" />
						Download Laporan
					</Button>
					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
						onClick={() => {
							setEditingTx(null);
							setIsTxFormOpen(true);
						}}
					>
						<Plus className="w-4 h-4 mr-1.5" />
						Tambah Transaksi
					</Button>
				</div>
			</div>

			{/* Top 4 KPI Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<div className="flex justify-between items-center text-xs text-[#737873]">
						<span>Total Pendapatan</span>
						<div className="w-7 h-7 rounded-lg bg-[#f3f7f3] text-[#5f896d] flex items-center justify-center">
							<ArrowUpRight className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-bold text-[#252925] tracking-tight mt-2.5 mb-1">
						Rp6,8 jt
					</div>
					<div className="text-[11px] text-[#737873]">Bulan berjalan</div>
				</Card>

				<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<div className="flex justify-between items-center text-xs text-[#737873]">
						<span>Total Biaya</span>
						<div className="w-7 h-7 rounded-lg bg-[#f7e9e8] text-[#a65f5b] flex items-center justify-center">
							<ArrowDownRight className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-bold text-[#252925] tracking-tight mt-2.5 mb-1">
						Rp2,1 jt
					</div>
					<div className="text-[11px] text-[#737873]">
						Investasi + operasional
					</div>
				</Card>

				<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<div className="flex justify-between items-center text-xs text-[#737873]">
						<span>Laba Bersih</span>
						<div className="w-7 h-7 rounded-lg bg-[#e8f0ea] text-[#4f6958] flex items-center justify-center">
							<Coins className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-bold text-[#568062] tracking-tight mt-2.5 mb-1">
						Rp4,7 jt
					</div>
					<div className="text-[11px] text-[#737873]">Pendapatan - biaya</div>
				</Card>

				<Card className="p-4 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<div className="flex justify-between items-center text-xs text-[#737873]">
						<span>Biaya Bersama</span>
						<div className="w-7 h-7 rounded-lg bg-[#f6f0e4] text-[#99773d] flex items-center justify-center">
							<Share2 className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-bold text-[#252925] tracking-tight mt-2.5 mb-1">
						Rp2,85 jt
					</div>
					<div className="text-[11px] text-[#99773d] font-medium">
						Perlu dialokasikan
					</div>
				</Card>
			</div>

			{/* Laporan Laba Rugi TanStack Table */}
			<FinanceProfitLossTable
				selectedMonth={selectedMonth}
				onMonthChange={(m) => setSelectedMonth(m)}
				onApply={() =>
					showToast(`Laporan laba rugi bulan ${selectedMonth} diperbarui`)
				}
				data={activeProfitLoss}
			/>

			{/* Visual Charts Grid (2 Columns: Modular Net Profit Trend & Cost Composition) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<FinanceNetProfitChart />
				<FinanceCostComposition />
			</div>

			{/* Biaya Bersama Section */}
			<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e9e4]">
					<div>
						<h2 className="text-sm font-bold text-[#252925]">Biaya Bersama</h2>
						<p className="text-[11px] text-[#737873] mt-0.5">
							Untuk biaya yang digunakan lebih dari satu kost, alokasikan agar
							laporan tiap kost tetap rapi.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						className="h-8 text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] font-semibold"
						onClick={() => {
							setEditingAlloc(null);
							setIsAllocFormOpen(true);
						}}
					>
						<Plus className="w-3.5 h-3.5 mr-1" />
						Tambah Biaya Bersama
					</Button>
				</div>

				<div className="mt-3 mb-4 p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-lg text-[11px] text-[#737873]">
					Contoh dari data keuangan: <b>Abonemen WiFi</b> dan{" "}
					<b>Gaji Penjaga Kost</b> ditandai sebagai biaya bersama. Di sistem,
					biaya tersebut dapat dibagi rata ke properti yang memakai
					fasilitasnya.
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
					{sharedCosts.map((sc) => {
						const perProp = sc.props.length
							? Math.round(sc.amount / sc.props.length)
							: 0;

						return (
							<div
								key={sc.description}
								className="p-4 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl flex flex-col justify-between"
							>
								<div>
									<div className="font-bold text-xs text-[#252925]">
										{sc.description}
									</div>
									<div className="text-[10px] text-[#737873] mt-0.5">
										Fixed Cost · {sc.split}
									</div>

									<div className="mt-3 text-sm font-bold text-[#4f6958]">
										{formatRupiah(sc.amount)}
										<span className="text-[10px] font-normal text-[#737873] block">
											Nilai total
										</span>
									</div>

									<div className="mt-2 text-xs font-semibold text-[#252925]">
										{formatRupiah(perProp)}
										<span className="text-[10px] font-normal text-[#737873] block">
											{sc.props.join(" / ")}
										</span>
									</div>
								</div>

								<div className="mt-4 pt-3 border-t border-[#e4e9e4] flex justify-end">
									<Button
										type="button"
										variant="outline"
										className="h-7 px-3 text-[11px] border-[#e4e9e4] hover:bg-[#e8f0ea] hover:text-[#4f6958]"
										onClick={() => {
											setEditingAlloc(sc);
											setIsAllocFormOpen(true);
										}}
									>
										Atur
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			</Card>

			{/* History Transaksi Section with TanStack Table & Segmented Filter */}
			<FinanceTransactionTable
				transactions={transactions}
				onDetail={(tx) => {
					setDetailTx(tx);
					setIsDetailOpen(true);
				}}
				onEdit={(tx) => {
					setEditingTx(tx);
					setIsTxFormOpen(true);
				}}
				onDelete={handleDeleteTransaction}
			/>

			{/* Dialog Modals */}
			<FinanceFormDialog
				open={isTxFormOpen}
				onOpenChange={setIsTxFormOpen}
				editingTransaction={editingTx}
				onSubmit={handleSaveTransaction}
			/>

			<AllocationFormDialog
				open={isAllocFormOpen}
				onOpenChange={setIsAllocFormOpen}
				editingSharedCost={editingAlloc}
				onSubmit={handleSaveAllocation}
			/>

			<TransactionDetailDialog
				open={isDetailOpen}
				onOpenChange={setIsDetailOpen}
				transaction={detailTx}
				onEdit={(tx) => {
					setEditingTx(tx);
					setIsTxFormOpen(true);
				}}
				onDelete={handleDeleteTransaction}
			/>
		</div>
	);
}
