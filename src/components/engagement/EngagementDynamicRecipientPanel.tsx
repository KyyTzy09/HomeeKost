import { AlertTriangle, Send, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { Checkbox } from "../../common/shadcn/checkbox.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type {
	EngagementRecipient,
	EngagementTemplateItem,
} from "../../common/types/index.ts";
import { formatDate } from "../../lib/date-utils.ts";
import { filterRecipientsByTemplate } from "../../lib/engagement-utils.ts";

export interface EngagementDynamicRecipientPanelProps {
	recipients: EngagementRecipient[];
	selectedTemplate: EngagementTemplateItem | null;
	selectedPropertyId?: string;
	onSendSingle: (recipient: EngagementRecipient) => Promise<void>;
	onBroadcastSelected: (
		selectedRecipients: EngagementRecipient[],
	) => Promise<void>;
	isSending?: boolean;
}

function getHeaderTitle(category?: string, count = 0): string {
	switch (category) {
		case "Sambutan":
			return `Daftar Penerima: Anak Kos Baru (${count})`;
		case "Ulang Tahun":
			return `Daftar Penerima: Ulang Tahun H-5 (${count})`;
		case "Pembayaran":
			return `Daftar Penerima: Lunas Tepat Waktu (${count})`;
		default:
			return `Daftar Penerima: Seluruh Penghuni (${count})`;
	}
}

function getHeaderSubtitle(category?: string): string {
	switch (category) {
		case "Sambutan":
			return "Menampilkan anak kos baru dalam 30 hari terakhir atau penghuni terbaru.";
		case "Ulang Tahun":
			return "Menampilkan penghuni yang berulang tahun dalam 5 hari ke depan.";
		case "Pembayaran":
			return "Menampilkan penghuni yang telah melunasi pembayaran tepat waktu.";
		default:
			return "Menampilkan seluruh penghuni aktif yang terdaftar di properti.";
	}
}

function getCategoryIcon(category?: string): string {
	switch (category) {
		case "Sambutan":
			return "👋";
		case "Ulang Tahun":
			return "🎂";
		case "Pembayaran":
			return "💳";
		default:
			return "🏠";
	}
}

function getRecipientContextInfo(
	recipient: EngagementRecipient,
	category?: string,
): string {
	switch (category) {
		case "Sambutan":
			return `Mulai sewa: ${formatDate(recipient.startDate)}`;
		case "Ulang Tahun":
			if (recipient.relativeBirthdayLabel) {
				return `Ultah: ${recipient.relativeBirthdayLabel}`;
			}
			if (recipient.birthDate) {
				return `Ultah: ${recipient.birthDate}`;
			}
			if (recipient.daysRemaining === 0) {
				return "Ultah: Hari ini";
			}
			if (
				recipient.daysRemaining !== null &&
				recipient.daysRemaining !== undefined
			) {
				return `Ultah: ${recipient.daysRemaining} hari lagi`;
			}
			return "Ultah: Segera";
		case "Pembayaran":
			return recipient.lastPaymentDate
				? `Bayar: ${formatDate(recipient.lastPaymentDate)}`
				: "Bayar: —";
		default:
			return `Mulai: ${formatDate(recipient.startDate)}`;
	}
}

