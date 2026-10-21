import { prisma } from "../../db.ts";

export class SystemSettingRepository {
	async getSetting<T>(key: string): Promise<T | null> {
		const setting = await prisma.systemSetting.findUnique({
			where: { key },
		});
		if (!setting?.value) return null;
		try {
			return JSON.parse(setting.value) as T;
		} catch {
			return null;
		}
	}

	async setSetting<T>(key: string, value: T): Promise<void> {
		const stringValue = JSON.stringify(value);
		await prisma.systemSetting.upsert({
			where: { key },
			update: { value: stringValue },
			create: { key, value: stringValue },
		});
	}
}

export const systemSettingRepository = new SystemSettingRepository();
