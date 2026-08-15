import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, LayoutGrid, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { PropertyItem, RoomItem } from "../../common/types/index.ts";
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
	RoomFormDialog,
} from "../../components/room/index.ts";
import { useSetActiveProperty } from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/properties/$propertyId")({
	head: () => ({
		meta: [
			{
				title: "Detail Kos — HomeeKost Management",
			},
		],
	}),
	component: PropertyDetailPage,
});

// Mock initial properties data matching KostManagement.html
const INITIAL_PROPERTIES: Record<string, PropertyItem> = {
	"prop-a": {
		id: "prop-a",
		code: "A",
		name: "Kos A",
		address: "Jl. Kaliurang KM 5, Sleman, Yogyakarta",
		description: "Kos eksklusif dekat kampus UGM",
		bankAccountInfo: "BCA 1234567890 a.n Frisda",
		imageUrl: null,
		rooms: 8,
		tenants: 7,
	},
	"prop-b": {
		id: "prop-b",
		code: "B",
		name: "Kos B",
		address: "Jl. Malioboro No. 12, Yogyakarta",
		description: "Kos nyaman strategis tengah kota",
		bankAccountInfo: "Mandiri 9876543210 a.n Frisda",
		imageUrl: null,
		rooms: 10,
		tenants: 8,
	},
	"prop-c": {
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
};

// Mock rooms data matching KostManagement.html
const INITIAL_ROOMS: Record<string, RoomItem[]> = {
	"prop-a": [
		{
			id: "r-a1",
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
			id: "r-a2",
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
			id: "r-a3",
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
			id: "r-a4",
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
			id: "r-a5",
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
			id: "r-a6",
			propertyId: "prop-a",
			roomNo: "A-06",
			type: "Standard",
			price: "Rp850.000",
			status: "Maintenance",
			tenantName: null,
			dueDate: null,
			facilities: "Kamar mandi dalam · Wi-Fi",
		},
	],
	"prop-b": [
		{
			id: "r-b1",
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
			id: "r-b2",
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
			id: "r-b4",
			propertyId: "prop-b",
			roomNo: "B-04",
			type: "Standard",
			price: "Rp850.000",
			status: "Maintenance",
			tenantName: null,
			dueDate: null,
			facilities: "Sedang diperbaiki",
		},
	],
	"prop-c": [
		{
			id: "r-c1",
			propertyId: "prop-c",
			roomNo: "C-01",
			type: "Standard",
			price: "Rp950.000",
			status: "Terisi",
			tenantName: "Farhan Hakim",
			dueDate: "05 Agu",
			facilities: "Kamar mandi dalam · Wi-Fi",
		},
	],
};

function PropertyDetailPage() {
	const { propertyId } = Route.useParams();
	const navigate = useNavigate();
	const setActivePropertyMutation = useSetActiveProperty();

	const [property, setProperty] = useState<PropertyItem>(
		INITIAL_PROPERTIES[propertyId] || {
			id: propertyId,
			code: "K",
			name: `Kos (${propertyId})`,
			address: "Alamat belum diatur",
			rooms: 8,
			tenants: 7,
		},
	);

	const [rooms, setRooms] = useState<RoomItem[]>(
		INITIAL_ROOMS[propertyId] || [
			{
				id: "r-default-1",
				propertyId,
				roomNo: "101",
				type: "Standard",
				price: "Rp850.000",
				status: "Terisi",
				tenantName: "Alya Putri",
				facilities: "Kamar mandi dalam · Wi-Fi",
			},
		],
	);

	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Dialog states
	const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false);
	const [isDeletePropertyOpen, setIsDeletePropertyOpen] = useState(false);
	const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
	const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
	const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Handlers
	const handleEnterDashboard = async () => {
		try {
			await setActivePropertyMutation.mutateAsync({ propertyId: property.id });
			showToast(`Mengaktifkan ${property.name}...`);
		} catch (e) {
			console.error("Gagal mengaktifkan cabang kos:", e);
		}
		navigate({ to: "/dashboard" });
	};

	const handleSaveProperty = (
		values: PropertyFormValues,
		imageUrl: string | null,
	) => {
		setProperty((prev) => ({
			...prev,
			name: values.name,
			address: values.address,
			description: values.description,
			bankAccountInfo: values.bankAccountInfo,
			rooms: values.totalRooms,
			imageUrl,
		}));
		showToast(`Informasi ${values.name} berhasil diperbarui`);
	};

	const handleDeleteProperty = () => {
		showToast(`Properti ${property.name} telah dihapus`);
		navigate({ to: "/dashboard/select-property" });
	};

	const handleOpenAddRoom = () => {
		setEditingRoom(null);
		setIsRoomFormOpen(true);
	};

	const handleOpenEditRoom = (room: RoomItem) => {
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
				id: `r-${Date.now()}`,
				propertyId: property.id,
				roomNo: values.roomNo,
				type: values.type,
				price: values.price,
				status: values.status,
				facilities: values.facilities,
			};
			setRooms((prev) => [...prev, newRoom]);
			setProperty((prev) => ({ ...prev, rooms: prev.rooms + 1 }));
			showToast(`Kamar ${values.roomNo} berhasil ditambahkan`);
		}
	};

	const handleConfirmDeleteRoom = () => {
		if (!deletingRoom) return;
		setRooms((prev) => prev.filter((r) => r.id !== deletingRoom.id));
		setProperty((prev) => ({
			...prev,
			rooms: Math.max(0, prev.rooms - 1),
		}));
		showToast(`Kamar ${deletingRoom.roomNo} telah dihapus`);
		setDeletingRoom(null);
	};

	const occupiedCount = rooms.filter((r) => r.status === "Terisi").length;

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
						variant="outline"
						onClick={() => setIsEditPropertyOpen(true)}
						className="h-[38px] px-3.5 rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] hover:bg-[#f3f7f3] text-[12px] font-semibold shadow-xs"
					>
						Edit Kos
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsDeletePropertyOpen(true)}
						className="h-[38px] px-3.5 rounded-[8px] border-[#efd4d0] bg-[#fff5f3] text-[#a45149] hover:bg-[#faeae8] text-[12px] font-semibold shadow-xs"
					>
						Hapus Kos
					</Button>
					<Button
						type="button"
						onClick={handleEnterDashboard}
						className="h-[38px] px-4 rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white text-[12px] font-semibold shadow-xs"
					>
						Buka Dashboard
					</Button>
				</div>
			</div>

			{/* KPI 3 Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
				<div className="card stat">
					<div className="stat-top">
						<span>Total Kamar</span>
						<span className="stat-icon">
							<LayoutGrid className="w-3.5 h-3.5" />
						</span>
					</div>
					<div className="stat-value">{property.rooms}</div>
					<div className="stat-sub text-[11px] text-[#737873]">
						Kamar terdaftar
					</div>
				</div>

				<div className="card stat">
					<div className="stat-top">
						<span>Penghuni</span>
						<span className="stat-icon">
							<Users className="w-3.5 h-3.5" />
						</span>
					</div>
					<div className="stat-value">{occupiedCount}</div>
					<div className="stat-sub text-[11px] text-[#737873]">
						Penghuni aktif
					</div>
				</div>

				<div className="card stat">
					<div className="stat-top">
						<span>Status</span>
						<span className="stat-icon">
							<Check className="w-3.5 h-3.5 text-[#5f896d]" />
						</span>
					</div>
					<div className="stat-value text-[20px] text-[#5f896d]">Aktif</div>
					<div className="stat-sub text-[11px] text-[#737873]">
						Siap beroperasi
					</div>
				</div>
			</div>

			{/* Room Grid Panel */}
			<div className="card panel">
				<div className="panel-head">
					<div>
						<h2>Daftar Kamar</h2>
						<p>Kamar yang terdaftar pada properti ini.</p>
					</div>
					<Button
						type="button"
						onClick={handleOpenAddRoom}
						className="h-[36px] px-3.5 rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white text-[12px] font-semibold"
					>
						+ Tambah Kamar
					</Button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{rooms.map((room) => (
						<RoomCard
							key={room.id}
							room={room}
							onDetail={handleOpenEditRoom}
							onDelete={setDeletingRoom}
						/>
					))}
				</div>
			</div>

			{/* Property Info Panel */}
			<div className="card panel">
				<div className="panel-head">
					<div>
						<h2>Informasi Properti</h2>
						<p>Detail kost yang sedang dipilih.</p>
					</div>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
					<div className="flex flex-col text-sm gap-1 bg-accent/50 border border-primary/20 p-3 rounded-[8px]">
						<span>Nama Kost</span>
						<b>{property.name}</b>
					</div>
					<div className="flex flex-col text-sm gap-1 bg-accent/50 border border-primary/20 p-3 rounded-[8px]">
						<span>Alamat</span>
						<b>{property.address}</b>
					</div>
					<div className="flex flex-col text-sm gap-1 bg-accent/50 border border-primary/20 p-3 rounded-[8px]">
						<span>Jumlah Kamar</span>
						<b>{property.rooms} Kamar</b>
					</div>
					<div className="flex flex-col text-sm gap-1 bg-accent/50 border border-primary/20 p-3 rounded-[8px]">
						<span>Jumlah Penghuni</span>
						<b>{occupiedCount} Penghuni</b>
					</div>
				</div>
			</div>

			{/* Dialogs */}
			<RoomFormDialog
				open={isRoomFormOpen}
				onOpenChange={setIsRoomFormOpen}
				propertyName={property.name}
				editingRoom={editingRoom}
				onSubmit={handleSaveRoom}
			/>

			<RoomDeleteDialog
				open={Boolean(deletingRoom)}
				onOpenChange={(open) => !open && setDeletingRoom(null)}
				room={deletingRoom}
				onConfirm={handleConfirmDeleteRoom}
			/>

			<PropertyFormDialog
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
		</div>
	);
}
