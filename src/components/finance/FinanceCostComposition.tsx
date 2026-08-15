import { PieChart, ShieldCheck } from "lucide-react";
import { Card } from "../../common/shadcn/card.tsx";

export function FinanceCostComposition() {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
			<div>
				<div className="flex items-start justify-between pb-3 border-b border-[#e4e9e4]">
					<div>
						<h2 className="text-sm font-bold text-[#252925]">
							Komposisi Biaya
						</h2>
						<p className="text-[11px] text-[#737873]">
							Berdasarkan kategori pengeluaran operasional & modal
						</p>
					</div>

					<div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f3f7f3] text-[#4f6958] rounded-lg text-xs font-semibold">
						<PieChart className="w-3.5 h-3.5" />
						<span>Total Rp16,56 jt</span>
					</div>
				</div>

				{/* Progress Bars Breakdown */}
				<div className="mt-5 space-y-4">
					<div>
						<div className="flex justify-between text-xs mb-1.5">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-[#5f896d]" />
								<span className="font-semibold text-[#252925]">
									Operasional Rutin
								</span>
							</div>
							<b className="text-[#4f6958]">Rp3,67 jt (22%)</b>
						</div>
						<div className="h-2.5 w-full bg-[#edf0ed] rounded-full overflow-hidden">
							<div
								className="h-full bg-[#5f896d] rounded-full transition-all duration-500"
								style={{ width: "22%" }}
							/>
						</div>
						<span className="text-[10px] text-[#737873] mt-1 block">
							WiFi, Listrik, Air, Kebersihan & Gaji Penjaga
						</span>
					</div>

					<div>
						<div className="flex justify-between text-xs mb-1.5">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-[#4f6958]" />
								<span className="font-semibold text-[#252925]">
									Investasi (Capex)
								</span>
							</div>
							<b className="text-[#4f6958]">Rp10,04 jt (61%)</b>
						</div>
						<div className="h-2.5 w-full bg-[#edf0ed] rounded-full overflow-hidden">
							<div
								className="h-full bg-[#4f6958] rounded-full transition-all duration-500"
								style={{ width: "61%" }}
							/>
						</div>
						<span className="text-[10px] text-[#737873] mt-1 block">
							Box Paket, DP Teralis & Peningkatan Fasilitas
						</span>
					</div>

					<div>
						<div className="flex justify-between text-xs mb-1.5">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-[#b18a4b]" />
								<span className="font-semibold text-[#252925]">
									Biaya Bersama Terbagi
								</span>
							</div>
							<b className="text-[#99773d]">Rp2,85 jt (17%)</b>
						</div>
						<div className="h-2.5 w-full bg-[#edf0ed] rounded-full overflow-hidden">
							<div
								className="h-full bg-[#b18a4b] rounded-full transition-all duration-500"
								style={{ width: "17%" }}
							/>
						</div>
						<span className="text-[10px] text-[#737873] mt-1 block">
							Biaya multi-kos yang dialokasikan proporsional
						</span>
					</div>
				</div>
			</div>

			{/* Health Indicator Footer */}
			<div className="mt-5 pt-3 border-t border-[#e4e9e4] flex items-center justify-between text-[11px] text-[#737873]">
				<div className="flex items-center gap-1.5 text-[#568062] font-semibold">
					<ShieldCheck className="w-4 h-4" />
					<span>Beban Operasional Terkendali (Ideal &lt; 30%)</span>
				</div>
				<span className="font-medium text-[#252925]">Rasio OPEX: 22.3%</span>
			</div>
		</Card>
	);
}
