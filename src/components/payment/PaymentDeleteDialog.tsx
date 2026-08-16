import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { PaymentItem } from "../../common/types/index.ts";

interface PaymentDeleteDialogProps {
	open: boolean;
	payment: PaymentItem | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isDeleting?: boolean;
}

export function PaymentDeleteDialog({
	open,
	payment,
	onOpenChange,
	onConfirm,
	isDeleting = false,
}: PaymentDeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[420px] rounded-[20px] border-[#efd4d0] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="delete-payment-desc"
			>
				<DialogHeader className="gap-1 mb-2">
					<DialogTitle className="text-[17px] font-bold text-[#a65f5b]">
						Hapus Tagihan Pembayaran?
					</DialogTitle>
					<DialogDescription
						id="delete-payment-desc"
						className="text-[12px] text-[#607066] leading-relaxed"
					>
						Apakah Anda yakin ingin menghapus data tagihan{" "}
						<b className="text-[#252925]">
							{payment?.tenantName} · {payment?.roomNumber}
						</b>{" "}
						periode {payment?.period}? Tindakan ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="pt-3 border-t border-[#f7e9e8] gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="h-[36px] px-4 text-xs font-semibold rounded-[8px] border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3]"
					>
						Batal
					</Button>
					<Button
						type="button"
						disabled={isDeleting}
						onClick={onConfirm}
						className="h-[36px] px-4 text-xs font-bold rounded-[8px] bg-[#b66b68] hover:bg-[#a65f5b] text-white transition-colors"
					>
						{isDeleting ? "Menghapus..." : "Ya, Hapus Tagihan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
