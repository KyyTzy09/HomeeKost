import { Download, FileText, Send } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type { InvoiceItem } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";
import { formatDate } from "../../lib/date-utils.ts";

interface InvoiceDocPreviewProps {
	invoice: InvoiceItem | null;
	propertyName?: string;
	onSendWhatsApp?: (invoice: InvoiceItem) => void;
	onDownloadPdf?: (invoice: InvoiceItem) => void;
}

export function InvoiceDocPreview({
	invoice,
	propertyName = "HomeeKost",
	onSendWhatsApp,
	onDownloadPdf,
}: InvoiceDocPreviewProps) {
	if (!invoice) {
		return (
			<Card className="p-8 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col items-center justify-center text-center min-h-[420px]">
				<div className="w-12 h-12 rounded-xl bg-[#f3f7f3] text-[#4f6958] flex items-center justify-center mb-3">
					<FileText className="w-6 h-6" />
				</div>
				<h3 className="text-sm font-semibold text-[#252925] mb-1">
					Pilih Invoice
				</h3>
				<p className="text-xs text-[#737873] max-w-[260px]">
					Klik salah satu invoice di panel kiri untuk melihat pratinjau dokumen
					faktur digital sewa kamar.
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-6 md:p-7 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* Document Header */}
			<header className="flex justify-between items-start border-b border-[#e4e9e4] pb-4 mb-5">
				<div>
					<div className="font-bold text-[#4f6958] text-lg tracking-tight">
						{propertyName || "HomeeKost"}
					</div>
					<small className="block text-[#737873] text-[10px] mt-0.5">
						Invoice sewa kamar
					</small>
				</div>
				<div className="text-right">
					<b className="text-sm font-bold text-[#252925]">{invoice.number}</b>
					<small className="block text-[#737873] text-[10px] mt-0.5">
						Dibuat {formatDate(invoice.createdDate)}
					</small>
				</div>
			</header>

			{/* Tenant & Period Information */}
			<div className="flex justify-between items-start mb-5 text-xs">
				<div>
					<small className="text-[#737873] text-[10px] block mb-1">
						Ditagihkan kepada
					</small>
					<div className="text-sm font-bold text-[#252925]">
						{invoice.tenantName}
					</div>
					<small className="text-[#737873] text-[10px] block mt-0.5">
						Kamar {invoice.roomNumber}
						{invoice.tenantPhone ? ` · ${invoice.tenantPhone}` : ""}
					</small>
				</div>
				<div className="text-right">
					<small className="text-[#737873] text-[10px] block mb-1">
						Periode
					</small>
					<div className="text-xs font-semibold text-[#252925]">
						{invoice.period}
					</div>
					{invoice.dueDate && (
						<small className="text-[#99773d] text-[10px] block mt-0.5">
							Jatuh tempo: {formatDate(invoice.dueDate)}
						</small>
					)}
				</div>
			</div>

			{/* Itemized Table */}
			<div className="border border-[#e4e9e4] rounded-lg overflow-hidden mb-4">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="bg-[#f3f7f3] border-b border-[#e4e9e4] text-[#737873] text-[11px] font-semibold">
							<th className="py-2.5 px-3">Deskripsi</th>
							<th className="py-2.5 px-3 text-right">Jumlah</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#e4e9e4]">
						<tr className="hover:bg-[#fbfcfb]">
							<td className="py-3 px-3 text-[#252925] font-medium">
								{invoice.description || `Sewa kamar ${invoice.roomNumber}`}
							</td>
							<td className="py-3 px-3 text-right text-[#252925] font-semibold">
								{formatRupiah(invoice.amount)}
							</td>
						</tr>
						<tr className="hover:bg-[#fbfcfb] text-[#737873]">
							<td className="py-2.5 px-3">Internet & Fasilitas Bersama</td>
							<td className="py-2.5 px-3 text-right text-[#568062] font-medium">
								Termasuk
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Invoice Total Banner */}
			<div className="bg-[#f3f7f3] border border-[#e4e9e4] p-3.5 rounded-lg flex justify-between items-center mb-5">
				<span className="text-xs text-[#737873] font-medium">
					Total tagihan
				</span>
				<strong className="text-base font-bold text-[#4f6958]">
					{formatRupiah(invoice.amount)}
				</strong>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-2.5 pt-1">
				<Button
					type="button"
					className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
					onClick={() => onSendWhatsApp?.(invoice)}
				>
					<Send className="w-3.5 h-3.5 mr-1.5" />
					Kirim via WhatsApp
				</Button>
				<Button
					type="button"
					variant="outline"
					className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
					onClick={() => onDownloadPdf?.(invoice)}
				>
					<Download className="w-3.5 h-3.5 mr-1.5" />
					Download PDF
				</Button>
			</div>
		</Card>
	);
}
