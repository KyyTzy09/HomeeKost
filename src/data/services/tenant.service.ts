import type {
	OccupationStatus,
	RentDuration,
	SessionUser,
	TenantItem,
	TenantPaymentStatus,
} from "../../common/types/index.ts";
import type { TenantFormValues } from "../../common/validations/index.ts";
import type { BillingCycle } from "../../generated/prisma/client.js";
import { getMonthName } from "../../lib/date-utils.ts";
import { formatRupiah, parseRupiah } from "../../lib/currency.ts";
import { formatDisplayPhone, sanitizePhone } from "../../lib/phone-utils.ts";
import { roomRepository } from "../repositories/room.repository.ts";
import { tenantRepository } from "../repositories/tenant.repository.ts";

export class TenantService {
	constructor(
		private readonly tenantRepo = tenantRepository,
		private readonly roomRepo = roomRepository,
	) {}

	private mapBillingCycleToDuration(cycle?: BillingCycle | null): RentDuration {
		switch (cycle) {
			case "MONTHLY":
				return "Bulanan";
			case "QUARTERLY":
				return "Triwulan";
			case "SEMI_ANNUAL":
				return "Semesteran";
			case "ANNUALLY":
				return "Tahunan";
			default:
				return "Bulanan";
		}
	}

	private mapDurationToBillingCycle(duration?: string | null): BillingCycle {
		switch (duration) {
			case "Bulanan":
				return "MONTHLY";
			case "Triwulan":
				return "QUARTERLY";
			case "Semesteran":
				return "SEMI_ANNUAL";
			case "Tahunan":
				return "ANNUALLY";
			default:
				return "MONTHLY";
		}
	}

	private getCycleMonths(cycle?: BillingCycle | null): number {
		switch (cycle) {
			case "MONTHLY":
				return 1;
			case "QUARTERLY":
				return 3;
			case "SEMI_ANNUAL":
				return 6;
			case "ANNUALLY":
				return 12;
			default:
				return 1;
		}
	}

