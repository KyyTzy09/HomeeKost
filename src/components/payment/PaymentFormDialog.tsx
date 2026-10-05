import {
	Check,
	ChevronsUpDown,
	Clock,
	DollarSign,
	MessageSquare,
	Save,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Checkbox } from "../../common/shadcn/checkbox.tsx";
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
import type { TenantItem } from "../../common/types/index.ts";
import type { CreateManualInvoiceInput } from "../../common/validations/index.ts";
import { formatRupiah, parseRupiah } from "../../lib/currency.ts";
import { MONTH_OPTIONS } from "./PaymentGenerateDialog.tsx";

export function getCycleMultiplier(duration?: string): {
	months: number;
	label: string;
} {
	switch (duration) {
		case "Tahunan":
			return { months: 12, label: "Tahunan (12 Bulan)" };
		case "Semesteran":
			return { months: 6, label: "Semesteran (6 Bulan)" };
		case "Triwulan":
			return { months: 3, label: "Triwulan (3 Bulan)" };
		default:
			return { months: 1, label: "Bulanan (1 Bulan)" };
	}
}

export function extractDueDay(dueDateStr?: string | null): number {
	const match = dueDateStr?.match(/\d+/);
	const rawDay = match ? Number.parseInt(match[0], 10) : 10;
	return Math.min(Math.max(rawDay, 1), 28);
}

export function calculateTenantRent(tenant?: {
	rent?: string;
	monthlyRent?: number;
	totalRent?: number;
	duration?: string;
}): {
	monthlyRent: number;
	totalRent: number;
	cycleMonths: number;
	cycleLabel: string;
} {
	const cycle = getCycleMultiplier(tenant?.duration);
	let monthly = 850000;
	let total = 850000;

	if (tenant?.monthlyRent && tenant.monthlyRent > 0) {
		monthly = tenant.monthlyRent;
		total = tenant.totalRent || monthly * cycle.months;
	} else if (tenant?.totalRent && tenant.totalRent > 0) {
		total = tenant.totalRent;
		monthly = Math.round(total / cycle.months);
	} else if (tenant?.rent) {
		const parsed = parseRupiah(tenant.rent) || 850000;
		total = parsed;
		monthly = Math.round(total / cycle.months);
	}

	return {
		monthlyRent: monthly,
		totalRent: total,
		cycleMonths: cycle.months,
		cycleLabel: cycle.label,
	};
}

export function computeDueDate(
	dueDateStr: string | undefined | null,
	year: number,
	month: number,
): string {
	const day = extractDueDay(dueDateStr);
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface PaymentFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenants: TenantItem[];
	onSubmit: (values: CreateManualInvoiceInput) => void;
	isSubmitting?: boolean;
}

