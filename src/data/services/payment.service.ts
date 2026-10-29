import type {
	PaginatedPayments,
	PaymentFilterParams,
	PaymentItem,
	PaymentStats,
	PaymentStatus,
	SessionUser,
} from "../../common/types/index.ts";
import type {
	ConfirmPaymentInput,
	CreateManualInvoiceInput,
	GenerateMonthlyInvoicesInput,
} from "../../common/validations/index.ts";
import type {
	PaymentMethod,
} from "../../generated/prisma/client.js";
import { formatDate, formatRentalPeriod } from "../../lib/date-utils.ts";
import {
	calculateInstallmentSummary,
	evaluateRentalPaymentStatus,
	getEndOfMonthString,
} from "../../lib/payment-utils.ts";
import { getWhatsAppDirectUrl } from "../../lib/phone-sanitizer.ts";
import { whatsappTemplates } from "../../lib/whatsapp-templates.ts";
import {
	type InvoiceRepository,
	invoiceRepository,
} from "../repositories/invoice.repository.ts";
import { type FonnteService, fonnteService } from "./fonnte.service.ts";

export class PaymentService {
	constructor(
		private readonly invoiceRepo: InvoiceRepository = invoiceRepository,
		private readonly fonnte: FonnteService = fonnteService,
	) {}

