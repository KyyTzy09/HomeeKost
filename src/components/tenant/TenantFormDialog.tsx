import { useForm } from "@tanstack/react-form";
import {
	AlertCircle,
	ArrowRightLeft,
	CalendarDays,
	Check,
	CheckCircle2,
	ChevronsUpDown,
	History,
	Info,
	Loader2,
	Search,
	UploadCloud,
	UserCheck,
	X,
} from "lucide-react";
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
	type UpdateTenantFormValues,
	updateTenantSchema,
} from "../../common/validations/index.ts";
import { useScanKtp } from "../../hooks/use-tenants.ts";
import { formatRupiah, parseRupiah } from "../../lib/currency.ts";
import {
	calculateDueDate,
	formatDate,
	getDurationMonths,
	getTodayDateString,
} from "../../lib/date-utils.ts";
import { sanitizePhone } from "../../lib/phone-utils.ts";

export interface RoomOption {
	roomNo: string;
	type: "Standard" | "Deluxe" | "Suite";
	price: number;
}

interface TenantFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	propertyName: string;
	roomOptions?: RoomOption[];
	editingTenant: TenantItem | null;
	onSubmit: (values: TenantFormValues | UpdateTenantFormValues) => void;
	isSubmitting?: boolean;
}

/**
 * Helper to safely convert any date format (e.g. ISO, "10 Jan 2026", "10 Agu") into standard HTML "YYYY-MM-DD"
 */
function toInputDateFormat(dateStr?: string | null): string {
	if (!dateStr || dateStr === "—" || dateStr.trim() === "") return "";
	const trimmed = dateStr.trim();

	// Already YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

	// ISO format: YYYY-MM-DDTHH:mm:ss
	if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
		return trimmed.slice(0, 10);
	}

	const monthsMap: Record<string, string> = {
		jan: "01",
		feb: "02",
		mar: "03",
		apr: "04",
		mei: "05",
		may: "05",
		jun: "06",
		jul: "07",
		agu: "08",
		aug: "08",
		sep: "09",
		okt: "10",
		oct: "10",
		nov: "11",
		des: "12",
		dec: "12",
	};

	// Format: "10 Jan 2026" or "10-Jan-2026"
	const parts3 = trimmed.split(/[\s-]+/);
	if (parts3.length === 3) {
		const day = parts3[0].padStart(2, "0");
		const mKey = parts3[1].toLowerCase().slice(0, 3);
		const month = monthsMap[mKey] || "01";
		let year = parts3[2];
		if (year.length === 2) year = `20${year}`;
		if (/^\d{4}$/.test(year) && /^\d{2}$/.test(day)) {
			return `${year}-${month}-${day}`;
		}
	}

	// Format: "10 Agu" (day and month without year)
	if (parts3.length === 2) {
		const day = parts3[0].padStart(2, "0");
		const mKey = parts3[1].toLowerCase().slice(0, 3);
		const month = monthsMap[mKey];
		if (month && /^\d{2}$/.test(day)) {
			const year = new Date().getFullYear();
			return `${year}-${month}-${day}`;
		}
	}

	// Native Date fallback
	const d = new Date(trimmed);
	if (!Number.isNaN(d.getTime())) {
		const year = d.getFullYear();
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const day = d.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	return "";
}

/**
 * Kompresi gambar client-side (maks lebar 1280px, kualitas 0.75 JPEG)
 * Menghindari pengiriman base64 raksasa (5-15MB) yang membebani memori dan jaringan.
 */
function compressImage(
	file: File,
	maxWidth = 1280,
	quality = 0.75,
): Promise<string> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			if (!dataUrl) {
				resolve("");
				return;
			}
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				let { width, height } = img;
				if (width > maxWidth) {
					height = Math.round((height * maxWidth) / width);
					width = maxWidth;
				}
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve(dataUrl);
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
				resolve(compressedDataUrl);
			};
			img.onerror = () => resolve(dataUrl);
			img.src = dataUrl;
		};
		reader.onerror = () => resolve("");
		reader.readAsDataURL(file);
	});
}

const FIELD_LABELS: Record<string, string> = {
	name: "Nama Lengkap",
	birthDate: "Tanggal Lahir",
	nik: "Nomor Induk Kependudukan (NIK)",
	phone: "Nomor WhatsApp",
	originAddress: "Alamat Asal",
	email: "Email",
	occupationStatus: "Status Pekerjaan",
	institution: "Nama Institusi",
	roomNo: "Nomor Kamar",
	rent: "Harga Total Sewa",
	duration: "Lama Sewa",
	startDate: "Tanggal Mulai Sewa",
	dueDate: "Tanggal Jatuh Tempo",
	vehicle: "Nomor Kendaraan",
	deposit: "Deposit",
	emergencyName: "Nama Kontak Darurat",
	emergencyRelation: "Hubungan Kontak Darurat",
	emergencyPhone: "Nomor Kontak Darurat",
	registrationDate: "Tanggal Pendaftaran",
	agreement: "Persetujuan Formulir",
	roomChangeMode: "Jenis Penanganan Kontrak",
	updatePendingInvoiceAmount: "Penyesuaian Tagihan Belum Lunas",
	createDifferenceInvoice: "Tagihan Selisih Pindah Kamar",
};

