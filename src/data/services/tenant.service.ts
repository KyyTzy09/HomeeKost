import type {
	OccupationStatus,
	RentDuration,
	TenantItem,
	TenantPaymentStatus,
} from "../../common/types/index.ts";
import type { TenantFormValues } from "../../common/validations/index.ts";
import type { BillingCycle } from "../../generated/prisma/client.js";
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
			const monthlyPrice = room ? Number(room.monthlyPrice) : 850000;
			const dueDateDay = activeContract?.dueDateDay || 10;
			const depositAmount = t.deposit ? Number(t.deposit) : 0;

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
				rent: formatRupiah(monthlyPrice),
				duration: this.mapBillingCycleToDuration(activeContract?.billingCycle),
				startDate: activeContract?.startDate
					? this.formatDate(activeContract.startDate)
					: "—",
				dueDate: this.formatDueDate(dueDateDay, activeContract?.invoices),
				vehicle: t.vehicle || null,
				deposit: formatRupiah(depositAmount),
				emergencyName: t.emergencyName || null,
				emergencyRelation: t.emergencyRelation || null,
				emergencyPhone: t.emergencyPhone
					? formatDisplayPhone(t.emergencyPhone)
					: null,
				registrationDate: t.createdAt.toISOString().slice(0, 10),
				notes: t.notes || null,
				paymentStatus,
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
		const monthlyPrice = room ? Number(room.monthlyPrice) : 850000;
		const dueDateDay = activeContract?.dueDateDay || 10;
		const depositAmount = t.deposit ? Number(t.deposit) : 0;

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
			rent: formatRupiah(monthlyPrice),
			duration: this.mapBillingCycleToDuration(activeContract?.billingCycle),
			startDate: activeContract?.startDate
				? this.formatDate(activeContract.startDate)
				: "—",
			dueDate: this.formatDueDate(dueDateDay, activeContract?.invoices),
			vehicle: t.vehicle || null,
			deposit: formatRupiah(depositAmount),
			emergencyName: t.emergencyName || null,
			emergencyRelation: t.emergencyRelation || null,
			emergencyPhone: t.emergencyPhone
				? formatDisplayPhone(t.emergencyPhone)
				: null,
			registrationDate: t.createdAt.toISOString().slice(0, 10),
			notes: t.notes || null,
			paymentStatus,
		};
	}

	async createTenant(
		propertyId: string,
		input: TenantFormValues,
	): Promise<TenantItem> {
		const canonicalPhone = sanitizePhone(input.phone);
		const room = await this.roomRepo.findByRoomNumber(propertyId, input.roomNo);

		if (!room) {
			throw new Error(
				`Kamar ${input.roomNo} tidak ditemukan pada properti ini.`,
			);
		}

		const rentAmount = parseRupiah(input.rent) || Number(room.monthlyPrice);
		const depositAmount = input.deposit ? parseRupiah(input.deposit) : 0;
		const billingCycle = this.mapDurationToBillingCycle(input.duration);
		const startDate = new Date(input.startDate || new Date());
		const birthDate = input.birthDate ? new Date(input.birthDate) : null;
		const dueDateDay = startDate.getDate() || 10;
		const emergencyPhoneClean = input.emergencyPhone
			? sanitizePhone(input.emergencyPhone)
			: null;

		const { tenant, contract } = await this.tenantRepo.createTenantWithContract(
			{
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
				roomId: room.id,
				billingCycle,
				startDate,
				dueDateDay,
				rentAmount,
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
			rent: formatRupiah(rentAmount),
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
