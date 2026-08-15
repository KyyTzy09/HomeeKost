import { useForm } from "@tanstack/react-form";
import { DollarSign } from "lucide-react";
import { useEffect, useMemo } from "react";
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
	TransactionItem,
	TransactionPaymentMethod,
	TransactionType,
} from "../../common/types/index.ts";
import {
	type TransactionFormValues,
	transactionSchema,
} from "../../common/validations/index.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";

interface FinanceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingTransaction: TransactionItem | null;
	onSubmit: (values: TransactionFormValues) => void;
}

export const PROPERTY_OPTIONS = [
	"Kos A",
	"Kos B",
	"Kos C",
	"Semua Kost",
	"Kost Bahari",
	"HomeeKost",
];

export const CATEGORY_OPTIONS = [
	"Pendapatan",
	"Operasional",
	"Investasi",
	"Maintenance",
	"Utilitas",
	"Gaji & Kebersihan",
	"Lain-lain",
];

export function FinanceFormDialog({
	open,
	onOpenChange,
	editingTransaction,
	onSubmit,
}: FinanceFormDialogProps) {
	const todayStr = useMemo(() => getTodayDateString(), []);

	const form = useForm({
		defaultValues: {
			date: editingTransaction?.rawDate || todayStr,
			property: editingTransaction?.property || "Kos A",
			category: editingTransaction?.category || "Operasional",
			type: (editingTransaction?.type || "Expense") as TransactionType,
			description: editingTransaction?.description || "",
			amount: editingTransaction?.amount || 0,
			method: (editingTransaction?.method ||
				"Transfer") as TransactionPaymentMethod,
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = transactionSchema.safeParse(value);
				if (!res.success) {
					const fieldErrors: Record<string, string> = {};
					for (const issue of res.error.issues) {
						const field = issue.path[0];
						if (field && !fieldErrors[String(field)]) {
							fieldErrors[String(field)] = issue.message;
						}
					}
					return fieldErrors;
				}
				return undefined;
			},
		},
		onSubmit: ({ value }) => {
			onSubmit(value as TransactionFormValues);
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			if (editingTransaction) {
				form.setFieldValue(
					"date",
					editingTransaction.rawDate ||
						(editingTransaction.date.includes("-")
							? editingTransaction.date
							: todayStr),
				);
				form.setFieldValue("property", editingTransaction.property || "Kos A");
				form.setFieldValue(
					"category",
					editingTransaction.category || "Operasional",
				);
				form.setFieldValue("type", editingTransaction.type || "Expense");
				form.setFieldValue("description", editingTransaction.description || "");
				form.setFieldValue("amount", editingTransaction.amount || 0);
				form.setFieldValue("method", editingTransaction.method || "Transfer");
			} else {
				form.reset();
				form.setFieldValue("date", todayStr);
				form.setFieldValue("property", "Kos A");
				form.setFieldValue("category", "Operasional");
				form.setFieldValue("type", "Expense");
				form.setFieldValue("amount", 0);
				form.setFieldValue("method", "Transfer");
			}
		}
	}, [open, editingTransaction, todayStr, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[600px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="finance-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4] flex flex-row items-start justify-between">
					<div>
						<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
							<DollarSign className="w-5 h-5 text-[#4f6958]" />
							{editingTransaction ? "Edit Transaksi" : "Tambah Transaksi"}
						</DialogTitle>
						<DialogDescription
							id="finance-dialog-description"
							className="text-xs text-[#737873] mt-1"
						>
							Masukkan pendapatan atau biaya ke laporan keuangan.
						</DialogDescription>
					</div>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-2"
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						{/* Tanggal Transaksi */}
						<form.Field name="date">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Tanggal
									</Label>
									<Input
										type="date"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
									/>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Properti Kos */}
						<form.Field name="property">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Kost
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Kost" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											{PROPERTY_OPTIONS.map((prop) => (
												<SelectItem key={prop} value={prop} className="text-xs">
													{prop}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Kategori Transaksi */}
						<form.Field name="category">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Kategori
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Kategori" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											{CATEGORY_OPTIONS.map((cat) => (
												<SelectItem key={cat} value={cat} className="text-xs">
													{cat}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Jenis Transaksi (Income / Expense) */}
						<form.Field name="type">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Jenis
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val as TransactionType);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Jenis" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											<SelectItem value="Income" className="text-xs">
												Income (Pemasukan)
											</SelectItem>
											<SelectItem value="Expense" className="text-xs">
												Expense (Pengeluaran)
											</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Keterangan / Deskripsi */}
						<form.Field name="description">
							{(field) => (
								<div className="space-y-1.5 sm:col-span-2">
									<Label className="text-xs font-semibold text-[#252925]">
										Keterangan
									</Label>
									<Input
										placeholder="Contoh: Abonemen WiFi, Sewa Bulanan, DP Teralis"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
									/>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Nominal Transaksi (Strict Numeric Input) */}
						<form.Field name="amount">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Nominal (Rp)
									</Label>
									<Input
										type="text"
										inputMode="numeric"
										placeholder="777000"
										value={
											field.state.value
												? field.state.value.toLocaleString("id-ID")
												: ""
										}
										onKeyDown={(e) => {
											// Allow control keys, prevent letters
											if (
												!/[0-9]/.test(e.key) &&
												![
													"Backspace",
													"Delete",
													"Tab",
													"ArrowLeft",
													"ArrowRight",
													"Enter",
													"Home",
													"End",
												].includes(e.key) &&
												!e.ctrlKey &&
												!e.metaKey
											) {
												e.preventDefault();
											}
										}}
										onChange={(e) => {
											const digits = e.target.value.replace(/\D/g, "");
											field.handleChange(Number(digits) || 0);
										}}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] font-semibold text-right focus-visible:ring-[#8fa594]"
									/>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Metode Bayar */}
						<form.Field name="method">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Metode Bayar
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val)
												field.handleChange(val as TransactionPaymentMethod);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Metode Bayar" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											<SelectItem value="Transfer" className="text-xs">
												Transfer
											</SelectItem>
											<SelectItem value="Cash" className="text-xs">
												Cash
											</SelectItem>
											<SelectItem value="QRIS" className="text-xs">
												QRIS
											</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</div>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
						>
							{editingTransaction ? "Simpan Perubahan" : "Simpan Transaksi"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
