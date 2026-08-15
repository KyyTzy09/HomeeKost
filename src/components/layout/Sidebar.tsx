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
					className="fixed inset-0 bg-[rgba(28,40,31,0.30)] z-40 md:hidden transition-opacity"
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
				<div className="sidebar-bottom">
					<div
						className="profile-mini cursor-pointer hover:bg-[#f4f8f4] transition-colors rounded-[10px]"
						onClick={handleLogout}
						title="Klik untuk keluar akun"
					>
						<div className="avatar">{initials}</div>
						<div className="flex-1 min-w-0">
							<strong className="truncate block text-[#252925] text-[12px] font-bold">
								{user.name}
							</strong>
							<span className="truncate block text-[11px] text-[#737873]">
								{isSuperAdmin ? "Owner" : "Admin Staf"}
							</span>
						</div>
						<button
							type="button"
							className="text-[10px] text-[#a65f5b] hover:text-[#8a4a46] font-semibold flex items-center gap-1 shrink-0 p-1.5 rounded-[6px] hover:bg-[#faeae8] transition-colors"
							title="Keluar dari akun"
						>
							<LogOut className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Keluar</span>
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
