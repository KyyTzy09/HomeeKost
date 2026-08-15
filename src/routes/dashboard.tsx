import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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

function DashboardLayout() {
	const { dashboard } = Route.useRouteContext();
	const [sidebarOpen, setSidebarOpen] = useState(false);

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
					currentTitle="Dashboard"
					dashboardContext={dashboard}
				/>
				<div className="content" id="mainContent">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
