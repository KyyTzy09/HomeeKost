import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { compareRoomNumbers } from "../../common/helpers/index.ts";
import { Button } from "../../common/shadcn/button.tsx";
import type { RoomItem, RoomStatusType } from "../../common/types/index.ts";
import type { RoomFormValues } from "../../common/validations/index.ts";

import {
	RoomCard,
	RoomDeleteDialog,
	RoomDetailDialog,
	RoomFormDialog,
} from "../../components/room/index.ts";
import {
	roomsQueryOptions,
	useCreateRoom,
	useDashboardContext,
	useDeleteRoom,
	useRooms,
	useUpdateRoom,
} from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/rooms")({
	head: () => ({
		meta: [{ title: "Kamar — HomeeKost Management" }],
	}),
	loader: async ({ context }) => {
		const activePropertyId = context.dashboard?.activeProperty?.id;
		await context.queryClient.ensureQueryData(
			roomsQueryOptions(activePropertyId),
		);
	},
	component: RoomsPage,
});

function RoomsPage() {
	// Active property context
	const { activeProperty } = useDashboardContext();
	const propertyId = activeProperty?.id || "";

	// TanStack Query room hooks
	const {
		data: rooms = [],
		isLoading,
		error: queryError,
	} = useRooms(propertyId) as {
		data: RoomItem[];
		isLoading: boolean;
		error: Error | null;
	};

	const createMutation = useCreateRoom();
	const updateMutation = useUpdateRoom();
	const deleteMutation = useDeleteRoom();

	// Local states for filtering
	const [activeFilter, setActiveFilter] = useState<"all" | RoomStatusType>(
		"all",
	);

	// Dialog states
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

	const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
	const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
	const [roomToDelete, setRoomToDelete] = useState<RoomItem | null>(null);

	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const showError = (msg: string) => {
		setErrorMessage(msg);
		setTimeout(() => setErrorMessage(null), 4000);
	};

	// ─── Filter & Sorting (Direct Scroll without Pagination) ───────────────────
	const sortedRooms = useMemo(() => {
		return [...rooms].sort((a, b) => compareRoomNumbers(a.roomNo, b.roomNo));
	}, [rooms]);

	const filteredRooms = useMemo(() => {
		if (activeFilter === "all") return sortedRooms;
		return sortedRooms.filter((r) => r.status === activeFilter);
	}, [sortedRooms, activeFilter]);

	// Counts
	const totalCount = rooms.length;
	const vacantCount = rooms.filter((r) => r.status === "Kosong").length;
	const occupiedCount = rooms.filter((r) => r.status === "Terisi").length;
	const maintenanceCount = rooms.filter(
		(r) => r.status === "Maintenance",
	).length;

	// ─── Handlers ──────────────────────────────────────────────────────────────
	const handleFilterChange = (filter: "all" | RoomStatusType) => {
		setActiveFilter(filter);
	};

	const handleOpenAdd = () => {
		setEditingRoom(null);
		setIsFormOpen(true);
	};

	const handleOpenDetail = (room: RoomItem) => {
		setSelectedRoom(room);
		setIsDetailOpen(true);
	};

	const handleOpenEdit = (room: RoomItem) => {
		setEditingRoom(room);
		setIsFormOpen(true);
	};

	const handleOpenDelete = (room: RoomItem) => {
		setRoomToDelete(room);
		setIsDeleteOpen(true);
	};

	const handleFormSubmit = (values: RoomFormValues) => {
		if (!propertyId) {
			showError("Pilih properti kos aktif terlebih dahulu.");
			return;
		}

		if (editingRoom) {
			updateMutation.mutate(
				{
					id: editingRoom.id,
					propertyId,
					data: values,
				},
				{
					onSuccess: (updated: RoomItem) => {
						showToast(`Kamar ${updated.roomNo} berhasil diperbarui`);
						setIsFormOpen(false);
						setEditingRoom(null);
					},
					onError: (err: Error) => {
						showError(
							err instanceof Error ? err.message : "Gagal memperbarui kamar",
						);
					},
				},
			);
		} else {
			createMutation.mutate(
				{
					propertyId,
					data: values,
				},
				{
					onSuccess: (created: RoomItem) => {
						showToast(`Kamar ${created.roomNo} berhasil ditambahkan`);
						setIsFormOpen(false);
					},
					onError: (err: Error) => {
						showError(
							err instanceof Error ? err.message : "Gagal menambahkan kamar",
						);
					},
				},
			);
		}
	};

	const handleDeleteConfirm = () => {
		if (!roomToDelete || !propertyId) return;

		deleteMutation.mutate(
			{
				id: roomToDelete.id,
				propertyId,
			},
			{
				onSuccess: () => {
					showToast(`Kamar ${roomToDelete.roomNo} telah dihapus`);
					setIsDeleteOpen(false);
					setRoomToDelete(null);
				},
				onError: (err: Error) => {
					showError(
						err instanceof Error ? err.message : "Gagal menghapus kamar",
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
						{activeProperty?.name || "Pilih Kos"} · Properti Aktif
					</div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Manajemen Kamar
					</h1>
					<p className="text-xs text-[#737873] mt-0.5">
						Kelola ketersediaan unit kamar, tipe fasilitas, harga sewa, dan
						status penghuni.
					</p>
				</div>

				<Button
					type="button"
					className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
					onClick={handleOpenAdd}
				>
					<Plus className="w-4 h-4 mr-1.5" />
					Tambah Kamar
				</Button>
			</div>

			{/* Filter Segmented Buttons */}
			<div className="flex items-center gap-1.5 p-1 bg-[#f0f4f0] border border-[#dce5dd] rounded-xl w-fit">
				<button
					type="button"
					onClick={() => handleFilterChange("all")}
					className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
						activeFilter === "all"
							? "bg-white text-[#252925] shadow-sm border border-[#d5dfd6]"
							: "text-[#737873] hover:text-[#252925]"
					}`}
				>
					Semua ({totalCount})
				</button>
				<button
					type="button"
					onClick={() => handleFilterChange("Terisi")}
					className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
						activeFilter === "Terisi"
							? "bg-white text-[#2b6cb0] shadow-sm border border-[#d5dfd6]"
							: "text-[#737873] hover:text-[#252925]"
					}`}
				>
					Terisi ({occupiedCount})
				</button>
				<button
					type="button"
					onClick={() => handleFilterChange("Kosong")}
					className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
						activeFilter === "Kosong"
							? "bg-white text-[#568062] shadow-sm border border-[#d5dfd6]"
							: "text-[#737873] hover:text-[#252925]"
					}`}
				>
					Kosong ({vacantCount})
				</button>
				<button
					type="button"
					onClick={() => handleFilterChange("Maintenance")}
					className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
						activeFilter === "Maintenance"
							? "bg-white text-[#99773d] shadow-sm border border-[#d5dfd6]"
							: "text-[#737873] hover:text-[#252925]"
					}`}
				>
					Maintenance ({maintenanceCount})
				</button>
			</div>

			{/* Room Cards Grid */}
			{isLoading ? (
				<div className="p-16 bg-white border border-[#e4e9e4] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<Loader2 className="w-7 h-7 text-[#4f6958] animate-spin" />
					<p className="text-xs text-[#737873]">Memuat daftar kamar...</p>
				</div>
			) : queryError ? (
				<div className="p-6 bg-[#fff7f6] border border-[#f5cfcc] rounded-2xl text-xs text-[#a45149]">
					<b className="font-bold block mb-1">Gagal memuat data kamar:</b>
					{queryError instanceof Error
						? queryError.message
						: "Terjadi kesalahan pada server."}
				</div>
			) : filteredRooms.length === 0 ? (
				<div className="p-12 bg-white border border-[#e4e9e4] rounded-2xl text-center shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<p className="text-xs text-[#737873]">
						Tidak ada kamar yang sesuai dengan filter ini.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3 text-xs border-[#e4e9e4]"
						onClick={handleOpenAdd}
					>
						<Plus className="w-3 h-3 mr-1" />
						Tambah Kamar Pertama
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
					{filteredRooms.map((room) => (
						<RoomCard
							key={room.id}
							room={room}
							onDetail={handleOpenDetail}
							onDelete={handleOpenDelete}
						/>
					))}
				</div>
			)}

			{/* Room Count Summary Footer */}
			{filteredRooms.length > 0 && (
				<div className="flex items-center justify-between pt-4 border-t border-[#edf1ed] text-[11px] text-[#737873]">
					<span>
						Menampilkan seluruh <strong className="font-semibold text-[#252925]">{filteredRooms.length}</strong> kamar
						{activeFilter !== "all" && (
							<span className="text-[#4f6958] font-medium ml-1">
								(Filter: {activeFilter})
							</span>
						)}
					</span>
					<span className="text-[10.5px] text-[#8a958d]">
						Total kamar properti: {rooms.length} kamar
					</span>
				</div>
			)}

			{/* Dialog Modals */}
			<RoomFormDialog
				key={editingRoom ? editingRoom.id : "new-room"}
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				editingRoom={editingRoom}
				propertyName={activeProperty?.name || "Kos A"}
				onSubmit={handleFormSubmit}
			/>

			<RoomDetailDialog
				open={isDetailOpen}
				onOpenChange={setIsDetailOpen}
				room={selectedRoom}
				propertyName={activeProperty?.name || "Kos A"}
				onEdit={(room) => {
					setIsDetailOpen(false);
					handleOpenEdit(room);
				}}
				onDelete={(room) => {
					setIsDetailOpen(false);
					handleOpenDelete(room);
				}}
			/>

			<RoomDeleteDialog
				open={isDeleteOpen}
				onOpenChange={setIsDeleteOpen}
				room={roomToDelete}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
