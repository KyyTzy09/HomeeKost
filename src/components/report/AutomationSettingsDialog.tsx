import { useForm } from "@tanstack/react-form";
import { Clock, Play, SlidersHorizontal } from "lucide-react";
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
	type AutomationSettingsFormValues,
	automationSettingsSchema,
} from "../../common/validations/index.ts";

interface AutomationSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialValues: AutomationSettingsFormValues;
	onSubmit: (values: AutomationSettingsFormValues) => void;
	onTestTrigger?: () => void;
	isTestingTrigger?: boolean;
}

export function AutomationSettingsDialog({
	open,
	onOpenChange,
	initialValues,
	onSubmit,
	onTestTrigger,
	isTestingTrigger = false,
}: AutomationSettingsDialogProps) {
	const form = useForm({
		defaultValues: {
			...initialValues,
			scheduleTime: initialValues.scheduleTime || "08:00",
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = automationSettingsSchema.safeParse(value);
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
			onSubmit(value as AutomationSettingsFormValues);
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			form.setFieldValue("scheduleDay", initialValues.scheduleDay);
			form.setFieldValue("scheduleTime", initialValues.scheduleTime || "08:00");
			form.setFieldValue("autoSendWhatsApp", initialValues.autoSendWhatsApp);
			form.setFieldValue("targetPhone", initialValues.targetPhone);
		}
	}, [open, initialValues, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[500px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="automation-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<SlidersHorizontal className="w-4 h-4 text-[#4f6958]" />
						Pengaturan Jadwal Automasi Laporan
					</DialogTitle>
					<DialogDescription
						id="automation-dialog-description"
						className="text-xs text-[#737873] mt-1"
					>
						Atur tanggal dan waktu pengiriman laporan operasional dan keuangan
						bulanan otomatis ke WhatsApp pengelola.
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
					{/* Jadwal Hari & Waktu Eksekusi */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<form.Field name="scheduleDay">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925] flex items-center gap-1.5">
										<Clock className="w-3.5 h-3.5 text-[#4f6958]" />
										Tanggal Pembuatan
									</Label>
									<div className="flex items-center gap-2">
										<span className="text-xs text-[#737873]">Tanggal</span>
										<Input
											type="number"
											min={1}
											max={28}
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(Number(e.target.value) || 1)
											}
											className="w-20 border-[#e4e9e4] text-xs h-9 bg-[#fbfcfb] text-center font-bold focus-visible:ring-[#8fa594]"
										/>
										<span className="text-xs text-[#737873]">tiap bulan</span>
									</div>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="scheduleTime">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Waktu Eksekusi
									</Label>
									<div className="flex items-center gap-2">
										<Input
											type="time"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="w-28 border-[#e4e9e4] text-xs h-9 bg-[#fbfcfb] text-center font-bold focus-visible:ring-[#8fa594]"
										/>
										<span className="text-xs text-[#737873]">WIB</span>
									</div>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</div>

					{/* Nomor WhatsApp Penerima */}
					<form.Field name="targetPhone">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Nomor WhatsApp Penerima Notifikasi Laporan
								</Label>
								<Input
									placeholder="Contoh: 081234567890"
									inputMode="tel"
									value={field.state.value}
									onChange={(e) => {
										const cleaned = e.target.value.replace(/[^0-9+]/g, "");
										field.handleChange(cleaned);
									}}
									className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
								/>
								<p className="text-[10.5px] text-[#737873]">
									Nomor tujuan pengiriman ringkasan eksekutif dan tautan dokumen
									laporan bulanan.
								</p>
								{field.state.meta.errors?.[0] && (
									<p className="text-[11px] text-[#a65f5b]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Checkbox Kirim WhatsApp Otomatis */}
					<form.Field name="autoSendWhatsApp">
						{(field) => (
							<div className="flex items-start gap-2.5 p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-xl">
								<Checkbox
									id="autoSendWhatsApp"
									checked={field.state.value}
									onCheckedChange={(checked) =>
										field.handleChange(Boolean(checked))
									}
									className="mt-0.5"
								/>
								<label
									htmlFor="autoSendWhatsApp"
									className="text-xs text-[#252925] font-medium leading-relaxed cursor-pointer"
								>
									Kirim ringkasan laporan bulanan otomatis via WhatsApp ke nomor
									di atas begitu jadwal rekapitulasi selesai dieksekusi.
								</label>
							</div>
						)}
					</form.Field>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-between gap-2">
						{onTestTrigger ? (
							<Button
								type="button"
								variant="outline"
								className="border-[#cfdfd1] text-[#4f6958] hover:bg-[#e8f2ea] text-xs font-semibold px-3 h-9 flex items-center gap-1.5 cursor-pointer"
								onClick={onTestTrigger}
								disabled={isTestingTrigger}
							>
								<Play className="w-3.5 h-3.5" />
								{isTestingTrigger ? "Menjalankan..." : "Test Trigger Cron"}
							</Button>
						) : (
							<div />
						)}
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 cursor-pointer"
								onClick={() => onOpenChange(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9 cursor-pointer"
							>
								Simpan Pengaturan
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
