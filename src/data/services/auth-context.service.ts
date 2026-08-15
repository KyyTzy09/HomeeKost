import type {
	DashboardContextData,
	PropertySummary,
	UserRole,
} from "../../common/types/index.ts";
import {
	type PropertyRepository,
	propertyRepository,
} from "../repositories/property.repository.ts";
import {
	type UserRepository,
	userRepository,
} from "../repositories/user.repository.ts";

export class AuthContextService {
	constructor(
		private readonly userRepo: UserRepository = userRepository,
		private readonly propertyRepo: PropertyRepository = propertyRepository,
	) {}

	async resolveDashboardContext(
		userId: string,
		cookiePropertyId?: string,
	): Promise<DashboardContextData | null> {
		const user = await this.userRepo.findUserWithRoleAndAccess(userId);

		if (!user) {
			return null;
		}

		const roleName = user.role.name as UserRole;
		const isSuperAdmin = roleName === "SUPER_ADMIN";

		let accessibleProperties: PropertySummary[] = [];
		let activeProperty: PropertySummary | null = null;

		if (isSuperAdmin) {
			const allProperties = await this.propertyRepo.findAll();
			accessibleProperties = allProperties;

			if (cookiePropertyId) {
				const matched = allProperties.find((p) => p.id === cookiePropertyId);
				if (matched) {
					activeProperty = matched;
				}
			}

			if (!activeProperty && allProperties.length > 0) {
				activeProperty = allProperties[0];
			}
		} else {
			const userProperties =
				await this.propertyRepo.findAccessibleByUserId(userId);
			accessibleProperties = userProperties;
			activeProperty =
				accessibleProperties.length > 0 ? accessibleProperties[0] : null;
		}

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				roleId: user.roleId,
				assignedPropertyId: user.assignedPropertyId,
			},
			role: roleName,
			isSuperAdmin,
			activeProperty,
			accessibleProperties,
		};
	}
}

export const authContextService = new AuthContextService();
