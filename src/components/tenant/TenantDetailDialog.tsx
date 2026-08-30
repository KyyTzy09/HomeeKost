import { Pencil, Trash2, User } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { TenantItem } from "../../common/types/index.ts";
import { formatShortDueDate } from "../../lib/date-utils.ts";
import { formatDisplayPhone } from "../../lib/phone-utils.ts";

interface TenantDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenant: TenantItem | null;
	propertyName: string;
	onEdit: (tenant: TenantItem) => void;
	onDelete: (tenant: TenantItem) => void;
}

export function TenantDetailDialog({
	open,
	onOpenChange,
	tenant,
	propertyName,
	onEdit,
	onDelete,
}: TenantDetailDialogProps) {
	if (!tenant) return null;

	const isLancar = tenant.paymentStatus === "Lancar";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader>
					<div className="flex items-center gap-2.5 mb-1">
						<div className="w-8 h-8 rounded-[9px] bg-[#edf4ee] text-[#4f6958] flex items-center justify-center">
							<User className="w-4 h-4" />
						</div>
						<div>
							<DialogTitle className="text-[18px] font-bold text-[#29382e]">
								{tenant.name}
							</DialogTitle>
							<DialogDescription className="text-[11px] text-[#8a958d]">
								Penghuni Kamar {tenant.roomNo} · {propertyName}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 my-2">
					{/* Status Tag */}
					<div className="flex items-center justify-between bg-[#f8faf8] border border-[#e7ece7] rounded-[12px] p-3">
						<div>
							<span className="text-[10px] text-[#8a958d] uppercase font-bold tracking-wider block mb-0.5">
								Status Pembayaran
							</span>
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-bold ${
									isLancar
										? "bg-[#e8f2ea] text-[#568062]"
										: "bg-[#f7e9e8] text-[#a65f5b]"
								}`}
							>
								{tenant.paymentStatus}
							</span>
						</div>

						<div className="text-right">
							<span className="text-[10px] text-[#8a958d] uppercase font-bold tracking-wider block mb-0.5">
								Jatuh Tempo
							</span>
							<b className="text-[12px] text-[#252925]">
								{formatShortDueDate(tenant.dueDate)}
							</b>
						</div>
					</div>

					{/* Section 1: Informasi Pribadi & Identitas */}
					<div>
						<h4 className="text-[11.5px] font-bold text-[#24342b] uppercase tracking-wider mb-2">
							Informasi Pribadi & Identitas
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									NIK (Nomor Induk Kependudukan)
								</span>
								<b className="text-[11.5px] text-[#34443a] font-mono tracking-wider">
									{tenant.nik}
								</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Nomor WhatsApp
								</span>
								<b className="text-[11.5px] text-[#34443a] font-mono">
									{formatDisplayPhone(tenant.phone)}
								</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Pekerjaan / Pendidikan
								</span>
								<b className="text-[11.5px] text-[#34443a]">
									{tenant.occupationStatus}
									{tenant.institution ? ` (${tenant.institution})` : ""}
								</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Email
								</span>
								<b className="text-[11.5px] text-[#34443a]">
									{tenant.email || "—"}
								</b>
							</div>

							<div className="col-span-1 sm:col-span-2 bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Alamat Asal
								</span>
								<b className="text-[11.5px] text-[#34443a]">
									{tenant.originAddress || "—"}
								</b>
							</div>
						</div>
					</div>

					{/* Section 2: Sewa & Kamar */}
					<div>
						<h4 className="text-[11.5px] font-bold text-[#24342b] uppercase tracking-wider mb-2">
							Rincian Sewa
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Kamar
								</span>
								<b className="text-[12px] text-[#34443a]">{tenant.roomNo}</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Harga Sewa
								</span>
								<b className="text-[12px] text-[#34443a]">{tenant.rent}</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Durasi
								</span>
								<b className="text-[12px] text-[#34443a]">{tenant.duration}</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Mulai Sewa
								</span>
								<b className="text-[11.5px] text-[#34443a]">
									{tenant.startDate}
								</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Kendaraan
								</span>
								<b className="text-[11.5px] text-[#34443a]">
									{tenant.vehicle || "—"}
								</b>
							</div>

							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-2.5">
								<span className="block text-[9.5px] text-[#8a958d] font-semibold mb-0.5">
									Deposit
								</span>
								<b className="text-[11.5px] text-[#34443a]">
									{tenant.deposit || "Rp0"}
								</b>
							</div>
						</div>
					</div>

					{/* Section: Foto Dokumen KTP */}
					{tenant.ktpUrl && (
						<div>
							<h4 className="text-[11.5px] font-bold text-[#24342b] uppercase tracking-wider mb-2">
								Dokumen KTP Terlampir
							</h4>
							<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[12px] p-3 flex flex-col sm:flex-row items-center gap-3">
								<div className="w-full sm:w-[140px] aspect-[16/10] rounded-[8px] overflow-hidden border border-[#d8e4da] bg-black/5 shrink-0">
									<img
										src={tenant.ktpUrl}
										alt={`KTP ${tenant.name}`}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="text-[11px] text-[#55695a] space-y-1">
									<strong className="text-[#252925] block">
										Foto KTP Penghuni
									</strong>
									<p className="text-[10px] text-[#737873] m-0">
										Arsip foto kartu identitas tersimpan aman dan terenkripsi.
									</p>
									<a
										href={tenant.ktpUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-block text-[10.5px] font-bold text-[#4f6958] hover:underline pt-1"
									>
										🔍 Lihat Ukuran Penuh
									</a>
								</div>
							</div>
						</div>
					)}

					{/* Section 3: Kontak Darurat */}
					<div>
						<h4 className="text-[11.5px] font-bold text-[#24342b] uppercase tracking-wider mb-2">
							Kontak Darurat
						</h4>
						<div className="bg-[#fcfdfc] border border-[#e7ece7] rounded-[10px] p-3 text-[11.5px] text-[#34443a]">
							{tenant.emergencyName ? (
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
									<span>
										<strong>{tenant.emergencyName}</strong>{" "}
										{tenant.emergencyRelation
											? `(${tenant.emergencyRelation})`
											: ""}
									</span>
									<span className="font-mono text-[#506257]">
										{formatDisplayPhone(tenant.emergencyPhone || "")}
									</span>
								</div>
							) : (
								<span className="text-[#8a958d]">
									Tidak ada kontak darurat yang terdaftar.
								</span>
							)}
						</div>
					</div>
				</div>

				<DialogFooter className="pt-3 border-t border-[#edf1ed] flex flex-row items-center justify-between sm:justify-between gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							onOpenChange(false);
							onDelete(tenant);
						}}
						className="h-[38px] px-3.5 rounded-[9px] border-[#efd4d0] bg-[#fff5f3] text-[#a45149] hover:bg-[#faeae8] text-[12px] font-semibold flex items-center gap-1.5"
					>
						<Trash2 className="w-3.5 h-3.5" />
						Check-Out Penghuni
					</Button>

					<Button
						type="button"
						onClick={() => {
							onOpenChange(false);
							onEdit(tenant);
						}}
						className="h-[38px] px-4 rounded-[9px] bg-[#4f6958] hover:bg-[#425949] text-white text-[12px] font-semibold flex items-center gap-1.5"
					>
						<Pencil className="w-3.5 h-3.5" />
						Edit Data
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