	/**
	 * Dapatkan daftar tagihan pembayaran dengan filtering, sorting, dan kalkulasi H-3/H-0/Overdue
	 */
	async getPayments(
		params: PaymentFilterParams,
		user?: SessionUser,
	): Promise<PaginatedPayments> {
		const userPropertyId = user?.assignedPropertyId;
		let propertyIds: string[] | undefined;

		if (params.propertyId) {
			if (
				user?.role?.name === "ADMIN" &&
				userPropertyId &&
				userPropertyId !== params.propertyId
			) {
				throw new Error("Akses cabang kos tidak diizinkan.");
			}
			propertyIds = [params.propertyId];
		} else if (user?.role?.name === "ADMIN" && userPropertyId) {
			propertyIds = [userPropertyId];
		}

		const page = params.page || 1;
		const limit = params.limit || 10;
		const skip = (page - 1) * limit;

		const statusFilter =
			params.status && params.status !== "ALL" ? params.status : undefined;

		const [rawInvoices, totalCount] = await Promise.all([
			this.invoiceRepo.findMany({
				propertyIds,
				statusFilter,
				month: params.month,
				year: params.year,
				search: params.search,
				sortBy: params.sortBy,
				sortOrder: params.sortOrder,
				skip,
				take: limit,
			}),
			this.invoiceRepo.count({
				propertyIds,
				statusFilter,
				month: params.month,
				year: params.year,
				search: params.search,
			}),
		]);

		const now = new Date();
		now.setHours(0, 0, 0, 0);

		const appUrl = process.env.APP_URL || "http://localhost:3000";

		const data: PaymentItem[] = rawInvoices.map((inv) => {
			const dueDate = new Date(inv.dueDate);
			const dueTime = new Date(dueDate);
			dueTime.setHours(0, 0, 0, 0);

			const diffTime = dueTime.getTime() - now.getTime();
			const dueDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			const periodMonth = inv.periodMonth || dueDate.getMonth() + 1;
			const periodYear = inv.periodYear || dueDate.getFullYear();

			const period = formatRentalPeriod({
				periodMonth,
				periodYear,
				startDate: inv.contract.startDate,
				endDate: inv.contract.endDate,
				billingCycle: inv.contract.billingCycle,
				dueDate: inv.dueDate,
			});

			const installmentSummary = calculateInstallmentSummary(
				Number(inv.amount),
				inv.transactions,
			);
			const { paidAmount, remainingAmount, isPartial, installmentCount } =
				installmentSummary;

			const evaluated = evaluateRentalPaymentStatus({
				totalAmount: Number(inv.amount),
				paidAmount,
				dueDate,
				databaseStatus: inv.status,
			});

			const isPaid = evaluated.isSettled;

			let status: PaymentStatus = inv.status as PaymentStatus;
			if (evaluated.isSettled) {
				status = "PAID";
			} else if (evaluated.isInstallment) {
				status = "PARTIAL";
			} else if (evaluated.statusKey === "OVERDUE") {
				status = "OVERDUE";
			} else {
				status = "PENDING";
			}

			let dueStatusBadge: PaymentItem["dueStatusBadge"] = {
				text: formatDate(dueDate),
				variant: "gray",
			};

			if (evaluated.isSettled) {
				dueStatusBadge = { text: "Lunas", variant: "green" };
			} else if (evaluated.isInstallment) {
				dueStatusBadge = {
					text: `Cicilan (${installmentCount}x)`,
					variant: evaluated.badgeVariant,
				};
			} else if (dueDaysRemaining < 0) {
				const daysLate = Math.abs(dueDaysRemaining);
				dueStatusBadge = {
					text: `Terlambat ${daysLate} hari`,
					variant: "red",
				};
			} else if (dueDaysRemaining === 0) {
				dueStatusBadge = { text: "Hari ini (H-0)", variant: "amber" };
			} else if (dueDaysRemaining <= 3) {
				dueStatusBadge = {
					text: `H-${dueDaysRemaining} (${dueDaysRemaining} hari lagi)`,
					variant: "amber",
				};
			}

			const tenantName = inv.contract.tenant.name;
			const tenantPhone =
				inv.contract.tenant.whatsappNumber ||
				inv.contract.tenant.phoneNumber ||
				"";
			const propertyName = inv.contract.room.property.name;
			const roomNumber = inv.contract.room.roomNumber;
			const amount = Number(inv.amount);
			const documentUrl =
				inv.pdfUrl || `${appUrl}/api/invoices/${inv.id}/document`;

			let message = "";
			if (isPaid) {
				const isPaidOnTime = inv.paidAt
					? new Date(inv.paidAt).getTime() <= dueDate.getTime()
					: true;

				message = whatsappTemplates.paymentReceipt({
					tenantName,
					propertyName,
					roomNumber,
					invoiceNumber: inv.invoiceNumber,
					period,
					paidDate: inv.paidAt ? formatDate(inv.paidAt) : formatDate(now),
					amount,
					paymentMethod: "Transfer Bank",
					documentUrl,
					isOnTime: isPaidOnTime,
				});
			} else if (isPartial) {
				const endOfMonth = getEndOfMonthString(periodYear, periodMonth);
				message = whatsappTemplates.installmentReminder({
					tenantName,
					propertyName,
					roomNumber,
					invoiceNumber: inv.invoiceNumber,
					period,
					totalAmount: amount,
					totalPaid: paidAmount,
					remainingAmount,
					endOfMonthDate: endOfMonth,
					bankAccountInfo: inv.contract.room.property.bankAccountInfo,
					documentUrl,
				});
			} else {
				message = whatsappTemplates.dueReminder({
					tenantName,
					propertyName,
					roomNumber,
					invoiceNumber: inv.invoiceNumber,
					period,
					dueDate: formatDate(dueDate),
					daysRemaining: dueDaysRemaining,
					amount,
					bankAccountInfo: inv.contract.room.property.bankAccountInfo,
					documentUrl,
				});
			}

			const directWhatsAppUrl = tenantPhone
				? getWhatsAppDirectUrl(tenantPhone, message)
				: "";

			return {
				id: inv.id,
				invoiceNumber: inv.invoiceNumber,
				contractId: inv.contractId,
				tenantId: inv.contract.tenant.id,
				tenantName,
				tenantPhone,
				roomId: inv.contract.room.id,
				roomNumber,
				propertyId: inv.contract.room.property.id,
				propertyName,
				period,
				periodMonth,
				periodYear,
				amount,
				status,
				dueDate: formatDate(dueDate),
				rawDueDate: inv.dueDate.toISOString().slice(0, 10),
				paidAt: inv.paidAt ? formatDate(inv.paidAt) : null,
				dueDaysRemaining,
				dueStatusBadge,
				directWhatsAppUrl,
				paidAmount,
				remainingAmount,
				isPartial,
				installmentCount,
				transactions: (inv.transactions || []).map((t) => ({
					id: t.id,
					amount: Number(t.amount),
					paymentMethod: t.paymentMethod,
					transactionDate: t.transactionDate.toISOString().slice(0, 10),
					description: t.description,
				})),
			};
		});

		const totalPages = Math.ceil(totalCount / limit);

		return {
			data,
			totalCount,
			totalPages,
			currentPage: page,
			pageSize: limit,
		};
	}