export function EngagementDynamicRecipientPanel({
	recipients,
	selectedTemplate,
	selectedPropertyId,
	onSendSingle,
	onBroadcastSelected,
	isSending = false,
}: EngagementDynamicRecipientPanelProps) {
	// Filter recipients dynamically based on template category and property
	const filtered = useMemo(() => {
		return filterRecipientsByTemplate(
			recipients,
			selectedTemplate?.category,
			selectedPropertyId,
		);
	}, [recipients, selectedTemplate?.category, selectedPropertyId]);

	// Selection state
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// Reset selection when template or property changes
	useEffect(() => {
		setSelectedIds(new Set());
	}, [selectedTemplate?.id, selectedTemplate?.category, selectedPropertyId]);

	const selectedCount = useMemo(() => {
		return filtered.filter((r) => selectedIds.has(r.tenantId)).length;
	}, [filtered, selectedIds]);

	const isAllSelected =
		filtered.length > 0 && selectedCount === filtered.length;

	const handleToggleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedIds(new Set(filtered.map((r) => r.tenantId)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleToggleRecipient = (tenantId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(tenantId)) {
				next.delete(tenantId);
			} else {
				next.add(tenantId);
			}
			return next;
		});
	};

	interface ConfirmDialogState {
		isOpen: boolean;
		type: "single" | "batch";
		recipient?: EngagementRecipient;
		recipients?: EngagementRecipient[];
		title: string;
		description: string;
	}

	const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
		null,
	);

	const handleSendSingle = (recipient: EngagementRecipient) => {
		if (isSending) return;

		if (recipient.isSentToday) {
			const isPayment = selectedTemplate?.category === "Pembayaran";
			setConfirmDialog({
				isOpen: true,
				type: "single",
				recipient,
				title: "Konfirmasi Kirim Ulang Pesan",
				description: isPayment
					? `Penghuni "${recipient.name}" (Kamar ${recipient.roomNumber}) sudah menerima pesan apresiasi pembayaran hari ini. Ingin tetap mengirim pesan apresiasi lagi?`
					: `Penghuni "${recipient.name}" (Kamar ${recipient.roomNumber}) sudah menerima pesan hari ini. Ingin tetap mengirimkan pesan lagi?`,
			});
			return;
		}

		onSendSingle(recipient);
	};

	const handleBroadcastSelected = () => {
		if (isSending || selectedCount === 0) return;

		const selectedRecipients = filtered.filter((r) =>
			selectedIds.has(r.tenantId),
		);
		if (selectedRecipients.length === 0) return;

		const alreadySentList = selectedRecipients.filter((r) => r.isSentToday);
		if (alreadySentList.length > 0) {
			const isPayment = selectedTemplate?.category === "Pembayaran";
			setConfirmDialog({
				isOpen: true,
				type: "batch",
				recipients: selectedRecipients,
				title: "Konfirmasi Broadcast Ulang",
				description: isPayment
					? `Sebagian penghuni yang Anda pilih (${alreadySentList.length} dari ${selectedRecipients.length} orang) sudah menerima pesan apresiasi hari ini. Ingin tetap mengirim apresiasi ke seluruh penghuni terpilih?`
					: `Sebagian penghuni yang Anda pilih (${alreadySentList.length} dari ${selectedRecipients.length} orang) sudah menerima pesan hari ini. Ingin tetap mengirimkan pesan ke seluruh penghuni terpilih?`,
			});
			return;
		}

		onBroadcastSelected(selectedRecipients);
	};

	const handleConfirmAction = async () => {
		if (!confirmDialog) return;
		const { type, recipient, recipients } = confirmDialog;
		setConfirmDialog(null);

		if (type === "single" && recipient) {
			await onSendSingle(recipient);
		} else if (type === "batch" && recipients) {
			await onBroadcastSelected(recipients);
		}
	};

	const category = selectedTemplate?.category;
	const icon = getCategoryIcon(category);
	const headerTitle = getHeaderTitle(category, filtered.length);
	const headerSubtitle = getHeaderSubtitle(category);

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
			<div>
				{/* Header Section */}
				<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
					<div>
						<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<Users className="w-4 h-4 text-[#4f6958]" />
							{headerTitle}
						</h2>
						<p className="text-[11px] text-[#737873] mt-0.5">
							{headerSubtitle}
						</p>
					</div>
				</div>

				{/* Selection Bar */}
				<div className="flex items-center justify-between mt-3 p-3 bg-[#f8faf8] border border-[#e4e9e4] rounded-xl">
					<div className="flex items-center gap-2">
						<Checkbox
							id="select-all-recipients"
							checked={isAllSelected}
							onCheckedChange={(checked) =>
								handleToggleSelectAll(Boolean(checked))
							}
							disabled={filtered.length === 0}
						/>
						<label
							htmlFor="select-all-recipients"
							className="text-xs font-semibold text-[#252925] cursor-pointer select-none"
						>
							Pilih Semua
						</label>
						<span className="text-xs text-[#737873] ml-1">
							({selectedCount} dari {filtered.length} dipilih)
						</span>
					</div>

					<Button
						type="button"
						disabled={selectedCount === 0 || isSending}
						onClick={handleBroadcastSelected}
						className="bg-[#4f6958] hover:bg-[#3d5244] disabled:opacity-50 text-white text-xs font-semibold px-3 h-8 shadow-xs rounded-lg transition-colors flex items-center gap-1.5"
					>
						<Send className="w-3.5 h-3.5" />
						{category === "Pembayaran"
							? `Kirim Apresiasi ke (${selectedCount}) Terpilih`
							: `Broadcast ke (${selectedCount}) Terpilih`}
					</Button>
				</div>

				{/* Recipient List or Empty State */}
				<div className="mt-3">
					{filtered.length === 0 ? (
						<div className="py-10 text-center text-xs text-[#737873] bg-[#fbfcfb] border border-dashed border-[#e4e9e4] rounded-xl">
							Tidak ada penghuni yang memenuhi kriteria untuk template ini saat
							ini.
						</div>
					) : (
						<div className="divide-y divide-[#edf1ed] max-h-[460px] overflow-y-auto pr-1">
							{filtered.map((recipient) => {
								const isChecked = selectedIds.has(recipient.tenantId);
								const contextInfo = getRecipientContextInfo(
									recipient,
									category,
								);

								return (
									<div
										key={recipient.tenantId}
										onClick={() => handleToggleRecipient(recipient.tenantId)}
										className={`py-3 px-2 flex items-center justify-between gap-3 rounded-lg transition-colors cursor-pointer ${
											isChecked
												? "bg-[#f4f7f4]"
												: "hover:bg-[#fbfcfb] bg-transparent"
										}`}
									>
										{/* Left: Checkbox + Avatar Icon + Tenant Info */}
										<div className="flex items-center gap-3 min-w-0">
											<div
												onClick={(e) => e.stopPropagation()}
												className="flex items-center"
											>
												<Checkbox
													checked={isChecked}
													onCheckedChange={() =>
														handleToggleRecipient(recipient.tenantId)
													}
												/>
											</div>

											<div className="w-8 h-8 rounded-lg bg-[#f3f7f3] text-[#4f6958] flex items-center justify-center text-sm shrink-0">
												{icon}
											</div>

											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<strong className="text-xs font-bold text-[#252925] truncate">
														{recipient.name}
													</strong>
													{recipient.isSentToday ? (
														<span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-[#e8f2ea] text-[#3e724d] border-[#b9dbbf] shrink-0">
															Terkirim Hari Ini
														</span>
													) : (
														<span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-[#f3f7f3] text-[#737873] border-[#e4e9e4] shrink-0">
															Belum Dikirim
														</span>
													)}
												</div>
												<p className="text-[11px] text-[#737873] mt-0.5 truncate">
													Kamar {recipient.roomNumber} ·{" "}
													{recipient.propertyName} · {contextInfo}
												</p>
											</div>
										</div>

										{/* Right: Kirim Button */}
										<div
											onClick={(e) => e.stopPropagation()}
											className="shrink-0 flex items-center gap-1.5"
										>
											<Button
												type="button"
												size="sm"
												variant="outline"
												className="h-7 text-xs border-[#e4e9e4] text-[#4f6958] hover:bg-[#e8f2ea] font-semibold px-2.5"
												onClick={() => handleSendSingle(recipient)}
												disabled={isSending}
											>
												<Send className="w-3 h-3 mr-1" />
												{category === "Pembayaran" ? "Kirim Apresiasi" : "Kirim"}
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Footer Guidance */}
			<div className="mt-4 pt-3 border-t border-[#e4e9e4] text-[11px] text-[#737873] flex items-center justify-between">
				<span>
					💡 <b>Tips:</b> Gunakan tombol broadcast untuk mengirim pesan ke
					beberapa penghuni sekaligus.
				</span>
				<span>{filtered.length} total penghuni tersaring</span>
			</div>

			{/* Confirm Dialog Modal (Bukan default browser alert) */}
			<Dialog
				open={Boolean(confirmDialog?.isOpen)}
				onOpenChange={(open) => {
					if (!open) setConfirmDialog(null);
				}}
			>
				<DialogContent className="max-w-md p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
					<DialogHeader className="flex flex-col gap-2 pb-3 border-b border-[#e4e9e4]">
						<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-[#fcf8ec] flex items-center justify-center shrink-0">
								<AlertTriangle className="w-4 h-4 text-[#b18a4b]" />
							</div>
							{confirmDialog?.title || "Konfirmasi Pengiriman Ulang"}
						</DialogTitle>
						<DialogDescription className="text-xs text-[#55695a] leading-relaxed pt-1">
							{confirmDialog?.description}
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-[#e4e9e4]">
						<Button
							type="button"
							variant="outline"
							className="text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] h-9 px-4 font-medium"
							onClick={() => setConfirmDialog(null)}
							disabled={isSending}
						>
							Batal
						</Button>
						<Button
							type="button"
							className="text-xs bg-[#4f6958] hover:bg-[#425949] text-white h-9 px-4 font-semibold shadow-sm flex items-center gap-1.5"
							onClick={handleConfirmAction}
							disabled={isSending}
						>
							<Send className="w-3.5 h-3.5" />
							{confirmDialog?.type === "batch"
								? "Tetap Broadcast"
								: "Tetap Kirim"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
