import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Building2,
	Check,
	CheckCircle2,
	LayoutGrid,
	Loader2,
	Plus,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { compareRoomNumbers } from "../../common/helpers/index.ts";
import { Button } from "../../common/shadcn/button.tsx";

import type { RoomItem } from "../../common/types/index.ts";
import type {
	PropertyFormValues,
	RoomFormValues,
} from "../../common/validations/index.ts";
import {
	PropertyDeleteDialog,
	PropertyFormDialog,
} from "../../components/property/index.ts";
import {
	RoomCard,
	RoomDeleteDialog,
	RoomDetailDialog,
	RoomFormDialog,
} from "../../components/room/index.ts";
import {
	propertyDetailQueryOptions,
	roomsQueryOptions,
	useCreateRoom,
	useDeleteProperty,
	useDeleteRoom,
	useProperty,
	useRooms,
	useSetActiveProperty,
	useUpdateProperty,
	useUpdateRoom,
} from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/properties/$propertyId")({
	head: () => ({
		meta: [
			{
				title: "Detail Kos — HomeeKost Management",
			},
		],
	}),
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				propertyDetailQueryOptions(params.propertyId),
			),
			context.queryClient.ensureQueryData(roomsQueryOptions(params.propertyId)),
		]);
	},
	component: PropertyDetailPage,
});

