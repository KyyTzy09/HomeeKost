import { DollarSign, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import { Label } from "../../common/shadcn/label.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type {
	PropertyItem,
	TransactionItem,
	TransactionType,
} from "../../common/types/index.ts";
import {
	type TransactionFormValues,
	transactionFormSchema,
} from "../../common/validations/index.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";

interface FinanceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingTransaction: TransactionItem | null;
	properties: PropertyItem[];
	defaultPropertyId?: string;
	onSubmit: (values: TransactionFormValues) => void;
	isSubmitting?: boolean;
}

export const CATEGORY_FORM_OPTIONS = [
	{ label: "Pemasukan Lain-lain", value: "OTHER", type: "INCOME" },
	{ label: "Listrik & Air", value: "UTILITIES", type: "EXPENSE" },
	{ label: "WiFi / Internet", value: "INTERNET", type: "EXPENSE" },
	{ label: "Perbaikan & Pemeliharaan", value: "MAINTENANCE", type: "EXPENSE" },
	{ label: "Gaji & Kebersihan", value: "SALARY", type: "EXPENSE" },
	{ label: "Pengeluaran Lain-lain", value: "OTHER", type: "EXPENSE" },
];

const CLASSIFICATION_OPTIONS = [
	{ label: "Biaya Operasional Rutin", value: "OPERATIONAL" },
	{ label: "Investasi / Aset Baru", value: "INVESTMENT" },
];

const METHOD_OPTIONS = [
	{ label: "Transfer Bank", value: "Transfer" },
	{ label: "Tunai (Cash)", value: "Cash" },
	{ label: "QRIS", value: "QRIS" },
];

