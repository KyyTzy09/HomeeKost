import {
	type PropertyRepository,
	propertyRepository,
} from "../repositories/property.repository.ts";
import {
	type UserRepository,
	userRepository,
} from "../repositories/user.repository.ts";

export class PropertySessionService {
	constructor(
		private readonly userRepo: UserRepository = userRepository,
		private readonly propertyRepo: PropertyRepository = propertyRepository,
	) {}

	async setActiveProperty(
		userId: string,
		propertyId: string,
	): Promise<{ success: boolean; propertyId: string; propertyName: string }> {
		const user = await this.userRepo.findUserWithRoleAndAccess(userId);

		if (!user) {
			throw new Error("User tidak ditemukan.");
		}

		const isSuperAdmin = user.role.name === "SUPER_ADMIN";

		if (!isSuperAdmin) {
			const hasAccess =
				user.assignedPropertyId === propertyId ||
				user.propertyAccesses.some((a) => a.propertyId === propertyId);

			if (!hasAccess) {
				throw new Error("Anda tidak memiliki hak akses ke cabang kos ini.");
			}
		}

		const property = await this.propertyRepo.findById(propertyId);

		if (!property) {
			throw new Error("Properti kos tidak ditemukan.");
		}

		return {
			success: true,
			propertyId: property.id,
			propertyName: property.name,
		};
	}
}

export const propertySessionService = new PropertySessionService();
