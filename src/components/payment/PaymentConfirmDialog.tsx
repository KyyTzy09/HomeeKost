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

export function PaymentConfirmDialog({
	open,
	onOpenChange,
	payment,
	onConfirm,
	isSubmitting = false,
}: PaymentConfirmDialogProps) {
	const todayStr = useMemo(() => getTodayDateString(), []);

	const [paidDate, setPaidDate] = useState<string>(todayStr);
	const [paymentMethod, setPaymentMethod] = useState<
		"TRANSFER" | "CASH" | "QRIS"
	>("TRANSFER");
	const [notes, setNotes] = useState<string>("");
	const [sendReceiptWhatsApp, setSendReceiptWhatsApp] = useState<boolean>(true);

	useEffect(() => {
		if (open) {
			setPaidDate(todayStr);
			setPaymentMethod("TRANSFER");
			setNotes("");
			setSendReceiptWhatsApp(true);
		}
	}, [open, todayStr]);

	if (!payment) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onConfirm({
			invoiceId: payment.id,
			paymentMethod,
			paidDate,
			notes: notes.trim() || undefined,
			sendReceiptWhatsApp,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[480px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="confirm-payment-desc"
			>
				<DialogHeader className="pb-3 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<CheckCircle2 className="w-5 h-5 text-[#4f6958]" />
						Konfirmasi Pelunasan Sewa
					</DialogTitle>
					<DialogDescription
						id="confirm-payment-desc"
						className="text-xs text-[#737873]"
					>
						Tandai tagihan sebagai LUNAS dan catat pemasukan kas otomatis
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
						<div className="flex items-center justify-between pt-2 border-t border-[#e4e9e4] text-sm">
							<span className="font-bold text-[#252925]">Total Pelunasan</span>
							<span className="font-bold text-[#4f6958]">
								{formatRupiah(payment.amount)}
							</span>
						</div>
					</div>

					{/* Payment Method & Date */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Metode Pembayaran *
							</Label>
							<Select
								value={paymentMethod}
								onValueChange={(val) => {
									if (val === "TRANSFER" || val === "CASH" || val === "QRIS") {
										setPaymentMethod(val);
									}
								}}
							>
								<SelectTrigger className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Pilih Metode" />
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-xs">
									<SelectItem value="TRANSFER">Transfer Bank</SelectItem>
									<SelectItem value="CASH">Tunai (Cash)</SelectItem>
									<SelectItem value="QRIS">QRIS</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Tanggal Pelunasan *
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
							placeholder="Contoh: Bukti transfer BCA a.n. Alya Putri"
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
							className="text-xs text-[#252925] cursor-pointer select-none leading-relaxed"
						>
							<span className="font-semibold flex items-center gap-1">
								<MessageSquare className="w-3.5 h-3.5 text-[#568062]" />
								Kirim Kwitansi Lunas via WhatsApp Otomatis
							</span>
							<span className="text-[11px] text-[#737873] block mt-0.5">
								Notifikasi pelunasan resmi akan langsung dikirim ke nomor{" "}
								<b>{payment.tenantPhone || "anak kos"}</b> via Fonnte Gateway.
							</span>
						</label>
					</div>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-9 px-4 text-xs font-semibold border-[#e4e9e4] text-[#737873] hover:bg-[#f3f7f3]"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>

						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
						>
							<Save className="w-3.5 h-3.5 mr-1.5" />
							{isSubmitting ? "Menyimpan..." : "Konfirmasi Lunas"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
