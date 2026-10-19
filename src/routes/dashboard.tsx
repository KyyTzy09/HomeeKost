import {
	createFileRoute,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar.tsx";
import { Topbar } from "../components/layout/Topbar.tsx";
import {
	sessionContextQueryOptions,
	useDashboardContext,
} from "../hooks/index.ts";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ location, context }) => {
		const dashboardContext = await context.queryClient.ensureQueryData(
			sessionContextQueryOptions(),
		);
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
	if (pathname === "/dashboard/reports") return "Laporan & Insight";
	if (pathname === "/dashboard/users") return "User Management";
	if (pathname === "/dashboard/profile") return "Profil Admin";
	return "Dashboard";
}

function DashboardLayout() {
	const { dashboard: staticDashboard } = Route.useRouteContext();
	const liveContext = useDashboardContext();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const currentTitle = getPageTitle(pathname);

	const activeDashboard = {
		user: liveContext.user || staticDashboard.user,
		role: liveContext.role,
		isSuperAdmin: liveContext.isSuperAdmin,
		activeProperty: liveContext.activeProperty,
		accessibleProperties:
			liveContext.accessibleProperties.length > 0
				? liveContext.accessibleProperties
				: staticDashboard.accessibleProperties,
	};

	return (
		<div className="app">
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				dashboardContext={activeDashboard}
			/>
			<main className="main">
				<Topbar
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					currentTitle={currentTitle}
					dashboardContext={activeDashboard}
				/>
				<div className="content" id="mainContent">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
