import { useForm } from "@tanstack/react-form";
import { KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
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
	type ChangePasswordFormValues,
	changePasswordSchema,
} from "../../common/validations/index.ts";

interface SecuritySettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
	isSubmitting: boolean;
}

export function SecuritySettingsDialog({
	open,
	onOpenChange,
	onSubmit,
	isSubmitting,
}: SecuritySettingsDialogProps) {
	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmNewPassword: "",
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = changePasswordSchema.safeParse(value);
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
			await onSubmit(value as ChangePasswordFormValues);
			form.reset();
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form.reset]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[440px] bg-white border-[#e4e9e4] p-6 shadow-xl rounded-2xl">
				<DialogHeader className="pb-3 border-b border-[#e4e9e4]">
					<DialogTitle className="text-base font-bold text-[#252925] flex items-center gap-2">
						<ShieldCheck className="w-5 h-5 text-[#4f6958]" />
						Pengaturan Keamanan & Password
					</DialogTitle>
					<DialogDescription className="text-xs text-[#737873] mt-1 leading-relaxed">
						Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan
						akses sistem HomeeKost.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-3"
				>
					{/* Password Saat Ini */}
					<form.Field name="currentPassword">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Password Saat Ini
								</Label>
								<div className="relative">
									<Input
										type="password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Masukkan password saat ini"
										className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594] pl-9"
									/>
									<Lock className="w-4 h-4 text-[#8a958d] absolute left-3 top-3" />
								</div>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[11px] text-[#b66b68] mt-1 font-medium">
										{String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Password Baru */}
					<form.Field name="newPassword">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Password Baru
								</Label>
								<div className="relative">
									<Input
										type="password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Minimal 8 karakter"
										className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594] pl-9"
									/>
									<KeyRound className="w-4 h-4 text-[#8a958d] absolute left-3 top-3" />
								</div>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[11px] text-[#b66b68] mt-1 font-medium">
										{String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Konfirmasi Password Baru */}
					<form.Field name="confirmNewPassword">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Konfirmasi Password Baru
								</Label>
								<div className="relative">
									<Input
										type="password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Ketik ulang password baru"
										className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594] pl-9"
									/>
									<KeyRound className="w-4 h-4 text-[#8a958d] absolute left-3 top-3" />
								</div>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[11px] text-[#b66b68] mt-1 font-medium">
										{String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<DialogFooter className="pt-4 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 shadow-2xs"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer"
						>
							{isSubmitting ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<ShieldCheck className="w-3.5 h-3.5" />
							)}
							{isSubmitting ? "Menyimpan..." : "Update Password"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
