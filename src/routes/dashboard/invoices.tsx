import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/invoices")({
	head: () => ({
		meta: [{ title: "Manajemen Invoice — HomeeKost Management" }],
	}),
	component: InvoicesPage,
});

function InvoicesPage() {
	return (
		<div>
			<div className="page-head">
				<div>
					<h1>Invoice Resmi Kos</h1>
					<p>
						Daftar invoice resmi sewa kos, pengiriman via WhatsApp, dan riwayat
						kwitansi.
					</p>
				</div>
			</div>
			<div className="empty-state-box">
				Halaman Invoice sedang dalam tahap pengembangan.
			</div>
		</div>
	);
}