	/**
	 * Dapatkan ringkasan statistik keuangan tagihan pembayaran (Metrics Cards)
	 */
	async getPaymentStats(
		params?: { propertyId?: string; month?: number; year?: number },
		user?: SessionUser,
	): Promise<PaymentStats> {
		const userPropertyId = user?.assignedPropertyId;
		let propertyIds: string[] | undefined;

		if (params?.propertyId) {
			propertyIds = [params.propertyId];
		} else if (user?.role?.name === "ADMIN" && userPropertyId) {
			propertyIds = [userPropertyId];
		}

		return this.invoiceRepo.getStats(propertyIds, params?.month, params?.year);
	}

	/**
	 * Verifikasi & Konfirmasi Pembayaran Tagihan (Mark as Paid)
	 */
	async confirmPayment(input: ConfirmPaymentInput, user?: SessionUser) {
		const invoice = await this.invoiceRepo.findById(input.invoiceId);
		if (!invoice) {
			throw new Error("Invoice tidak ditemukan.");
		}

		if (invoice.status === "PAID") {
			throw new Error("Invoice ini sudah lunas sebelumnya.");
		}

		const paidDate = new Date(input.paidDate);
		const recordedById = user?.id || "system";

		const result = await this.invoiceRepo.recordPayment(
			input.invoiceId,
			input.paymentMethod as PaymentMethod,
			paidDate,
			recordedById,
			input.isPartial ? input.amount : undefined,
			input.notes,
		);

		let whatsappSent = false;
		let directWhatsAppUrl = "";

		const tenantPhone =
			result.invoice.contract.tenant.whatsappNumber ||
			result.invoice.contract.tenant.phoneNumber;
		const tenantName = result.invoice.contract.tenant.name;
		const propertyName = result.invoice.contract.room.property.name;
		const roomNumber = result.invoice.contract.room.roomNumber;
		const period = formatRentalPeriod({
			periodMonth: result.invoice.periodMonth,
			periodYear: result.invoice.periodYear,
			startDate: result.invoice.contract.startDate,
			endDate: result.invoice.contract.endDate,
			billingCycle: result.invoice.contract.billingCycle,
			dueDate: result.invoice.dueDate,
		});

		const appUrl = process.env.APP_URL || "http://localhost:3000";
		const documentUrl =
			result.invoice.pdfUrl ||
			`${appUrl}/api/invoices/${result.invoice.id}/document`;

		if (tenantPhone) {
			if (!result.isSettled) {
				// Bukti Cicilan Bertahap
				if (input.sendReceiptWhatsApp) {
					const waRes = await this.fonnte.sendPartialPaymentReceipt(
						tenantPhone,
						{
							tenantName,
							propertyName,
							roomNumber,
							invoiceNumber: result.invoice.invoiceNumber,
							period,
							paidDate: formatDate(input.paidDate),
							paymentMethod: input.paymentMethod,
							paidThisTime: result.paidThisTime,
							totalAmount: Number(result.invoice.amount),
							totalPaid: result.totalPaid,
							remainingAmount: result.remainingAmount,
							documentUrl,
						},
					);
					whatsappSent = waRes.success;
					directWhatsAppUrl = waRes.directWhatsAppUrl;
				} else {
					const msg = whatsappTemplates.partialPaymentReceipt({
						tenantName,
						propertyName,
						roomNumber,
						invoiceNumber: result.invoice.invoiceNumber,
						period,
						paidDate: formatDate(input.paidDate),
						paymentMethod: input.paymentMethod,
						paidThisTime: result.paidThisTime,
						totalAmount: Number(result.invoice.amount),
						totalPaid: result.totalPaid,
						remainingAmount: result.remainingAmount,
						documentUrl,
					});
					directWhatsAppUrl = getWhatsAppDirectUrl(tenantPhone, msg);
				}
			} else {
				// Kwitansi Pelunasan Penuh
				const isPaidOnTime =
					new Date(input.paidDate).getTime() <=
					new Date(result.invoice.dueDate).getTime();

				if (input.sendReceiptWhatsApp) {
					const waRes = await this.fonnte.sendPaymentReceipt(tenantPhone, {
						tenantName,
						propertyName,
						roomNumber,
						invoiceNumber: result.invoice.invoiceNumber,
						period,
						paidDate: formatDate(input.paidDate),
						amount: Number(result.invoice.amount),
						paymentMethod: input.paymentMethod,
						documentUrl,
						isOnTime: isPaidOnTime,
					});
					whatsappSent = waRes.success;
					directWhatsAppUrl = waRes.directWhatsAppUrl;
				} else {
					const msg = whatsappTemplates.paymentReceipt({
						tenantName,
						propertyName,
						roomNumber,
						invoiceNumber: result.invoice.invoiceNumber,
						period,
						paidDate: formatDate(input.paidDate),
						amount: Number(result.invoice.amount),
						paymentMethod: input.paymentMethod,
						documentUrl,
						isOnTime: isPaidOnTime,
					});
					directWhatsAppUrl = getWhatsAppDirectUrl(tenantPhone, msg);
				}
			}
		}

		return {
			success: true,
			invoiceId: result.invoice.id,
			transactionId: result.transaction.id,
			whatsappSent,
			directWhatsAppUrl,
		};
	}

