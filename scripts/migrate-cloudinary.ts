import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { prisma } from "../src/db.ts";

/**
 * ==============================================================================
 * HOMEEKOST — CLOUDINARY ASSET MIGRATION TOOL (UU PDP DATA PRIVACY COMPLIANCE)
 * ==============================================================================
 *
 * Script untuk memindahkan foto KTP (Penyewa) & Foto Properti antar-akun Cloudinary:
 * 1. Menjaga privasi data klien (UU PDP No. 27 Tahun 2022).
 * 2. Non-Destruktif: Tidak pernah menghapus file di akun lama.
 * 3. Otomatis membuat file snapshot backup JSON sebelum menyentuh database.
 * 4. Idempotent: Record yang sudah dipindahkan otomatis dilewati (skip).
 * 5. Dual-Method Ingestion: Remote URL upload + Fallback buffer stream.
 *
 * Penggunaan:
 *   - Preview / Cek Jumlah Data (Dry Run):
 *       bun scripts/migrate-cloudinary.ts --dry-run
 *       npm run migrate:cloudinary -- --dry-run
 *
 *   - Eksekusi Migrasi Riil & Update Database:
 *       bun scripts/migrate-cloudinary.ts --execute
 *       npm run migrate:cloudinary -- --execute
 *
 *   - Restore / Rollback Database jika diperlukan:
 *       bun scripts/migrate-cloudinary.ts --restore=scripts/backups/nama-file.json
 * ==============================================================================
 */

interface CloudinaryConfig {
	cloudName: string;
	apiKey: string;
	apiSecret: string;
	uploadPreset?: string;
}

interface BackupRecord {
	timestamp: string;
	targetCloud: string;
	tenants: Array<{ id: string; name: string; nik: string; oldKtpUrl: string }>;
	properties: Array<{ id: string; name: string; oldImageUrl: string }>;
}

function parseCliArgs() {
	const args = process.argv.slice(2);
	const isDryRun = args.includes("--dry-run");
	const isExecute = args.includes("--execute");

	const restoreArg = args.find((a) => a.startsWith("--restore="));
	const restoreFile = restoreArg ? restoreArg.split("=")[1] : undefined;

	const oldCloudArg = args.find((a) => a.startsWith("--old-cloud="));
	const oldCloud = oldCloudArg ? oldCloudArg.split("=")[1] : undefined;

	const targetCloudArg = args.find((a) => a.startsWith("--target-cloud="));
	const targetCloud = targetCloudArg
		? targetCloudArg.split("=")[1]
		: process.env.CLOUDINARY_CLOUD_NAME;

	const targetApiKeyArg = args.find((a) => a.startsWith("--target-api-key="));
	const targetApiKey = targetApiKeyArg
		? targetApiKeyArg.split("=")[1]
		: process.env.CLOUDINARY_API_KEY;

	const targetApiSecretArg = args.find((a) =>
		a.startsWith("--target-api-secret="),
	);
	const targetApiSecret = targetApiSecretArg
		? targetApiSecretArg.split("=")[1]
		: process.env.CLOUDINARY_API_SECRET;

	const targetPresetArg = args.find((a) => a.startsWith("--target-preset="));
	const targetPreset = targetPresetArg
		? targetPresetArg.split("=")[1]
		: process.env.CLOUDINARY_UPLOAD_PRESET;

	return {
		isDryRun,
		isExecute,
		restoreFile,
		oldCloud,
		targetCloud,
		targetApiKey,
		targetApiSecret,
		targetPreset,
	};
}

function generateSignature(
	params: Record<string, string | number>,
	apiSecret: string,
): string {
	const sortedKeys = Object.keys(params).sort();
	const serialized = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
	return crypto
		.createHash("sha1")
		.update(serialized + apiSecret)
		.digest("hex");
}

