import {
	createFileRoute,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar.tsx";
import { Topbar } from "../components/layout/Topbar.tsx";
import { getDashboardContextServerFn } from "../data/servers/index.ts";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ location }) => {
		const dashboardContext = await getDashboardContextServerFn();
		if (!dashboardContext) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
		return { dashboard: dashboardContext };
	},
	component: DashboardLayout,
});

function getPageTitle(pathname: string): string {
	if (pathname.includes("/dashboard/properties/")) return "Detail Kos";
	if (pathname === "/dashboard/select-property") return "Pilih Kos";
	if (pathname === "/dashboard/rooms") return "Kamar";
	if (pathname === "/dashboard/tenants") return "Penghuni";
	if (pathname === "/dashboard/payments") return "Pembayaran";
	if (pathname === "/dashboard/invoices") return "Invoice";
	if (pathname === "/dashboard/finance") return "Keuangan";
	if (pathname === "/dashboard/engagement") return "Engagement";
	if (pathname === "/dashboard/cctv") return "CCTV";
	if (pathname === "/dashboard/reports") return "Laporan & Insight";
	if (pathname === "/dashboard/users") return "User Management";
	if (pathname === "/dashboard/profile") return "Profil Admin";
	return "Dashboard";
}

function DashboardLayout() {
	const { dashboard } = Route.useRouteContext();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const currentTitle = getPageTitle(pathname);

	return (
		<div className="app">
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				dashboardContext={dashboard}
			/>
			<main className="main">
				<Topbar
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					currentTitle={currentTitle}
					dashboardContext={dashboard}
				/>
				<div className="content" id="mainContent">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
