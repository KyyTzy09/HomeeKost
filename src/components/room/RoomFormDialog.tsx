import { useForm } from "@tanstack/react-form";
import { BedDouble } from "lucide-react";
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
	RoomItem,
	RoomStatus,
	RoomType,
} from "../../common/types/index.ts";
import {
	type RoomFormValues,
	roomSchema,
} from "../../common/validations/index.ts";

interface RoomFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	propertyName: string;
	editingRoom: RoomItem | null;
	onSubmit: (values: RoomFormValues) => void;
}

export function RoomFormDialog({
	open,
	onOpenChange,
	propertyName,
	editingRoom,
	onSubmit,
}: RoomFormDialogProps) {
	const form = useForm({
		defaultValues: {
			roomNo: editingRoom?.roomNo ?? "",
			type: (editingRoom?.type ?? "Standard") as RoomType,
			price: editingRoom?.price ?? "Rp850.000",
			status: (editingRoom?.status ?? "Kosong") as RoomStatus,
			facilities: editingRoom?.facilities ?? "Kamar mandi dalam · Wi-Fi",
		},
		onSubmit: async ({ value }) => {
			const result = roomSchema.safeParse(value);
			if (!result.success) return;
			onSubmit(result.data);
			onOpenChange(false);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[540px] rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader>
					<div className="flex items-center gap-2.5 mb-1">
						<div className="w-8 h-8 rounded-[9px] bg-[#edf4ee] text-[#4f6958] flex items-center justify-center">
							<BedDouble className="w-4 h-4" />
						</div>
						<div>
							<DialogTitle className="text-[18px] font-bold text-[#29382e]">
								{editingRoom ? "Edit Kamar" : "Tambah Kamar"}
							</DialogTitle>
							<DialogDescription className="text-[11px] text-[#8a958d]">
								{editingRoom
									? `Perbarui data kamar ${editingRoom.roomNo}`
									: "Tambahkan kamar baru ke properti yang sedang dipilih."}
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
					className="space-y-3.5"
				>
					<div className="grid grid-cols-2 gap-3">
						{/* Room No */}
						<form.Field
							name="roomNo"
							validators={{
								onChange: ({ value }) =>
									!value ? "Nomor kamar wajib diisi" : undefined,
							}}
						>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;
								return (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Nomor Kamar <span className="text-[#b66b68]">*</span>
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Contoh: A-09"
											className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] transition-all duration-150 ${
												hasError
													? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
													: "border-[#dfe7e0] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
											}`}
										/>
										{hasError && (
											<p className="text-[10.5px] text-[#b66b68] font-medium pt-0.5">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								);
							}}
						</form.Field>

						{/* Type */}
						<form.Field name="type">
							{(field) => (
								<div className="space-y-1">
									<Label className="text-[11px] font-bold text-[#506257]">
										Tipe Kamar <span className="text-[#b66b68]">*</span>
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => field.handleChange(val as RoomType)}
									>
										<SelectTrigger className="h-[41px] border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]">
											<SelectValue placeholder="Pilih Tipe" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Standard">Standard</SelectItem>
											<SelectItem value="Deluxe">Deluxe</SelectItem>
											<SelectItem value="Suite">Suite</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Price */}
						<form.Field
							name="price"
							validators={{
								onChange: ({ value }) =>
									!value ? "Harga sewa wajib diisi" : undefined,
							}}
						>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;
								return (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Harga Sewa / Bulan{" "}
											<span className="text-[#b66b68]">*</span>
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Rp850.000"
											className={`h-[41px] border rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] transition-all duration-150 ${
												hasError
													? "border-[#b66b68] focus-visible:ring-[#b66b68]/20"
													: "border-[#dfe7e0] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
											}`}
										/>
										{hasError && (
											<p className="text-[10.5px] text-[#b66b68] font-medium pt-0.5">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								);
							}}
						</form.Field>

						{/* Status */}
						<form.Field name="status">
							{(field) => (
								<div className="space-y-1">
									<Label className="text-[11px] font-bold text-[#506257]">
										Status <span className="text-[#b66b68]">*</span>
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) =>
											field.handleChange(val as RoomStatus)
										}
									>
										<SelectTrigger className="h-[41px] border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925]">
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Kosong">Kosong</SelectItem>
											<SelectItem value="Terisi">Terisi</SelectItem>
											<SelectItem value="Maintenance">Maintenance</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Facilities */}
						<div className="col-span-2">
							<form.Field name="facilities">
								{(field) => (
									<div className="space-y-1">
										<Label className="text-[11px] font-bold text-[#506257]">
											Fasilitas
										</Label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Contoh: Kamar mandi dalam · Wi-Fi · AC"
											className="h-[41px] border-[#dfe7e0] rounded-[11px] px-3 text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
										/>
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
									{editingRoom ? "Simpan Perubahan" : "Simpan Kamar"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
