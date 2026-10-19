import { compareRoomNumbers } from "../common/helpers/room.helper.ts";
import type { EngagementRecipient } from "../common/types/engagement.types.ts";

/**
 * Filter and sort engagement recipients dynamically based on template category and property.
 *
 * @param recipients List of candidate recipients
 * @param category Template category (e.g. "Sambutan", "Ulang Tahun", "Pembayaran", "Kerja Bakti", "Umum")
 * @param propertyId Optional property filter ("ALL" or undefined means all properties)
 * @param now Optional reference date for calculating relative time (defaults to current Date)
 */
export function filterRecipientsByTemplate(
	recipients: EngagementRecipient[],
	category?: string,
	propertyId?: string,
	now: Date = new Date(),
): EngagementRecipient[] {
	if (!recipients || recipients.length === 0) {
		return [];
	}

	// 1. Property filtering
	const filtered =
		propertyId && propertyId !== "ALL"
			? recipients.filter((r) => r.propertyId === propertyId)
			: [...recipients];

	// 2. Category filtering
	if (category === "Sambutan") {
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		// startDate within the last 30 days based on current date
		// forgiving up to 1 day into the future to avoid timezone/clock skew
		const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		const recent = filtered.filter((r) => {
			if (!r.startDate) return false;
			const startTime = new Date(r.startDate).getTime();
			if (Number.isNaN(startTime)) return false;
			return (
				startTime >= thirtyDaysAgo.getTime() && startTime <= nextDay.getTime()
			);
		});

		if (recent.length > 0) {
			return recent.sort(
				(a, b) =>
					new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
			);
		}

		// Fallback to top 5 newest tenants sorted by startDate desc
		return [...filtered]
			.sort(
				(a, b) =>
					new Date(b.startDate || 0).getTime() -
					new Date(a.startDate || 0).getTime(),
			)
			.slice(0, 5);
	}

	if (category === "Ulang Tahun") {
		return filtered
			.filter(
				(r) =>
					r.daysRemaining !== null &&
					r.daysRemaining !== undefined &&
					r.daysRemaining >= 0 &&
					r.daysRemaining <= 5,
			)
			.sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));
	}

	if (category === "Pembayaran") {
		return filtered
			.filter((r) => r.isOnTimePayment === true)
			.sort((a, b) => {
				const timeA = a.lastPaymentDate
					? new Date(a.lastPaymentDate).getTime()
					: 0;
				const timeB = b.lastPaymentDate
					? new Date(b.lastPaymentDate).getTime()
					: 0;
				return timeB - timeA;
			});
	}

	// Any other category (e.g. "Kerja Bakti", "Umum", or undefined/empty):
	// All active tenants sorted by roomNumber asc (natural sort)
	return [...filtered].sort((a, b) =>
		compareRoomNumbers(a.roomNumber || "", b.roomNumber || ""),
	);
}

/**
 * Replace placeholders ({nama}, {kamar}, {kos} / {kost}) in message templates.
 */
export function personalizeMessage(
	templateContent: string,
	recipient: { name?: string; roomNumber?: string; propertyName?: string },
): string {
	if (!templateContent) return "";

	return templateContent
		.replace(/\{nama\}/gi, () => recipient.name || "")
		.replace(/\{kamar\}/gi, () => recipient.roomNumber || "")
		.replace(/\{kost?\}/gi, () => recipient.propertyName || "");
}
