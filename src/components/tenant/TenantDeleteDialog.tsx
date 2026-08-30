import { LogOut, ShieldCheck } from "lucide-react";
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
			<DialogContent className="max-w-[460px] rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="w-10 h-10 rounded-[12px] bg-[#fbf0ef] text-[#b66b68] flex items-center justify-center shrink-0">
							<LogOut className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-[17px] font-bold text-[#29382e]">
								Check-Out / Selesai Sewa?
							</DialogTitle>
							<DialogDescription className="text-[11.5px] text-[#8a958d]">
								Mengakhiri masa sewa penghuni dan mengosongkan kamar.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-2.5 my-2">
					<div className="text-[12px] text-[#556358] bg-[#fdfaf7] border border-[#f2e6dc] rounded-[11px] p-3 leading-relaxed">
						Apakah Anda yakin ingin menyelesaikan masa sewa untuk penghuni{" "}
						<strong className="text-[#252925]">{tenant.name}</strong> (Kamar{" "}
						<strong className="text-[#252925]">{tenant.roomNo}</strong>)?
					</div>

					<div className="bg-[#f4f8f4] border border-[#d8e6da] rounded-[11px] p-3 text-[11px] text-[#4f6958] space-y-1.5">
						<div className="flex items-center gap-1.5 font-bold text-[#2d4634]">
							<ShieldCheck className="w-4 h-4 text-[#4f6958]" />
							<span>Jaminan Integritas Data & Keuangan:</span>
						</div>
						<ul className="list-disc pl-4 space-y-0.5 m-0 text-[#4c6252]">
							<li>
								Kamar {tenant.roomNo} otomatis kembali{" "}
								<strong>Kosong (Vacant)</strong>.
							</li>
							<li>
								Seluruh riwayat pembayaran, invoice, dan data kas{" "}
								<strong>tetap tersimpan utuh</strong> untuk pembukuan.
							</li>
						</ul>
					</div>
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
						className="h-[38px] px-4 rounded-[9px] bg-[#b66b68] hover:bg-[#a35956] text-white font-semibold text-[12px] flex items-center gap-1.5"
					>
						<LogOut className="w-3.5 h-3.5" />
						Konfirmasi Check-Out
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
