export type OccupationStatus = "Mahasiswa" | "Karyawan" | "Lainnya";
export type RentDuration = "Bulanan" | "Triwulan" | "Semesteran" | "Tahunan";
export type TenantPaymentStatus = "Lunas" | "Belum Lunas" | "Terlambat";
export type ContractUpdateScope = "ALL_HISTORY" | "CURRENT_ONLY";

export interface TenantItem {
	id: string;
	propertyId: string;
	name: string;
	birthDate?: string | null;
	nik: string;
	phone: string; // Canonical 628...
	displayPhone?: string; // Formatted for UI 08...
	originAddress?: string | null;
	email?: string | null;
	occupationStatus: OccupationStatus;
	institution?: string | null;
	roomNo: string;
	rent: string;
	duration: RentDuration;
	startDate: string;
	dueDate: string;
	vehicle?: string | null;
	deposit?: string | null;
	emergencyName?: string | null;
	emergencyRelation?: string | null;
	emergencyPhone?: string | null;
	registrationDate: string;
	notes?: string | null;
	ktpUrl?: string | null;
	paymentStatus: TenantPaymentStatus;
	contractId?: string;
	roomId?: string;
	monthlyRent?: number;
	totalRent?: number;
	unpaidPeriod?: { month: number; year: number } | null;
}
