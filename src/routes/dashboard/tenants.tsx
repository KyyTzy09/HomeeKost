import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Plus, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import type { TenantItem } from "../../common/types/index.ts";
import type { TenantFormValues } from "../../common/validations/index.ts";
import {
	TenantDeleteDialog,
	TenantDetailDialog,
	TenantFormDialog,
	TenantTable,
} from "../../components/tenant/index.ts";

export const Route = createFileRoute("/dashboard/tenants")({
	head: () => ({
		meta: [{ title: "Penghuni — HomeeKost Management" }],
	}),
	component: TenantsPage,
});

// Mock Initial Dataset matching KostManagement.html with realistic 16-digit NIKs
const INITIAL_TENANTS: TenantItem[] = [
	{
		id: "t-1",
		propertyId: "prop-a",
		name: "Alya Putri",
		birthDate: "2002-04-12",
		nik: "3201015204020001",
		phone: "6281234567890",
		originAddress: "Jl. Gejayan No. 45, Sleman",
		email: "alya.putri@gmail.com",
		occupationStatus: "Mahasiswa",
		institution: "Universitas Gadjah Mada",
		roomNo: "A-03",
		rent: "Rp850.000",
		duration: "Bulanan",
		startDate: "10 Jan 2026",
		dueDate: "10 Agu",
		vehicle: "AB 1234 XY",
		deposit: "Rp500.000",
		emergencyName: "Bpk. Bambang",
		emergencyRelation: "Ayah",
		emergencyPhone: "6281299887766",
		registrationDate: "2026-01-10",
		notes: "Penghuni ramah dan tertib bayar sewa.",
		paymentStatus: "Lancar",
	},
	{
		id: "t-2",
		propertyId: "prop-c",
		name: "Sarah Anindita",
		birthDate: "2001-08-10",
		nik: "3302015008010002",
		phone: "6281322554412",
		originAddress: "Jl. Kaliurang KM 7, Sleman",
		email: "sarah.anindita@outlook.com",
		occupationStatus: "Karyawan",
		institution: "PT Teknologi Indonesia",
		roomNo: "C-01",
		rent: "Rp1.200.000",
		duration: "Bulanan",
		startDate: "15 Feb 2026",
		dueDate: "15 Agu",
		vehicle: "B 5678 CD",
		deposit: "Rp1.000.000",
		emergencyName: "Ibu Sri",
		emergencyRelation: "Ibu",
		emergencyPhone: "6281388776655",
		registrationDate: "2026-02-15",
		notes: "Ulang tahun tanggal 10 Agustus.",
		paymentStatus: "Lancar",
	},
	{
		id: "t-3",
		propertyId: "prop-a",
		name: "Fira Aulia",
		birthDate: "2003-11-20",
		nik: "3171016011030003",
		phone: "6285799881122",
		originAddress: "Jl. Seturan No. 12, Sleman",
		email: "fira.aulia@gmail.com",
		occupationStatus: "Mahasiswa",
		institution: "Universitas Pembangunan Nasional",
		roomNo: "A-07",
		rent: "Rp850.000",
		duration: "Bulanan",
		startDate: "08 Mar 2026",
		dueDate: "08 Agu",
		vehicle: "AB 4321 ZZ",
		deposit: "Rp500.000",
		emergencyName: "Bpk. Hendra",
		emergencyRelation: "Paman",
		emergencyPhone: "6285711223344",
		registrationDate: "2026-03-08",
		notes: "Perlu follow up tagihan bulan Agustus.",
		paymentStatus: "Terlambat",
	},
	{
		id: "t-4",
		propertyId: "prop-b",
		name: "Nabila Putri",
		birthDate: "2002-06-18",
		nik: "3275015806020004",
		phone: "6282177889900",
		originAddress: "Jl. Palagan Tentara Pelajar No. 8",
		email: "nabila.putri@yahoo.com",
		occupationStatus: "Karyawan",
		institution: "Bank Mandiri Cabang Sudirman",
		roomNo: "B-02",
		rent: "Rp950.000",
		duration: "Bulanan",
		startDate: "12 Apr 2026",
		dueDate: "12 Agu",
		vehicle: "D 9988 EF",
		deposit: "Rp750.000",
		emergencyName: "Ibu Ratna",
		emergencyRelation: "Ibu",
		emergencyPhone: "6282144556677",
		registrationDate: "2026-04-12",
		notes: "Invoice otomatis dijadwalkan.",
		paymentStatus: "Lancar",
	},
	{
		id: "t-5",
		propertyId: "prop-b",
		name: "Dinda Maharani",
		birthDate: "2000-09-25",
		nik: "3578016509000005",
		phone: "6281966221100",
		originAddress: "Jl. Affandi No. 20, Sleman",
		email: "dinda.m@gmail.com",
		occupationStatus: "Karyawan",
		institution: "Agensi Desain Kreatif",
		roomNo: "B-01",
		rent: "Rp900.000",
		duration: "Bulanan",
		startDate: "20 Mei 2026",
		dueDate: "20 Agu",
		vehicle: "AB 8899 GH",
		deposit: "Rp600.000",
		emergencyName: "Bpk. Surya",
		emergencyRelation: "Ayah",
		emergencyPhone: "6281933445566",
		registrationDate: "2026-05-20",
		notes: "Pembayaran selalu tepat waktu.",
		paymentStatus: "Lancar",
	},
	{
		id: "t-6",
		propertyId: "prop-a",
		name: "Rizky Ramadhan",
		birthDate: "2002-01-15",
		nik: "3201011501020006",
		phone: "6281288991122",
		originAddress: "Jl. Monjali No. 30, Sleman",
		email: "rizky.ramadhan@gmail.com",
		occupationStatus: "Mahasiswa",
		institution: "Universitas Islam Indonesia",
		roomNo: "A-04",
		rent: "Rp850.000",
		duration: "Bulanan",
		startDate: "18 Jan 2026",
		dueDate: "18 Agu",
		vehicle: "AD 1234 KL",
		deposit: "Rp500.000",
		emergencyName: "Bpk. Rahmat",
		emergencyRelation: "Ayah",
		emergencyPhone: "6281277665544",
		registrationDate: "2026-01-18",
		notes: "",
		paymentStatus: "Lancar",
	},
	{
		id: "t-7",
		propertyId: "prop-a",
		name: "Dewi Lestari",
		birthDate: "2001-12-05",
		nik: "3302014512010007",
		phone: "6281355667788",
		originAddress: "Jl. Magelang KM 5, Sleman",
		email: "dewi.lestari@gmail.com",
		occupationStatus: "Karyawan",
		institution: "Studio Arsitektur Jogja",
		roomNo: "A-06",
		rent: "Rp850.000",
		duration: "Bulanan",
		startDate: "05 Feb 2026",
		dueDate: "05 Agu",
		vehicle: "AB 5544 PQ",
		deposit: "Rp500.000",
		emergencyName: "Ibu Siti",
		emergencyRelation: "Ibu",
		emergencyPhone: "6281311223344",
		registrationDate: "2026-02-05",
		notes: "",
		paymentStatus: "Lancar",
	},
];

