export interface ReportScheduleCheckOptions {
	now: Date;
	scheduleDay: number;
	scheduleTime?: string;
}

/**
 * Checks whether the monthly report automation schedule is due at the current time.
 * Calculates time in Indonesian Western Time (WIB / UTC+7).
 */
export function isReportScheduleDue(
	options: ReportScheduleCheckOptions,
): boolean {
	const wibDate = new Date(options.now.getTime() + 7 * 60 * 60 * 1000);
	const currentDay = wibDate.getUTCDate();
	const currentHour = wibDate.getUTCHours();
	const [schedHourStr] = (options.scheduleTime || "08:00").split(":");
	const scheduledHour = Number.parseInt(schedHourStr, 10);
	return currentDay === options.scheduleDay && currentHour === scheduledHour;
}
