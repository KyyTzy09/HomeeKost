import { useForm } from "@tanstack/react-form";
import { FileText } from "lucide-react";
import { useEffect } from "react";
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
import type {
	EngagementTemplateCategory,
	EngagementTemplateItem,
} from "../../common/types/index.ts";
import {
	type EngagementTemplateFormValues,
	engagementTemplateSchema,
} from "../../common/validations/index.ts";

interface EngagementTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingTemplate: EngagementTemplateItem | null;
	onSubmit: (values: EngagementTemplateFormValues) => void;
}

const TEMPLATE_CATEGORY_OPTIONS: {
	value: EngagementTemplateCategory;
	label: string;
	icon: string;
}[] = [
	{ value: "Sambutan", label: "Sambutan Penghuni Baru", icon: "👋" },
	{ value: "Pembayaran", label: "Apresiasi Bayar Tepat Waktu", icon: "💳" },
	{ value: "Ulang Tahun", label: "Ucapan Selamat Ulang Tahun", icon: "🎂" },
	{ value: "Umum", label: "Pengumuman Umum", icon: "📢" },
];

const getValidCategory = (cat?: string): EngagementTemplateCategory => {
	if (
		cat === "Sambutan" ||
		cat === "Pembayaran" ||
		cat === "Ulang Tahun" ||
		cat === "Umum"
	) {
		return cat;
	}
	return "Umum";
};

export function EngagementTemplateDialog({
	open,
	onOpenChange,
	editingTemplate,
	onSubmit,
}: EngagementTemplateDialogProps) {
	const form = useForm({
		defaultValues: {
			name: editingTemplate?.name || "",
			category: getValidCategory(editingTemplate?.category),
			content: editingTemplate?.content || "",
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = engagementTemplateSchema.safeParse(value);
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
				name: value.name,
				category: value.category,
				content: value.content,
			});
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			if (editingTemplate) {
				form.setFieldValue("name", editingTemplate.name);
				form.setFieldValue(
					"category",
					getValidCategory(editingTemplate.category),
				);
				form.setFieldValue("content", editingTemplate.content);
			} else {
				form.reset();
				form.setFieldValue("name", "");
				form.setFieldValue("category", "Umum");
				form.setFieldValue("content", "");
			}
		}
	}, [open, editingTemplate, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[560px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="template-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<FileText className="w-5 h-5 text-[#4f6958]" />
						{editingTemplate ? "Edit Template Pesan" : "Buat Template Pesan"}
					</DialogTitle>
					<DialogDescription
						id="template-dialog-description"
						className="text-xs text-[#737873] mt-1"
					>
						{editingTemplate
							? "Ubah nama atau isi template pesan engagement ini."
							: "Buat template pesan baru untuk engagement penghuni kos."}
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
					{/* Nama Template & Kategori */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						<form.Field name="name">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Nama Template
									</Label>
									<Input
										placeholder="Contoh: Welcome Tenant, Ucapan Ulang Tahun"
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

						<form.Field name="category">
							{(field) => {
								const selectedCategory = TEMPLATE_CATEGORY_OPTIONS.find(
									(opt) => opt.value === field.state.value,
								);

								return (
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-[#252925]">
											Kategori Template
										</Label>
										<Select
											value={field.state.value}
											onValueChange={(val) => {
												if (val)
													field.handleChange(val as EngagementTemplateCategory);
											}}
										>
											<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
												<SelectValue placeholder="Pilih Kategori">
													{selectedCategory ? (
														<span className="flex items-center gap-2">
															<span>{selectedCategory.icon}</span>
															<span>{selectedCategory.label}</span>
														</span>
													) : (
														"Pilih Kategori"
													)}
												</SelectValue>
											</SelectTrigger>
											<SelectContent className="bg-white border-[#e4e9e4]">
												{TEMPLATE_CATEGORY_OPTIONS.map((opt) => (
													<SelectItem
														key={opt.value}
														value={opt.value}
														className="text-xs"
													>
														<span className="flex items-center gap-2">
															<span>{opt.icon}</span>
															<span>{opt.label}</span>
														</span>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{field.state.meta.errors?.[0] && (
											<p className="text-[11px] text-[#a65f5b]">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								);
							}}
						</form.Field>
					</div>

					{/* Isi Pesan Template */}
					<form.Field name="content">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Isi Template Pesan
								</Label>
								<textarea
									rows={6}
									placeholder="Tulis draf pesan WhatsApp yang siap dikirim..."
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
							Simpan Template
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
