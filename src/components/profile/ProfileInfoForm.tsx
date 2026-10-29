import { useForm } from "@tanstack/react-form";
import { KeyRound, Loader2, Save, User } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import { Label } from "../../common/shadcn/label.tsx";
import type { UserProfileDetail } from "../../common/types/index.ts";
import {
	type ProfileUpdateFormValues,
	profileUpdateSchema,
} from "../../common/validations/index.ts";

interface ProfileInfoFormProps {
	profile: UserProfileDetail;
	onSubmit: (values: ProfileUpdateFormValues) => Promise<void>;
	onOpenSecurityDialog: () => void;
	isSubmitting: boolean;
}

export function ProfileInfoForm({
	profile,
	onSubmit,
	onOpenSecurityDialog,
	isSubmitting,
}: ProfileInfoFormProps) {
	const form = useForm({
		defaultValues: {
			name: profile.name || "",
			email: profile.email || "",
			phoneNumber: profile.phoneNumber || "",
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = profileUpdateSchema.safeParse(value);
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
		onSubmit: async ({ value }) => {
			await onSubmit(value as ProfileUpdateFormValues);
		},
	});

	useEffect(() => {
		form.reset({
			name: profile.name || "",
			email: profile.email || "",
			phoneNumber: profile.phoneNumber || "",
		});
	}, [profile, form.reset]);

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			<div className="pb-3 mb-4 border-b border-[#e4e9e4]">
				<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
					<User className="w-4 h-4 text-[#4f6958]" />
					Informasi Akun
				</h2>
				<p className="text-[11px] text-[#737873] mt-0.5">
					Data profil ini dapat Anda perbarui kapan saja.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				{/* Nama Lengkap */}
				<form.Field name="name">
					{(field) => (
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-[#252925]">
								Nama Lengkap
							</Label>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Masukkan nama lengkap Anda"
								className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594]"
							/>
							{field.state.meta.errors.length > 0 && (
								<p className="text-[11px] text-[#b66b68] mt-1 font-medium">
									{String(field.state.meta.errors[0])}
								</p>
							)}
						</div>
					)}
				</form.Field>

				{/* Email Akun */}
				<form.Field name="email">
					{(field) => (
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-[#252925]">
								Alamat Email
							</Label>
							<Input
								type="email"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="contoh@homeekost.id"
								className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594]"
							/>
							{field.state.meta.errors.length > 0 && (
								<p className="text-[11px] text-[#b66b68] mt-1 font-medium">
									{String(field.state.meta.errors[0])}
								</p>
							)}
						</div>
					)}
				</form.Field>

				{/* Nomor WhatsApp */}
				<form.Field name="phoneNumber">
					{(field) => (
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-[#252925]">
								Nomor WhatsApp
							</Label>
							<Input
								type="tel"
								inputMode="tel"
								value={field.state.value}
								onChange={(e) => {
									const sanitized = e.target.value.replace(/[^0-9+]/g, "");
									field.handleChange(sanitized);
								}}
								placeholder="08xxxxxxxxxx"
								className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594]"
							/>
							{field.state.meta.errors.length > 0 && (
								<p className="text-[11px] text-[#b66b68] mt-1 font-medium">
									{String(field.state.meta.errors[0])}
								</p>
							)}
						</div>
					)}
				</form.Field>

				{/* Form Actions */}
				<div className="pt-4 mt-6 border-t border-[#edf1ed] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<Button
						type="button"
						variant="outline"
						className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 shadow-2xs"
						onClick={onOpenSecurityDialog}
					>
						<KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#4f6958]" />
						Pengaturan Keamanan
					</Button>

					<Button
						type="submit"
						disabled={isSubmitting}
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer"
					>
						{isSubmitting ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Save className="w-3.5 h-3.5" />
						)}
						{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
					</Button>
				</div>
			</form>
		</Card>
	);
}
