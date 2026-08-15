import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { PropertyItem } from "./PropertyCard.tsx";

interface PropertyDeleteDialogProps {
	property: PropertyItem | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function PropertyDeleteDialog({
	property,
	onOpenChange,
	onConfirm,
}: PropertyDeleteDialogProps) {
	return (
		<Dialog
			open={!!property}
			onOpenChange={(open) => !open && onOpenChange(false)}
		>
			<DialogContent className="max-w-[420px] rounded-[20px] border-[#efd4d0] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader className="gap-1 mb-2">
					<DialogTitle className="text-[17px] font-bold text-[#a65f5b]">
						Hapus Properti Kos?
					</DialogTitle>
					<DialogDescription className="text-[12px] text-[#607066] leading-relaxed">
						Apakah Anda yakin ingin menghapus cabang{" "}
						<b className="text-[#252925]">"{property?.name}"</b>? Seluruh data
						kamar dan riwayat terkait cabang ini akan dihapus dari manajemen.
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
						onClick={onConfirm}
						className="h-[36px] px-4 text-xs font-bold rounded-[8px] bg-[#b66b68] hover:bg-[#a65f5b] text-white transition-colors"
					>
						Ya, Hapus Properti
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
