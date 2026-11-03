/**
 * CLI Script: Sinkronisasi Massal Tanggal Tenggat Seragam Tanggal 5 (Kontrak & Tagihan)
 *
 * Jalankan di terminal VPS:
 *   bun run scripts/sync-due-dates.ts
 * atau jika via Docker:
 *   sudo docker compose run --rm app bun run scripts/sync-due-dates.ts
 */

import { systemService } from "../src/data/services/system.service.ts";

async function main() {
	console.log("=========================================================");
	console.log("  HOMEEKOST: SINKRONISASI TENGGAT SERAGAM TANGGAL 5 KOST");
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
		console.log("Semua kontrak aktif dan invoice sudah berjatuh tempo tanggal 5 (tidak ada yang perlu diubah).");
	}

	console.log("\nSelesai!");
	process.exit(0);
}

main().catch((err) => {
	console.error("\n[Error] Gagal menjalankan sinkronisasi:", err);
	process.exit(1);
});
