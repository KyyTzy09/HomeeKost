import { useForm } from "@tanstack/react-form";
import {
	Eye,
	EyeOff,
	Loader2,
	Lock,
	ShieldCheck,
	UserCog,
	UserPlus,
} from "lucide-react";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import type {
	AppUserRole,
	AppUserStatus,
	PropertyItem,
	UserItem,
} from "../../common/types/index.ts";
import {
	type UserFormValues,
	userFormSchema,
} from "../../common/validations/index.ts";

interface UserFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingUser: UserItem | null;
	properties: PropertyItem[];
	currentUserRole?: AppUserRole;
	isSubmitting?: boolean;
	onSubmit: (values: UserFormValues) => void;
}

const ROLE_OPTIONS: { label: string; value: AppUserRole }[] = [
	{ label: "SuperAdmin (Owner)", value: "SUPER_ADMIN" },
	{ label: "Admin (Cabang Kos)", value: "ADMIN" },
];

const USER_STATUS_OPTIONS: { label: string; value: AppUserStatus }[] = [
	{ label: "Aktif", value: "ACTIVE" },
	{ label: "Nonaktif", value: "INACTIVE" },
];

export function UserFormDialog({
	open,
	onOpenChange,
	editingUser,
	properties = [],
	currentUserRole = "SUPER_ADMIN",
	isSubmitting = false,
	onSubmit,
}: UserFormDialogProps) {
	const propertyOptions = [
		{
			label: "Semua Kost (Akses Multi-Cabang Global)",
			value: "Semua Kost",
		},
		...properties.map((prop) => ({
			label: `${prop.name}${prop.address ? ` · ${prop.address}` : ""}`,
			value: prop.name,
		})),
	];

	const [showPassword, setShowPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			name: editingUser?.name || "",
			email: editingUser?.email || "",
			role: (editingUser?.role || "ADMIN") as AppUserRole,
			assignedProperty: editingUser?.assignedProperty || "Semua Kost",
			status: (editingUser?.status || "ACTIVE") as AppUserStatus,
			password: "",
		},
		validators: {
			onSubmit: ({ value }) => {
				const fieldErrors: Record<string, string> = {};

				// Akun baru wajib memiliki password minimal 8 karakter
				if (
					!editingUser &&
					(!value.password || value.password.trim().length < 8)
				) {
					fieldErrors.password =
						"Password wajib diisi minimal 8 karakter untuk akun baru";
				} else if (
					value.password &&
					value.password.trim().length > 0 &&
					value.password.trim().length < 8
				) {
					fieldErrors.password = "Password minimal 8 karakter";
				}

				const res = userFormSchema.safeParse(value);
				if (!res.success) {
					for (const issue of res.error.issues) {
						const field = issue.path[0];
						if (field && !fieldErrors[String(field)]) {
							fieldErrors[String(field)] = issue.message;
						}
					}
				}
				return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
			},
		},
		onSubmit: ({ value }) => {
			onSubmit(value as UserFormValues);
		},
	});

	useEffect(() => {
		if (open) {
			setShowPassword(false);
			if (editingUser) {
				form.setFieldValue("name", editingUser.name);
				form.setFieldValue("email", editingUser.email);
				form.setFieldValue("role", editingUser.role);
				form.setFieldValue("assignedProperty", editingUser.assignedProperty);
				form.setFieldValue("status", editingUser.status);
				form.setFieldValue("password", "");
			} else {
				form.reset();
				form.setFieldValue("name", "");
				form.setFieldValue("email", "");
				form.setFieldValue("role", "ADMIN");
				form.setFieldValue(
					"assignedProperty",
					properties.length > 0 ? properties[0].name : "Semua Kost",
				);
				form.setFieldValue("status", "ACTIVE");
				form.setFieldValue("password", "");
			}
		}
	}, [open, editingUser, properties, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[540px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="user-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-[#e8f0ea] text-[#4f6958] flex items-center justify-center border border-[#cfe2d3] shrink-0">
							{editingUser ? (
								<UserCog className="w-5 h-5" />
							) : (
								<UserPlus className="w-5 h-5" />
							)}
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-[#252925]">
								{editingUser ? "Edit Pengguna Sistem" : "Tambah Pengguna Baru"}
							</DialogTitle>
							<DialogDescription
								id="user-dialog-description"
								className="text-xs text-[#737873] mt-0.5"
							>
								{editingUser
									? `Perbarui profil dan penugasan kos untuk ${editingUser.name}.`
									: "Tambahkan akun staf atau pengelola kos ke sistem HomeeKost."}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-4"
				>
					{/* Nama Lengkap */}
					<form.Field name="name">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor={field.name}
									className="text-xs font-semibold text-[#252925]"
								>
									Nama Lengkap <span className="text-[#b66b68]">*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: Budi Santoso"
									className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]"
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[11px] text-[#b66b68]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Email Akun */}
					<form.Field name="email">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor={field.name}
									className="text-xs font-semibold text-[#252925]"
								>
									Alamat Email Pengguna{" "}
									<span className="text-[#b66b68]">*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="budi@homeekost.id"
									className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]"
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[11px] text-[#b66b68]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Password Akun */}
					<form.Field name="password">
						{(field) => (
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label
										htmlFor={field.name}
										className="text-xs font-semibold text-[#252925] flex items-center gap-1.5"
									>
										<Lock className="w-3.5 h-3.5 text-[#526e5b]" />
										{editingUser
											? "Ganti Password (Opsional)"
											: "Password Akun"}
										{!editingUser && <span className="text-[#b66b68]">*</span>}
									</Label>
									<span className="text-[10.5px] text-[#737873]">
										{editingUser
											? "Kosongkan jika tidak diubah"
											: "Minimal 8 karakter"}
									</span>
								</div>
								<div className="relative">
									<Input
										id={field.name}
										name={field.name}
										type={showPassword ? "text" : "password"}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={
											editingUser
												? "Masukkan password baru jika ingin mereset..."
												: "Masukkan password untuk login (min. 8 karakter)..."
										}
										className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594] pr-10"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737873] hover:text-[#252925] transition-colors p-0.5"
										tabIndex={-1}
										aria-label={
											showPassword ? "Sembunyikan password" : "Lihat password"
										}
									>
										{showPassword ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
									</button>
								</div>
								{field.state.meta.errors.length > 0 && (
									<p className="text-[11px] text-[#b66b68]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Grid Role & Status */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
						{/* Role Selection */}
						<form.Field name="role">
							{(field) => {
								const selectedRoleOption = ROLE_OPTIONS.find(
									(r) => r.value === field.state.value,
								);

								return (
									<div className="space-y-1.5 w-full">
										<Label className="text-xs font-semibold text-[#252925]">
											Hak Akses (Role)
										</Label>
										<Select
											value={field.state.value}
											onValueChange={(val) => {
												if (val) {
													field.handleChange(val as AppUserRole);
													if (val === "SUPER_ADMIN") {
														form.setFieldValue(
															"assignedProperty",
															"Semua Kost",
														);
													}
												}
											}}
										>
											<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
												<SelectValue placeholder="Pilih Role">
													{selectedRoleOption?.label}
												</SelectValue>
											</SelectTrigger>
											<SelectContent className="bg-white border-[#e4e9e4]">
												{currentUserRole === "SUPER_ADMIN" && (
													<SelectItem value="SUPER_ADMIN" className="text-xs">
														SuperAdmin (Owner)
													</SelectItem>
												)}
												<SelectItem value="ADMIN" className="text-xs">
													Admin (Cabang Kos)
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								);
							}}
						</form.Field>

						{/* Status Akun */}
						<form.Field name="status">
							{(field) => {
								const selectedStatusOption = USER_STATUS_OPTIONS.find(
									(s) => s.value === field.state.value,
								);

								return (
									<div className="space-y-1.5 w-full">
										<Label className="text-xs font-semibold text-[#252925]">
											Status Akun
										</Label>
										<Select
											value={field.state.value}
											onValueChange={(val) => {
												if (val) field.handleChange(val as AppUserStatus);
											}}
										>
											<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
												<SelectValue placeholder="Pilih Status">
													{selectedStatusOption?.label}
												</SelectValue>
											</SelectTrigger>
											<SelectContent className="bg-white border-[#e4e9e4]">
												{USER_STATUS_OPTIONS.map((opt) => (
													<SelectItem
														key={opt.value}
														value={opt.value}
														className="text-xs"
													>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								);
							}}
						</form.Field>
					</div>

					{/* Penugasan Cabang Kos */}
					<form.Field name="assignedProperty">
						{(field) => {
							const selectedPropOption = propertyOptions.find(
								(p) => p.value === field.state.value,
							);

							return (
								<div className="space-y-1.5 w-full">
									<div className="flex items-center justify-between w-full">
										<Label className="text-xs font-semibold text-[#252925]">
											Penugasan Cabang Properti
										</Label>
										{form.state.values.role === "SUPER_ADMIN" && (
											<span className="text-[10px] text-[#4f6958] font-medium flex items-center gap-1">
												<ShieldCheck className="w-3 h-3" /> Akses Global Seluruh
												Kos
											</span>
										)}
									</div>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val);
										}}
									>
										<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Cabang Properti">
												{selectedPropOption?.label || field.state.value}
											</SelectValue>
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											{propertyOptions.map((prop) => (
												<SelectItem
													key={prop.value}
													value={prop.value}
													className="text-xs"
												>
													{prop.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							);
						}}
					</form.Field>

					<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 cursor-pointer"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Menyimpan...</span>
								</>
							) : editingUser ? (
								"Simpan Perubahan"
							) : (
								"Simpan Pengguna"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
