import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
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
import {
	type PaymentFormValues,
	type PaymentStatus,
	paymentSchema,
	STATUS_LABEL,
} from "../../common/validations/payment.schema.ts";
import type { PaymentItem } from "./PaymentCard.tsx";

interface PaymentFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingPayment: PaymentItem | null;
	onSubmit: (values: PaymentFormValues) => void;
}

const FIELD_CLASS =
	"h-[43px] border-[#dfe7e0] rounded-[11px] px-[13px] text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20";

const LABEL_CLASS = "block text-[11px] font-bold text-[#506257] mb-[6px]";

const ERROR_CLASS = "text-[10.5px] text-[#b66b68] mt-1 font-medium";

export function PaymentFormDialog({
	open,
	onOpenChange,
	editingPayment,
	onSubmit,
}: PaymentFormDialogProps) {
	const defaultVals: PaymentFormValues = {
		tenantName: editingPayment?.tenantName ?? "",
		roomNumber: editingPayment?.roomNumber ?? "",
		period: editingPayment?.period ?? "",
		dueDate: editingPayment?.dueDate ?? "",
		amount: editingPayment?.amount ?? 0,
		status: (editingPayment?.status as PaymentStatus) ?? "PENDING",
		paidAt: editingPayment?.paidAt ?? null,
	};

	const form = useForm({
		defaultValues: defaultVals,
		onSubmit: async ({ value }) => {
			const result = paymentSchema.safeParse(value);
			if (!result.success) return;
			onSubmit(result.data);
			onOpenChange(false);
		},
	});

	// Reset form whenever dialog opens with new data
	useEffect(() => {
		if (open) {
			form.reset(defaultVals);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, editingPayment?.id]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[560px] rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader className="gap-1 mb-2">
					<DialogTitle className="text-[18px] font-bold text-[#29382e]">
						{editingPayment ? "Edit Data Pembayaran" : "Catat Pembayaran"}
					</DialogTitle>
					<DialogDescription className="text-[11.5px] text-[#8a958d]">
						{editingPayment
							? "Perbarui data pembayaran sewa penghuni."
							: "Tambahkan data pembayaran sewa ke daftar pembayaran."}
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-1"
				>
					{/* Row 1: Penghuni + Kamar */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Penghuni */}
						<form.Field
							name="tenantName"
							validators={{
								onChange: ({ value }) =>
									!value || value.trim().length < 2
										? "Nama penghuni minimal 2 karakter"
										: undefined,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name} className={LABEL_CLASS}>
										Penghuni <span className="text-[#b66b68]">*</span>
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Nama penghuni"
										className={FIELD_CLASS}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className={ERROR_CLASS}>
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Kamar */}
						<form.Field
							name="roomNumber"
							validators={{
								onChange: ({ value }) =>
									!value ? "Nomor kamar wajib diisi" : undefined,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name} className={LABEL_CLASS}>
										Kamar <span className="text-[#b66b68]">*</span>
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="A-03"
										className={FIELD_CLASS}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className={ERROR_CLASS}>
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</div>

					{/* Row 2: Periode + Jatuh Tempo */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Periode */}
						<form.Field
							name="period"
							validators={{
								onChange: ({ value }) =>
									!value
										? "Periode wajib diisi"
										: !/^[A-Za-z]+ \d{4}$/.test(value)
											? "Format: Agustus 2026"
											: undefined,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name} className={LABEL_CLASS}>
										Periode <span className="text-[#b66b68]">*</span>
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Agustus 2026"
										className={FIELD_CLASS}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className={ERROR_CLASS}>
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Jatuh Tempo */}
						<form.Field
							name="dueDate"
							validators={{
								onChange: ({ value }) =>
									!value ? "Tanggal jatuh tempo wajib diisi" : undefined,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name} className={LABEL_CLASS}>
										Jatuh Tempo <span className="text-[#b66b68]">*</span>
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="date"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className={FIELD_CLASS}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className={ERROR_CLASS}>
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</div>

					{/* Row 3: Nominal + Status */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Nominal */}
						<form.Field
							name="amount"
							validators={{
								onChange: ({ value }) =>
									!value || Number(value) < 1
										? "Nominal minimal Rp 1"
										: undefined,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name} className={LABEL_CLASS}>
										Nominal (Rp) <span className="text-[#b66b68]">*</span>
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										min={1}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(Number(e.target.value))}
										placeholder="850000"
										className={FIELD_CLASS}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className={ERROR_CLASS}>
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Status */}
						<form.Field name="status">
							{(field) => (
								<div>
									<Label htmlFor={field.name} className={LABEL_CLASS}>
										Status <span className="text-[#b66b68]">*</span>
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) =>
											field.handleChange(val as PaymentStatus)
										}
									>
										<SelectTrigger
											id={field.name}
											className="h-[43px] border-[#dfe7e0] rounded-[11px] text-[12px] bg-[#fbfcfb] text-[#252925] focus:border-[#8fa594] focus:ring-[#8fa594]/20"
										>
											<SelectValue placeholder="Pilih status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="PAID">{STATUS_LABEL.PAID}</SelectItem>
											<SelectItem value="PENDING">
												{STATUS_LABEL.PENDING}
											</SelectItem>
											<SelectItem value="OVERDUE">
												{STATUS_LABEL.OVERDUE}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>
					</div>

					{/* Row 4: Tanggal Bayar — conditional on status = PAID */}
					<form.Subscribe selector={(s) => s.values.status}>
						{(status) =>
							status === "PAID" ? (
								<form.Field
									name="paidAt"
									validators={{
										onChange: ({ value }) =>
											!value
												? "Tanggal bayar wajib diisi jika status Sudah Bayar"
												: undefined,
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name} className={LABEL_CLASS}>
												Tanggal Bayar <span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												id={field.name}
												name={field.name}
												type="date"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(e.target.value || null)
												}
												className={FIELD_CLASS}
											/>
											{field.state.meta.errors.length > 0 && (
												<p className={ERROR_CLASS}>
													{field.state.meta.errors.join(", ")}
												</p>
											)}
										</div>
									)}
								</form.Field>
							) : null
						}
					</form.Subscribe>

					{/* Footer */}
					<DialogFooter className="pt-3 border-t border-[#edf1ed] mt-5 gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="h-[38px] px-4 text-xs font-semibold rounded-[8px] border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3]"
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="h-[38px] px-5 text-xs font-bold rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white transition-colors"
						>
							{editingPayment ? "Simpan Perubahan" : "Simpan Pembayaran"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
