import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	Loader2,
	Plus,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { TenantItem } from "../../common/types/index.ts";
import type { TenantFormValues } from "../../common/validations/index.ts";
import {
	type RoomOption,
	TenantDeleteDialog,
	TenantDetailDialog,
	TenantFormDialog,
	TenantTable,
} from "../../components/tenant/index.ts";
import {
	roomsQueryOptions,
	tenantsQueryOptions,
	useCreateTenant,
	useDashboardContext,
	useDeleteTenant,
	useRooms,
	useTenants,
	useUpdateTenant,
} from "../../hooks/index.ts";
import { parseRupiah } from "../../lib/currency.ts";

export const Route = createFileRoute("/dashboard/tenants")({
	head: () => ({
		meta: [{ title: "Penghuni & Kontrak Sewa — HomeeKost Management" }],
	}),
	loader: async ({ context }) => {
		const activePropertyId = context.dashboard?.activeProperty?.id;
		await Promise.all([
			context.queryClient.ensureQueryData(
				tenantsQueryOptions(activePropertyId),
			),
			context.queryClient.ensureQueryData(roomsQueryOptions(activePropertyId)),
		]);
	},
	component: TenantsPage,
});

function TenantsPage() {
	// Dashboard context for active property
	const { activeProperty } = useDashboardContext();
	const propertyId = activeProperty?.id;
	const propertyName = activeProperty?.name || "Kos A";

	// TanStack Query live data fetching
	const {
		data: tenants = [],
		isLoading: isTenantsLoading,
		error: tenantsError,
	} = useTenants(propertyId);
	const { data: rooms = [] } = useRooms(propertyId);

	// Mutations
	const createTenantMutation = useCreateTenant();
	const updateTenantMutation = useUpdateTenant();
	const deleteTenantMutation = useDeleteTenant();

	// Dialog states
	const [selectedDetailTenant, setSelectedDetailTenant] =
		useState<TenantItem | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
	const [deletingTenant, setDeletingTenant] = useState<TenantItem | null>(null);

	// Derived dynamic room options for combobox (Only display vacant/available rooms, or current room if editing)
	const roomOptions: RoomOption[] = useMemo(() => {
		if (rooms.length === 0) return [];
		const availableRooms = rooms.filter(
			(r) =>
				r.status === "Kosong" ||
				(editingTenant && r.roomNo === editingTenant.roomNo),
		);
		return availableRooms.map((r) => ({
			roomNo: r.roomNo,
			type: (r.type === "Deluxe" || r.type === "Suite" ? r.type : "Standard") as
				| "Standard"
				| "Deluxe"
				| "Suite",
			price: parseRupiah(r.price),
		}));
	}, [rooms, editingTenant]);

	// Filter and search states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showFilterDropdown, setShowFilterDropdown] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3500);
	};

	const showError = (msg: string) => {
		setErrorMessage(msg);
		setTimeout(() => setErrorMessage(null), 4000);
	};

	// Filtered tenants by search query & status filter
	const filteredTenants = useMemo(() => {
		return tenants.filter((t) => {
			const q = searchQuery.toLowerCase().trim();
			const matchSearch =
				!q ||
				t.name.toLowerCase().includes(q) ||
				t.roomNo.toLowerCase().includes(q) ||
				t.nik.includes(q) ||
				t.phone.includes(q);

			const matchStatus =
				statusFilter === "all" || t.paymentStatus === statusFilter;

			return matchSearch && matchStatus;
		});
	}, [tenants, searchQuery, statusFilter]);

	// Handlers
	const handleOpenAdd = () => {
		setEditingTenant(null);
		setIsFormOpen(true);
	};

	const handleOpenEdit = (tenant: TenantItem) => {
		setSelectedDetailTenant(null);
		setEditingTenant(tenant);
		setIsFormOpen(true);
	};

	const handleSaveTenant = (values: TenantFormValues) => {
		if (!propertyId) {
			showError("Pilih cabang kos aktif terlebih dahulu.");
			return;
		}

		if (editingTenant) {
			updateTenantMutation.mutate(
				{
					id: editingTenant.id,
					propertyId,
					data: values,
				},
				{
					onSuccess: (updated) => {
						showToast(`Data penghuni "${updated.name}" berhasil diperbarui`);
						setIsFormOpen(false);
						setEditingTenant(null);
					},
					onError: (err) => {
						showError(
							err instanceof Error
								? err.message
								: "Gagal memperbarui data penghuni",
						);
					},
				},
			);
		} else {
			createTenantMutation.mutate(
				{
					propertyId,
					data: values,
				},
				{
					onSuccess: (created) => {
						showToast(
							`Pendaftaran penghuni "${created.name}" berhasil disimpan`,
						);
						setIsFormOpen(false);
					},
					onError: (err) => {
						showError(
							err instanceof Error
								? err.message
								: "Gagal mendaftarkan penghuni baru",
						);
					},
				},
			);
		}
	};

	const handleConfirmDelete = () => {
		if (!deletingTenant) return;

		deleteTenantMutation.mutate(
			{
				id: deletingTenant.id,
				propertyId,
			},
			{
				onSuccess: () => {
					showToast(
						`Penghuni "${deletingTenant.name}" berhasil di-checkout. Kamar ${deletingTenant.roomNo} telah kembali kosong.`,
					);
					setDeletingTenant(null);
					setSelectedDetailTenant(null);
				},
				onError: (err) => {
					showError(
						err instanceof Error
							? err.message
							: "Gagal memproses check-out penghuni",
					);
				},
			},
		);
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
					<div className="text-[11px] text-[#718078] mb-1 font-medium">
						{propertyName} · Properti Aktif
					</div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight leading-tight m-0">
						Manajemen Penghuni & Kontrak
					</h1>
					<p className="text-xs text-[#737873] m-0 mt-1">
						Data seluruh anak kos, nomor WhatsApp, masa sewa aktif, dan status
						kelancaran tagihan.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						onClick={handleOpenAdd}
						className="h-9 px-4 rounded-lg bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
					>
						<Plus className="w-4 h-4" />
						Tambah Penghuni
					</Button>
				</div>
			</div>

			{/* Main Card Panel with Toolbar & TanStack Table */}
			<div className="bg-white border border-[#e4e9e4] rounded-2xl p-5 shadow-[0_2px_12px_rgba(48,65,53,0.055)] space-y-4">
				{/* Toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					{/* Search */}
					<div className="flex items-center gap-2 h-9 w-full sm:w-72 bg-[#fbfcfb] border border-[#e4e9e4] rounded-lg px-3 text-[#737873]">
						<Search className="w-3.5 h-3.5 shrink-0" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Cari nama, kamar, NIK, atau WA..."
							className="w-full text-xs text-[#252925] placeholder:text-[#737873] outline-none bg-transparent"
						/>
					</div>

					{/* Actions Filter */}
					<div className="flex items-center gap-2">
						{/* Status Dropdown */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowFilterDropdown(!showFilterDropdown)}
								className="h-9 px-3 rounded-lg text-xs font-semibold border border-[#e4e9e4] bg-white text-[#737873] hover:bg-[#f3f7f3] flex items-center gap-1.5 cursor-pointer"
							>
								<span>
									{statusFilter === "all" ? "Semua status" : statusFilter}
								</span>
								<ChevronDown className="w-3 h-3 text-[#8a958d]" />
							</button>

							{showFilterDropdown && (
								<div className="absolute right-0 top-[calc(100%+4px)] min-w-[140px] bg-white border border-[#e4e9e4] rounded-lg shadow-[0_8px_22px_rgba(40,50,43,0.10)] p-1 z-30 space-y-0.5">
									<button
										type="button"
										onClick={() => {
											setStatusFilter("all");
											setShowFilterDropdown(false);
										}}
										className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
											statusFilter === "all"
												? "bg-[#e8f0ea] text-[#4f6958] font-bold"
												: "text-[#59605b] hover:bg-[#f3f7f3]"
										}`}
									>
										Semua status
									</button>
									<button
										type="button"
										onClick={() => {
											setStatusFilter("Lancar");
											setShowFilterDropdown(false);
										}}
										className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
											statusFilter === "Lancar"
												? "bg-[#e8f0ea] text-[#4f6958] font-bold"
												: "text-[#59605b] hover:bg-[#f3f7f3]"
										}`}
									>
										Lancar
									</button>
									<button
										type="button"
										onClick={() => {
											setStatusFilter("Terlambat");
											setShowFilterDropdown(false);
										}}
										className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
											statusFilter === "Terlambat"
												? "bg-[#e8f0ea] text-[#4f6958] font-bold"
												: "text-[#59605b] hover:bg-[#f3f7f3]"
										}`}
									>
										Terlambat
									</button>
								</div>
							)}
						</div>

						{/* Count Badge */}
						<span className="h-9 px-3 rounded-lg text-xs font-semibold border border-[#e4e9e4] bg-[#fbfcfb] text-[#506257] inline-flex items-center">
							{filteredTenants.length} penghuni
						</span>
					</div>
				</div>

				{/* Table or Loading / Error State */}
				{isTenantsLoading ? (
					<div className="p-12 bg-white flex flex-col items-center justify-center gap-2">
						<Loader2 className="w-6 h-6 text-[#4f6958] animate-spin" />
						<p className="text-xs text-[#737873]">
							Memuat data penghuni kos...
						</p>
					</div>
				) : tenantsError ? (
					<div className="p-6 bg-[#fff7f6] border border-[#f5cfcc] rounded-xl text-xs text-[#a45149]">
						<b className="font-bold block mb-1">Gagal memuat data penghuni:</b>
						{tenantsError instanceof Error
							? tenantsError.message
							: "Terjadi kesalahan pada server."}
					</div>
				) : (
					<TenantTable
						data={filteredTenants}
						onDetail={setSelectedDetailTenant}
						onEdit={handleOpenEdit}
						onDelete={setDeletingTenant}
					/>
				)}
			</div>

			{/* Detail Dialog */}
			<TenantDetailDialog
				open={Boolean(selectedDetailTenant)}
				onOpenChange={(open) => !open && setSelectedDetailTenant(null)}
				tenant={selectedDetailTenant}
				propertyName={propertyName}
				onEdit={handleOpenEdit}
				onDelete={(t) => {
					setSelectedDetailTenant(null);
					setDeletingTenant(t);
				}}
			/>

			{/* Form Registration / Edit Dialog (TanStack Form + Zod) */}
			<TenantFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				propertyName={propertyName}
				roomOptions={roomOptions}
				editingTenant={editingTenant}
				onSubmit={handleSaveTenant}
			/>

			{/* Delete Confirmation Dialog */}
			<TenantDeleteDialog
				open={Boolean(deletingTenant)}
				onOpenChange={(open) => !open && setDeletingTenant(null)}
				tenant={deletingTenant}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}
