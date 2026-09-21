import { prisma } from "../../src/db.js";

/**
 * Script Pembersihan & Reset Data Operasional Kos (HomeeKost)
 * Menghapus seluruh data transaksi kas, invoices, penyewa, kontrak sewa,
 * komplain, pengumuman, log notifikasi, dan laporan AI.
 * Tetap mempertahankan akun SuperAdmin (Owner) dan cabang properti kos.
 */
async function runReset() {
	console.log("⚠️  Memulai proses Reset Data Operasional HomeeKost...");
	console.log("-----------------------------------------------------");

	try {
		await prisma.$transaction(
			async (tx) => {
				const { count: deletedTransactions } =
					await tx.transaction.deleteMany();
				console.log(
					`🗑️  Menghapus transaksi keuangan : ${deletedTransactions} data`,
				);

				const { count: deletedInvoices } = await tx.invoice.deleteMany();
				console.log(
					`🗑️  Menghapus invoice/tagihan     : ${deletedInvoices} data`,
				);

				const { count: deletedContracts } =
					await tx.rentalContract.deleteMany();
				console.log(
					`🗑️  Menghapus kontrak sewa aktif  : ${deletedContracts} data`,
				);

				const { count: deletedTenants } = await tx.tenant.deleteMany();
				console.log(
					`🗑️  Menghapus data penyewa kos    : ${deletedTenants} data`,
				);

				const { count: deletedComplaints } = await tx.complaint.deleteMany();
				console.log(
					`🗑️  Menghapus catatan komplain   : ${deletedComplaints} data`,
				);

				const { count: deletedAnnouncements } =
					await tx.announcement.deleteMany();
				console.log(
					`🗑️  Menghapus pengumuman kos     : ${deletedAnnouncements} data`,
				);

				const { count: deletedNotifications } =
					await tx.notificationLog.deleteMany();
				console.log(
					`🗑️  Menghapus log notifikasi WA  : ${deletedNotifications} data`,
				);

				const { count: deletedAiReports } =
					await tx.aiFinancialReport.deleteMany();
				console.log(
					`🗑️  Menghapus arsip laporan AI   : ${deletedAiReports} data`,
				);

				const { count: resetRoomsCount } = await tx.room.updateMany({
					data: {
						status: "VACANT",
					},
				});
				console.log(
					`🔄 Mengembalikan status kamar   : ${resetRoomsCount} kamar menjadi VACANT (Kosong)`,
				);

				return {
					deletedTransactions,
					deletedInvoices,
					deletedContracts,
					deletedTenants,
					resetRoomsCount,
				};
			},
			{
				timeout: 45000,
				maxWait: 15000,
			},
		);

		console.log("-----------------------------------------------------");
		console.log("✅ RESET DATA BERHASIL!");
		console.log(
			"Database kini bersih dan siap digunakan untuk data operasional baru.",
		);
		console.log(
			"Akun SuperAdmin (Owner) dan konfigurasi properti tetap aman terjaga.",
		);
	} catch (error) {
		console.error("❌ Gagal mereset data:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

runReset();
