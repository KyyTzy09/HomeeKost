import { useForm } from "@tanstack/react-form";
import { Lock, Megaphone } from "lucide-react";
import { useEffect } from "react";
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
import type { AnnouncementCategory } from "../../common/types/index.ts";
import {
	type BroadcastAnnouncementInput,
	broadcastAnnouncementSchema,
} from "../../common/validations/index.ts";

interface EngagementEventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: BroadcastAnnouncementInput) => void;
	properties: { id: string; name: string }[];
	userRole?: string;
	userPropertyId?: string | null;
	isLoading?: boolean;
}

const CATEGORY_OPTIONS: { label: string; value: AnnouncementCategory }[] = [
	{ label: "📢 Umum / Informasi", value: "UMUM" },
	{ label: "🧹 Kerja Bakti & Kebersihan", value: "KERJA_BAKTI" },
	{ label: "🔧 Maintenance & Fasilitas", value: "MAINTENANCE" },
	{ label: "🎉 Acara / Kegiatan Bersama", value: "ACARA" },
];

export function EngagementEventDialog({
	open,
	onOpenChange,
	onSubmit,
	properties,
	userRole,
	userPropertyId,
	isLoading = false,
}: EngagementEventDialogProps) {
	const isAdmin = userRole === "ADMIN";

	const propertyOptions = [
		{ label: "📢 Semua Cabang Kos (Global)", value: "ALL" },
		...properties.map((p) => ({ label: `🏠 ${p.name}`, value: p.id })),
	];

	const form = useForm({
		defaultValues: {
			title: "",
			propertyId: isAdmin && userPropertyId ? userPropertyId : "",
			category: "UMUM" as AnnouncementCategory,
			content: "",
			isBroadcast: true,
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = broadcastAnnouncementSchema.safeParse({
					...value,
					propertyId:
						value.propertyId === "" || value.propertyId === "ALL"
							? null
							: value.propertyId,
				});
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
			onSubmit({
				title: value.title,
				propertyId:
					isAdmin && userPropertyId
						? userPropertyId
						: value.propertyId === "" || value.propertyId === "ALL"
							? null
							: value.propertyId,
				category: value.category,
				content: value.content,
				isBroadcast: value.isBroadcast,
			});
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			form.reset();
			form.setFieldValue(
				"propertyId",
				isAdmin && userPropertyId ? userPropertyId : "ALL",
			);
			form.setFieldValue("category", "UMUM");
			form.setFieldValue("isBroadcast", true);
		}
	}, [open, isAdmin, userPropertyId, form]);

	const assignedPropertyName =
		properties.find((p) => p.id === userPropertyId)?.name ||
		"Cabang Ditugaskan";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[580px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="event-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<Megaphone className="w-5 h-5 text-[#4f6958]" />
						Buat Broadcast Pengumuman Kos
					</DialogTitle>
					<DialogDescription
						id="event-dialog-description"
						className="text-xs text-[#737873] mt-1"
					>
						Kirim pesan pengumuman penting secara massal ke WhatsApp penghuni
						kos aktif.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-2"
				>
					{/* Judul Pengumuman */}
					<form.Field name="title">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Judul Pengumuman
								</Label>
								<Input
									placeholder="Contoh: Kerja Bakti Lingkungan, Perbaikan Toren Air"
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

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						{/* Target Kos (RBAC Enforced) */}
						<form.Field name="propertyId">
							{(field) => {
								const currentPropVal = field.state.value || "ALL";
								const selectedPropOption = propertyOptions.find(
									(opt) => opt.value === currentPropVal,
								);

								return (
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-[#252925] flex items-center justify-between">
											<span>Target Cabang Kos</span>
											{isAdmin && (
												<span className="text-[10px] font-normal text-[#99773d] flex items-center gap-1">
													<Lock className="w-3 h-3" />
													Terkunci (Admin)
												</span>
											)}
										</Label>
										{isAdmin ? (
											<div className="border border-[#e4e9e4] bg-[#f5f8f5] text-xs h-10 px-3 flex items-center rounded-md font-medium text-[#252925]">
												🏠 {assignedPropertyName}
											</div>
										) : (
											<Select
												value={currentPropVal}
												onValueChange={(val) => {
													if (val) field.handleChange(val);
												}}
											>
												<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
													<SelectValue placeholder="Pilih Target Kos">
														{selectedPropOption?.label}
													</SelectValue>
												</SelectTrigger>
												<SelectContent className="bg-white border-[#e4e9e4]">
													{propertyOptions.map((prop) => (
														<SelectItem
															key={prop.value}
															value={prop.value}
															className="text-xs"
														>
															{prop.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
								);
							}}
						</form.Field>

						{/* Kategori Pengumuman */}
						<form.Field name="category">
							{(field) => {
								const selectedCategoryOption = CATEGORY_OPTIONS.find(
									(opt) => opt.value === field.state.value,
								);

								return (
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-[#252925]">
											Kategori Pengumuman
										</Label>
										<Select
											value={field.state.value}
											onValueChange={(val) => {
												if (val)
													field.handleChange(val as AnnouncementCategory);
											}}
										>
											<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
												<SelectValue placeholder="Pilih Kategori">
													{selectedCategoryOption?.label}
												</SelectValue>
											</SelectTrigger>
											<SelectContent className="bg-white border-[#e4e9e4]">
												{CATEGORY_OPTIONS.map((opt) => (
													<SelectItem
														key={opt.value}
														value={opt.value}
														className="text-xs"
													>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								);
							}}
						</form.Field>
					</div>

					{/* Isi Pesan Pengumuman */}
					<form.Field name="content">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Isi Pesan Pengumuman (WhatsApp)
								</Label>
								<textarea
									rows={4}
									placeholder="Tuliskan isi pengumuman lengkap yang akan dibaca oleh anak kos..."
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full border border-[#e4e9e4] rounded-xl p-3 text-xs bg-[#fbfcfb] outline-none focus:border-[#8fa594] resize-vertical leading-relaxed"
								/>
								{field.state.meta.errors?.[0] && (
									<p className="text-[11px] text-[#a65f5b]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Checkbox Broadcast Langsung */}
					<form.Field name="isBroadcast">
						{(field) => (
							<div className="flex items-center gap-2.5 p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-xl">
								<Checkbox
									id="isBroadcast"
									checked={field.state.value}
									onCheckedChange={(checked) =>
										field.handleChange(Boolean(checked))
									}
								/>
								<label
									htmlFor="isBroadcast"
									className="text-xs text-[#252925] font-medium cursor-pointer"
								>
									Kirim pesan broadcast WhatsApp secara langsung ke seluruh
									nomor penghuni aktif via Fonnte Gateway.
								</label>
							</div>
						)}
					</form.Field>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
							disabled={isLoading}
						>
							{isLoading ? "Mengirim..." : "Kirim & Simpan Pengumuman"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
