import { useForm } from "@tanstack/react-form";
import { Building2, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
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
	type PropertyFormValues,
	propertySchema,
} from "../../common/validations/property.schema.ts";
import { useUploadImage } from "../../hooks/index.ts";
import type { PropertyItem } from "./PropertyCard.tsx";

interface PropertyFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingProperty: PropertyItem | null;
	onSubmit: (values: PropertyFormValues, imageUrl: string | null) => void;
}

export function PropertyFormDialog({
	open,
	onOpenChange,
	editingProperty,
	onSubmit,
}: PropertyFormDialogProps) {
	const uploadImageMutation = useUploadImage();

	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
		editingProperty?.imageUrl ?? null,
	);
	const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(
		null,
	);
	const [isSubmittingWithUpload, setIsSubmittingWithUpload] =
		useState<boolean>(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: editingProperty?.name ?? "",
			address: editingProperty?.address ?? "",
			description: editingProperty?.description ?? "",
			bankAccountInfo: editingProperty?.bankAccountInfo ?? "",
			imageUrl: editingProperty?.imageUrl ?? "",
			totalRooms: editingProperty?.rooms ?? 0,
		},
		onSubmit: async ({ value }) => {
			const result = propertySchema.safeParse(value);
			if (!result.success) {
				const errorMessages = result.error.issues
					.map((i) => i.message)
					.join(", ");
				setUploadError(`Validasi gagal: ${errorMessages}`);
				return;
			}

			let finalImageUrl = editingProperty?.imageUrl || null;

			// If a new local file was selected, upload it to storage first
			if (selectedFileDataUrl) {
				setIsSubmittingWithUpload(true);
				setUploadError(null);
				try {
					const uploadRes = await uploadImageMutation.mutateAsync({
						dataUrl: selectedFileDataUrl,
						folder: "homeekost/properties",
						filename: `prop-${value.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
					});
					finalImageUrl = uploadRes.url;
				} catch (err) {
					console.error("Gagal mengupload gambar:", err);
					setUploadError(
						err instanceof Error
							? err.message
							: "Gagal mengupload gambar ke storage",
					);
					setIsSubmittingWithUpload(false);
					return;
				} finally {
					setIsSubmittingWithUpload(false);
				}
			} else if (imagePreviewUrl === null) {
				// User explicitly removed the image
				finalImageUrl = null;
			}

			onSubmit(
				{
					...result.data,
					imageUrl: finalImageUrl || "",
				},
				finalImageUrl,
			);
			setSelectedFileDataUrl(null);
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			if (editingProperty) {
				form.setFieldValue("name", editingProperty.name || "");
				form.setFieldValue("address", editingProperty.address || "");
				form.setFieldValue("description", editingProperty.description || "");
				form.setFieldValue(
					"bankAccountInfo",
					editingProperty.bankAccountInfo || "",
				);
				form.setFieldValue("imageUrl", editingProperty.imageUrl || "");
				form.setFieldValue("totalRooms", editingProperty.rooms ?? 0);
				setImagePreviewUrl(editingProperty.imageUrl || null);
			} else {
				form.reset();
				setImagePreviewUrl(null);
			}
			setSelectedFileDataUrl(null);
			setUploadError(null);
		}
	}, [open, editingProperty]);

	const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				const url = reader.result as string;
				setImagePreviewUrl(url);
				setSelectedFileDataUrl(url);
				setUploadError(null);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setImagePreviewUrl(null);
		setSelectedFileDataUrl(null);
		form.setFieldValue("imageUrl", "");
	};

	const isProcessing = isSubmittingWithUpload || uploadImageMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[520px] rounded-[20px] border-[#e1e8e2] bg-white p-6 shadow-[0_25px_80px_rgba(25,40,30,0.18)]">
				<DialogHeader className="gap-1 mb-2">
					<DialogTitle className="text-[18px] font-bold text-[#29382e]">
						{editingProperty ? "Edit Properti Kos" : "Tambah Kos Baru"}
					</DialogTitle>
					<DialogDescription className="text-[11.5px] text-[#8a958d]">
						{editingProperty
							? "Perbarui rincian operasional dan identitas cabang kos."
							: "Tambahkan properti baru untuk dikelola di HomeeKost."}
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-1"
				>
					{/* Field: Nama Kos */}
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) =>
								!value || value.trim().length < 2
									? "Nama properti kos minimal 2 karakter"
									: undefined,
						}}
					>
						{(field) => (
							<div>
								<Label
									htmlFor={field.name}
									className="block text-[11px] font-bold text-[#506257] mb-[6px]"
								>
									Nama Kos <span className="text-[#b66b68]">*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: Kos D"
									className="h-[43px] border-[#dfe7e0] rounded-[11px] px-[13px] text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[10.5px] text-[#b66b68] mt-1 font-medium">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Field: Alamat Lengkap */}
					<form.Field
						name="address"
						validators={{
							onChange: ({ value }) =>
								!value || value.trim().length < 5
									? "Alamat kos minimal 5 karakter"
									: undefined,
						}}
					>
						{(field) => (
							<div>
								<Label
									htmlFor={field.name}
									className="block text-[11px] font-bold text-[#506257] mb-[6px]"
								>
									Alamat Kos <span className="text-[#b66b68]">*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Jl. Kaliurang KM 5.2, Sleman, Yogyakarta"
									className="h-[43px] border-[#dfe7e0] rounded-[11px] px-[13px] text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[10.5px] text-[#b66b68] mt-1 font-medium">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Field: Deskripsi Fasilitas */}
					<form.Field name="description">
						{(field) => (
							<div>
								<Label
									htmlFor={field.name}
									className="block text-[11px] font-bold text-[#506257] mb-[6px]"
								>
									Deskripsi / Fasilitas Tambahan
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: AC, Wifi 100Mbps, Kamar Mandi Dalam, CCTV 24 Jam"
									className="h-[43px] border-[#dfe7e0] rounded-[11px] px-[13px] text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
								/>
							</div>
						)}
					</form.Field>

					{/* Field: Informasi Rekening Pembayaran */}
					<form.Field name="bankAccountInfo">
						{(field) => (
							<div>
								<Label
									htmlFor={field.name}
									className="block text-[11px] font-bold text-[#506257] mb-[6px]"
								>
									Informasi Rekening Pembayaran (Bank / E-Wallet)
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: BCA 8735081290 a.n. Bude Frisda"
									className="h-[43px] border-[#dfe7e0] rounded-[11px] px-[13px] text-[12px] bg-[#fbfcfb] text-[#252925] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
								/>
								<p className="text-[10.5px] text-[#737873] mt-1">
									Nomor rekening ini akan otomatis tercantum pada pesan WhatsApp tagihan dan invoice digital anak kos di cabang ini.
								</p>
							</div>
						)}
					</form.Field>

					{/* Field: Logo / Gambar Kos */}
					<div>
						<Label className="block text-[11px] font-bold text-[#506257] mb-[6px]">
							Logo / Gambar Kos
						</Label>
						<div className="border border-dashed border-[#b8c8ba] rounded-[14px] p-3 bg-[#f8fbf8]">
							<div className="flex items-start gap-3">
								<div className="w-16 h-16 rounded-[13px] overflow-hidden bg-[#edf4ee] flex items-center justify-center text-[#718078] text-[11px] font-bold shrink-0 border border-[#e1e8e2]">
									{imagePreviewUrl ? (
										<img
											src={imagePreviewUrl}
											alt="Preview"
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="flex flex-col items-center gap-0.5">
											<Building2 className="w-4 h-4 text-[#55705d]" />
											<span className="text-[9px]">Logo</span>
										</span>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<input
										id="propertyImageInput"
										type="file"
										accept="image/*"
										onChange={handleImageFileChange}
										className="hidden"
									/>
									<div className="flex items-center gap-2 flex-wrap">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												document.getElementById("propertyImageInput")?.click()
											}
											className="h-[32px] px-3 text-[11px] font-semibold rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] hover:bg-[#f3f7f3] gap-1.5"
										>
											<Upload className="w-3 h-3 text-[#4f6958]" />
											Pilih Gambar
										</Button>
										{imagePreviewUrl && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={handleRemoveImage}
												className="h-[32px] px-2.5 text-[11px] font-medium text-[#a65f5b] hover:bg-[#fff5f3]"
											>
												Hapus
											</Button>
										)}
									</div>
									<p className="text-[10px] text-[#8a958d] mt-1.5 m-0 leading-tight">
										Gunakan gambar/logo kos (format PNG, JPG, WebP). Otomatis
										diunggah ke storage cloud.
									</p>
								</div>
							</div>
						</div>
						{uploadError && (
							<p className="text-[10.5px] text-[#b66b68] mt-1 font-medium">
								{uploadError}
							</p>
						)}
					</div>

					{/* Footer */}
					<DialogFooter className="pt-3 border-t border-[#edf1ed] mt-5 gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isProcessing}
							className="h-[38px] px-4 text-xs font-semibold rounded-[8px] border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3]"
						>
							Batal
						</Button>
						<Button
							type="submit"
							disabled={isProcessing}
							className="h-[38px] px-5 text-xs font-bold rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white transition-colors flex items-center gap-1.5"
						>
							{isProcessing ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Mengunggah...</span>
								</>
							) : editingProperty ? (
								"Simpan Perubahan"
							) : (
								"Tambah Kos"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
