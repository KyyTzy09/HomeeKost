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
	 * agar tanggal jatuh temponya serempak di tanggal 5 bulan berjalan
	 * sesuai SOP operasional kost yang dikonfirmasi oleh pemilik kos.
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
				const targetDueDay = 5;

				for (const contract of contracts) {
					let contractChanged = false;
					let invChangedCount = 0;

					// 1. Perbarui dueDateDay pada kontrak ke tanggal 5 jika belum tanggal 5
					if (contract.dueDateDay !== targetDueDay) {
						await tx.rentalContract.update({
							where: { id: contract.id },
							data: { dueDateDay: targetDueDay },
						});
						contractChanged = true;
						contractsUpdated++;
					}

					// 2. Perbarui seluruh invoice PENDING dan OVERDUE agar jatuh tempo tanggal 5 & status akurat
					for (const inv of contract.invoices) {
						// Jika sudah LUNAS (PAID) atau BATAL (CANCELLED), jangan sentuh statusnya!
						if (inv.status === "PAID" || inv.status === "CANCELLED") continue;

						const invYear = inv.periodYear || inv.dueDate.getFullYear();
						const invMonth = inv.periodMonth
							? inv.periodMonth - 1
							: inv.dueDate.getMonth();
						const correctDueDate = new Date(invYear, invMonth, targetDueDay);

						const todayDate = new Date();
						todayDate.setHours(0, 0, 0, 0);
						const dueDayDate = new Date(correctDueDate);
						dueDayDate.setHours(0, 0, 0, 0);

						const targetStatus: "PENDING" | "OVERDUE" =
							dueDayDate.getTime() < todayDate.getTime() ? "OVERDUE" : "PENDING";

						const isDateDifferent = inv.dueDate.getDate() !== targetDueDay;
						const isStatusDifferent = inv.status !== targetStatus;

						if (isDateDifferent || isStatusDifferent) {
							const updateData: {
								dueDate?: Date;
								invoiceNumber?: string;
								status?: "PENDING" | "OVERDUE";
							} = {};

							if (isDateDifferent) {
								updateData.dueDate = correctDueDate;
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

							if (isStatusDifferent) {
								updateData.status = targetStatus;
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
							startDate: new Date(contract.startDate).toISOString().slice(0, 10),
							oldDueDateDay: contract.dueDateDay,
							newDueDateDay: targetDueDay,
							invoicesUpdatedCount: invChangedCount,
						});
					}
				}

				return {
					success: true,
					message: `Sukses menyinkronkan ${contractsUpdated} kontrak sewa dan ${invoicesUpdated} tagihan invoice serentak ke tanggal 5 bulan berjalan.`,
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