export function FinanceFormDialog({
	open,
	onOpenChange,
	editingTransaction,
	properties,
	defaultPropertyId,
	onSubmit,
	isSubmitting = false,
}: FinanceFormDialogProps) {
	const todayStr = useMemo(() => getTodayDateString(), []);

	const initialPropId = useMemo(() => {
		if (editingTransaction?.propertyId) return editingTransaction.propertyId;
		if (defaultPropertyId && defaultPropertyId !== "all")
			return defaultPropertyId;
		if (properties.length > 0) return properties[0].id;
		return "";
	}, [editingTransaction, defaultPropertyId, properties]);

	const [formData, setFormData] = useState<TransactionFormValues>({
		propertyId: initialPropId,
		date: todayStr,
		category: "UTILITIES",
		type: "Expense",
		classification: "OPERATIONAL",
		description: "",
		amount: 0,
		method: "Transfer",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (open) {
			if (editingTransaction) {
				setFormData({
					propertyId: editingTransaction.propertyId || initialPropId,
					date: editingTransaction.rawDate || todayStr,
					category: editingTransaction.categoryKey || "UTILITIES",
					type: editingTransaction.type || "Expense",
					classification: editingTransaction.classification || "OPERATIONAL",
					description: editingTransaction.description || "",
					amount: editingTransaction.amount || 0,
					method: editingTransaction.method || "Transfer",
				});
			} else {
				setFormData({
					propertyId: initialPropId,
					date: todayStr,
					category: "UTILITIES",
					type: "Expense",
					classification: "OPERATIONAL",
					description: "",
					amount: 0,
					method: "Transfer",
				});
			}
			setErrors({});
		}
	}, [open, editingTransaction, initialPropId, todayStr]);

	const handleTypeChange = (newType: TransactionType) => {
		const isIncome = newType === "Income";
		setFormData((prev) => ({
			...prev,
			type: newType,
			category: isIncome ? "OTHER" : "UTILITIES",
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const result = transactionFormSchema.safeParse(formData);

		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const field = issue.path[0];
				if (field && !fieldErrors[String(field)]) {
					fieldErrors[String(field)] = issue.message;
				}
			}
			setErrors(fieldErrors);
			return;
		}

		onSubmit(result.data);
	};

	const availableCategories = useMemo(() => {
		const isIncome = formData.type === "Income" || formData.type === "INCOME";
		return CATEGORY_FORM_OPTIONS.filter((c) =>
			isIncome ? c.type === "INCOME" : c.type === "EXPENSE",
		);
	}, [formData.type]);

	const selectedProperty = properties.find((p) => p.id === formData.propertyId);
	const selectedCategory = availableCategories.find(
		(c) => c.value === formData.category,
	);
	const selectedClassification = CLASSIFICATION_OPTIONS.find(
		(c) => c.value === formData.classification,
	);
	const selectedMethod = METHOD_OPTIONS.find(
		(m) => m.value === formData.method,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[550px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="finance-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<DollarSign className="w-5 h-5 text-[#4f6958]" />
						{editingTransaction
							? "Edit Catatan Transaksi"
							: "Tambah Transaksi Kas Baru"}
					</DialogTitle>
					<DialogDescription
						id="finance-dialog-description"
						className="text-xs text-[#737873]"
					>
						Catat mutasi pemasukan atau pengeluaran operasional kos secara
						terisolasi per cabang
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					{/* Type Selector (Pemasukan vs Pengeluaran Segmented) */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1.5 block">
							Jenis Transaksi
						</Label>
						<div className="grid grid-cols-2 gap-2 p-1 bg-[#f3f7f3] rounded-xl border border-[#e4e9e4]">
							<button
								type="button"
								onClick={() => handleTypeChange("Income")}
								className={`py-2 text-xs font-semibold rounded-lg transition-all ${
									formData.type === "Income" || formData.type === "INCOME"
										? "bg-white text-[#568062] shadow-sm"
										: "text-[#737873] hover:text-[#252925]"
								}`}
							>
								+ Pemasukan (Income)
							</button>
							<button
								type="button"
								onClick={() => handleTypeChange("Expense")}
								className={`py-2 text-xs font-semibold rounded-lg transition-all ${
									formData.type === "Expense" || formData.type === "EXPENSE"
										? "bg-white text-[#a65f5b] shadow-sm"
										: "text-[#737873] hover:text-[#252925]"
								}`}
							>
								- Pengeluaran (Expense)
							</button>
						</div>
					</div>

					{/* Property Selector */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Cabang Kos Terkait *
						</Label>
						<Select
							value={formData.propertyId}
							onValueChange={(val) => {
								if (val) {
									setFormData((prev) => ({ ...prev, propertyId: val }));
								}
							}}
						>
							<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
								<SelectValue placeholder="Pilih Cabang Kos">
									{selectedProperty?.name}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4] text-xs">
								{properties.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.propertyId && (
							<p className="text-[11px] text-[#a65f5b] mt-1">
								{errors.propertyId}
							</p>
						)}
					</div>

					{/* Category & Classification Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Kategori Transaksi *
							</Label>
							<Select
								value={formData.category}
								onValueChange={(val) => {
									if (val) {
										setFormData((prev) => ({ ...prev, category: val }));
									}
								}}
							>
								<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Pilih Kategori">
										{selectedCategory?.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-xs">
									{availableCategories.map((c) => (
										<SelectItem key={c.value + c.label} value={c.value}>
											{c.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{formData.type === "Expense" || formData.type === "EXPENSE" ? (
							<div>
								<Label className="text-xs font-semibold text-[#252925] mb-1 block">
									Klasifikasi Biaya
								</Label>
								<Select
									value={formData.classification}
									onValueChange={(val) => {
										if (val === "OPERATIONAL" || val === "INVESTMENT") {
											setFormData((prev) => ({
												...prev,
												classification: val,
											}));
										}
									}}
								>
									<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
										<SelectValue placeholder="Klasifikasi">
											{selectedClassification?.label}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="bg-white border-[#e4e9e4] text-xs">
										{CLASSIFICATION_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						) : (
							<div>
								<Label className="text-xs font-semibold text-[#252925] mb-1 block">
									Metode Pembayaran
								</Label>
								<Select
									value={formData.method}
									onValueChange={(val) => {
										if (
											val === "Transfer" ||
											val === "Cash" ||
											val === "QRIS"
										) {
											setFormData((prev) => ({
												...prev,
												method: val,
											}));
										}
									}}
								>
									<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
										<SelectValue placeholder="Metode Bayar">
											{selectedMethod?.label}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="bg-white border-[#e4e9e4] text-xs">
										{METHOD_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>

					{/* Amount & Date Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Nominal (Rp) *
							</Label>
							<Input
								type="number"
								min="1000"
								step="1000"
								value={formData.amount || ""}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										amount: Number(e.target.value) || 0,
									}))
								}
								placeholder="Contoh: 1500000"
								className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
							/>
							{errors.amount && (
								<p className="text-[11px] text-[#a65f5b] mt-1">
									{errors.amount}
								</p>
							)}
						</div>

						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Tanggal Transaksi *
							</Label>
							<Input
								type="date"
								value={formData.date}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, date: e.target.value }))
								}
								className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
							/>
							{errors.date && (
								<p className="text-[11px] text-[#a65f5b] mt-1">{errors.date}</p>
							)}
						</div>
					</div>

					{/* Description */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Keterangan / Catatan Tambahan
						</Label>
						<textarea
							rows={3}
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Tuliskan rincian transaksi (misal: Token listrik kamar 101, Pembayaran sewa 1 bulan, dsb)"
							className="w-full border border-[#e4e9e4] rounded-xl p-3 text-xs bg-[#fbfcfb] outline-none focus:border-[#4f6958] focus:ring-1 focus:ring-[#4f6958] resize-none"
						/>
						{errors.description && (
							<p className="text-[11px] text-[#a65f5b] mt-1">
								{errors.description}
							</p>
						)}
					</div>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
							disabled={isSubmitting}
						>
							<Save className="w-3.5 h-3.5 mr-1.5" />
							{isSubmitting
								? "Menyimpan..."
								: editingTransaction
									? "Perbarui Transaksi"
									: "Simpan Transaksi"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
