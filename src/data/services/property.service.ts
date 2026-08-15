import type { PropertyItem } from "../../common/types/index.ts";
import type { PropertyFormValues } from "../../common/validations/index.ts";
import { propertyRepository } from "../repositories/property.repository.ts";

export class PropertyService {
	constructor(private readonly propertyRepo = propertyRepository) {}

	async getPropertiesWithStats(): Promise<PropertyItem[]> {
		const properties = await this.propertyRepo.findAll();

		return properties.map((p) => {
			const totalRooms = p.rooms.length;
			const occupiedCount = p.rooms.filter(
				(r) => r.status === "OCCUPIED",
			).length;

			return {
				id: p.id,
				code:
					p.name
						.replace(/[^a-zA-Z0-9]/g, "")
						.slice(-1)
						.toUpperCase() || "A",
				name: p.name,
				address: p.address || "",
				description: p.description || "",
				bankAccountInfo: null,
				imageUrl: p.imageUrl || null,
				rooms: totalRooms,
				tenants: occupiedCount,
			};
		});
	}

	async getPropertyById(id: string): Promise<PropertyItem | null> {
		const p = await this.propertyRepo.findById(id);
		if (!p) return null;

		const totalRooms = p.rooms.length;
		const occupiedCount = p.rooms.filter((r) => r.status === "OCCUPIED").length;

		return {
			id: p.id,
			code:
				p.name
					.replace(/[^a-zA-Z0-9]/g, "")
					.slice(-1)
					.toUpperCase() || "A",
			name: p.name,
			address: p.address || "",
			description: p.description || "",
			bankAccountInfo: null,
			imageUrl: p.imageUrl || null,
			rooms: totalRooms,
			tenants: occupiedCount,
		};
	}

	async createProperty(input: PropertyFormValues): Promise<PropertyItem> {
		const created = await this.propertyRepo.createProperty({
			name: input.name,
			address: input.address,
			description: input.description,
			imageUrl: input.imageUrl,
		});

		return {
			id: created.id,
			code:
				created.name
					.replace(/[^a-zA-Z0-9]/g, "")
					.slice(-1)
					.toUpperCase() || "A",
			name: created.name,
			address: created.address || "",
			description: created.description || "",
			bankAccountInfo: null,
			imageUrl: created.imageUrl || null,
			rooms: 0,
			tenants: 0,
		};
	}

	async updateProperty(
		id: string,
		input: PropertyFormValues,
	): Promise<PropertyItem> {
		const updated = await this.propertyRepo.updateProperty(id, {
			name: input.name,
			address: input.address,
			description: input.description,
			imageUrl: input.imageUrl,
		});

		const totalRooms = updated.rooms?.length ?? 0;
		const occupiedCount =
			updated.rooms?.filter((r) => r.status === "OCCUPIED").length ?? 0;

		return {
			id: updated.id,
			code:
				updated.name
					.replace(/[^a-zA-Z0-9]/g, "")
					.slice(-1)
					.toUpperCase() || "A",
			name: updated.name,
			address: updated.address || "",
			description: updated.description || "",
			bankAccountInfo: null,
			imageUrl: updated.imageUrl || null,
			rooms: totalRooms,
			tenants: occupiedCount,
		};
	}

	async deleteProperty(id: string): Promise<{ success: boolean; id: string }> {
		await this.propertyRepo.deleteProperty(id);
		return { success: true, id };
	}
}

export const propertyService = new PropertyService();
