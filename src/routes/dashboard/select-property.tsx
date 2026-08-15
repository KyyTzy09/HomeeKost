import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import type { PropertyItem } from "../../common/types/index.ts";
import type { PropertyFormValues } from "../../common/validations/index.ts";
import {
	AddPropertyCard,
	PropertyCard,
	PropertyDeleteDialog,
	PropertyFormDialog,
} from "../../components/property/index.ts";
import { useSetActiveProperty } from "../../hooks/index.ts";
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
	head: () => ({
		meta: [
			{
				title: "Pilih & Kelola Properti Kos — HomeeKost Management",
			},
		],
	}),
	component: SelectPropertyPage,
});

// ─── Mock Data (akan diganti API call) ─────────────────────────────────────
const MOCK_PROPERTIES: PropertyItem[] = [
	{
		id: "prop-a",
		code: "A",
		name: "Kos A",
		address: "Jl. Kaliurang KM 5, Sleman, Yogyakarta",
		description: "Kos eksklusif 2 lantai dekat kampus UGM",
		bankAccountInfo: "BCA 829102910 a.n Frisda",
		imageUrl: null,
		rooms: 8,
		tenants: 7,
	},
	{
		id: "prop-b",
		code: "B",
		name: "Kos B",
		address: "Jl. Malioboro No. 12, Yogyakarta",
		description: "Kos strategis tengah kota Yogyakarta",
		bankAccountInfo: "Mandiri 13700192839 a.n Frisda",
		imageUrl: null,
		rooms: 10,
		tenants: 8,
	},
	{
		id: "prop-c",
		code: "C",
		name: "Kos C",
		address: "Jl. Solo KM 8, Yogyakarta",
		description: "Kos tenang dengan area parkir luas",
		bankAccountInfo: "BRI 019283910283 a.n Frisda",
		imageUrl: null,
		rooms: 12,
		tenants: 9,
	},
];

// ─── Page Component ─────────────────────────────────────────────────────────
function SelectPropertyPage() {
	const navigate = useNavigate();

	const [properties, setProperties] = useState<PropertyItem[]>(MOCK_PROPERTIES);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Dialog states
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(
		null,
	);
	const [deletingProperty, setDeletingProperty] = useState<PropertyItem | null>(
		null,
	);

	// ─── Helpers ───────────────────────────────────────────────────────────
	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// ─── Handlers ──────────────────────────────────────────────────────────
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
		if (editingProperty) {
			setProperties((prev) =>
				prev.map((p) =>
					p.id === editingProperty.id
						? {
								...p,
								name: values.name,
								address: values.address,
								description: values.description || null,
								bankAccountInfo: values.bankAccountInfo || null,
								imageUrl: imageUrl || values.imageUrl || null,
								rooms: values.totalRooms,
							}
						: p,
				),
			);
			showToast(`Properti "${values.name}" berhasil diperbarui`);
		} else {
			const nextCode =
				values.name.trim().charAt(0).toUpperCase() ||
				String.fromCharCode(65 + (properties.length % 26));

			setProperties((prev) => [
				...prev,
				{
					id: `prop-${Date.now()}`,
					code: nextCode,
					name: values.name,
					address: values.address,
					description: values.description || null,
					bankAccountInfo: values.bankAccountInfo || null,
					imageUrl: imageUrl || values.imageUrl || null,
					rooms: values.totalRooms,
					tenants: 0,
				},
			]);
			showToast(`Properti baru "${values.name}" berhasil ditambahkan`);
		}
	};

	const handleDeleteConfirm = () => {
		if (!deletingProperty) return;
		setProperties((prev) => prev.filter((p) => p.id !== deletingProperty.id));
		showToast(`Properti "${deletingProperty.name}" telah dihapus`);
		setDeletingProperty(null);
	};

	const setActivePropertyMutation = useSetActiveProperty();

	const handleEnterProperty = async (property: PropertyItem) => {
		try {
			await setActivePropertyMutation.mutateAsync({ propertyId: property.id });
		} catch (e) {
			console.error("Gagal memilih properti:", e);
		}
		navigate({ to: "/dashboard" });
	};

	const handleLogout = async () => {
		try {
			await authClient.signOut();
		} catch (err) {
			console.error("Logout error:", err);
		}
		window.location.href = "/login";
	};

	// ─── Render ────────────────────────────────────────────────────────────
	return (
		<div className="p-6 max-w-[980px] mx-auto">
			{/* Toast */}
			<div
				className={`toast ${toastMessage ? "show" : ""}`}
				role="status"
				aria-live="polite"
			>
				{toastMessage}
			</div>

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
					Frisda · Owner
				</div>
			</div>

			{/* Property Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{properties.map((prop) => (
					<PropertyCard
						key={prop.id}
						property={prop}
						onEnter={handleEnterProperty}
						onEdit={handleOpenEdit}
						onDelete={setDeletingProperty}
					/>
				))}
				<AddPropertyCard onClick={handleOpenAdd} />
			</div>

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
