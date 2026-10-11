import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import type { PaymentItem } from "../../common/types/index.ts";
import type {
	ConfirmPaymentInput,
	CreateManualInvoiceInput,
	GenerateMonthlyInvoicesInput,
} from "../../common/validations/index.ts";
import {
	PAYMENT_STATUS_OPTIONS,
	PaymentConfirmDialog,
	PaymentDeleteDialog,
	type PaymentFilterOption,
	PaymentFormDialog,
	PaymentGenerateDialog,
	PaymentMetrics,
	PaymentTable,
} from "../../components/payment/index.ts";
import {
	paymentStatsQueryOptions,
	paymentsQueryOptions,
	propertiesQueryOptions,
	tenantsQueryOptions,
	useConfirmPayment,
	useCreateManualInvoice,
	useDashboardContext,
	useDeleteInvoice,
	useGenerateMonthlyInvoices,
	useInfinitePayments,
	usePaymentStats,
	useProperties,
	useSendWhatsAppInvoice,
	useTenants,
} from "../../hooks/index.ts";
import { getMonthName } from "../../lib/date-utils.ts";

export const Route = createFileRoute("/dashboard/payments")({
	head: () => ({
		meta: [
			{
				title: "Monitoring Pembayaran & Tagihan Sewa — HomeeKost Management",
			},
		],
	}),
	loader: async ({ context }) => {
		const activePropertyId = context.dashboard?.activeProperty?.id;
		await Promise.all([
			context.queryClient.ensureQueryData(
				paymentsQueryOptions({ propertyId: activePropertyId }),
			),
			context.queryClient.ensureQueryData(
				paymentStatsQueryOptions({ propertyId: activePropertyId }),
			),
			context.queryClient.ensureQueryData(
				tenantsQueryOptions(activePropertyId),
			),
			context.queryClient.ensureQueryData(propertiesQueryOptions()),
		]);
	},
	component: PaymentsPage,
});

const DEFAULT_PAYMENT_STATUS_OPTION = PAYMENT_STATUS_OPTIONS[0];

function PaymentsPage() {
	const dashboardContext = useDashboardContext();
	const activePropertyId = dashboardContext.activeProperty?.id;

	const { data: properties = [] } = useProperties();
	const { data: propertyTenants = [] } = useTenants(activePropertyId);
	const { data: allTenants = [] } = useTenants();
	const availableTenants =
		propertyTenants.length > 0 ? propertyTenants : allTenants;

	const now = new Date();
	const currentPeriodVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	const [periodFilter, setPeriodFilter] = useState<string>(currentPeriodVal);

	const periodOptions = useMemo(() => {
		const curY = now.getFullYear();
		const curM = now.getMonth() + 1;
		const currentVal = `${curY}-${String(curM).padStart(2, "0")}`;
		const options = [
			{ label: `Bulan Ini (${getMonthName(curM)} ${curY})`, value: currentVal },
			{ label: "Semua Periode", value: "ALL" },
		];
		for (let offset = -6; offset <= 6; offset++) {
			if (offset === 0) continue;
			const d = new Date(curY, curM - 1 + offset, 1);
			const y = d.getFullYear();
			const m = d.getMonth() + 1;
			const val = `${y}-${String(m).padStart(2, "0")}`;
			const label = `${getMonthName(m)} ${y}`;
			options.push({ label, value: val });
		}
		return options;
	}, []);

	const { selectedMonth, selectedYear, periodLabel } = useMemo(() => {
		if (periodFilter === "ALL") {
			return {
				selectedMonth: undefined,
				selectedYear: undefined,
				periodLabel: "Semua Periode",
			};
		}
		const [yStr, mStr] = periodFilter.split("-");
		const m = Number(mStr);
		const y = Number(yStr);
		const isCurrent =
			m === now.getMonth() + 1 && y === now.getFullYear();
		return {
			selectedMonth: m,
			selectedYear: y,
			periodLabel: isCurrent
				? `Bulan Ini (${getMonthName(m)} ${y})`
				: `${getMonthName(m)} ${y}`,
		};
	}, [periodFilter]);

	// Filter and Sort states
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<PaymentFilterOption>(
		DEFAULT_PAYMENT_STATUS_OPTION,
	);
	const [sortBy, setSortBy] = useState<"dueDate" | "amount" | "createdAt">(
		"dueDate",
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

	// Queries (Infinite Scroll)
	const {
		data: infinitePaymentsData,
		isLoading: isLoadingPayments,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	} = useInfinitePayments({
		propertyId: activePropertyId,
		status: statusFilter.value as "ALL" | "PENDING" | "PAID" | "OVERDUE",
		month: selectedMonth,
		year: selectedYear,
		search: searchQuery,
		sortBy,
		sortOrder,
		limit: 15,
	});

	const allPayments = useMemo(() => {
		return infinitePaymentsData?.pages.flatMap((page) => page.data) || [];
	}, [infinitePaymentsData]);

	const totalPaymentsCount =
		infinitePaymentsData?.pages[0]?.totalCount || 0;

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
					`Pesan WhatsApp berhasil dikirim ke ${payment.tenantName} (${payment.tenantPhone})`,
				);
			} else {
				showToast(
					`Fonnte: ${res?.detail || "Gagal mengirim. Pastikan device tersambung & nomor WA valid."}`,
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
			showToast("Data pembayaran / tagihan berhasil dihapus.");
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
						notifikasi WhatsApp otomatis
					</p>
				</div>
			</div>

			{/* ─── Metric Cards ───────────────────────────────────────────── */}
			<PaymentMetrics
				stats={paymentStats}
				isLoading={isLoadingStats}
				periodLabel={periodLabel}
			/>

			{/* ─── TanStack Table View with Filters & Real-time Search ───────── */}
			<PaymentTable
				payments={allPayments}
				totalCount={totalPaymentsCount}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				periodFilter={periodFilter}
				onPeriodFilterChange={setPeriodFilter}
				periodOptions={periodOptions}
				sortBy={sortBy}
				sortOrder={sortOrder}
				onSortToggle={handleSortToggle}
				isLoading={isLoadingPayments}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				onLoadMore={() => fetchNextPage()}
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
				tenants={availableTenants}
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
