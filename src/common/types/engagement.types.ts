export type AnnouncementCategory =
	| "KERJA_BAKTI"
	| "MAINTENANCE"
	| "ACARA"
	| "UMUM";

export type EngagementTemplateCategory =
	| "Sambutan"
	| "Pembayaran"
	| "Ulang Tahun"
	| "Kerja Bakti"
	| "Umum";

export interface EngagementTemplateItem {
	id: string | number;
	name: string;
	content: string;
	category?: EngagementTemplateCategory | string;
	icon?: string;
}

export interface UpcomingBirthdayItem {
	id: string | number;
	tenantId?: string;
	name: string;
	room: string;
	property: string;
	birthDate: string; // e.g. "10 Agustus", "2002-08-10"
	daysRemaining: number; // 0 = hari ini, 1 = besok, dst.
	relativeLabel: string; // e.g. "Besok", "Hari ini", "20 Agustus"
	phone: string;
}

export interface AnnouncementItem {
	id: string | number;
	propertyId?: string | null;
	propertyName: string;
	title: string;
	content: string;
	category: AnnouncementCategory;
	isBroadcast: boolean;
	sentAt?: string | null;
	createdAt?: string;
}

export interface EngagementRecipient {
	tenantId: string;
	name: string;
	phone: string;
	roomNumber: string;
	propertyId: string;
	propertyName: string;
	startDate: string; // ISO date string mulai sewa
	birthDate?: string | null;
	daysRemaining?: number | null;
	relativeBirthdayLabel?: string | null;
	lastPaymentDate?: string | null;
	isOnTimePayment?: boolean;
	isSentToday?: boolean;
}

export interface EngagementDashboardData {
	recipients: EngagementRecipient[];
	upcomingBirthdays: UpcomingBirthdayItem[];
	recentAnnouncements: AnnouncementItem[];
	recentLogs: unknown[];
	totalUpcomingBirthdays: number;
}
