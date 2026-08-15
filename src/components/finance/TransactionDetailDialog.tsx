import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { TransactionItem } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";

interface TransactionDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: TransactionItem | null;
	onEdit: (transaction: TransactionItem) => void;
	onDelete: (transaction: TransactionItem) => void;
}

export function TransactionDetailDialog({
	open,
	onOpenChange,
	transaction,
	onEdit,
	onDelete,
}: TransactionDetailDialogProps) {
	if (!transaction) return null;

	const isIncome = transaction.type === "Income";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[500px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="transaction-detail-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<FileText className="w-5 h-5 text-[#4f6958]" />
						Detail Transaksi
					</DialogTitle>
					<DialogDescription
						id="transaction-detail-description"
						className="text-xs text-[#737873] mt-1"
					>
						{transaction.description || "Transaksi Keuangan"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3.5 py-4">
					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Tanggal
						</span>
						<b className="text-xs text-[#252925] font-semibold">
							{transaction.date}
						</b>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Properti Kost
						</span>
						<b className="text-xs text-[#252925] font-semibold">
							{transaction.property}
						</b>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Kategori
						</span>
						<b className="text-xs text-[#252925] font-semibold">
							{transaction.category}
						</b>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Jenis Transaksi
						</span>
						<span
							className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
								isIncome
									? "bg-[#e8f2ea] text-[#568062]"
									: "bg-[#f7e9e8] text-[#a65f5b]"
							}`}
						>
							{transaction.type}
						</span>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Nominal
						</span>
						<b
							className={`text-sm font-bold ${isIncome ? "text-[#568062]" : "text-[#a65f5b]"}`}
						>
							{formatRupiah(transaction.amount)}
						</b>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Metode Bayar
						</span>
						<b className="text-xs text-[#252925] font-semibold">
							{transaction.method || "Transfer"}
						</b>
					</div>
				</div>

				<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-between gap-2">
					<Button
						type="button"
						variant="outline"
						className="border-[#efd4d0] text-[#a45149] hover:bg-[#fff5f3] text-xs font-semibold px-4 h-9"
						onClick={() => {
							onOpenChange(false);
							onDelete(transaction);
						}}
					>
						<Trash2 className="w-3.5 h-3.5 mr-1.5" />
						Hapus Data
					</Button>

					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9"
						onClick={() => {
							onOpenChange(false);
							onEdit(transaction);
						}}
					>
						<Pencil className="w-3.5 h-3.5 mr-1.5" />
						Edit Data
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