function TenantsPage() {
	const [tenants, setTenants] = useState<TenantItem[]>(INITIAL_TENANTS);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showFilterDropdown, setShowFilterDropdown] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Dialog states
	const [selectedDetailTenant, setSelectedDetailTenant] =
		useState<TenantItem | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
	const [deletingTenant, setDeletingTenant] = useState<TenantItem | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Filtered tenants by search query & status filter
	const filteredTenants = useMemo(() => {
		return tenants.filter((t) => {
			const matchSearch =
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.nik.includes(searchQuery);

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
		if (editingTenant) {
			setTenants((prev) =>
				prev.map((t) =>
					t.id === editingTenant.id
						? {
								...t,
								name: values.name,
								birthDate: values.birthDate,
								nik: values.nik,
								phone: values.phone,
								originAddress: values.originAddress,
								email: values.email,
								occupationStatus: values.occupationStatus,
								institution: values.institution,
								roomNo: values.roomNo,
								rent: values.rent,
								duration: values.duration,
								startDate: values.startDate,
								dueDate: values.dueDate,
								vehicle: values.vehicle,
								deposit: values.deposit,
								emergencyName: values.emergencyName,
								emergencyRelation: values.emergencyRelation,
								emergencyPhone: values.emergencyPhone,
								notes: values.notes,
							}
						: t,
				),
			);
			showToast(`Data penghuni "${values.name}" berhasil diperbarui`);
		} else {
			const newTenant: TenantItem = {
				id: `t-${Date.now()}`,
				propertyId: "prop-a",
				name: values.name,
				birthDate: values.birthDate,
				nik: values.nik,
				phone: values.phone,
				originAddress: values.originAddress,
				email: values.email,
				occupationStatus: values.occupationStatus,
				institution: values.institution,
				roomNo: values.roomNo,
				rent: values.rent,
				duration: values.duration,
				startDate: values.startDate,
				dueDate: values.dueDate,
				vehicle: values.vehicle,
				deposit: values.deposit,
				emergencyName: values.emergencyName,
				emergencyRelation: values.emergencyRelation,
				emergencyPhone: values.emergencyPhone,
				registrationDate: values.registrationDate,
				notes: values.notes,
				paymentStatus: "Lancar",
			};
			setTenants((prev) => [newTenant, ...prev]);
			showToast(`Pendaftaran "${values.name}" berhasil disimpan`);
		}
	};

	const handleConfirmDelete = () => {
		if (!deletingTenant) return;
		setTenants((prev) => prev.filter((t) => t.id !== deletingTenant.id));
		showToast(`Penghuni "${deletingTenant.name}" telah dihapus`);
		setDeletingTenant(null);
		setSelectedDetailTenant(null);
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
						Penghuni
					</h1>
					<p className="text-[12.5px] text-[#737873] m-0 mt-1">
						Data penghuni, masa sewa, dan riwayat pembayaran.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleOpenAdd}
						className="h-[38px] px-3.5 rounded-[8px] border-[#e4e9e4] bg-white text-[#252925] hover:bg-[#f3f7f3] text-[12px] font-semibold flex items-center gap-1.5 shadow-xs"
					>
						<UserPlus className="w-3.5 h-3.5 text-[#506257]" />
						Formulir Pendaftaran
					</Button>
					<Button
						type="button"
						onClick={handleOpenAdd}
						className="h-[38px] px-4 rounded-[8px] bg-[#4f6958] hover:bg-[#425949] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
					>
						<Plus className="w-4 h-4" />
						Tambah Penghuni
					</Button>
				</div>
			</div>

			{/* Main Card Panel with Toolbar & TanStack Table */}
			<div className="bg-white border border-[#e4e9e4] rounded-[14px] p-5 shadow-[0_2px_12px_rgba(48,65,53,0.055)] space-y-4">
				{/* Toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					{/* Search */}
					<div className="flex items-center gap-2 h-[36px] w-full sm:w-[260px] bg-white border border-[#e4e9e4] rounded-[8px] px-3 text-[#9aa09b]">
						<Search className="w-3.5 h-3.5 shrink-0" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Cari nama atau nomor kamar..."
							className="w-full text-[11.5px] text-[#252925] placeholder:text-[#9aa09b] outline-none bg-transparent"
						/>
					</div>

					{/* Actions Filter */}
					<div className="flex items-center gap-2">
						{/* Status Dropdown */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowFilterDropdown(!showFilterDropdown)}
								className="h-[34px] px-3 rounded-[7px] text-[11px] font-semibold border border-[#e4e9e4] bg-white text-[#737873] hover:bg-[#f3f7f3] flex items-center gap-1.5 cursor-pointer"
							>
								<span>
									{statusFilter === "all" ? "Semua status" : statusFilter}
								</span>
								<ChevronDown className="w-3 h-3 text-[#8a958d]" />
							</button>

							{showFilterDropdown && (
								<div className="absolute right-0 top-[calc(100%+4px)] min-w-[140px] bg-white border border-[#e4e9e4] rounded-[8px] shadow-[0_8px_22px_rgba(40,50,43,0.10)] p-1 z-30 space-y-0.5">
									<button
										type="button"
										onClick={() => {
											setStatusFilter("all");
											setShowFilterDropdown(false);
										}}
										className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[11px] cursor-pointer transition-colors ${
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
										className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[11px] cursor-pointer transition-colors ${
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
										className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[11px] cursor-pointer transition-colors ${
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
						<span className="h-[34px] px-3 rounded-[7px] text-[11px] font-semibold border border-[#e4e9e4] bg-[#fbfcfb] text-[#506257] inline-flex items-center">
							{filteredTenants.length} penghuni
						</span>
					</div>
				</div>

				{/* Table */}
				<TenantTable
					data={filteredTenants}
					onDetail={setSelectedDetailTenant}
					onEdit={handleOpenEdit}
					onDelete={setDeletingTenant}
				/>
			</div>

			{/* Detail Dialog */}
			<TenantDetailDialog
				open={Boolean(selectedDetailTenant)}
				onOpenChange={(open) => !open && setSelectedDetailTenant(null)}
				tenant={selectedDetailTenant}
				propertyName="Kos A"
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
				propertyName="Kos A"
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
