import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type { InvoiceItem } from "../../common/types/index.ts";
import type { InvoiceFormValues } from "../../common/validations/index.ts";
import {
	DEFAULT_TENANT_OPTIONS,
	InvoiceDocPreview,
	InvoiceFormDialog,
} from "../../components/invoice/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

export const Route = createFileRoute("/dashboard/invoices")({
	head: () => ({
		meta: [{ title: "Invoice Digital — HomeeKost Management" }],
	}),
	component: InvoicesPage,
});

// ─── Initial Mock Invoices Data (Matching KostManagement.html) ────────────────
const INITIAL_INVOICES: InvoiceItem[] = [
	{
		id: "inv-21",
		number: "#INV-0021",
		tenantName: "Alya Putri",
		roomNumber: "A-03",
		tenantPhone: "0812 3456 7890",
		period: "Agustus 2026",
		createdDate: "2026-08-07",
		dueDate: "2026-08-10",
		description: "Sewa kamar A-03",
		amount: 850000,
		status: "PENDING",
		facilitiesIncluded: ["Internet", "Air Bersih", "Keamanan 24 Jam"],
	},
	{
		id: "inv-20",
		number: "#INV-0020",
		tenantName: "Dinda Maharani",
		roomNumber: "B-01",
		tenantPhone: "0819 6622 1100",
		period: "Agustus 2026",
		createdDate: "2026-08-05",
		dueDate: "2026-08-20",
		description: "Sewa kamar B-01",
		amount: 900000,
		status: "PAID",
		paidAt: "2026-08-06",
		facilitiesIncluded: ["Internet", "Air Bersih", "Keamanan 24 Jam"],
	},
	{
		id: "inv-19",
		number: "#INV-0019",
		tenantName: "Nabila Putri",
		roomNumber: "B-02",
		tenantPhone: "0821 7788 9900",
		period: "Agustus 2026",
		createdDate: "2026-08-03",
		dueDate: "2026-08-12",
		description: "Sewa kamar B-02",
		amount: 950000,
		status: "PENDING",
		facilitiesIncluded: ["Internet", "Air Bersih", "Keamanan 24 Jam"],
	},
	{
		id: "inv-18",
		number: "#INV-0018",
		tenantName: "Sarah Anindita",
		roomNumber: "C-01",
		tenantPhone: "0813 2255 4412",
		period: "Agustus 2026",
		createdDate: "2026-08-01",
		dueDate: "2026-08-15",
		description: "Sewa kamar C-01",
		amount: 1200000,
		status: "PAID",
		paidAt: "2026-08-02",
		facilitiesIncluded: ["Internet", "Air Bersih", "Keamanan 24 Jam"],
	},
];

function InvoicesPage() {
	const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
		INITIAL_INVOICES[0]?.id || "",
	);
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => {
			setToastMessage(null);
		}, 3000);
	};

	// Generate next invoice sequence number
	const nextInvoiceNumber = useMemo(() => {
		const numbers = invoices
			.map((inv) => {
				const match = inv.number.match(/\d+/);
				return match ? parseInt(match[0], 10) : 0;
			})
			.filter(Boolean);
		const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 21;
		return `#INV-${String(maxNumber + 1).padStart(4, "0")}`;
	}, [invoices]);

	// Active invoice for right-panel preview
	const selectedInvoice = useMemo(() => {
		return (
			invoices.find((inv) => inv.id === selectedInvoiceId) ||
			invoices[0] ||
			null
		);
	}, [invoices, selectedInvoiceId]);

	// Handler: Add new invoice from form dialog
	const handleCreateInvoice = (values: InvoiceFormValues) => {
		const matchedTenant = DEFAULT_TENANT_OPTIONS.find(
			(t) => t.name === values.tenantName,
		);

		const newInvoice: InvoiceItem = {
			id: `inv-${Date.now()}`,
			number: values.number,
			tenantName: values.tenantName,
			roomNumber: values.roomNo,
			tenantPhone: matchedTenant?.phone || "08xxxxxxxxxx",
			period: values.period,
			createdDate: values.created,
			dueDate: values.created,
			description: values.description,
			amount: values.amount,
			status: values.status,
			facilitiesIncluded: ["Internet", "Air Bersih", "Keamanan 24 Jam"],
		};

		setInvoices((prev) => [newInvoice, ...prev]);
		setSelectedInvoiceId(newInvoice.id);
		showToast(`Invoice ${newInvoice.number} berhasil dibuat`);
	};

	const handleSendWhatsApp = (inv: InvoiceItem) => {
		showToast(
			`Invoice ${inv.number} dikirim melalui WhatsApp ke ${inv.tenantName}`,
		);
	};

	const handleDownloadPdf = (inv: InvoiceItem) => {
		showToast(`PDF Invoice ${inv.number} siap diunduh`);
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
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Invoice
					</h1>
					<p className="text-xs text-[#737873] mt-1">
						Buat, kirim, dan pantau invoice sewa secara digital.
					</p>
				</div>
				<Button
					type="button"
					className="bg-sage-dark hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
					onClick={() => setIsFormOpen(true)}
				>
					<Plus className="w-4 h-4 mr-1.5" />
					Buat Invoice
				</Button>
			</div>

			{/* Invoice Preview Split View */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 items-start">
				{/* Left Column: List of Invoices */}
				<Card className="bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] overflow-hidden">
					<div className="p-4 border-b border-[#e4e9e4] bg-white flex items-center justify-between">
						<b className="text-xs font-bold text-[#252925]">Invoice terbaru</b>
						<span className="text-[10px] text-[#737873]">
							{invoices.length} Dokumen
						</span>
					</div>

					<div className="divide-y md:min-h-106.25 divide-[#e4e9e4]">
						{invoices.map((inv) => {
							const isSelected = selectedInvoice?.id === inv.id;
							const isPaid = inv.status === "PAID";

							return (
								<button
									key={inv.id}
									type="button"
									onClick={() => setSelectedInvoiceId(inv.id)}
									className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
										isSelected
											? "bg-[#e8f0ea]/50 border-l-4 border-l-sage-dark"
											: "hover:bg-[#fbfcfb]"
									}`}
								>
									<div>
										<strong
											className={`text-xs block ${isSelected ? "text-sage-dark font-bold" : "text-[#252925]"}`}
										>
											{inv.number}
										</strong>
										<small className="block text-[#737873] text-[10px] mt-0.5">
											{inv.tenantName} · {inv.roomNumber}
										</small>
									</div>

									<div className="text-right">
										<span
											className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
												isPaid
													? "bg-[#e8f2ea] text-[#568062]"
													: "bg-[#f6f0e4] text-[#99773d]"
											}`}
										>
											{isPaid ? "Lunas" : "Belum bayar"}
										</span>
										<small className="block text-[#252925] font-semibold text-[11px] mt-1">
											{formatRupiah(inv.amount)}
										</small>
									</div>
								</button>
							);
						})}

						{invoices.length === 0 && (
							<div className="p-8 text-center text-xs text-[#737873]">
								Belum ada invoice yang dibuat.
							</div>
						)}
					</div>
				</Card>

				{/* Right Column: Live Invoice Preview Document */}
				<InvoiceDocPreview
					invoice={selectedInvoice}
					propertyName="HomeeKost"
					onSendWhatsApp={handleSendWhatsApp}
					onDownloadPdf={handleDownloadPdf}
				/>
			</div>

			{/* Modal Form Dialog */}
			<InvoiceFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				nextInvoiceNumber={nextInvoiceNumber}
				onSubmit={handleCreateInvoice}
			/>
		</div>
	);
}
