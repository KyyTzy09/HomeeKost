import { Link, useNavigate } from "@tanstack/react-router";
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
import { authClient } from "../../lib/auth-client.ts";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	setCurrentTitle?: (title: string) => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const navigate = useNavigate();

	const handleLogout = async () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem("homeekost_user");
			localStorage.removeItem("active_property_id");
		}
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	const navLinks = [
		{
			to: "/dashboard/select-property",
			label: "Pilih Kos",
			icon: <Building2 className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard",
			label: "Dashboard",
			icon: <LayoutDashboard className="w-[17px] h-[17px]" />,
			exact: true,
		},
		{
			to: "/dashboard/rooms",
			label: "Kamar",
			icon: <BedDouble className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/tenants",
			label: "Penghuni",
			icon: <Users className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/payments",
			label: "Pembayaran",
			icon: <CreditCard className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/invoices",
			label: "Invoice",
			icon: <Receipt className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/finance",
			label: "Keuangan",
			icon: <Wallet className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/engagement",
			label: "Engagement",
			icon: <MessageSquare className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/cctv",
			label: "CCTV",
			icon: <Video className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/reports",
			label: "Laporan & Insight",
			icon: <BarChart3 className="w-[17px] h-[17px]" />,
		},
		{
			to: "/dashboard/users",
			label: "User Management",
			icon: <UserCog className="w-[17px] h-[17px]" />,
		},
	];

	return (
		<>
			{/* Mobile Backdrop */}
			{isOpen && (
				<div
					onClick={onClose}
					className="fixed inset-0 bg-[rgba(28,40,31,0.30)] z-15 md:hidden"
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

				{/* Bottom Area */}
				<div className="sidebar-bottom">
					<div className="help">
						<strong>Bantuan Cepat</strong>
						WhatsApp support siap membantu operasional kos Anda.
					</div>

					<div
						className="profile-mini"
						onClick={handleLogout}
						title="Klik untuk keluar"
					>
						<div className="avatar">BF</div>
						<div className="flex-1 min-w-0">
							<strong className="truncate">Frisda</strong>
							<span className="truncate">SuperAdmin (Owner)</span>
						</div>
						<span className="text-[10px] text-[#a65f5b] font-bold flex items-center gap-1">
							<LogOut className="w-3 h-3" />
							Keluar
						</span>
					</div>
				</div>
			</aside>
		</>
	);
}
