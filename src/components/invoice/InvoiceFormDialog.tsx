import { useForm } from "@tanstack/react-form";
import { Check, ChevronsUpDown, FilePlus2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
	type InvoiceFormValues,
	invoiceSchema,
} from "../../common/validations/index.ts";
import { formatRupiah } from "../../lib/currency.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";

export interface TenantOption {
	id: string;
	name: string;
	roomNo: string;
	phone?: string;
}

export interface RoomOption {
	roomNo: string;
	type: string;
	price: number;
}

export const DEFAULT_TENANT_OPTIONS: TenantOption[] = [
	{ id: "t-1", name: "Alya Putri", roomNo: "A-03", phone: "0812 3456 7890" },
	{
		id: "t-2",
		name: "Sarah Anindita",
		roomNo: "C-01",
		phone: "0813 2255 4412",
	},
	{ id: "t-3", name: "Fira Aulia", roomNo: "A-07", phone: "0857 9988 1122" },
	{ id: "t-4", name: "Nabila Putri", roomNo: "B-02", phone: "0821 7788 9900" },
	{
		id: "t-5",
		name: "Dinda Maharani",
		roomNo: "B-01",
		phone: "0819 6622 1100",
	},
	{ id: "t-6", name: "Rina Kusuma", roomNo: "C-03", phone: "0812 9900 1122" },
];

export const DEFAULT_ROOM_OPTIONS: RoomOption[] = [
	{ roomNo: "A-01", type: "Standard", price: 850000 },
	{ roomNo: "A-02", type: "Standard", price: 850000 },
	{ roomNo: "A-03", type: "Standard", price: 850000 },
	{ roomNo: "A-07", type: "Standard", price: 850000 },
	{ roomNo: "B-01", type: "Standard", price: 900000 },
	{ roomNo: "B-02", type: "Deluxe", price: 950000 },
	{ roomNo: "C-01", type: "Deluxe", price: 1200000 },
	{ roomNo: "C-02", type: "Standard", price: 850000 },
	{ roomNo: "C-03", type: "Standard", price: 800000 },
];

interface InvoiceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	nextInvoiceNumber: string;
	tenantOptions?: TenantOption[];
	roomOptions?: RoomOption[];
	onSubmit: (values: InvoiceFormValues) => void;
}

