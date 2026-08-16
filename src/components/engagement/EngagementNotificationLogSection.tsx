import { CheckCircle2, History, XCircle } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";
import { formatDate } from "../../lib/date-utils.ts";

export interface NotificationLogItem {
	id: string;
	recipientNumber: string;
	messageType:
		| "DUE_DATE_REMINDER"
		| "BIRTHDAY_WISH"
		| "ANNOUNCEMENT"
		| "INVOICE";
	status: "SENT" | "FAILED";
	notes?: string | null;
	sentAt: Date | string;
}

interface EngagementNotificationLogSectionProps {
	logs: NotificationLogItem[];
}

export function EngagementNotificationLogSection({
	logs,
}: EngagementNotificationLogSectionProps) {
	const getMessageTypeBadge = (type: string) => {
		switch (type) {
			case "BIRTHDAY_WISH":
				return {
					label: "Ucapan Ultah 🎂",
					className: "bg-[#e8f2ea] text-[#568062]",
				};
			case "DUE_DATE_REMINDER":
				return {
					label: "Pengingat Tagihan 📅",
					className: "bg-[#f6f0e4] text-[#99773d]",
				};
			case "ANNOUNCEMENT":
				return {
					label: "Broadcast Kos 📢",
					className: "bg-[#e6f0fa] text-[#2b6cb0]",
				};
			default:
				return {
					label: "Invoice Sewa 📄",
					className: "bg-[#f3f7f3] text-[#737873]",
				};
		}
	};

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
				<div>
					<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
						<History className="w-4 h-4 text-[#4f6958]" />
						Riwayat Log Pengiriman Notifikasi WhatsApp
					</h2>
					<p className="text-[11px] text-[#737873] mt-0.5">
						Audit pengiriman pesan otomatis & manual via Fonnte Gateway
					</p>
				</div>
				<span className="text-[11px] font-semibold text-[#737873] bg-[#f3f7f3] px-2.5 py-0.5 rounded-md">
					{logs.length} Pesan Terakhir
				</span>
			</div>

			<div className="divide-y divide-[#edf1ed] mt-2 max-h-[320px] overflow-y-auto">
				{logs.map((log) => {
					const isSuccess = log.status === "SENT";
					const badge = getMessageTypeBadge(log.messageType);
					const sentTime =
						typeof log.sentAt === "string"
							? formatDate(new Date(log.sentAt))
							: formatDate(log.sentAt);

					return (
						<div
							key={log.id}
							className="py-3 flex items-start justify-between gap-3 hover:bg-[#fbfcfb] transition-colors"
						>
							<div className="flex items-start gap-2.5">
								<div className="mt-0.5">
									{isSuccess ? (
										<CheckCircle2 className="w-4 h-4 text-[#568062]" />
									) : (
										<XCircle className="w-4 h-4 text-[#b66b68]" />
									)}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<span
											className={`text-[10px] font-semibold px-2 py-0.5 rounded ${badge.className}`}
										>
											{badge.label}
										</span>
										<span className="text-xs font-bold text-[#252925]">
											{log.recipientNumber}
										</span>
									</div>
									{log.notes && (
										<p className="text-[11px] text-[#737873] mt-0.5 line-clamp-1">
											{log.notes}
										</p>
									)}
								</div>
							</div>

							<div className="text-right shrink-0">
								<span
									className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
										isSuccess
											? "bg-[#e8f2ea] text-[#568062]"
											: "bg-[#fae8e8] text-[#b66b68]"
									}`}
								>
									{isSuccess ? "Terkirim" : "Gagal"}
								</span>
								<div className="text-[10px] text-[#737873] mt-1">
									{sentTime}
								</div>
							</div>
						</div>
					);
				})}

				{logs.length === 0 && (
					<div className="py-8 text-center text-xs text-[#737873]">
						Belum ada catatan log pengiriman pesan WhatsApp.
					</div>
				)}
			</div>
		</Card>
	);
}
