import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Search, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import type { AppUserRole, UserItem } from "../../common/types/index.ts";

interface UserTableProps {
	data: UserItem[];
	onEditUser: (user: UserItem) => void;
	onDeleteUser: (user: UserItem) => void;
}

const columnHelper = createColumnHelper<UserItem>();

export function UserTable({ data, onEditUser, onDeleteUser }: UserTableProps) {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [roleFilter, setRoleFilter] = useState<"ALL" | AppUserRole>("ALL");

	// Filter data based on search and role
	const filteredData = useMemo(() => {
		return data.filter((u) => {
			const matchesRole =
				roleFilter === "ALL" ||
				(roleFilter === "ADMIN" &&
					(u.role === "ADMIN" || u.role === "SUPER_ADMIN")) ||
				u.role === roleFilter;

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

	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				header: "Nama Pengguna",
				cell: (info) => {
					const name = info.getValue();
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
								<b className="text-xs text-[#252925] block">{name}</b>
								<span className="text-[10px] text-[#737873] block sm:hidden">
									{info.row.original.email}
								</span>
							</div>
						</div>
					);
				},
			}),
			columnHelper.accessor("email", {
				header: "Email Akun",
				cell: (info) => (
					<span className="text-xs text-[#4c524d] font-medium">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("role", {
				header: "Role Akses",
				cell: (info) => {
					const badge = getRoleBadge(info.getValue());
					const Icon = badge.icon;
					return (
						<span
							className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${badge.className}`}
						>
							<Icon className="w-3 h-3" />
							{badge.label}
						</span>
					);
				},
			}),
			columnHelper.accessor("assignedProperty", {
				header: "Penugasan Kos",
				cell: (info) => (
					<span className="text-xs text-[#252925] font-medium">
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("status", {
				header: "Status",
				cell: (info) => {
					const isAktif = info.getValue() === "ACTIVE";
					return (
						<span
							className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
								isAktif
									? "bg-[#e8f2ea] text-[#568062] border border-[#cfe2d3]"
									: "bg-[#f9ebea] text-[#a45149] border border-[#f2cfcd]"
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${
									isAktif ? "bg-[#568062]" : "bg-[#a45149]"
								}`}
							/>
							{isAktif ? "Aktif" : "Nonaktif"}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: "Aksi",
				cell: (info) => {
					const user = info.row.original;
					return (
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								className="text-[11px] font-semibold text-[#4f6958] hover:underline px-1.5 py-0.5"
								onClick={() => onEditUser(user)}
							>
								Edit
							</button>
							{user.role !== "SUPER_ADMIN" && (
								<button
									type="button"
									className="text-[11px] font-semibold text-[#a45149] hover:underline px-1.5 py-0.5"
									onClick={() => onDeleteUser(user)}
								>
									Hapus
								</button>
							)}
						</div>
					);
				},
			}),
		],
		[onDeleteUser, onEditUser],
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
						placeholder="Cari nama, email, atau role..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8 text-xs h-9 border-[#e4e9e4] bg-[#fbfcfb] focus-visible:ring-[#8fa594]"
					/>
				</div>

				{/* Segmented Filter Buttons */}
				<div className="flex items-center p-1 bg-[#f0f4f0] border border-[#dce5dd] rounded-xl self-start sm:self-auto">
					<button
						type="button"
						onClick={() => setRoleFilter("ALL")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
							roleFilter === "ALL"
								? "bg-white text-[#252925] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
						}`}
					>
						Semua
					</button>
					<button
						type="button"
						onClick={() => setRoleFilter("ADMIN")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
							roleFilter === "ADMIN"
								? "bg-white text-[#2b6cb0] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
						}`}
					>
						Admin
					</button>
					<button
						type="button"
						onClick={() => setRoleFilter("STAFF")}
						className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
							roleFilter === "STAFF"
								? "bg-white text-[#4f6958] shadow-sm border border-[#d5dfd6]"
								: "text-[#737873] hover:text-[#252925]"
						}`}
					>
						Staff
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
										className="py-2.5 px-3 text-[11px] font-semibold text-[#737873]"
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
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="hover:bg-[#fbfcfb] transition-colors">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="py-3 px-3 text-xs">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}

						{table.getRowModel().rows.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="py-8 text-center text-xs text-[#737873]"
								>
									Tidak ada data pengguna yang sesuai dengan filter pencarian.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			{table.getPageCount() > 1 && (
				<div className="flex items-center justify-between pt-4 border-t border-[#edf1ed] mt-2">
					<span className="text-[11px] text-[#737873]">
						Menampilkan halaman {table.getState().pagination.pageIndex + 1} dari{" "}
						{table.getPageCount()}
					</span>
					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs border-[#e4e9e4] text-[#252925] disabled:opacity-40"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Sebelumnya
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs border-[#e4e9e4] text-[#252925] disabled:opacity-40"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Berikutnya
						</Button>
					</div>
				</div>
			)}
		</Card>
	);
}
