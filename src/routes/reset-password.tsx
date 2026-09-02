import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	Lock,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../common/shadcn/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../common/shadcn/card.tsx";
import { Input } from "../common/shadcn/input.tsx";
import { Label } from "../common/shadcn/label.tsx";
import {
	getDashboardContextServerFn,
	resetPasswordWithTokenServerFn,
} from "../data/servers/index.ts";

const resetPasswordSearchSchema = z.object({
	token: z.string().optional().default(""),
	email: z.string().optional().default(""),
});

export const Route = createFileRoute("/reset-password")({
	validateSearch: (search) => resetPasswordSearchSchema.parse(search),
	beforeLoad: async () => {
		const context = await getDashboardContextServerFn();
		if (context) {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({
		meta: [
			{
				title: "Buat Kata Sandi Baru — Sistem Pengelolaan Kos",
			},
		],
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const search = Route.useSearch();
	const token = search.token;
	const email = search.email;

	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			setErrorMsg(null);

			if (!token || !email) {
				setErrorMsg(
					"Tautan pemulihan kata sandi tidak valid atau tidak memiliki token verifikasi.",
				);
				return;
			}

			if (value.newPassword.length < 8) {
				setErrorMsg("Kata sandi baru minimal 8 karakter.");
				return;
			}

			if (value.newPassword !== value.confirmPassword) {
				setErrorMsg("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
				return;
			}

			setIsLoading(true);

			try {
				const res = await resetPasswordWithTokenServerFn({
					data: {
						email,
						token,
						newPassword: value.newPassword,
					},
				});

				setSuccessMsg(res.message);
				setIsLoading(false);
			} catch (err: unknown) {
				const message =
					err instanceof Error
						? err.message
						: "Gagal mengatur ulang kata sandi.";
				setErrorMsg(message);
				setIsLoading(false);
			}
		},
	});

	return (
		<div className="fixed inset-0 min-h-screen bg-[#f5f8f5] z-50 flex items-center justify-center p-6">
			<Card className="w-full max-w-[430px] bg-white border-[#e2e9e3] rounded-[24px] p-[32px] shadow-[0_20px_60px_rgba(47,69,55,0.10)] ring-0">
				<CardHeader className="p-0 text-center mb-6">
					<div className="w-14 h-14 rounded-2xl bg-[#edf5ee] border border-[#d2e2d5] text-[#4f6958] flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_16px_rgba(79,105,88,0.10)]">
						{successMsg ? (
							<CheckCircle2 className="w-7 h-7 text-[#3e724d]" />
						) : (
							<KeyRound className="w-7 h-7" />
						)}
					</div>
					<CardTitle className="text-[22px] font-bold text-[#26372c] leading-[1.2]">
						{successMsg ? "Kata Sandi Diperbarui" : "Atur Kata Sandi Baru"}
					</CardTitle>
					<CardDescription className="text-center text-[#7b897e] text-[13px] mt-1">
						{successMsg
							? "Akun Anda telah berhasil diamankan."
							: email
								? `Buat kata sandi baru untuk akun ${email}`
								: "Masukkan kata sandi baru untuk akun Anda."}
					</CardDescription>
				</CardHeader>

				<CardContent className="p-0">
					{/* Error Alert Box */}
					{errorMsg && (
						<div
							className="bg-[#f7e9e8] border border-[#efd4d0] text-[#a65f5b] rounded-[10px] py-2.5 px-3.5 text-[11px] mb-4 text-center font-medium leading-relaxed"
							role="alert"
						>
							{errorMsg}
						</div>
					)}

					{successMsg ? (
						<div className="space-y-4">
							<div className="bg-[#edf5ee] border border-[#cbe0ce] rounded-xl p-4 text-center space-y-2">
								<p className="text-[12px] text-[#4c5c50] leading-relaxed">
									{successMsg}
								</p>
							</div>
							<Link
								to="/login"
								className="w-full h-11 rounded-[11px] bg-[#4f6958] hover:bg-[#3d5345] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
							>
								<span>Masuk ke Dashboard</span>
							</Link>
						</div>
					) : !token || !email ? (
						<div className="space-y-4 text-center">
							<div className="bg-[#fdf3f2] border border-[#f5d5d3] text-[#b66b68] rounded-xl p-4 text-xs">
								Tautan reset kata sandi tidak lengkap atau tidak valid. Silakan ajukan permintaan lupa kata sandi baru.
							</div>
							<Link
								to="/forgot-password"
								className="inline-flex items-center justify-center gap-1.5 text-xs text-[#4f6958] font-semibold hover:underline"
							>
								<ArrowLeft className="w-3.5 h-3.5" />
								Ajukan Permintaan Reset Baru
							</Link>
						</div>
					) : (
						<form
							noValidate
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							{/* New Password Field */}
							<form.Field
								name="newPassword"
								validators={{
									onChange: ({ value }) => {
										if (!value) return "Kata sandi baru wajib diisi";
										if (value.length < 8) return "Kata sandi baru minimal 8 karakter";
										return undefined;
									},
								}}
							>
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<div className="mb-3.5">
											<Label
												htmlFor="newPasswordInput"
												className="block text-[11px] font-bold text-[#506257] mb-[7px]"
											>
												Kata Sandi Baru
											</Label>
											<div className="relative">
												<Input
													id="newPasswordInput"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													type={showPassword ? "text" : "password"}
													placeholder="Minimal 8 karakter"
													autoComplete="new-password"
													className={`h-[43px] border rounded-[11px] pl-[13px] pr-10 text-[12px] bg-[#fbfcfb] text-[#252925] transition-all duration-150 ${
														hasError
															? "border-[#b66b68] shadow-[0_0_0_3px_rgba(182,107,104,0.12)]"
															: "border-[#dfe7e0] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
													}`}
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737873] hover:text-[#252925]"
												>
													{showPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
											{hasError && (
												<div className="text-[#b66b68] text-[10px] mt-1 font-medium">
													{field.state.meta.errors[0]}
												</div>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* Confirm Password Field */}
							<form.Field
								name="confirmPassword"
								validators={{
									onChange: ({ value }) => {
										if (!value) return "Konfirmasi kata sandi wajib diisi";
										return undefined;
									},
								}}
							>
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<div className="mb-4">
											<Label
												htmlFor="confirmPasswordInput"
												className="block text-[11px] font-bold text-[#506257] mb-[7px]"
											>
												Ulangi Kata Sandi Baru
											</Label>
											<Input
												id="confirmPasswordInput"
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type={showPassword ? "text" : "password"}
												placeholder="Ketik ulang kata sandi baru"
												autoComplete="new-password"
												className={`h-[43px] border rounded-[11px] px-[13px] text-[12px] bg-[#fbfcfb] text-[#252925] transition-all duration-150 ${
													hasError
														? "border-[#b66b68] shadow-[0_0_0_3px_rgba(182,107,104,0.12)]"
														: "border-[#dfe7e0] focus-visible:border-[#8fa594] focus-visible:ring-[#8fa594]/20"
												}`}
											/>
											{hasError && (
												<div className="text-[#b66b68] text-[10px] mt-1 font-medium">
													{field.state.meta.errors[0]}
												</div>
											)}
										</div>
									);
								}}
							</form.Field>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full h-[44px] rounded-[11px] bg-[#4f6958] hover:bg-[#3d5345] text-white font-bold text-[13px] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
							>
								{isLoading ? (
									<>
										<Loader2 className="animate-spin h-4 w-4 text-white" />
										<span>Menyimpan Kata Sandi...</span>
									</>
								) : (
									<span className="flex items-center gap-1.5">
										<Lock className="w-3.5 h-3.5" />
										Simpan Kata Sandi Baru
									</span>
								)}
							</Button>

							<div className="mt-5 text-center">
								<Link
									to="/login"
									className="inline-flex items-center justify-center gap-1.5 text-xs text-[#4f6958] font-semibold hover:underline"
								>
									<ArrowLeft className="w-3.5 h-3.5" />
									Kembali ke Halaman Masuk
								</Link>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
