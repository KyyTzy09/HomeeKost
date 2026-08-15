import { createFileRoute, redirect } from "@tanstack/react-router";
import { getDashboardContextServerFn } from "../data/servers/index.ts";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const context = await getDashboardContextServerFn();
		if (!context) {
			throw redirect({ to: "/login" });
		}
		if (context.isSuperAdmin && !context.activeProperty) {
			throw redirect({ to: "/dashboard/select-property" });
		}
		throw redirect({ to: "/dashboard" });
	},
	head: () => ({
		meta: [
			{
				title: "Memuat Sesi — HomeeKost Management",
			},
		],
	}),
	component: RootRedirectPage,
});

function RootRedirectPage() {
	return (
		<div className="fixed inset-0 min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center p-6 z-50 select-none">
			<div className="flex flex-col items-center justify-center text-center">
				<div className="w-[180px] max-h-[100px] mb-5 flex items-center justify-center">
					<img
						src="/logo.png"
						alt="HomeeKost Logo"
						className="w-full h-auto max-h-[90px] object-contain animate-pulse"
					/>
				</div>

				<div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#506257] bg-[#eef4ef] border border-[#dce6df] px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(79,105,88,0.06)]">
					<span>Memuat Dashboard HomeeKost...</span>
					<span className="flex items-center gap-1 ml-1 pt-0.5">
						<span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] animate-bounce [animation-delay:-0.3s]" />
						<span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] animate-bounce [animation-delay:-0.15s]" />
						<span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] animate-bounce" />
					</span>
				</div>
			</div>
		</div>
	);
}
