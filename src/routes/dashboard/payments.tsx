import { createFileRoute } from "@tanstack/react-router";
import { Clock, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { PaymentItem } from "../../common/types/index.ts";
import type {
	ConfirmPaymentInput,
	CreateManualInvoiceInput,
	GenerateMonthlyInvoicesInput,
} from "../../common/validations/index.ts";
import {
	PaymentConfirmDialog,
	PaymentDeleteDialog,
	PaymentFormDialog,
	PaymentGenerateDialog,
	PaymentMetrics,
	PaymentTable,
} from "../../components/payment/index.ts";
import {
	useConfirmPayment,
	useCreateManualInvoice,
	useDashboardContext,
	useDeleteInvoice,
	useGenerateMonthlyInvoices,
	usePaymentStats,
	usePayments,
	useProperties,
	useSendWhatsAppInvoice,
	useTenants,
} from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/payments")({
	head: () => ({
		meta: [
			{
				title: "Monitoring Pembayaran & Tagihan Sewa — HomeeKost Management",
			},
		],
	}),
	component: PaymentsPage,
});

function PaymentsPage() {
	const dashboardContext = useDashboardContext();
	const activePropertyId = dashboardContext.activeProperty?.id;

	const { data: properties = [] } = useProperties();
	const { data: tenants = [] } = useTenants(activePropertyId);

	const now = new Date();
	const [selectedMonth] = useState<number>(now.getMonth() + 1);
	const [selectedYear] = useState<number>(now.getFullYear());

	// Filter and Sort states
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [sortBy, setSortBy] = useState<"dueDate" | "amount" | "createdAt">(
		"dueDate",
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [currentPage, setCurrentPage] = useState<number>(1);

	// Modal states
	const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
		null,
	);
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

	// Toast notification
	const [toastMsg, setToastMsg] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMsg(msg);
		setTimeout(() => setToastMsg(null), 4000);
	};

	// Queries
	const { data: paymentsData, isLoading: isLoadingPayments } = usePayments({
		propertyId: activePropertyId,
		status: statusFilter as "ALL" | "PENDING" | "PAID" | "OVERDUE",
		month: selectedMonth,
		year: selectedYear,
		search: searchQuery,
		sortBy,
		sortOrder,
		page: currentPage,
		limit: 10,
	});

	const { data: paymentStats, isLoading: isLoadingStats } = usePaymentStats({
		propertyId: activePropertyId,
		month: selectedMonth,
		year: selectedYear,
	});

	// Mutations
	const confirmPaymentMutation = useConfirmPayment();
	const createInvoiceMutation = useCreateManualInvoice();
	const generateInvoicesMutation = useGenerateMonthlyInvoices();
	const sendWhatsAppMutation = useSendWhatsAppInvoice();
	const deleteInvoiceMutation = useDeleteInvoice();

	// Handlers
	const handleSortToggle = (newSortBy: "dueDate" | "amount" | "createdAt") => {
		if (sortBy === newSortBy) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(newSortBy);
			setSortOrder(newSortBy === "amount" ? "desc" : "asc");
		}
	};

	const handleConfirmPayment = async (data: ConfirmPaymentInput) => {
		try {
			const res = await confirmPaymentMutation.mutateAsync(data);
			setIsConfirmOpen(false);
			setSelectedPayment(null);

			if (res.whatsappSent) {
				showToast(
					"Pembayaran berhasil diverifikasi & Kwitansi telah dikirim ke WhatsApp!",
				);
			} else {
				showToast(
					"Pembayaran berhasil diverifikasi & tercatat di Pemasukan Kas.",
				);
			}
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal memverifikasi pembayaran.");
		}
	};

	const handleCreateManualInvoice = async (data: CreateManualInvoiceInput) => {
		try {
			await createInvoiceMutation.mutateAsync(data);
			setIsFormOpen(false);
			showToast("Tagihan invoice baru berhasil diterbitkan.");
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menerbitkan tagihan manual.");
		}
	};

	const handleGenerateMonthly = async (data: GenerateMonthlyInvoicesInput) => {
		try {
			const res = (await generateInvoicesMutation.mutateAsync(data)) as {
				generatedCount: number;
				success: boolean;
			};
			setIsGenerateOpen(false);
			showToast(
				`Berhasil membuat ${res.generatedCount} tagihan sewa bulanan baru!`,
			);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal membuat tagihan bulanan massal.");
		}
	};

	const handleSendWhatsApp = async (payment: PaymentItem) => {
		try {
			const type =
				payment.status === "PAID"
					? "RECEIPT"
					: payment.dueDaysRemaining <= 3
						? "REMINDER"
						: "NEW_INVOICE";

			const res = (await sendWhatsAppMutation.mutateAsync({
				invoiceId: payment.id,
				type,
			})) as { success?: boolean; detail?: string };

			if (res?.success) {
				showToast(
					`File dokumen & pesan WhatsApp berhasil dikirim ke ${payment.tenantName} (${payment.tenantPhone})`,
				);
			} else {
				showToast(
					`Fonnte: ${res?.detail || "Gagal mengirim. Pastikan device Fonnte tersambung & nomor WA valid."}`,
				);
			}
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal mengirim notifikasi WhatsApp.");
		}
	};

	const handleDelete = async () => {
		if (!selectedPayment) return;
		try {
			await deleteInvoiceMutation.mutateAsync(selectedPayment.id);
			setIsDeleteOpen(false);
			setSelectedPayment(null);
			showToast("Tagihan sewa berhasil dihapus.");
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menghapus tagihan sewa.");
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Toast Notification Popup */}
			{toastMsg && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<MessageSquare className="w-4 h-4 text-[#8fa594]" />
					<span>{toastMsg}</span>
				</div>
			)}

			{/* ─── Page Header ────────────────────────────────────────────── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-[#252925] tracking-tight">
						Monitoring Pembayaran & Tagihan Sewa
					</h1>
					<p className="text-xs text-[#737873] mt-1">
						Pantau jatuh tempo sewa, verifikasi pembayaran lunas, dan kirim
						notifikasi WhatsApp otomatis (Fonnte API)
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsGenerateOpen(true)}
						className="h-9 px-3.5 text-xs font-semibold border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f0ea] shadow-sm"
					>
						<Clock className="w-3.5 h-3.5 mr-1.5 text-[#568062]" />
						Generate Bulanan
					</Button>

					<Button
						type="button"
						onClick={() => setIsFormOpen(true)}
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-sm"
					>
						<Plus className="w-3.5 h-3.5 mr-1.5" />
						Buat Tagihan Manual
					</Button>
				</div>
			</div>

			{/* ─── Metric Cards ───────────────────────────────────────────── */}
			<PaymentMetrics
				stats={paymentStats}
				isLoading={isLoadingStats}
				periodLabel="Bulan Ini"
			/>

			{/* ─── TanStack Table View with Filters & Real-time Search ───────── */}
			<PaymentTable
				payments={paymentsData?.data || []}
				totalCount={paymentsData?.totalCount || 0}
				currentPage={paymentsData?.currentPage || 1}
				totalPages={paymentsData?.totalPages || 1}
				pageSize={paymentsData?.pageSize || 10}
				searchQuery={searchQuery}
				onSearchChange={(q) => {
					setSearchQuery(q);
					setCurrentPage(1);
				}}
				statusFilter={statusFilter}
				onStatusFilterChange={(status) => {
					setStatusFilter(status);
					setCurrentPage(1);
				}}
				sortBy={sortBy}
				sortOrder={sortOrder}
				onSortToggle={handleSortToggle}
				onPageChange={setCurrentPage}
				isLoading={isLoadingPayments}
				onAddNew={() => setIsFormOpen(true)}
				onGenerateMonthly={() => setIsGenerateOpen(true)}
				onConfirmPayment={(p) => {
					setSelectedPayment(p);
					setIsConfirmOpen(true);
				}}
				onSendWhatsApp={handleSendWhatsApp}
				onDelete={(p) => {
					setSelectedPayment(p);
					setIsDeleteOpen(true);
				}}
				isSendingWhatsApp={sendWhatsAppMutation.isPending}
			/>

			{/* ─── Dialogs ─────────────────────────────────────────────────── */}
			<PaymentConfirmDialog
				open={isConfirmOpen}
				onOpenChange={setIsConfirmOpen}
				payment={selectedPayment}
				onConfirm={handleConfirmPayment}
				isSubmitting={confirmPaymentMutation.isPending}
			/>

			<PaymentGenerateDialog
				open={isGenerateOpen}
				onOpenChange={setIsGenerateOpen}
				properties={properties}
				defaultPropertyId={activePropertyId}
				onGenerate={handleGenerateMonthly}
				isGenerating={generateInvoicesMutation.isPending}
			/>

			<PaymentFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				tenants={tenants}
				onSubmit={handleCreateManualInvoice}
				isSubmitting={createInvoiceMutation.isPending}
			/>

			<PaymentDeleteDialog
				open={isDeleteOpen}
				payment={selectedPayment}
				onOpenChange={setIsDeleteOpen}
				onConfirm={handleDelete}
				isDeleting={deleteInvoiceMutation.isPending}
			/>
		</div>
	);
}
