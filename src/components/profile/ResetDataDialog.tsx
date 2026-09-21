import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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

interface ResetDataDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
	isSubmitting: boolean;
}

export function ResetDataDialog({
	open,
	onOpenChange,
	onConfirm,
	isSubmitting,
}: ResetDataDialogProps) {
	const [confirmationText, setConfirmationText] = useState("");
	const isConfirmed = confirmationText.trim() === "RESET";

	useEffect(() => {
		if (open) {
			setConfirmationText("");
		}
	}, [open]);

	const handleConfirm = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isConfirmed || isSubmitting) return;
		await onConfirm();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[460px] p-6 bg-white rounded-[20px] border-[#efd4d0] shadow-[0_20px_50px_rgba(182,107,104,0.15)]">
				<DialogHeader className="text-left space-y-2">
					<div className="w-11 h-11 rounded-xl bg-[#fdf3f2] border border-[#f5cfcc] text-[#b66b68] flex items-center justify-center mb-1 shadow-xs">
						<AlertTriangle className="w-5 h-5" />
					</div>
					<DialogTitle className="text-[18px] font-bold text-[#252925] tracking-tight">
						Reset Data
					</DialogTitle>
					<DialogDescription className="text-[12.5px] text-[#737873] leading-relaxed">
						Tindakan ini akan mengosongkan seluruh riwayat transaksi kas,
						invoice, tagihan sewa, dan data penghuni kos.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleConfirm} className="space-y-4 my-2">
					<div className="bg-[#fff7f6] border border-[#f5cfcc] rounded-[12px] p-3 text-[11.5px] text-[#a45149] space-y-1.5 leading-relaxed">
						<p className="font-semibold flex items-center gap-1.5">
							<span>⚠️</span> Perhatian Tindakan Permanen:
						</p>
						<ul className="list-disc list-inside space-y-0.5 text-[#8c3c35] pl-1">
							<li>Seluruh catatan pemasukan & pengeluaran kas dihapus.</li>
							<li>Seluruh data penyewa dan invoice tagihan dihapus.</li>
							<li>
								Status semua kamar dikembalikan ke <b>Kosong (VACANT)</b>.
							</li>
							<li>
								<b>Akun SuperAdmin</b> dan <b>cabang properti kos</b> tetap
								aman.
							</li>
						</ul>
					</div>

					<div className="space-y-1.5 pt-1">
						<Label
							htmlFor="resetConfirmInput"
							className="text-[11.5px] font-bold text-[#506257]"
						>
							Ketik kata <span className="text-[#b66b68] font-mono">RESET</span>{" "}
							untuk konfirmasi:
						</Label>
						<Input
							id="resetConfirmInput"
							value={confirmationText}
							onChange={(e) => setConfirmationText(e.target.value)}
							placeholder="RESET"
							autoComplete="off"
							disabled={isSubmitting}
							className="h-[42px] border-[#e4e9e4] rounded-[10px] text-xs font-mono font-bold tracking-wider uppercase focus-visible:border-[#b66b68] focus-visible:ring-[#b66b68]/20"
						/>
					</div>

					<DialogFooter className="pt-3 gap-2 sm:gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="h-[38px] px-4 rounded-[9px] border-[#e4e9e4] text-[#737873] hover:bg-[#f3f7f3] text-xs font-semibold"
						>
							Batal
						</Button>
						<Button
							type="submit"
							disabled={!isConfirmed || isSubmitting}
							className="h-[38px] px-5 rounded-[9px] bg-[#b66b68] hover:bg-[#a25956] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Mereset Data...</span>
								</>
							) : (
								<>
									<Trash2 className="w-3.5 h-3.5" />
									<span>Reset Data</span>
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
