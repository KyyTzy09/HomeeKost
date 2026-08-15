import { useForm } from "@tanstack/react-form";
import { ShieldCheck, UserCog, UserPlus } from "lucide-react";
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
	onSubmit: (values: UserFormValues) => void;
}

export function UserFormDialog({
	open,
	onOpenChange,
	editingUser,
	properties = [],
	currentUserRole = "SUPER_ADMIN",
	onSubmit,
}: UserFormDialogProps) {
	const form = useForm({
		defaultValues: {
			name: editingUser?.name || "",
			email: editingUser?.email || "",
			role: (editingUser?.role || "ADMIN") as AppUserRole,
			assignedProperty: editingUser?.assignedProperty || "Semua Kost",
			status: (editingUser?.status || "ACTIVE") as AppUserStatus,
		},
		validators: {
			onSubmit: ({ value }) => {
				const res = userFormSchema.safeParse(value);
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
			onSubmit(value as UserFormValues);
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (open) {
			if (editingUser) {
				form.setFieldValue("name", editingUser.name);
				form.setFieldValue("email", editingUser.email);
				form.setFieldValue("role", editingUser.role);
				form.setFieldValue("assignedProperty", editingUser.assignedProperty);
				form.setFieldValue("status", editingUser.status);
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

					{/* Email */}
					<form.Field name="email">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor={field.name}
									className="text-xs font-semibold text-[#252925]"
								>
									Alamat Email <span className="text-[#b66b68]">*</span>
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

					{/* Grid Role & Status */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
						{/* Role Selection */}
						<form.Field name="role">
							{(field) => (
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
													form.setFieldValue("assignedProperty", "Semua Kost");
												}
											}
										}}
									>
										<SelectTrigger className="w-full border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Role" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											{currentUserRole === "SUPER_ADMIN" && (
												<SelectItem value="SUPER_ADMIN" className="text-xs">
													SuperAdmin (Owner)
												</SelectItem>
											)}
											{currentUserRole === "SUPER_ADMIN" && (
												<SelectItem value="ADMIN" className="text-xs">
													Admin (Cabang Kos)
												</SelectItem>
											)}
											<SelectItem value="STAFF" className="text-xs">
												Staff (Operasional)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Status Akun */}
						<form.Field name="status">
							{(field) => (
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
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent className=" bg-white border-[#e4e9e4]">
											<SelectItem value="ACTIVE" className="text-xs">
												Aktif
											</SelectItem>
											<SelectItem value="INACTIVE" className="text-xs">
												Nonaktif
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>
					</div>

					{/* Penugasan Cabang Kos (Integrated dynamically with properties from DB) */}
					<form.Field name="assignedProperty">
						{(field) => (
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
										<SelectValue placeholder="Pilih Cabang Properti" />
									</SelectTrigger>
									<SelectContent className="bg-white border-[#e4e9e4]">
										<SelectItem value="Semua Kost" className="text-xs">
											Semua Kost (Akses Multi-Cabang Global)
										</SelectItem>
										{properties.map((prop) => (
											<SelectItem
												key={prop.id}
												value={prop.name}
												className="text-xs"
											>
												{prop.name} {prop.address ? `· ${prop.address}` : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
							{editingUser ? "Simpan Perubahan" : "Simpan Pengguna"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