	private formatDate(date?: Date | null): string {
		if (!date) return "—";
		const d = new Date(date);
		const day = d.getDate().toString().padStart(2, "0");
		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"Mei",
			"Jun",
			"Jul",
			"Agu",
			"Sep",
			"Okt",
			"Nov",
			"Des",
		];
		const month = months[d.getMonth()] || "Agu";
		const year = d.getFullYear();
		return `${day} ${month} ${year}`;
	}

	private formatDueDate(
		dueDateDay: number,
		invoices?: { dueDate: Date; status: string }[],
	): string {
		const now = new Date();
		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"Mei",
			"Jun",
			"Jul",
			"Agu",
			"Sep",
			"Okt",
			"Nov",
			"Des",
		];

		if (invoices && invoices.length > 0) {
			const latest = invoices[0];
			const d = new Date(latest.dueDate);
			const day = d.getDate().toString().padStart(2, "0");
			const month = months[d.getMonth()] || "Agu";
			return `${day} ${month}`;
		}

		const day = dueDateDay.toString().padStart(2, "0");
		const month = months[now.getMonth()] || "Agu";
		return `${day} ${month}`;
	}

	private calculateUnpaidPeriod(
		invoices: Array<{
			dueDate: Date;
			periodMonth?: number | null;
			periodYear?: number | null;
			status: string;
		}>,
		startDate?: Date | null,
	): { month: number; year: number } {
		const pendingOrOverdue = invoices
			.filter(
				(inv) =>
					(inv.status === "PENDING" || inv.status === "OVERDUE") &&
					inv.periodMonth &&
					inv.periodYear,
			)
			.sort(
				(a, b) =>
					new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
			);

		if (pendingOrOverdue.length > 0) {
			const first = pendingOrOverdue[0];
			if (first.periodMonth != null && first.periodYear != null) {
				return {
					month: first.periodMonth,
					year: first.periodYear,
				};
			}
		}

		const paidInvoices = invoices
			.filter(
				(inv) =>
					inv.status === "PAID" &&
					inv.periodMonth != null &&
					inv.periodYear != null,
			)
			.sort(
				(a, b) =>
					new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
			);

		if (paidInvoices.length > 0) {
			const latest = paidInvoices[0];
			if (latest.periodMonth != null && latest.periodYear != null) {
				const nextMonth = (latest.periodMonth % 12) + 1;
				const nextYear =
					latest.periodMonth === 12 ? latest.periodYear + 1 : latest.periodYear;
				return { month: nextMonth, year: nextYear };
			}
		}

		if (startDate) {
			const start = new Date(startDate);
			return { month: start.getMonth() + 1, year: start.getFullYear() };
		}

		const now = new Date();
		return { month: now.getMonth() + 1, year: now.getFullYear() };
	}

	async getTenants(propertyId?: string): Promise<TenantItem[]> {
		const rawTenants = propertyId
			? await this.tenantRepo.findByPropertyId(propertyId)
			: await this.tenantRepo.findAll();

		return rawTenants.map((t) => {
			const activeContract = t.rentalContracts?.[0] || null;
			const room = activeContract?.room || null;

			// Determine payment status
			let paymentStatus: TenantPaymentStatus = "Lancar";
			if (activeContract?.invoices) {
				const hasOverdue = activeContract.invoices.some(
					(inv) =>
						inv.status === "OVERDUE" ||
						(inv.status === "PENDING" && new Date(inv.dueDate) < new Date()),
				);
				if (hasOverdue) {
					paymentStatus = "Terlambat";
				}
			}

			const phoneCanonical = sanitizePhone(t.phoneNumber);
			const cycleMonths = this.getCycleMonths(activeContract?.billingCycle);
			const baseMonthlyRent =
				room && Number(room.price) > 0 ? Number(room.price) : 850000;
			let totalCycleRent = baseMonthlyRent * cycleMonths;
			if (
				activeContract?.invoices?.[0]?.amount &&
				Number(activeContract.invoices[0].amount) > 0
			) {
				totalCycleRent = Number(activeContract.invoices[0].amount);
			}

			const dueDateDay = activeContract?.dueDateDay || 10;
			const depositAmount = t.deposit ? Number(t.deposit) : 0;
			const unpaidPeriod = this.calculateUnpaidPeriod(
				activeContract?.invoices || [],
				activeContract?.startDate,
			);

			return {
				id: t.id,
				propertyId: room?.propertyId || propertyId || "",
				name: t.name,
				birthDate: t.birthDate ? t.birthDate.toISOString().slice(0, 10) : null,
				nik: t.NIK,
				phone: phoneCanonical,
				displayPhone: formatDisplayPhone(t.phoneNumber),
				originAddress: t.originAddress || "",
				email: t.email || "",
				occupationStatus: (t.occupation === "Karyawan" ||
				t.occupation === "Mahasiswa"
					? t.occupation
					: "Lainnya") as OccupationStatus,
				institution: t.institution || t.occupation || "—",
				roomNo: room?.roomNumber || "—",
				rent: formatRupiah(totalCycleRent),
				monthlyRent: baseMonthlyRent,
				totalRent: totalCycleRent,
				duration: this.mapBillingCycleToDuration(activeContract?.billingCycle),
				startDate: activeContract?.startDate
					? this.formatDate(activeContract.startDate)
					: "—",
				dueDate: this.formatDueDate(dueDateDay, activeContract?.invoices),
				unpaidPeriod,
				vehicle: t.vehicle || null,
				deposit: formatRupiah(depositAmount),
				emergencyName: t.emergencyName || null,
				emergencyRelation: t.emergencyRelation || null,
				emergencyPhone: t.emergencyPhone
					? formatDisplayPhone(t.emergencyPhone)
					: null,
				registrationDate: t.createdAt.toISOString().slice(0, 10),
				notes: t.notes || null,
				ktpUrl: t.ktpUrl || null,
				paymentStatus,
				contractId: activeContract?.id,
				roomId: room?.id,
			};
		});
	}

	async getTenantById(id: string): Promise<TenantItem | null> {
		const t = await this.tenantRepo.findById(id);
		if (!t) return null;

		const activeContract = t.rentalContracts?.[0] || null;
		const room = activeContract?.room || null;

		let paymentStatus: TenantPaymentStatus = "Lancar";
		if (activeContract?.invoices) {
			const hasOverdue = activeContract.invoices.some(
				(inv) =>
					inv.status === "OVERDUE" ||
					(inv.status === "PENDING" && new Date(inv.dueDate) < new Date()),
			);
			if (hasOverdue) {
				paymentStatus = "Terlambat";
			}
		}

		const phoneCanonical = sanitizePhone(t.phoneNumber);
		const cycleMonths = this.getCycleMonths(activeContract?.billingCycle);
		const baseMonthlyRent =
			room && Number(room.price) > 0 ? Number(room.price) : 850000;
		let totalCycleRent = baseMonthlyRent * cycleMonths;
		if (
			activeContract?.invoices?.[0]?.amount &&
			Number(activeContract.invoices[0].amount) > 0
		) {
			totalCycleRent = Number(activeContract.invoices[0].amount);
		}

		const dueDateDay = activeContract?.dueDateDay || 10;
		const depositAmount = t.deposit ? Number(t.deposit) : 0;
		const unpaidPeriod = this.calculateUnpaidPeriod(
			activeContract?.invoices || [],
			activeContract?.startDate,
		);

		return {
			id: t.id,
			propertyId: room?.propertyId || "",
			name: t.name,
			birthDate: t.birthDate ? t.birthDate.toISOString().slice(0, 10) : null,
			nik: t.NIK,
			phone: phoneCanonical,
			displayPhone: formatDisplayPhone(t.phoneNumber),
			originAddress: t.originAddress || "",
			email: t.email || "",
			occupationStatus: (t.occupation === "Karyawan" ||
			t.occupation === "Mahasiswa"
				? t.occupation
				: "Lainnya") as OccupationStatus,
			institution: t.institution || t.occupation || "—",
			roomNo: room?.roomNumber || "—",
			rent: formatRupiah(totalCycleRent),
			monthlyRent: baseMonthlyRent,
			totalRent: totalCycleRent,
			duration: this.mapBillingCycleToDuration(activeContract?.billingCycle),
			startDate: activeContract?.startDate
				? this.formatDate(activeContract.startDate)
				: "—",
			dueDate: this.formatDueDate(dueDateDay, activeContract?.invoices),
			unpaidPeriod,
			vehicle: t.vehicle || null,
			deposit: formatRupiah(depositAmount),
			emergencyName: t.emergencyName || null,
			emergencyRelation: t.emergencyRelation || null,
			emergencyPhone: t.emergencyPhone
				? formatDisplayPhone(t.emergencyPhone)
				: null,
			registrationDate: t.createdAt.toISOString().slice(0, 10),
			notes: t.notes || null,
			ktpUrl: t.ktpUrl || null,
			paymentStatus,
			contractId: activeContract?.id,
			roomId: room?.id,
		};
	}

	async createTenant(
		propertyId: string,
		input: TenantFormValues,
		user?: SessionUser,
	): Promise<TenantItem> {
		const canonicalPhone = sanitizePhone(input.phone);
		const room = await this.roomRepo.findByRoomNumber(propertyId, input.roomNo);

		if (!room) {
			throw new Error(
				`Kamar ${input.roomNo} tidak ditemukan pada properti ini.`,
			);
		}

		const billingCycle = this.mapDurationToBillingCycle(input.duration);
		let cycleMonths = 1;
		if (billingCycle === "QUARTERLY") cycleMonths = 3;
		else if (billingCycle === "SEMI_ANNUAL") cycleMonths = 6;
		else if (billingCycle === "ANNUALLY") cycleMonths = 12;

		const parsedRent = parseRupiah(input.rent);
		const totalCycleRent =
			parsedRent > 0 ? parsedRent : Number(room.price) * cycleMonths;
		const monthlyRent =
			Number(room.price) > 0
				? Number(room.price)
				: Math.round(totalCycleRent / cycleMonths);
		const depositAmount = input.deposit ? parseRupiah(input.deposit) : 0;
		const initialPayment = depositAmount;

		const startDate = new Date(input.startDate || new Date());
		const birthDate = input.birthDate ? new Date(input.birthDate) : null;
		const dueDateDay = startDate.getDate() || 10;
		const emergencyPhoneClean = input.emergencyPhone
			? sanitizePhone(input.emergencyPhone)
			: null;
		const now = new Date();

		const invoicesToCreate: Array<{
			invoiceNumber: string;
			periodMonth: number;
			periodYear: number;
			amount: number;
			dueDate: Date;
			paidAt?: Date | null;
			status: "PAID" | "PENDING" | "OVERDUE";
		}> = [];

		const transactionsToCreate: Array<{
			propertyId: string;
			createdBy?: string | null;
			type: "INCOME";
			category: "RENT";
			classification: "OPERATIONAL";
			paymentMethod: "TRANSFER";
			amount: number;
			description: string;
			transactionDate: Date;
		}> = [];

		let calculatedEndDate: Date;

		if (input.markPastPeriodsPaid && startDate < now) {
			// Skenario 1: Migrasi Data Lampau (Banyak Periode Siklus Sewa LUNAS)
			const startY = startDate.getFullYear();
			const startM = startDate.getMonth();
			const curY = now.getFullYear();
			const curM = now.getMonth();
			const elapsedTotalMonths = Math.max(
				1,
				(curY - startY) * 12 + (curM - startM) + 1,
			);
			const numCycles = Math.max(
				1,
				Math.ceil(elapsedTotalMonths / cycleMonths),
			);

			calculatedEndDate = new Date(
				startY,
				startM + numCycles * cycleMonths,
				dueDateDay,
			);

			for (let c = 0; c < numCycles; c++) {
				const cycleStart = new Date(
					startY,
					startM + c * cycleMonths,
					dueDateDay,
				);
				const isPastOrCurrent = cycleStart <= now;
				const invStatus = isPastOrCurrent
					? ("PAID" as const)
					: ("PENDING" as const);
				const pMonth = cycleStart.getMonth() + 1;
				const pYear = cycleStart.getFullYear();
				const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-${c + 1}`;

				// 1 Invoice per Siklus Sewa (misal Rp 5.100.000 per Semester)
				invoicesToCreate.push({
					invoiceNumber: invNum,
					periodMonth: pMonth,
					periodYear: pYear,
					amount: totalCycleRent,
					dueDate: cycleStart,
					paidAt: isPastOrCurrent ? cycleStart : null,
					status: invStatus,
				});

				// Jika LUNAS: Distribusikan pencatatan kas per bulan (misal Rp 850.000 / bulan)
				if (isPastOrCurrent) {
					for (let m = 0; m < cycleMonths; m++) {
						const monthDate = new Date(
							startY,
							startM + c * cycleMonths + m,
							dueDateDay,
						);
						const monthName = getMonthName(monthDate.getMonth() + 1);
						transactionsToCreate.push({
							propertyId: room.propertyId,
							createdBy: user?.id,
							type: "INCOME",
							category: "RENT",
							classification: "OPERATIONAL",
							paymentMethod: "TRANSFER",
							amount: monthlyRent,
							description: `Pembayaran Sewa Kamar ${room.roomNumber} - ${input.name} (${monthName} ${monthDate.getFullYear()} · Bulan ${m + 1}/${cycleMonths})`,
							transactionDate: monthDate,
						});
					}
				}
			}
		} else if (initialPayment >= totalCycleRent) {
			// Skenario 2: Bayar Lunas Penuh di Awal untuk 1 Siklus Pertama
			calculatedEndDate = new Date(
				startDate.getFullYear(),
				startDate.getMonth() + cycleMonths,
				dueDateDay,
			);
			const pMonth = startDate.getMonth() + 1;
			const pYear = startDate.getFullYear();
			const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-1`;

			invoicesToCreate.push({
				invoiceNumber: invNum,
				periodMonth: pMonth,
				periodYear: pYear,
				amount: totalCycleRent,
				dueDate: startDate,
				paidAt: now,
				status: "PAID",
			});

			for (let m = 0; m < cycleMonths; m++) {
				const monthDate = new Date(
					startDate.getFullYear(),
					startDate.getMonth() + m,
					dueDateDay,
				);
				const monthName = getMonthName(monthDate.getMonth() + 1);
				transactionsToCreate.push({
					propertyId: room.propertyId,
					createdBy: user?.id,
					type: "INCOME",
					category: "RENT",
					classification: "OPERATIONAL",
					paymentMethod: "TRANSFER",
					amount: monthlyRent,
					description: `Pembayaran Sewa Awal Kamar ${room.roomNumber} - ${input.name} (${monthName} ${monthDate.getFullYear()} · Bulan ${m + 1}/${cycleMonths})`,
					transactionDate: monthDate,
				});
			}
		} else if (initialPayment > 0) {
			// Skenario 3: DP / Uang Muka
			calculatedEndDate = new Date(
				startDate.getFullYear(),
				startDate.getMonth() + cycleMonths,
				dueDateDay,
			);
			const pMonth = startDate.getMonth() + 1;
			const pYear = startDate.getFullYear();
			const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-1`;

			transactionsToCreate.push({
				propertyId: room.propertyId,
				createdBy: user?.id,
				type: "INCOME",
				category: "RENT",
				classification: "OPERATIONAL",
				paymentMethod: "TRANSFER",
				amount: initialPayment,
				description: `Uang Muka (DP) Sewa Kamar ${room.roomNumber} - ${input.name}`,
				transactionDate: now,
			});

			const remainingAmount =
				totalCycleRent > initialPayment
					? totalCycleRent - initialPayment
					: totalCycleRent;
			invoicesToCreate.push({
				invoiceNumber: invNum,
				periodMonth: pMonth,
				periodYear: pYear,
				amount: remainingAmount,
				dueDate: startDate,
				status: "PENDING",
			});
		} else {
			// Skenario 4: Belum Bayar Sama Sekali (Pending)
			calculatedEndDate = new Date(
				startDate.getFullYear(),
				startDate.getMonth() + cycleMonths,
				dueDateDay,
			);
			const pMonth = startDate.getMonth() + 1;
			const pYear = startDate.getFullYear();
			const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-1`;

			invoicesToCreate.push({
				invoiceNumber: invNum,
				periodMonth: pMonth,
				periodYear: pYear,
				amount: totalCycleRent,
				dueDate: startDate,
				status: "PENDING",
			});
		}

		const { tenant, contract } = await this.tenantRepo.createTenantWithContract(
			{
				tenantPayload: {
					name: input.name,
					nik: input.nik,
					phone: canonicalPhone,
					whatsappNumber: canonicalPhone,
					email: input.email || null,
					birthDate,
					occupation: input.occupationStatus,
					institution: input.institution || null,
					originAddress: input.originAddress || null,
					emergencyName: input.emergencyName || null,
					emergencyRelation: input.emergencyRelation || null,
					emergencyPhone: emergencyPhoneClean,
					vehicle: input.vehicle || null,
					deposit: depositAmount,
					notes: input.notes || null,
					ktpUrl: input.ktpUrl || null,
				},
				contractPayload: {
					roomId: room.id,
					billingCycle,
					startDate,
					endDate: calculatedEndDate,
					dueDateDay,
				},
				invoices: invoicesToCreate,
				transactions: transactionsToCreate,
			},
		);

		return {
			id: tenant.id,
			propertyId,
			name: tenant.name,
			birthDate: tenant.birthDate
				? tenant.birthDate.toISOString().slice(0, 10)
				: null,
			nik: tenant.NIK,
			phone: canonicalPhone,
			displayPhone: formatDisplayPhone(canonicalPhone),
			originAddress: tenant.originAddress || "",
			email: tenant.email || "",
			occupationStatus: input.occupationStatus,
			institution: input.institution || input.occupationStatus,
			roomNo: room.roomNumber,
			rent: formatRupiah(totalCycleRent),
			duration: input.duration,
			startDate: this.formatDate(contract.startDate),
			dueDate: this.formatDueDate(dueDateDay),
			vehicle: input.vehicle || null,
			deposit: formatRupiah(depositAmount),
			emergencyName: input.emergencyName || null,
			emergencyRelation: input.emergencyRelation || null,
			emergencyPhone: input.emergencyPhone || null,
			registrationDate: tenant.createdAt.toISOString().slice(0, 10),
			notes: input.notes || null,
			ktpUrl: tenant.ktpUrl || null,
			paymentStatus: "Lancar",
		};
	}

	async updateTenant(
		id: string,
		propertyId: string,
		input: TenantFormValues,
	): Promise<TenantItem> {
		const canonicalPhone = sanitizePhone(input.phone);
		let roomId: string | undefined;

		if (input.roomNo) {
			const room = await this.roomRepo.findByRoomNumber(
				propertyId,
				input.roomNo,
			);
			if (room) {
				roomId = room.id;
			}
		}

		const billingCycle = this.mapDurationToBillingCycle(input.duration);
		const startDate = input.startDate ? new Date(input.startDate) : undefined;
		const birthDate = input.birthDate ? new Date(input.birthDate) : null;
		const dueDateDay = startDate?.getDate();
		const depositAmount = input.deposit
			? parseRupiah(input.deposit)
			: undefined;
		const emergencyPhoneClean = input.emergencyPhone
			? sanitizePhone(input.emergencyPhone)
			: null;

		const updatedTenant = await this.tenantRepo.updateTenantWithContract(id, {
			name: input.name,
			nik: input.nik,
			phone: canonicalPhone,
			whatsappNumber: canonicalPhone,
			email: input.email || null,
			birthDate,
			occupation: input.occupationStatus,
			institution: input.institution || null,
			originAddress: input.originAddress || null,
			emergencyName: input.emergencyName || null,
			emergencyRelation: input.emergencyRelation || null,
			emergencyPhone: emergencyPhoneClean,
			vehicle: input.vehicle || null,
			deposit: depositAmount,
			notes: input.notes || null,
			ktpUrl: input.ktpUrl !== undefined ? input.ktpUrl : undefined,
			roomId,
			billingCycle,
			startDate,
			dueDateDay,
		});

		const rentAmount = parseRupiah(input.rent);

		return {
			id: updatedTenant.id,
			propertyId,
			name: updatedTenant.name,
			birthDate: updatedTenant.birthDate
				? updatedTenant.birthDate.toISOString().slice(0, 10)
				: null,
			nik: updatedTenant.NIK,
			phone: canonicalPhone,
			displayPhone: formatDisplayPhone(canonicalPhone),
			originAddress: updatedTenant.originAddress || "",
			email: updatedTenant.email || "",
			occupationStatus: input.occupationStatus,
			institution: input.institution || input.occupationStatus,
			roomNo: input.roomNo,
			rent: formatRupiah(rentAmount),
			duration: input.duration,
			startDate: input.startDate || "—",
			dueDate: input.dueDate || "—",
			vehicle: input.vehicle || null,
			deposit: input.deposit || formatRupiah(0),
			emergencyName: input.emergencyName || null,
			emergencyRelation: input.emergencyRelation || null,
			emergencyPhone: input.emergencyPhone || null,
			registrationDate: updatedTenant.createdAt.toISOString().slice(0, 10),
			notes: input.notes || null,
			paymentStatus: "Lancar",
		};
	}

	async deleteTenant(id: string): Promise<{ success: boolean; id: string }> {
		await this.tenantRepo.deleteTenant(id);
		return { success: true, id };
	}
}

export const tenantService = new TenantService();
