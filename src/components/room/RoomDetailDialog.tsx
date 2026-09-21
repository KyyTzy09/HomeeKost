import { BedDouble, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { RoomItem } from "../../common/types/index.ts";

interface RoomDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	room: RoomItem | null;
	propertyName: string;
	onEdit: (room: RoomItem) => void;
	onDelete: (room: RoomItem) => void;
}

export function RoomDetailDialog({
	open,
	onOpenChange,
	room,
	propertyName,
	onEdit,
	onDelete,
}: RoomDetailDialogProps) {
	if (!room) return null;

	const getBadgeStyle = (status: RoomItem["status"]) => {
		switch (status) {
			case "Terisi":
				return "bg-[#e8f2ea] text-[#568062] border border-[#d2e2d5]";
			case "Kosong":
				return "bg-[#f6f0e4] text-[#99773d] border border-[#eeddc1]";
			case "Maintenance":
				return "bg-[#f7e9e8] text-[#a65f5b] border border-[#f0cfcc]";
			default:
				return "bg-[#f0f4f1] text-[#607066]";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[560px] rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader>
					<div className="flex items-center gap-2.5 mb-1">
						<div className="w-8 h-8 rounded-[9px] bg-[#edf4ee] text-[#4f6958] flex items-center justify-center">
							<BedDouble className="w-4 h-4" />
						</div>
						<div>
							<DialogTitle className="text-[18px] font-bold text-[#29382e]">
								Kamar {room.roomNo}
							</DialogTitle>
							<DialogDescription className="text-[11px] text-[#8a958d]">
								Detail kamar · {propertyName}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* 2x2 Grid Info */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
					<div className="bg-[#f8faf8] border border-[#e7ece7] rounded-[12px] p-3">
						<span className="block text-[10px] text-[#8a958d] font-semibold uppercase tracking-wider mb-1">
							Status
						</span>
						<span
							className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-bold ${getBadgeStyle(
								room.status,
							)}`}
						>
							{room.status}
						</span>
					</div>

					<div className="bg-[#f8faf8] border border-[#e7ece7] rounded-[12px] p-3">
						<span className="block text-[10px] text-[#8a958d] font-semibold uppercase tracking-wider mb-1">
							Tipe
						</span>
						<b className="text-[12px] text-[#34443a] font-bold">{room.type}</b>
					</div>

					<div className="bg-[#f8faf8] border border-[#e7ece7] rounded-[12px] p-3">
						<span className="block text-[10px] text-[#8a958d] font-semibold uppercase tracking-wider mb-1">
							Harga
						</span>
						<b className="text-[12px] text-[#34443a] font-bold">
							{room.price} / bulan
						</b>
					</div>

					<div className="bg-[#f8faf8] border border-[#e7ece7] rounded-[12px] p-3">
						<span className="block text-[10px] text-[#8a958d] font-semibold uppercase tracking-wider mb-1">
							Penghuni
						</span>
						<b className="text-[12px] text-[#34443a] font-bold truncate block">
							{room.tenantName ? (
								<>
									{room.tenantName}
									{room.dueDate ? ` · jatuh tempo ${room.dueDate}` : ""}
								</>
							) : room.status === "Maintenance" ? (
								"Dalam pemeliharaan fasilitas"
							) : (
								"Siap disewakan"
							)}
						</b>
					</div>
				</div>

				{/* Facilities / Extra Details */}
				<div className="bg-[#fdfdfd] border border-[#edf1ed] rounded-[10px] p-3 mb-2">
					<span className="block text-[10px] text-[#8a958d] font-semibold uppercase tracking-wider mb-1">
						Fasilitas Kamar
					</span>
					<p className="text-[11.5px] text-[#4f5c53] font-medium m-0">
						{room.facilities || "Fasilitas standar kamar"}
					</p>
				</div>

				<p className="text-[11px] text-[#737873] m-0 mb-4">
					Klik Edit untuk mengubah data kamar atau Hapus Data untuk menghapus
					kamar ini.
				</p>

				<DialogFooter className="pt-3 border-t border-[#edf1ed] flex flex-row items-center justify-between sm:justify-between gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							onOpenChange(false);
							onDelete(room);
						}}
						className="h-[38px] px-3.5 rounded-[9px] border-[#efd4d0] bg-[#fff5f3] text-[#a45149] hover:bg-[#faeae8] text-[12px] font-semibold flex items-center gap-1.5"
					>
						<Trash2 className="w-3.5 h-3.5" />
						Hapus Data
					</Button>

					<Button
						type="button"
						onClick={() => {
							onOpenChange(false);
							onEdit(room);
						}}
						className="h-[38px] px-4 rounded-[9px] bg-[#4f6958] hover:bg-[#425949] text-white text-[12px] font-semibold flex items-center gap-1.5"
					>
						<Pencil className="w-3.5 h-3.5" />
						Edit Data
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
