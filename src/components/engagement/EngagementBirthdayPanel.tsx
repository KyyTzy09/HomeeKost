import { Cake, MessageCircle } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type { UpcomingBirthdayItem } from "../../common/types/index.ts";

interface EngagementBirthdayPanelProps {
	birthdays: UpcomingBirthdayItem[];
	onSendWish: (item: UpcomingBirthdayItem) => void;
	onSetReminder: (item: UpcomingBirthdayItem) => void;
}

export function EngagementBirthdayPanel({
	birthdays,
	onSendWish,
	onSetReminder,
}: EngagementBirthdayPanelProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
			<div>
				<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
					<div>
						<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<Cake className="w-4 h-4 text-[#4f6958]" />
							Ulang Tahun Terdekat
						</h2>
						<p className="text-[11px] text-[#737873]">
							Penghuni yang berulang tahun dalam waktu dekat
						</p>
					</div>

					<span className="text-[11px] font-semibold text-[#568062] bg-[#e8f2ea] px-2.5 py-0.5 rounded-md">
						{birthdays.length} Penghuni
					</span>
				</div>

				<div className="divide-y divide-[#edf1ed] mt-2">
					{birthdays.map((item) => {
						const isUrgent = item.daysRemaining <= 1;

						return (
							<div
								key={item.id}
								className="py-3.5 flex items-start justify-between gap-3 hover:bg-[#fbfcfb] transition-colors"
							>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-lg bg-[#f3f7f3] text-[#4f6958] flex items-center justify-center text-sm shrink-0 mt-0.5">
										🎂
									</div>
									<div>
										<div className="flex items-center gap-2">
											<strong className="text-xs font-bold text-[#252925]">
												{item.name}
											</strong>
											<span
												className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
													isUrgent
														? "bg-[#e8f2ea] text-[#568062]"
														: "bg-[#f3f7f3] text-[#737873]"
												}`}
											>
												{item.relativeLabel}
											</span>
										</div>
										<p className="text-[11px] text-[#737873] mt-0.5">
											Kamar {item.room} · {item.property} · {item.birthDate}
										</p>
									</div>
								</div>

								<div className="shrink-0 flex items-center gap-1.5">
									{isUrgent ? (
										<Button
											type="button"
											size="sm"
											className="h-7 text-[11px] bg-[#4f6958] hover:bg-[#425949] text-white font-semibold px-3 shadow-sm"
											onClick={() => onSendWish(item)}
										>
											<MessageCircle className="w-3 h-3 mr-1" />
											Kirim Ucapan
										</Button>
									) : (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-7 text-[11px] border-[#e4e9e4] text-[#737873] hover:bg-[#f3f7f3] font-medium px-2.5"
											onClick={() => onSetReminder(item)}
										>
											Atur Pengingat
										</Button>
									)}
								</div>
							</div>
						);
					})}

					{birthdays.length === 0 && (
						<div className="py-8 text-center text-xs text-[#737873]">
							Tidak ada ulang tahun penghuni dalam 30 hari ke depan.
						</div>
					)}
				</div>
			</div>

			<div className="mt-4 pt-3 border-t border-[#e4e9e4] text-[11px] text-[#737873]">
				💡 <b>Tips:</b> Sistem otomatis mengirimkan WhatsApp ucapan selamat
				ulang tahun setiap pukul <b>08:00 WIB</b> melalui Fonnte Gateway.
			</div>
		</Card>
	);
}
