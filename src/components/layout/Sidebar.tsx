import { Link } from "@tanstack/react-router";
import {
	BarChart3,
	BedDouble,
	Building2,
	CreditCard,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Receipt,
	UserCog,
	Users,
	Video,
	Wallet,
} from "lucide-react";
import type { DashboardContextData } from "../../common/types/index.ts";
import { authClient } from "../../lib/auth-client.ts";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	dashboardContext: DashboardContextData;
}

export function Sidebar({ isOpen, onClose, dashboardContext }: SidebarProps) {
	const { user, isSuperAdmin } = dashboardContext;

	const handleLogout = async () => {
		try {
			await authClient.signOut();
		} catch (err) {
			console.error("Error logging out:", err);
		} finally {
			window.location.href = "/login";
		}
	};

	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: "HK";

	const allNavLinks = [
		{
			to: "/dashboard/select-property",
			label: "Pilih Kos",
			icon: <Building2 className="w-[17px] h-[17px]" />,
			superAdminOnly: true,
		},
		{
			to: "/dashboard",
			label: "Dashboard",
			icon: <LayoutDashboard className="w-[17px] h-[17px]" />,
			exact: true,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/rooms",
			label: "Kamar",
			icon: <BedDouble className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/tenants",
			label: "Penghuni",
			icon: <Users className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/payments",
			label: "Pembayaran",
			icon: <CreditCard className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/invoices",
			label: "Invoice",
			icon: <Receipt className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/finance",
			label: "Keuangan",
			icon: <Wallet className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/engagement",
			label: "Engagement",
			icon: <MessageSquare className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/cctv",
			label: "CCTV",
			icon: <Video className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/reports",
			label: "Laporan & Insight",
			icon: <BarChart3 className="w-[17px] h-[17px]" />,
			superAdminOnly: false,
		},
		{
			to: "/dashboard/users",
			label: "User Management",
			icon: <UserCog className="w-[17px] h-[17px]" />,
			superAdminOnly: true,
		},
	];

	// Filter links based on user role
	const navLinks = allNavLinks.filter((item) => {
		if (item.superAdminOnly && !isSuperAdmin) {
			return false;
		}
		return true;
	});

	return (
		<>
			{/* Mobile Backdrop */}
			{isOpen && (
				<div
					onClick={onClose}
					className="fixed inset-0 bg-[rgba(28,40,31,0.30)] z-40 lg:hidden transition-opacity cursor-pointer"
				/>
			)}

			<aside className={`sidebar ${isOpen ? "open" : ""}`} id="sidebar">
				{/* Brand Header */}
				<div className="brand">
					<img src="/logo.png" alt="HomeeKost Logo" />
				</div>

				{/* Navigation */}
				<nav className="nav">
					{navLinks.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							onClick={onClose}
							activeOptions={{ exact: item.exact ?? false }}
							activeProps={{ className: "active" }}
						>
							<span className="icon">{item.icon}</span>
							<span>{item.label}</span>
						</Link>
					))}
				</nav>

				{/* Bottom Profile Area */}
				<div className="sidebar-bottom pt-2">
					<div className="p-2 rounded-xl border-t border-[#e4e9e4] flex items-center justify-between gap-2 bg-white hover:bg-[#f4f8f4] transition-colors">
						<Link
							to="/dashboard/profile"
							onClick={onClose}
							className="flex items-center gap-2.5 flex-1 min-w-0 group cursor-pointer"
							title="Buka Halaman Profil"
						>
							<div className="avatar w-8 h-8 rounded-full bg-[#dfe9e0] text-[#4f6958] font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-[#d5e4d7] transition-colors">
								{initials}
							</div>
							<div className="flex-1 min-w-0">
								<strong className="truncate block text-[#252925] text-xs font-bold leading-tight group-hover:text-[#4f6958] transition-colors">
									{user.name}
								</strong>
								<span className="truncate block text-[10.5px] text-[#737873]">
									{isSuperAdmin ? "Owner" : "Admin Staf"}
								</span>
							</div>
						</Link>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleLogout();
							}}
							className="text-[#a65f5b] hover:text-[#8a4a46] hover:bg-[#faeae8] p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer"
							title="Keluar dari akun"
						>
							<LogOut className="w-4 h-4" />
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
