import { useForm } from "@tanstack/react-form";
import { Bot } from "lucide-react";
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
import {
	type AutomationSettingsFormValues,
	automationSettingsSchema,
} from "../../common/validations/index.ts";

interface AutomationSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialValues: AutomationSettingsFormValues;
	onSubmit: (values: AutomationSettingsFormValues) => void;
}

export function AutomationSettingsDialog({
	open,
	onOpenChange,
	initialValues,
	onSubmit,
}: AutomationSettingsDialogProps) {
	const form = useForm({
		defaultValues: initialValues,
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
			form.setFieldValue("aiModel", initialValues.aiModel);
			form.setFieldValue("autoSendWhatsApp", initialValues.autoSendWhatsApp);
			form.setFieldValue("targetPhone", initialValues.targetPhone);
		}
	}, [open, initialValues, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[520px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="automation-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<Bot className="w-5 h-5 text-[#4f6958]" />
						Pengaturan Automasi Laporan AI
					</DialogTitle>
					<DialogDescription
						id="automation-dialog-description"
						className="text-xs text-[#737873] mt-1"
					>
						Konfigurasi jadwal pembuatan laporan eksekutif bulanan dan model AI
						analisis.
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
					{/* Hari Jadwal Eksekusi */}
					<form.Field name="scheduleDay">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Tanggal Pembuatan Otomatis
								</Label>
								<div className="flex items-center gap-2">
									<span className="text-xs text-[#737873]">Setiap tanggal</span>
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
									<span className="text-xs text-[#737873]">
										pukul 08:00 WIB (awal bulan)
									</span>
								</div>
								{field.state.meta.errors?.[0] && (
									<p className="text-[11px] text-[#a65f5b]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Model AI LLM */}
					<form.Field name="aiModel">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Engine AI Analysis
								</Label>
								<Select
									value={field.state.value}
									onValueChange={(val) => {
										if (val)
											field.handleChange(
												val as "gemini-1.5-flash" | "llama-3.3-70b-versatile",
											);
									}}
								>
									<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
										<SelectValue placeholder="Pilih Engine AI" />
									</SelectTrigger>
									<SelectContent className="bg-white border-[#e4e9e4]">
										<SelectItem value="gemini-1.5-flash" className="text-xs">
											Google Gemini 1.5 Flash (Cepat & Akurat)
										</SelectItem>
										<SelectItem
											value="llama-3.3-70b-versatile"
											className="text-xs"
										>
											Groq Cloud LLaMA 3.3 70B (High Speed LLM)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					{/* Nomor WhatsApp Penerima */}
					<form.Field name="targetPhone">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Nomor WhatsApp Penerima Notifikasi Laporan
								</Label>
								<Input
									placeholder="081234567890"
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

					{/* Checkbox Kirim Otomatis */}
					<form.Field name="autoSendWhatsApp">
						{(field) => (
							<div className="flex items-center gap-2 p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-xl">
								<Checkbox
									id="autoSendWhatsApp"
									checked={field.state.value}
									onCheckedChange={(checked) =>
										field.handleChange(Boolean(checked))
									}
								/>
								<label
									htmlFor="autoSendWhatsApp"
									className="text-xs text-[#252925] font-medium cursor-pointer"
								>
									Kirimkan ringkasan PDF laporan bulanan ke WhatsApp Owner
									secara otomatis setelah digenerate.
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
							Simpan Pengaturan
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
