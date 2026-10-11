import { CheckCircle2, MessageSquare, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Checkbox } from "../../common/shadcn/checkbox.tsx";
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
import type { PaymentItem } from "../../common/types/index.ts";
import type { ConfirmPaymentInput } from "../../common/validations/index.ts";
import { formatRupiah } from "../../lib/currency.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";

interface PaymentConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payment: PaymentItem | null;
	onConfirm: (data: ConfirmPaymentInput) => void;
	isSubmitting?: boolean;
}

const PAYMENT_METHOD_OPTIONS: {
	label: string;
	value: "TRANSFER" | "CASH" | "QRIS";
}[] = [
	{ label: "Transfer Bank", value: "TRANSFER" },
	{ label: "Tunai (Cash)", value: "CASH" },
	{ label: "QRIS", value: "QRIS" },
];

const DEFAULT_PAYMENT_METHOD_OPTION = PAYMENT_METHOD_OPTIONS[0];

export function PaymentConfirmDialog({
	open,
	onOpenChange,
	payment,
	onConfirm,
	isSubmitting = false,
}: PaymentConfirmDialogProps) {
	const todayStr = useMemo(() => getTodayDateString(), []);

	const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
	const [paidDate, setPaidDate] = useState<string>(todayStr);
	const [paymentMethod, setPaymentMethod] = useState<{
		label: string;
		value: "TRANSFER" | "CASH" | "QRIS";
	}>(DEFAULT_PAYMENT_METHOD_OPTION);
	const [notes, setNotes] = useState<string>("");
	const [sendReceiptWhatsApp, setSendReceiptWhatsApp] = useState<boolean>(true);
	const [customAmountStr, setCustomAmountStr] = useState<string>("");
	const [amountError, setAmountError] = useState<string | null>(null);

	const totalInvoice = payment?.amount ?? 0;
	const alreadyPaid = payment?.paidAmount ?? 0;
	const currentRemaining =
		payment?.remainingAmount !== undefined
			? payment.remainingAmount
			: Math.max(0, totalInvoice - alreadyPaid);

	useEffect(() => {
		if (open && payment) {
			setPaidDate(todayStr);
			setPaymentMethod(DEFAULT_PAYMENT_METHOD_OPTION);
			setNotes("");
			setSendReceiptWhatsApp(true);
			setPaymentType("FULL");
			setCustomAmountStr(String(currentRemaining));
			setAmountError(null);
		}
	}, [open, payment, todayStr, currentRemaining]);

	if (!payment) return null;

	const parsedCustomAmount = Number(customAmountStr.replace(/[^0-9]/g, "")) || 0;
	const payAmount = paymentType === "FULL" ? currentRemaining : parsedCustomAmount;
	const remainingAfter = Math.max(0, currentRemaining - payAmount);
	const isPartial = paymentType === "PARTIAL" && remainingAfter > 0;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (paymentType === "PARTIAL") {
			if (parsedCustomAmount <= 0) {
				setAmountError("Nominal pembayaran cicilan harus lebih dari Rp 0.");
				return;
			}
			if (parsedCustomAmount > currentRemaining) {
				setAmountError(
					`Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(currentRemaining)}).`,
				);
				return;
			}
		}

		onConfirm({
			invoiceId: payment.id,
			paymentMethod: paymentMethod.value,
			paidDate,
			notes: notes.trim() || undefined,
			sendReceiptWhatsApp,
			isPartial,
			amount: paymentType === "PARTIAL" ? parsedCustomAmount : currentRemaining,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[500px] max-h-[88vh] overflow-y-auto p-5 sm:p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="confirm-payment-desc"
			>
				<DialogHeader className="pb-3 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<CheckCircle2
							className={`w-5 h-5 ${isPartial ? "text-[#99773d]" : "text-[#4f6958]"}`}
						/>
						{payment.isPartial
							? "Catat Cicilan / Pelunasan Sewa"
							: "Konfirmasi Pembayaran Sewa"}
					</DialogTitle>
					<DialogDescription
						id="confirm-payment-desc"
						className="text-xs text-[#737873]"
					>
						Catat penerimaan kas secara akurat untuk pelunasan penuh atau cicilan bertahap
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					{/* Ringkasan Invoice Card */}
					<div className="bg-[#f8faf8] border border-[#e4e9e4] rounded-xl p-3.5 space-y-1.5 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-[#737873]">Nomor Tagihan</span>
							<b className="text-[#252925]">{payment.invoiceNumber}</b>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-[#737873]">Nama Penghuni</span>
							<span className="font-semibold text-[#252925]">
								{payment.tenantName} (Kamar {payment.roomNumber})
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-[#737873]">Periode Sewa</span>
							<span className="text-[#252925] font-medium">
								{payment.period}
							</span>
						</div>
						<div className="flex items-center justify-between pt-1.5 border-t border-[#e4e9e4]">
							<span className="text-[#737873]">Total Tagihan Awal</span>
							<span className="font-semibold text-[#252925]">
								{formatRupiah(totalInvoice)}
							</span>
						</div>
						{alreadyPaid > 0 && (
							<div className="flex items-center justify-between">
								<span className="text-[#737873]">Sudah Terbayar Sebelumnya</span>
								<span className="font-semibold text-[#4f6958]">
									{formatRupiah(alreadyPaid)}
								</span>
							</div>
						)}
						<div className="flex items-center justify-between pt-2 border-t border-[#e4e9e4] text-sm">
							<span className="font-bold text-[#252925]">Sisa Tagihan Saat Ini</span>
							<span className="font-bold text-[#b8382e]">
								{formatRupiah(currentRemaining)}
							</span>
						</div>
					</div>

					{/* Opsi Tipe Pembayaran (Penuh vs Cicilan) */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-[#252925] block">
							Skema Pembayaran *
						</Label>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => {
									setPaymentType("FULL");
									setAmountError(null);
								}}
								className={`p-2.5 rounded-xl border text-left transition-all ${
									paymentType === "FULL"
										? "bg-[#e8f0ea] border-[#4f6958] text-[#252925] shadow-xs"
										: "bg-[#fbfcfb] border-[#e4e9e4] text-[#737873] hover:bg-[#f3f7f3]"
								}`}
							>
								<span className="block text-xs font-bold text-[#252925]">
									Lunas Penuh
								</span>
								<span className="text-[10.5px] text-[#4f6958] font-semibold block mt-0.5">
									{formatRupiah(currentRemaining)}
								</span>
							</button>
							<button
								type="button"
								onClick={() => {
									setPaymentType("PARTIAL");
									setAmountError(null);
								}}
								className={`p-2.5 rounded-xl border text-left transition-all ${
									paymentType === "PARTIAL"
										? "bg-[#fbf4ea] border-[#99773d] text-[#252925] shadow-xs"
										: "bg-[#fbfcfb] border-[#e4e9e4] text-[#737873] hover:bg-[#f3f7f3]"
								}`}
							>
								<span className="block text-xs font-bold text-[#99773d]">
									Pembayaran Bertahap / Cicil
								</span>
								<span className="text-[10.5px] text-[#737873] block mt-0.5">
									Tentukan nominal bayar
								</span>
							</button>
						</div>
					</div>

					{/* Field Input Nominal Cicilan jika Mode PARTIAL */}
					{paymentType === "PARTIAL" && (
						<div className="p-3 bg-[#fdfaf3] border border-[#ebd8bc] rounded-xl space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-semibold text-[#99773d]">
									Nominal Bayar Kali Ini (Rp) *
								</Label>
								<span className="text-[11px] text-[#737873]">
									Maks: <b>{formatRupiah(currentRemaining)}</b>
								</span>
							</div>
							<Input
								type="number"
								min={1000}
								max={currentRemaining}
								value={customAmountStr}
								onChange={(e) => {
									setCustomAmountStr(e.target.value);
									setAmountError(null);
								}}
								placeholder="Masukkan nominal yang diterima"
								className="h-9.5 text-xs font-mono font-bold border-[#ebd8bc] bg-white focus-visible:ring-[#99773d]"
							/>
							{amountError && (
								<p className="text-[11px] text-[#b8382e] font-medium">
									{amountError}
								</p>
							)}
							<div className="pt-2 border-t border-[#ebd8bc] flex items-center justify-between text-xs">
								<span className="text-[#737873]">Sisa Tagihan Setelah Ini:</span>
								<b
									className={
										remainingAfter === 0 ? "text-[#4f6958]" : "text-[#b8382e]"
									}
								>
									{formatRupiah(remainingAfter)}{" "}
									{remainingAfter === 0 && "(LUNAS)"}
								</b>
							</div>
						</div>
					)}

					{/* Payment Method & Date */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Metode Pembayaran *
							</Label>
							<Select
								value={paymentMethod.value}
								onValueChange={(val) => {
									const matched = PAYMENT_METHOD_OPTIONS.find(
										(p) => p.value === val,
									);
									if (matched) setPaymentMethod(matched);
								}}
							>
								<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Pilih Metode">
										{paymentMethod.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-xs">
									{PAYMENT_METHOD_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Tanggal Pembayaran *
							</Label>
							<Input
								type="date"
								value={paidDate}
								onChange={(e) => setPaidDate(e.target.value)}
								className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
							/>
						</div>
					</div>

					{/* Notes */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Catatan Tambahan (Opsional)
						</Label>
						<Input
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Contoh: Cicilan ke-1 transfer BCA"
							className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
						/>
					</div>

					{/* Checkbox Send WhatsApp Receipt */}
					<div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f3f7f3] border border-[#e4e9e4]">
						<Checkbox
							id="sendReceipt"
							checked={sendReceiptWhatsApp}
							onCheckedChange={(checked) =>
								setSendReceiptWhatsApp(checked === true)
							}
							className="mt-0.5"
						/>
						<label
							htmlFor="sendReceipt"
							className="text-xs text-[#252925] leading-relaxed cursor-pointer"
						>
							<span className="font-semibold flex items-center gap-1.5">
								<MessageSquare className="w-3.5 h-3.5 text-[#4f6958]" />
								{isPartial
									? "Kirim Bukti Penerimaan Cicilan via WhatsApp"
									: "Kirim Kwitansi Resmi Lunas via WhatsApp"}
							</span>
							<span className="text-[#737873] block mt-0.5 text-[11px]">
								{isPartial
									? "Penghuni akan menerima rincian nominal cicilan yang diterima serta sisa pelunasan tagihan."
									: "Penghuni akan menerima konfirmasi pembayaran lunas dan tautan kwitansi digital resmi secara instan."}
							</span>
						</label>
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
							className={`text-xs font-semibold px-5 h-9 text-white ${
								isPartial
									? "bg-[#99773d] hover:bg-[#856633]"
									: "bg-[#4f6958] hover:bg-[#425949]"
							}`}
							disabled={isSubmitting}
						>
							<Save className="w-3.5 h-3.5 mr-1.5" />
							{isSubmitting
								? "Menyimpan..."
								: isPartial
									? `Catat Cicilan (${formatRupiah(payAmount)})`
									: `Konfirmasi Lunas (${formatRupiah(payAmount)})`}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
