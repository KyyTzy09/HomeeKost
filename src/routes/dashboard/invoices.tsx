import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
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
import type { InvoiceItem } from "../../common/types/index.ts";
import type { CreateManualInvoiceInput } from "../../common/validations/index.ts";
import { InvoiceDocPreview } from "../../components/invoice/index.ts";
import { PaymentFormDialog } from "../../components/payment/index.ts";
import {
	useCreateManualInvoice,
	useDashboardContext,
	usePayments,
	useTenants,
} from "../../hooks/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

export const Route = createFileRoute("/dashboard/invoices")({
	head: () => ({
		meta: [
			{
				title: "Invoice & Kwitansi Digital Resmi — HomeeKost Management",
			},
		],
	}),
	component: InvoicesPage,
});

const STATUS_OPTIONS = [
	{ label: "Semua Dokumen", value: "ALL" },
	{ label: "Menunggu Bayar", value: "PENDING" },
	{ label: "Sudah Lunas", value: "PAID" },
	{ label: "Terlambat", value: "OVERDUE" },
];

const DEFAULT_STATUS_OPTION = STATUS_OPTIONS[0];

function InvoicesPage() {
	const dashboardContext = useDashboardContext();
	const activeProperty = dashboardContext.activeProperty;
	const activePropertyId = activeProperty?.id;

	const { data: tenants = [] } = useTenants(activePropertyId);

	// Filters & Search states
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<{
		label: string;
		value: string;
	}>(DEFAULT_STATUS_OPTION);
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
	const [mobileTab, setMobileTab] = useState<"list" | "preview">("list");
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => {
			setToastMessage(null);
		}, 4000);
	};

	// Query invoices from database
	const { data: paymentsData, isLoading: isLoadingInvoices } = usePayments({
		propertyId: activePropertyId,
		status: statusFilter.value as "ALL" | "PENDING" | "PAID" | "OVERDUE",
		search: searchQuery,
		limit: 50,
	});

	// Adapt PaymentItem list into InvoiceItem list
	const invoices: InvoiceItem[] = useMemo(() => {
		if (!paymentsData?.data) return [];
		return paymentsData.data.map((p) => ({
			id: p.id,
			number: p.invoiceNumber,
			tenantName: p.tenantName,
			roomNumber: p.roomNumber,
			tenantPhone: p.tenantPhone,
			period: p.period,
			createdDate: p.rawDueDate,
			dueDate: p.rawDueDate,
			paidAt: p.paidAt,
			description: `Biaya Sewa Kamar ${p.roomNumber}`,
			amount: p.amount,
			status: p.status,
			facilitiesIncluded: ["Wi-Fi", "Air Bersih", "Keamanan 24 Jam"],
		}));
	}, [paymentsData]);

	// Selected active invoice
	const selectedInvoice = useMemo(() => {
		if (selectedInvoiceId) {
			const found = invoices.find((inv) => inv.id === selectedInvoiceId);
			if (found) return found;
		}
		return invoices[0] || null;
	}, [invoices, selectedInvoiceId]);

	// Mutations
	const createInvoiceMutation = useCreateManualInvoice();

	const handleCreateInvoice = async (data: CreateManualInvoiceInput) => {
		try {
			await createInvoiceMutation.mutateAsync(data);
			setIsFormOpen(false);
			showToast("Invoice tagihan resmi baru berhasil diterbitkan.");
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menerbitkan invoice baru.");
		}
	};

	const handleDownloadPdf = (_inv: InvoiceItem) => {
		window.print();
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 print:hidden">
					<MessageSquare className="w-4 h-4 text-[#8fa594]" />
					<span>{toastMessage}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-[#252925] tracking-tight">
						Invoice & Kwitansi Digital Resmi
					</h1>
					<p className="text-xs text-[#737873] mt-1">
						Kelola dokumen faktur tagihan sewa dan kwitansi lunas berformat PDF
						resmi untuk seluruh penghuni
					</p>
				</div>
				<Button
					type="button"
					className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-sm cursor-pointer"
					onClick={() => setIsFormOpen(true)}
				>
					<Plus className="w-4 h-4 mr-1.5" />
					Buat Invoice Manual
				</Button>
			</div>

			{/* Mobile/Tablet Segmented Switcher (Visible on < lg screens) */}
			<div className="flex lg:hidden bg-[#e8f0ea] p-1 rounded-xl gap-1 border border-[#d2e0d5] print:hidden">
				<button
					type="button"
					onClick={() => setMobileTab("list")}
					className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
						mobileTab === "list"
							? "bg-white text-[#4f6958] shadow-sm"
							: "text-[#737873] hover:text-[#252925]"
					}`}
				>
					Daftar Tagihan ({invoices.length})
				</button>
				<button
					type="button"
					onClick={() => setMobileTab("preview")}
					className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
						mobileTab === "preview"
							? "bg-white text-[#4f6958] shadow-sm"
							: "text-[#737873] hover:text-[#252925]"
					}`}
				>
					Pratinjau Dokumen{" "}
					{selectedInvoice ? `(${selectedInvoice.number})` : ""}
				</button>
			</div>

			{/* Invoice Preview Split View */}
			<div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
				{/* Left Column: List of Invoices & Search Filters */}
				<Card
					className={`bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] overflow-hidden print:hidden ${
						mobileTab === "list" ? "block" : "hidden lg:block"
					}`}
				>
					{/* Search & Filter Toolbar */}
					<div className="p-3.5 border-b border-[#e4e9e4] space-y-2.5 bg-[#fbfcfb]">
						<div className="relative">
							<Search className="w-3.5 h-3.5 text-[#737873] absolute left-3 top-1/2 -translate-y-1/2" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Cari nomor invoice / penghuni..."
								className="pl-8.5 pr-8 h-8 text-xs border-[#e4e9e4] bg-white focus-visible:ring-[#4f6958]"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737873] hover:text-[#252925]"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						<div className="flex items-center justify-between gap-2">
							<Select
								value={statusFilter.value}
								onValueChange={(val) => {
									const matched = STATUS_OPTIONS.find((s) => s.value === val);
									if (matched) setStatusFilter(matched);
								}}
							>
								<SelectTrigger className="h-7.5 text-[11px] border-[#e4e9e4] bg-white w-full">
									<SelectValue placeholder="Semua Status">
										{statusFilter.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-xs">
									{STATUS_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<span className="text-[11px] font-semibold text-[#737873] whitespace-nowrap">
								{invoices.length} file
							</span>
						</div>
					</div>

					{/* List Items */}
					<div className="divide-y divide-[#e4e9e4] max-h-[580px] overflow-y-auto">
						{isLoadingInvoices ? (
							<div className="p-8 text-center text-xs text-[#737873]">
								<div className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-[#4f6958] border-t-transparent rounded-full animate-spin" />
									<span>Memuat daftar invoice...</span>
								</div>
							</div>
						) : invoices.length === 0 ? (
							<div className="p-8 text-center text-xs text-[#737873]">
								Tidak ada invoice yang sesuai dengan kriteria.
							</div>
						) : (
							invoices.map((inv) => {
								const isSelected = selectedInvoice?.id === inv.id;
								const isPaid = inv.status === "PAID";
								const isOverdue = inv.status === "OVERDUE";

								return (
									<button
										key={inv.id}
										type="button"
										onClick={() => {
											setSelectedInvoiceId(inv.id);
											setMobileTab("preview");
										}}
										className={`w-full text-left p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
											isSelected
												? "bg-[#e8f0ea]/70 border-l-4 border-l-[#4f6958]"
												: "hover:bg-[#fbfcfb]"
										}`}
									>
										<div>
											<strong
												className={`text-xs block ${
													isSelected
														? "text-[#4f6958] font-bold"
														: "text-[#252925]"
												}`}
											>
												{inv.number}
											</strong>
											<div className="text-[11px] text-[#252925] font-semibold mt-0.5">
												{inv.tenantName}
											</div>
											<small className="block text-[#737873] text-[10px] mt-0.5">
												Kamar <b>{inv.roomNumber}</b> · {inv.period}
											</small>
										</div>

										<div className="text-right flex flex-col items-end">
											<span
												className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
													isPaid
														? "bg-[#e8f2ea] text-[#568062]"
														: isOverdue
															? "bg-[#f7e9e8] text-[#a65f5b]"
															: "bg-[#fbf4e6] text-[#b18a4b]"
												}`}
											>
												{isPaid
													? "Lunas"
													: isOverdue
														? "Terlambat"
														: "Menunggu"}
											</span>
											<small className="block text-[#252925] font-bold text-xs mt-1.5">
												{formatRupiah(inv.amount)}
											</small>
										</div>
									</button>
								);
							})
						)}
					</div>
				</Card>

				{/* Right Column: Live Document Preview */}
				<div
					className={`w-full ${mobileTab === "preview" ? "block" : "hidden lg:block"}`}
				>
					<InvoiceDocPreview
						invoice={selectedInvoice}
						propertyName={activeProperty?.name || "HomeeKost Management"}
						onDownloadPdf={handleDownloadPdf}
					/>
				</div>
			</div>

			{/* Modal Form Dialog */}
			<PaymentFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				tenants={tenants}
				onSubmit={handleCreateInvoice}
				isSubmitting={createInvoiceMutation.isPending}
			/>
		</div>
	);
}
