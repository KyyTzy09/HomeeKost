import {
	AlertTriangle,
	ChevronDown,
	HelpCircle,
	Info,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Card } from "../../common/shadcn/card.tsx";

interface ReportHealthCriteriaGuideProps {
	isClosedPeriod?: boolean;
}

export function ReportHealthCriteriaGuide({
	isClosedPeriod = false,
}: ReportHealthCriteriaGuideProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Card className="panel p-5 ring-0 border-[#e4e9e4] rounded-[10px] bg-white transition-all">
			<div
				className="flex items-center justify-between cursor-pointer select-none"
				onClick={() => setIsOpen((prev) => !prev)}
			>
				<div className="flex items-center gap-2.5">
					<div className="w-8 h-8 rounded-lg bg-[#edf5ee] border border-[#d2e2d5] text-[#4f6958] flex items-center justify-center shrink-0">
						<HelpCircle className="w-4 h-4" />
					</div>
					<div>
						<h3 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<span>Standar & Kriteria Penilaian Kesehatan Finansial</span>
							<span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-[#f4f7f4] text-[#4f6958] border border-[#dce6dc]">
								{isClosedPeriod ? "Tutup Buku Final" : "Bulan Berjalan"}
							</span>
						</h3>
						<p className="text-[11.5px] text-[#737873] mt-0.5">
							Syarat objektif penentuan status Prima, Waspada, dan Bahaya/Kritis berbasis data rasio beban kas, okupansi kamar, dan penagihan
						</p>
					</div>
				</div>

				<div className="flex items-center gap-1.5 text-xs font-semibold text-[#4f6958] shrink-0">
					<span>{isOpen ? "Sembunyikan Kriteria" : "Lihat Syarat Kriteria"}</span>
					<ChevronDown
						className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
				</div>
			</div>

			{isOpen && (
				<div className="mt-4 pt-4 border-t border-[#edf1ed] grid grid-cols-1 md:grid-cols-3 gap-3.5 animate-in fade-in-50 duration-200">
					{/* 1. Prima */}
					<div className="p-4 rounded-xl border border-[#b9dbbf] bg-[#e8f2ea]/40 space-y-2.5 flex flex-col justify-between">
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#b9dbbf] bg-[#e8f2ea] text-[#3e724d]">
									<ShieldCheck className="w-3.5 h-3.5 text-[#3e724d]" />
									Prima
								</span>
								<span className="text-[11px] font-bold text-[#3e724d]">
									Sangat Sehat
								</span>
							</div>

							<div className="space-y-1.5 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">
									Syarat Terpenuhi (Wajib Semua):
								</p>
								<ul className="list-disc list-inside space-y-1 text-[10.5px] text-[#556358]">
									<li>
										<strong>Rasio Beban Kas &lt; 25%</strong> (Margin Laba Bersih &gt; 75%)
									</li>
									<li>
										<strong>Okupansi Kamar &ge; 80%</strong> dari total kapasitas unit
									</li>
									<li>
										<strong>Collection Rate &ge; 85%</strong> (Ketepatan pembayaran sewa)
									</li>
								</ul>
							</div>
						</div>

						<p className="pt-2 text-[10.5px] text-[#4f6958] border-t border-[#b9dbbf]/50 mt-2">
							<strong>Tindakan:</strong> Arus kas sangat kokoh dan beban sangat efisien. Pertahankan manajemen kas dan kepuasan penghuni.
						</p>
					</div>

					{/* 2. Waspada */}
					<div className="p-4 rounded-xl border border-[#eed7b0] bg-[#fbf4e6]/40 space-y-2.5 flex flex-col justify-between">
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#eed7b0] bg-[#fbf4e6] text-[#b18a4b]">
									<AlertTriangle className="w-3.5 h-3.5 text-[#b18a4b]" />
									Waspada
								</span>
								<span className="text-[11px] font-bold text-[#b18a4b]">
									Perhatian Operasional
								</span>
							</div>

							<div className="space-y-1.5 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">
									Syarat Terpenuhi (Salah Satu):
								</p>
								<ul className="list-disc list-inside space-y-1 text-[10.5px] text-[#7d6537]">
									<li>
										<strong>Rasio Beban Kas 25% – 50%</strong> (Margin Laba 50% – 75%)
									</li>
									<li>
										<strong>Okupansi Kamar &lt; 70%</strong> unit terisi
									</li>
									<li>
										<strong>Biaya Komplain/Perbaikan &gt; 20%</strong> dari total pengeluaran
									</li>
								</ul>
							</div>
						</div>

						<p className="pt-2 text-[10.5px] text-[#84632f] border-t border-[#eed7b0]/60 mt-2">
							<strong>Tindakan:</strong> Operasional masih menghasilkan surplus, namun ada beban membengkak atau kamar kosong yang butuh promosi.
						</p>
					</div>

					{/* 3. Bahaya / Kritis */}
					<div className="p-4 rounded-xl border border-[#f0c3c1] bg-[#fceeed]/40 space-y-2.5 flex flex-col justify-between">
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#f0c3c1] bg-[#fceeed] text-[#b66b68]">
									<ShieldAlert className="w-3.5 h-3.5 text-[#b66b68]" />
									Bahaya / Kritis
								</span>
								<span className="text-[11px] font-bold text-[#b66b68]">
									Tindakan Segera
								</span>
							</div>

							<div className="space-y-1.5 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">
									Syarat Terpenuhi (Saat Tutup Buku):
								</p>
								<ul className="list-disc list-inside space-y-1 text-[10.5px] text-[#8c4b48]">
									<li>
										<strong>Periode Telah Tutup Buku</strong> DAN
									</li>
									<li>
										<strong>Rasio Beban Kas &gt; 50%</strong> (Margin Laba &lt; 50%) ATAU
									</li>
									<li>
										<strong>Collection Rate &lt; 50%</strong> (Banyak sewa tertunggak)
									</li>
								</ul>
								{!isClosedPeriod && (
									<div className="flex items-start gap-1 p-1.5 rounded-md bg-[#fff7f7] border border-[#f5d7d6] text-[10px] text-[#8c4b48] mt-1">
										<Info className="w-3 h-3 shrink-0 mt-0.5 text-[#b66b68]" />
										<span>Pada bulan berjalan, sistem membatasi status maksimal ke <em>Waspada</em> karena penagihan sewa masih berproses.</span>
									</div>
								)}
							</div>
						</div>

						<p className="pt-2 text-[10.5px] text-[#8c4b48] border-t border-[#f0c3c1]/60 mt-2">
							<strong>Tindakan:</strong> Segera audit pos pengeluaran terbesar dan lakukan penagihan intensif pada piutang sewa penghuni yang tertunggak.
						</p>
					</div>
				</div>
			)}
		</Card>
	);
}
