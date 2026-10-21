import {
	aiManager,
	generateDeterministicFinancialInsight,
} from "../../ai/index.ts";
import type { AiFinancialInsightData } from "../../ai/types.ts";
import type {
	AiMonthlyReportData,
	AiStrategicRecommendation,
	AnnualReportMatrixData,
	SessionUser,
} from "../../common/types/index.ts";
import type { AutomationSettingsFormValues } from "../../common/validations/index.ts";
import { generateAnnualFinancialCsv } from "../../lib/csv-exporter.ts";
import { getTodayDateString } from "../../lib/date-utils.ts";
import { type FonnteClient, fonnteClient } from "../../lib/fonnte-client.ts";
import { sanitizePhoneNumber } from "../../lib/phone-sanitizer.ts";
import { isReportScheduleDue } from "../../lib/schedule-utils.ts";
import { whatsappTemplates } from "../../lib/whatsapp-templates.ts";
import {
	type EngagementRepository,
	engagementRepository,
} from "../repositories/engagement.repository.ts";
import {
	type PropertyRepository,
	propertyRepository,
} from "../repositories/property.repository.ts";
import {
	type ReportRepository,
	reportRepository,
} from "../repositories/report.repository.ts";
import {
	type SystemSettingRepository,
	systemSettingRepository,
} from "../repositories/system-setting.repository.ts";

const MONTH_NAMES = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const MAX_DAILY_AI_REFRESH = 2;

export class ReportService {
	constructor(
		private readonly reportRepo: ReportRepository = reportRepository,
		private readonly propertyRepo: PropertyRepository = propertyRepository,
		private readonly engagementRepo: EngagementRepository = engagementRepository,
		private readonly fonnte: FonnteClient = fonnteClient,
		private readonly systemSettingRepo: SystemSettingRepository = systemSettingRepository,
	) {}

