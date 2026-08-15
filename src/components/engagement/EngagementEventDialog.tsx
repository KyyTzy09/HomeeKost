import { useForm } from "@tanstack/react-form";
import { Megaphone } from "lucide-react";
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
	type EngagementEventFormValues,
	engagementEventSchema,
} from "../../common/validations/index.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";

interface EngagementEventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: EngagementEventFormValues) => void;
}

export function EngagementEventDialog({
	open,
	onOpenChange,
	onSubmit,
}: EngagementEventDialogProps) {
	const todayStr = getTodayDateString();

	const form = useForm({
		defaultValues: {
			title: "",
			property: "Semua Kost",
			category: "UMUM" as AnnouncementCategory,
			date: todayStr,
			reminder: "1 hari sebelumnya",
			content: "",
			isBroadcast: true,
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = engagementEventSchema.safeParse(value);
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
			onSubmit(value as EngagementEventFormValues);
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			form.reset();
			form.setFieldValue("date", todayStr);
			form.setFieldValue("property", "Semua Kost");
			form.setFieldValue("category", "UMUM");
			form.setFieldValue("reminder", "1 hari sebelumnya");
			form.setFieldValue("isBroadcast", true);
		}
	}, [open, todayStr, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[600px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="event-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<Megaphone className="w-5 h-5 text-[#4f6958]" />
						Tambah Acara & Pengumuman Kos
					</DialogTitle>
					<DialogDescription
						id="event-dialog-description"
						className="text-xs text-[#737873] mt-1"
					>
						Atur agenda acara atau pengumuman penting untuk penghuni kos.
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
					{/* Nama Acara / Judul */}
					<form.Field name="title">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Nama Acara / Judul Pengumuman
								</Label>
								<Input
									placeholder="Contoh: Kerja Bakti Bulanan, Pembersihan Toren Air"
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
						{/* Target Kos */}
						<form.Field name="property">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Target Kos
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Properti" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											{["Semua Kost", "Kos A", "Kos B", "Kos C"].map((prop) => (
												<SelectItem key={prop} value={prop} className="text-xs">
													{prop}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Kategori Pengumuman */}
						<form.Field name="category">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Kategori
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val as AnnouncementCategory);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Kategori" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											<SelectItem value="UMUM" className="text-xs">
												Umum
											</SelectItem>
											<SelectItem value="KERJA_BAKTI" className="text-xs">
												Kerja Bakti
											</SelectItem>
											<SelectItem value="MAINTENANCE" className="text-xs">
												Maintenance
											</SelectItem>
											<SelectItem value="ACARA" className="text-xs">
												Acara Kos
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Tanggal Pelaksanaan */}
						<form.Field name="date">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Tanggal Pelaksanaan
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

						{/* Waktu Pengingat */}
						<form.Field name="reminder">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Waktu Pengingat
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Waktu" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											<SelectItem value="1 hari sebelumnya" className="text-xs">
												1 hari sebelumnya
											</SelectItem>
											<SelectItem value="3 hari sebelumnya" className="text-xs">
												3 hari sebelumnya
											</SelectItem>
											<SelectItem value="7 hari sebelumnya" className="text-xs">
												7 hari sebelumnya
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>
					</div>

					{/* Isi Catatan / Pengumuman */}
					<form.Field name="content">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Isi Pengumuman / Pesan WhatsApp
								</Label>
								<textarea
									rows={4}
									placeholder="Tulis pesan lengkap yang akan dibroadcast ke seluruh penghuni..."
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full border border-[#e4e9e4] rounded-xl p-3 text-xs bg-[#fbfcfb] outline-none focus:border-[#8fa594] resize-vertical"
								/>
								{field.state.meta.errors?.[0] && (
									<p className="text-[11px] text-[#a65f5b]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Broadcast WhatsApp Checkbox */}
					<form.Field name="isBroadcast">
						{(field) => (
							<div className="flex items-center gap-2 p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-xl">
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
									Kirim broadcast WhatsApp ke seluruh penghuni kos aktif secara
									otomatis via Fonnte Gateway.
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
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9"
						>
							Simpan Pengingat
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
