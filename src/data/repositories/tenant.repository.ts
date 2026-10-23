import { prisma } from "../../db.ts";
import type {
	BillingCycle,
	PrismaClient,
} from "../../generated/prisma/client.js";
import {
	updateDescriptionRoom,
	updateDescriptionTenantName,
} from "../../lib/transaction-desc-utils.ts";

export interface CreateTenantContractParams {
	tenantPayload: {
		name: string;
		nik: string;
		phone: string;
		whatsappNumber?: string | null;
		email?: string | null;
		birthDate?: Date | null;
		occupation?: string | null;
		institution?: string | null;
		originAddress?: string | null;
		emergencyName?: string | null;
		emergencyRelation?: string | null;
		emergencyPhone?: string | null;
		vehicle?: string | null;
		deposit?: number | null;
		notes?: string | null;
		ktpUrl?: string | null;
	};
	contractPayload: {
		roomId: string;
		billingCycle: BillingCycle;
		startDate: Date;
		endDate: Date;
		dueDateDay: number;
	};
	invoices: Array<{
		invoiceNumber: string;
		periodMonth: number;
		periodYear: number;
		amount: number;
		dueDate: Date;
		paidAt?: Date | null;
		status: "PAID" | "PENDING" | "OVERDUE";
	}>;
	transactions: Array<{
		propertyId: string;
		createdBy?: string | null;
		type: "INCOME" | "EXPENSE";
		category:
			| "RENT"
			| "UTILITIES"
			| "INTERNET"
			| "MAINTENANCE"
			| "SALARY"
			| "OTHER";
		classification: "OPERATIONAL" | "INVESTMENT";
		paymentMethod: "TRANSFER" | "CASH" | "QRIS";
		amount: number;
		description: string;
		transactionDate: Date;
	}>;
}

export class TenantRepository {
	constructor(private readonly db: PrismaClient = prisma) {}

