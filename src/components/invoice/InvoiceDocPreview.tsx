import {
	CheckCircle2,
	Clock,
	CreditCard,
	FileText,
	Printer,
	Wallet2,
} from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type { InvoiceItem } from "../../common/types/index.ts";
import { formatRupiah } from "../../lib/currency.ts";
import { formatDate } from "../../lib/date-utils.ts";

interface InvoiceDocPreviewProps {
	invoice: InvoiceItem | null;
	propertyName?: string;
	propertyImageUrl?: string | null;
	propertyAddress?: string | null;
	onDownloadPdf?: (invoice: InvoiceItem) => void;
}

export function InvoiceDocPreview({
	invoice,
	propertyName = "HomeeKost",
	propertyImageUrl,
	propertyAddress,
	onDownloadPdf,
}: InvoiceDocPreviewProps) {
	if (!invoice) {
		return (
			<Card className="p-8 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col items-center justify-center text-center min-h-[480px]">
				<div className="w-14 h-14 rounded-2xl bg-[#f3f7f3] text-[#4f6958] flex items-center justify-center mb-3">
					<FileText className="w-7 h-7" />
				</div>
				<h3 className="text-sm font-bold text-[#252925] mb-1">Pilih Invoice</h3>
				<p className="text-xs text-[#737873] max-w-[280px]">
					Pilih salah satu invoice di panel kiri untuk melihat pratinjau dokumen
					faktur atau kwitansi digital resmi.
				</p>
			</Card>
		);
	}

	const isPaid = invoice.status === "PAID";
	const isOverdue = invoice.status === "OVERDUE";
	const isPartial = invoice.status === "PARTIAL";

	const handlePrint = () => {
		if (onDownloadPdf) {
			onDownloadPdf(invoice);
		} else {
			window.print();
		}
	};

	return (
		<div className="space-y-4">
			{/* Action Toolbar above Document */}
			<div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-white border border-[#e4e9e4] rounded-xl shadow-xs print:hidden">
				<div className="flex items-center gap-2">
					<span
						className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
							isPaid
								? "bg-[#e8f2ea] text-[#568062]"
								: isOverdue
									? "bg-[#f7e9e8] text-[#a65f5b]"
									: isPartial
										? "bg-[#fef3c7] text-[#92400e]"
										: "bg-[#fbf4e6] text-[#b18a4b]"
						}`}
					>
						{isPaid ? (
							<CheckCircle2 className="w-3.5 h-3.5" />
						) : (
							<Clock className="w-3.5 h-3.5" />
						)}
						{isPaid
							? "Status: LUNAS"
							: isOverdue
								? "Status: TERLAMBAT"
								: isPartial
									? "Status: CICILAN"
									: "Status: BELUM LUNAS"}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handlePrint}
						className="h-8 px-3 text-xs font-semibold border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3]"
						title="Cetak atau Simpan sebagai file PDF resmi"
					>
						<Printer className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
						Cetak / Simpan PDF
					</Button>
				</div>
			</div>

			{/* ─── Printable Official Invoice Sheet (A4 Proportion) ───────── */}
			<Card
				id="printable-invoice-sheet"
				className="p-6 sm:p-8 md:p-10 bg-white border-[#e4e9e4] shadow-[0_4px_24px_rgba(48,65,53,0.07)] relative overflow-hidden print:border print:shadow-none print:p-6 print:m-0 print:w-full max-w-[760px] mx-auto w-full min-w-0"
			>
				{/* Watermark Stamp: LUNAS / OFFICIAL INVOICE */}
				{isPaid ? (
					<div className="absolute right-8 top-28 pointer-events-none select-none border-4 border-dashed border-[#568062]/30 rounded-xl px-4 py-1.5 rotate-[-12deg] text-center">
						<span className="text-xl md:text-2xl font-black tracking-widest text-[#568062]/40 block">
							LUNAS
						</span>
						<span className="text-[9px] font-bold text-[#568062]/50 block">
							DIVERIFIKASI RESMI
						</span>
					</div>
				) : (
					<div className="absolute right-8 top-28 pointer-events-none select-none border-2 border-dashed border-[#b18a4b]/30 rounded-xl px-3 py-1 rotate-[-12deg] text-center">
						<span className="text-sm md:text-base font-bold tracking-wider text-[#b18a4b]/40 block">
							TAGIHAN SEWA
						</span>
					</div>
				)}

				{/* Header Section */}
				<div className="flex flex-col sm:flex-row justify-between sm:items-start border-b-2 border-[#4f6958]/20 pb-5 mb-6 gap-4 print:flex-row">
					<div>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl border border-[#e4e9e4] bg-[#faf9f5] flex items-center justify-center p-1 shrink-0 overflow-hidden">
								<img
									src={propertyImageUrl || "/logo.png"}
									alt={propertyName || "HomeeKost"}
									className="w-full h-full object-contain"
									onError={(e) => {
										(e.target as HTMLImageElement).src = "/logo.png";
									}}
								/>
							</div>
							<div>
								<h2 className="font-bold text-[#252925] text-base leading-tight">
									{propertyName || "HomeeKost Management"}
								</h2>
								<p className="text-[11px] text-[#737873]">
									{propertyAddress || "Sistem Pengelolaan Kos & Hunian Modern"}
								</p>
							</div>
						</div>
					</div>

					<div className="sm:text-right">
						<span className="text-[10px] font-bold tracking-wider uppercase text-[#4f6958] bg-[#e8f0ea] px-2.5 py-1 rounded-md inline-block">
							{isPaid ? "KWITANSI PEMBAYARAN RESMI" : "INVOICE SEWA DIGITAL"}
						</span>
						<b className="text-sm md:text-base font-bold text-[#252925] block mt-1.5">
							{invoice.number}
						</b>
						<small className="text-[#737873] text-[11px] block mt-0.5">
							Tanggal Terbit: <b>{formatDate(invoice.createdDate)}</b>
						</small>
					</div>
				</div>

				{/* Recipient & Billing Meta Information */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-[#fafbfa] border border-[#e4e9e4] text-xs">
					<div>
						<span className="text-[10px] font-bold text-[#737873] uppercase tracking-wider block mb-1">
							Ditagihkan Kepada:
						</span>
						<div className="text-sm font-bold text-[#252925]">
							{invoice.tenantName}
						</div>
						<div className="text-xs text-[#737873] mt-1 space-y-0.5">
							<p>
								Kamar: <b className="text-[#4f6958]">{invoice.roomNumber}</b>
							</p>
							{invoice.tenantPhone && (
								<p>
									No. WhatsApp: <span>{invoice.tenantPhone}</span>
								</p>
							)}
						</div>
					</div>

					<div className="sm:text-right flex flex-col justify-between">
						<div>
							<span className="text-[10px] font-bold text-[#737873] uppercase tracking-wider block mb-1">
								Periode Sewa:
							</span>
							<div className="text-xs font-bold text-[#252925]">
								{invoice.period}
							</div>
						</div>

						<div className="mt-2 pt-2 border-t border-[#e4e9e4]/60">
							{isPaid ? (
								<p className="text-[11px] text-[#568062] font-semibold">
									Tanggal Lunas: {formatDate(invoice.paidAt || invoice.dueDate)}
								</p>
							) : (
								<p className="text-[11px] text-[#b18a4b] font-semibold">
									Batas Jatuh Tempo: {formatDate(invoice.dueDate)}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Itemized Table */}
				<div className="border border-[#e4e9e4] rounded-xl overflow-hidden mb-6">
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							<tr className="bg-[#f5f8f5] border-b border-[#e4e9e4] text-[#4f6958] text-[11px] font-bold">
								<th className="py-3 px-4">Deskripsi Rincian</th>
								<th className="py-3 px-4 text-center">Periode</th>
								<th className="py-3 px-4 text-right">Nominal (Rp)</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e4e9e4]">
							<tr className="hover:bg-[#fbfcfb]">
								<td className="py-3.5 px-4">
									<div className="font-bold text-[#252925]">
										{invoice.description ||
											`Biaya Sewa Kamar ${invoice.roomNumber}`}
									</div>
									<div className="text-[11px] text-[#737873] mt-0.5">
										Fasilitas: Wi-Fi, Air Bersih, Listrik & Keamanan 24 Jam
									</div>
								</td>
								<td className="py-3.5 px-4 text-center text-[#737873] font-medium">
									{invoice.period}
								</td>
								<td className="py-3.5 px-4 text-right text-[#252925] font-bold text-sm">
									{formatRupiah(invoice.amount)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* Total & Summary Banner */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-[#f3f7f3] border border-[#dce7de] mb-6 gap-3">
					<div>
						<span className="text-xs font-semibold text-[#4f6958] block">
							Total yang {isPaid ? "Telah Dibayar" : "Harus Dibayar"}
						</span>
						<span className="text-[11px] text-[#737873]">
							{isPaid
								? "Pembayaran telah terverifikasi penuh"
								: "Termasuk seluruh fasilitas sewa bulanan"}
						</span>
					</div>
					<div className="text-right">
						<span className="text-lg md:text-xl font-black text-[#4f6958]">
							{formatRupiah(invoice.amount)}
						</span>
					</div>
				</div>

				{/* Payment Instructions / Bank Account Destination */}
				{!isPaid && (
					<div className="p-4 rounded-xl bg-[#fbfcfb] border border-[#e4e9e4] mb-6">
						<h4 className="text-xs font-bold text-[#252925] flex items-center gap-1.5 mb-2">
							<CreditCard className="w-3.5 h-3.5 text-[#4f6958]" />
							Petunjuk Pembayaran Resmi:
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
							<div className="bg-white p-3 rounded-lg border border-[#e4e9e4]">
								<span className="text-[10px] text-[#737873] block">
									Transfer Bank BCA:
								</span>
								<b className="text-sm tabular-nums font-bold text-[#252925] tracking-wider block mt-0.5">
									8735081290
								</b>
								<span className="text-[11px] text-[#737873] block mt-0.5">
									a.n. <b>Bude Frisda / Pengelola Kos</b>
								</span>
							</div>

							<div className="bg-white p-3 rounded-lg border border-[#e4e9e4] flex items-center justify-between">
								<div>
									<span className="text-[10px] text-[#737873] block">
										Metode Lain:
									</span>
									<b className="text-xs text-[#252925] block mt-0.5">
										QRIS / Tunai
									</b>
									<span className="text-[10px] text-[#737873] block mt-0.5">
										Konfirmasi via WhatsApp
									</span>
								</div>
								<div className="w-10 h-10 rounded-md bg-[#f3f7f3] border border-[#e4e9e4] flex items-center justify-center text-[#4f6958]">
									<Wallet2 className="w-6 h-6 opacity-70" />
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Signatures & Seal */}
				<div className="pt-4 border-t border-[#e4e9e4] flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-[#737873] print:flex-row">
					<div>
						<p className="text-[11px] text-[#737873] max-w-[340px] leading-relaxed">
							Dokumen ini diterbitkan secara resmi melalui sistem manajemen
							digital HomeeKost. Harap simpan sebagai bukti transaksi yang sah.
						</p>
					</div>

					<div className="text-center min-w-[140px]">
						<p className="text-[11px] text-[#737873] mb-8">Pengelola Kos,</p>
						<div className="font-bold text-xs text-[#252925] border-t border-[#252925]/30 pt-1">
							{propertyName || "Manajemen Kos"}
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
