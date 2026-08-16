import { Bell, Megaphone, Plus, Radio, Trash2 } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type {
	AnnouncementCategory,
	AnnouncementItem,
} from "../../common/types/index.ts";

interface EngagementAnnouncementSectionProps {
	announcements: AnnouncementItem[];
	onOpenAddEvent: () => void;
	onBroadcast: (announcement: AnnouncementItem) => void;
	onDelete?: (announcement: AnnouncementItem) => void;
}

export function getCategoryBadge(category: AnnouncementCategory) {
	switch (category) {
		case "KERJA_BAKTI":
			return {
				label: "Kerja Bakti",
				className: "bg-[#e8f2ea] text-[#568062]",
			};
		case "MAINTENANCE":
			return {
				label: "Maintenance",
				className: "bg-[#f6f0e4] text-[#99773d]",
			};
		case "ACARA":
			return {
				label: "Acara Kos",
				className: "bg-[#e6f0fa] text-[#2b6cb0]",
			};
		default:
			return { label: "Umum", className: "bg-[#f3f7f3] text-[#737873]" };
	}
}

export function EngagementAnnouncementSection({
	announcements,
	onOpenAddEvent,
	onBroadcast,
	onDelete,
}: EngagementAnnouncementSectionProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<Megaphone className="w-4 h-4 text-[#4f6958]" />
						Agenda & Pengumuman Kos
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Broadcast informasi penting langsung ke nomor WhatsApp seluruh
						penghuni kos aktif.
					</p>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] font-semibold"
					onClick={onOpenAddEvent}
				>
					<Plus className="w-3.5 h-3.5 mr-1" />
					Tambah Pengumuman
				</Button>
			</div>

			{announcements.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
					{announcements.map((item) => {
						const badge = getCategoryBadge(item.category);

						return (
							<div
								key={item.id}
								className="p-4 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl flex flex-col justify-between group hover:border-[#8fa594] transition-colors"
							>
								<div>
									<div className="flex items-center justify-between gap-2 mb-2">
										<span
											className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${badge.className}`}
										>
											{badge.label}
										</span>
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] text-[#737873] font-medium">
												{item.propertyName}
											</span>
											{onDelete && (
												<button
													type="button"
													title="Hapus Pengumuman"
													onClick={() => onDelete(item)}
													className="text-[#9da39e] hover:text-[#b66b68] p-1 rounded transition-colors"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											)}
										</div>
									</div>

									<h3 className="text-xs font-bold text-[#252925]">
										{item.title}
									</h3>
									<p className="text-[11px] text-[#737873] mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-wrap">
										{item.content}
									</p>
								</div>

								<div className="mt-4 pt-3 border-t border-[#e4e9e4] flex items-center justify-between">
									<div className="flex items-center gap-1 text-[10px] text-[#737873]">
										<Bell className="w-3 h-3 text-[#8fa594]" />
										<span>
											{item.sentAt
												? `Terkirim ${item.sentAt}`
												: "Siap dibroadcast"}
										</span>
									</div>

									<Button
										type="button"
										size="sm"
										className="h-7 px-2.5 text-[11px] bg-[#4f6958] hover:bg-[#425949] text-white font-semibold flex items-center gap-1 shadow-sm"
										onClick={() => onBroadcast(item)}
									>
										<Radio className="w-3 h-3" />
										Broadcast WA
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="py-10 text-center text-xs text-[#737873]">
					Belum ada riwayat pengumuman kos. Klik tombol{" "}
					<b>"Tambah Pengumuman"</b> di atas untuk membuat broadcast baru.
				</div>
			)}
		</Card>
	);
}
