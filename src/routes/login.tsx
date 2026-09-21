import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { sanitizedLoginSchema } from "../common/validations/index.ts";
import { getDashboardContextServerFn } from "../data/servers/index.ts";
import { authClient } from "../lib/auth-client.ts";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const context = await getDashboardContextServerFn();
		if (context) {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({
		meta: [
			{
				title: "Masuk — Sistem Pengelolaan Kos",
			},
		],
	}),
	component: LoginPage,
});

function LoginPage() {
	const [authError, setAuthError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSlowLoad, setIsSlowLoad] = useState(false);

	// Silent pre-warm: bangunkan container Vercel serverless & pool koneksi Supabase di background
	// saat user pertama kali membuka halaman login dan sedang mengetik kredensial
	useEffect(() => {
		authClient.getSession().catch(() => {});
	}, []);

	// Jika proses loading memakan waktu > 2.5 detik (indikasi serverless cold start),
	// tampilkan pesan informatif yang menenangkan user
	useEffect(() => {
		if (!isLoading) {
			setIsSlowLoad(false);
			return;
		}

		const timer = setTimeout(() => {
			setIsSlowLoad(true);
		}, 2500);

		return () => clearTimeout(timer);
	}, [isLoading]);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setAuthError(null);
			setIsLoading(true);

			try {
				const validation = sanitizedLoginSchema.safeParse(value);

				if (!validation.success) {
					const firstError =
						validation.error.issues[0]?.message ||
						"Input yang dimasukkan tidak valid.";
					setAuthError(firstError);
					setIsLoading(false);
					return;
				}

				const { email, password } = validation.data;

				const res = await authClient.signIn.email({
					email,
					password,
				});

				if (res.error) {
					setAuthError(
						res.error.message ||
							"Email atau password yang Anda masukkan salah.",
					);
					setIsLoading(false);
					return;
				}

				if (res.data) {
					window.location.href = "/";
				}
			} catch (err: unknown) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Terjadi kesalahan pada sistem saat masuk.";
				setAuthError(errorMessage);
				setIsLoading(false);
			}
		},
	});

	return (
		<div className="fixed inset-0 min-h-screen bg-[#f5f8f5] z-50 flex items-center justify-center p-6">
			<Card className="w-full max-w-[430px] bg-white border-[#e2e9e3] rounded-[24px] p-[34px] shadow-[0_20px_60px_rgba(47,69,55,0.10)] ring-0">
				<CardHeader className="p-0 text-center mb-6">
					<div className="w-14 h-14 rounded-2xl bg-[#edf5ee] border border-[#d2e2d5] text-[#4f6958] flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_16px_rgba(79,105,88,0.10)]">
						<Building2 className="w-7 h-7" />
					</div>
					<CardTitle className="text-[22px] font-bold text-[#26372c] leading-[1.2]">
						Masuk ke Dashboard Kos
					</CardTitle>
					<CardDescription className="text-center text-[#7b897e] text-[13px] mt-1">
						Kelola seluruh cabang kos dalam satu dashboard.
					</CardDescription>
				</CardHeader>

				<CardContent className="p-0">
					{/* Error Alert Box */}
					{authError && (
						<div
							className="bg-[#f7e9e8] border border-[#efd4d0] text-[#a65f5b] rounded-[10px] py-2.5 px-3.5 text-[11px] mb-4 text-center font-medium leading-relaxed"
							role="alert"
						>
							{authError}
						</div>
					)}

					<form
						id="loginForm"
						noValidate
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						{/* Email / Username Field */}
						<form.Field
							name="email"
							validators={{
								onChange: ({ value }) => {
									if (!value || !value.trim())
										return "Email atau username wajib diisi";
									return undefined;
								},
							}}
						>
							{(field) => {
								const hasError =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<div className="mb-[15px]">
										<Label
											htmlFor="loginUser"
											className="block text-[11px] font-bold text-[#506257] mb-[7px]"
										>
											Email / Username
										</Label>
										<Input
											id="loginUser"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											type="text"
											placeholder="Masukkan username / email"
											autoComplete="username"
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

						{/* Password Field */}
						<form.Field
							name="password"
							validators={{
								onChange: ({ value }) => {
									if (!value) return "Password wajib diisi";
									if (value.length < 6) return "Password minimal 6 karakter";
									return undefined;
								},
							}}
						>
							{(field) => {
								const hasError =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<div className="mb-[15px]">
										<div className="flex items-center justify-between mb-[7px]">
											<Label
												htmlFor="loginPass"
												className="block text-[11px] font-bold text-[#506257]"
											>
												Password
											</Label>
										</div>
										<Input
											id="loginPass"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											type="password"
											placeholder="Masukkan password"
											autoComplete="current-password"
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

						{/* Submit Button with shadcn Button */}
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full h-[44px] rounded-[11px] bg-[#4f6958] hover:bg-[#3d5345] text-white font-bold text-[13px] mt-[5px] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
						>
							{isLoading ? (
								<>
									<Loader2 className="animate-spin h-4 w-4 text-white" />
									<span>
										{isSlowLoad
											? "Menghubungkan ke server cloud..."
											: "Memproses Masuk..."}
									</span>
								</>
							) : (
								<span>Masuk ke Dashboard</span>
							)}
						</Button>

						{isLoading && isSlowLoad && (
							<p className="text-center text-[#7b897e] text-[11px] mt-2.5 animate-pulse font-medium">
								Server cloud sedang bangun dari mode hemat daya, mohon tunggu
								sebentar...
							</p>
						)}
					</form>

					<div className="text-center text-[#7b897e] text-[11px] mt-4">
						Lupa password?{" "}
						<Link
							to="/forgot-password"
							className="text-[#4f6958] font-semibold hover:underline"
						>
							Klik di sini
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