	/**
	 * Dapatkan Laporan Keuangan Eksekutif Bulanan (Super Cepat / Instant < 50ms)
	 * Mengambil data deterministik dari PostgreSQL + Wawasan AI tersimpan dari Database
	 * (Jika belum ada hasil AI di database, menggunakan Rule-Based fallback instan tanpa nembak API eksternal)
	 */
	async getMonthlyReport(
		propertyId?: string,
		month?: number,
		year?: number,
		user?: SessionUser,
	): Promise<AiMonthlyReportData> {
		const userPropertyId = user?.assignedPropertyId;
		let effectivePropertyId = propertyId;

		if (user?.role?.name === "ADMIN" && userPropertyId) {
			effectivePropertyId = userPropertyId;
		}

		const propertyIds = effectivePropertyId ? [effectivePropertyId] : undefined;

		const now = new Date();
		const currentMonth = now.getMonth() + 1;
		const currentYear = now.getFullYear();

		const targetMonth = month || currentMonth;
		const targetYear = year || currentYear;

		const isClosedPeriod =
			targetYear < currentYear ||
			(targetYear === currentYear && targetMonth < currentMonth);

		const monthName = MONTH_NAMES[targetMonth - 1] || "Bulan";

		// 1. Ambil Nama & Info Properti
		let propertyName = "Semua Cabang Kos (Konsolidasi)";
		let propertyImageUrl: string | null = null;
		let propertyAddress: string | null = null;

		if (effectivePropertyId) {
			const prop = await this.propertyRepo.findById(effectivePropertyId);
			if (prop) {
				propertyName = prop.name;
				propertyImageUrl = prop.imageUrl || null;
				propertyAddress = prop.address || null;
			}
		}

		// 2. Hitung Metrik Deterministik Murni dari PostgreSQL
		const summary = await this.reportRepo.getMonthlyFinancialSummary(
			propertyIds,
			targetMonth,
			targetYear,
		);

		// 3. Susun Payload Context
		const aiPayload = {
			period: {
				month: targetMonth,
				monthName,
				year: targetYear,
				isClosedPeriod,
			},
			property: {
				id: effectivePropertyId,
				name: propertyName,
				isMultiProperty: !effectivePropertyId,
			},
			metrics: {
				totalIncome: summary.totalIncome,
				totalExpense: summary.totalExpense,
				operationalExpense: summary.operationalExpense,
				investmentExpense: summary.investmentExpense,
				netProfit: summary.netProfit,
				profitMarginPercentage: summary.profitMarginPercentage,
			},
			occupancy: {
				totalRooms: summary.roomStatus.totalRooms,
				occupiedRooms: summary.roomStatus.occupiedRooms,
				vacantRooms: summary.roomStatus.vacantRooms,
				maintenanceRooms: summary.roomStatus.maintenanceRooms,
				occupancyRatePercentage: summary.roomStatus.occupancyRate,
			},
			collection: {
				totalInvoices: summary.collection.totalInvoices,
				paidInvoices: summary.collection.paidInvoices,
				pendingInvoices: summary.collection.pendingInvoices,
				overdueInvoices: summary.collection.overdueInvoices,
				collectionRatePercentage: summary.collection.collectionRate,
				totalOutstandingAmount: summary.collection.totalOutstanding,
			},
			topExpenses: summary.expenseBreakdown.map((e) => ({
				category: e.category,
				amount: e.amount,
				percentageOfTotalExpense: e.percentage,
			})),
			complaintExpenses: summary.complaintExpenses,
		};

		// 4. Cari apakah ada Analisis AI yang sudah digenerate sebelumnya di database
		const storedAiReport = await this.reportRepo.findStoredAiReport(
			effectivePropertyId || null,
			targetMonth,
			targetYear,
		);

		const todayStr = getTodayDateString();
		let aiData: AiFinancialInsightData;
		let aiProviderUsed = "HomeeKost Rule Engine (Instan)";
		let isAutomated = false;
		let refreshCountToday = 0;

		if (
			storedAiReport?.aiNarrativeSummary &&
			typeof storedAiReport.aiNarrativeSummary === "object"
		) {
			const savedSummary = storedAiReport.aiNarrativeSummary as Record<
				string,
				unknown
			>;
			aiData = {
				financialHealthGrade:
					(savedSummary.financialHealthGrade as AiFinancialInsightData["financialHealthGrade"]) ||
					"SEHAT",
				executiveSummary:
					(savedSummary.executiveSummary as string) ||
					(savedSummary.narrativeSummary as string) ||
					"",
				keyHighlights: (savedSummary.keyHighlights as string[]) || [],
				trendAnalysis:
					(savedSummary.trendAnalysis as AiFinancialInsightData["trendAnalysis"]) || {
						incomeTrend: "",
						expenseTrend: "",
						occupancyImpact: "",
					},
				complaintCostImpact: (savedSummary.complaintCostImpact as string) || "",
				strategicRecommendations:
					(savedSummary.strategicRecommendations as AiFinancialInsightData["strategicRecommendations"]) ||
					[],
			};
			aiProviderUsed =
				(savedSummary.providerUsed as string) || "AI Database Cache";
			isAutomated = true;

			if (savedSummary.lastRefreshedDate === todayStr) {
				refreshCountToday =
					typeof savedSummary.refreshCountToday === "number"
						? savedSummary.refreshCountToday
						: 0;
			}
		} else {
			// Jika belum digenerate via Cron atau tombol AI, gunakan Rule-Based deterministic fallback instan (0ms)
			aiData = generateDeterministicFinancialInsight(aiPayload);
		}

		const remainingRefreshesToday = Math.max(
			0,
			MAX_DAILY_AI_REFRESH - refreshCountToday,
		);
		const canRefreshToday = remainingRefreshesToday > 0;

		const generatedAt = (
			storedAiReport ? storedAiReport.updatedAt : new Date()
		).toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		return {
			id:
				storedAiReport?.id ||
				`REP-${targetYear}${String(targetMonth).padStart(2, "0")}-${effectivePropertyId || "ALL"}`,
			propertyId: effectivePropertyId || "all",
			propertyName,
			propertyImageUrl,
			propertyAddress,
			periodMonth: monthName,
			periodMonthNumber: targetMonth,
			periodYear: targetYear,
			isClosedPeriod,
			totalIncome: summary.totalIncome,
			totalExpense: summary.totalExpense,
			operationalExpense: summary.operationalExpense,
			investmentExpense: summary.investmentExpense,
			netProfit: summary.netProfit,
			profitMarginPercentage: summary.profitMarginPercentage,
			roomStatus: {
				totalRooms: summary.roomStatus.totalRooms,
				occupiedRooms: summary.roomStatus.occupiedRooms,
				emptyRooms: summary.roomStatus.vacantRooms,
				maintenanceRooms: summary.roomStatus.maintenanceRooms,
				occupancyRate: summary.roomStatus.occupancyRate,
			},
			financialHealthGrade: aiData.financialHealthGrade,
			narrativeSummary: aiData.executiveSummary,
			keyHighlights: aiData.keyHighlights || [],
			trendAnalysis: aiData.trendAnalysis,
			complaintCostImpact: aiData.complaintCostImpact,
			recommendations: (aiData.strategicRecommendations || []).map(
				(
					r: {
						code?: string;
						title?: string;
						description?: string;
						priority?: "HIGH" | "MEDIUM" | "LOW";
					},
					idx: number,
				): AiStrategicRecommendation => ({
					id: idx + 1,
					code: r.code || String(idx + 1).padStart(2, "0"),
					title: r.title || "Rekomendasi Operasional",
					description: r.description || "",
					priority: r.priority || "MEDIUM",
				}),
			),
			expenseBreakdown: summary.expenseBreakdown,
			generatedAt: `${generatedAt} WIB`,
			isAutomated,
			aiProviderUsed,
			refreshCountToday,
			remainingRefreshesToday,
			canRefreshToday,
		};
	}

