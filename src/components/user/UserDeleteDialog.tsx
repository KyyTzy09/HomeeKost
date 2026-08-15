import { Trash2 } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { UserItem } from "../../common/types/index.ts";

interface UserDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserItem | null;
	onConfirmDelete: (user: UserItem) => void;
}

export function UserDeleteDialog({
	open,
	onOpenChange,
	user,
	onConfirmDelete,
}: UserDeleteDialogProps) {
	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[440px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="user-delete-description"
			>
				<DialogHeader className="pb-3 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<Trash2 className="w-4 h-4 text-[#a45149]" />
						Hapus Pengguna?
					</DialogTitle>
					<DialogDescription
						id="user-delete-description"
						className="text-xs text-[#737873] mt-1"
					>
						Tindakan ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="py-3">
					<p className="text-xs text-[#252925] leading-relaxed">
						Apakah Anda yakin ingin menghapus akun{" "}
						<b className="font-bold text-[#252925]">{user.name}</b> (
						<span className="text-[#737873]">{user.email}</span>)?
					</p>
					<p className="text-[11px] text-[#737873] mt-2">
						Pengguna ini tidak akan dapat login lagi ke sistem HomeeKost.
					</p>
				</div>

				<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
						onClick={() => onOpenChange(false)}
					>
						Batal
					</Button>
					<Button
						type="button"
						className="bg-[#a45149] hover:bg-[#8e443d] text-white text-xs font-semibold px-4 h-9"
						onClick={() => {
							onConfirmDelete(user);
							onOpenChange(false);
						}}
					>
						Hapus Pengguna
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
