import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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
				title: "Masuk — HomeeKost Management",
			},
		],
	}),
	component: LoginPage,
});

function LoginPage() {
	const [authError, setAuthError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

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
					<img
						className="block w-[180px] max-h-[100px] object-contain mx-auto mb-6"
						src="/logo.png"
						alt="HomeeKost Logo"
					/>
					<CardTitle className="text-[24px] font-bold text-[#26372c] leading-[1.2]">
						Masuk ke HomeeKost
					</CardTitle>
					<CardDescription className="text-center text-[#7b897e] text-[13px] mt-1">
						Kelola seluruh kosan dalam satu dashboard.
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
										<Label
											htmlFor="loginPass"
											className="block text-[11px] font-bold text-[#506257] mb-[7px]"
										>
											Password
										</Label>
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
							className="w-full h-[44px] rounded-[11px] bg-[#6f8976] hover:bg-[#4f6958] text-white font-bold text-[13px] mt-[5px] transition-colors duration-150 flex items-center justify-center gap-2"
						>
							{isLoading ? (
								<>
									<Loader2 className="animate-spin h-4 w-4 text-white" />
									<span>Memproses Masuk...</span>
								</>
							) : (
								<span>Masuk sebagai Admin</span>
							)}
						</Button>
					</form>

					<div className="text-center text-[#9aa49c] text-[10px] mt-4">
						Demo prototype · data masih menggunakan data contoh
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
