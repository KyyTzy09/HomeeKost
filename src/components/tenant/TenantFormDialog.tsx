import { useForm } from "@tanstack/react-form";
import { Check, ChevronsUpDown, Search, UserCheck } from "lucide-react";
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
import type {
	OccupationStatus,
	RentDuration,
	TenantItem,
} from "../../common/types/index.ts";
import {
	type TenantFormValues,
	tenantSchema,
} from "../../common/validations/index.ts";
import { formatRupiah, parseRupiah } from "../../lib/currency.ts";
import {
	calculateDueDate,
	getDurationMonths,
	getTodayDateString,
} from "../../lib/date-utils.ts";
import { sanitizePhone } from "../../lib/phone-utils.ts";

export interface RoomOption {
	roomNo: string;
	type: "Standard" | "Deluxe" | "Suite";
	monthlyPrice: number;
}

interface TenantFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	propertyName: string;
	roomOptions?: RoomOption[];
	editingTenant: TenantItem | null;
	onSubmit: (values: TenantFormValues) => void;
}

export const DEFAULT_ROOM_OPTIONS: RoomOption[] = [
	{ roomNo: "A-01", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "A-02", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "A-03", type: "Deluxe", monthlyPrice: 1200000 },
	{ roomNo: "A-04", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "A-05", type: "Deluxe", monthlyPrice: 1100000 },
	{ roomNo: "A-06", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "A-07", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "A-08", type: "Suite", monthlyPrice: 1500000 },
	{ roomNo: "B-01", type: "Standard", monthlyPrice: 900000 },
	{ roomNo: "B-02", type: "Deluxe", monthlyPrice: 950000 },
	{ roomNo: "B-03", type: "Standard", monthlyPrice: 900000 },
	{ roomNo: "B-04", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "C-01", type: "Deluxe", monthlyPrice: 1200000 },
	{ roomNo: "C-02", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "C-03", type: "Standard", monthlyPrice: 850000 },
	{ roomNo: "C-04", type: "Suite", monthlyPrice: 1600000 },
];

