import { hashPassword } from "better-auth/crypto";
import { prisma } from "../../src/db.js";
import extractedData from "./extracted-data.json" with { type: "json" };

/**
 * Production Seeder for HomeeKost Platform
 * Seeds authentic financial records, 2 properties, rooms, tenants, incomes & expenses
 * directly aligned with `Laporan_Keuangan_Kost(1).xlsx`.
 */
export async function seedProduction() {
	console.log("🚀 Starting HomeeKost Production Seeding...");

	// 1. Roles: Only SUPER_ADMIN and ADMIN
	const superAdminRole = await prisma.role.upsert({
		where: { name: "SUPER_ADMIN" },
		update: {},
		create: {
			name: "SUPER_ADMIN",
			description: "Pemilik Kos / Owner dengan akses penuh seluruh cabang",
		},
	});

	await prisma.role.upsert({
		where: { name: "ADMIN" },
		update: {},
		create: {
			name: "ADMIN",
			description: "Staf Pengelola Cabang Kos Operasional",
		},
	});
	console.log("✅ Roles created: SUPER_ADMIN & ADMIN.");

	// 2. SuperAdmin Owner Account
	const passwordHash = await hashPassword("admin123");
	const superAdminUser = await prisma.user.upsert({
		where: { email: "owner@homeekost.com" },
		update: {
			name: "Owner HomeeKost",
			roleId: superAdminRole.id,
		},
		create: {
			id: "usr_owner_superadmin",
			name: "Owner HomeeKost",
			email: "owner@homeekost.com",
			roleId: superAdminRole.id,
			emailVerified: true,
		},
	});

	await prisma.account.upsert({
		where: {
			id: "acc_owner_superadmin",
		},
		update: {
			password: passwordHash,
		},
		create: {
			id: "acc_owner_superadmin",
			userId: superAdminUser.id,
			accountId: "owner@homeekost.com",
			providerId: "credential",
			password: passwordHash,
		},
	});
	console.log("✅ SuperAdmin User seeded: owner@homeekost.com");

	// 3. Properties (Kost Bahari & HomeeKost)
	const propBahari = await prisma.property.upsert({
		where: { id: "prop_bahari_01" },
		update: {
			name: "Kost Bahari",
		},
		create: {
			id: "prop_bahari_01",
			name: "Kost Bahari",
			address: "Jl. Bahari Raya No. 12, Yogyakarta",
			description: "Cabang Kost Bahari dengan fasilitas nyaman dan tenang.",
		},
	});

	const propHomeekost = await prisma.property.upsert({
		where: { id: "prop_homeekost_02" },
		update: {
			name: "HomeeKost",
		},
		create: {
			id: "prop_homeekost_02",
			name: "HomeeKost",
			address: "Jl. Utama Homee No. 88, Sleman, Yogyakarta",
			description: "Cabang Utama HomeeKost eksklusif dan strategis.",
		},
	});
	console.log("✅ Properties seeded: Kost Bahari & HomeeKost.");

	// 4. Rooms (22 Rooms)
	const roomMap = new Map<string, string>(); // key: `${propId}_${roomNo}` -> roomId

	for (const r of extractedData.rooms) {
		const propertyId =
			r.kostName === "Kost Bahari" ? propBahari.id : propHomeekost.id;
		const existingRoom = await prisma.room.findFirst({
			where: {
				propertyId,
				roomNumber: r.roomNo,
			},
		});

		let roomId = existingRoom?.id;
		if (existingRoom) {
			await prisma.room.update({
				where: { id: existingRoom.id },
				data: {
					price: r.price,
					status: r.status as "VACANT" | "OCCUPIED",
				},
			});
		} else {
			const newRoom = await prisma.room.create({
				data: {
					propertyId,
					roomNumber: r.roomNo,
					type: "Standard",
					price: r.price,
					status: r.status as "VACANT" | "OCCUPIED",
				},
			});
			roomId = newRoom.id;
		}

		if (roomId) {
			roomMap.set(`${propertyId}_${r.roomNo}`, roomId);
		}
	}
	console.log(`✅ Rooms seeded: ${roomMap.size} rooms.`);

	// 5. Unique Tenants & Rental Contracts
	// Extract unique tenants from incomes
	const tenantMap = new Map<string, string>(); // key: `${propId}_${roomNo}_${name}` -> tenantId

	for (const inc of extractedData.incomes) {
		const propertyId =
			inc.kost === "Kost Bahari" ? propBahari.id : propHomeekost.id;
		const key = `${propertyId}_${inc.roomNo}_${inc.tenantName}`;

		if (!tenantMap.has(key)) {
			const roomId = roomMap.get(`${propertyId}_${inc.roomNo}`);
			const canonicalPhone = `0812${Math.floor(10000000 + Math.random() * 90000000)}`;
			const nikPlaceholder = `3302${Math.floor(100000000000 + Math.random() * 900000000000)}`;

			// Upsert Tenant
			const existingTenant = await prisma.tenant.findFirst({
				where: {
					name: inc.tenantName,
					rentalContracts: {
						some: {
							roomId: roomId || undefined,
						},
					},
				},
			});

			let tenantId = existingTenant?.id;
			if (!existingTenant) {
				const newTenant = await prisma.tenant.create({
					data: {
						name: inc.tenantName,
						NIK: nikPlaceholder,
						phoneNumber: canonicalPhone,
						whatsappNumber: canonicalPhone,
						occupation: "Mahasiswa / Pekerja",
						status: "ACTIVE",
					},
				});
				tenantId = newTenant.id;

				if (roomId) {
					await prisma.rentalContract.create({
						data: {
							tenantId: newTenant.id,
							roomId,
							billingCycle: "MONTHLY",
							startDate: new Date(`${inc.month}-01`),
							dueDateDay: 1,
							status: "ACTIVE",
						},
					});
				}
			}

			if (tenantId) {
				tenantMap.set(key, tenantId);
			}
		}
	}
	console.log(`✅ Tenants seeded: ${tenantMap.size} unique tenants.`);

	// 6. Clean Existing Transactions from Seed to ensure 100% idempotency
	await prisma.transaction.deleteMany({
		where: {
			createdBy: superAdminUser.id,
		},
	});
	console.log("🧹 Cleaned past transactions for clean seeder import.");

	// 7. Seed Real Incomes (105 Rows)
	const incomeRecords = extractedData.incomes.map((inc) => {
		const propertyId =
			inc.kost === "Kost Bahari" ? propBahari.id : propHomeekost.id;
		return {
			propertyId,
			createdBy: superAdminUser.id,
			type: "INCOME" as const,
			category: "RENT" as const,
			classification: "OPERATIONAL" as const,
			paymentMethod:
				inc.method === "CASH" ? ("CASH" as const) : ("TRANSFER" as const),
			amount: inc.amount,
			description: `${inc.type} Kamar ${inc.roomNo} - ${inc.tenantName}`,
			transactionDate: new Date(inc.date),
		};
	});

	await prisma.transaction.createMany({
		data: incomeRecords,
	});
	console.log(`✅ Income transactions seeded: ${incomeRecords.length} records.`);

	// 8. Seed Real Expenses (50 Rows)
	const expenseRecords: Array<{
		propertyId: string;
		createdBy: string;
		type: "EXPENSE";
		category: "UTILITIES" | "INTERNET" | "SALARY" | "MAINTENANCE" | "OTHER";
		classification: "OPERATIONAL" | "INVESTMENT";
		paymentMethod: "TRANSFER";
		amount: number;
		description: string;
		transactionDate: Date;
	}> = [];

	for (const exp of extractedData.expenses) {
		const dateObj = new Date(exp.date);
		const category = exp.category as
			| "UTILITIES"
			| "INTERNET"
			| "SALARY"
			| "MAINTENANCE"
			| "OTHER";
		const classification = exp.classification as "OPERATIONAL" | "INVESTMENT";

		if (exp.property === "Bahari") {
			expenseRecords.push({
				propertyId: propBahari.id,
				createdBy: superAdminUser.id,
				type: "EXPENSE",
				category,
				classification,
				paymentMethod: "TRANSFER",
				amount: exp.amount,
				description: exp.desc,
				transactionDate: dateObj,
			});
		} else if (exp.property === "Homeekost") {
			expenseRecords.push({
				propertyId: propHomeekost.id,
				createdBy: superAdminUser.id,
				type: "EXPENSE",
				category,
				classification,
				paymentMethod: "TRANSFER",
				amount: exp.amount,
				description: exp.desc,
				transactionDate: dateObj,
			});
		} else if (exp.property === "Both") {
			// Split 50:50 between Bahari & HomeeKost
			const halfAmount = Math.round(exp.amount / 2);
			expenseRecords.push({
				propertyId: propBahari.id,
				createdBy: superAdminUser.id,
				type: "EXPENSE",
				category,
				classification,
				paymentMethod: "TRANSFER",
				amount: halfAmount,
				description: `${exp.desc} (50% Alokasi Bahari)`,
				transactionDate: dateObj,
			});
			expenseRecords.push({
				propertyId: propHomeekost.id,
				createdBy: superAdminUser.id,
				type: "EXPENSE",
				category,
				classification,
				paymentMethod: "TRANSFER",
				amount: exp.amount - halfAmount,
				description: `${exp.desc} (50% Alokasi HomeeKost)`,
				transactionDate: dateObj,
			});
		}
	}

	await prisma.transaction.createMany({
		data: expenseRecords,
	});
	console.log(
		`✅ Expense transactions seeded: ${expenseRecords.length} records.`,
	);

	console.log("🎉 Production Database Seeding successfully completed!");
}

// Allow standalone execution: npx tsx prisma/seeders/production.seed.ts
if (process.argv[1]?.endsWith("production.seed.ts")) {
	seedProduction()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("❌ Seeding failed:", err);
			process.exit(1);
		});
}
