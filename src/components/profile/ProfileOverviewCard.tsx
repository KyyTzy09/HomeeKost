import { Building2, ShieldCheck } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";
import type { UserProfileDetail } from "../../common/types/index.ts";

interface ProfileOverviewCardProps {
	profile: UserProfileDetail;
	isSuperAdmin: boolean;
}

export function ProfileOverviewCard({
	profile,
	isSuperAdmin,
}: ProfileOverviewCardProps) {
	const initials = profile.name
		? profile.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: "HK";

	const propertyCountLabel = isSuperAdmin
		? `${profile.accessibleProperties.length} Kos`
		: profile.assignedProperty || "1 Kos";

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] overflow-hidden">
			{/* Cover Banner dengan Avatar Overlapping */}
			<div className="h-[105px] bg-[#edf4ee] rounded-xl relative mb-11 border border-[#e2eae3]">
				<div className="absolute left-5 -bottom-8 w-[72px] h-[72px] rounded-full bg-[#dfeae0] text-[#4f6958] flex items-center justify-center font-extrabold text-xl border-[4px] border-white shadow-sm">
					{initials}
				</div>
			</div>

			{/* User Info */}
			<div className="pt-1">
				<h2 className="text-lg font-bold text-[#252925] tracking-tight m-0 mb-0.5">
					{profile.name}
				</h2>
				<p className="text-xs text-[#737873] m-0 mb-5">
					{isSuperAdmin ? "Owner" : "Admin Staf"} · HomeeKost
				</p>

				{/* Detail Grid (2-kolom kotak informasi) */}
				<div className="grid grid-cols-2 gap-2.5 my-3">
					<div className="bg-[#f8faf8] border border-[#e7ece7] rounded-xl p-3">
						<span className="block text-[10px] font-semibold text-[#8a958d] mb-1 flex items-center gap-1.5">
							<Building2 className="w-3.5 h-3.5 text-[#55705d]" />
							Properti aktif
						</span>
						<b className="text-xs font-bold text-[#34443a]">
							{propertyCountLabel}
						</b>
					</div>

					<div className="bg-[#f8faf8] border border-[#e7ece7] rounded-xl p-3">
						<span className="block text-[10px] font-semibold text-[#8a958d] mb-1 flex items-center gap-1.5">
							<ShieldCheck className="w-3.5 h-3.5 text-[#55705d]" />
							Role Akun
						</span>
						<b className="text-xs font-bold text-[#34443a]">
							{isSuperAdmin ? "Super Admin (Owner)" : "Admin Cabang"}
						</b>
					</div>
				</div>

				<div className="pt-3 border-t border-[#edf1ed] flex items-center justify-between text-[11px] text-[#737873]">
					<span>Terdaftar sejak</span>
					<span className="font-mono text-[#37443c]">
						{profile.createdAt || "Agustus 2026"}
					</span>
				</div>
			</div>
		</Card>
	);
}
