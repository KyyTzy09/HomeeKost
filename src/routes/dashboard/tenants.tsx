import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/tenants")({
	head: () => ({
		meta: [{ title: "Data Penghuni — HomeeKost Management" }],
	}),
	component: TenantsPage,
});

function TenantsPage() {
	return (
		<div>
			<div className="page-head">
				<div>
					<h1>Data Penghuni Kos</h1>
					<p>
						Daftar anak kos aktif, riwayat kontak WhatsApp, dan identitas
						NIK/KTP.
					</p>
				</div>
			</div>
			<div className="empty-state-box">
				Halaman Data Penghuni sedang dalam tahap pengembangan.
			</div>
		</div>
	);
}
