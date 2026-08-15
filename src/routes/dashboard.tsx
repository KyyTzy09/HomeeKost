import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
});

function DashboardLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="app">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			<main className="main">
				<Topbar
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					currentTitle="Dashboard"
					propertyName="Kost Melati Indah"
				/>
				<div className="content" id="mainContent">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
