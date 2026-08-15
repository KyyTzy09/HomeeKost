import { useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import { authClient } from "../../lib/auth-client.ts";

interface TopbarProps {
	onToggleSidebar: () => void;
	currentTitle?: string;
	propertyName?: string;
}

export function Topbar({
	onToggleSidebar,
	currentTitle = "Dashboard",
	propertyName = "Kost Melati Indah",
}: TopbarProps) {
	const navigate = useNavigate();
	const [showNotif, setShowNotif] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const notifications = [
		{
			id: "n1",
			title: "Tagihan Jatuh Tempo",
			desc: "Kamar A-03 (Alya Putri) jatuh tempo dalam 2 hari.",
			time: "10 mnt lalu",
			unread: true,
		},
		{
			id: "n2",
			title: "Pembayaran Diterima",
			desc: "Rp 850.000 dari Dinda Maharani (Kamar A-01).",
			time: "1 jam lalu",
			unread: false,
		},
		{
			id: "n3",
			title: "Ulang Tahun Penghuni",
			desc: "Sarah Anindita (Kamar C-01) ulang tahun besok.",
			time: "2 jam lalu",
			unread: false,
		},
	];

	const handleLogout = async () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem("homeekost_user");
			localStorage.removeItem("active_property_id");
		}
		await authClient.signOut();
		window.location.href = "/login";
	};

	return (
		<header className="topbar">
			{/* Breadcrumb & Property Switcher */}
			<div className="crumb">
				<button
					className="mobile-menu inline-flex items-center justify-center"
					id="menuBtn"
					type="button"
					onClick={onToggleSidebar}
					aria-label="Toggle menu sidebar"
				>
					<Menu className="w-5 h-5" />
				</button>
				<span>HomeeKost</span>
				<span style={{ margin: "0 7px" }}>/</span>
				<b id="topTitle">{currentTitle}</b>
				<button
					className="property-chip"
					id="propertySwitcher"
					type="button"
					onClick={() => navigate({ to: "/select-property" })}
					title="Klik untuk ganti cabang kos"
				>
					<span className="property-dot"></span>
					<span id="selectedPropertyLabel">{propertyName}</span>
					<ChevronDown className="w-3 h-3 ml-0.5" />
				</button>
			</div>

			{/* Top Actions */}
			<div className="top-actions">
				{/* Global Search with Shadcn Input & Lucide Icon */}
				<div className="header-search-wrap">
					<div className="relative flex items-center">
						<Search className="absolute left-2.5 w-3.5 h-3.5 text-[#9aa09b] pointer-events-none" />
						<Input
							id="globalSearch"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Cari penghuni, kamar, invoice..."
							autoComplete="off"
							className="w-[230px] h-[37px] pl-8 text-xs bg-white border-[#e4e9e4] rounded-[8px] focus-visible:ring-[#8fa594]/20 focus-visible:border-[#8fa594]"
						/>
					</div>
				</div>

				{/* Notifications Popover */}
				<div className="header-pop-wrap" style={{ position: "relative" }}>
					<Button
						variant="outline"
						size="icon"
						className="w-[37px] h-[37px] p-0 border-[#e4e9e4] bg-white rounded-[8px] text-[#626a63] relative hover:bg-[#f3f7f3]"
						id="notifBtn"
						title="Notifikasi"
						type="button"
						onClick={() => setShowNotif(!showNotif)}
					>
						<Bell className="w-4 h-4" />
						<span className="notif-badge" id="notifBadge" />
					</Button>

					{showNotif && (
						<div className="notif-panel" id="notifPanel">
							<div className="notif-head">
								<b className="text-xs text-[#26372c]">Notifikasi</b>
								<button
									className="row-action text-[10px]"
									type="button"
									id="markNotifRead"
									onClick={() => setShowNotif(false)}
								>
									Tandai dibaca
								</button>
							</div>
							<div id="notifList" className="space-y-2">
								{notifications.map((n) => (
									<div
										key={n.id}
										className={`p-2 rounded-lg text-left text-xs ${
											n.unread
												? "bg-[#f3f7f3] border border-[#dfe7e0]"
												: "bg-white"
										}`}
									>
										<div className="flex items-center justify-between">
											<strong className="text-[11px] text-[#26372c]">
												{n.title}
											</strong>
											<span className="text-[9px] text-[#8a958d]">
												{n.time}
											</span>
										</div>
										<p className="text-[10px] text-[#607066] m-0 mt-0.5">
											{n.desc}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Profile Avatar Top */}
				<div
					className="profile-top top-profile"
					onClick={handleLogout}
					title="Klik untuk keluar akun"
				>
					<div className="avatar">BF</div>
				</div>
			</div>
		</header>
	);
}