export function InvoiceFormDialog({
	open,
	onOpenChange,
	nextInvoiceNumber,
	tenantOptions = DEFAULT_TENANT_OPTIONS,
	roomOptions = DEFAULT_ROOM_OPTIONS,
	onSubmit,
}: InvoiceFormDialogProps) {
	const todayStr = useMemo(() => getTodayDateString(), []);
	const currentPeriod = useMemo(() => {
		const date = new Date();
		const monthNames = [
			"Januari",
			"Februari",
			"Maret",
			"April",
			"Mei",
			"Juni",
			"Juli",
			"Agustus",
			"September",
			"Oktober",
			"November",
			"Desember",
		];
		return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
	}, []);

	// Searchable Combobox state for Tenants
	const [tenantQuery, setTenantQuery] = useState("");
	const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
	const tenantComboboxRef = useRef<HTMLDivElement>(null);

	// Searchable Combobox state for Rooms
	const [roomQuery, setRoomQuery] = useState("");
	const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
	const roomComboboxRef = useRef<HTMLDivElement>(null);

	const form = useForm({
		defaultValues: {
			number: nextInvoiceNumber,
			created: todayStr,
			tenantName: "",
			roomNo: "",
			period: currentPeriod,
			description: "",
			amount: 0,
			status: "PENDING" as const,
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = invoiceSchema.safeParse(value);
				if (!res.success) {
					const fieldErrors: Record<string, string> = {};
					for (const issue of res.error.issues) {
						const field = issue.path[0];
						if (field && !fieldErrors[String(field)]) {
							fieldErrors[String(field)] = issue.message;
						}
					}
					return fieldErrors;
				}
				return undefined;
			},
		},
		onSubmit: ({ value }) => {
			onSubmit(value as InvoiceFormValues);
			onOpenChange(false);
		},
	});

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			form.reset();
			form.setFieldValue("number", nextInvoiceNumber);
			form.setFieldValue("created", todayStr);
			form.setFieldValue("period", currentPeriod);
			setTenantQuery("");
			setRoomQuery("");
			setIsTenantDropdownOpen(false);
			setIsRoomDropdownOpen(false);
		}
	}, [open, nextInvoiceNumber, todayStr, currentPeriod, form]);

	// Close combobox dropdowns on outside click
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				tenantComboboxRef.current &&
				!tenantComboboxRef.current.contains(event.target as Node)
			) {
				setIsTenantDropdownOpen(false);
			}
			if (
				roomComboboxRef.current &&
				!roomComboboxRef.current.contains(event.target as Node)
			) {
				setIsRoomDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Filtered lists for combobox
	const filteredTenants = useMemo(() => {
		const q = tenantQuery.trim().toLowerCase();
		if (!q) return tenantOptions;
		return tenantOptions.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.roomNo.toLowerCase().includes(q) ||
				t.phone?.includes(q),
		);
	}, [tenantQuery, tenantOptions]);

	const filteredRooms = useMemo(() => {
		const q = roomQuery.trim().toLowerCase();
		if (!q) return roomOptions;
		return roomOptions.filter(
			(r) =>
				r.roomNo.toLowerCase().includes(q) || r.type.toLowerCase().includes(q),
		);
	}, [roomQuery, roomOptions]);

	// Handler: Select Tenant -> Auto-fill Room, Description, and Amount
	const handleSelectTenant = (tenant: TenantOption) => {
		form.setFieldValue("tenantName", tenant.name);
		form.setFieldValue("roomNo", tenant.roomNo);
		form.setFieldValue(
			"description",
			`Sewa kamar ${tenant.roomNo} - ${form.getFieldValue("period") || currentPeriod}`,
		);

		// Find price of tenant's room
		const matchedRoom = roomOptions.find((r) => r.roomNo === tenant.roomNo);
		if (matchedRoom) {
			form.setFieldValue("amount", matchedRoom.price);
		}
		setIsTenantDropdownOpen(false);
		setTenantQuery("");
	};

	// Handler: Select Room -> Auto-fill Description and Amount
	const handleSelectRoom = (room: RoomOption) => {
		form.setFieldValue("roomNo", room.roomNo);
		form.setFieldValue(
			"description",
			`Sewa kamar ${room.roomNo} - ${form.getFieldValue("period") || currentPeriod}`,
		);
		form.setFieldValue("amount", room.price);
		setIsRoomDropdownOpen(false);
		setRoomQuery("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[660px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="invoice-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4] flex flex-row items-start justify-between">
					<div>
						<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
							<FilePlus2 className="w-5 h-5 text-[#4f6958]" />
							Buat Invoice
						</DialogTitle>
						<DialogDescription
							id="invoice-dialog-description"
							className="text-xs text-[#737873] mt-1"
						>
							Buat invoice sewa digital berdasarkan data penghuni.
						</DialogDescription>
					</div>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-2"
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						{/* Nomor Invoice (Readonly) */}
						<form.Field name="number">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Nomor Invoice
									</Label>
									<Input
										value={field.state.value}
										readOnly
										className="bg-[#f3f7f3] border-[#e4e9e4] text-[#4f6958] font-bold text-xs h-10 cursor-not-allowed"
									/>
								</div>
							)}
						</form.Field>

						{/* Tanggal Dibuat */}
						<form.Field name="created">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Tanggal dibuat
									</Label>
									<Input
										type="date"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
									/>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Searchable Combobox Penghuni */}
						<form.Field name="tenantName">
							{(field) => (
								<div className="space-y-1.5 relative" ref={tenantComboboxRef}>
									<Label className="text-xs font-semibold text-[#252925]">
										Penghuni
									</Label>
									<button
										type="button"
										onClick={() =>
											setIsTenantDropdownOpen(!isTenantDropdownOpen)
										}
										className="w-full h-10 px-3 border border-[#e4e9e4] rounded-lg bg-[#fbfcfb] text-left text-xs flex items-center justify-between hover:border-[#8fa594] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8fa594]/20"
									>
										<span
											className={
												field.state.value
													? "text-[#252925] font-medium"
													: "text-[#737873]"
											}
										>
											{field.state.value || "Pilih / Cari Penghuni..."}
										</span>
										<ChevronsUpDown className="w-4 h-4 text-[#737873]" />
									</button>

									{isTenantDropdownOpen && (
										<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e9e4] rounded-lg shadow-lg z-50 p-2 space-y-1 max-h-56 overflow-y-auto">
											<div className="relative mb-1">
												<Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#737873]" />
												<input
													type="text"
													placeholder="Ketik nama atau kamar..."
													value={tenantQuery}
													onChange={(e) => setTenantQuery(e.target.value)}
													className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e4e9e4] rounded-md outline-none focus:border-[#8fa594]"
													autoFocus
												/>
											</div>
											{filteredTenants.length === 0 ? (
												<div className="py-3 text-center text-xs text-[#737873]">
													Penghuni tidak ditemukan
												</div>
											) : (
												filteredTenants.map((t) => (
													<button
														key={t.id}
														type="button"
														onClick={() => handleSelectTenant(t)}
														className={`w-full text-left px-2.5 py-2 text-xs rounded-md flex items-center justify-between hover:bg-[#e8f0ea] transition-colors ${
															field.state.value === t.name
																? "bg-[#f3f7f3] font-semibold text-[#4f6958]"
																: "text-[#252925]"
														}`}
													>
														<div>
															<div className="font-medium">{t.name}</div>
															<div className="text-[10px] text-[#737873]">
																Kamar {t.roomNo}
																{t.phone ? ` · ${t.phone}` : ""}
															</div>
														</div>
														{field.state.value === t.name && (
															<Check className="w-3.5 h-3.5 text-[#4f6958]" />
														)}
													</button>
												))
											)}
										</div>
									)}
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Searchable Combobox Kamar */}
						<form.Field name="roomNo">
							{(field) => (
								<div className="space-y-1.5 relative" ref={roomComboboxRef}>
									<Label className="text-xs font-semibold text-[#252925]">
										Kamar
									</Label>
									<button
										type="button"
										onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
										className="w-full h-10 px-3 border border-[#e4e9e4] rounded-lg bg-[#fbfcfb] text-left text-xs flex items-center justify-between hover:border-[#8fa594] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8fa594]/20"
									>
										<span
											className={
												field.state.value
													? "text-[#252925] font-medium"
													: "text-[#737873]"
											}
										>
											{field.state.value || "Pilih / Cari Kamar..."}
										</span>
										<ChevronsUpDown className="w-4 h-4 text-[#737873]" />
									</button>

									{isRoomDropdownOpen && (
										<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e9e4] rounded-lg shadow-lg z-50 p-2 space-y-1 max-h-56 overflow-y-auto">
											<div className="relative mb-1">
												<Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#737873]" />
												<input
													type="text"
													placeholder="Cari nomor kamar..."
													value={roomQuery}
													onChange={(e) => setRoomQuery(e.target.value)}
													className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e4e9e4] rounded-md outline-none focus:border-[#8fa594]"
													autoFocus
												/>
											</div>
											{filteredRooms.length === 0 ? (
												<div className="py-3 text-center text-xs text-[#737873]">
													Kamar tidak ditemukan
												</div>
											) : (
												filteredRooms.map((r) => (
													<button
														key={r.roomNo}
														type="button"
														onClick={() => handleSelectRoom(r)}
														className={`w-full text-left px-2.5 py-2 text-xs rounded-md flex items-center justify-between hover:bg-[#e8f0ea] transition-colors ${
															field.state.value === r.roomNo
																? "bg-[#f3f7f3] font-semibold text-[#4f6958]"
																: "text-[#252925]"
														}`}
													>
														<div>
															<span className="font-medium">{r.roomNo}</span>
															<span className="text-[10px] text-[#737873] ml-1.5">
																({r.type})
															</span>
														</div>
														<span className="text-[11px] font-semibold text-[#4f6958]">
															{formatRupiah(r.price)}
														</span>
													</button>
												))
											)}
										</div>
									)}
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Periode Tagihan */}
						<form.Field name="period">
							{(field) => (
								<div className="space-y-1.5 sm:col-span-2">
									<Label className="text-xs font-semibold text-[#252925]">
										Periode
									</Label>
									<Input
										placeholder="Contoh: Agustus 2026"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
									/>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Detail Tagihan Box */}
						<div className="sm:col-span-2 border border-[#e4e9e4] rounded-xl p-3.5 bg-[#fbfcfb] space-y-3">
							<Label className="text-xs font-semibold text-[#252925] block">
								Detail Tagihan
							</Label>
							<div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
								<form.Field name="description">
									{(field) => (
										<div className="space-y-1">
											<span className="text-[11px] text-[#737873]">
												Deskripsi
											</span>
											<Input
												placeholder="Contoh: Sewa kamar A-03"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className="border-[#e4e9e4] text-xs h-9 bg-white focus-visible:ring-[#8fa594]"
											/>
											{field.state.meta.errors?.[0] && (
												<p className="text-[11px] text-[#a65f5b]">
													{field.state.meta.errors[0]}
												</p>
											)}
										</div>
									)}
								</form.Field>

								<form.Field name="amount">
									{(field) => (
										<div className="space-y-1">
											<span className="text-[11px] text-[#737873]">
												Nominal (Rp)
											</span>
											<Input
												type="number"
												min={0}
												placeholder="850000"
												value={field.state.value || ""}
												onChange={(e) =>
													field.handleChange(Number(e.target.value) || 0)
												}
												className="border-[#e4e9e4] text-xs h-9 bg-white text-right font-semibold focus-visible:ring-[#8fa594]"
											/>
											{field.state.meta.errors?.[0] && (
												<p className="text-[11px] text-[#a65f5b]">
													{field.state.meta.errors[0]}
												</p>
											)}
										</div>
									)}
								</form.Field>
							</div>
						</div>
					</div>

					<div className="text-[11px] text-[#737873] bg-[#f7faf7] border border-[#e5ece5] rounded-lg p-2.5">
						Total tagihan akan dihitung otomatis dari nominal yang dimasukkan.
					</div>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
						>
							Buat Invoice
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
