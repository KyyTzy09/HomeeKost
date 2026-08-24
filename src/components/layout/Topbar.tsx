import { useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	Bell,
	Building,
	Building2,
	Calendar,
	Check,
	ChevronDown,
	CircleDollarSign,
	FileText,
	Home,
	Loader2,
	LogOut,
	Menu,
	Search,
	User,
	Users,
	Wrench,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import type {
	DashboardContextData,
	GlobalSearchResultItem,
	PropertySummary,
} from "../../common/types/index.ts";
import {
	useGlobalSearch,
	useSetActiveProperty,
	useTopbarNotifications,
} from "../../hooks/index.ts";
import { authClient } from "../../lib/auth-client.ts";

interface TopbarProps {
	onToggleSidebar: () => void;
	currentTitle?: string;
	dashboardContext: DashboardContextData;
}

export function Topbar({
	onToggleSidebar,
	currentTitle = "Dashboard",
	dashboardContext,
}: TopbarProps) {
	const navigate = useNavigate();
	const [showNotif, setShowNotif] = useState(false);
	const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [isSwitchingProperty, setIsSwitchingProperty] = useState(false);
	const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());

	const propertyDropdownRef = useRef<HTMLDivElement>(null);
	const userDropdownRef = useRef<HTMLDivElement>(null);
	const notifDropdownRef = useRef<HTMLDivElement>(null);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	const { user, isSuperAdmin, activeProperty, accessibleProperties } =
		dashboardContext;

	const setActivePropertyMutation = useSetActiveProperty();

	// Real-time Queries for Notifications and Global Search
	const { data: rawNotifications = [], isLoading: isNotifsLoading } =
		useTopbarNotifications();
	const { data: searchResults = [], isLoading: isSearching } =
		useGlobalSearch(searchQuery);

	// Filter notifications with local read status
	const notifications = rawNotifications.map((n) => ({
		...n,
		unread: n.unread && !readNotifIds.has(n.id),
	}));

	const unreadCount = notifications.filter((n) => n.unread).length;

	// Close popovers on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (
				propertyDropdownRef.current &&
				!propertyDropdownRef.current.contains(target)
			) {
				setShowPropertyDropdown(false);
			}
			if (
				userDropdownRef.current &&
				!userDropdownRef.current.contains(target)
			) {
				setShowUserDropdown(false);
			}
			if (
				notifDropdownRef.current &&
				!notifDropdownRef.current.contains(target)
			) {
				setShowNotif(false);
			}
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(target)
			) {
				setShowSearchResults(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSelectProperty = async (property: PropertySummary) => {
		if (activeProperty?.id === property.id) {
			setShowPropertyDropdown(false);
			return;
		}

		try {
			setIsSwitchingProperty(true);
			await setActivePropertyMutation.mutateAsync({ propertyId: property.id });
			setShowPropertyDropdown(false);
		} catch (err) {
			console.error("Gagal mengganti cabang kos:", err);
		} finally {
			setIsSwitchingProperty(false);
		}
	};

	const handleLogout = async () => {
		try {
			await authClient.signOut();
		} catch (err) {
			console.error("Error signing out:", err);
		} finally {
			window.location.href = "/login";
		}
	};

	const handleMarkAllRead = () => {
		const allIds = new Set(rawNotifications.map((n) => n.id));
		setReadNotifIds(allIds);
	};

	const handleSearchResultClick = (result: GlobalSearchResultItem) => {
		setShowSearchResults(false);
		setSearchQuery("");
		navigate({ to: result.url });
	};

	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: "HK";

	return (
		<header className="topbar">
			{/* Breadcrumb & Property Switcher */}
			<div className="crumb flex items-center gap-2">
				<button
					className="mobile-menu inline-flex items-center justify-center cursor-pointer"
					id="menuBtn"
					type="button"
					onClick={onToggleSidebar}
					aria-label="Toggle menu sidebar"
				>
					<Menu className="w-5 h-5 text-[#4f6958]" />
				</button>
				<span className="text-[#737873] text-[13px] font-medium hidden sm:inline">
					HomeeKost
				</span>
				<span className="text-[#e4e9e4] mx-1 hidden sm:inline">/</span>
				<b
					id="topTitle"
					className="text-[#252925] text-[14px] font-bold truncate max-w-[140px] sm:max-w-none"
				>
					{currentTitle}
				</b>

				{/* Property Switcher Dropdown */}
				<div className="relative" ref={propertyDropdownRef}>
					<button
						className="property-chip flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f0ea] hover:bg-[#d8e6db] text-[#4f6958] text-[12px] font-semibold transition-colors cursor-pointer border border-[#d2e0d5]"
						id="propertySwitcher"
						type="button"
						onClick={() => {
							if (isSuperAdmin) {
								setShowPropertyDropdown(!showPropertyDropdown);
							}
						}}
						title={
							isSuperAdmin
								? "Klik untuk ganti cabang kos"
								: `Cabang Kos: ${activeProperty?.name || "Ditugaskan"}`
						}
					>
						<span className="property-dot w-2 h-2 rounded-full bg-[#5f896d] animate-pulse"></span>
						<span
							id="selectedPropertyLabel"
							className="truncate max-w-[130px] sm:max-w-[180px]"
						>
							{activeProperty?.name || "Semua Properti"}
						</span>
						{isSuperAdmin && (
							<ChevronDown className="w-3 h-3 text-[#4f6958] opacity-70" />
						)}
					</button>

					{/* SuperAdmin Property Selection Menu */}
					{showPropertyDropdown && isSuperAdmin && (
						<div className="absolute left-0 mt-2 w-64 bg-white border border-[#e4e9e4] rounded-xl shadow-[0_10px_30px_rgba(40,60,45,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
							<div className="px-2 py-1.5 text-[11px] font-bold text-[#737873] uppercase tracking-wider">
								Pilih Cabang Kos
							</div>
							<div className="max-h-56 overflow-y-auto space-y-1 my-1">
								{accessibleProperties.map((prop) => {
									const isActive = activeProperty?.id === prop.id;
									return (
										<button
											key={prop.id}
											type="button"
											disabled={isSwitchingProperty}
											onClick={() => handleSelectProperty(prop)}
											className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
												isActive
													? "bg-[#e8f0ea] text-[#4f6958] font-bold"
													: "hover:bg-[#f3f7f3] text-[#252925]"
											}`}
										>
											<div className="flex items-center gap-2 truncate">
												<Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
												<span className="truncate">{prop.name}</span>
											</div>
											{isActive && (
												<Check className="w-3.5 h-3.5 shrink-0 text-[#4f6958]" />
											)}
										</button>
									);
								})}
							</div>
							<div className="border-t border-[#e4e9e4] pt-1.5 mt-1">
								<button
									type="button"
									onClick={() => {
										setShowPropertyDropdown(false);
										navigate({ to: "/dashboard/select-property" });
									}}
									className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-[#4f6958] hover:bg-[#e8f0ea] transition-colors cursor-pointer"
								>
									<Building2 className="w-3.5 h-3.5" />
									<span>Kelola Semua Cabang Kos</span>
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Top Actions */}
			<div className="top-actions flex items-center gap-2.5">
				{/* Global Search with Live Popup */}
				<div
					className="header-search-wrap relative hidden md:block"
					ref={searchContainerRef}
				>
					<div className="relative flex items-center">
						<Search className="absolute left-2.5 w-3.5 h-3.5 text-[#8a958d] pointer-events-none" />
						<Input
							id="globalSearch"
							value={searchQuery}
							onFocus={() => {
								if (searchQuery.trim().length >= 2) {
									setShowSearchResults(true);
								}
							}}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								if (e.target.value.trim().length >= 2) {
									setShowSearchResults(true);
								} else {
									setShowSearchResults(false);
								}
							}}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setShowSearchResults(false);
								}
							}}
							placeholder="Cari penghuni, kamar, invoice..."
							autoComplete="off"
							className="w-[220px] lg:w-[260px] h-[36px] pl-8 pr-7 text-xs bg-white border-[#e4e9e4] rounded-lg focus-visible:ring-[#8fa594]/20 focus-visible:border-[#8fa594]"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => {
									setSearchQuery("");
									setShowSearchResults(false);
								}}
								className="absolute right-2 text-[#737873] hover:text-[#252925] cursor-pointer"
								aria-label="Bersihkan pencarian"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Live Search Results Dropdown */}
					{showSearchResults && searchQuery.trim().length >= 2 && (
						<div className="absolute left-0 top-[42px] w-[320px] lg:w-[360px] bg-white border border-[#e4e9e4] rounded-xl shadow-[0_12px_36px_rgba(40,60,45,0.15)] p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
							<div className="flex items-center justify-between px-2 py-1 border-b border-[#edf1ed] mb-1.5 text-[11px] font-bold text-[#737873]">
								<span>Hasil Pencarian</span>
								{isSearching && (
									<Loader2 className="w-3 h-3 text-[#4f6958] animate-spin" />
								)}
							</div>

							{isSearching && searchResults.length === 0 ? (
								<div className="p-4 text-center text-xs text-[#737873]">
									<Loader2 className="w-4 h-4 text-[#4f6958] animate-spin mx-auto mb-1" />
									Mencari data...
								</div>
							) : searchResults.length === 0 ? (
								<div className="p-4 text-center text-xs text-[#737873]">
									Tidak ditemukan data untuk "<b>{searchQuery}</b>"
								</div>
							) : (
								<div className="max-h-72 overflow-y-auto space-y-1">
									{searchResults.map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={() => handleSearchResultClick(item)}
											className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f3f7f3] transition-colors text-left cursor-pointer group"
										>
											<div className="flex items-start gap-2.5 min-w-0">
												<div className="w-6 h-6 rounded bg-[#e8f0ea] flex items-center justify-center text-[#4f6958] shrink-0 mt-0.5 group-hover:bg-[#d8e6db]">
													{item.category === "Penghuni" && (
														<Users className="w-3.5 h-3.5" />
													)}
													{item.category === "Kamar" && (
														<Home className="w-3.5 h-3.5" />
													)}
													{item.category === "Invoice" && (
														<FileText className="w-3.5 h-3.5" />
													)}
													{item.category === "Transaksi" && (
														<CircleDollarSign className="w-3.5 h-3.5" />
													)}
													{item.category === "Properti" && (
														<Building className="w-3.5 h-3.5" />
													)}
												</div>
												<div className="truncate">
													<div className="flex items-center gap-1.5">
														<span className="text-xs font-bold text-[#252925] truncate">
															{item.title}
														</span>
														<span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#edf1ed] text-[#4f6958]">
															{item.category}
														</span>
													</div>
													<p className="text-[10px] text-[#737873] truncate">
														{item.subtitle}
													</p>
												</div>
											</div>
											{item.badge && (
												<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#f3f7f3] text-[#4f6958] border border-[#d6dfd7] shrink-0 ml-2">
													{item.badge}
												</span>
											)}
										</button>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Notifications Popover */}
				<div className="relative" ref={notifDropdownRef}>
					<Button
						variant="outline"
						size="icon"
						className="w-[36px] h-[36px] p-0 border-[#e4e9e4] bg-white rounded-lg text-[#4f6958] relative hover:bg-[#f3f7f3] cursor-pointer"
						id="notifBtn"
						title="Notifikasi Operasional"
						type="button"
						onClick={() => setShowNotif(!showNotif)}
					>
						<Bell className="w-4 h-4" />
						{unreadCount > 0 && (
							<span
								className="notif-badge absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#b66b68] ring-2 ring-white animate-pulse"
								id="notifBadge"
							/>
						)}
					</Button>

					{showNotif && (
						<div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#e4e9e4] rounded-xl shadow-[0_12px_36px_rgba(40,60,45,0.15)] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
							<div className="flex items-center justify-between pb-2 border-b border-[#e4e9e4] mb-2">
								<div className="flex items-center gap-1.5">
									<b className="text-xs text-[#252925]">
										Notifikasi Operasional
									</b>
									{unreadCount > 0 && (
										<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#fdeeed] text-[#a45149]">
											{unreadCount} baru
										</span>
									)}
								</div>
								{unreadCount > 0 && (
									<button
										className="text-[10px] text-[#4f6958] font-bold hover:underline cursor-pointer"
										type="button"
										id="markNotifRead"
										onClick={handleMarkAllRead}
									>
										Tandai semua dibaca
									</button>
								)}
							</div>

							{isNotifsLoading ? (
								<div className="p-6 text-center text-xs text-[#737873]">
									<Loader2 className="w-4 h-4 text-[#4f6958] animate-spin mx-auto mb-1.5" />
									Memuat notifikasi...
								</div>
							) : notifications.length === 0 ? (
								<div className="p-6 text-center text-xs text-[#737873]">
									<Check className="w-5 h-5 text-[#5f896d] mx-auto mb-1" />
									Semua operasional aman terkendali. Tidak ada tagihan overdue
									atau komplain tertunda.
								</div>
							) : (
								<div
									id="notifList"
									className="space-y-2 max-h-72 overflow-y-auto"
								>
									{notifications.map((n) => (
										<div
											key={n.id}
											onClick={() => {
												setShowNotif(false);
												navigate({ to: n.route });
											}}
											className={`p-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
												n.unread
													? "bg-[#e8f0ea]/60 border border-[#c6d7c9] hover:bg-[#d8e6db]"
													: "bg-[#faf9f5] border border-[#e4e9e4] hover:bg-[#f3f7f3]"
											}`}
										>
											<div className="flex items-center justify-between mb-1">
												<div className="flex items-center gap-1.5">
													{n.type === "due" && (
														<AlertTriangle className="w-3.5 h-3.5 text-[#b66b68] shrink-0" />
													)}
													{n.type === "birthday" && (
														<Calendar className="w-3.5 h-3.5 text-[#b18a4b] shrink-0" />
													)}
													{n.type === "payment" && (
														<CircleDollarSign className="w-3.5 h-3.5 text-[#5f896d] shrink-0" />
													)}
													{n.type === "complaint" && (
														<Wrench className="w-3.5 h-3.5 text-[#b66b68] shrink-0" />
													)}
													<strong className="text-[11px] text-[#252925]">
														{n.title}
													</strong>
												</div>
												<span className="text-[9px] text-[#737873] shrink-0 font-medium">
													{n.time}
												</span>
											</div>
											<p className="text-[10px] text-[#4c524d] m-0 leading-relaxed">
												{n.desc}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* User Profile Popover */}
				<div className="relative" ref={userDropdownRef}>
					<button
						type="button"
						onClick={() => setShowUserDropdown(!showUserDropdown)}
						className="avatar w-[36px] h-[36px] rounded-lg bg-[#4f6958] text-white flex items-center justify-center font-bold text-xs hover:bg-[#425949] transition-colors cursor-pointer shadow-sm"
						title={user?.name || "Profil Admin"}
					>
						{initials}
					</button>

					{showUserDropdown && (
						<div className="absolute right-0 mt-2 w-56 bg-white border border-[#e4e9e4] rounded-xl shadow-[0_10px_30px_rgba(40,60,45,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
							<div className="px-2.5 py-2 border-b border-[#e4e9e4] mb-1">
								<p className="text-xs font-bold text-[#252925] truncate">
									{user?.name || "Admin"}
								</p>
								<p className="text-[10px] text-[#737873] truncate">
									{user?.email || "admin@homeekost.id"}
								</p>
								<span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-[#e8f0ea] text-[#4f6958]">
									{isSuperAdmin ? "SuperAdmin (Owner)" : "Admin Staf"}
								</span>
							</div>

							<button
								type="button"
								onClick={() => {
									setShowUserDropdown(false);
									navigate({ to: "/dashboard/profile" });
								}}
								className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-[#252925] hover:bg-[#f3f7f3] transition-colors cursor-pointer"
							>
								<User className="w-3.5 h-3.5 text-[#737873]" />
								<span>Profil Saya</span>
							</button>

							{isSuperAdmin && (
								<button
									type="button"
									onClick={() => {
										setShowUserDropdown(false);
										navigate({ to: "/dashboard/users" });
									}}
									className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-[#252925] hover:bg-[#f3f7f3] transition-colors cursor-pointer"
								>
									<Building2 className="w-3.5 h-3.5 text-[#737873]" />
									<span>Kelola Pengguna</span>
								</button>
							)}

							<button
								type="button"
								onClick={handleLogout}
								className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-[#a65f5b] hover:bg-[#f7e9e8] transition-colors cursor-pointer mt-1"
							>
								<LogOut className="w-3.5 h-3.5" />
								<span>Keluar Akun</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