	async findByPropertyId(propertyId: string) {
		return this.db.tenant.findMany({
			where: {
				status: "ACTIVE",
				rentalContracts: {
					some: {
						status: "ACTIVE",
						room: {
							propertyId,
						},
					},
				},
			},
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						room: true,
						invoices: {
							include: { transactions: true },
							orderBy: { dueDate: "asc" },
							take: 12,
						},
					},
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { name: "asc" },
		});
	}

	async findAll() {
		return this.db.tenant.findMany({
			include: {
				rentalContracts: {
					where: { status: "ACTIVE" },
					include: {
						room: {
							include: {
								property: true,
							},
						},
						invoices: {
							include: { transactions: true },
							orderBy: { dueDate: "asc" },
							take: 12,
						},
					},
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { name: "asc" },
		});
	}

	async findById(id: string) {
		return this.db.tenant.findUnique({
			where: { id },
			include: {
				rentalContracts: {
					include: {
						room: {
							include: {
								property: true,
							},
						},
						invoices: {
							orderBy: { dueDate: "desc" },
						},
					},
					orderBy: { createdAt: "desc" },
				},
			},
		});
	}

	async findByNIK(nik: string) {
		return this.db.tenant.findUnique({
			where: { NIK: nik },
		});
	}

	async createTenantWithContract(params: CreateTenantContractParams) {
		return this.db.$transaction(
			async (tx) => {
				// 1. Check or create/update tenant
				let tenant = await tx.tenant.findUnique({
					where: { NIK: params.tenantPayload.nik },
				});

				const payload = {
					name: params.tenantPayload.name,
					phoneNumber: params.tenantPayload.phone,
					whatsappNumber:
						params.tenantPayload.whatsappNumber || params.tenantPayload.phone,
					email: params.tenantPayload.email || null,
					birthDate: params.tenantPayload.birthDate ?? null,
					occupation: params.tenantPayload.occupation ?? null,
					institution: params.tenantPayload.institution ?? null,
					originAddress: params.tenantPayload.originAddress ?? null,
					emergencyName: params.tenantPayload.emergencyName ?? null,
					emergencyRelation: params.tenantPayload.emergencyRelation ?? null,
					emergencyPhone: params.tenantPayload.emergencyPhone ?? null,
					vehicle: params.tenantPayload.vehicle ?? null,
					deposit: Number(params.tenantPayload.deposit ?? 0),
					notes: params.tenantPayload.notes ?? null,
					ktpUrl: params.tenantPayload.ktpUrl ?? null,
					status: "ACTIVE" as const,
				};

				if (tenant) {
					tenant = await tx.tenant.update({
						where: { id: tenant.id },
						data: payload,
					});
				} else {
					tenant = await tx.tenant.create({
						data: {
							...payload,
							NIK: params.tenantPayload.nik,
						},
					});
				}

				// 2. Set room status to OCCUPIED
				const room = await tx.room.update({
					where: { id: params.contractPayload.roomId },
					data: { status: "OCCUPIED" },
					include: { property: true },
				});

				// Pastikan tidak ada kontrak aktif lama yang menggantung pada kamar ini
				await tx.rentalContract.updateMany({
					where: {
						roomId: params.contractPayload.roomId,
						status: "ACTIVE",
					},
					data: { status: "TERMINATED" },
				});

				// 3. Create active rental contract
				const contract = await tx.rentalContract.create({
					data: {
						roomId: params.contractPayload.roomId,
						tenantId: tenant.id,
						billingCycle: params.contractPayload.billingCycle,
						startDate: params.contractPayload.startDate,
						endDate: params.contractPayload.endDate,
						dueDateDay: params.contractPayload.dueDateDay,
						status: "ACTIVE",
					},
					include: {
						room: true,
					},
				});

				// 4. Batch create invoices
				let createdInvoices: { id: string }[] = [];
				if (params.invoices.length > 0) {
					await tx.invoice.createMany({
						data: params.invoices.map((inv) => ({
							...inv,
							contractId: contract.id,
						})),
					});
					createdInvoices = await tx.invoice.findMany({
						where: { contractId: contract.id },
						select: { id: true },
						orderBy: { createdAt: "asc" },
					});
				}

				// 5. Batch create distributed monthly cashflow transactions
				if (params.transactions.length > 0) {
					let fallbackUserId: string | null = null;
					const needsFallback = params.transactions.some((t) => !t.createdBy);
					if (needsFallback) {
						const admin = await tx.user.findFirst({
							select: { id: true },
						});
						fallbackUserId = admin?.id || "";
					}

					const primaryInvoiceId = createdInvoices[0]?.id || null;

					await tx.transaction.createMany({
						data: params.transactions.map((t) => ({
							propertyId: room.propertyId,
							createdBy: t.createdBy || fallbackUserId || "",
							invoiceId: primaryInvoiceId,
							type: t.type,
							category: t.category,
							classification: t.classification,
							paymentMethod: t.paymentMethod,
							amount: t.amount,
							description: t.description,
							transactionDate: t.transactionDate,
						})),
					});
				}

				return {
					tenant,
					contract,
					room,
				};
			},
			{
				timeout: 30000,
				maxWait: 10000,
			},
		);
	}

	async updateTenantWithContract(
		tenantId: string,
		data: {
			name: string;
			nik: string;
			phone: string;
			whatsappNumber?: string | null;
			email?: string | null;
			birthDate?: Date | null;
			occupation?: string | null;
			institution?: string | null;
			originAddress?: string | null;
			emergencyName?: string | null;
			emergencyRelation?: string | null;
			emergencyPhone?: string | null;
			vehicle?: string | null;
			deposit?: number | null;
			notes?: string | null;
			ktpUrl?: string | null;
			roomId?: string;
			billingCycle?: BillingCycle;
			startDate?: Date;
			dueDateDay?: number;
			roomChangeMode?: "CORRECTION" | "TRANSFER" | null;
			updatePendingInvoiceAmount?: boolean;
			createDifferenceInvoice?: boolean;
			newRentAmount?: number;
			contractUpdateScope?: "ALL_HISTORY" | "CURRENT_ONLY" | null;
		},
	) {
		return this.db.$transaction(
			async (tx) => {
				// 1. Check duplicate NIK with other tenants
				if (data.nik) {
					const existingWithNik = await tx.tenant.findFirst({
						where: {
							NIK: data.nik,
							id: { not: tenantId },
						},
						select: { name: true },
					});
					if (existingWithNik) {
						throw new Error(
							`NIK ${data.nik} sudah digunakan oleh penghuni lain (${existingWithNik.name}).`,
						);
					}
				}

				// Ambil data profil penghuni sebelum diupdate untuk mengecek perubahan nama
				const existingTenant = await tx.tenant.findUnique({
					where: { id: tenantId },
					select: { name: true },
				});

				// 2. Update Tenant profile
				const updatedTenant = await tx.tenant.update({
					where: { id: tenantId },
					data: {
						name: data.name,
						NIK: data.nik,
						phoneNumber: data.phone,
						whatsappNumber: data.whatsappNumber || data.phone,
						email: data.email || null,
						birthDate: data.birthDate ?? null,
						occupation: data.occupation ?? null,
						institution: data.institution ?? null,
						originAddress: data.originAddress ?? null,
						emergencyName: data.emergencyName ?? null,
						emergencyRelation: data.emergencyRelation ?? null,
						emergencyPhone: data.emergencyPhone ?? null,
						vehicle: data.vehicle ?? null,
						deposit: data.deposit !== undefined ? data.deposit : undefined,
						notes: data.notes ?? null,
						...(data.ktpUrl !== undefined && { ktpUrl: data.ktpUrl }),
					},
				});

				// Jika nama tenant berubah, sinkronkan nama pada riwayat transaksi kas sewa
				if (
					existingTenant &&
					data.name &&
					existingTenant.name.trim() !== data.name.trim()
				) {
					const oldName = existingTenant.name.trim();
					const newName = data.name.trim();

					// 1. Cari invoice milik tenant ini dan update transaksi yang tertaut
					const tenantInvoices = await tx.invoice.findMany({
						where: { contract: { tenantId } },
						select: { id: true },
					});
					const invoiceIds = tenantInvoices.map((inv) => inv.id);

					if (invoiceIds.length > 0) {
						const linkedTxs = await tx.transaction.findMany({
							where: { invoiceId: { in: invoiceIds } },
						});
						for (const trans of linkedTxs) {
							if (trans.description) {
								const updatedDesc = updateDescriptionTenantName(
									trans.description,
									oldName,
									newName,
								);
								if (updatedDesc !== trans.description) {
									await tx.transaction.update({
										where: { id: trans.id },
										data: { description: updatedDesc },
									});
								}
							}
						}
					}

					// 2. Cari transaksi sewa yang mungkin belum berelasi ke invoiceId tapi memuat nama lama
					const unlinkedTxs = await tx.transaction.findMany({
						where: {
							type: "INCOME",
							category: "RENT",
							description: {
								contains: oldName,
								mode: "insensitive",
							},
						},
					});
					for (const trans of unlinkedTxs) {
						if (trans.description) {
							const updatedDesc = updateDescriptionTenantName(
								trans.description,
								oldName,
								newName,
							);
							if (updatedDesc !== trans.description) {
								await tx.transaction.update({
									where: { id: trans.id },
									data: { description: updatedDesc },
								});
							}
						}
					}
				}

				// 3. Find active rental contract
				const activeContract = await tx.rentalContract.findFirst({
					where: {
						tenantId,
						status: "ACTIVE",
					},
					include: {
						room: true,
						tenant: true,
					},
				});

				if (activeContract) {
					if (data.contractUpdateScope === "ALL_HISTORY") {
						const allContracts = await tx.rentalContract.findMany({
							where: { tenantId },
							include: {
								invoices: {
									include: { transactions: true },
								},
								room: true,
							},
							orderBy: { startDate: "asc" },
						});

						const firstContract = allContracts[0];
						const effectiveStartDate =
							data.startDate || firstContract?.startDate || activeContract.startDate || new Date();
						const effectiveRoomId =
							data.roomId || activeContract.roomId || firstContract?.roomId;
						const effectiveRoom = effectiveRoomId
							? await tx.room.findUnique({ where: { id: effectiveRoomId } })
							: activeContract.room;

						if (!effectiveRoom) {
							throw new Error("Kamar untuk kontrak tidak ditemukan.");
						}

						const hadPaidInvoice = allContracts.some((c) =>
							c.invoices.some(
								(inv) =>
									inv.status === "PAID" ||
									(inv.transactions && inv.transactions.length > 0),
							),
						);

						const effectiveBillingCycle =
							data.billingCycle ||
							activeContract.billingCycle ||
							firstContract?.billingCycle ||
							"MONTHLY";

						let cycleMonths = 1;
						if (effectiveBillingCycle === "QUARTERLY") cycleMonths = 3;
						else if (effectiveBillingCycle === "SEMI_ANNUAL") cycleMonths = 6;
						else if (effectiveBillingCycle === "ANNUALLY") cycleMonths = 12;

						const effectivePrice =
							data.newRentAmount && data.newRentAmount > 0
								? data.newRentAmount
								: Number(effectiveRoom.price) * cycleMonths;

						const effectiveEndDate = new Date(
							effectiveStartDate.getFullYear(),
							effectiveStartDate.getMonth() + cycleMonths,
							effectiveStartDate.getDate(),
						);

						const allInvoiceIds = allContracts.flatMap((c) =>
							c.invoices.map((i) => i.id),
						);
						if (allInvoiceIds.length > 0) {
							await tx.transaction.deleteMany({
								where: { invoiceId: { in: allInvoiceIds } },
							});
							await tx.invoice.deleteMany({
								where: { id: { in: allInvoiceIds } },
							});
						}

						await tx.transaction.deleteMany({
							where: {
								propertyId: effectiveRoom.propertyId,
								type: "INCOME",
								category: "RENT",
								description: {
									contains: updatedTenant.name,
									mode: "insensitive",
								},
							},
						});

						await tx.rentalContract.deleteMany({
							where: { tenantId },
						});

						if (activeContract.roomId && activeContract.roomId !== effectiveRoom.id) {
							await tx.room.update({
								where: { id: activeContract.roomId },
								data: { status: "VACANT" },
							});
						}
						await tx.room.update({
							where: { id: effectiveRoom.id },
							data: { status: "OCCUPIED" },
						});

						const newContract = await tx.rentalContract.create({
							data: {
								roomId: effectiveRoom.id,
								tenantId,
								billingCycle: effectiveBillingCycle,
								startDate: effectiveStartDate,
								endDate: effectiveEndDate,
								dueDateDay: effectiveStartDate.getDate() || 10,
								status: "ACTIVE",
							},
						});

						const pMonth = effectiveStartDate.getMonth() + 1;
						const pYear = effectiveStartDate.getFullYear();
						const invNum = `INV-${pYear}${pMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}-1`;

						const newInvoice = await tx.invoice.create({
							data: {
								contractId: newContract.id,
								invoiceNumber: invNum,
								periodMonth: pMonth,
								periodYear: pYear,
								amount: effectivePrice,
								dueDate: effectiveStartDate,
								paidAt: hadPaidInvoice ? effectiveStartDate : null,
								status: hadPaidInvoice ? "PAID" : "PENDING",
							},
						});

						if (hadPaidInvoice) {
							const adminUser = await tx.user.findFirst({ select: { id: true } });
							const desc = `Pembayaran Sewa Kamar ${effectiveRoom.roomNumber} - ${updatedTenant.name}`;
							await tx.transaction.create({
								data: {
									propertyId: effectiveRoom.propertyId,
									createdBy: adminUser?.id || "system",
									invoiceId: newInvoice.id,
									type: "INCOME",
									category: "RENT",
									classification: "OPERATIONAL",
									paymentMethod: "TRANSFER",
									amount: effectivePrice,
									description: desc,
									transactionDate: effectiveStartDate,
								},
							});
						}

						return updatedTenant;
					}

					const isRoomChanged = Boolean(
						data.roomId && data.roomId !== activeContract.roomId,
					);
					let targetRoom: any = null;

					if (isRoomChanged && data.roomId) {
						// 3a. Verify target room exists & is not occupied by another tenant
						targetRoom = await tx.room.findUnique({
							where: { id: data.roomId },
						});
						if (!targetRoom) {
							throw new Error("Kamar tujuan tidak ditemukan.");
						}
						if (
							targetRoom.status === "OCCUPIED" &&
							targetRoom.id !== activeContract.roomId
						) {
							throw new Error(
								`Kamar ${targetRoom.roomNumber} sudah ditempati oleh penghuni lain.`,
							);
						}

						// 3b. Free previous room
						await tx.room.update({
							where: { id: activeContract.roomId },
							data: { status: "VACANT" },
						});

						// 3c. Occupy new room
						await tx.room.update({
							where: { id: data.roomId },
							data: { status: "OCCUPIED" },
						});

						// 3d. Update or recreate contract depending on roomChangeMode
						if (data.roomChangeMode === "TRANSFER") {
							// Mode Pindah Kamar Resmi: akhiri kontrak lama, buat kontrak baru
							const now = new Date();
							const currentMonth = now.getMonth() + 1;
							const currentYear = now.getFullYear();

							await tx.rentalContract.update({
								where: { id: activeContract.id },
								data: {
									status: "TERMINATED",
									endDate: now,
								},
							});

							const newContract = await tx.rentalContract.create({
								data: {
									roomId: data.roomId,
									tenantId,
									billingCycle:
										data.billingCycle || activeContract.billingCycle,
									startDate: data.startDate || now,
									dueDateDay: data.dueDateDay ?? activeContract.dueDateDay,
									status: "ACTIVE",
								},
							});

							// Jika ada tagihan PENDING pada kontrak lama, alihkan ke kontrak baru dengan nominal baru
							const effectivePrice =
								data.newRentAmount && data.newRentAmount > 0
									? data.newRentAmount
									: Number(targetRoom.price);

							await tx.invoice.updateMany({
								where: {
									contractId: activeContract.id,
									status: "PENDING",
								},
								data: {
									contractId: newContract.id,
									...(effectivePrice > 0 && { amount: effectivePrice }),
								},
							});

							// Periksa apakah invoice bulan berjalan pada kontrak lama sudah berstatus PAID
							const currentPaidInvoice = await tx.invoice.findFirst({
								where: {
									contractId: activeContract.id,
									periodMonth: currentMonth,
									periodYear: currentYear,
									status: "PAID",
								},
								include: { transactions: true },
							});

							if (currentPaidInvoice) {
								// Alihkan invoice bulan berjalan ke kontrak baru agar riwayat pembayarannya tercatat pada kamar baru
								await tx.invoice.update({
									where: { id: currentPaidInvoice.id },
									data: { contractId: newContract.id },
								});

								// Sinkronkan kamar dan properti pada transaksi terkait
								if (
									currentPaidInvoice.transactions &&
									currentPaidInvoice.transactions.length > 0
								) {
									for (const trans of currentPaidInvoice.transactions) {
										const updatedDesc = updateDescriptionRoom(
											trans.description,
											activeContract.room.roomNumber,
											targetRoom.roomNumber,
										);
										await tx.transaction.update({
											where: { id: trans.id },
											data: {
												propertyId: targetRoom.propertyId,
												...(updatedDesc !== trans.description && {
													description: updatedDesc,
												}),
											},
										});
									}
								}
							}

							// Hitung selisih harga sewa (Harga Kamar Baru - Harga Kamar Lama)
							const oldPrice = Number(activeContract.room.price);
							const newPrice = effectivePrice;
							const priceDiff = newPrice - oldPrice;

							// Jika harga naik dan flag createDifferenceInvoice !== false, terbitkan invoice selisih bulan ini
							if (priceDiff > 0 && data.createDifferenceInvoice !== false) {
								const invNumber = `INV-DIFF-${currentYear}${currentMonth.toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

								await tx.invoice.create({
									data: {
										contractId: newContract.id,
										invoiceNumber: invNumber,
										periodMonth: currentMonth,
										periodYear: currentYear,
										amount: priceDiff,
										dueDate: now,
										status: "PENDING",
									},
								});
							}
						} else {
							// Mode Koreksi Data (Default): perbarui kamar pada kontrak berjalan
							await tx.rentalContract.update({
								where: { id: activeContract.id },
								data: {
									roomId: data.roomId,
									...(data.billingCycle && {
										billingCycle: data.billingCycle,
									}),
									...(data.startDate && { startDate: data.startDate }),
									...(data.dueDateDay && { dueDateDay: data.dueDateDay }),
								},
							});
						}
					} else if (data.billingCycle || data.startDate || data.dueDateDay) {
						let newEndDate = activeContract.endDate;
						if (data.billingCycle) {
							let cycleMonths = 1;
							if (data.billingCycle === "QUARTERLY") cycleMonths = 3;
							else if (data.billingCycle === "SEMI_ANNUAL") cycleMonths = 6;
							else if (data.billingCycle === "ANNUALLY") cycleMonths = 12;

							const baseStart = data.startDate || activeContract.startDate;
							newEndDate = new Date(
								baseStart.getFullYear(),
								baseStart.getMonth() + cycleMonths,
								baseStart.getDate(),
							);
						}

						await tx.rentalContract.update({
							where: { id: activeContract.id },
							data: {
								...(data.billingCycle && {
									billingCycle: data.billingCycle,
									endDate: newEndDate,
								}),
								...(data.startDate && { startDate: data.startDate }),
								...(data.dueDateDay && { dueDateDay: data.dueDateDay }),
							},
						});
					}

					// Sesuaikan tagihan & catatan kas masuk jika bukan TRANSFER dan updatePendingInvoiceAmount !== false
					if (
						data.roomChangeMode !== "TRANSFER" &&
						data.updatePendingInvoiceAmount !== false
					) {
						const effectiveRentAmount =
							data.newRentAmount && data.newRentAmount > 0
								? data.newRentAmount
								: isRoomChanged && targetRoom
									? Number(targetRoom.price)
									: undefined;

						if (effectiveRentAmount && effectiveRentAmount > 0) {
							const targetRoomNumber = targetRoom
								? targetRoom.roomNumber
								: activeContract.room.roomNumber;
							const oldRoomNumber = activeContract.room.roomNumber;
							const targetPropertyId = targetRoom
								? targetRoom.propertyId
								: activeContract.room.propertyId;

							// 1. Selalu perbarui SELURUH tagihan PENDING pada kontrak aktif ke tarif baru
							await tx.invoice.updateMany({
								where: {
									contractId: activeContract.id,
									status: "PENDING",
								},
								data: {
									amount: effectiveRentAmount,
								},
							});

							// 2. Cari invoice periode berjalan atau invoice terbaru kontrak aktif
							const now = new Date();
							const currentMonth = now.getMonth() + 1;
							const currentYear = now.getFullYear();

							let currentInvoice = await tx.invoice.findFirst({
								where: {
									contractId: activeContract.id,
									periodMonth: currentMonth,
									periodYear: currentYear,
								},
								include: { transactions: true },
								orderBy: { createdAt: "desc" },
							});

							// Fallback: Jika tidak cocok bulan/tahun (misal data lampau / seed), ambil invoice terbaru
							if (!currentInvoice) {
								currentInvoice = await tx.invoice.findFirst({
									where: { contractId: activeContract.id },
									include: { transactions: true },
									orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
								});
							}

							if (currentInvoice) {
								if (currentInvoice.status !== "PAID") {
									// Update nominal invoice jika belum lunas
									await tx.invoice.update({
										where: { id: currentInvoice.id },
										data: { amount: effectiveRentAmount },
									});
								} else if (isRoomChanged) {
									// Jika sudah lunas dan hanya kamar yang berubah, perbarui deskripsi kamar tanpa mengubah nominal kas
									if (
										currentInvoice.transactions &&
										currentInvoice.transactions.length > 0
									) {
										for (const trans of currentInvoice.transactions) {
											const updatedDesc = updateDescriptionRoom(
												trans.description,
												oldRoomNumber,
												targetRoomNumber,
											);
											if (
												updatedDesc !== trans.description ||
												targetPropertyId !== trans.propertyId
											) {
												await tx.transaction.update({
													where: { id: trans.id },
													data: {
														propertyId: targetPropertyId,
														...(updatedDesc !== trans.description && {
															description: updatedDesc,
														}),
													},
												});
											}
										}
									}
								}
							}
						}
					}
				}

				return updatedTenant;
			},
			{
				timeout: 30000,
				maxWait: 10000,
			},
		);
	}

	async deleteTenant(id: string) {
		return this.db.$transaction(
			async (tx) => {
				// Find active contracts
				const activeContracts = await tx.rentalContract.findMany({
					where: {
						tenantId: id,
						status: "ACTIVE",
					},
				});

				// Release all rooms
				for (const contract of activeContracts) {
					await tx.room.update({
						where: { id: contract.roomId },
						data: { status: "VACANT" },
					});

					// Pastikan seluruh kontrak aktif pada kamar ini benar-benar TERMINATED agar kamar kembali kosong
					await tx.rentalContract.updateMany({
						where: {
							roomId: contract.roomId,
							status: "ACTIVE",
						},
						data: { status: "TERMINATED" },
					});
				}

				// Mark tenant as INACTIVE
				return tx.tenant.update({
					where: { id },
					data: { status: "INACTIVE" },
				});
			},
			{
				timeout: 30000,
				maxWait: 10000,
			},
		);
	}
}

export const tenantRepository = new TenantRepository();