async function uploadToCloudinary(
	fileInput: string,
	config: CloudinaryConfig,
	folder: string,
): Promise<{ secure_url: string; public_id: string }> {
	const timestamp = Math.round(Date.now() / 1000);
	const formData = new FormData();
	formData.append("file", fileInput);
	formData.append("timestamp", timestamp.toString());
	formData.append("folder", folder);

	if (config.uploadPreset) {
		formData.append("upload_preset", config.uploadPreset);
	} else if (config.apiKey && config.apiSecret) {
		formData.append("api_key", config.apiKey);
		const signature = generateSignature({ folder, timestamp }, config.apiSecret);
		formData.append("signature", signature);
	} else {
		throw new Error(
			"Kredensial Cloudinary tidak lengkap (butuh API Key & Secret atau Upload Preset).",
		);
	}

	const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
	const res = await fetch(endpoint, {
		method: "POST",
		body: formData,
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Upload error (${res.status}): ${errText}`);
	}

	return (await res.json()) as { secure_url: string; public_id: string };
}

async function uploadWithDualMethod(
	oldUrl: string,
	config: CloudinaryConfig,
	folder: string,
): Promise<string> {
	// Metode 1: Remote URL Ingestion Langsung
	try {
		const res = await uploadToCloudinary(oldUrl, config, folder);
		return res.secure_url;
	} catch (err1) {
		const msg1 = err1 instanceof Error ? err1.message : String(err1);
		console.warn(
			`    ⚠️  Metode 1 (Remote URL) gagal: ${msg1}. Beralih ke Metode 2 (Fetch Buffer)...`,
		);
	}

	// Metode 2: Download buffer via fetch lalu unggah sebagai Base64
	try {
		const fetchRes = await fetch(oldUrl);
		if (!fetchRes.ok) {
			throw new Error(
				`Gagal mengunduh gambar sumber (${fetchRes.status}): ${fetchRes.statusText}`,
			);
		}
		const arrayBuf = await fetchRes.arrayBuffer();
		const mimeType = fetchRes.headers.get("content-type") || "image/jpeg";
		const base64 = Buffer.from(arrayBuf).toString("base64");
		const dataUrl = `data:${mimeType};base64,${base64}`;

		const res = await uploadToCloudinary(dataUrl, config, folder);
		return res.secure_url;
	} catch (err2) {
		throw new Error(
			`Seluruh metode upload gagal: ${err2 instanceof Error ? err2.message : String(err2)}`,
		);
	}
}

async function runRestore(filePath: string) {
	console.log(`\n======================================================`);
	console.log(`🔄 MODE RESTORE / ROLLBACK DATABASE`);
	console.log(`Membaca file cadangan: ${filePath}`);
	console.log(`======================================================\n`);

	const resolved = path.resolve(process.cwd(), filePath);
	const raw = await fs.readFile(resolved, "utf8");
	const backup = JSON.parse(raw) as BackupRecord;

	let tenantRestored = 0;
	for (const t of backup.tenants || []) {
		await prisma.tenant.update({
			where: { id: t.id },
			data: { ktpUrl: t.oldKtpUrl },
		});
		tenantRestored++;
		console.log(`  ↩️  Tenant [${t.name}] dikembalikan ke: ${t.oldKtpUrl}`);
	}

	let propertyRestored = 0;
	for (const p of backup.properties || []) {
		await prisma.property.update({
			where: { id: p.id },
			data: { imageUrl: p.oldImageUrl },
		});
		propertyRestored++;
		console.log(`  ↩️  Property [${p.name}] dikembalikan ke: ${p.oldImageUrl}`);
	}

	console.log(`\n✅ Rollback Selesai!`);
	console.log(`Total Penyewa Dipulihkan : ${tenantRestored}`);
	console.log(`Total Properti Dipulihkan: ${propertyRestored}\n`);
}

async function main() {
	const args = parseCliArgs();

	if (args.restoreFile) {
		await runRestore(args.restoreFile);
		return;
	}

	if (!args.isDryRun && !args.isExecute) {
		console.log(`\n======================================================`);
		console.log(`🛡️  HOMEEKOST — CLOUDINARY DATA MIGRATION TOOL`);
		console.log(`======================================================`);
		console.log(`Silakan tentukan mode eksekusi:`);
		console.log(`  1. Cek & Simulasi (Aman tanpa ubah DB):`);
		console.log(`     bun scripts/migrate-cloudinary.ts --dry-run`);
		console.log(`     npm run migrate:cloudinary -- --dry-run`);
		console.log(``);
		console.log(`  2. Jalankan Migrasi Riil & Update DB:`);
		console.log(`     bun scripts/migrate-cloudinary.ts --execute`);
		console.log(`     npm run migrate:cloudinary -- --execute`);
		console.log(``);
		console.log(`  3. Rollback Database:`);
		console.log(`     bun scripts/migrate-cloudinary.ts --restore=scripts/backups/<file>.json\n`);
		process.exit(0);
	}

	console.log(`\n======================================================`);
	console.log(`🛡️  HOMEEKOST — CLOUDINARY ASSET MIGRATION`);
	console.log(
		`Mode: ${args.isDryRun ? "🔍 DRY-RUN (Hanya Simulasi & Pengecekan)" : "🚀 EKSEKUSI RIIL"}`,
	);
	console.log(`======================================================\n`);

	const targetConfig: CloudinaryConfig = {
		cloudName: args.targetCloud || "",
		apiKey: args.targetApiKey || "",
		apiSecret: args.targetApiSecret || "",
		uploadPreset: args.targetPreset || "",
	};

	if (!targetConfig.cloudName) {
		console.error(
			`❌ Error: CLOUDINARY_CLOUD_NAME target belum ditentukan di .env atau via --target-cloud=<nama>.`,
		);
		process.exit(1);
	}

	console.log(`📌 Target Cloudinary Tujuan : ${targetConfig.cloudName}`);
	console.log(
		`📌 Kredensial Auth         : ${targetConfig.apiKey ? `API Key: ${targetConfig.apiKey.slice(0, 4)}...` : targetConfig.uploadPreset ? `Preset: ${targetConfig.uploadPreset}` : "None"}`,
	);

	// 1. Ambil data dari database
	console.log(`\n📡 Mengambil data dari PostgreSQL...`);
	const allTenants = await prisma.tenant.findMany({
		where: {
			ktpUrl: {
				not: null,
			},
		},
		select: {
			id: true,
			name: true,
			NIK: true,
			ktpUrl: true,
		},
	});

	const allProperties = await prisma.property.findMany({
		where: {
			imageUrl: {
				not: null,
			},
		},
		select: {
			id: true,
			name: true,
			imageUrl: true,
		},
	});

	// Filter hanya yang masih berada di cloud lama (belum di target cloud)
	const pendingTenants = allTenants.filter((t) => {
		if (!t.ktpUrl) return false;
		if (!t.ktpUrl.includes("cloudinary.com")) return false;
		if (args.oldCloud && !t.ktpUrl.includes(`/${args.oldCloud}/`)) return false;
		// Abaikan jika sudah berada di target cloud (idempotent)
		return !t.ktpUrl.includes(`/${targetConfig.cloudName}/`);
	});

	const pendingProperties = allProperties.filter((p) => {
		if (!p.imageUrl) return false;
		if (!p.imageUrl.includes("cloudinary.com")) return false;
		if (args.oldCloud && !p.imageUrl.includes(`/${args.oldCloud}/`))
			return false;
		// Abaikan jika sudah berada di target cloud (idempotent)
		return !p.imageUrl.includes(`/${targetConfig.cloudName}/`);
	});

	console.log(`📊 Hasil Pengecekan Database:`);
	console.log(
		`   • Total Penyewa dengan KTP     : ${allTenants.length} (Menunggu migrasi: ${pendingTenants.length})`,
	);
	console.log(
		`   • Total Properti dengan Foto   : ${allProperties.length} (Menunggu migrasi: ${pendingProperties.length})`,
	);

	if (pendingTenants.length === 0 && pendingProperties.length === 0) {
		console.log(
			`\n✨ Tidak ada aset yang perlu dipindahkan! Seluruh data sudah berada di cloud "${targetConfig.cloudName}" atau tidak ada gambar Cloudinary yang cocok.\n`,
		);
		return;
	}

	// 2. Buat snapshot backup otomatis sebelum melakukan aksi
	const backupDir = path.resolve(process.cwd(), "scripts", "backups");
	await fs.mkdir(backupDir, { recursive: true });
	const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
	const backupFileName = `cloudinary-migration-backup-${timestampStr}.json`;
	const backupFilePath = path.join(backupDir, backupFileName);

	const backupData: BackupRecord = {
		timestamp: new Date().toISOString(),
		targetCloud: targetConfig.cloudName,
		tenants: pendingTenants.map((t) => ({
			id: t.id,
			name: t.name,
			nik: t.NIK,
			oldKtpUrl: t.ktpUrl || "",
		})),
		properties: pendingProperties.map((p) => ({
			id: p.id,
			name: p.name,
			oldImageUrl: p.imageUrl || "",
		})),
	};

	await fs.writeFile(
		backupFilePath,
		JSON.stringify(backupData, null, 2),
		"utf8",
	);
	console.log(`\n💾 Snapshot Backup Otomatis Berhasil Disimpan:`);
	console.log(`   Path: ${backupFilePath}`);
	console.log(
		`   (File ini dapat digunakan untuk rollback kapan saja via --restore)\n`,
	);

	// 3. Jika DRY-RUN: Test 1 sample upload untuk memastikan kredensial cloud baru valid
	if (args.isDryRun) {
		console.log(`🧪 Menjalankan uji koneksi ke Cloudinary target...`);
		const sampleItem =
			pendingTenants[0]?.ktpUrl || pendingProperties[0]?.imageUrl;

		if (sampleItem) {
			try {
				console.log(`   Menguji upload 1 gambar sampel ke cloud baru...`);
				const testRes = await uploadWithDualMethod(
					sampleItem,
					targetConfig,
					"homeekost/test-migration",
				);
				console.log(`   ✅ Uji koneksi SUKSES!`);
				console.log(`   URL sampel baru: ${testRes}`);
			} catch (testErr) {
				console.error(
					`   ❌ Uji koneksi GAGAL: ${testErr instanceof Error ? testErr.message : String(testErr)}`,
				);
				console.error(
					`   Periksa kembali CLOUDINARY_CLOUD_NAME, API Key, dan Secret target Anda di .env!\n`,
				);
				return;
			}
		}

		console.log(`\n======================================================`);
		console.log(`🎉 DRY-RUN SELESAI DENGAN SUKSES!`);
		console.log(`Database TIDAK diubah sama sekali pada mode dry-run.`);
		console.log(`Untuk mengeksekusi migrasi riil, jalankan perintah:`);
		console.log(`  bun scripts/migrate-cloudinary.ts --execute`);
		console.log(`  atau: npm run migrate:cloudinary -- --execute`);
		console.log(`======================================================\n`);
		return;
	}

	// 4. EKSEKUSI RIIL
	console.log(`🚀 MEMULAI PROSES PEMINDAHAN ASSET...`);
	let successCount = 0;
	let failCount = 0;

	// A. Migrasi KTP Penyewa
	for (let i = 0; i < pendingTenants.length; i++) {
		const tenant = pendingTenants[i];
		const prefix = `[KTP ${i + 1}/${pendingTenants.length}]`;
		console.log(`\n${prefix} Penyewa: "${tenant.name}" (NIK: ${tenant.NIK})`);
		console.log(`    URL Lama: ${tenant.ktpUrl}`);

		try {
			const newUrl = await uploadWithDualMethod(
				tenant.ktpUrl as string,
				targetConfig,
				"homeekost/ktp",
			);

			// Update Database HANYA jika upload sukses
			await prisma.tenant.update({
				where: { id: tenant.id },
				data: { ktpUrl: newUrl },
			});

			console.log(`    ✅ Berhasil dipindahkan & DB di-update!`);
			console.log(`    URL Baru: ${newUrl}`);
			successCount++;
		} catch (err) {
			failCount++;
			console.error(
				`    ❌ GAGAL: ${err instanceof Error ? err.message : String(err)}`,
			);
			console.error(
				`    (Database tetap mempertahankan URL lama, tidak ada data hilang)`,
			);
		}

		// Jeda kecil (300ms) untuk mencegah rate-limit burst
		await new Promise((r) => setTimeout(r, 300));
	}

	// B. Migrasi Foto Properti
	for (let i = 0; i < pendingProperties.length; i++) {
		const property = pendingProperties[i];
		const prefix = `[Properti ${i + 1}/${pendingProperties.length}]`;
		console.log(`\n${prefix} Properti: "${property.name}"`);
		console.log(`    URL Lama: ${property.imageUrl}`);

		try {
			const newUrl = await uploadWithDualMethod(
				property.imageUrl as string,
				targetConfig,
				"homeekost/properties",
			);

			// Update Database HANYA jika upload sukses
			await prisma.property.update({
				where: { id: property.id },
				data: { imageUrl: newUrl },
			});

			console.log(`    ✅ Berhasil dipindahkan & DB di-update!`);
			console.log(`    URL Baru: ${newUrl}`);
			successCount++;
		} catch (err) {
			failCount++;
			console.error(
				`    ❌ GAGAL: ${err instanceof Error ? err.message : String(err)}`,
			);
			console.error(
				`    (Database tetap mempertahankan URL lama, tidak ada data hilang)`,
			);
		}

		await new Promise((r) => setTimeout(r, 300));
	}

	// 5. Ringkasan Akhir
	console.log(`\n======================================================`);
	console.log(`🏁 HASIL AKHIR MIGRASI CLOUDINARY`);
	console.log(`======================================================`);
	console.log(`Total Berhasil Dipindahkan : ${successCount}`);
	console.log(`Total Gagal                : ${failCount}`);
	console.log(`Snapshot Backup Rollback   : ${backupFilePath}`);
	console.log(`======================================================\n`);

	if (failCount === 0) {
		console.log(`🎉 SELURUH DATA BERHASIL DIPINDAHKAN KE CLOUD KLIEN!`);
		console.log(`Langkah Terakhir (Pembersihan Data Pribadi - UU PDP):`);
		console.log(
			`1. Buka dashboard web HomeeKost dan verifikasi foto KTP muncul normal.`,
		);
		console.log(
			`2. Buka Cloudinary akun pribadi lama Anda, lalu hapus folder/foto tersebut secara permanen.`,
		);
		console.log(
			`3. Akun pribadi Anda kini 100% bersih dari data KTP klien.\n`,
		);
	} else {
		console.warn(
			`⚠️  Ada beberapa data yang gagal diunggah. Data tersebut masih tersimpan aman di database dengan link lama.`,
		);
		console.warn(
			`JANGAN hapus foto di akun lama sampai seluruh data selesai dipindahkan!\n`,
		);
	}
}

main()
	.catch((err) => {
		console.error("\n❌ Fatal Error pada script migrasi:", err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