	/**
	 * Buat Tagihan Invoice Manual
	 */
	async createManualInvoice(
		input: CreateManualInvoiceInput,
		_user?: SessionUser,
	) {
		// 1. Resolve Contract ID (Mendukung contractId langsung atau fallback tenantId)
		let targetContractId = input.contractId;
		let contract = await this.invoiceRepo.findContractById(targetContractId);

		if (!contract) {
			const contractByTenant =
				await this.invoiceRepo.findActiveContractByTenantId(input.contractId);
			if (contractByTenant) {
				targetContractId = contractByTenant.id;
				contract = contractByTenant;
			} else {
				throw new Error(
					"Kontrak sewa untuk penghuni ini tidak ditemukan. Pastikan penghuni memiliki kamar aktif.",
				);
			}
		}

		// 2. Cek apakah tagihan untuk periode ini sudah pernah dibuat untuk penghuni ini (lintas seluruh kontrak)
		const existingInvoice = await this.invoiceRepo.findExistingInvoiceForTenant(
			contract.tenantId,
			input.periodMonth,
			input.periodYear,
		);
		if (existingInvoice) {
			const roomInfo = existingInvoice.contract?.room?.roomNumber
				? `Kamar ${existingInvoice.contract.room.roomNumber} - `
				: "";
			throw new Error(
				`Tagihan untuk periode ${input.periodMonth}/${input.periodYear} sudah pernah dibuat untuk penghuni ini (${roomInfo}${existingInvoice.invoiceNumber} - status: ${existingInvoice.status}).`,
			);
		}

		// 3. Generate Nomor Invoice Unik & Aman dari Collision
		const monthPadded = String(input.periodMonth).padStart(2, "0");
		let invoiceNumber = "";
		let attempts = 0;
		while (!invoiceNumber && attempts < 5) {
			attempts++;
			const uniqueCode = `${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
			const candidateNumber = `INV-${input.periodYear}${monthPadded}-${uniqueCode}`;
			const existing =
				await this.invoiceRepo.findByInvoiceNumber(candidateNumber);
			if (!existing) {
				invoiceNumber = candidateNumber;
			}
		}
		if (!invoiceNumber) {
			invoiceNumber = `INV-${input.periodYear}${monthPadded}-${Date.now()}`;
		}

		const dueDate = new Date(input.dueDate);

		const invoice = await this.invoiceRepo.createInvoice({
			contractId: targetContractId,
			invoiceNumber,
			periodMonth: input.periodMonth,
			periodYear: input.periodYear,
			amount: input.amount,
			dueDate,
			status: "PENDING",
		});

		let whatsappSent = false;
		let directWhatsAppUrl = "";

		const tenantPhone =
			invoice.contract.tenant.whatsappNumber ||
			invoice.contract.tenant.phoneNumber;

		if (tenantPhone) {
			const period = formatRentalPeriod({
				periodMonth: input.periodMonth,
				periodYear: input.periodYear,
				startDate: invoice.contract.startDate,
				endDate: invoice.contract.endDate,
				billingCycle: invoice.contract.billingCycle,
				dueDate: invoice.dueDate,
			});
			const appUrl = process.env.APP_URL || "http://localhost:3000";
			const documentUrl =
				invoice.pdfUrl || `${appUrl}/api/invoices/${invoice.id}/document`;

			if (input.sendWhatsApp) {
				const waRes = await this.fonnte.sendInvoiceNotification(tenantPhone, {
					tenantName: invoice.contract.tenant.name,
					propertyName: invoice.contract.room.property.name,
					roomNumber: invoice.contract.room.roomNumber,
					invoiceNumber: invoice.invoiceNumber,
					period,
					dueDate: formatDate(input.dueDate),
					amount: input.amount,
					bankAccountInfo: invoice.contract.room.property.bankAccountInfo,
					documentUrl,
				});
				whatsappSent = waRes.success;
				directWhatsAppUrl = waRes.directWhatsAppUrl;
			} else {
				const msg = whatsappTemplates.newInvoice({
					tenantName: invoice.contract.tenant.name,
					propertyName: invoice.contract.room.property.name,
					roomNumber: invoice.contract.room.roomNumber,
					invoiceNumber: invoice.invoiceNumber,
					period,
					dueDate: formatDate(input.dueDate),
					amount: input.amount,
					bankAccountInfo: invoice.contract.room.property.bankAccountInfo,
					documentUrl,
				});
				directWhatsAppUrl = getWhatsAppDirectUrl(tenantPhone, msg);
			}
		}

		return {
			success: true,
			invoiceId: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			whatsappSent,
			directWhatsAppUrl,
		};
	}

	/**
	 * Generate Tagihan Bulanan Massal untuk Semua Kamar Aktif
	 */
	async generateMonthlyInvoices(
		input: GenerateMonthlyInvoicesInput,
		_user?: SessionUser,
	) {
		const created = await this.invoiceRepo.generateMonthlyInvoicesForProperty(
			input.propertyId,
			input.periodMonth,
			input.periodYear,
			input.dueDateDay,
		);

		return {
			success: true,
			generatedCount: created.length,
			propertyId: input.propertyId,
			periodMonth: input.periodMonth,
			periodYear: input.periodYear,
		};
	}

	/**
	 * Kirim Ulang / Trigger Manual Notifikasi WhatsApp untuk Invoice Tertentu
	 */
	async sendWhatsAppMessage(
		invoiceId: string,
		type: "NEW_INVOICE" | "REMINDER" | "RECEIPT" = "NEW_INVOICE",
		_user?: SessionUser,
	) {
		const invoice = await this.invoiceRepo.findById(invoiceId);
		if (!invoice) {
			throw new Error("Invoice tidak ditemukan.");
		}

		const tenantPhone =
			invoice.contract.tenant.whatsappNumber ||
			invoice.contract.tenant.phoneNumber;

		if (!tenantPhone) {
			throw new Error("Nomor WhatsApp/telepon penyewa tidak tersedia.");
		}

		const dueDate = new Date(invoice.dueDate);
		const period = formatRentalPeriod({
			periodMonth: invoice.periodMonth,
			periodYear: invoice.periodYear,
			startDate: invoice.contract.startDate,
			endDate: invoice.contract.endDate,
			billingCycle: invoice.contract.billingCycle,
			dueDate: invoice.dueDate,
		});
		const tenantName = invoice.contract.tenant.name;
		const propertyName = invoice.contract.room.property.name;
		const roomNumber = invoice.contract.room.roomNumber;
		const amount = Number(invoice.amount);

		const appUrl = process.env.APP_URL || "http://localhost:3000";
		const documentUrl =
			invoice.pdfUrl || `${appUrl}/api/invoices/${invoice.id}/document`;

		const isPaid = type === "RECEIPT" || invoice.status === "PAID";

		if (isPaid) {
			const isPaidOnTime = invoice.paidAt
				? new Date(invoice.paidAt).getTime() <=
					new Date(invoice.dueDate).getTime()
				: true;

			return this.fonnte.sendPaymentReceipt(tenantPhone, {
				tenantName,
				propertyName,
				roomNumber,
				invoiceNumber: invoice.invoiceNumber,
				period,
				paidDate: invoice.paidAt
					? formatDate(invoice.paidAt)
					: formatDate(new Date()),
				amount,
				paymentMethod: "Transfer Bank",
				documentUrl,
				isOnTime: isPaidOnTime,
			});
		}

		if (type === "REMINDER") {
			const installmentSummary = calculateInstallmentSummary(
				amount,
				(invoice as any).transactions,
			);

			if (installmentSummary.isPartial) {
				const endOfMonth = getEndOfMonthString(
					invoice.periodYear ?? undefined,
					invoice.periodMonth ?? undefined,
				);
				return this.fonnte.sendInstallmentReminder(tenantPhone, {
					tenantName,
					propertyName,
					roomNumber,
					invoiceNumber: invoice.invoiceNumber,
					period,
					totalAmount: amount,
					totalPaid: installmentSummary.paidAmount,
					remainingAmount: installmentSummary.remainingAmount,
					endOfMonthDate: endOfMonth,
					bankAccountInfo: invoice.contract.room.property.bankAccountInfo,
					documentUrl,
				});
			}

			const now = new Date();
			now.setHours(0, 0, 0, 0);
			const dueTime = new Date(dueDate);
			dueTime.setHours(0, 0, 0, 0);
			const daysRemaining = Math.ceil(
				(dueTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			);

			return this.fonnte.sendDueReminder(tenantPhone, {
				tenantName,
				propertyName,
				roomNumber,
				invoiceNumber: invoice.invoiceNumber,
				period,
				dueDate: formatDate(dueDate),
				daysRemaining,
				amount,
				bankAccountInfo: invoice.contract.room.property.bankAccountInfo,
				documentUrl,
			});
		}

		// Default: New invoice notification
		return this.fonnte.sendInvoiceNotification(tenantPhone, {
			tenantName,
			propertyName,
			roomNumber,
			invoiceNumber: invoice.invoiceNumber,
			period,
			dueDate: formatDate(dueDate),
			amount,
			bankAccountInfo: invoice.contract.room.property.bankAccountInfo,
			documentUrl,
		});
	}

	async deleteInvoice(id: string, _user?: SessionUser) {
		await this.invoiceRepo.deleteInvoice(id);
		return { success: true, id };
	}
}

export const paymentService = new PaymentService();
