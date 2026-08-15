import { useForm } from "@tanstack/react-form";
import { Share2 } from "lucide-react";
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
import type { SharedCostItem } from "../../common/types/index.ts";
import {
	type AllocationFormValues,
	allocationSchema,
} from "../../common/validations/index.ts";

interface AllocationFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingSharedCost: SharedCostItem | null;
	onSubmit: (values: AllocationFormValues) => void;
}

export const AVAILABLE_PROPERTIES = ["Kos A", "Kos B", "Kos C"];

export function AllocationFormDialog({
	open,
	onOpenChange,
	editingSharedCost,
	onSubmit,
}: AllocationFormDialogProps) {
	const form = useForm({
		defaultValues: {
			description: editingSharedCost?.description || "",
			amount: editingSharedCost?.amount || 0,
			split: editingSharedCost?.split || "Rata per kos",
			props: editingSharedCost?.props || ["Kos A", "Kos B", "Kos C"],
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = allocationSchema.safeParse(value);
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
			onSubmit(value as AllocationFormValues);
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			if (editingSharedCost) {
				form.setFieldValue("description", editingSharedCost.description);
				form.setFieldValue("amount", editingSharedCost.amount);
				form.setFieldValue("split", editingSharedCost.split);
				form.setFieldValue("props", editingSharedCost.props);
			} else {
				form.reset();
				form.setFieldValue("description", "");
				form.setFieldValue("amount", 0);
				form.setFieldValue("split", "Rata per kos");
				form.setFieldValue("props", ["Kos A", "Kos B", "Kos C"]);
			}
		}
	}, [open, editingSharedCost, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[560px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="allocation-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4] flex flex-row items-start justify-between">
					<div>
						<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
							<Share2 className="w-5 h-5 text-[#4f6958]" />
							{editingSharedCost ? "Edit Biaya Bersama" : "Atur Biaya Bersama"}
						</DialogTitle>
						<DialogDescription
							id="allocation-dialog-description"
							className="text-xs text-[#737873] mt-1"
						>
							Tentukan kos yang menggunakan biaya ini dan metode pembagiannya.
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
					{/* Keterangan */}
					<form.Field name="description">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Keterangan
								</Label>
								<Input
									placeholder="Contoh: Abonemen WiFi, Gaji Penjaga, Sampah"
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
						{/* Nominal Total (Strict Numeric Input) */}
						<form.Field name="amount">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Nominal Total (Rp)
									</Label>
									<Input
										type="text"
										inputMode="numeric"
										placeholder="777000"
										value={
											field.state.value
												? field.state.value.toLocaleString("id-ID")
												: ""
										}
										onKeyDown={(e) => {
											// Allow control keys, prevent letters
											if (
												!/[0-9]/.test(e.key) &&
												![
													"Backspace",
													"Delete",
													"Tab",
													"ArrowLeft",
													"ArrowRight",
													"Enter",
													"Home",
													"End",
												].includes(e.key) &&
												!e.ctrlKey &&
												!e.metaKey
											) {
												e.preventDefault();
											}
										}}
										onChange={(e) => {
											const digits = e.target.value.replace(/\D/g, "");
											field.handleChange(Number(digits) || 0);
										}}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] font-semibold text-right focus-visible:ring-[#8fa594]"
									/>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Metode Pembagian */}
						<form.Field name="split">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Metode Pembagian
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Metode" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											<SelectItem value="Rata per kos" className="text-xs">
												Rata per kos
											</SelectItem>
											<SelectItem value="Manual per kos" className="text-xs">
												Manual per kos
											</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors?.[0] && (
										<p className="text-[11px] text-[#a65f5b]">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</div>

					{/* Kos yang Menggunakan Checkboxes */}
					<form.Field name="props">
						{(field) => (
							<div className="space-y-2">
								<Label className="text-xs font-semibold text-[#252925] block">
									Kos yang menggunakan
								</Label>
								<div className="flex flex-wrap gap-4 p-3 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
									{AVAILABLE_PROPERTIES.map((prop) => {
										const isChecked = field.state.value.includes(prop);
										return (
											<label
												key={prop}
												className="flex items-center gap-2 cursor-pointer text-xs text-[#252925]"
											>
												<Checkbox
													checked={isChecked}
													onCheckedChange={(checked) => {
														if (checked) {
															field.handleChange([...field.state.value, prop]);
														} else {
															field.handleChange(
																field.state.value.filter((p) => p !== prop),
															);
														}
													}}
												/>
												<span className="font-medium">{prop}</span>
											</label>
										);
									})}
								</div>
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
							Simpan Alokasi
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
