/**
 * CLI Script: Sinkronisasi Massal Tanggal Tenggat (Due Date) Kontrak & Tagihan
 * [DIKOMENTARI SEMENTARA]
 */

/*
import { systemService } from "../src/data/services/system.service.ts";

async function main() {
	console.log("=========================================================");
	console.log("  HOMEEKOST: SINKRONISASI TANGGAL TENGGAT KONTRAK & INVOICE");
	console.log("=========================================================\n");

	console.log("Sedang memindai seluruh kontrak aktif di database...");
	const result = await systemService.syncContractAndInvoiceDueDates();

	console.log(`\n${result.message}\n`);
	console.log(`Total Kontrak Aktif Diperiksa: ${result.stats.totalActiveContracts}`);
	console.log(`Kontrak yang Diperbarui:       ${result.stats.contractsUpdated}`);
	console.log(`Invoice yang Diperbarui:       ${result.stats.invoicesUpdated}\n`);

	if (result.stats.details.length > 0) {
		console.log("Rincian Pembaruan:");
		console.table(
			result.stats.details.map((d) => ({
				Nama: d.tenantName,
				Kamar: d.roomNumber,
				"Mulai Sewa": d.startDate,
				"Tenggat Lama": `Tgl ${d.oldDueDateDay}`,
				"Tenggat Baru": `Tgl ${d.newDueDateDay}`,
				"Invoice Diperbaiki": d.invoicesUpdatedCount,
			})),
		);
	} else {
		console.log("Semua kontrak aktif dan invoice sudah sesuai tanggal mulai sewa (tidak ada yang perlu diubah).");
	}

	console.log("\nSelesai!");
	process.exit(0);
}

main().catch((err) => {
	console.error("\n[Error] Gagal menjalankan sinkronisasi:", err);
	process.exit(1);
});
*/

console.log(
	"Fungsi sinkronisasi massal tanggal tenggat sedang dinonaktifkan sementara (dikomentari).",
);
