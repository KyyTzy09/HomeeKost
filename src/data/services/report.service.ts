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
import { isReportScheduleDue } from "../../lib/schedule-utils.ts";
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
		let propertyName = "Semua Cabang Kos";
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

		// Hitung Metrik Bulan Lalu untuk Perbandingan Pertumbuhan (MoM)
		const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
		const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
		const prevSummary = await this.reportRepo.getMonthlyFinancialSummary(
			propertyIds,
			prevMonth,
			prevYear,
		);

		const calculateGrowth = (curr: number, prev: number) => {
			if (prev === 0) return curr > 0 ? 100 : 0;
			return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
		};

		const momGrowth = {
			incomeGrowthPercent: calculateGrowth(
				summary.totalIncome,
				prevSummary.totalIncome,
			),
			expenseGrowthPercent: calculateGrowth(
				summary.totalExpense,
				prevSummary.totalExpense,
			),
			profitGrowthPercent: calculateGrowth(
				summary.netProfit,
				prevSummary.netProfit,
			),
		};

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
					"WASPADA",
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
			momGrowth,
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

		// Hitung Metrik Bulan Lalu untuk Perbandingan Pertumbuhan (MoM)
		const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
		const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
		const prevSummary = await this.reportRepo.getMonthlyFinancialSummary(
			propertyIds,
			prevMonth,
			prevYear,
		);

		const calculateGrowth = (curr: number, prev: number) => {
			if (prev === 0) return curr > 0 ? 100 : 0;
			return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
		};

		const momGrowth = {
			incomeGrowthPercent: calculateGrowth(
				summary.totalIncome,
				prevSummary.totalIncome,
			),
			expenseGrowthPercent: calculateGrowth(
				summary.totalExpense,
				prevSummary.totalExpense,
			),
			profitGrowthPercent: calculateGrowth(
				summary.netProfit,
				prevSummary.netProfit,
			),
		};

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
			momGrowth,
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
		const userRole =
			typeof user?.role === "string" ? user.role : user?.role?.name;
		if (user && userRole !== "SUPER_ADMIN") {
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
	 * Cron Handler: Pembaruan Data Laporan AI Bulanan Terjadwal
	 * Memperbarui data laporan keuangan di database tanpa broadcast WhatsApp
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

		// 1. Cek Idempotency: Cegah duplikasi atau spam eksekusi dalam periode yang sama
		const idempotencyKey =
			options?.idempotencyKey ||
			`cron_monthly_report_${year}_${month}${options?.propertyId ? `_${options.propertyId}` : ""}`;

		if (!options?.forceSend) {
			const existingRun =
				await this.systemSettingRepo.getSetting<{ processedAt: string }>(
					idempotencyKey,
				);

			if (existingRun) {
				console.log(
					`[Cron Report] Periode ${month}/${year} telah diproses sebelumnya pada ${existingRun.processedAt} (Idempotent: ${idempotencyKey}). Melewati eksekusi.`,
				);
				return {
					success: true,
					skipped: true,
					idempotent: true,
					reason: `Periode ${month}/${year} sudah diproses sebelumnya (Idempotent: ${idempotencyKey})`,
					period: { month, year },
					processedAt: existingRun.processedAt,
				};
			}

			// 2. Jika cron dipanggil periodik tanpa parameter bulan spesifik, periksa apakah jadwal automasi sudah jatuh tempo
			if (options?.month === undefined) {
				const settings = await this.getAutomationSettings();
				const isDue = isReportScheduleDue({
					now,
					scheduleDay: settings.scheduleDay,
					scheduleTime: settings.scheduleTime,
				});

				if (!isDue) {
					console.log(
						`[Cron Report] Jadwal automasi laporan belum jatuh tempo (Jadwal: tgl ${settings.scheduleDay} jam ${settings.scheduleTime} WIB).`,
					);
					return {
						success: true,
						skipped: true,
						reason: `Belum jatuh tempo jadwal (Jadwal: tgl ${settings.scheduleDay} jam ${settings.scheduleTime} WIB)`,
						period: { month, year },
					};
				}
			}
		}

		console.log(
			`[Cron Report] Menjalankan pembaruan Laporan AI untuk Periode ${month}/${year}...`,
		);

		const properties = await this.propertyRepo.findAll();
		const targetProperties = options?.propertyId
			? properties.filter((p) => p.id === options.propertyId)
			: properties;

		const results = [];

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
			} catch (err) {
				console.error(
					`[Cron Report] Gagal memproses laporan untuk properti ${prop.name}:`,
					err,
				);
			}
		}

		// Update konsolidasi (Semua Cabang) jika tidak memfilter properti tertentu
		if (!options?.propertyId) {
			try {
				try {
					const allReport = await this.generateOrRefreshAiReport(
						undefined,
						month,
						year,
					);
					results.push(allReport);
				} catch {
					const allReport = await this.getMonthlyReport(
						undefined,
						month,
						year,
					);
					results.push(allReport);
				}
			} catch (err) {
				console.error("[Cron Report] Gagal memproses laporan agregat:", err);
			}
		}

		// 3. Simpan token idempotency untuk mencegah spam pada runner berikutnya
		const processedRecord = {
			processedAt: new Date().toISOString(),
			month,
			year,
			propertyId: options?.propertyId || null,
			resultsCount: results.length,
		};
		await this.systemSettingRepo.setSetting(idempotencyKey, processedRecord);

		// 4. Publikasikan alert notifikasi laporan bulanan terbaru untuk Dashboard & Topbar
		const alertPayload = {
			month,
			year,
			monthName: MONTH_NAMES[month - 1] || `Bulan ${month}`,
			notifiedAt: new Date().toISOString(),
			active: true,
		};
		await this.systemSettingRepo.setSetting(
			"latest_monthly_report_alert",
			alertPayload,
		);

		return {
			success: true,
			processedCount: results.length,
			period: { month, year },
			idempotencyKey,
		};
	}

	/**
	 * Cron Harian: Pembaruan Data Laporan AI Bulan Berjalan
	 * Menjalankan kalkulasi keuangan & wawasan AI untuk seluruh cabang kos secara otomatis (tanpa broadcast WA).
	 */
	async runDailyReportUpdateCron() {
		const now = new Date();
		const currentMonth = now.getMonth() + 1;
		const currentYear = now.getFullYear();

		console.log(
			`[Cron Report] Memperbarui snapshot Laporan AI harian untuk Periode ${currentMonth}/${currentYear}...`,
		);

		const properties = await this.propertyRepo.findAll();
		const results: Array<{
			propertyId: string;
			status: "UPDATED" | "FALLBACK" | "FAILED";
		}> = [];

		// 1. Update data tiap cabang kos
		for (const prop of properties) {
			try {
				try {
					await this.generateOrRefreshAiReport(
						prop.id,
						currentMonth,
						currentYear,
					);
					results.push({ propertyId: prop.id, status: "UPDATED" });
				} catch (aiErr) {
					console.warn(
						`[Cron Report] Refresh AI dilewati untuk ${prop.name}, memuat snapshot deterministik:`,
						aiErr instanceof Error ? aiErr.message : aiErr,
					);
					await this.getMonthlyReport(prop.id, currentMonth, currentYear);
					results.push({ propertyId: prop.id, status: "FALLBACK" });
				}
			} catch (err) {
				console.error(
					`[Cron Report] Gagal memperbarui laporan untuk ${prop.name}:`,
					err,
				);
				results.push({ propertyId: prop.id, status: "FAILED" });
			}
		}

		// 2. Update data konsolidasi (Semua Cabang Kos)
		try {
			try {
				await this.generateOrRefreshAiReport(
					undefined,
					currentMonth,
					currentYear,
				);
				results.push({ propertyId: "ALL", status: "UPDATED" });
			} catch {
				await this.getMonthlyReport(undefined, currentMonth, currentYear);
				results.push({ propertyId: "ALL", status: "FALLBACK" });
			}
		} catch (err) {
			console.error("[Cron Report] Gagal memperbarui laporan konsolidasi:", err);
			results.push({ propertyId: "ALL", status: "FAILED" });
		}

		return {
			success: true,
			updatedCount: results.filter(
				(r) => r.status === "UPDATED" || r.status === "FALLBACK",
			).length,
			period: { month: currentMonth, year: currentYear },
			details: results,
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
