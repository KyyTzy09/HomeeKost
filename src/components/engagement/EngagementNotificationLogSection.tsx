import {
	Calendar,
	CheckCircle2,
	History,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { formatDate } from "../../lib/date-utils.ts";
import { filterNotificationLogsByDateRange } from "../../lib/engagement-utils.ts";

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
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");

	const filteredLogs = useMemo(() => {
		return filterNotificationLogsByDateRange(logs, startDate, endDate);
	}, [logs, startDate, endDate]);

	const isFiltered = Boolean(startDate || endDate);

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
					{isFiltered
						? `${filteredLogs.length} dari ${logs.length} Log`
						: `${logs.length} Log Terakhir`}
				</span>
			</div>

			{/* Date Range Filter Bar (Rentang A - B) */}
			<div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3 mt-3 bg-[#f8faf8] border border-[#e4e9e4] rounded-xl text-xs">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-semibold text-[#4f6958] flex items-center gap-1.5">
						<Calendar className="w-3.5 h-3.5 text-[#4f6958]" />
						Rentang Tanggal:
					</span>
					<div className="flex items-center gap-1.5">
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="h-8 text-xs px-2.5 py-1 bg-white border border-[#cfdfd1] rounded-lg text-[#252925] focus:outline-none focus:border-[#4f6958] focus:ring-1 focus:ring-[#4f6958] shadow-xs"
							placeholder="Dari Tanggal"
							title="Dari Tanggal"
						/>
						<span className="text-[11px] text-[#737873]">s/d</span>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="h-8 text-xs px-2.5 py-1 bg-white border border-[#cfdfd1] rounded-lg text-[#252925] focus:outline-none focus:border-[#4f6958] focus:ring-1 focus:ring-[#4f6958] shadow-xs"
							placeholder="Sampai Tanggal"
							title="Sampai Tanggal"
						/>
					</div>
					{isFiltered && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 text-xs text-[#b66b68] hover:text-[#9e5552] hover:bg-[#fae8e8] px-2.5 font-medium flex items-center gap-1 rounded-lg"
							onClick={() => {
								setStartDate("");
								setEndDate("");
							}}
						>
							<RotateCcw className="w-3 h-3" />
							Semua Tanggal
						</Button>
					)}
				</div>

				<div className="text-[11px] text-[#737873]">
					{isFiltered ? (
						<span>
							Menampilkan hasil filter <b>{startDate || "awal"}</b> s/d{" "}
							<b>{endDate || "sekarang"}</b>
						</span>
					) : (
						<span>Default: Menampilkan seluruh tanggal log riwayat</span>
					)}
				</div>
			</div>

			<div className="divide-y divide-[#edf1ed] mt-3 max-h-[340px] overflow-y-auto">
				{filteredLogs.map((log) => {
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

				{filteredLogs.length === 0 && (
					<div className="py-10 text-center text-xs text-[#737873] space-y-2">
						<p>
							{isFiltered
								? "Tidak ada catatan log notifikasi pada rentang tanggal yang dipilih."
								: "Belum ada catatan log pengiriman pesan WhatsApp."}
						</p>
						{isFiltered && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="text-xs border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f2ea]"
								onClick={() => {
									setStartDate("");
									setEndDate("");
								}}
							>
								Tampilkan Semua Tanggal
							</Button>
						)}
					</div>
				)}
			</div>
		</Card>
	);
}
