import { FileText, Pencil, Trash2, UserCheck } from "lucide-react";
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
	currentUserId?: string;
	isSuperAdmin?: boolean;
}

export function TransactionDetailDialog({
	open,
	onOpenChange,
	transaction,
	onEdit,
	onDelete,
	currentUserId,
	isSuperAdmin = false,
}: TransactionDetailDialogProps) {
	if (!transaction) return null;

	const isIncome = transaction.type === "Income";
	const canModify = isSuperAdmin || transaction.createdBy === currentUserId;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[500px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="transaction-detail-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<FileText className="w-5 h-5 text-[#4f6958]" />
						Detail Transaksi Kas
					</DialogTitle>
					<DialogDescription
						id="transaction-detail-description"
						className="text-xs text-[#737873] mt-1"
					>
						{transaction.description || "Transaksi Keuangan HomeeKost"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3 py-4">
					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Tanggal Transaksi
						</span>
						<b className="text-xs text-[#252925] font-semibold">
							{transaction.date} ({transaction.rawDate})
						</b>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Cabang Kos
						</span>
						<b className="text-xs text-[#252925] font-semibold">
							{transaction.propertyName}
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
							{isIncome ? "Pemasukan (+)" : "Pengeluaran (-)"}
						</span>
					</div>

					<div className="p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1">
							Nominal
						</span>
						<b
							className={`text-sm font-bold ${
								isIncome ? "text-[#568062]" : "text-[#a65f5b]"
							}`}
						>
							{isIncome ? "+" : "-"} {formatRupiah(transaction.amount)}
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

					<div className="col-span-2 p-3 bg-[#f3f7f3] border border-[#e4e9e4] rounded-xl flex items-center justify-between">
						<div>
							<span className="text-[11px] text-[#737873] block">
								Dicatat Oleh (Audit Trail)
							</span>
							<b className="text-xs text-[#4f6958] font-semibold flex items-center gap-1.5 mt-0.5">
								<UserCheck className="w-3.5 h-3.5" />
								{transaction.creatorName}
							</b>
						</div>

						{transaction.classification && (
							<span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-[#e4e9e4] text-[#737873]">
								{transaction.classification === "INVESTMENT"
									? "Investasi"
									: "Operasional"}
							</span>
						)}
					</div>
				</div>

				<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-between gap-2">
					{canModify ? (
						<>
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
								Hapus Transaksi
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
								Edit Transaksi
							</Button>
						</>
					) : (
						<div className="w-full flex justify-end">
							<Button
								type="button"
								variant="outline"
								className="text-xs font-semibold px-4 h-9 border-[#e4e9e4]"
								onClick={() => onOpenChange(false)}
							>
								Tutup
							</Button>
						</div>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
