import { CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import { Label } from "../../common/shadcn/label.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type { PropertyItem } from "../../common/types/index.ts";
import type { GenerateMonthlyInvoicesInput } from "../../common/validations/index.ts";

export const MONTH_OPTIONS = [
	{ label: "Januari", value: 1 },
	{ label: "Februari", value: 2 },
	{ label: "Maret", value: 3 },
	{ label: "April", value: 4 },
	{ label: "Mei", value: 5 },
	{ label: "Juni", value: 6 },
	{ label: "Juli", value: 7 },
	{ label: "Agustus", value: 8 },
	{ label: "September", value: 9 },
	{ label: "Oktober", value: 10 },
	{ label: "November", value: 11 },
	{ label: "Desember", value: 12 },
];

interface PaymentGenerateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	properties: PropertyItem[];
	defaultPropertyId?: string;
	onGenerate: (data: GenerateMonthlyInvoicesInput) => void;
	isGenerating?: boolean;
}

export function PaymentGenerateDialog({
	open,
	onOpenChange,
	properties,
	defaultPropertyId,
	onGenerate,
	isGenerating = false,
}: PaymentGenerateDialogProps) {
	const now = new Date();
	const currentYear = now.getFullYear();

	const [propertyId, setPropertyId] = useState<string>(
		defaultPropertyId && defaultPropertyId !== "all"
			? defaultPropertyId
			: properties[0]?.id || "",
	);
	const [periodMonth, setPeriodMonth] = useState<number>(now.getMonth() + 1);
	const [periodYear, setPeriodYear] = useState<number>(currentYear);
	const [dueDateDay, setDueDateDay] = useState<number>(10);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!propertyId) return;

		onGenerate({
			propertyId,
			periodMonth,
			periodYear,
			dueDateDay,
		});
	};

	const yearOptions = [
		{ label: String(currentYear - 1), value: currentYear - 1 },
		{ label: String(currentYear), value: currentYear },
		{ label: String(currentYear + 1), value: currentYear + 1 },
	];

	const selectedProperty = properties.find((p) => p.id === propertyId);
	const selectedMonth = MONTH_OPTIONS.find((m) => m.value === periodMonth);
	const selectedYear = yearOptions.find((y) => y.value === periodYear);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[460px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="generate-invoices-desc"
			>
				<DialogHeader className="pb-3 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<Clock className="w-5 h-5 text-[#4f6958]" />
						Generate Tagihan Bulanan Massal
					</DialogTitle>
					<DialogDescription
						id="generate-invoices-desc"
						className="text-xs text-[#737873]"
					>
						Buat invoice sewa otomatis untuk semua kamar yang memiliki kontrak
						aktif
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					{/* Cabang Kos */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Pilih Cabang Kos *
						</Label>
						<Select
							value={propertyId}
							onValueChange={(val) => {
								if (val) setPropertyId(val);
							}}
						>
							<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
								<SelectValue placeholder="Pilih Cabang Kos">
									{selectedProperty?.name}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4] text-xs">
								{properties.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Periode Bulan & Tahun */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Bulan Periode *
							</Label>
							<Select
								value={String(periodMonth)}
								onValueChange={(val) => {
									if (val) setPeriodMonth(Number(val));
								}}
							>
								<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Bulan">
										{selectedMonth?.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-xs">
									{MONTH_OPTIONS.map((m) => (
										<SelectItem key={m.value} value={String(m.value)}>
											{m.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Tahun Periode *
							</Label>
							<Select
								value={String(periodYear)}
								onValueChange={(val) => {
									if (val) setPeriodYear(Number(val));
								}}
							>
								<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Tahun">
										{selectedYear?.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="bg-white border-[#e4e9e4] text-xs">
									{yearOptions.map((y) => (
										<SelectItem key={y.value} value={String(y.value)}>
											{y.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Tanggal Jatuh Tempo Day of Month */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Tanggal Jatuh Tempo (Tanggal setiap bulan) *
						</Label>
						<Input
							type="number"
							min="1"
							max="28"
							value={dueDateDay}
							onChange={(e) => setDueDateDay(Number(e.target.value) || 10)}
							className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
						/>
						<p className="text-[11px] text-[#737873] mt-1">
							Misal: Isi 10 jika jatuh tempo setiap tanggal 10 pada bulan
							berjalan.
						</p>
					</div>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
							onClick={() => onOpenChange(false)}
							disabled={isGenerating}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
							disabled={isGenerating}
						>
							<CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
							{isGenerating ? "Menerbitkan..." : "Terbitkan Tagihan Massal"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
