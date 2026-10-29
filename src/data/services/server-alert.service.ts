import type { SystemStatusData } from "../../common/types/system.types.ts";
import type {
	ServerAlertSettingsData,
	ServerAlertSettingsFormValues,
} from "../../common/validations/index.ts";
import { fonnteClient } from "../../lib/fonnte-client.ts";
import { sanitizePhoneNumber } from "../../lib/phone-sanitizer.ts";
import { whatsappTemplates } from "../../lib/whatsapp-templates.ts";
import {
	type SystemSettingRepository,
	systemSettingRepository,
} from "../repositories/system-setting.repository.ts";
import {
	type SystemStatusService,
	systemStatusService,
} from "./system-status.service.ts";

const SETTING_KEY = "server_alert_settings";

export class ServerAlertService {
	constructor(
		private readonly systemSettingRepo: SystemSettingRepository = systemSettingRepository,
		private readonly statusService: SystemStatusService = systemStatusService,
	) {}

	/**
	 * Mengambil konfigurasi notifikasi WhatsApp server saat ini
	 */
	async getSettings(): Promise<ServerAlertSettingsData> {
		const saved =
			await this.systemSettingRepo.getSetting<ServerAlertSettingsData>(
				SETTING_KEY,
			);

		if (!saved) {
			return {
				enabled: false,
				targetPhone: "",
				triggerCondition: "NEAR_CRITICAL_AND_CRITICAL",
				cooldownHours: 6,
				lastNotifiedAt: null,
				lastNotifiedStatus: null,
			};
		}

		return {
			enabled: Boolean(saved.enabled),
			targetPhone: saved.targetPhone || "",
			triggerCondition: saved.triggerCondition || "NEAR_CRITICAL_AND_CRITICAL",
			cooldownHours: saved.cooldownHours ? Number(saved.cooldownHours) : 6,
			lastNotifiedAt: saved.lastNotifiedAt || null,
			lastNotifiedStatus: saved.lastNotifiedStatus || null,
		};
	}

	/**
	 * Memperbarui konfigurasi nomor WhatsApp dan preferensi notifikasi server
	 */
	async updateSettings(
		values: ServerAlertSettingsFormValues,
	): Promise<ServerAlertSettingsData> {
		const current = await this.getSettings();
		const sanitizedPhone = sanitizePhoneNumber(values.targetPhone);

		const updated: ServerAlertSettingsData = {
			...current,
			enabled: values.enabled,
			targetPhone: sanitizedPhone,
			triggerCondition: values.triggerCondition,
			cooldownHours: values.cooldownHours,
		};

		await this.systemSettingRepo.setSetting(SETTING_KEY, updated);
		return updated;
	}

	/**
	 * Mengirim pesan WhatsApp uji coba ke nomor yang ditentukan
	 */
	async sendTestAlert(
		targetPhone: string,
	): Promise<{ success: boolean; message: string }> {
		const sanitizedPhone = sanitizePhoneNumber(targetPhone);
		if (!sanitizedPhone || sanitizedPhone.length < 8) {
			throw new Error("Nomor WhatsApp penerima tidak valid (minimal 8 digit).");
		}

		const message = whatsappTemplates.serverTestAlert({
			recipientPhone: sanitizedPhone,
		});

		const res = await fonnteClient.sendText({
			target: sanitizedPhone,
			message,
		});

		if (!res.status) {
			throw new Error(
				res.reason || res.detail || "Gagal mengirim pesan uji coba WhatsApp.",
			);
		}

		return {
			success: true,
			message: `Pesan uji coba berhasil dikirim ke nomor WhatsApp ${sanitizedPhone}!`,
		};
	}

