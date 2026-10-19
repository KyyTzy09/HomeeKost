import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
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
	requestForgotPasswordServerFn,
} from "../data/servers/index.ts";

export const Route = createFileRoute("/forgot-password")({
	beforeLoad: async () => {
		const context = await getDashboardContextServerFn();
		if (context) {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({
		meta: [
			{
				title: "Lupa Kata Sandi — Sistem Pengelolaan Kos",
			},
		],
	}),
	component: ForgotPasswordPage,
});

interface ResultData {
	role: "SUPER_ADMIN" | "ADMIN";
	email: string;
	name: string;
	message: string;
	ownerPhone?: string;
}

const forgotPasswordSchema = z.object({
	email: z
		.string()
		.min(1, "Alamat email wajib diisi")
		.email("Format email tidak valid"),
});

function ForgotPasswordPage() {
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<ResultData | null>(null);

	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			setErrorMsg(null);
			setIsLoading(true);

			try {
				const validated = forgotPasswordSchema.safeParse(value);
				if (!validated.success) {
					setErrorMsg(
						validated.error.issues[0]?.message || "Alamat email tidak valid.",
					);
					setIsLoading(false);
					return;
				}

				const res = await requestForgotPasswordServerFn({
					data: { email: validated.data.email },
				});

				setResult(res);
				setIsLoading(false);
			} catch (err: unknown) {
				const message =
					err instanceof Error
						? err.message
						: "Terjadi kesalahan saat memproses permintaan reset kata sandi.";
				setErrorMsg(message);
				setIsLoading(false);
			}
		},
	});

	return (
		<div className="fixed inset-0 min-h-screen bg-[#f5f8f5] z-50 flex items-center justify-center p-6">
			<Card className="w-full max-w-[440px] bg-white border-[#e2e9e3] rounded-[24px] p-[32px] shadow-[0_20px_60px_rgba(47,69,55,0.10)] ring-0">
				<CardHeader className="p-0 text-center mb-6">
					<div className="w-14 h-14 rounded-2xl bg-[#edf5ee] border border-[#d2e2d5] text-[#4f6958] flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_16px_rgba(79,105,88,0.10)]">
						{result ? (
							<Mail className="w-7 h-7" />
						) : (
							<KeyRound className="w-7 h-7" />
						)}
					</div>
					<CardTitle className="text-[22px] font-bold text-[#26372c] leading-[1.2]">
						{result ? "Informasi Pemulihan" : "Lupa Kata Sandi"}
					</CardTitle>
					<CardDescription className="text-center text-[#7b897e] text-[13px] mt-1">
						{result
							? `Bantuan akun untuk ${result.email}`
							: "Masukkan email terdaftar untuk memulihkan akses akun Anda."}
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

					{result ? (
						<div className="space-y-4">
							<div className="bg-[#edf5ee] border border-[#cbe0ce] rounded-xl p-4 text-center space-y-2">
								<div className="w-9 h-9 rounded-full bg-[#dbece0] text-[#3e724d] flex items-center justify-center mx-auto">
									<CheckCircle2 className="w-5 h-5" />
								</div>
								<h4 className="text-xs font-bold text-[#253129]">
									Email Verifikasi Terkirim
								</h4>
								<p className="text-[11.5px] text-[#4c5c50] leading-relaxed">
									{result.message}
								</p>
							</div>

							{result.role === "ADMIN" && (
								<p className="text-[11px] text-[#718275] text-center px-2">
									💡 <em>Catatan:</em> Pemilik Kos (SuperAdmin) juga dapat
									membantu memperbarui kata sandi akun Anda secara langsung
									melalui menu Pengaturan Pengguna di dashboard.
								</p>
							)}

							<div className="pt-2 flex flex-col gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setResult(null);
										form.reset();
									}}
									className="w-full h-10 border-[#dfe7e0] text-xs font-semibold text-[#506257] hover:bg-[#f3f7f4] cursor-pointer"
								>
									Coba Email Lain
								</Button>
								<Link
									to="/login"
									className="flex items-center justify-center gap-1.5 text-xs text-[#4f6958] font-semibold hover:underline py-2"
								>
									<ArrowLeft className="w-3.5 h-3.5" />
									Kembali ke Halaman Masuk
								</Link>
							</div>
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
							{/* Email Field */}
							<form.Field
								name="email"
								validators={{
									onChange: ({ value }) => {
										if (!value || !value.trim()) return "Email wajib diisi";
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
												htmlFor="forgotEmail"
												className="block text-[11px] font-bold text-[#506257] mb-[7px]"
											>
												Alamat Email Terdaftar
											</Label>
											<Input
												id="forgotEmail"
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="email"
												placeholder="contoh: owner@homeekost.com"
												autoComplete="email"
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
										<span>Memeriksa Email...</span>
									</>
								) : (
									<span>Kirim Permintaan Pemulihan</span>
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
