import {
	Check,
	ChevronsUpDown,
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
import { parseRupiah } from "../../lib/currency.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";
import { MONTH_OPTIONS } from "./PaymentGenerateDialog.tsx";

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
	const todayStr = useMemo(() => getTodayDateString(), []);
	const currentYear = now.getFullYear();

	const [contractId, setContractId] = useState<string>("");
	const [periodMonth, setPeriodMonth] = useState<number>(now.getMonth() + 1);
	const [periodYear, setPeriodYear] = useState<number>(currentYear);
	const [amount, setAmount] = useState<number>(0);
	const [dueDate, setDueDate] = useState<string>(todayStr);
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

	useEffect(() => {
		if (open) {
			if (activeTenantsWithRoom.length > 0) {
				const firstTenant = activeTenantsWithRoom[0];
				setContractId(firstTenant.contractId || firstTenant.id);
				setAmount(parseRupiah(firstTenant.rent) || 850000);
			} else {
				setContractId("");
				setAmount(0);
			}
			setPeriodMonth(now.getMonth() + 1);
			setPeriodYear(currentYear);
			setDueDate(todayStr);
			setNotes("");
			setSendWhatsApp(false);
			setErrors({});
			setTenantQuery("");
			setIsTenantDropdownOpen(false);
		} else {
			setTenantQuery("");
			setIsTenantDropdownOpen(false);
		}
	}, [open, activeTenantsWithRoom, currentYear, todayStr]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors: Record<string, string> = {};

		if (!contractId) {
			newErrors.contractId = "Penghuni / Kamar sewa wajib dipilih.";
		}
		if (!amount || amount < 1000) {
			newErrors.amount = "Nominal tagihan minimal Rp 1.000.";
		}
		if (!dueDate) {
			newErrors.dueDate = "Tanggal jatuh tempo wajib diisi.";
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
			dueDate,
			notes: notes.trim() || undefined,
			sendWhatsApp,
		});
	};

	const yearOptions = [
		{ label: String(currentYear - 1), value: currentYear - 1 },
		{ label: String(currentYear), value: currentYear },
		{ label: String(currentYear + 1), value: currentYear + 1 },
	];

	const selectedTenant = activeTenantsWithRoom.find(
		(t) => (t.contractId || t.id) === contractId,
	);
	const selectedTenantLabel = selectedTenant
		? `${selectedTenant.name} — Kamar ${selectedTenant.roomNo} (${selectedTenant.rent}/bln)`
		: undefined;

	const selectedMonthOption = MONTH_OPTIONS.find(
		(m) => m.value === periodMonth,
	);
	const selectedYearOption = yearOptions.find((y) => y.value === periodYear);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[500px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="create-invoice-desc"
			>
				<DialogHeader className="pb-3 border-b border-[#e4e9e4]">
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

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					{/* Searchable Combobox Penghuni & Kamar */}
					<div className="space-y-1.5 relative" ref={tenantComboboxRef}>
						<Label className="text-xs font-semibold text-[#252925] mb-1 block">
							Pilih Penghuni & Kamar *
						</Label>
						<button
							type="button"
							onClick={() => setIsTenantDropdownOpen((prev) => !prev)}
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
							<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e9e4] rounded-xl shadow-xl z-50 p-2 space-y-1">
								<div className="relative mb-1">
									<Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#737873]" />
									<input
										type="text"
										placeholder="Ketik nama atau nomor kamar..."
										value={tenantQuery}
										onChange={(e) => setTenantQuery(e.target.value)}
										className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e4e9e4] rounded-lg outline-none focus:border-[#4f6958] bg-[#fbfcfb]"
										autoFocus
									/>
								</div>

								<div className="max-h-56 overflow-y-auto space-y-0.5">
									{filteredTenants.length === 0 ? (
										<div className="py-3 text-center text-xs text-[#737873]">
											Penghuni tidak ditemukan
										</div>
									) : (
										filteredTenants.map((t) => {
											const isSelected = (t.contractId || t.id) === contractId;
											return (
												<button
													key={t.id}
													type="button"
													onClick={() => {
														setContractId(t.contractId || t.id);
														setAmount(parseRupiah(t.rent) || 850000);
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
															Kamar {t.roomNo} · {t.rent}/bln
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
									if (val) setPeriodMonth(Number(val));
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
									if (val) setPeriodYear(Number(val));
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

					{/* Amount & Due Date */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Nominal Tagihan (Rp) *
							</Label>
							<Input
								type="number"
								min="1000"
								step="1000"
								value={amount || ""}
								onChange={(e) => setAmount(Number(e.target.value) || 0)}
								placeholder="Contoh: 1200000"
								className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
							/>
							{errors.amount && (
								<p className="text-[11px] text-[#a65f5b] mt-1">
									{errors.amount}
								</p>
							)}
						</div>

						<div>
							<Label className="text-xs font-semibold text-[#252925] mb-1 block">
								Jatuh Tempo Pembayaran *
							</Label>
							<Input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
							/>
							{errors.dueDate && (
								<p className="text-[11px] text-[#a65f5b] mt-1">
									{errors.dueDate}
								</p>
							)}
						</div>
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
							className="h-9.5 text-xs border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#4f6958]"
						/>
					</div>

					{/* Checkbox Send WhatsApp */}
					<div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f3f7f3] border border-[#e4e9e4]">
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

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
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
