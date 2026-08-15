import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { UserItem } from "../../common/types/index.ts";
import type { UserFormValues } from "../../common/validations/index.ts";
import {
	UserAuditLogTable,
	UserDeleteDialog,
	UserFormDialog,
	UserTable,
} from "../../components/user/index.ts";
import {
	useCreateUser,
	useDeleteUser,
	useUpdateUser,
	useUserAuditLogs,
	useUsers,
} from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/users")({
	head: () => ({
		meta: [
			{
				title: "User Management & Hak Akses — HomeeKost Management",
			},
		],
	}),
	component: UsersPage,
});

function UsersPage() {
	// TanStack Query data fetching
	const {
		data: users = [],
		isLoading: isUsersLoading,
		error: usersError,
	} = useUsers();
	const { data: auditLogs = [], isLoading: isLogsLoading } = useUserAuditLogs();

	// TanStack Query mutations
	const createUserMutation = useCreateUser();
	const updateUserMutation = useUpdateUser();
	const deleteUserMutation = useDeleteUser();

	// Dialog states
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [editingUser, setEditingUser] = useState<UserItem | null>(null);

	const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
	const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => {
			setToastMessage(null);
		}, 3500);
	};

	const showError = (msg: string) => {
		setErrorMessage(msg);
		setTimeout(() => {
			setErrorMessage(null);
		}, 4000);
	};

	// Form actions with mutations
	const handleSaveUser = (values: UserFormValues) => {
		if (editingUser) {
			updateUserMutation.mutate(
				{ id: String(editingUser.id), data: values },
				{
					onSuccess: (updated) => {
						showToast(`Pengguna "${updated.name}" berhasil diperbarui`);
						setIsFormOpen(false);
						setEditingUser(null);
					},
					onError: (err) => {
						showError(
							err instanceof Error ? err.message : "Gagal memperbarui pengguna",
						);
					},
				},
			);
		} else {
			createUserMutation.mutate(values, {
				onSuccess: (created) => {
					showToast(`Pengguna "${created.name}" berhasil ditambahkan`);
					setIsFormOpen(false);
				},
				onError: (err) => {
					showError(
						err instanceof Error ? err.message : "Gagal menambahkan pengguna",
					);
				},
			});
		}
	};

	const handleDeleteConfirm = (user: UserItem) => {
		deleteUserMutation.mutate(String(user.id), {
			onSuccess: () => {
				showToast(`Pengguna "${user.name}" berhasil dihapus`);
				setIsDeleteOpen(false);
				setDeletingUser(null);
			},
			onError: (err) => {
				showError(
					err instanceof Error ? err.message : "Gagal menghapus pengguna",
				);
			},
		});
	};

	return (
		<div className="space-y-6">
			{/* Toast Success Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
					<span>{toastMessage}</span>
				</div>
			)}

			{/* Toast Error Notification */}
			{errorMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#3a1d1a] border border-[#a45149] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<AlertCircle className="w-4 h-4 text-[#e07d75]" />
					<span>{errorMessage}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						User Management
					</h1>
					<p className="text-xs text-[#737873] mt-1">
						Kelola pengguna, staf operasional, dan hak akses RBAC ke sistem
						HomeeKost.
					</p>
				</div>

				<Button
					type="button"
					className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
					onClick={() => {
						setEditingUser(null);
						setIsFormOpen(true);
					}}
				>
					<UserPlus className="w-4 h-4 mr-1.5" />
					Tambahkan User
				</Button>
			</div>

			{/* User Table Component */}
			{isUsersLoading ? (
				<div className="p-12 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<Loader2 className="w-6 h-6 text-[#4f6958] animate-spin" />
					<p className="text-xs text-[#737873]">Memuat data pengguna...</p>
				</div>
			) : usersError ? (
				<div className="p-6 bg-[#fff7f6] border border-[#f5cfcc] rounded-2xl text-xs text-[#a45149]">
					<b className="font-bold block mb-1">Gagal memuat data pengguna:</b>
					{usersError instanceof Error
						? usersError.message
						: "Terjadi kesalahan pada server."}
				</div>
			) : (
				<UserTable
					data={users}
					onEditUser={(user) => {
						setEditingUser(user);
						setIsFormOpen(true);
					}}
					onDeleteUser={(user) => {
						setDeletingUser(user);
						setIsDeleteOpen(true);
					}}
				/>
			)}

			{/* Audit Log / Riwayat Perubahan Table Component */}
			{isLogsLoading ? (
				<div className="p-8 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<Loader2 className="w-5 h-5 text-[#4f6958] animate-spin" />
					<p className="text-xs text-[#737873]">Memuat riwayat perubahan...</p>
				</div>
			) : (
				<UserAuditLogTable data={auditLogs} />
			)}

			{/* Dialog Modals */}
			<UserFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				editingUser={editingUser}
				onSubmit={handleSaveUser}
			/>

			<UserDeleteDialog
				open={isDeleteOpen}
				onOpenChange={setIsDeleteOpen}
				user={deletingUser}
				onConfirmDelete={handleDeleteConfirm}
			/>
		</div>
	);
}
