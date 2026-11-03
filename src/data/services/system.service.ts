import { prisma } from "../../db.ts";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { formatDeterministicInvoiceNumber } from "../../lib/invoice-utils.ts";

export interface SyncDueDatesDetail {
	tenantName: string;
	roomNumber: string;
	startDate: string;
	oldDueDateDay: number;
	newDueDateDay: number;
	invoicesUpdatedCount: number;
}

export interface SyncDueDatesResult {
	success: boolean;
	message: string;
	stats: {
		totalActiveContracts: number;
		contractsUpdated: number;
		invoicesUpdated: number;
		details: SyncDueDatesDetail[];
	};
}
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

	/**
	 * Sinkronisasi massal seluruh kontrak sewa aktif dan invoice berjalan
	 * agar tanggal jatuh temponya (dueDateDay & invoice.dueDate) 100% konsisten
	 * mengikuti tanggal mulai sewa (startDate) masing-masing penghuni.
	 */
	async syncContractAndInvoiceDueDates(): Promise<SyncDueDatesResult> {
		return this.db.$transaction(
			async (tx) => {
				const contracts = await tx.rentalContract.findMany({
					where: { status: "ACTIVE" },
					include: {
						room: { include: { property: true } },
						tenant: true,
						invoices: true,
					},
				});

				let contractsUpdated = 0;
				let invoicesUpdated = 0;
				const details: SyncDueDatesDetail[] = [];

				for (const contract of contracts) {
					const startDate = new Date(contract.startDate);
					const correctDueDay = startDate.getDate();
					let contractChanged = false;
					let invChangedCount = 0;

					// 1. Perbarui dueDateDay pada kontrak jika berbeda dari tanggal mulai sewa
					if (contract.dueDateDay !== correctDueDay) {
						await tx.rentalContract.update({
							where: { id: contract.id },
							data: { dueDateDay: correctDueDay },
						});
						contractChanged = true;
						contractsUpdated++;
					}

					// 2. Perbarui seluruh invoice PENDING dan OVERDUE agar tanggalnya sesuai correctDueDay
					for (const inv of contract.invoices) {
						if (inv.status === "CANCELLED") continue;

						const invYear = inv.periodYear || inv.dueDate.getFullYear();
						const invMonth = inv.periodMonth
							? inv.periodMonth - 1
							: inv.dueDate.getMonth();
						const maxDaysInMonth = new Date(
							invYear,
							invMonth + 1,
							0,
						).getDate();
						const safeDueDay = Math.min(correctDueDay, maxDaysInMonth);
						const correctDueDate = new Date(invYear, invMonth, safeDueDay);

						// Cek jika tanggal jatuh tempo berbeda
						if (inv.dueDate.getDate() !== safeDueDay) {
							const updateData: { dueDate: Date; invoiceNumber?: string } = {
								dueDate: correctDueDate,
							};

							// Jika invoice belum lunas, perbarui juga penomoran invoice jika menggunakan format deterministik
							if (inv.status === "PENDING" || inv.status === "OVERDUE") {
								const newInvoiceNum = formatDeterministicInvoiceNumber({
									date: correctDueDate,
									roomNumber: contract.room.roomNumber,
									property: contract.room.property,
								});
								const duplicateCheck = await tx.invoice.findUnique({
									where: { invoiceNumber: newInvoiceNum },
								});
								if (!duplicateCheck || duplicateCheck.id === inv.id) {
									updateData.invoiceNumber = newInvoiceNum;
								}
							}

							await tx.invoice.update({
								where: { id: inv.id },
								data: updateData,
							});
							invChangedCount++;
							invoicesUpdated++;
						}
					}

					if (contractChanged || invChangedCount > 0) {
						details.push({
							tenantName: contract.tenant.name,
							roomNumber: contract.room.roomNumber,
							startDate: startDate.toISOString().slice(0, 10),
							oldDueDateDay: contract.dueDateDay,
							newDueDateDay: correctDueDay,
							invoicesUpdatedCount: invChangedCount,
						});
					}
				}

				return {
					success: true,
					message: `Sukses menyinkronkan ${contractsUpdated} kontrak sewa dan ${invoicesUpdated} tagihan invoice ke tanggal tenggat yang benar.`,
					stats: {
						totalActiveContracts: contracts.length,
						contractsUpdated,
						invoicesUpdated,
						details,
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
