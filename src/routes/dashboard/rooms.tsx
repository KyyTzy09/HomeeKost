import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { RoomItem } from "../../common/types/index.ts";
import type { RoomFormValues } from "../../common/validations/index.ts";
import {
	RoomCard,
	RoomDeleteDialog,
	RoomDetailDialog,
	RoomFormDialog,
} from "../../components/room/index.ts";

export const Route = createFileRoute("/dashboard/rooms")({
	head: () => ({
		meta: [{ title: "Kamar — HomeeKost Management" }],
	}),
	component: RoomsPage,
});

// Comprehensive initial room dataset matching KostManagement.html (24 rooms total: 18 Terisi, 6 Kosong, 0 Maintenance)
const INITIAL_ROOMS_DATA: RoomItem[] = [
	{
		id: "rm-1",
		propertyId: "prop-a",
		roomNo: "A-01",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Alya Putri",
		dueDate: "10 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-2",
		propertyId: "prop-a",
		roomNo: "A-02",
		type: "Standard",
		price: "Rp850.000",
		status: "Kosong",
		tenantName: null,
		dueDate: null,
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-3",
		propertyId: "prop-a",
		roomNo: "A-03",
		type: "Deluxe",
		price: "Rp1.200.000",
		status: "Terisi",
		tenantName: "Sarah Anindita",
		dueDate: "15 Agu",
		facilities: "AC · Kamar mandi · Wi-Fi",
	},
	{
		id: "rm-4",
		propertyId: "prop-a",
		roomNo: "A-04",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Rizky Ramadhan",
		dueDate: "18 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-5",
		propertyId: "prop-a",
		roomNo: "A-05",
		type: "Deluxe",
		price: "Rp1.100.000",
		status: "Kosong",
		tenantName: null,
		dueDate: null,
		facilities: "AC · Wi-Fi · Water Heater",
	},
	{
		id: "rm-6",
		propertyId: "prop-a",
		roomNo: "A-06",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Dewi Lestari",
		dueDate: "05 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-7",
		propertyId: "prop-a",
		roomNo: "A-07",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Fira Aulia",
		dueDate: "08 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-8",
		propertyId: "prop-a",
		roomNo: "A-08",
		type: "Suite",
		price: "Rp1.500.000",
		status: "Terisi",
		tenantName: "Budi Santoso",
		dueDate: "22 Agu",
		facilities: "AC · Kamar mandi dalam · TV · Wi-Fi",
	},
	{
		id: "rm-9",
		propertyId: "prop-b",
		roomNo: "B-01",
		type: "Standard",
		price: "Rp900.000",
		status: "Terisi",
		tenantName: "Dinda Maharani",
		dueDate: "20 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-10",
		propertyId: "prop-b",
		roomNo: "B-02",
		type: "Deluxe",
		price: "Rp950.000",
		status: "Terisi",
		tenantName: "Nabila Putri",
		dueDate: "12 Agu",
		facilities: "AC · Wi-Fi · Furnished",
	},
	{
		id: "rm-11",
		propertyId: "prop-b",
		roomNo: "B-03",
		type: "Standard",
		price: "Rp900.000",
		status: "Kosong",
		tenantName: null,
		dueDate: null,
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-12",
		propertyId: "prop-b",
		roomNo: "B-04",
		type: "Standard",
		price: "Rp850.000",
		status: "Maintenance",
		tenantName: null,
		dueDate: null,
		facilities: "Sedang diperbaiki",
	},
	{
		id: "rm-13",
		propertyId: "prop-b",
		roomNo: "B-05",
		type: "Standard",
		price: "Rp900.000",
		status: "Terisi",
		tenantName: "Hendra Wijaya",
		dueDate: "14 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-14",
		propertyId: "prop-b",
		roomNo: "B-06",
		type: "Deluxe",
		price: "Rp1.050.000",
		status: "Terisi",
		tenantName: "Anita Rahma",
		dueDate: "25 Agu",
		facilities: "AC · Wi-Fi · Kamar mandi dalam",
	},
	{
		id: "rm-15",
		propertyId: "prop-b",
		roomNo: "B-07",
		type: "Standard",
		price: "Rp900.000",
		status: "Terisi",
		tenantName: "Reza Pratama",
		dueDate: "03 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-16",
		propertyId: "prop-b",
		roomNo: "B-08",
		type: "Deluxe",
		price: "Rp1.000.000",
		status: "Kosong",
		tenantName: null,
		dueDate: null,
		facilities: "AC · Wi-Fi · Furnished",
	},
	{
		id: "rm-17",
		propertyId: "prop-c",
		roomNo: "C-01",
		type: "Deluxe",
		price: "Rp1.200.000",
		status: "Terisi",
		tenantName: "Sarah Anindita",
		dueDate: "15 Agu",
		facilities: "AC · Kamar mandi · Wi-Fi",
	},
	{
		id: "rm-18",
		propertyId: "prop-c",
		roomNo: "C-02",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Gita Permata",
		dueDate: "11 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-19",
		propertyId: "prop-c",
		roomNo: "C-03",
		type: "Standard",
		price: "Rp850.000",
		status: "Kosong",
		tenantName: null,
		dueDate: null,
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-20",
		propertyId: "prop-c",
		roomNo: "C-04",
		type: "Suite",
		price: "Rp1.600.000",
		status: "Terisi",
		tenantName: "Dimas Anggara",
		dueDate: "09 Agu",
		facilities: "AC · Kitchenette · Wi-Fi · TV",
	},
	{
		id: "rm-21",
		propertyId: "prop-c",
		roomNo: "C-05",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Maya Indah",
		dueDate: "19 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-22",
		propertyId: "prop-c",
		roomNo: "C-06",
		type: "Deluxe",
		price: "Rp1.150.000",
		status: "Terisi",
		tenantName: "Ilham Kurnia",
		dueDate: "28 Agu",
		facilities: "AC · Wi-Fi · Meja Belajar",
	},
	{
		id: "rm-23",
		propertyId: "prop-c",
		roomNo: "C-07",
		type: "Standard",
		price: "Rp850.000",
		status: "Terisi",
		tenantName: "Rina Marlina",
		dueDate: "07 Agu",
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
	{
		id: "rm-24",
		propertyId: "prop-c",
		roomNo: "C-08",
		type: "Standard",
		price: "Rp850.000",
		status: "Kosong",
		tenantName: null,
		dueDate: null,
		facilities: "Kamar mandi dalam · Wi-Fi",
	},
];

const ITEMS_PER_PAGE = 12;

function RoomsPage() {
	const [rooms, setRooms] = useState<RoomItem[]>(INITIAL_ROOMS_DATA);
	const [statusFilter, setStatusFilter] = useState<string>("Semua");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Dialog states
	const [selectedDetailRoom, setSelectedDetailRoom] = useState<RoomItem | null>(
		null,
	);
	const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
	const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
	const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Counts
	const totalCount = rooms.length;
	const occupiedCount = rooms.filter((r) => r.status === "Terisi").length;
	const vacantCount = rooms.filter((r) => r.status === "Kosong").length;
	const maintenanceCount = rooms.filter(
		(r) => r.status === "Maintenance",
	).length;

	// Filtered rooms
	const filteredRooms = useMemo(() => {
		if (statusFilter === "Semua") return rooms;
		return rooms.filter((r) => r.status === statusFilter);
	}, [rooms, statusFilter]);

	// Pagination
	const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE) || 1;
	const paginatedRooms = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredRooms.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredRooms, currentPage]);

	const handleFilterChange = (filter: string) => {
		setStatusFilter(filter);
		setCurrentPage(1);
	};

	// Actions
	const handleOpenAdd = () => {
		setEditingRoom(null);
		setIsRoomFormOpen(true);
	};

	const handleOpenEdit = (room: RoomItem) => {
		setSelectedDetailRoom(null);
		setEditingRoom(room);
		setIsRoomFormOpen(true);
	};

	const handleSaveRoom = (values: RoomFormValues) => {
		if (editingRoom) {
			setRooms((prev) =>
				prev.map((r) =>
					r.id === editingRoom.id
						? {
								...r,
								roomNo: values.roomNo,
								type: values.type,
								price: values.price,
								status: values.status,
								facilities: values.facilities,
							}
						: r,
				),
			);
			showToast(`Kamar ${values.roomNo} berhasil diperbarui`);
		} else {
			const newRoom: RoomItem = {
				id: `rm-${Date.now()}`,
				propertyId: "prop-a",
				roomNo: values.roomNo,
				type: values.type,
				price: values.price,
				status: values.status,
				facilities: values.facilities,
			};
			setRooms((prev) => [newRoom, ...prev]);
			showToast(`Kamar ${values.roomNo} berhasil ditambahkan`);
		}
	};

	const handleConfirmDelete = () => {
		if (!deletingRoom) return;
		setRooms((prev) => prev.filter((r) => r.id !== deletingRoom.id));
		showToast(`Kamar ${deletingRoom.roomNo} telah dihapus`);
		setDeletingRoom(null);
		setSelectedDetailRoom(null);
	};

	return (
		<div className="space-y-6">
			{/* Toast */}
			<div
				className={`toast ${toastMessage ? "show" : ""}`}
				role="status"
				aria-live="polite"
			>
				{toastMessage}
			</div>

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-[24px] font-bold text-[#252925] tracking-tight leading-tight m-0">
						Kamar
					</h1>
					<p className="text-[12.5px] text-[#737873] m-0 mt-1">
						Kelola status dan informasi seluruh kamar HomeeKost.
					</p>
				</div>
				<Button
					type="button"
					onClick={handleOpenAdd}
					className="h-[38px] px-4 rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
				>
					<Plus className="w-4 h-4" />
					Tambah Kamar
				</Button>
			</div>

			{/* Filter Tabs */}
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => handleFilterChange("Semua")}
					className={`h-[34px] px-3.5 rounded-[7px] text-[11px] font-semibold transition-all border cursor-pointer ${
						statusFilter === "Semua"
							? "bg-[#e8f0ea] text-[#4f6958] border-[#d4e2d6] shadow-xs"
							: "bg-white text-[#737873] border-[#e4e9e4] hover:bg-[#f3f7f3] hover:text-[#4f6958]"
					}`}
				>
					Semua · {totalCount}
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("Terisi")}
					className={`h-[34px] px-3.5 rounded-[7px] text-[11px] font-semibold transition-all border cursor-pointer ${
						statusFilter === "Terisi"
							? "bg-[#e8f0ea] text-[#4f6958] border-[#d4e2d6] shadow-xs"
							: "bg-white text-[#737873] border-[#e4e9e4] hover:bg-[#f3f7f3] hover:text-[#4f6958]"
					}`}
				>
					Terisi · {occupiedCount}
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("Kosong")}
					className={`h-[34px] px-3.5 rounded-[7px] text-[11px] font-semibold transition-all border cursor-pointer ${
						statusFilter === "Kosong"
							? "bg-[#e8f0ea] text-[#4f6958] border-[#d4e2d6] shadow-xs"
							: "bg-white text-[#737873] border-[#e4e9e4] hover:bg-[#f3f7f3] hover:text-[#4f6958]"
					}`}
				>
					Kosong · {vacantCount}
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("Maintenance")}
					className={`h-[34px] px-3.5 rounded-[7px] text-[11px] font-semibold transition-all border cursor-pointer ${
						statusFilter === "Maintenance"
							? "bg-[#e8f0ea] text-[#4f6958] border-[#d4e2d6] shadow-xs"
							: "bg-white text-[#737873] border-[#e4e9e4] hover:bg-[#f3f7f3] hover:text-[#4f6958]"
					}`}
				>
					Maintenance · {maintenanceCount}
				</button>
			</div>

			{/* Room Grid */}
			{paginatedRooms.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{paginatedRooms.map((room) => (
						<RoomCard
							key={room.id}
							room={room}
							onDetail={setSelectedDetailRoom}
							onDelete={setDeletingRoom}
						/>
					))}
				</div>
			) : (
				<div className="bg-white border border-[#e4e9e4] rounded-[14px] p-10 text-center text-[#737873] text-[13px] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					Tidak ada kamar dengan status{" "}
					<strong className="text-[#252925]">{statusFilter}</strong>.
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
					<div className="text-[12px] text-[#737873] font-medium">
						Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
						{Math.min(currentPage * ITEMS_PER_PAGE, filteredRooms.length)} dari{" "}
						{filteredRooms.length} kamar
					</div>

					<div className="flex items-center gap-1.5 self-end sm:self-auto">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="h-[34px] px-3 rounded-[8px] border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-[11.5px] font-semibold disabled:opacity-40"
						>
							<ChevronLeft className="w-3.5 h-3.5 mr-1" />
							Sebelumnya
						</Button>

						{Array.from({ length: totalPages }, (_, i) => i + 1).map(
							(pageNum) => (
								<button
									key={pageNum}
									type="button"
									onClick={() => setCurrentPage(pageNum)}
									className={`w-[34px] h-[34px] rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer border ${
										currentPage === pageNum
											? "bg-[#4f6958] text-white border-[#4f6958]"
											: "bg-white text-[#506257] border-[#e4e9e4] hover:bg-[#f3f7f3]"
									}`}
								>
									{pageNum}
								</button>
							),
						)}

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="h-[34px] px-3 rounded-[8px] border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-[11.5px] font-semibold disabled:opacity-40"
						>
							Selanjutnya
							<ChevronRight className="w-3.5 h-3.5 ml-1" />
						</Button>
					</div>
				</div>
			)}

			{/* Room Detail Dialog */}
			<RoomDetailDialog
				open={Boolean(selectedDetailRoom)}
				onOpenChange={(open) => !open && setSelectedDetailRoom(null)}
				room={selectedDetailRoom}
				propertyName="Kos A"
				onEdit={handleOpenEdit}
				onDelete={(room) => {
					setSelectedDetailRoom(null);
					setDeletingRoom(room);
				}}
			/>

			{/* Room Add / Edit Dialog (TanStack Form + Zod) */}
			<RoomFormDialog
				open={isRoomFormOpen}
				onOpenChange={setIsRoomFormOpen}
				propertyName="Kos A"
				editingRoom={editingRoom}
				onSubmit={handleSaveRoom}
			/>

			{/* Room Delete Confirmation Dialog */}
			<RoomDeleteDialog
				open={Boolean(deletingRoom)}
				onOpenChange={(open) => !open && setDeletingRoom(null)}
				room={deletingRoom}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}