export function PaymentFormDialog({
	open,
	onOpenChange,
	tenants,
	onSubmit,
	isSubmitting = false,
}: PaymentFormDialogProps) {
	const now = new Date();
	const currentYear = now.getFullYear();

	const [contractId, setContractId] = useState<string>("");
	const [periodMonth, setPeriodMonth] = useState<number>(now.getMonth() + 1);
	const [periodYear, setPeriodYear] = useState<number>(currentYear);
	const [amount, setAmount] = useState<number>(0);
	const [dueDate, setDueDate] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const [tenantQuery, setTenantQuery] = useState<string>("");
	const [isTenantDropdownOpen, setIsTenantDropdownOpen] =
		useState<boolean>(false);
	const tenantComboboxRef = useRef<HTMLDivElement>(null);

	// Filter hanya penghuni yang memiliki kamar aktif
	const activeTenantsWithRoom = useMemo(() => {
		return tenants.filter((t) => t.roomNo && t.roomNo !== "—");
	}, [tenants]);

	const selectedTenant = activeTenantsWithRoom.find(
		(t) => (t.contractId || t.id) === contractId,
	);
	const rentCalculation = useMemo(
		() => calculateTenantRent(selectedTenant),
		[selectedTenant],
	);
	const dueDay = extractDueDay(selectedTenant?.dueDate);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				tenantComboboxRef.current &&
				!tenantComboboxRef.current.contains(event.target as Node)
			) {
				setIsTenantDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const filteredTenants = useMemo(() => {
		const q = tenantQuery.trim().toLowerCase();
		if (!q) return activeTenantsWithRoom;
		return activeTenantsWithRoom.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.roomNo.toLowerCase().includes(q) ||
				(t.phone?.includes(q) ?? false),
		);
	}, [tenantQuery, activeTenantsWithRoom]);

	const hasInitializedRef = useRef<boolean>(false);

	useEffect(() => {
		if (open) {
			if (!hasInitializedRef.current) {
				hasInitializedRef.current = true;
				if (activeTenantsWithRoom.length > 0) {
					const firstTenant = activeTenantsWithRoom[0];
					setContractId(firstTenant.contractId || firstTenant.id);
					const rentCalc = calculateTenantRent(firstTenant);
					setAmount(rentCalc.totalRent);

					const initMonth = firstTenant.unpaidPeriod?.month || now.getMonth() + 1;
					const initYear = firstTenant.unpaidPeriod?.year || currentYear;
					setPeriodMonth(initMonth);
					setPeriodYear(initYear);
					setDueDate(computeDueDate(firstTenant.dueDate, initYear, initMonth));
				} else {
					const initMonth = now.getMonth() + 1;
					const initYear = currentYear;
					setContractId("");
					setAmount(0);
					setPeriodMonth(initMonth);
					setPeriodYear(initYear);
					setDueDate(computeDueDate(undefined, initYear, initMonth));
				}
				setNotes("");
				setSendWhatsApp(false);
				setErrors({});
				setTenantQuery("");
				setIsTenantDropdownOpen(false);
			}
		} else {
			hasInitializedRef.current = false;
			setTenantQuery("");
			setIsTenantDropdownOpen(false);
		}
	}, [open, activeTenantsWithRoom, currentYear]);

	const handlePeriodMonthChange = (newMonth: number) => {
		setPeriodMonth(newMonth);
		const currentDay = dueDate
			? extractDueDay(dueDate)
			: extractDueDay(selectedTenant?.dueDate);
		setDueDate(
			`${periodYear}-${String(newMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`,
		);
		if (errors.dueDate) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next.dueDate;
				return next;
			});
		}
	};

	const handlePeriodYearChange = (newYear: number) => {
		setPeriodYear(newYear);
		const currentDay = dueDate
			? extractDueDay(dueDate)
			: extractDueDay(selectedTenant?.dueDate);
		setDueDate(
			`${newYear}-${String(periodMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`,
		);
		if (errors.dueDate) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next.dueDate;
				return next;
			});
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors: Record<string, string> = {};

		if (!contractId) {
			newErrors.contractId = "Penghuni / Kamar sewa wajib dipilih.";
		}
		if (!amount || amount < 1000) {
			newErrors.amount = "Nominal tagihan minimal Rp 1.000.";
		}
		const finalDueDate =
			dueDate || computeDueDate(selectedTenant?.dueDate, periodYear, periodMonth);
		if (!finalDueDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalDueDate)) {
			newErrors.dueDate = "Tanggal jatuh tempo wajib diisi dengan format YYYY-MM-DD.";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		onSubmit({
			contractId,
			periodMonth,
			periodYear,
			amount,
			dueDate: finalDueDate,
			notes: notes.trim() || undefined,
			sendWhatsApp,
		});
	};

	const yearOptions = useMemo(() => {
		const baseYears = new Set([
			currentYear - 1,
			currentYear,
			currentYear + 1,
			currentYear + 2,
			periodYear,
		]);
		return Array.from(baseYears)
			.sort((a, b) => a - b)
			.map((y) => ({ label: String(y), value: y }));
	}, [currentYear, periodYear]);

	const selectedTenantLabel = selectedTenant
		? `${selectedTenant.name} — Kamar ${selectedTenant.roomNo} (${formatRupiah(rentCalculation.monthlyRent)}/bln)`
		: undefined;

	const selectedMonthOption = MONTH_OPTIONS.find(
		(m) => m.value === periodMonth,
	);
	const selectedYearOption = yearOptions.find((y) => y.value === periodYear);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[480px] max-h-[85vh] overflow-y-auto p-5 sm:p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="create-invoice-desc"
			>
				<DialogHeader className="pb-2.5 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<DollarSign className="w-5 h-5 text-[#4f6958]" />
						Buat Tagihan Sewa Manual
					</DialogTitle>
					<DialogDescription
						id="create-invoice-desc"
						className="text-xs text-[#737873]"
					>
						Terbitkan invoice tagihan baru untuk kamar dan periode sewa tertentu
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-3 py-1">
					{/* Searchable Combobox Penghuni & Kamar */}
					<div className="space-y-1.5 relative" ref={tenantComboboxRef}>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Pilih Penghuni & Kamar *
						</Label>
						<button
							type="button"
							role="combobox"
							aria-expanded={isTenantDropdownOpen}
							aria-haspopup="listbox"
							onClick={() => setIsTenantDropdownOpen((prev) => !prev)}
							onKeyDown={(e) => {
								if (e.key === "Escape" && isTenantDropdownOpen) {
									e.stopPropagation();
									setIsTenantDropdownOpen(false);
								}
							}}
							className="w-full h-10 px-3 border border-[#e4e9e4] rounded-lg bg-[#fbfcfb] text-left text-xs flex items-center justify-between hover:border-[#8fa594] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8fa594]/20"
						>
							<span
								className={
									selectedTenantLabel
										? "text-[#252925] font-medium truncate"
										: "text-[#737873]"
								}
							>
								{selectedTenantLabel || "Pilih / Cari Penghuni & Kamar..."}
							</span>
							<ChevronsUpDown className="w-4 h-4 text-[#737873] shrink-0 ml-2" />
						</button>

						{isTenantDropdownOpen && (
							<div
								role="listbox"
								className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e9e4] rounded-xl shadow-xl z-50 p-2 space-y-1"
							>
								<div className="flex mb-1 relative">
									<Search className="w-3.5 h-3.5 text-[#737873] absolute left-2.5 top-2" />
									<input
										type="text"
										placeholder="Ketik nama atau nomor kamar..."
										value={tenantQuery}
										onChange={(e) => setTenantQuery(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Escape") {
												e.stopPropagation();
												setIsTenantDropdownOpen(false);
											}
										}}
										className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e4e9e4] rounded-lg outline-none focus:border-[#4f6958] bg-[#fbfcfb]"
										autoFocus
									/>
								</div>

								<div className="max-h-44 overflow-y-auto space-y-0.5">
									{filteredTenants.length === 0 ? (
										<div className="py-3 text-center text-xs text-[#737873]">
											Penghuni tidak ditemukan
										</div>
									) : (
										filteredTenants.map((t) => {
											const isSelected = (t.contractId || t.id) === contractId;
											const tRent = calculateTenantRent(t);
											return (
												<button
													key={t.id}
													type="button"
													role="option"
													aria-selected={isSelected}
													onClick={() => {
														setContractId(t.contractId || t.id);
														setAmount(tRent.totalRent);
														const targetMonth = t.unpaidPeriod?.month || periodMonth;
														const targetYear = t.unpaidPeriod?.year || periodYear;
														setPeriodMonth(targetMonth);
														setPeriodYear(targetYear);
														setDueDate(
															computeDueDate(
																t.dueDate,
																targetYear,
																targetMonth,
															),
														);
														setErrors((prev) => {
															const next = { ...prev };
															delete next.contractId;
															delete next.amount;
															delete next.dueDate;
															return next;
														});
														setIsTenantDropdownOpen(false);
														setTenantQuery("");
													}}
													className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between hover:bg-[#f3f7f3] transition-colors ${
														isSelected
															? "bg-[#f3f7f3] font-semibold text-[#4f6958]"
															: "text-[#252925]"
													}`}
												>
													<div className="truncate pr-2">
														<div className="font-medium text-[#252925] truncate">
															{t.name}
														</div>
														<div className="text-[11px] text-[#737873]">
															Kamar {t.roomNo} · {formatRupiah(tRent.monthlyRent)}/bln
														</div>
													</div>
													{isSelected && (
														<Check className="w-3.5 h-3.5 text-[#4f6958] shrink-0" />
													)}
												</button>
											);
										})
									)}
								</div>
							</div>
						)}

						{errors.contractId && (
							<p className="text-[11px] text-[#a65f5b] mt-1">
								{errors.contractId}
							</p>
						)}
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
									if (val) handlePeriodMonthChange(Number(val));
								}}
							>
								<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Bulan">
										{selectedMonthOption?.label}
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
									if (val) handlePeriodYearChange(Number(val));
								}}
							>
								<SelectTrigger className="w-full h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb]">
									<SelectValue placeholder="Tahun">
										{selectedYearOption?.label}
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

					{/* Lease Information & Calculation Card */}
					{selectedTenant && (
						<div className="p-2.5 rounded-xl bg-[#f3f7f3] border border-[#e4e9e4] space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<span className="text-[#737873] flex items-center gap-1.5 font-medium">
									<Clock className="w-3.5 h-3.5 text-[#4f6958]" />
									Siklus Sewa:
								</span>
								<span className="font-semibold text-[#4f6958] bg-white px-2 py-0.5 rounded-md border border-[#e4e9e4]">
									{rentCalculation.cycleLabel}
								</span>
							</div>
							<div className="flex items-center justify-between text-xs">
								<span className="text-[#737873] font-medium">Tarif Kamar:</span>
								<span className="font-semibold text-[#252925]">
									{formatRupiah(rentCalculation.monthlyRent)} / bln
								</span>
							</div>
							<div className="flex items-center justify-between text-xs">
								<span className="text-[#737873] font-medium">Jatuh Tempo:</span>
								<span className="font-semibold text-[#252925]">
									{selectedTenant.dueDate && selectedTenant.dueDate !== "—"
										? selectedTenant.dueDate
										: `Tanggal ${dueDay} tiap bulan`}
								</span>
							</div>
							<div className="pt-1.5 border-t border-[#e4e9e4]/80 flex items-center justify-between text-xs">
								<span className="text-[#737873] font-medium">
									Kalkulasi Otomatis:
								</span>
								<span className="font-bold text-[#4f6958]">
									{rentCalculation.cycleMonths > 1
										? `${rentCalculation.cycleMonths} bln × ${formatRupiah(rentCalculation.monthlyRent)} = ${formatRupiah(rentCalculation.totalRent)}`
										: formatRupiah(rentCalculation.totalRent)}
								</span>
							</div>
						</div>
					)}
					{/* Tanggal Jatuh Tempo */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Tanggal Jatuh Tempo *
						</Label>
						<Input
							type="date"
							value={dueDate}
							onChange={(e) => {
								setDueDate(e.target.value);
								if (errors.dueDate) {
									setErrors((prev) => {
										const next = { ...prev };
										delete next.dueDate;
										return next;
									});
								}
							}}
							className="h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
						/>
						<p className="text-[11px] text-[#737873] mt-1">
							Otomatis dihitung sesuai siklus sewa, dapat disesuaikan jika ada dispensasi tanggal bayar.
						</p>
						{errors.dueDate && (
							<p className="text-[11px] text-[#a65f5b] mt-1">{errors.dueDate}</p>
						)}
					</div>

					{/* Nominal Tagihan */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Nominal Tagihan (Rp) *
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							value={amount > 0 ? formatRupiah(amount) : ""}
							onChange={(e) => {
								const digits = e.target.value.replace(/[^0-9]/g, "");
								setAmount(digits ? Number.parseInt(digits, 10) : 0);
								if (errors.amount) {
									setErrors((prev) => {
										const next = { ...prev };
										delete next.amount;
										return next;
									});
								}
							}}
							placeholder="Rp 0"
							className="h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
						/>
						<p className="text-[11px] text-[#737873] mt-1">
							Nominal otomatis terhitung sesuai siklus sewa (dapat disesuaikan jika ada biaya tambahan).
						</p>
						{errors.amount && (
							<p className="text-[11px] text-[#a65f5b] mt-1">{errors.amount}</p>
						)}
					</div>

					{/* Notes */}
					<div>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Catatan Tagihan (Opsional)
						</Label>
						<Input
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Contoh: Termasuk biaya tambahan listrik AC"
							className="h-9 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
						/>
					</div>

					{/* Checkbox Send WhatsApp */}
					<div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#f3f7f3] border border-[#e4e9e4]">
						<Checkbox
							id="sendWhatsApp"
							checked={sendWhatsApp}
							onCheckedChange={(checked) => setSendWhatsApp(checked === true)}
							className="mt-0.5"
						/>
						<label
							htmlFor="sendWhatsApp"
							className="text-xs text-[#252925] leading-relaxed cursor-pointer"
						>
							<span className="font-semibold flex items-center gap-1.5">
								<MessageSquare className="w-3.5 h-3.5 text-[#4f6958]" />
								Kirim Tagihan Otomatis ke WhatsApp Penghuni
							</span>
							<span className="text-[#737873] block mt-0.5 text-[11px]">
								Penghuni akan menerima rincian tagihan resmi dan instruksi
								pembayaran via pesan Fonnte.
							</span>
						</label>
					</div>

					<DialogFooter className="pt-2.5 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
							disabled={isSubmitting}
						>
							<Save className="w-3.5 h-3.5 mr-1.5" />
							{isSubmitting ? "Menerbitkan..." : "Terbitkan Invoice"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
