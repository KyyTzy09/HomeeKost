import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Building2,
	CheckCircle2,
	Loader2,
	LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type {
	ChangePasswordFormValues,
	ProfileUpdateFormValues,
} from "../../common/validations/index.ts";
import {
	ProfileInfoForm,
	ProfileManagedPropertiesCard,
	ProfileOverviewCard,
	SecuritySettingsDialog,
} from "../../components/profile/index.ts";
import {
	useChangeMyPassword,
	useDashboardContext,
	useMyProfile,
	useSetActiveProperty,
	useUpdateMyProfile,
} from "../../hooks/index.ts";
import { authClient } from "../../lib/auth-client.ts";

export const Route = createFileRoute("/dashboard/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const dashboardContext = useDashboardContext();
	const { user, isSuperAdmin, activeProperty } = dashboardContext;

	const { data: myProfile, isLoading: isProfileLoading } = useMyProfile();
	const updateProfileMutation = useUpdateMyProfile();
	const changePasswordMutation = useChangeMyPassword();
	const setActivePropertyMutation = useSetActiveProperty();

	const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
	const [toastMessage, setToastMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);

	const showToast = (text: string, type: "success" | "error" = "success") => {
		setToastMessage({ text, type });
		setTimeout(() => setToastMessage(null), 3500);
	};

	const handleLogout = async () => {
		try {
			await authClient.signOut();
		} catch (err) {
			console.error("Error logging out:", err);
		} finally {
			window.location.href = "/login";
		}
	};

	const handleUpdateProfile = async (values: ProfileUpdateFormValues) => {
		try {
			await updateProfileMutation.mutateAsync(values);
			showToast("Informasi profil akun Anda berhasil diperbarui!");
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : "Gagal memperbarui profil.",
				"error",
			);
		}
	};

	const handleChangePassword = async (values: ChangePasswordFormValues) => {
		try {
			const res = await changePasswordMutation.mutateAsync(values);
			setIsSecurityDialogOpen(false);
			showToast(res.message || "Password berhasil diperbarui!");
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : "Gagal memperbarui password.",
				"error",
			);
		}
	};

	const handleSelectProperty = async (propertyId: string) => {
		if (activeProperty?.id === propertyId) return;

		try {
			await setActivePropertyMutation.mutateAsync({ propertyId });
			showToast("Cabang kos operasional berhasil dialihkan!");
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : "Gagal mengalihkan cabang kos.",
				"error",
			);
		}
	};

	const currentProfile = myProfile || {
		id: user?.id || "",
		name: user?.name || "Pengelola",
		email: user?.email || "",
		phoneNumber: "",
		role: isSuperAdmin ? "SUPER_ADMIN" : "ADMIN",
		assignedProperty: activeProperty?.name || "Semua Kost",
		assignedPropertyId: activeProperty?.id || null,
		accessibleProperties: (dashboardContext.accessibleProperties || []).map(
			(p) => ({
				id: p.id,
				name: p.name,
				address: p.address || "",
				totalRooms: 0,
			}),
		),
		createdAt: "Agustus 2026",
	};

	return (
		<div className="space-y-6">
			{/* Toast Notification */}
			{toastMessage && (
				<div
					className={`fixed bottom-6 right-6 z-50 text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
						toastMessage.type === "error" ? "bg-[#7d2d2a]" : "bg-[#253129]"
					}`}
				>
					{toastMessage.type === "error" ? (
						<AlertCircle className="w-4 h-4 text-[#f09a96]" />
					) : (
						<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
					)}
					<span>{toastMessage.text}</span>
				</div>
			)}

			{/* Page Head */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<span className="text-[11px] font-semibold text-[#4f6958] bg-[#eef3ee] px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-[#d6dfd7]">
							<Building2 className="w-3.5 h-3.5" />
							{activeProperty?.name || "HomeeKost"}
						</span>
						<span className="text-[11px] text-[#737873]">
							· Pengaturan Akun
						</span>
					</div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Profil Admin
					</h1>
					<p className="text-xs text-[#737873] mt-0.5">
						Kelola informasi akun dan akses admin HomeeKost.
					</p>
				</div>

				<div>
					<Button
						type="button"
						variant="outline"
						className="bg-[#fff5f3] text-[#a45149] border-[#efd4d0] hover:bg-[#faeae8] text-xs font-semibold px-4 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer"
						onClick={handleLogout}
					>
						<LogOut className="w-3.5 h-3.5" />
						Keluar Akun
					</Button>
				</div>
			</div>

			{/* Loading State */}
			{isProfileLoading && !myProfile ? (
				<div className="p-12 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-3">
					<Loader2 className="w-6 h-6 animate-spin text-[#4f6958]" />
					<p className="text-xs text-[#737873] font-medium">
						Memuat informasi profil pengelola...
					</p>
				</div>
			) : (
				<>
					{/* Main 2-Column Profile Layout */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<ProfileOverviewCard
							profile={currentProfile}
							isSuperAdmin={isSuperAdmin}
						/>

						<ProfileInfoForm
							profile={currentProfile}
							onSubmit={handleUpdateProfile}
							onOpenSecurityDialog={() => setIsSecurityDialogOpen(true)}
							isSubmitting={updateProfileMutation.isPending}
						/>
					</div>

					{/* Managed Properties Card */}
					<ProfileManagedPropertiesCard
						properties={currentProfile.accessibleProperties}
						activePropertyId={activeProperty?.id}
						isSuperAdmin={isSuperAdmin}
						onSelectProperty={handleSelectProperty}
						isSwitchingProperty={setActivePropertyMutation.isPending}
					/>
				</>
			)}

			{/* Modal Dialog Keamanan Password */}
			<SecuritySettingsDialog
				open={isSecurityDialogOpen}
				onOpenChange={setIsSecurityDialogOpen}
				onSubmit={handleChangePassword}
				isSubmitting={changePasswordMutation.isPending}
			/>
		</div>
	);
}
