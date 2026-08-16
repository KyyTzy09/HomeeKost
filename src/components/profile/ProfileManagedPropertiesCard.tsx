import { Link } from "@tanstack/react-router";
import { Building2, Check, ExternalLink } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";

interface ManagedPropertyItem {
	id: string;
	name: string;
	address: string;
	totalRooms: number;
}

interface ProfileManagedPropertiesCardProps {
	properties: ManagedPropertyItem[];
	activePropertyId?: string | null;
	isSuperAdmin: boolean;
	onSelectProperty: (propertyId: string) => Promise<void>;
	isSwitchingProperty: boolean;
}

export function ProfileManagedPropertiesCard({
	properties,
	activePropertyId,
	isSuperAdmin,
	onSelectProperty,
	isSwitchingProperty,
}: ProfileManagedPropertiesCardProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<Building2 className="w-4 h-4 text-[#4f6958]" />
						Properti yang Dikelola
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Pindah cabang kos operasional tanpa harus keluar dari akun.
					</p>
				</div>

				{isSuperAdmin && (
					<Link to="/dashboard/select-property">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] font-semibold"
						>
							<ExternalLink className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
							Pilih Kos
						</Button>
					</Link>
				)}
			</div>

			<div className="pt-4">
				{properties.length === 0 ? (
					<p className="text-xs text-[#737873] italic py-2">
						Tidak ada properti yang terdaftar untuk akun ini.
					</p>
				) : (
					<div className="flex items-center gap-2.5 flex-wrap">
						{properties.map((prop) => {
							const isActive = activePropertyId === prop.id;

							return (
								<button
									key={prop.id}
									type="button"
									disabled={isSwitchingProperty}
									onClick={() => onSelectProperty(prop.id)}
									className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
										isActive
											? "bg-[#eef5ef] text-[#4f6958] border-[#cce0cf] shadow-2xs ring-1 ring-[#cce0cf]"
											: "bg-[#fbfcfb] text-[#556057] border-[#e4e9e4] hover:bg-[#f3f7f3] hover:border-[#d6dfd7]"
									}`}
								>
									<span
										className={`w-2 h-2 rounded-full ${
											isActive ? "bg-[#5d7865]" : "bg-[#cbd4cc]"
										}`}
									/>
									<span>{prop.name}</span>
									{isActive && (
										<span className="text-[9.5px] bg-[#d9e6db] text-[#3e5345] px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
											<Check className="w-3 h-3" />
											Aktif
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>
		</Card>
	);
}
