import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { PropertyItem } from "../../common/types/index.ts";

export type { PropertyItem };

interface PropertyCardProps {
	property: PropertyItem;
	onEnter: (property: PropertyItem) => void;
	onEdit: (property: PropertyItem) => void;
	onDelete: (property: PropertyItem) => void;
}

export function PropertyCard({
	property,
	onEnter,
	onEdit,
	onDelete,
}: PropertyCardProps) {
	return (
		<div
			onClick={() => onEnter(property)}
			onKeyDown={(e) => e.key === "Enter" && onEnter(property)}
			role="button"
			tabIndex={0}
			className="bg-white border border-[#e1e8e2] rounded-[20px] p-[22px] min-h-[190px] cursor-pointer transition-all duration-180 relative shadow-[0_8px_30px_rgba(47,69,55,0.05)] hover:-translate-y-[3px] hover:border-[#b8c9ba] hover:shadow-[0_14px_35px_rgba(47,69,55,0.10)] group"
		>
			{/* Edit Button */}
			<button
				type="button"
				title="Edit kos"
				className="absolute top-4 right-[54px] w-[30px] h-[30px] border border-[#e4ebe5] bg-white rounded-[9px] text-[#5d7865] flex items-center justify-center hover:bg-[#f3f7f3] hover:border-[#d4e2d6] hover:text-[#4f6958] transition-all z-20"
				onClick={(e) => {
					e.stopPropagation();
					onEdit(property);
				}}
			>
				<Pencil className="w-3.5 h-3.5" />
			</button>

			{/* Delete Button */}
			<button
				type="button"
				title="Hapus kos"
				className="absolute top-4 right-4 w-[30px] h-[30px] border border-[#e4ebe5] bg-white rounded-[9px] text-[#8a6d68] flex items-center justify-center hover:bg-[#fff5f3] hover:border-[#efd3cf] hover:text-[#a45d55] transition-all z-20"
				onClick={(e) => {
					e.stopPropagation();
					onDelete(property);
				}}
			>
				<Trash2 className="w-3.5 h-3.5" />
			</button>

			{/* Initial Mark or Logo Image */}
			{property.imageUrl ? (
				<div className="w-[42px] h-[42px] rounded-[13px] overflow-hidden border border-[#e1e9e2] mb-6">
					<img
						src={property.imageUrl}
						alt={property.name}
						className="w-full h-full object-cover"
					/>
				</div>
			) : (
				<div className="w-[42px] h-[42px] rounded-[13px] bg-[#edf4ee] text-[#55705d] flex items-center justify-center font-extrabold text-[15px] mb-6">
					{property.code}
				</div>
			)}

			{/* Property Info */}
			<h3 className="text-[16px] font-bold text-[#2d3c31] mb-1 m-0">
				{property.name}
			</h3>
			<p className="text-[11px] text-[#8a958d] m-0">
				{property.rooms} kamar · {property.tenants} penghuni
			</p>
			<p className="text-[10.5px] text-[#8a958d] mt-1 m-0 line-clamp-1">
				{property.address}
			</p>

			{/* Arrow Navigation */}
			<div className="absolute right-5 bottom-5 w-[30px] h-[30px] rounded-[9px] bg-[#f3f7f3] flex items-center justify-center text-[#6c8171] group-hover:bg-[#4f6958] group-hover:text-white transition-all">
				<ArrowRight className="w-4 h-4" />
			</div>
		</div>
	);
}

interface AddPropertyCardProps {
	onClick: () => void;
}

export function AddPropertyCard({ onClick }: AddPropertyCardProps) {
	return (
		<div
			onClick={onClick}
			onKeyDown={(e) => e.key === "Enter" && onClick()}
			role="button"
			tabIndex={0}
			className="border-[1.5px] border-dashed border-[#b9c9bb] bg-white/55 rounded-[20px] p-[22px] min-h-[190px] cursor-pointer transition-all duration-180 relative shadow-[0_8px_30px_rgba(47,69,55,0.03)] hover:-translate-y-[3px] hover:border-[#8fa594] hover:bg-white group"
		>
			<div className="w-[42px] h-[42px] rounded-[13px] bg-[#f3f7f3] border border-dashed border-[#aebfb1] text-[#55705d] flex items-center justify-center font-extrabold text-[18px] mb-6">
				<span className="text-2xl leading-none">+</span>
			</div>
			<h3 className="text-[16px] font-bold text-[#2d3c31] mb-1 m-0">
				Tambah Kos
			</h3>
			<p className="text-[11px] text-[#8a958d] m-0">
				Tambahkan properti baru ke HomeeKost.
			</p>
			<div className="absolute right-5 bottom-5 w-[30px] h-[30px] rounded-[9px] bg-[#f3f7f3] flex items-center justify-center text-[#6c8171] group-hover:bg-[#4f6958] group-hover:text-white transition-all">
				<span className="text-base leading-none">+</span>
			</div>
		</div>
	);
}
