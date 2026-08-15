import type {
	BillingCycle,
	ContractStatus,
	RentalContract,
	Tenant,
	TenantStatus,
} from "../../generated/prisma/client.js";

export type TenantBase = Tenant;
export type RentalContractBase = RentalContract;
export type ContractStatusEnum = ContractStatus;
export type TenantPrismaStatus = TenantStatus;
export type BillingCycleEnum = BillingCycle;

export type TenantStatusEnum = "Aktif" | "Akan Berakhir" | "Nonaktif";
export type PaymentStatusEnum = "Lunas" | "Pending" | "Menunggak";

export interface TenantDomainModel {
	id: string;
	propertyId: string;
	propertyName: string;
	roomId: string;
	roomNo: string;
	name: string;
	phone: string;
	nik?: string | null;
	job?: string | null;
	status: TenantStatusEnum;
	paymentStatus: PaymentStatusEnum;
	entryDate: string;
	dueDate: string;
	contractDurationMonths: number;
	monthlyRentPrice: string;
	emergencyContact?: string | null;
	notes?: string | null;
	idCardUrl?: string | null;
}