export function TenantFormDialog({
	open,
	onOpenChange,
	propertyName,
	roomOptions = DEFAULT_ROOM_OPTIONS,
	editingTenant,
	onSubmit,
}: TenantFormDialogProps) {
	const todayStr = useMemo(() => getTodayDateString(), []);

	// Searchable combobox states
	const [roomQuery, setRoomQuery] = useState("");
	const [isComboboxOpen, setIsComboboxOpen] = useState(false);
	const comboboxRef = useRef<HTMLDivElement>(null);

	const initialStartDate = editingTenant?.startDate || todayStr;
	const initialDuration = (editingTenant?.duration ??
		"Bulanan") as RentDuration;
	const initialDueDate = editingTenant?.dueDate?.includes("-")
		? editingTenant.dueDate
		: calculateDueDate(initialStartDate, initialDuration);

	const form = useForm({
		defaultValues: {
			name: editingTenant?.name ?? "",
			birthDate: editingTenant?.birthDate ?? "",
			nik: editingTenant?.nik ?? "",
			phone: editingTenant?.phone ?? "",
			originAddress: editingTenant?.originAddress ?? "",
			email: editingTenant?.email ?? "",
			occupationStatus: (editingTenant?.occupationStatus ??
				"Mahasiswa") as OccupationStatus,
			institution: editingTenant?.institution ?? "",
			roomNo: editingTenant?.roomNo ?? "A-01",
			rent: editingTenant?.rent ?? "Rp850.000",
			duration: initialDuration,
			startDate: initialStartDate,
			dueDate: initialDueDate,
			vehicle: editingTenant?.vehicle ?? "",
			deposit: editingTenant?.deposit ?? "Rp0",
			emergencyName: editingTenant?.emergencyName ?? "",
			emergencyRelation: editingTenant?.emergencyRelation ?? "",
			emergencyPhone: editingTenant?.emergencyPhone ?? "",
			registrationDate: editingTenant?.registrationDate ?? todayStr,
			notes: editingTenant?.notes ?? "",
			agreement: true,
		},
		onSubmit: async ({ value }) => {
			const sanitizedValue: TenantFormValues = {
				...value,
				phone: sanitizePhone(value.phone),
			};
			const result = tenantSchema.safeParse(sanitizedValue);
			if (!result.success) return;
			onSubmit(result.data);
			onOpenChange(false);
		},
	});

	// Close combobox when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				comboboxRef.current &&
				!comboboxRef.current.contains(event.target as Node)
			) {
				setIsComboboxOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Filtered rooms for combobox search
	const filteredRooms = useMemo(() => {
		if (!roomQuery.trim()) return roomOptions;
		const query = roomQuery.toLowerCase();
		return roomOptions.filter(
			(r) =>
				r.roomNo.toLowerCase().includes(query) ||
				r.type.toLowerCase().includes(query) ||
				formatRupiah(r.monthlyPrice).toLowerCase().includes(query),
		);
	}, [roomOptions, roomQuery]);

	// Auto-calculation handler for Room selection
	const handleSelectRoom = (room: RoomOption) => {
		form.setFieldValue("roomNo", room.roomNo);
		const currentDuration = form.getFieldValue("duration");
		const months = getDurationMonths(currentDuration);
		const totalRent = room.monthlyPrice * months;
		form.setFieldValue("rent", formatRupiah(totalRent));
		setIsComboboxOpen(false);
		setRoomQuery("");
	};

	// Auto-calculation handler for Duration change
	const handleChangeDuration = (newDuration: RentDuration) => {
		form.setFieldValue("duration", newDuration);

		// Recalculate Total Rent
		const currentRoomNo = form.getFieldValue("roomNo");
		const matchedRoom = roomOptions.find((r) => r.roomNo === currentRoomNo);
		const basePrice = matchedRoom
			? matchedRoom.monthlyPrice
			: parseRupiah(form.getFieldValue("rent")) /
				getDurationMonths(form.getFieldValue("duration"));

		const months = getDurationMonths(newDuration);
		const newTotalRent = (basePrice || 850000) * months;
		form.setFieldValue("rent", formatRupiah(newTotalRent));

		// Recalculate Due Date
		const currentStartDate = form.getFieldValue("startDate");
		if (currentStartDate) {
			const calculated = calculateDueDate(currentStartDate, newDuration);
			form.setFieldValue("dueDate", calculated);
		}
	};

	// Auto-calculation handler for Start Date change
	const handleChangeStartDate = (newStartDate: string) => {
		form.setFieldValue("startDate", newStartDate);
		const currentDuration = form.getFieldValue("duration");
		if (newStartDate) {
			const calculated = calculateDueDate(newStartDate, currentDuration);
			form.setFieldValue("dueDate", calculated);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[760px] max-h-[90vh] overflow-y-auto rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader>
					<div className="flex items-center gap-2.5 mb-1">
						<div className="w-8 h-8 rounded-[9px] bg-[#edf4ee] text-[#4f6958] flex items-center justify-center">
							<UserCheck className="w-4 h-4" />
						</div>
						<div>
							<DialogTitle className="text-[18px] font-bold text-[#29382e]">
								{editingTenant
									? "Edit Data Penghuni"
									: "Formulir Pendaftaran Kost"}
							</DialogTitle>
							<DialogDescription className="text-[11px] text-[#8a958d]">
								{editingTenant
									? `Perbarui data identitas dan sewa untuk ${editingTenant.name}`
									: "Data pendaftaran penghuni baru untuk properti yang sedang dipilih."}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="text-[11px] text-[#55705d] bg-[#f3f7f3] border border-[#dce6df] rounded-[10px] p-2.5 mb-2 font-medium">
					Properti aktif:{" "}
					<strong className="text-[#26372c]">{propertyName}</strong>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-5"
				>
					{/* Section A: Informasi Pribadi */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							A. Informasi Pribadi
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Data identitas dan kontak calon penghuni.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{/* Nama Lengkap */}
							<form.Field
								name="name"
								validators={{
									onChange: ({ value }) =>
										!value ? "Nama lengkap wajib diisi" : undefined,
								}}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nama Lengkap <span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Nama lengkap penghuni"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{field.state.meta.errors[0]}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* Tanggal Lahir (Max Date: Today) */}
							<form.Field
								name="birthDate"
								validators={{
									onChange: ({ value }) => {
										if (value && new Date(value) > new Date()) {
											return "Tanggal lahir tidak boleh melebihi hari ini";
										}
										return undefined;
									},
								}}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Tanggal Lahir
											</Label>
											<Input
												type="date"
												max={todayStr}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{field.state.meta.errors[0]}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* NIK (16 digit) */}
							<form.Field
								name="nik"
								validators={{
									onChange: ({ value }) => {
										if (!value) return "NIK wajib diisi";
										if (!/^\d{16}$/.test(value)) {
											return "NIK harus terdiri dari 16 digit angka nasional Indonesia";
										}
										return undefined;
									},
								}}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nomor Induk Kependudukan (NIK){" "}
												<span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												value={field.state.value}
												maxLength={16}
												onChange={(e) => {
													const digitsOnly = e.target.value.replace(
														/[^0-9]/g,
														"",
													);
													field.handleChange(digitsOnly);
												}}
												placeholder="Contoh: 3201011234567890 (16 digit)"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] font-mono bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											<span className="text-[9.5px] text-[#737873] block">
												{field.state.value.length}/16 digit
											</span>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{field.state.meta.errors[0]}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* Nomor Telepon / WhatsApp */}
							<form.Field
								name="phone"
								validators={{
									onChange: ({ value }) =>
										!value
											? "Nomor WhatsApp wajib diisi"
											: value.length < 10
												? "Nomor minimal 10 digit"
												: undefined,
								}}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nomor Telepon / WhatsApp{" "}
												<span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="08xxxxxxxxxx"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] font-mono bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{field.state.meta.errors[0]}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* Alamat Asal */}
							<div className="col-span-1 sm:col-span-2">
								<form.Field name="originAddress">
									{(field) => (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Alamat Asal
											</Label>
											<textarea
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												rows={2}
												placeholder="Alamat asal sesuai KTP / domisili"
												className="w-full border border-[#dfe7e0] rounded-[11px] p-2.5 text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] outline-none"
											/>
										</div>
									)}
								</form.Field>
							</div>

							{/* Email */}
							<form.Field name="email">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Email
										</Label>
										<Input
											type="email"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="nama@email.com"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>
						</div>
					</div>

					{/* Section B: Informasi Pekerjaan / Pendidikan */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							B. Informasi Pekerjaan / Pendidikan
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Status dan institusi calon penghuni.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="col-span-1 sm:col-span-2">
								<form.Field name="occupationStatus">
									{(field) => (
										<div className="space-y-1.5">
											<Label className="text-[11px] font-bold text-[#506257]">
												Status Pekerjaan / Pendidikan{" "}
												<span className="text-[#b66b68]">*</span>
											</Label>
											<div className="flex flex-wrap gap-4 py-1">
												{(["Mahasiswa", "Karyawan", "Lainnya"] as const).map(
													(opt) => (
														<label
															key={opt}
															className="flex items-center gap-2 text-[12px] text-[#34443a] cursor-pointer"
														>
															<input
																type="radio"
																name="occupationStatus"
																value={opt}
																checked={field.state.value === opt}
																onChange={() => field.handleChange(opt)}
																className="accent-[#4f6958]"
															/>
															<span>{opt}</span>
														</label>
													),
												)}
											</div>
										</div>
									)}
								</form.Field>
							</div>

							<div className="col-span-1 sm:col-span-2">
								<form.Field name="institution">
									{(field) => (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nama Institusi / Perusahaan
											</Label>
											<Input
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Nama kampus atau perusahaan tempat bekerja"
												className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
											/>
										</div>
									)}
								</form.Field>
							</div>
						</div>
					</div>

					{/* Section C: Rincian Pendaftaran Kost */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							C. Rincian Pendaftaran Kost
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Detail kamar, durasi, dan kendaraan penghuni.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{/* Searchable Combobox for Room Selection */}
							<form.Field name="roomNo">
								{(field) => (
									<div className="space-y-1 relative" ref={comboboxRef}>
										<Label className="text-[11px] font-bold text-[#506257]">
											Nomor Kamar <span className="text-[#b66b68]">*</span>
										</Label>

										{/* Trigger Button */}
										<button
											type="button"
											onClick={() => setIsComboboxOpen((prev) => !prev)}
											className="w-full h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] flex items-center justify-between hover:border-[#8fa594] transition-colors cursor-pointer text-left"
										>
											<span>
												{field.state.value ? (
													<span className="font-semibold text-[#252925]">
														Kamar {field.state.value}
													</span>
												) : (
													<span className="text-[#8a958d]">Pilih Kamar</span>
												)}
											</span>
											<ChevronsUpDown className="w-4 h-4 text-[#8a958d] shrink-0" />
										</button>

										{/* Combobox Dropdown */}
										{isComboboxOpen && (
											<div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white border border-[#dfe7e0] rounded-[12px] shadow-[0_10px_30px_rgba(30,45,35,0.12)] p-2 space-y-1.5 max-h-[260px] overflow-hidden flex flex-col">
												{/* Search Input */}
												<div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f5f8f5] border border-[#dce6df] rounded-[8px]">
													<Search className="w-3.5 h-3.5 text-[#737873] shrink-0" />
													<input
														type="text"
														autoFocus
														value={roomQuery}
														onChange={(e) => setRoomQuery(e.target.value)}
														placeholder="Cari no kamar / tipe..."
														className="w-full text-[11.5px] bg-transparent outline-none text-[#252925] placeholder:text-[#9aa09b]"
													/>
												</div>

												{/* Room List */}
												<div className="overflow-y-auto space-y-1 pr-1 flex-1">
													{filteredRooms.length > 0 ? (
														filteredRooms.map((room) => {
															const isSelected =
																field.state.value === room.roomNo;
															return (
																<button
																	key={room.roomNo}
																	type="button"
																	onClick={() => handleSelectRoom(room)}
																	className={`w-full flex items-center justify-between p-2 rounded-[8px] text-[11.5px] transition-colors cursor-pointer text-left ${
																		isSelected
																			? "bg-[#edf4ee] text-[#3e5646] font-bold"
																			: "hover:bg-[#f6faf6] text-[#37443c]"
																	}`}
																>
																	<div className="flex items-center gap-2">
																		<span className="w-2 h-2 rounded-full bg-[#4f6958]" />
																		<span>
																			<strong>Kamar {room.roomNo}</strong> (
																			{room.type})
																		</span>
																	</div>
																	<div className="flex items-center gap-2">
																		<span className="text-[11px] text-[#55705d] font-mono">
																			{formatRupiah(room.monthlyPrice)}/bln
																		</span>
																		{isSelected && (
																			<Check className="w-3.5 h-3.5 text-[#4f6958]" />
																		)}
																	</div>
																</button>
															);
														})
													) : (
														<div className="py-4 text-center text-[11px] text-[#8a958d]">
															Kamar tidak ditemukan
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								)}
							</form.Field>

							{/* Lama Sewa Radio */}
							<form.Field name="duration">
								{(field) => (
									<div className="space-y-1.5">
										<Label className="text-[11px] font-bold text-[#506257]">
											Lama Sewa <span className="text-[#b66b68]">*</span>
										</Label>
										<div className="flex flex-wrap gap-3 py-1">
											{(
												[
													"Bulanan",
													"Triwulan",
													"Semesteran",
													"Tahunan",
												] as const
											).map((dur) => (
												<label
													key={dur}
													className="flex items-center gap-1.5 text-[11.5px] text-[#34443a] cursor-pointer"
												>
													<input
														type="radio"
														name="duration"
														value={dur}
														checked={field.state.value === dur}
														onChange={() => handleChangeDuration(dur)}
														className="accent-[#4f6958]"
													/>
													<span>
														{dur}{" "}
														<span className="text-[9.5px] text-[#8a958d]">
															({getDurationMonths(dur)} bln)
														</span>
													</span>
												</label>
											))}
										</div>
									</div>
								)}
							</form.Field>

							{/* Harga Total Sewa (Auto-calculated, Editable) */}
							<form.Field name="rent">
								{(field) => (
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<Label className="text-[11px] font-bold text-[#506257]">
												Harga Total Sewa{" "}
												<span className="text-[#b66b68]">*</span>
											</Label>
											<span className="text-[9.5px] text-[#55705d] font-semibold">
												Otomatis terhitung
											</span>
										</div>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Rp850.000"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] font-semibold text-[#252925] bg-[#fbfcfb]"
										/>
									</div>
								)}
							</form.Field>

							{/* Tanggal Mulai Sewa (Input Date) */}
							<form.Field name="startDate">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Tanggal Mulai Sewa{" "}
											<span className="text-[#b66b68]">*</span>
										</Label>
										<Input
											type="date"
											value={field.state.value}
											onChange={(e) => handleChangeStartDate(e.target.value)}
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>

							{/* Tanggal Jatuh Tempo (Input Date, Auto-calculated) */}
							<form.Field name="dueDate">
								{(field) => (
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<Label className="text-[11px] font-bold text-[#506257]">
												Tanggal Jatuh Tempo{" "}
												<span className="text-[#b66b68]">*</span>
											</Label>
											<span className="text-[9.5px] text-[#55705d] font-semibold">
												Otomatis +periode sewa
											</span>
										</div>
										<Input
											type="date"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>

							{/* No Kendaraan */}
							<form.Field name="vehicle">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											No. Kendaraan (jika ada)
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="B 1234 ABC"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>

							{/* Deposit */}
							<form.Field name="deposit">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Deposit
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Rp0"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>
						</div>
					</div>

					{/* Section D: Kontak Darurat */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							D. Kontak Darurat
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Kontak yang dapat dihubungi jika terjadi keadaan darurat.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<form.Field name="emergencyName">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Nama Kontak
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Nama kontak darurat"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="emergencyRelation">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Hubungan
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Orang tua / saudara / lainnya"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="emergencyPhone">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Nomor Telepon / HP
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="08xxxxxxxxxx"
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>
						</div>
					</div>

					{/* Section E: Persetujuan dan Tanda Tangan */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							E. Persetujuan dan Tanda Tangan
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Persetujuan pendaftaran penghuni.
						</p>

						<div className="grid grid-cols-1 gap-3">
							<form.Field name="registrationDate">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Tanggal Pendaftaran{" "}
											<span className="text-[#b66b68]">*</span>
										</Label>
										<Input
											type="date"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]"
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="notes">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Catatan
										</Label>
										<textarea
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											rows={2}
											placeholder="Catatan tambahan tentang penghuni"
											className="w-full border border-[#dfe7e0] rounded-[11px] p-2.5 text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] outline-none"
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="agreement">
								{(field) => (
									<div className="bg-[#f7faf7] border border-[#e4ebe5] rounded-[12px] p-3 mt-1">
										<label className="flex gap-2.5 items-start text-[11px] leading-relaxed text-[#5f6d64] cursor-pointer">
											<input
												type="checkbox"
												checked={field.state.value}
												onChange={(e) => field.handleChange(e.target.checked)}
												className="mt-0.5 accent-[#4f6958]"
											/>
											<span>
												Dengan menyetujui formulir ini, penghuni menyatakan
												bahwa seluruh informasi yang diberikan adalah benar dan
												menyetujui syarat dan ketentuan yang berlaku di
												HomeeKost.
											</span>
										</label>
									</div>
								)}
							</form.Field>
						</div>
					</div>

					<DialogFooter className="pt-3 border-t border-[#edf1ed] flex gap-2 justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="h-[38px] px-4 rounded-[9px] border-[#dfe7e0] text-[#506257] hover:bg-[#f3f7f3] text-[12px]"
						>
							Batal
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									disabled={!canSubmit || isSubmitting}
									className="h-[38px] px-5 rounded-[9px] bg-[#4f6958] hover:bg-[#425949] text-white font-semibold text-[12px]"
								>
									{editingTenant ? "Simpan Perubahan" : "Simpan Pendaftaran"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