export function TenantFormDialog({
	open,
	onOpenChange,
	propertyName,
	roomOptions = [],
	editingTenant,
	onSubmit,
	isSubmitting = false,
}: TenantFormDialogProps) {
	const isEditing = Boolean(editingTenant);
	const todayStr = useMemo(() => getTodayDateString(), []);

	// Validation error state for prominent UI feedback
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const dialogContentRef = useRef<HTMLDivElement>(null);

	const clearFieldError = (fieldName: string) => {
		setFormErrors((prev) => {
			if (!prev[fieldName]) return prev;
			const next = { ...prev };
			delete next[fieldName];
			return next;
		});
	};

	// Searchable combobox states
	const [roomQuery, setRoomQuery] = useState("");
	const [isComboboxOpen, setIsComboboxOpen] = useState(false);
	const comboboxRef = useRef<HTMLDivElement>(null);

	// KTP Upload & AI OCR states
	const [ktpPreview, setKtpPreview] = useState<string | null>(
		editingTenant?.ktpUrl || null,
	);
	const [ktpFileName, setKtpFileName] = useState<string>("");
	const [scanStatus, setScanStatus] = useState<
		"idle" | "scanning" | "success" | "warning" | "error"
	>("idle");
	const [scanFeedback, setScanFeedback] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const scanKtpMutation = useScanKtp();

	const initialStartDate =
		toInputDateFormat(editingTenant?.startDate) || todayStr;
	const initialDuration = (editingTenant?.duration ??
		"Bulanan") as RentDuration;
	const initialDueDate =
		toInputDateFormat(editingTenant?.dueDate) ||
		calculateDueDate(initialStartDate, initialDuration);

	const defaultInitialRoom = roomOptions[0];

	const sanitizeValues = (val: {
		name: string;
		birthDate?: string;
		nik: string;
		phone: string;
		originAddress?: string;
		email?: string;
		occupationStatus: OccupationStatus;
		institution?: string;
		roomNo?: string;
		rent?: string;
		duration?: RentDuration;
		startDate?: string;
		dueDate?: string;
		vehicle?: string;
		deposit?: string;
		emergencyName?: string;
		emergencyRelation?: string;
		emergencyPhone?: string;
		registrationDate?: string;
		notes?: string;
		ktpUrl?: string;
		markPastPeriodsPaid?: boolean;
		agreement?: boolean;
		roomChangeMode?: "CORRECTION" | "TRANSFER";
		updatePendingInvoiceAmount?: boolean;
		createDifferenceInvoice?: boolean;
		contractUpdateScope?: "ALL_HISTORY" | "CURRENT_ONLY";
	}) => {
		const autoDue =
			val.dueDate ||
			(val.startDate
				? calculateDueDate(
						val.startDate,
						(val.duration || "Bulanan") as RentDuration,
					)
				: "");
		return {
			...val,
			dueDate: autoDue,
			phone: sanitizePhone(val.phone || ""),
			emergencyPhone: val.emergencyPhone
				? val.emergencyPhone.replace(/[^0-9+]/g, "")
				: "",
			nik: (val.nik || "").replace(/[^0-9]/g, ""),
			roomChangeMode: val.roomChangeMode || "CORRECTION",
			updatePendingInvoiceAmount: val.updatePendingInvoiceAmount !== false,
			createDifferenceInvoice: val.createDifferenceInvoice !== false,
			contractUpdateScope: val.contractUpdateScope || "CURRENT_ONLY",
		};
	};

	const form = useForm({
		defaultValues: {
			name: editingTenant?.name ?? "",
			birthDate: toInputDateFormat(editingTenant?.birthDate) ?? "",
			nik: editingTenant?.nik ?? "",
			phone: editingTenant?.phone ?? "",
			originAddress: editingTenant?.originAddress ?? "",
			email: editingTenant?.email ?? "",
			occupationStatus: (editingTenant?.occupationStatus ??
				"Mahasiswa") as OccupationStatus,
			institution: editingTenant?.institution ?? "",
			roomNo: editingTenant?.roomNo ?? (defaultInitialRoom?.roomNo || ""),
			rent:
				editingTenant?.rent ??
				(defaultInitialRoom ? formatRupiah(defaultInitialRoom.price) : ""),
			duration: initialDuration,
			startDate: initialStartDate,
			dueDate: initialDueDate,
			vehicle: editingTenant?.vehicle ?? "",
			deposit: editingTenant?.deposit ?? "",
			emergencyName: editingTenant?.emergencyName ?? "",
			emergencyRelation: editingTenant?.emergencyRelation ?? "",
			emergencyPhone: editingTenant?.emergencyPhone ?? "",
			registrationDate:
				toInputDateFormat(editingTenant?.registrationDate) || todayStr,
			notes: editingTenant?.notes ?? "",
			ktpUrl: editingTenant?.ktpUrl ?? "",
			markPastPeriodsPaid: true,
			agreement: true,
			roomChangeMode: "CORRECTION" as "CORRECTION" | "TRANSFER",
			updatePendingInvoiceAmount: true,
			createDifferenceInvoice: true,
			contractUpdateScope: "CURRENT_ONLY" as "ALL_HISTORY" | "CURRENT_ONLY",
		},
		validators: {
			onSubmit: ({ value }) => {
				const sanitizedValue = sanitizeValues(value);
				const schema = isEditing ? updateTenantSchema : tenantSchema;
				const result = schema.safeParse(sanitizedValue);
				if (!result.success) {
					const fieldErrors: Record<string, string> = {};
					for (const issue of result.error.issues) {
						const field = String(issue.path[0] || "form");
						if (!fieldErrors[field]) {
							fieldErrors[field] = issue.message;
						}
					}
					setFormErrors(fieldErrors);
					setTimeout(() => {
						dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
					}, 50);
					return fieldErrors;
				}
				setFormErrors({});
				return undefined;
			},
		},
		onSubmit: async ({ value }) => {
			const sanitizedValue = sanitizeValues(value);
			const schema = isEditing ? updateTenantSchema : tenantSchema;
			const result = schema.safeParse(sanitizedValue);
			if (!result.success) {
				const fieldErrors: Record<string, string> = {};
				for (const issue of result.error.issues) {
					const field = String(issue.path[0] || "form");
					if (!fieldErrors[field]) {
						fieldErrors[field] = issue.message;
					}
				}
				setFormErrors(fieldErrors);
				setTimeout(() => {
					dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
				}, 50);
				console.error(
					"[TenantFormDialog] Form validation failed:",
					result.error.format(),
				);
				return;
			}
			setFormErrors({});
			onSubmit(result.data);
		},
	});

	// Synchronize form fields automatically whenever modal opens or editingTenant changes
	useEffect(() => {
		if (open) {
			setFormErrors({});
			if (editingTenant) {
				const startDate =
					toInputDateFormat(editingTenant.startDate) || todayStr;
				const duration = (editingTenant.duration || "Bulanan") as RentDuration;
				const dueDate =
					toInputDateFormat(editingTenant.dueDate) ||
					calculateDueDate(startDate, duration);

				form.setFieldValue("name", editingTenant.name || "");
				form.setFieldValue(
					"birthDate",
					toInputDateFormat(editingTenant.birthDate) || "",
				);
				form.setFieldValue(
					"nik",
					editingTenant.nik ? editingTenant.nik.replace(/[^0-9]/g, "") : "",
				);
				form.setFieldValue(
					"phone",
					editingTenant.phone ? sanitizePhone(editingTenant.phone) : "",
				);
				form.setFieldValue("originAddress", editingTenant.originAddress || "");
				form.setFieldValue("email", editingTenant.email || "");
				form.setFieldValue(
					"occupationStatus",
					(editingTenant.occupationStatus || "Mahasiswa") as OccupationStatus,
				);
				form.setFieldValue("institution", editingTenant.institution || "");
				form.setFieldValue(
					"roomNo",
					editingTenant.roomNo || (roomOptions[0]?.roomNo ?? ""),
				);
				form.setFieldValue(
					"rent",
					editingTenant.rent ||
						(roomOptions[0] ? formatRupiah(roomOptions[0].price) : ""),
				);
				form.setFieldValue("duration", duration);
				form.setFieldValue("startDate", startDate);
				form.setFieldValue("dueDate", dueDate);
				form.setFieldValue("vehicle", editingTenant.vehicle || "");
				form.setFieldValue("deposit", editingTenant.deposit || "");
				form.setFieldValue("emergencyName", editingTenant.emergencyName || "");
				form.setFieldValue(
					"emergencyRelation",
					editingTenant.emergencyRelation || "",
				);
				form.setFieldValue(
					"emergencyPhone",
					editingTenant.emergencyPhone
						? editingTenant.emergencyPhone.replace(/[^0-9+]/g, "")
						: "",
				);
				form.setFieldValue(
					"registrationDate",
					toInputDateFormat(editingTenant.registrationDate) || todayStr,
				);
				form.setFieldValue("notes", editingTenant.notes || "");
				form.setFieldValue("ktpUrl", "");
				form.setFieldValue("markPastPeriodsPaid", true);
				form.setFieldValue("agreement", true);
				form.setFieldValue("roomChangeMode", "CORRECTION");
				form.setFieldValue("updatePendingInvoiceAmount", true);
				form.setFieldValue("createDifferenceInvoice", true);
				form.setFieldValue("contractUpdateScope", "CURRENT_ONLY");
				setKtpPreview(null);
				setKtpFileName("");
				setScanStatus("idle");
				setScanFeedback("");
			} else {
				form.reset();
				const defaultRoom = roomOptions[0];
				const defaultRent = defaultRoom
					? formatRupiah(defaultRoom.price)
					: "Rp0";
				const defaultDue = calculateDueDate(todayStr, "Bulanan");

				form.setFieldValue("name", "");
				form.setFieldValue("birthDate", "");
				form.setFieldValue("nik", "");
				form.setFieldValue("phone", "");
				form.setFieldValue("originAddress", "");
				form.setFieldValue("email", "");
				form.setFieldValue("occupationStatus", "Mahasiswa");
				form.setFieldValue("institution", "");
				form.setFieldValue("roomNo", defaultRoom?.roomNo ?? "");
				form.setFieldValue("rent", defaultRent);
				form.setFieldValue("duration", "Bulanan");
				form.setFieldValue("startDate", todayStr);
				form.setFieldValue("dueDate", defaultDue);
				form.setFieldValue("vehicle", "");
				form.setFieldValue("deposit", "");
				form.setFieldValue("emergencyName", "");
				form.setFieldValue("emergencyRelation", "");
				form.setFieldValue("emergencyPhone", "");
				form.setFieldValue("registrationDate", todayStr);
				form.setFieldValue("notes", "");
				form.setFieldValue("ktpUrl", "");
				form.setFieldValue("markPastPeriodsPaid", true);
				form.setFieldValue("agreement", true);
				form.setFieldValue("roomChangeMode", "CORRECTION");
				form.setFieldValue("createDifferenceInvoice", true);
				form.setFieldValue("contractUpdateScope", "CURRENT_ONLY");
				setKtpPreview(null);
				setKtpFileName("");
				setScanStatus("idle");
				setScanFeedback("");
			}
		}
	}, [open, editingTenant, roomOptions, todayStr, form]);

	const handleKtpFileChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setScanStatus("error");
			setScanFeedback("File harus berupa format gambar (JPG, PNG, WebP).");
			return;
		}

		setKtpFileName(file.name);
		setScanStatus("scanning");
		setScanFeedback("Mengompresi dan menganalisis foto KTP...");

		try {
			// Kompresi client-side (maks 1280px) agar cepat dan hemat bandwidth
			const compressedBase64 = await compressImage(file);
			if (!compressedBase64) {
				throw new Error("Gagal membaca file gambar.");
			}

			// Simpan preview sementara di browser untuk membantu pencocokan visual (tidak disimpan ke storage/database)
			setKtpPreview(compressedBase64);
			form.setFieldValue("ktpUrl", "");

			// Panggil OCR AI di latar belakang secara non-blocking
			try {
				const res = await scanKtpMutation.mutateAsync({
					imageBase64: compressedBase64,
				});

				if (res.success && res.data) {
					if (res.data.nik) form.setFieldValue("nik", res.data.nik);
					if (res.data.name) form.setFieldValue("name", res.data.name);
					if (res.data.birthDate) {
						form.setFieldValue(
							"birthDate",
							toInputDateFormat(res.data.birthDate),
						);
					}
					if (res.data.originAddress) {
						form.setFieldValue("originAddress", res.data.originAddress);
					}
					if (res.data.occupation) {
						form.setFieldValue("occupationStatus", res.data.occupation);
					}
					if (res.data.institution) {
						form.setFieldValue("institution", res.data.institution);
					}

					setScanStatus("success");
					setScanFeedback(
						"Data identitas berhasil dipindai dan terisi otomatis!",
					);
				} else {
					setScanStatus("warning");
					setScanFeedback(
						res.error ||
							"Layanan AI sedang sibuk, silakan lengkapi data formulir secara manual.",
					);
				}
			} catch (aiErr) {
				console.warn("[TenantFormDialog] AI OCR fallback:", aiErr);
				setScanStatus("warning");
				setScanFeedback(
					"Layanan AI sedang sibuk, silakan lengkapi data formulir secara manual.",
				);
			}
		} catch (err) {
			console.error("[TenantFormDialog] Error memproses file KTP:", err);
			setScanStatus("error");
			setScanFeedback("Gagal memproses file foto. Silakan coba file lain.");
		}
	};

	const handleClearKtp = () => {
		setKtpPreview(null);
		setKtpFileName("");
		setScanStatus("idle");
		setScanFeedback("");
		form.setFieldValue("ktpUrl", "");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

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
				formatRupiah(r.price).toLowerCase().includes(query),
		);
	}, [roomOptions, roomQuery]);

	// Auto-calculation handler for Room selection
	const handleSelectRoom = (room: RoomOption) => {
		form.setFieldValue("roomNo", room.roomNo);
		const currentDuration = form.getFieldValue("duration");
		const months = getDurationMonths(currentDuration);
		const totalRent = room.price * months;
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
			? matchedRoom.price
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
			<DialogContent
				ref={dialogContentRef}
				className="max-w-[760px] max-h-[90vh] overflow-y-auto rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
			>
				<DialogHeader>
					<div className="flex items-center gap-2.5 mb-1">
						<div className="w-8 h-8 rounded-[9px] bg-[#edf4ee] text-[#4f6958] flex items-center justify-center">
							<UserCheck className="w-4 h-4" />
						</div>
						<div>
							<DialogTitle className="text-[18px] font-bold text-[#29382e]">
								{isEditing ? "Edit Data Penghuni" : "Formulir Pendaftaran Kost"}
							</DialogTitle>
							<DialogDescription className="text-[11px] text-[#8a958d]">
								{isEditing
									? `Perbarui profil, identitas, dan kontak darurat untuk ${editingTenant?.name}`
									: "Data pendaftaran penghuni baru untuk properti yang sedang dipilih."}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="text-[11px] text-[#55705d] bg-[#f3f7f3] border border-[#dce6df] rounded-[10px] p-2.5 mb-2 font-medium">
					Properti aktif:{" "}
					<strong className="text-[#26372c]">{propertyName}</strong>
					{isEditing && editingTenant?.roomNo && (
						<span className="ml-2 pl-2 border-l border-[#dce6df] text-[#415648]">
							Kamar: <strong>{editingTenant.roomNo}</strong>
						</span>
					)}
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-5"
				>
					{/* ERROR SUMMARY ALERT BANNER */}
					{Object.keys(formErrors).length > 0 && (
						<div className="bg-[#fdf0ee] border border-[#f5cfcc] rounded-[14px] p-3.5 mb-2 text-[#b66b68] shadow-sm animate-in fade-in duration-200">
							<div className="flex items-center gap-2 font-bold text-[12px] mb-1.5 text-[#a84d4a]">
								<AlertCircle className="w-4 h-4 shrink-0 text-[#b66b68]" />
								<span>
									Mohon periksa dan perbaiki isian berikut sebelum menyimpan:
								</span>
							</div>
							<ul className="list-disc list-inside text-[11px] space-y-1 pl-1 font-medium text-[#7a3835]">
								{Object.entries(formErrors).map(([key, msg]) => (
									<li key={key}>
										<span className="font-semibold text-[#8b3532]">
											{FIELD_LABELS[key] || key}:
										</span>{" "}
										{msg}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* TOP SECTION: Pindai KTP Otomatis */}
					<div className="bg-gradient-to-br from-[#f8faf8] to-[#edf4ee] border border-[#d8e4da] rounded-[16px] p-4 mb-2">
						<div className="flex items-center justify-between gap-3 mb-2.5">
							<div className="flex items-center gap-2">
								<div>
									<h4 className="text-[12px] font-bold text-[#24342b] m-0">
										Pindai KTP Otomatis
									</h4>
								</div>
							</div>
							{ktpPreview && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleClearKtp}
									className="h-7 px-2 text-[10px] text-[#b66b68] hover:bg-[#faeae8]"
								>
									<X className="w-3 h-3 mr-1" />
									Hapus Foto
								</Button>
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
							{/* Upload Dropzone / Button */}
							<div className={ktpPreview ? "sm:col-span-8" : "sm:col-span-12"}>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleKtpFileChange}
									accept="image/*"
									className="hidden"
								/>
								<div
									onClick={() => fileInputRef.current?.click()}
									className="border-2 border-dashed border-[#b8cbbd] hover:border-[#4f6958] bg-white/80 hover:bg-white rounded-[12px] p-3 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center sm:justify-start gap-2.5 min-w-0 overflow-hidden"
								>
									<div className="w-8 h-8 rounded-full bg-[#edf4ee] text-[#4f6958] flex items-center justify-center shrink-0">
										<UploadCloud className="w-4 h-4" />
									</div>
									<div className="text-left min-w-0 flex-1 overflow-hidden">
										<p
											className="text-[11.5px] font-bold text-[#2d3e33] truncate block max-w-full"
											title={
												ktpFileName ||
												(ktpPreview ? "Ganti foto KTP" : "Pilih foto KTP")
											}
										>
											{ktpFileName ||
												(ktpPreview ? "Ganti foto KTP" : "Pilih foto KTP")}
										</p>
										<span className="text-[10px] text-[#78857b] block truncate">
											Format JPG, PNG, atau WebP (Maks 5MB)
										</span>
									</div>
								</div>
							</div>

							{/* KTP Thumbnail Preview */}
							{ktpPreview && (
								<div className="sm:col-span-4 relative group rounded-[10px] overflow-hidden border border-[#cfdfd1] bg-black/5 aspect-[16/10] max-h-[80px] flex items-center justify-center">
									<img
										src={ktpPreview}
										alt="Foto KTP"
										className="w-full h-full object-cover"
									/>
									<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										<span className="text-white text-[10px] font-medium bg-black/60 px-2 py-0.5 rounded">
											Pratinjau KTP
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Scan Feedback status */}
						{scanFeedback && (
							<div
								className={`mt-2.5 p-2 rounded-[8px] text-[10.5px] flex items-start gap-1.5 font-medium ${
									scanStatus === "success"
										? "bg-[#eaf4ec] text-[#346641] border border-[#c4e2cb]"
										: scanStatus === "warning"
											? "bg-[#fef9ee] text-[#8f6d2b] border border-[#f5e6c7]"
											: scanStatus === "error"
												? "bg-[#fdf0ee] text-[#b66b68] border border-[#f5cfcc]"
												: "bg-[#edf4ee] text-[#4f6958] border border-[#d6e4d9]"
								}`}
							>
								{scanStatus === "success" ? (
									<CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#346641]" />
								) : scanStatus === "warning" ? (
									<AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#8f6d2b]" />
								) : scanStatus === "error" ? (
									<X className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#b66b68]" />
								) : (
									<Loader2 className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin text-[#4f6958]" />
								)}
								<span>{scanFeedback}</span>
							</div>
						)}
					</div>

					{/* Section A: Informasi Pribadi */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							A. Informasi Pribadi
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Data identitas dan kontak penghuni.
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
									const errorMsg =
										field.state.meta.errors[0] || formErrors.name;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nama Lengkap <span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("name");
													field.handleChange(e.target.value);
												}}
												placeholder="Nama lengkap penghuni"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
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
									const errorMsg =
										field.state.meta.errors[0] || formErrors.birthDate;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Tanggal Lahir
											</Label>
											<Input
												type="date"
												max={todayStr}
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("birthDate");
													field.handleChange(e.target.value);
												}}
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
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
									const errorMsg = field.state.meta.errors[0] || formErrors.nik;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nomor Induk Kependudukan
												<span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												value={field.state.value}
												maxLength={16}
												onChange={(e) => {
													clearFieldError("nik");
													const digitsOnly = e.target.value.replace(
														/[^0-9]/g,
														"",
													);
													field.handleChange(digitsOnly);
												}}
												placeholder="Contoh: 3201011234567890"
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
													{errorMsg}
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
											: value.replace(/[^0-9]/g, "").length < 10
												? "Nomor minimal 10 digit"
												: undefined,
								}}
							>
								{(field) => {
									const errorMsg =
										field.state.meta.errors[0] || formErrors.phone;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nomor Telepon / WhatsApp{" "}
												<span className="text-[#b66b68]">*</span>
											</Label>
											<Input
												value={field.state.value}
												inputMode="tel"
												onChange={(e) => {
													clearFieldError("phone");
													const cleaned = e.target.value.replace(
														/[^0-9+]/g,
														"",
													);
													field.handleChange(cleaned);
												}}
												placeholder="08xxxxxxxxxx"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] font-mono bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
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
												onChange={(e) => {
													clearFieldError("originAddress");
													field.handleChange(e.target.value);
												}}
												rows={2}
												placeholder="Alamat asal sesuai KTP / domisili"
												className="w-full border border-[#dfe7e0] rounded-[11px] p-2.5 text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] outline-none"
											/>
										</div>
									)}
								</form.Field>
							</div>

							{/* Email */}
							<form.Field
								name="email"
								validators={{
									onChange: ({ value }) =>
										value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
											? "Format email tidak valid"
											: undefined,
								}}
							>
								{(field) => {
									const errorMsg =
										field.state.meta.errors[0] || formErrors.email;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Email
											</Label>
											<Input
												type="email"
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("email");
													field.handleChange(e.target.value);
												}}
												placeholder="nama@email.com"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>
						</div>
					</div>

					{/* Section B: Informasi Pekerjaan / Pendidikan */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							B. Informasi Pekerjaan / Pendidikan
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							Status dan institusi penghuni.
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

					{/* Section C: Kamar & Rincian Sewa */}
					<div className="border-t border-[#edf1ed] pt-3">
						<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
							{isEditing
								? "C. Kamar & Rincian Sewa"
								: "C. Rincian Pendaftaran Kost"}
						</h3>
						<p className="text-[10px] text-[#737873] m-0 mb-3">
							{isEditing
								? "Detail kamar, harga sewa, dan informasi kendaraan penghuni."
								: "Detail kamar, durasi, dan kendaraan penghuni."}
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{/* Searchable Combobox for Room Selection */}
							<form.Field
								name="roomNo"
								validators={{
									onChange: ({ value }) =>
										!value ? "Nomor kamar wajib dipilih" : undefined,
								}}
							>
								{(field) => {
									const errorMsg =
										field.state.meta.errors[0] || formErrors.roomNo;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1 relative" ref={comboboxRef}>
											<Label className="text-[11px] font-bold text-[#506257]">
												Nomor Kamar <span className="text-[#b66b68]">*</span>
											</Label>

											{/* Trigger Button */}
											<button
												type="button"
												onClick={() => setIsComboboxOpen((prev) => !prev)}
												className={`w-full h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] flex items-center justify-between transition-colors cursor-pointer text-left ${
													hasError
														? "border-[#b66b68]"
														: "border-[#dfe7e0] hover:border-[#8fa594]"
												}`}
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

											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
												</p>
											)}

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
																		onClick={() => {
																			clearFieldError("roomNo");
																			handleSelectRoom(room);
																		}}
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
																				{formatRupiah(room.price)}/bln
																			</span>
																			{isSelected && (
																				<Check className="w-3.5 h-3.5 text-[#4f6958]" />
																			)}
																		</div>
																	</button>
																);
															})
														) : (
															<div className="py-4 px-2 text-center text-[11px] text-[#8a958d]">
																{roomOptions.length === 0
																	? "Tidak ada kamar kosong yang tersedia di properti ini."
																	: "Kamar tidak ditemukan."}
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* Room Change Context-Aware Card (Ditampilkan saat kamar diubah pada mode Edit) */}
							<form.Subscribe selector={(state) => state.values.roomNo}>
								{(currentRoomNo) => {
									const isRoomChanged =
										isEditing &&
										Boolean(editingTenant?.roomNo) &&
										Boolean(currentRoomNo) &&
										currentRoomNo !== editingTenant?.roomNo;

									if (!isRoomChanged) return null;

									const targetRoom = roomOptions.find(
										(r) => r.roomNo === currentRoomNo,
									);

									return (
										<div className="col-span-1 sm:col-span-2 bg-[#fdfbf7] border border-[#d8e4da] rounded-[12px] p-3.5 space-y-2.5 shadow-sm animate-in fade-in duration-200">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="flex items-center gap-2 text-[#2d4334] font-bold text-[12px]">
													<ArrowRightLeft className="w-4 h-4 text-[#4f6958] shrink-0" />
													<span>Perubahan Kamar Terdeteksi</span>
												</div>
												<div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4f6958] bg-[#eef4ef] px-2.5 py-0.5 rounded-full border border-[#d3e2d6]">
													<span>Kamar {editingTenant?.roomNo}</span>
													<span>➔</span>
													<span>
														Kamar {currentRoomNo}
														{targetRoom ? ` (${targetRoom.type})` : ""}
													</span>
												</div>
											</div>

											<p className="text-[11px] text-[#55695a] leading-relaxed m-0">
												Pilih alasan perubahan kamar. Tagihan periode berikutnya
												akan otomatis menggunakan tarif kamar baru.
											</p>

											<form.Field name="roomChangeMode">
												{(modeField) => (
													<div className="space-y-2 pt-0.5">
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
															{/* Option 1: CORRECTION */}
															<label
																className={`flex items-start gap-2.5 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
																	modeField.state.value === "CORRECTION"
																		? "bg-[#edf4ee] border-[#4f6958] text-[#24342b]"
																		: "bg-white border-[#dfe7e0] text-[#4a554d] hover:bg-[#f8faf8]"
																}`}
															>
																<input
																	type="radio"
																	name="roomChangeMode"
																	value="CORRECTION"
																	checked={
																		modeField.state.value === "CORRECTION"
																	}
																	onChange={() =>
																		modeField.handleChange("CORRECTION")
																	}
																	className="accent-[#4f6958] mt-0.5"
																/>
																<div className="space-y-0.5">
																	<span className="text-[11.5px] font-bold block text-[#24342b]">
																		Koreksi Salah Input
																	</span>
																	<p className="text-[10px] text-[#55695a] leading-tight m-0">
																		Hanya perbaiki kamar karena salah pilih di
																		awal.
																	</p>
																</div>
															</label>

															{/* Option 2: TRANSFER */}
															<label
																className={`flex items-start gap-2.5 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
																	modeField.state.value === "TRANSFER"
																		? "bg-[#edf4ee] border-[#4f6958] text-[#24342b]"
																		: "bg-white border-[#dfe7e0] text-[#4a554d] hover:bg-[#f8faf8]"
																}`}
															>
																<input
																	type="radio"
																	name="roomChangeMode"
																	value="TRANSFER"
																	checked={modeField.state.value === "TRANSFER"}
																	onChange={() =>
																		modeField.handleChange("TRANSFER")
																	}
																	className="accent-[#4f6958] mt-0.5"
																/>
																<div className="space-y-0.5">
																	<span className="text-[11.5px] font-bold block text-[#24342b]">
																		Pindah Kamar Resmi
																	</span>
																	<p className="text-[10px] text-[#55695a] leading-tight m-0">
																		Penghuni pindah kamar dan sewa baru dimulai
																		hari ini.
																	</p>
																</div>
															</label>
														</div>

														{/* Penyesuaian Tagihan Belum Lunas Periode Berjalan */}
														{modeField.state.value === "CORRECTION" && (
															<form.Field name="updatePendingInvoiceAmount">
																{() => {
																	const oldRoomPrice =
																		roomOptions.find(
																			(r) => r.roomNo === editingTenant?.roomNo,
																		)?.price ?? 0;
																	const newRoomPrice = targetRoom?.price ?? 0;
																	const priceDiffers =
																		oldRoomPrice > 0 &&
																		newRoomPrice > 0 &&
																		oldRoomPrice !== newRoomPrice;

																	if (priceDiffers) {
																		return (
																			<div className="flex items-start gap-2.5 p-3 bg-[#edf4ee] rounded-[8px] border border-[#cfdfd1] text-[#324536]">
																				<Info className="w-4 h-4 text-[#4f6958] shrink-0 mt-0.5" />
																				<div className="text-xs leading-relaxed space-y-0.5">
																					<span className="font-semibold block text-[#25392b]">
																						Penyesuaian Tarif Tagihan Bulan Ini
																					</span>
																					<p className="text-[11px] text-[#55695a]">
																						Tagihan bulan ini akan otomatis
																						disesuaikan mengikuti harga kamar
																						yang benar (
																						{formatRupiah(oldRoomPrice)} ➔{" "}
																						{formatRupiah(newRoomPrice)}).
																					</p>
																				</div>
																			</div>
																		);
																	}

																	return (
																		<div className="flex items-start gap-2.5 p-3 bg-[#f5f8f5] rounded-[8px] border border-[#dbe6de] text-xs text-[#4f6354] leading-relaxed">
																			<Info className="w-4 h-4 text-[#607765] shrink-0 mt-0.5" />
																			<div className="space-y-0.5">
																				<span className="font-semibold block text-[#2c3d31]">
																					Tarif kamar sama (
																					{formatRupiah(targetRoom?.price ?? 0)}
																					)
																				</span>
																				<p className="text-[11px] text-[#55695a]">
																					Kamar diperbaiki tanpa perubahan harga
																					sewa. Tagihan bulan ini tetap berjalan
																					normal.
																				</p>
																			</div>
																		</div>
																	);
																}}
															</form.Field>
														)}

														{/* Penanganan Selisih Harga untuk Mode TRANSFER */}
														{modeField.state.value === "TRANSFER" && (
															<form.Field name="createDifferenceInvoice">
																{() => {
																	const oldRoomPrice =
																		roomOptions.find(
																			(r) => r.roomNo === editingTenant?.roomNo,
																		)?.price ?? 0;
																	const newRoomPrice = targetRoom?.price ?? 0;
																	const priceDiff = newRoomPrice - oldRoomPrice;

																	if (priceDiff > 0) {
																		return (
																			<div className="flex items-start gap-2.5 p-3 bg-[#edf4ee] rounded-[8px] border border-[#cfdfd1] text-[#324536]">
																				<Info className="w-4 h-4 text-[#4f6958] shrink-0 mt-0.5" />
																				<div className="text-xs leading-relaxed space-y-1">
																					<div className="flex items-center gap-1.5 flex-wrap">
																						<span className="font-bold text-[#25392b]">
																							Informasi Selisih Biaya Kamar:
																						</span>
																						<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4f6958] text-white">
																							+{formatRupiah(priceDiff)}
																						</span>
																						<span className="text-[10px] text-[#6d7d71]">
																							({formatRupiah(oldRoomPrice)} ➔{" "}
																							{formatRupiah(newRoomPrice)})
																						</span>
																					</div>
																					<p className="text-[11px] text-[#55695a]">
																						Tagihan selisih harga kamar sebesar{" "}
																						{formatRupiah(priceDiff)} akan
																						otomatis dibuat untuk bulan ini.
																						Tagihan bulan depan otomatis
																						mengikuti tarif kamar baru.
																					</p>
																				</div>
																			</div>
																		);
																	}

																	return (
																		<div className="flex items-start gap-2.5 p-3 bg-[#f5f8f5] rounded-[8px] border border-[#dbe6de] text-xs text-[#4f6354] leading-relaxed">
																			<Info className="w-4 h-4 text-[#607765] shrink-0 mt-0.5" />
																			<div className="space-y-0.5">
																				<span className="font-semibold block text-[#2c3d31]">
																					Tidak ada tagihan selisih biaya
																				</span>
																				<p className="text-[11px] text-[#55695a]">
																					Tarif kamar baru sama atau lebih
																					terjangkau (
																					{formatRupiah(oldRoomPrice)} ➔{" "}
																					{formatRupiah(newRoomPrice)}). Tidak
																					ada tambahan tagihan bulan ini, dan
																					tarif baru otomatis berlaku mulai
																					periode sewa berikutnya.
																				</p>
																			</div>
																		</div>
																	);
																}}
															</form.Field>
														)}
													</div>
												)}
											</form.Field>
										</div>
									);
								}}
							</form.Subscribe>

							{/* Total Tarif Sewa Kamar (Kolom Info Readonly - Row 1 Col 2) */}
							<form.Field name="rent">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Total Tarif Sewa
										</Label>
										<div className="h-[41px] border border-[#dfe7e0] rounded-[11px] px-3 bg-[#f8faf8] flex items-center">
											<span className="text-[12.5px] font-bold text-[#252925] font-mono">
												{field.state.value || "Rp0"}
											</span>
										</div>
									</div>
								)}
							</form.Field>

							{/* Lama Sewa Radio (Row 2 - Full Width Col 1 & 2) */}
							<div className="col-span-1 sm:col-span-2 space-y-1.5 pt-0.5">
								<form.Field name="duration">
									{(field) => {
										const errorMsg =
											field.state.meta.errors[0] || formErrors.duration;
										const hasError = Boolean(errorMsg);
										return (
											<div className="space-y-1.5">
												<Label className="text-[11px] font-bold text-[#506257]">
													Lama Sewa <span className="text-[#b66b68]">*</span>
												</Label>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
													{(
														[
															"Bulanan",
															"Triwulan",
															"Semesteran",
															"Tahunan",
														] as const
													).map((dur) => {
														const isChecked = field.state.value === dur;
														return (
															<label
																key={dur}
																className={`flex items-center gap-2 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
																	isChecked
																		? "bg-[#edf4ee] border-[#4f6958] text-[#24342b] font-semibold"
																		: "bg-white border-[#dfe7e0] text-[#4a554d] hover:bg-[#f8faf8]"
																}`}
															>
																<input
																	type="radio"
																	name="duration"
																	value={dur}
																	checked={isChecked}
																	onChange={() => {
																		clearFieldError("duration");
																		handleChangeDuration(dur);
																	}}
																	className="accent-[#4f6958]"
																/>
																<span className="text-[11.5px]">
																	{dur}{" "}
																	<span className="text-[9.5px] text-[#78887d]">
																		({getDurationMonths(dur)} bln)
																	</span>
																</span>
															</label>
														);
													})}
												</div>
												{hasError && (
													<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
														{errorMsg}
													</p>
												)}
											</div>
										);
									}}
								</form.Field>
							</div>

							{/* Pengaturan Penerapan Tagihan Saat Edit (Row 3 - Full Width Col 1 & 2) */}
							{isEditing && (
								<form.Subscribe
									selector={(state) => [
										state.values.duration,
										state.values.rent,
										state.values.startDate,
									]}
								>
									{([currDuration, currRent, currStartDate]) => {
										const isDurationOrPriceChanged =
											currDuration !== editingTenant?.duration ||
											currRent !== editingTenant?.rent ||
											currStartDate !== toInputDateFormat(editingTenant?.startDate);

										if (!isDurationOrPriceChanged) return null;

										return (
											<div className="col-span-1 sm:col-span-2 bg-[#fdfbf7] border border-[#d8e4da] rounded-[12px] p-3 space-y-2 shadow-xs animate-in fade-in duration-200">
												<Label className="text-[11px] font-bold text-[#252925] block">
													Pilih bagaimana perubahan nominal dan durasi sewa diterapkan:
												</Label>

												<form.Field name="contractUpdateScope">
													{(scopeField) => (
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
															{/* Opsi 1 */}
															<label
																className={`flex items-start gap-2.5 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
																	scopeField.state.value === "ALL_HISTORY"
																		? "bg-[#edf4ee] border-[#4f6958] text-[#24342b]"
																		: "bg-white border-[#dfe7e0] text-[#4a554d] hover:bg-[#f8faf8]"
																}`}
															>
																<input
																	type="radio"
																	name="contractUpdateScope"
																	value="ALL_HISTORY"
																	checked={scopeField.state.value === "ALL_HISTORY"}
																	onChange={() => scopeField.handleChange("ALL_HISTORY")}
																	className="accent-[#4f6958] mt-0.5"
																/>
																<div className="space-y-0.5">
																	<span className="text-[11.5px] font-bold block text-[#24342b]">
																		Ubah Semua Nominal Kontrak
																	</span>
																	<p className="text-[10px] text-[#55695a] leading-tight m-0">
																		Perbarui seluruh riwayat tagihan kontrak ini.
																	</p>
																</div>
															</label>

															{/* Opsi 2 */}
															<label
																className={`flex items-start gap-2.5 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
																	scopeField.state.value === "CURRENT_ONLY"
																		? "bg-[#edf4ee] border-[#4f6958] text-[#24342b]"
																		: "bg-white border-[#dfe7e0] text-[#4a554d] hover:bg-[#f8faf8]"
																}`}
															>
																<input
																	type="radio"
																	name="contractUpdateScope"
																	value="CURRENT_ONLY"
																	checked={scopeField.state.value === "CURRENT_ONLY"}
																	onChange={() => scopeField.handleChange("CURRENT_ONLY")}
																	className="accent-[#4f6958] mt-0.5"
																/>
																<div className="space-y-0.5">
																	<span className="text-[11.5px] font-bold block text-[#24342b]">
																		Hanya Kontrak Berjalan
																	</span>
																	<p className="text-[10px] text-[#55695a] leading-tight m-0">
																		Terapkan untuk periode aktif ke depan.
																	</p>
																</div>
															</label>
														</div>
													)}
												</form.Field>
											</div>
										);
									}}
								</form.Subscribe>
							)}

							{/* Tanggal Mulai Sewa & Settlement Option & Due Date Preview (Hanya Pendaftaran Baru) */}
							{!isEditing && (
								<>
									{/* Tanggal Mulai Sewa (Input Date) */}
									<form.Field
										name="startDate"
										validators={{
											onChange: ({ value }) =>
												!value ? "Tanggal mulai sewa wajib diisi" : undefined,
										}}
									>
										{(field) => {
											const errorMsg =
												field.state.meta.errors[0] || formErrors.startDate;
											const hasError = Boolean(errorMsg);
											return (
												<div className="space-y-1">
													<Label className="text-[11px] font-bold text-[#506257]">
														Tanggal Mulai Sewa
													</Label>
													<Input
														type="date"
														value={field.state.value}
														onChange={(e) => {
															clearFieldError("startDate");
															handleChangeStartDate(e.target.value);
														}}
														className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
															hasError
																? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
																: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
														}`}
													/>
													{hasError && (
														<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
															{errorMsg}
														</p>
													)}
												</div>
											);
										}}
									</form.Field>

									{/* Multi-Period or Initial Period Settlement Option */}
									<form.Subscribe selector={(state) => state.values.startDate}>
										{(startDateValue) => {
											const isPast = Boolean(
												startDateValue &&
													new Date(startDateValue) < new Date(todayStr),
											);

											return (
												<div className="col-span-1 sm:col-span-2 bg-[#f4f8f4] border border-[#cfdfd1] rounded-[12px] p-3 text-[11.5px] space-y-2 mt-1">
													<div className="flex items-center gap-2 text-[#314a38] font-bold">
														{isPast ? (
															<History className="w-4 h-4 text-[#4f6958]" />
														) : (
															<CheckCircle2 className="w-4 h-4 text-[#4f6958]" />
														)}
														<span>
															{isPast
																? `Deteksi Migrasi Data Lampau (Mulai: ${startDateValue})`
																: "Status Pembayaran Sewa Periode Pertama"}
														</span>
													</div>
													<p className="text-[11px] text-[#55695a] leading-relaxed m-0">
														{isPast
															? "Tanggal mulai sewa berada di masa lalu. Sistem dapat otomatis mencatat seluruh periode sewa lampau yang telah berjalan sejak tanggal tersebut sebagai LUNAS (PAID) dalam 1 kali simpan."
															: "Centang opsi ini jika penghuni langsung melunasi tagihan sewa periode awal saat pendaftaran kamar (otomatis berstatus LUNAS & tercatat di kas)."}
													</p>
													<form.Field name="markPastPeriodsPaid">
														{(pastField) => (
															<label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-[#273a2d]">
																<input
																	type="checkbox"
																	checked={Boolean(pastField.state.value)}
																	onChange={(e) =>
																		pastField.handleChange(e.target.checked)
																	}
																	className="w-4 h-4 accent-[#4f6958] rounded cursor-pointer"
																/>
																<span>
																	{isPast
																		? "Tandai semua periode sewa lampau sebagai LUNAS"
																		: "Tandai tagihan sewa pertama sebagai LUNAS (Sudah Bayar)"}
																</span>
															</label>
														)}
													</form.Field>
												</div>
											);
										}}
									</form.Subscribe>

									{/* Tanggal Jatuh Tempo (Read-Only Dynamic Preview Card) */}
									<form.Subscribe
										selector={(state) => [
											state.values.startDate,
											state.values.duration,
											state.values.dueDate,
										]}
									>
										{([startDateVal, durationVal, dueDateVal]) => {
											const currentDuration =
												(durationVal as RentDuration) || "Bulanan";
											const months = getDurationMonths(currentDuration);
											const effectiveDueDate =
												(dueDateVal as string) ||
												calculateDueDate(
													startDateVal as string,
													currentDuration,
												);

											const formattedDue = effectiveDueDate
												? formatDate(effectiveDueDate)
												: "Pilih tanggal mulai sewa";

											return (
												<div className="space-y-1">
													<Label className="text-[11px] font-bold text-[#506257]">
														Tanggal Jatuh Tempo Berikutnya
													</Label>
													<div className="h-[41px] border border-[#d6e2d9] rounded-[11px] px-3 bg-[#f4f7f4] flex items-center justify-between">
														<div className="flex items-center gap-2 min-w-0">
															<CalendarDays className="w-4 h-4 text-[#4f6958] shrink-0" />
															<span className="text-[12px] font-bold text-[#233528] truncate">
																{formattedDue}
															</span>
														</div>
														<span className="text-[10px] font-medium text-[#4f6958] bg-[#e4ede6] px-2 py-0.5 rounded-[6px] shrink-0">
															+{months} Bulan
														</span>
													</div>
													<p className="text-[9.5px] text-[#718276] leading-tight m-0">
														Dihitung otomatis dari tanggal mulai sewa &amp;
														durasi.
													</p>
												</div>
											);
										}}
									</form.Subscribe>
								</>
							)}

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
											inputMode="numeric"
											onChange={(e) => {
												const digits = e.target.value.replace(/[^0-9]/g, "");
												field.handleChange(
													digits ? formatRupiah(Number(digits)) : "",
												);
											}}
											placeholder="Contoh: Rp500.000 (opsional)"
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
								{(field) => {
									const errorMsg =
										field.state.meta.errors[0] || formErrors.emergencyName;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nama Kontak
											</Label>
											<Input
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("emergencyName");
													field.handleChange(e.target.value);
												}}
												placeholder="Nama kontak darurat"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>

							<form.Field name="emergencyRelation">
								{(field) => {
									const errorMsg =
										field.state.meta.errors[0] || formErrors.emergencyRelation;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Hubungan
											</Label>
											<Input
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("emergencyRelation");
													field.handleChange(e.target.value);
												}}
												placeholder="Orang tua / saudara / lainnya"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>

							<form.Field
								name="emergencyPhone"
								validators={{
									onChange: ({ value }) => {
										if (value && value.trim() !== "") {
											const digits = value.replace(/[^0-9]/g, "");
											if (digits.length > 0 && digits.length < 9) {
												return "Nomor telepon darurat minimal 9 digit";
											}
										}
										return undefined;
									},
								}}
							>
								{(field) => {
									const errorMsg =
										field.state.meta.errors[0] || formErrors.emergencyPhone;
									const hasError = Boolean(errorMsg);
									return (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Nomor Telepon / HP
											</Label>
											<Input
												value={field.state.value}
												inputMode="tel"
												onChange={(e) => {
													clearFieldError("emergencyPhone");
													const cleaned = e.target.value.replace(
														/[^0-9+]/g,
														"",
													);
													field.handleChange(cleaned);
												}}
												placeholder="08xxxxxxxxxx"
												className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
													hasError
														? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
												}`}
											/>
											{hasError && (
												<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
													{errorMsg}
												</p>
											)}
										</div>
									);
								}}
							</form.Field>
						</div>

						{/* Catatan Pengelola (Ditampilkan juga pada mode Edit) */}
						{isEditing && (
							<div className="mt-3">
								<form.Field name="notes">
									{(field) => (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Catatan Tambahan Pengelola
											</Label>
											<textarea
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("notes");
													field.handleChange(e.target.value);
												}}
												rows={2}
												placeholder="Catatan tambahan tentang penghuni"
												className="w-full border border-[#dfe7e0] rounded-[11px] p-2.5 text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] outline-none"
											/>
										</div>
									)}
								</form.Field>
							</div>
						)}
					</div>

					{/* Section E: Persetujuan dan Tanda Tangan (Hanya pada Pendaftaran Baru) */}
					{!isEditing && (
						<div className="border-t border-[#edf1ed] pt-3">
							<h3 className="text-[13px] font-bold text-[#24342b] m-0 mb-0.5">
								E. Persetujuan dan Tanda Tangan
							</h3>
							<p className="text-[10px] text-[#737873] m-0 mb-3">
								Persetujuan pendaftaran penghuni.
							</p>

							<div className="grid grid-cols-1 gap-3">
								<form.Field
									name="registrationDate"
									validators={{
										onChange: ({ value }) =>
											!value ? "Tanggal pendaftaran wajib diisi" : undefined,
									}}
								>
									{(field) => {
										const errorMsg =
											field.state.meta.errors[0] || formErrors.registrationDate;
										const hasError = Boolean(errorMsg);
										return (
											<div className="space-y-1">
												<Label className="text-[11px] font-bold text-[#506257]">
													Tanggal Pendaftaran{" "}
													<span className="text-[#b66b68]">*</span>
												</Label>
												<Input
													type="date"
													value={field.state.value}
													onChange={(e) => {
														clearFieldError("registrationDate");
														field.handleChange(e.target.value);
													}}
													className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] ${
														hasError
															? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
															: "border-[#dfe7e0] focus-visible:border-[#8fa594]"
													}`}
												/>
												{hasError && (
													<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
														{errorMsg}
													</p>
												)}
											</div>
										);
									}}
								</form.Field>

								<form.Field name="notes">
									{(field) => (
										<div className="space-y-1">
											<Label className="text-[11px] font-bold text-[#506257]">
												Catatan
											</Label>
											<textarea
												value={field.state.value}
												onChange={(e) => {
													clearFieldError("notes");
													field.handleChange(e.target.value);
												}}
												rows={2}
												placeholder="Catatan tambahan tentang penghuni"
												className="w-full border border-[#dfe7e0] rounded-[11px] p-2.5 text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] outline-none"
											/>
										</div>
									)}
								</form.Field>

								<form.Field
									name="agreement"
									validators={{
										onChange: ({ value }) =>
											!value
												? "Persetujuan formulir wajib dicentang"
												: undefined,
									}}
								>
									{(field) => {
										const errorMsg =
											field.state.meta.errors[0] || formErrors.agreement;
										const hasError = Boolean(errorMsg);
										return (
											<div className="space-y-1">
												<div className="bg-[#f7faf7] border border-[#e4ebe5] rounded-[12px] p-3 mt-1">
													<label className="flex gap-2.5 items-start text-[11px] leading-relaxed text-[#5f6d64] cursor-pointer">
														<input
															type="checkbox"
															checked={field.state.value}
															onChange={(e) => {
																clearFieldError("agreement");
																field.handleChange(e.target.checked);
															}}
															className="mt-0.5 accent-[#4f6958]"
														/>
														<span>
															Dengan menyetujui formulir ini, penghuni
															menyatakan bahwa seluruh informasi yang diberikan
															adalah benar dan menyetujui syarat dan ketentuan
															yang berlaku di HomeeKost.
														</span>
													</label>
												</div>
												{hasError && (
													<p className="text-[10px] text-[#b66b68] font-medium pt-0.5">
														{errorMsg}
													</p>
												)}
											</div>
										);
									}}
								</form.Field>
							</div>
						</div>
					)}

					<DialogFooter className="pt-3 border-t border-[#edf1ed] flex gap-2 justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="h-[38px] px-4 rounded-[9px] border-[#dfe7e0] text-[#506257] hover:bg-[#f3f7f3] text-[12px]"
						>
							Batal
						</Button>
						<form.Subscribe selector={(state) => [state.isSubmitting]}>
							{([formSubmitting]) => {
								const submitting = formSubmitting || isSubmitting;
								return (
									<Button
										type="submit"
										disabled={submitting}
										className="h-[38px] px-5 rounded-[9px] bg-[#4f6958] hover:bg-[#425949] text-white font-semibold text-[12px] cursor-pointer"
									>
										{submitting ? (
											<span className="flex items-center gap-1.5">
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
												Menyimpan...
											</span>
										) : isEditing ? (
											"Simpan Perubahan"
										) : (
											"Simpan Pendaftaran"
										)}
									</Button>
								);
							}}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
