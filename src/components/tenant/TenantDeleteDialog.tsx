import { AlertTriangle } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { TenantItem } from "../../common/types/index.ts";

interface TenantDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenant: TenantItem | null;
	onConfirm: () => void;
}

export function TenantDeleteDialog({
	open,
	onOpenChange,
	tenant,
	onConfirm,
}: TenantDeleteDialogProps) {
	if (!tenant) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[420px] rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="w-9 h-9 rounded-[10px] bg-[#fbf0ef] text-[#b66b68] flex items-center justify-center shrink-0">
							<AlertTriangle className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-[17px] font-bold text-[#29382e]">
								Hapus Data Penghuni?
							</DialogTitle>
							<DialogDescription className="text-[11.5px] text-[#8a958d]">
								Tindakan ini tidak dapat dibatalkan.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="text-[12px] text-[#556358] bg-[#fdfaf7] border border-[#f2e6dc] rounded-[11px] p-3 my-2 leading-relaxed">
					Apakah Anda yakin ingin menghapus data sewa{" "}
					<strong className="text-[#252925]">{tenant.name}</strong> (Kamar{" "}
					{tenant.roomNo})? Data kontrak sewa dan riwayat terkait akan dihapus.
				</div>

				<DialogFooter className="pt-3 border-t border-[#edf1ed] flex gap-2 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="h-[38px] px-4 rounded-[9px] border-[#dfe7e0] text-[#506257] hover:bg-[#f3f7f3] text-[12px]"
					>
						Batal
					</Button>
					<Button
						type="button"
						onClick={() => {
							onConfirm();
							onOpenChange(false);
						}}
						className="h-[38px] px-4 rounded-[9px] bg-[#b66b68] hover:bg-[#a35956] text-white font-semibold text-[12px]"
					>
						Hapus Penghuni
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
