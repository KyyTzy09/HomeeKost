import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/users")({
	head: () => ({
		meta: [{ title: "Manajemen Pengguna — HomeeKost Management" }],
	}),
	component: UsersPage,
});

function UsersPage() {
	return (
		<div>
			<div className="page-head">
				<div>
					<h1>Manajemen Pengguna & Staf</h1>
					<p>
						Pengaturan akun pengelola kos, hak akses RBAC SuperAdmin dan Admin
						cabang.
					</p>
				</div>
			</div>
			<div className="empty-state-box">
				Halaman Manajemen Pengguna sedang dalam tahap pengembangan.
			</div>
		</div>
	);
}
