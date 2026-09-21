import { prisma } from "../../db.ts";
import type { PrismaClient } from "../../generated/prisma/client.js";

export interface ResetDataStats {
	deletedTransactions: number;
	deletedInvoices: number;
	deletedContracts: number;
	deletedTenants: number;
	deletedComplaints: number;
	deletedAnnouncements: number;
	deletedNotifications: number;
	deletedAiReports: number;
	resetRoomsCount: number;
}

export class SystemService {
	constructor(private readonly db: PrismaClient = prisma) {}

	/**
	 * Reset seluruh data operasional (transaksi keuangan, tagihan/invoice,
	 * penyewa, kontrak sewa, komplain, pengumuman, dan notifikasi).
	 * Akun pengguna (SuperAdmin/Admin), cabang properti kos, dan nomor kamar
	 * tetap dipertahankan dengan status kamar dikembalikan ke VACANT (Kosong).
	 */
	async resetOperationalData(): Promise<{
		success: boolean;
		message: string;
		stats: ResetDataStats;
	}> {
		return this.db.$transaction(
			async (tx) => {
				// 1. Hapus transaksi arus kas (Income & Expense)
				const { count: deletedTransactions } =
					await tx.transaction.deleteMany();

				// 2. Hapus invoices & kwitansi
				const { count: deletedInvoices } = await tx.invoice.deleteMany();

				// 3. Hapus kontrak sewa aktif & terminasi
				const { count: deletedContracts } =
					await tx.rentalContract.deleteMany();

				// 4. Hapus data penyewa
				const { count: deletedTenants } = await tx.tenant.deleteMany();

				// 5. Hapus log komplain fasilitas
				const { count: deletedComplaints } = await tx.complaint.deleteMany();

				// 6. Hapus pengumuman & broadcast kegiatan
				const { count: deletedAnnouncements } =
					await tx.announcement.deleteMany();

				// 7. Hapus audit notifikasi pesan WhatsApp
				const { count: deletedNotifications } =
					await tx.notificationLog.deleteMany();

				// 8. Hapus arsip laporan AI bulanan
				const { count: deletedAiReports } =
					await tx.aiFinancialReport.deleteMany();

				// 9. Reset seluruh kamar menjadi VACANT (Kosong)
				const { count: resetRoomsCount } = await tx.room.updateMany({
					data: {
						status: "VACANT",
					},
				});

				return {
					success: true,
					message:
						"Semua data transaksi, tagihan, penyewa, dan riwayat operasional berhasil direset ke kondisi bersih.",
					stats: {
						deletedTransactions,
						deletedInvoices,
						deletedContracts,
						deletedTenants,
						deletedComplaints,
						deletedAnnouncements,
						deletedNotifications,
						deletedAiReports,
						resetRoomsCount,
					},
				};
			},
			{
				timeout: 45000,
				maxWait: 15000,
			},
		);
	}
}

export const systemService = new SystemService();
