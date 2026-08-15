import type React from "react";
import { Button } from "#/common/shadcn/button.tsx";
import type { RoomItem } from "../../common/types/index.ts";

interface RoomCardProps {
	room: RoomItem;
	onDetail?: (room: RoomItem) => void;
	onDelete?: (room: RoomItem) => void;
}

export function RoomCard({ room, onDetail, onDelete }: RoomCardProps) {
	const getBadgeClasses = (status: RoomItem["status"]) => {
		switch (status) {
			case "Terisi":
				return "bg-[#e8f2ea] text-[#568062]";
			case "Kosong":
				return "bg-[#f6f0e4] text-[#99773d]";
			case "Maintenance":
				return "bg-[#f7e9e8] text-[#a65f5b]";
			default:
				return "bg-[#f0f4f1] text-[#607066]";
		}
	};

	return (
		<div
			className="bg-white border border-[#e4e9e4] rounded-[10px] p-4 shadow-[0_2px_12px_rgba(48,65,53,0.055)] hover:-translate-y-[1px] hover:shadow-[0_5px_18px_rgba(48,65,53,0.08)] hover:border-[#d5dfd6] transition-all cursor-pointer flex flex-col justify-between group"
			onClick={() => onDetail?.(room)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => e.key === "Enter" && onDetail?.(room)}
		>
			<div>
				{/* Top Row: Room No + Type & Badge */}
				<div className="flex justify-between items-start mb-1">
					<div>
						<div className="text-[18px] font-bold text-[#252925] tracking-tight leading-tight">
							{room.roomNo}
						</div>
						<div className="text-[10px] text-[#737873] font-medium mt-0.5">
							{room.type}
						</div>
					</div>
					<span
						className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9.5px] font-bold ${getBadgeClasses(
							room.status,
						)}`}
					>
						{room.status}
					</span>
				</div>

				{/* Price */}
				<div className="text-[12px] font-bold text-[#252925] mt-3">
					{room.price} / bulan
				</div>

				{/* Tenant or Availability */}
				<div className="text-[10px] text-[#737873] font-medium mt-1 truncate">
					{room.tenantName ? (
						<>
							{room.tenantName}
							{room.dueDate ? ` · jatuh tempo ${room.dueDate}` : ""}
						</>
					) : room.status === "Maintenance" ? (
						"Sedang dalam pemeliharaan"
					) : (
						"Siap disewakan"
					)}
				</div>
			</div>

			{/* Footer: Facilities & Action Buttons */}
			<div className="border-t border-[#e4e9e4] mt-3 pt-2.5 flex justify-between items-center">
				<span className="text-[10px] text-[#737873] truncate max-w-[140px] sm:max-w-[160px]">
					{room.facilities || "Kamar mandi dalam · Wi-Fi"}
				</span>
				<div className="flex items-center gap-2">
					<Button
						className="text-[10px] font-semibold text-[#4f6958] hover:underline cursor-pointer bg-transparent border-0 p-0 hover:bg-transparent hover:border-0"
						type="button"
						onClick={(e: React.MouseEvent) => {
							e.stopPropagation();
							onDetail?.(room);
						}}
					>
						Detail
					</Button>
					<Button
						className="text-[10px] font-semibold text-[#b66b68] hover:underline cursor-pointer bg-transparent border-0 p-0 hover:bg-transparent hover:border-0"
						type="button"
						onClick={(e: React.MouseEvent) => {
							e.stopPropagation();
							onDelete?.(room);
						}}
					>
						Hapus
					</Button>
				</div>
			</div>
		</div>
	);
}
