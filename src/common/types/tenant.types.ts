export type OccupationStatus = "Mahasiswa" | "Karyawan" | "Lainnya";
export type RentDuration = "Bulanan" | "Triwulan" | "Semesteran" | "Tahunan";
export type TenantPaymentStatus = "Lancar" | "Terlambat";

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
	paymentStatus: TenantPaymentStatus;
}