	/**
	 * Regenerasi / Eksekusi Analisis AI dengan Kuota Harian (Maksimal 2x Per Hari)
	 */
	async generateOrRefreshAiReport(
		propertyId?: string,
		month?: number,
		year?: number,
		user?: SessionUser,
	): Promise<AiMonthlyReportData> {
		const userPropertyId = user?.assignedPropertyId;
		let effectivePropertyId = propertyId;

		if (user?.role?.name === "ADMIN" && userPropertyId) {
			effectivePropertyId = userPropertyId;
		}

		const propertyIds = effectivePropertyId ? [effectivePropertyId] : undefined;

		const now = new Date();
		const currentMonth = now.getMonth() + 1;
		const currentYear = now.getFullYear();

		const targetMonth = month || currentMonth;
		const targetYear = year || currentYear;

		const isClosedPeriod =
			targetYear < currentYear ||
			(targetYear === currentYear && targetMonth < currentMonth);

		const monthName = MONTH_NAMES[targetMonth - 1] || "Bulan";

		// 1. Cek Kuota Refresh Harian dari database
		const storedAiReport = await this.reportRepo.findStoredAiReport(
			effectivePropertyId || null,
			targetMonth,
			targetYear,
		);

		const todayStr = getTodayDateString();
		let currentRefreshCount = 0;

		if (
			storedAiReport?.aiNarrativeSummary &&
			typeof storedAiReport.aiNarrativeSummary === "object"
		) {
			const savedSummary = storedAiReport.aiNarrativeSummary as Record<
				string,
				unknown
			>;
			if (savedSummary.lastRefreshedDate === todayStr) {
				currentRefreshCount =
					typeof savedSummary.refreshCountToday === "number"
						? savedSummary.refreshCountToday
						: 0;
			}
		}

		if (currentRefreshCount >= MAX_DAILY_AI_REFRESH) {
			throw new Error(
				`Batas regenerasi AI Insight telah tercapai (maksimal ${MAX_DAILY_AI_REFRESH} kali per hari untuk periode ini). Silakan coba lagi besok.`,
			);
		}

		// 2. Ambil Nama & Info Properti
		let propertyName = "Semua Cabang Kos (Konsolidasi)";
		let propertyImageUrl: string | null = null;
		let propertyAddress: string | null = null;

		if (effectivePropertyId) {
			const prop = await this.propertyRepo.findById(effectivePropertyId);
			if (prop) {
				propertyName = prop.name;
				propertyImageUrl = prop.imageUrl || null;
				propertyAddress = prop.address || null;
			}
		}

		// 3. Hitung Metrik Deterministik Murni dari PostgreSQL
		const summary = await this.reportRepo.getMonthlyFinancialSummary(
			propertyIds,
			targetMonth,
			targetYear,
		);

		// 4. Susun Payload Context untuk AI LLM dengan Time Context Real-Time
		const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
		const currentDayOfMonth = isClosedPeriod ? lastDayOfMonth : now.getDate();
		const monthProgress = Math.min(
			100,
			Math.max(1, Math.round((currentDayOfMonth / lastDayOfMonth) * 100)),
		);
		const asOfDate = now.toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});

		const aiPayload = {
			period: {
				month: targetMonth,
				monthName,
				year: targetYear,
				isClosedPeriod,
				asOfDate,
				dayOfMonth: currentDayOfMonth,
				totalDaysInMonth: lastDayOfMonth,
				monthProgressPercentage: monthProgress,
			},
			property: {
				id: effectivePropertyId,
				name: propertyName,
				isMultiProperty: !effectivePropertyId,
			},
			metrics: {
				totalIncome: summary.totalIncome,
				totalExpense: summary.totalExpense,
				operationalExpense: summary.operationalExpense,
				investmentExpense: summary.investmentExpense,
				netProfit: summary.netProfit,
				profitMarginPercentage: summary.profitMarginPercentage,
			},
			occupancy: {
				totalRooms: summary.roomStatus.totalRooms,
				occupiedRooms: summary.roomStatus.occupiedRooms,
				vacantRooms: summary.roomStatus.vacantRooms,
				maintenanceRooms: summary.roomStatus.maintenanceRooms,
				occupancyRatePercentage: summary.roomStatus.occupancyRate,
			},
			collection: {
				totalInvoices: summary.collection.totalInvoices,
				paidInvoices: summary.collection.paidInvoices,
				pendingInvoices: summary.collection.pendingInvoices,
				overdueInvoices: summary.collection.overdueInvoices,
				collectionRatePercentage: summary.collection.collectionRate,
				totalOutstandingAmount: summary.collection.totalOutstanding,
			},
			topExpenses: summary.expenseBreakdown.map((e) => ({
				category: e.category,
				amount: e.amount,
				percentageOfTotalExpense: e.percentage,
			})),
			complaintExpenses: summary.complaintExpenses,
		};

		// 5. Panggil LLM Engine (Gemini -> Groq -> Fallback)
		const aiResult = await aiManager.analyzeFinancialPerformance(aiPayload);
		const aiData = aiResult.data;
		const newRefreshCount = currentRefreshCount + 1;

		// 6. Simpan hasil ke Database PostgreSQL (tabel ai_financial_reports)
		const savedReport = await this.reportRepo.saveStoredAiReport({
			propertyId: effectivePropertyId || null,
			periodMonth: targetMonth,
			periodYear: targetYear,
			totalIncome: summary.totalIncome,
			totalExpense: summary.totalExpense,
			netProfit: summary.netProfit,
			occupancyRate: summary.roomStatus.occupancyRate,
			aiNarrativeSummary: {
				...aiData,
				lastRefreshedDate: todayStr,
				refreshCountToday: newRefreshCount,
				providerUsed: aiResult.providerUsed,
			},
		});

		const remainingRefreshesToday = Math.max(
			0,
			MAX_DAILY_AI_REFRESH - newRefreshCount,
		);
		const canRefreshToday = remainingRefreshesToday > 0;

		const generatedAt = savedReport.updatedAt.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		return {
			id: savedReport.id,
			propertyId: effectivePropertyId || "all",
			propertyName,
			propertyImageUrl,
			propertyAddress,
			periodMonth: monthName,
			periodMonthNumber: targetMonth,
			periodYear: targetYear,
			isClosedPeriod,
			totalIncome: summary.totalIncome,
			totalExpense: summary.totalExpense,
			operationalExpense: summary.operationalExpense,
			investmentExpense: summary.investmentExpense,
			netProfit: summary.netProfit,
			profitMarginPercentage: summary.profitMarginPercentage,
			roomStatus: {
				totalRooms: summary.roomStatus.totalRooms,
				occupiedRooms: summary.roomStatus.occupiedRooms,
				emptyRooms: summary.roomStatus.vacantRooms,
				maintenanceRooms: summary.roomStatus.maintenanceRooms,
				occupancyRate: summary.roomStatus.occupancyRate,
			},
			financialHealthGrade: aiData.financialHealthGrade,
			narrativeSummary: aiData.executiveSummary,
			keyHighlights: aiData.keyHighlights || [],
			trendAnalysis: aiData.trendAnalysis,
			complaintCostImpact: aiData.complaintCostImpact,
			recommendations: (aiData.strategicRecommendations || []).map(
				(
					r: {
						code?: string;
						title?: string;
						description?: string;
						priority?: "HIGH" | "MEDIUM" | "LOW";
					},
					idx: number,
				): AiStrategicRecommendation => ({
					id: idx + 1,
					code: r.code || String(idx + 1).padStart(2, "0"),
					title: r.title || "Rekomendasi Operasional",
					description: r.description || "",
					priority: r.priority || "MEDIUM",
				}),
			),
			expenseBreakdown: summary.expenseBreakdown,
			generatedAt: `${generatedAt} WIB`,
			isAutomated: true,
			aiProviderUsed: aiResult.providerUsed,
			refreshCountToday: newRefreshCount,
			remainingRefreshesToday,
			canRefreshToday,
		};
	}

	/**
	 * Dapatkan pengaturan automasi laporan bulanan dari database (fallback ke default jika belum diset)
	 */
	async getAutomationSettings(): Promise<AutomationSettingsFormValues> {
		const setting =
			await this.systemSettingRepo.getSetting<AutomationSettingsFormValues>(
				"report_automation_settings",
			);
		if (!setting) {
			return {
				scheduleDay: 1,
				scheduleTime: "08:00",
				autoSendWhatsApp: false,
				targetPhone: "",
				aiModel: "gemini-3.5-flash-lite",
			};
		}
		return {
			scheduleDay: setting.scheduleDay ?? 1,
			scheduleTime: setting.scheduleTime || "08:00",
			autoSendWhatsApp: setting.autoSendWhatsApp ?? false,
			targetPhone: setting.targetPhone || "",
			aiModel: setting.aiModel || "gemini-3.5-flash-lite",
		};
	}

	/**
	 * Simpan atau perbarui pengaturan automasi laporan bulanan.
	 * Hanya SuperAdmin yang diperbolehkan mengubah pengaturan ini.
	 */
	async updateAutomationSettings(
		values: AutomationSettingsFormValues,
		user?: SessionUser,
	): Promise<void> {
		if (user && user.role?.name !== "SUPER_ADMIN") {
			throw new Error(
				"Unauthorized: Hanya SuperAdmin yang berhak mengubah jadwal automasi laporan",
			);
		}
		await this.systemSettingRepo.setSetting(
			"report_automation_settings",
			values,
		);
	}
	/**
	 * Cron Handler: Pembuatan Laporan AI Bulanan Terjadwal
	 * Mengirim notifikasi reminder teks WhatsApp ke Pengelola/Owner (TANPA lampiran file PDF)
	 */
	async runMonthlyReportCron(options?: {
		propertyId?: string;
		targetPhone?: string;
		sendWhatsApp?: boolean;
		month?: number;
		year?: number;
		idempotencyKey?: string;
		forceSend?: boolean;
	}) {
		const now = new Date();
		// Default: Laporan untuk bulan sebelumnya (Tutup Buku) atau bulan berjalan jika dispesifikasi
		let month = options?.month ?? now.getMonth();
		let year = options?.year ?? now.getFullYear();
		if (month === 0) {
			month = 12;
			year -= 1;
		}

		console.log(
			`[Cron Report] Menjalankan automasi Laporan AI untuk Periode ${month}/${year}...`,
		);

		const settings = await this.getAutomationSettings();

		if (!options?.forceSend) {
			if (!settings.autoSendWhatsApp && !options?.sendWhatsApp) {
				return {
					success: true,
					processedCount: 0,
					skippedCount: 0,
					skipped: true,
					reason: "Automasi WhatsApp dinonaktifkan di pengaturan sistem",
					period: { month, year },
				};
			}

			const isDue = isReportScheduleDue({
				now,
				scheduleDay: settings.scheduleDay,
				scheduleTime: settings.scheduleTime,
			});

			if (!isDue) {
				return {
					success: true,
					processedCount: 0,
					skippedCount: 0,
					skipped: true,
					reason: `Bukan jadwal eksekusi (Jadwal: tgl ${settings.scheduleDay} jam ${settings.scheduleTime} WIB)`,
					period: { month, year },
				};
			}
		}

		const properties = await this.propertyRepo.findAll();
		const targetProperties = options?.propertyId
			? properties.filter((p) => p.id === options.propertyId)
			: properties;

		const todayStr = getTodayDateString();
		const startOfDay = new Date(`${todayStr}T00:00:00+07:00`);
		const endOfDay = new Date(`${todayStr}T23:59:59.999+07:00`);

		const sentReportTokensToday = new Set<string>();
		try {
			const todaySentLogs =
				await this.engagementRepo.getTodaySentNotificationLogs(
					startOfDay,
					endOfDay,
				);
			for (const log of todaySentLogs) {
				if (log.notes) {
					const match = log.notes.match(/\[(TOKEN:REPORT:[^\]]+)\]/);
					if (match) {
						sentReportTokensToday.add(match[1]);
					}
				}
			}
		} catch (err) {
			console.error(
				"[Cron Report] Gagal membaca log idempotensi hari ini:",
				err,
			);
		}

		const results = [];
		const notificationLogs: Array<{
			recipientNumber: string;
			messageType: "ANNOUNCEMENT";
			status: "SENT" | "FAILED";
			notes?: string | null;
		}> = [];

		let skippedCount = 0;

		const effectiveTargetPhone =
			options?.targetPhone || settings.targetPhone || "";
		const targetNumber = effectiveTargetPhone
			? sanitizePhoneNumber(effectiveTargetPhone)
			: "";

		const shouldSendWhatsApp =
			options?.sendWhatsApp !== undefined
				? options.sendWhatsApp
				: settings.autoSendWhatsApp;

		for (const prop of targetProperties) {
			try {
				let report: AiMonthlyReportData;
				try {
					report = await this.generateOrRefreshAiReport(prop.id, month, year);
				} catch (aiErr) {
					console.warn(
						`[Cron Report] Kuota refresh AI tercapai atau regenerasi dilewati untuk properti ${prop.name}, mengambil laporan eksisting:`,
						aiErr instanceof Error ? aiErr.message : aiErr,
					);
					report = await this.getMonthlyReport(prop.id, month, year);
				}
				results.push(report);

				// Kirim pengingat WhatsApp jika diaktifkan (Hanya Teks - Hemat Biaya Fonnte)

				if (targetNumber === "6281234567890") {
					console.warn(
						"[Cron Report] Nomor target adalah dummy contoh (081234567890), pengiriman WhatsApp dilewati.",
					);
					notificationLogs.push({
						recipientNumber: targetNumber,
						messageType: "ANNOUNCEMENT",
						status: "FAILED",
						notes:
							"Nomor tujuan adalah nomor dummy contoh (081234567890). Harap gunakan nomor WhatsApp asli Anda.",
					});
				} else if (shouldSendWhatsApp && targetNumber) {
					const reportToken =
						options?.idempotencyKey ||
						`TOKEN:REPORT:${prop.id}:${year}-${month}:${todayStr}`;

					// Anti-Spam Idempotency Check: cegah spam berulang jika cron ditembak berkali-kali hari ini (dapat di-bypass dengan forceSend)
					if (!options?.forceSend && sentReportTokensToday.has(reportToken)) {
						console.log(
							`[Cron Report] Lewati kirim WhatsApp untuk ${prop.name} karena sudah terkirim hari ini (${reportToken})`,
						);
						skippedCount++;
						continue;
					}

					console.log(
						`[Cron Report] Mengirim ringkasan laporan ke WhatsApp ${targetNumber}...`,
					);

					const message = whatsappTemplates.executiveReportReminder({
						propertyName: report.propertyName,
						periodMonth: report.periodMonth,
						periodYear: report.periodYear,
						totalIncome: report.totalIncome,
						totalExpense: report.totalExpense,
						netProfit: report.netProfit,
						profitMarginPercentage: report.profitMarginPercentage,
						occupancyRate: report.roomStatus.occupancyRate,
						financialHealthGrade: report.financialHealthGrade || "SEHAT",
					});

					const sendRes = await this.fonnte.sendText({
						target: targetNumber,
						message,
					});

					console.log(
						`[Cron Report] Respon pengiriman WhatsApp (${targetNumber}): status=${sendRes.status}, detail=${sendRes.detail || sendRes.reason || "Success"}`,
					);

					const status = sendRes.status ? "SENT" : "FAILED";
					const errorReason =
						sendRes.reason ||
						sendRes.detail ||
						(sendRes.status ? "Success" : "Failed");
					const noteLabel = `[${reportToken}] Pengingat Laporan AI ${report.propertyName} (${report.periodMonth} ${report.periodYear}) — ${errorReason}`;

					notificationLogs.push({
						recipientNumber: targetNumber,
						messageType: "ANNOUNCEMENT",
						status,
						notes: noteLabel,
					});

					if (sendRes.status) {
						sentReportTokensToday.add(reportToken);
					}
				} else if (options?.sendWhatsApp && !targetNumber) {
					console.warn(
						"[Cron Report] Opsi kirim WhatsApp aktif tetapi nomor target pengelola belum diisi.",
					);
				}
			} catch (err) {
				console.error(
					`[Cron Report] Gagal memproses laporan untuk properti ${prop.name}:`,
					err,
				);
			}
		}

		if (notificationLogs.length > 0) {
			await this.engagementRepo.recordNotificationLogsBatch(notificationLogs);
		}

		const sentLogs = notificationLogs.filter((l) => l.status === "SENT");
		const failedLogs = notificationLogs.filter((l) => l.status === "FAILED");

		return {
			success: true,
			processedCount: results.length,
			skippedCount,
			period: { month, year },
			whatsApp: {
				attempted: notificationLogs.length > 0,
				targetPhone: effectiveTargetPhone || null,
				sentCount: sentLogs.length,
				failedCount: failedLogs.length,
				status:
					notificationLogs.length === 0
						? ("NOT_ATTEMPTED" as const)
						: failedLogs.length === 0
							? ("SENT" as const)
							: sentLogs.length > 0
								? ("PARTIAL" as const)
								: ("FAILED" as const),
				detail:
					notificationLogs.length === 0
						? shouldSendWhatsApp === false
							? "Pengiriman WhatsApp dinonaktifkan."
							: !targetNumber
								? "Nomor WhatsApp belum diisi."
								: "WhatsApp tidak dikirim."
						: notificationLogs[0]?.notes || null,
			},
		};
	}

	/**
	 * Dapatkan Matriks Keuangan Tahunan (12 Bulan)
	 */
	async getAnnualReportMatrix(
		year: number,
		propertyId?: string,
		user?: SessionUser,
	): Promise<AnnualReportMatrixData> {
		const userPropertyId = user?.assignedPropertyId;
		let effectivePropertyId = propertyId;

		if (user?.role?.name === "ADMIN" && userPropertyId) {
			effectivePropertyId = userPropertyId;
		}

		const propertyIds = effectivePropertyId ? [effectivePropertyId] : undefined;
		return this.reportRepo.getAnnualFinancialMatrix(year, propertyIds);
	}

	/**
	 * Ekspor Laporan Finansial Tahunan ke format file CSV (UTF-8 BOM)
	 */
	async exportAnnualCsv(
		year: number,
		propertyId?: string,
		user?: SessionUser,
	): Promise<{ filename: string; csvContent: string }> {
		const matrix = await this.getAnnualReportMatrix(year, propertyId, user);
		const csvContent = generateAnnualFinancialCsv(matrix);

		const sanitizedProp = matrix.propertyName
			.replace(/[^a-zA-Z0-9]/g, "-")
			.replace(/-+/g, "-");
		const filename = `Laporan-Keuangan-Tahunan-${matrix.year}-${sanitizedProp}.csv`;

		return {
			filename,
			csvContent,
		};
	}
}

export const reportService = new ReportService();
