import fs from "node:fs";
import "dotenv/config";

export function getDatabaseUrl() {
	let databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required");
	}

	// Jika script dijalankan langsung di host VPS (di luar container Docker)
	// dan URL menggunakan hostname docker '@db:', otomatis ganti ke '@127.0.0.1:'
	if (!fs.existsSync("/.dockerenv") && databaseUrl.includes("@db:")) {
		databaseUrl = databaseUrl.replace("@db:", "@127.0.0.1:");
	}

	return databaseUrl;
}
