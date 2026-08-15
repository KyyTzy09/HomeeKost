import { useForm } from "@tanstack/react-form";
import { UserPlus } from "lucide-react";
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
	onSubmit: (values: UserFormValues) => void;
}

export function UserFormDialog({
	open,
	onOpenChange,
	editingUser,
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
				form.setFieldValue("assignedProperty", "Semua Kost");
				form.setFieldValue("status", "ACTIVE");
			}
		}
	}, [open, editingUser, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[540px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="user-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<UserPlus className="w-5 h-5 text-[#4f6958]" />
						{editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
					</DialogTitle>
					<DialogDescription
						id="user-dialog-description"
						className="text-xs text-[#737873] mt-1"
					>
						Kelola akun staf dan admin yang memiliki hak akses ke sistem
						HomeeKost.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-2"
				>
					{/* Nama Lengkap */}
					<form.Field name="name">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Nama Lengkap
								</Label>
								<Input
									placeholder="Contoh: Rani Setyawati"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
								/>
								{field.state.meta.errors?.[0] && (
									<p className="text-[11px] text-[#a65f5b]">
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
								<Label className="text-xs font-semibold text-[#252925]">
									Alamat Email
								</Label>
								<Input
									type="email"
									placeholder="rani@homeekost.id"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
								/>
								{field.state.meta.errors?.[0] && (
									<p className="text-[11px] text-[#a65f5b]">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						{/* Role Hak Akses */}
						<form.Field name="role">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Role Akses
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val as AppUserRole);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Role" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
											<SelectItem value="ADMIN" className="text-xs">
												Admin (Cabang Kos)
											</SelectItem>
											<SelectItem value="STAFF" className="text-xs">
												Staff (Operasional)
											</SelectItem>
											<SelectItem value="SUPER_ADMIN" className="text-xs">
												SuperAdmin (Owner)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Status Akun */}
						<form.Field name="status">
							{(field) => (
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-[#252925]">
										Status Akun
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val) field.handleChange(val as AppUserStatus);
										}}
									>
										<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent className="bg-white border-[#e4e9e4]">
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

					{/* Penugasan Cabang Kos */}
					<form.Field name="assignedProperty">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-[#252925]">
									Penugasan Cabang Properti
								</Label>
								<Select
									value={field.state.value}
									onValueChange={(val) => {
										if (val) field.handleChange(val);
									}}
								>
									<SelectTrigger className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] focus:ring-[#8fa594]">
										<SelectValue placeholder="Pilih Cabang Properti" />
									</SelectTrigger>
									<SelectContent className="bg-white border-[#e4e9e4]">
										<SelectItem value="Semua Kost" className="text-xs">
											Semua Kost (Akses Global)
										</SelectItem>
										<SelectItem value="Kos A" className="text-xs">
											Kos A (Kaliurang)
										</SelectItem>
										<SelectItem value="Kos B" className="text-xs">
											Kos B (Malioboro)
										</SelectItem>
										<SelectItem value="Kos C" className="text-xs">
											Kos C (Solo KM 8)
										</SelectItem>
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
							Simpan Pengguna
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