function PropertyDetailPage() {
	const { propertyId } = Route.useParams();
	const navigate = useNavigate();

	// TanStack Query hooks
	const {
		data: property,
		isLoading: isPropLoading,
		error: propError,
	} = useProperty(propertyId);
	const {
		data: rooms = [],
		isLoading: isRoomsLoading,
		error: roomsError,
	} = useRooms(propertyId);

	// Mutations
	const updatePropertyMutation = useUpdateProperty();
	const deletePropertyMutation = useDeleteProperty();
	const createRoomMutation = useCreateRoom();
	const updateRoomMutation = useUpdateRoom();
	const deleteRoomMutation = useDeleteRoom();
	const setActivePropertyMutation = useSetActiveProperty();

	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Dialog states
	const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false);
	const [isDeletePropertyOpen, setIsDeletePropertyOpen] = useState(false);
	const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
	const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);
	const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
	const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
	const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const showError = (msg: string) => {
		setErrorMessage(msg);
		setTimeout(() => setErrorMessage(null), 4000);
	};

	// Handlers
	const handleEnterDashboard = () => {
		if (!property) return;
		setActivePropertyMutation.mutate(
			{ propertyId: property.id },
			{
				onSuccess: () => {
					navigate({ to: "/dashboard" });
				},
			},
		);
	};

	const handleSaveProperty = (
		values: PropertyFormValues,
		imageUrl: string | null,
	) => {
		if (!property) return;
		updatePropertyMutation.mutate(
			{
				id: property.id,
				data: {
					...values,
					imageUrl: imageUrl || values.imageUrl || "",
				},
			},
			{
				onSuccess: (updated) => {
					showToast(`Informasi ${updated.name} berhasil diperbarui`);
					setIsEditPropertyOpen(false);
				},
				onError: (err) => {
					showError(
						err instanceof Error ? err.message : "Gagal memperbarui properti",
					);
				},
			},
		);
	};

	const handleDeleteProperty = () => {
		if (!property) return;
		deletePropertyMutation.mutate(property.id, {
			onSuccess: () => {
				showToast(`Properti ${property.name} telah dihapus`);
				navigate({ to: "/dashboard/select-property" });
			},
			onError: (err) => {
				showError(
					err instanceof Error ? err.message : "Gagal menghapus properti",
				);
			},
		});
	};

	const handleOpenAddRoom = () => {
		setEditingRoom(null);
		setIsRoomFormOpen(true);
	};

	const handleOpenRoomDetail = (room: RoomItem) => {
		setSelectedRoom(room);
		setIsRoomDetailOpen(true);
	};

	const handleSaveRoom = (values: RoomFormValues) => {
		if (!property) return;

		if (editingRoom) {
			updateRoomMutation.mutate(
				{
					id: editingRoom.id,
					propertyId: property.id,
					data: values,
				},
				{
					onSuccess: (updated) => {
						showToast(`Kamar ${updated.roomNo} berhasil diperbarui`);
						setIsRoomFormOpen(false);
						setEditingRoom(null);
					},
					onError: (err) => {
						showError(
							err instanceof Error ? err.message : "Gagal memperbarui kamar",
						);
					},
				},
			);
		} else {
			createRoomMutation.mutate(
				{
					propertyId: property.id,
					data: values,
				},
				{
					onSuccess: (created) => {
						showToast(`Kamar ${created.roomNo} berhasil ditambahkan`);
						setIsRoomFormOpen(false);
					},
					onError: (err) => {
						showError(
							err instanceof Error ? err.message : "Gagal menambahkan kamar",
						);
					},
				},
			);
		}
	};

	const handleConfirmDeleteRoom = () => {
		if (!deletingRoom || !property) return;
		deleteRoomMutation.mutate(
			{
				id: deletingRoom.id,
				propertyId: property.id,
			},
			{
				onSuccess: () => {
					showToast(`Kamar ${deletingRoom.roomNo} telah dihapus`);
					setDeletingRoom(null);
				},
				onError: (err) => {
					showError(
						err instanceof Error ? err.message : "Gagal menghapus kamar",
					);
				},
			},
		);
	};

	const sortedRooms = useMemo(() => {
		return [...rooms].sort((a, b) => compareRoomNumbers(a.roomNo, b.roomNo));
	}, [rooms]);

	if (isPropLoading) {
		return (
			<div className="p-16 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
				<Loader2 className="w-7 h-7 text-[#4f6958] animate-spin" />
				<p className="text-xs text-[#737873]">Memuat detail properti...</p>
			</div>
		);
	}

	if (propError || !property) {
		return (
			<div className="p-6 bg-[#fff7f6] border border-[#f5cfcc] rounded-2xl text-xs text-[#a45149] space-y-3">
				<b className="font-bold block text-sm">Properti tidak ditemukan</b>
				<p>
					{propError instanceof Error
						? propError.message
						: "Properti yang Anda cari tidak tersedia atau telah dihapus."}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => navigate({ to: "/dashboard/select-property" })}
				>
					Kembali ke Daftar Kos
				</Button>
			</div>
		);
	}

	const occupiedCount = sortedRooms.filter((r) => r.status === "Terisi").length;

	return (
		<div className="space-y-6">
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

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-[24px] font-bold text-[#252925] tracking-tight m-0 leading-tight">
						{property.name}
					</h1>
					<p className="text-[12.5px] text-[#737873] m-0 mt-1">
						{property.address}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/dashboard/select-property" })}
						className="h-[38px] px-3.5 rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] hover:bg-[#f3f7f3] text-[12px] font-semibold flex items-center gap-1.5 shadow-xs"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						Kembali
					</Button>
					<Button
						type="button"
						onClick={handleEnterDashboard}
						disabled={setActivePropertyMutation.isPending}
						className="h-[38px] px-4 rounded-[8px] bg-[#4f6958] hover:bg-[#43594b] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs"
					>
						<Check className="w-3.5 h-3.5" />
						{setActivePropertyMutation.isPending
							? "Mengaktifkan..."
							: "Kelola Kos Ini"}
					</Button>
				</div>
			</div>

			{/* Property Detail Card */}
			<div className="bg-white border border-[#e4e9e4] rounded-[14px] p-5 shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
				<div className="flex items-center gap-4">
					<div className="w-14 h-14 rounded-2xl bg-[#eef3ee] text-[#4f6958] flex items-center justify-center font-bold text-xl border border-[#d6dfd7] shrink-0">
						{property.code}
					</div>
					<div>
						<h2 className="text-base font-bold text-[#252925] m-0">
							Informasi Kos
						</h2>
						<p className="text-xs text-[#737873] m-0 mt-1 max-w-lg leading-relaxed">
							{property.description || "Belum ada deskripsi untuk kos ini."}
						</p>
						<div className="flex items-center gap-3 mt-2">
							<span className="text-[11px] font-medium text-[#4f6958] bg-[#f0f5f1] px-2.5 py-0.5 rounded-md">
								Rekening: {property.bankAccountInfo || "Belum diatur"}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#edf1ed]">
					<div className="flex items-center gap-2">
						<LayoutGrid className="w-4 h-4 text-[#8fa594]" />
						<div>
							<span className="text-[10px] text-[#737873] block">
								Total Kamar
							</span>
							<b className="text-sm text-[#252925]">{rooms.length} Kamar</b>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Users className="w-4 h-4 text-[#568062]" />
						<div>
							<span className="text-[10px] text-[#737873] block">
								Kamar Terisi
							</span>
							<b className="text-sm text-[#568062]">{occupiedCount} Penghuni</b>
						</div>
					</div>
					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs border-[#e4e9e4]"
							onClick={() => setIsEditPropertyOpen(true)}
						>
							Edit Kos
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs border-[#efd4d0] text-[#a45149] hover:bg-[#fff5f3]"
							onClick={() => setIsDeletePropertyOpen(true)}
						>
							Hapus
						</Button>
					</div>
				</div>
			</div>

			{/* Room Section Header */}
			<div className="flex items-center justify-between pt-2">
				<div>
					<h3 className="text-base font-bold text-[#252925] m-0 flex items-center gap-2">
						<Building2 className="w-4 h-4 text-[#4f6958]" />
						Daftar Kamar ({rooms.length})
					</h3>
					<p className="text-xs text-[#737873] m-0 mt-0.5">
						Kelola kamar khusus pada cabang {property.name}.
					</p>
				</div>
				<Button
					type="button"
					className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
					onClick={handleOpenAddRoom}
				>
					<Plus className="w-4 h-4 mr-1.5" />
					Tambah Kamar
				</Button>
			</div>

			{/* Room Cards Grid */}
			{isRoomsLoading ? (
				<div className="p-12 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<Loader2 className="w-6 h-6 text-[#4f6958] animate-spin" />
					<p className="text-xs text-[#737873]">Memuat kamar...</p>
				</div>
			) : roomsError ? (
				<div className="p-6 bg-[#fff7f6] border border-[#f5cfcc] rounded-2xl text-xs text-[#a45149]">
					Gagal memuat data kamar.
				</div>
			) : rooms.length === 0 ? (
				<div className="p-12 bg-white border border-[#e4e9e4] rounded-2xl text-center shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<p className="text-xs text-[#737873]">
						Belum ada kamar di {property.name}.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3 text-xs border-[#e4e9e4]"
						onClick={handleOpenAddRoom}
					>
						<Plus className="w-3 h-3 mr-1" />
						Tambah Kamar Pertama
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{sortedRooms.map((room) => (
						<RoomCard
							key={room.id}
							room={room}
							onDetail={handleOpenRoomDetail}
							onDelete={(r) => setDeletingRoom(r)}
						/>
					))}
				</div>
			)}

			{/* Dialog Modals */}
			<PropertyFormDialog
				key={property ? property.id : "property-edit"}
				open={isEditPropertyOpen}
				onOpenChange={setIsEditPropertyOpen}
				editingProperty={property}
				onSubmit={handleSaveProperty}
			/>

			<PropertyDeleteDialog
				property={isDeletePropertyOpen ? property : null}
				onOpenChange={setIsDeletePropertyOpen}
				onConfirm={handleDeleteProperty}
			/>

			<RoomFormDialog
				key={editingRoom ? editingRoom.id : "new-room"}
				open={isRoomFormOpen}
				onOpenChange={setIsRoomFormOpen}
				editingRoom={editingRoom}
				propertyName={property.name}
				onSubmit={handleSaveRoom}
			/>

			<RoomDetailDialog
				open={isRoomDetailOpen}
				onOpenChange={setIsRoomDetailOpen}
				room={selectedRoom}
				propertyName={property.name}
				onEdit={(r) => {
					setEditingRoom(r);
					setIsRoomDetailOpen(false);
					setIsRoomFormOpen(true);
				}}
				onDelete={(r) => {
					setDeletingRoom(r);
					setIsRoomDetailOpen(false);
				}}
			/>

			<RoomDeleteDialog
				open={Boolean(deletingRoom)}
				onOpenChange={(open) => !open && setDeletingRoom(null)}
				room={deletingRoom}
				onConfirm={handleConfirmDeleteRoom}
			/>
		</div>
	);
}
