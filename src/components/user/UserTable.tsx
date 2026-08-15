import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	Building2,
	ChevronLeft,
	ChevronRight,
	Edit,
	Mail,
	Search,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import type { AppUserRole, UserItem } from "../../common/types/index.ts";

interface UserTableProps {
	data: UserItem[];
	currentUserId?: string | number;
	currentUserRole?: AppUserRole;
	onEditUser: (user: UserItem) => void;
	onDeleteUser: (user: UserItem) => void;
}

const ROLE_HIERARCHY: Record<AppUserRole, number> = {
	"SUPER_ADMIN": 3,
	"ADMIN": 2,
	"STAFF": 1,
};

const columnHelper = createColumnHelper<UserItem>();

export function UserTable({
	data,
	currentUserId,
	currentUserRole = "STAFF",
	onEditUser,
	onDeleteUser,
}: UserTableProps) {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [roleFilter, setRoleFilter] = useState<"ALL" | AppUserRole>("ALL");

	// Filter data based on search and role
	const filteredData = useMemo(() => {
		return data.filter((u) => {
			const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

			const q = searchQuery.toLowerCase().trim();
			const matchesSearch =
				!q ||
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				u.role.toLowerCase().includes(q) ||
				u.assignedProperty.toLowerCase().includes(q);

			return matchesRole && matchesSearch;
		});
	}, [data, roleFilter, searchQuery]);

	const superAdminCount = data.filter((u) => u.role === "SUPER_ADMIN").length;
	const adminCount = data.filter((u) => u.role === "ADMIN").length;
	const staffCount = data.filter((u) => u.role === "STAFF").length;

	const getRoleBadge = (role: AppUserRole) => {
		switch (role) {
			case "SUPER_ADMIN":
				return {
					label: "SuperAdmin",
					className: "bg-[#e8f0ea] text-[#4f6958] border-[#cfe2d3]",
					icon: ShieldCheck,
				};
			case "ADMIN":
				return {
					label: "Admin Kos",
					className: "bg-[#e6f0fa] text-[#2b6cb0] border-[#c2daf2]",
					icon: UserCheck,
				};
			case "STAFF":
				return {
					label: "Staff Operasional",
					className: "bg-[#f4f7f4] text-[#636c64] border-[#e0e8e1]",
					icon: ShieldAlert,
				};
		}
	};

	const currentLevel = ROLE_HIERARCHY[currentUserRole] ?? 1;

	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				header: "Nama Pengguna",
				cell: (info) => {
					const name = info.getValue();
					const user = info.row.original;
					const isSelf =
						currentUserId !== undefined &&
						String(user.id) === String(currentUserId);

					const initials = name
						.split(" ")
						.map((n) => n[0])
						.join("")
						.slice(0, 2)
						.toUpperCase();

					return (
						<div className="flex items-center gap-2.5">
							<div className="w-7 h-7 rounded-full bg-[#e8f0ea] text-[#4f6958] font-bold text-xs flex items-center justify-center shrink-0 border border-[#cfe2d3]">
								{initials}
							</div>
							<div>
								<div className="flex items-center gap-1.5">
									<b className="text-xs text-[#252925] block">{name}</b>
									{isSelf && (
										<span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#e8f0ea] text-[#4f6958] border border-[#cfe2d3]">
											Akun Anda
										</span>
									)}
								</div>
								<span className="text-[10px] text-[#737873] block sm:hidden">
									{user.email}
								</span>
							</div>
						</div>
					);
				},
			}),
			columnHelper.accessor("email", {
				header: "Email Akun",
				cell: (info) => (
					<div className="flex items-center gap-1.5 text-xs text-[#4c524d]">
						<Mail className="w-3.5 h-3.5 text-[#737873]" />
						<span>{info.getValue()}</span>
					</div>
				),
			}),
			columnHelper.accessor("role", {
				header: "Hak Akses (Role)",
				cell: (info) => {
					const role = info.getValue();
					const badge = getRoleBadge(role);
					const Icon = badge.icon;

					return (
						<span
							className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.className}`}
						>
							<Icon className="w-3 h-3" />
							{badge.label}
						</span>
					);
				},
			}),
			columnHelper.accessor("assignedProperty", {
				header: "Cabang Kos yang Dikelola",
				cell: (info) => (
					<div className="flex items-center gap-1.5 text-xs text-[#252925] font-medium">
						<Building2 className="w-3.5 h-3.5 text-[#4f6958]" />
						<span>{info.getValue()}</span>
					</div>
				),
			}),
			columnHelper.accessor("status", {
				header: "Status",
				cell: (info) => {
					const status = info.getValue();
					const isActive = status === "ACTIVE";

					return (
						<span
							className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${isActive
									? "bg-[#e8f2ea] text-[#568062]"
									: "bg-[#f4f7f4] text-[#737873]"
								}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#568062]" : "bg-[#737873]"
									}`}
							/>
							{isActive ? "Aktif" : "Nonaktif"}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: () => <div className="text-right">Aksi</div>,
				cell: (info) => {
					const user = info.row.original;
					const isSelf =
						currentUserId !== undefined &&
						String(user.id) === String(currentUserId);
					const userLevel = ROLE_HIERARCHY[user.role as AppUserRole] ?? 1;
					const currentLevel = ROLE_HIERARCHY[currentUserRole] ?? 1;
					const isHigherOrEqualRole =
						currentUserRole !== "SUPER_ADMIN" && userLevel >= currentLevel;

					const canEdit = !isSelf && !isHigherOrEqualRole;
					const canDelete = !isSelf && !isHigherOrEqualRole;

					const editTooltip = isSelf
						? "Akun Anda saat ini (tidak dapat diedit melalui tabel ini)"
						: isHigherOrEqualRole
							? "Wewenang tidak mencukupi (Role setara atau lebih tinggi)"
							: "Edit Pengguna";

					const deleteTooltip = isSelf
						? "Anda tidak dapat menghapus akun Anda sendiri"
						: isHigherOrEqualRole
							? "Wewenang tidak mencukupi (Role setara atau lebih tinggi)"
							: "Hapus Pengguna";

					return (
						<div className="flex items-center justify-end gap-1.5">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={!canEdit}
								className={`h-7 w-7 p-0 transition-colors ${canEdit
										? "text-[#737873] hover:text-[#4f6958] hover:bg-[#e8f0ea]"
										: "text-[#b0b8b2] opacity-35 cursor-not-allowed"
									}`}
								onClick={() => canEdit && onEditUser(user)}
								title={editTooltip}
							>
								<Edit className="w-3.5 h-3.5" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={!canDelete}
								className={`h-7 w-7 p-0 transition-colors ${canDelete
										? "text-[#737873] hover:text-[#b66b68] hover:bg-[#f7e9e8]"
										: "text-[#b0b8b2] opacity-35 cursor-not-allowed"
									}`}
								onClick={() => canDelete && onDeleteUser(user)}
								title={deleteTooltip}
							>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
						</div>
					);
				},
			}),
		],
		[currentLevel, currentUserId, currentUserRole, onDeleteUser, onEditUser],
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 5,
			},
		},
	});

	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
			{/* Toolbar (Search & Segmented Pill Filter Container) */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e4e9e4]">
				{/* Search Input */}
				<div className="relative w-full sm:w-72">
					<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737873]" />
					<Input
						placeholder="Cari nama, email, atau cabang kos..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8 text-xs h-9 border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
					/>
				</div>

				{/* Segmented Filter Buttons */}
				<div className="flex items-center p-1 bg-[#f0f4f0] border border-[#dce5dd] rounded-xl self-start sm:self-auto flex-wrap gap-0.5">
					<button
						type="button"
						onClick={() => setRoleFilter("ALL")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${roleFilter === "ALL"
								? "bg-white text-[#252925] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
							}`}
					>
						Semua ({data.length})
					</button>
					<button
						type="button"
						onClick={() => setRoleFilter("SUPER_ADMIN")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${roleFilter === "SUPER_ADMIN"
								? "bg-white text-[#4f6958] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
							}`}
					>
						SuperAdmin ({superAdminCount})
					</button>
					<button
						type="button"
						onClick={() => setRoleFilter("ADMIN")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${roleFilter === "ADMIN"
								? "bg-white text-[#2b6cb0] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
							}`}
					>
						Admin ({adminCount})
					</button>
					<button
						type="button"
						onClick={() => setRoleFilter("STAFF")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${roleFilter === "STAFF"
								? "bg-white text-[#636c64] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
							}`}
					>
						Staff ({staffCount})
					</button>
				</div>
			</div>

			{/* Table Content */}
			<div className="overflow-x-auto mt-2">
				<table className="w-full text-left border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="border-b border-[#edf1ed] bg-[#fbfcfb]"
							>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="py-2.5 px-3 text-[10px] font-semibold text-[#737873] uppercase tracking-wider"
									>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-[#edf1ed]">
						{table.getRowModel().rows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="py-8 text-center text-xs text-[#737873]"
								>
									Tidak ada data pengguna yang sesuai dengan pencarian atau
									filter.
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="hover:bg-[#fbfcfb] transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="py-3 px-3 text-xs">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Table Pagination */}
			{table.getPageCount() > 1 && (
				<div className="flex items-center justify-between pt-4 border-t border-[#edf1ed] mt-3">
					<span className="text-[11px] text-[#737873]">
						Menampilkan {filteredData.length} pengguna
					</span>
					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs border-[#e4e9e4] text-[#252925] disabled:opacity-40"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<ChevronLeft className="w-3.5 h-3.5 mr-1" />
							Sebelumnya
						</Button>
						<span className="text-xs font-semibold text-[#252925] px-2">
							{table.getState().pagination.pageIndex + 1} /{" "}
							{table.getPageCount()}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs border-[#e4e9e4] text-[#252925] disabled:opacity-40"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Berikutnya
							<ChevronRight className="w-3.5 h-3.5 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</Card>
	);
}
