import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { useState } from "react";
import type { PropertyItem } from "../../common/types/index.ts";
import type { PropertyFormValues } from "../../common/validations/index.ts";
import {
	AddPropertyCard,
	PropertyCard,
	PropertyDeleteDialog,
	PropertyFormDialog,
} from "../../components/property/index.ts";
import {
	propertiesQueryOptions,
	useCreateProperty,
	useDeleteProperty,
	useProperties,
	useSetActiveProperty,
	useUpdateProperty,
} from "../../hooks/index.ts";
import { authClient } from "../../lib/auth-client.ts";

export const Route = createFileRoute("/dashboard/select-property")({
	beforeLoad: ({ context }) => {
		const dashboard = (context as { dashboard?: { isSuperAdmin?: boolean } })
			.dashboard;
		if (!dashboard?.isSuperAdmin) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(propertiesQueryOptions());
	},
	head: () => ({
		meta: [
			{
				title: "Pilih & Kelola Properti Kos — HomeeKost Management",
			},
		],
	}),
	component: SelectPropertyPage,
});

function SelectPropertyPage() {
	const navigate = useNavigate();

	// TanStack Query hooks
	const {
		data: properties = [],
		isLoading,
		error: queryError,
	} = useProperties();
	const createMutation = useCreateProperty();
	const updateMutation = useUpdateProperty();
	const deleteMutation = useDeleteProperty();
	const setActivePropertyMutation = useSetActiveProperty();

	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [switchingPropertyId, setSwitchingPropertyId] = useState<string | null>(
		null,
	);

	// Dialog states
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(
		null,
	);
	const [deletingProperty, setDeletingProperty] = useState<PropertyItem | null>(
		null,
	);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const showError = (msg: string) => {
		setErrorMessage(msg);
		setTimeout(() => setErrorMessage(null), 4000);
	};

	// Handlers
	const handleOpenAdd = () => {
		setEditingProperty(null);
		setIsFormOpen(true);
	};

	const handleOpenEdit = (prop: PropertyItem) => {
		setEditingProperty(prop);
		setIsFormOpen(true);
	};

	const handleFormSubmit = (
		values: PropertyFormValues,
		imageUrl: string | null,
	) => {
		const payload: PropertyFormValues = {
			...values,
			imageUrl: imageUrl || values.imageUrl || "",
		};

		if (editingProperty) {
			updateMutation.mutate(
				{ id: editingProperty.id, data: payload },
				{
					onSuccess: (updated) => {
						showToast(`Properti "${updated.name}" berhasil diperbarui`);
						setIsFormOpen(false);
						setEditingProperty(null);
					},
					onError: (err) => {
						showError(
							err instanceof Error ? err.message : "Gagal memperbarui properti",
						);
					},
				},
			);
		} else {
			createMutation.mutate(payload, {
				onSuccess: (created) => {
					showToast(`Properti baru "${created.name}" berhasil ditambahkan`);
					setIsFormOpen(false);
				},
				onError: (err) => {
					showError(
						err instanceof Error ? err.message : "Gagal menambahkan properti",
					);
				},
			});
		}
	};

	const handleDeleteConfirm = () => {
		if (!deletingProperty) return;
		deleteMutation.mutate(deletingProperty.id, {
			onSuccess: () => {
				showToast(`Properti "${deletingProperty.name}" telah dihapus`);
				setDeletingProperty(null);
			},
			onError: (err) => {
				showError(
					err instanceof Error ? err.message : "Gagal menghapus properti",
				);
			},
		});
	};

	const handleCardClick = (property: PropertyItem) => {
		setSwitchingPropertyId(property.id);
		setActivePropertyMutation.mutate(
			{ propertyId: property.id },
			{
				onSuccess: () => {
					navigate({
						to: "/dashboard",
					});
				},
				onError: (err) => {
					setSwitchingPropertyId(null);
					showError(err instanceof Error ? err.message : "Gagal memilih kos");
				},
			},
		);
	};

	const handleLogout = async () => {
		try {
			await authClient.signOut();
		} catch (err) {
			console.error("Logout error:", err);
		}
		window.location.href = "/login";
	};

	return (
		<div className="p-6 max-w-[980px] mx-auto">
			{/* Toast Notifications */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
					<span>{toastMessage}</span>
				</div>
			)}

			{errorMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#3a1d1a] border border-[#a45149] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<AlertCircle className="w-4 h-4 text-[#e07d75]" />
					<span>{errorMessage}</span>
				</div>
			)}

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
				<div>
					<div className="text-[11px] text-[#718078] mb-2 font-medium">
						Manajemen Properti
					</div>
					<h1 className="text-[24px] font-bold text-[#29382e] m-0 leading-tight">
						Pilih Kos
					</h1>
					<p className="text-[12px] text-[#829087] mt-1 m-0">
						Pilih properti yang ingin kamu kelola. Data dashboard akan mengikuti
						kos yang dipilih.
					</p>
				</div>
				<div className="text-[11px] text-[#607066] bg-white border border-[#e2e9e3] px-3 py-2 rounded-[12px] font-medium shadow-xs self-start sm:self-auto">
					Total Kos:{" "}
					<strong className="text-[#29382e] font-bold">
						{properties.length}
					</strong>
				</div>
			</div>

			{/* Grid Content */}
			{isLoading ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="bg-[#f0f4f1] border border-[#e1e8e2] rounded-[20px] p-[22px] min-h-[190px] animate-pulse"
						/>
					))}
				</div>
			) : queryError ? (
				<div className="bg-[#fff5f3] border border-[#efd3cf] text-[#a45d55] p-6 rounded-[20px] text-center text-xs">
					{queryError instanceof Error
						? queryError.message
						: "Terjadi kesalahan pada server."}
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{properties.map((prop) => (
						<PropertyCard
							key={prop.id}
							property={prop}
							isLoading={switchingPropertyId === prop.id}
							onEnter={handleCardClick}
							onEdit={handleOpenEdit}
							onDelete={setDeletingProperty}
						/>
					))}
					<AddPropertyCard onClick={handleOpenAdd} />
				</div>
			)}

			{/* Bottom Toolbar */}
			<div className="flex items-center justify-between mt-5 pt-3 border-t border-[#edf1ed]">
				<button
					type="button"
					onClick={handleLogout}
					className="text-[#66806d] hover:text-[#4f6958] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
				>
					<LogOut className="w-3.5 h-3.5" />
					Keluar dari akun
				</button>
				<span className="text-[10px] text-[#98a29a] font-medium">
					{properties.length} properti aktif
				</span>
			</div>

			{/* Modals */}
			<PropertyFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				editingProperty={editingProperty}
				onSubmit={handleFormSubmit}
			/>

			<PropertyDeleteDialog
				property={deletingProperty}
				onOpenChange={(open) => !open && setDeletingProperty(null)}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