	/**
	 * Memeriksa status kesehatan server dan mengirim pesan WhatsApp jika kondisi terpenuhi
	 */
	async checkAndSendAlertIfDue(
		providedStatus?: SystemStatusData,
	): Promise<{
		sent: boolean;
		reason?: string;
		status?: string;
		targetPhone?: string;
	}> {
		const settings = await this.getSettings();

		if (!settings.enabled || !settings.targetPhone) {
			return { sent: false, reason: "disabled_or_no_phone" };
		}

		const status =
			providedStatus || (await this.statusService.getSystemStatus());

		// 1. Evaluasi apakah kondisi kritis (membutuhkan tindakan darurat segera)
		const isCritical =
			status.database.status === "disconnected" ||
			(status.server.storage && status.server.storage.usedPercent >= 92) ||
			(status.server.memory.usedPercent >= 90 &&
				((status.server.storage && status.server.storage.usedPercent >= 88) ||
					status.server.cpu.loadStatus === "Tinggi")) ||
			status.overallStatus === "critical";

		// 2. Evaluasi apakah kondisi mendekati kritis (5-10% sebelum menyentuh batas kritis)
		// Bukan sekadar status Waspada biasa, melainkan saat kapasitas fisik benar-benar mendekati limit
		const isNearCritical =
			!isCritical &&
			((status.server.storage && status.server.storage.usedPercent >= 82) ||
				(status.server.memory.usedPercent >= 80 &&
					(status.server.cpu.loadStatus === "Tinggi" ||
						(status.server.storage && status.server.storage.usedPercent >= 80))) ||
				status.server.memory.usedPercent >= 88);

		let targetStatusLabel: "Mendekati Kritis" | "Kritis" | null = null;

		if (isCritical) {
			targetStatusLabel = "Kritis";
		} else if (
			isNearCritical &&
			settings.triggerCondition === "NEAR_CRITICAL_AND_CRITICAL"
		) {
			targetStatusLabel = "Mendekati Kritis";
		}

		if (!targetStatusLabel) {
			return {
				sent: false,
				reason: "condition_not_met",
			};
		}

		// 3. Pengecekan Jeda Pengiriman (Anti-Spam Cooldown)
		if (settings.lastNotifiedAt) {
			const lastTime = new Date(settings.lastNotifiedAt).getTime();
			const hoursPassed = (Date.now() - lastTime) / (1000 * 60 * 60);

			if (hoursPassed < settings.cooldownHours) {
				return {
					sent: false,
					reason: "cooldown_active",
					status: targetStatusLabel,
				};
			}
		}

		// 4. Susun Saran Tindakan yang Ramah & Tidak Menyesatkan
		let actionAdvice =
			"Pantau status melalui halaman /status untuk memastikan sistem tetap beroperasi normal.";

		if (status.database.status === "disconnected") {
			actionAdvice =
				"Layanan basis data terputus. Segera hubungi administrator teknis untuk memeriksa koneksi server database.";
		} else if (
			status.server.storage &&
			status.server.storage.usedPercent >= 82
		) {
			actionAdvice =
				"Penyimpanan mulai menipis (sisa 10-18%). Cukup arsipkan berkas lama atau bukti transfer yang sudah tidak terpakai agar kembali lega.";
		} else if (status.server.memory.usedPercent >= 85) {
			actionAdvice =
				"Penggunaan RAM tinggi karena sistem sedang aktif memproses operasional kos. Kondisi ini wajar dan memori akan berkurang otomatis saat pemrosesan selesai. Tidak perlu buru-buru upgrade server.";
		} else if (isCritical) {
			actionAdvice =
				"Kapasitas server berada di batas darurat. Disarankan memeriksa beban aplikasi atau menjadwalkan peningkatan kapasitas server.";
		}

		// 5. Susun Pesan WhatsApp
		const message = whatsappTemplates.serverStatusAlert({
			statusLabel: targetStatusLabel,
			headline: status.recommendation.headline,
			description: status.recommendation.description,
			ramUsedFormatted: status.server.memory.usedFormatted,
			ramTotalFormatted: status.server.memory.totalFormatted,
			ramPercent: status.server.memory.usedPercent,
			storageUsedFormatted: status.server.storage?.usedFormatted,
			storageTotalFormatted: status.server.storage?.totalFormatted,
			storagePercent: status.server.storage?.usedPercent,
			cpuLoadStatus: status.server.cpu.loadStatus,
			databaseStatus:
				status.database.status === "connected"
					? "Terhubung Lancar"
					: "Terputus / Kendala",
			actionAdvice,
		});

		// 6. Kirim Pesan via Fonnte Gateway
		const res = await fonnteClient.sendText({
			target: settings.targetPhone,
			message,
		});

		if (res.status) {
			const updated: ServerAlertSettingsData = {
				...settings,
				lastNotifiedAt: new Date().toISOString(),
				lastNotifiedStatus: targetStatusLabel,
			};
			await this.systemSettingRepo.setSetting(SETTING_KEY, updated);

			return {
				sent: true,
				status: targetStatusLabel,
				targetPhone: settings.targetPhone,
			};
		}

		return {
			sent: false,
			reason: res.reason || res.detail || "fonnte_failed",
		};
	}
}

export const serverAlertService = new ServerAlertService();
