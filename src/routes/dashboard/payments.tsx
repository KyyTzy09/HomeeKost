import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/payments")({
	head: () => ({
		meta: [{ title: "Pembayaran & Tagihan — HomeeKost Management" }],
	}),
	component: PaymentsPage,
});

function PaymentsPage() {
	return (
		<div>
			<div className="page-head">
				<div>
					<h1>Pembayaran & Penagihan</h1>
					<p>
						Status pembayaran sewa, tagihan jatuh tempo, dan verifikasi mutasi
						kas.
					</p>
				</div>
			</div>
			<div className="empty-state-box">
				Halaman Pembayaran sedang dalam tahap pengembangan.
			</div>
		</div>
	);
}
