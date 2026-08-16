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
	InvoiceStatus,
	PaymentMethod,
} from "../../generated/prisma/client.js";
import { formatDate, formatRentalPeriod } from "../../lib/date-utils.ts";
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

		let statusEnum: InvoiceStatus | undefined;
		if (params.status && params.status !== "ALL") {
			statusEnum = params.status as InvoiceStatus;
		}

		const [rawInvoices, totalCount] = await Promise.all([
			this.invoiceRepo.findMany({
				propertyIds,
				status: statusEnum,
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
				status: statusEnum,
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
			});

			const isPaid = inv.status === "PAID";
			let dueStatusBadge: PaymentItem["dueStatusBadge"] = {
				text: formatDate(dueDate),
				variant: "gray",
			};

			if (isPaid) {
				dueStatusBadge = { text: "Lunas", variant: "green" };
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

			const message = isPaid
				? whatsappTemplates.paymentReceipt({
						tenantName,
						propertyName,
						roomNumber,
						invoiceNumber: inv.invoiceNumber,
						period,
						paidDate: inv.paidAt ? formatDate(inv.paidAt) : formatDate(now),
						amount,
						paymentMethod: "Transfer Bank",
						documentUrl,
					})
				: whatsappTemplates.dueReminder({
						tenantName,
						propertyName,
						roomNumber,
						invoiceNumber: inv.invoiceNumber,
						period,
						dueDate: formatDate(dueDate),
						daysRemaining: dueDaysRemaining,
						amount,
						documentUrl,
					});

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
				status: inv.status as PaymentStatus,
				dueDate: formatDate(dueDate),
				rawDueDate: inv.dueDate.toISOString().slice(0, 10),
				paidAt: inv.paidAt ? formatDate(inv.paidAt) : null,
				dueDaysRemaining,
				dueStatusBadge,
				directWhatsAppUrl,
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

		const result = await this.invoiceRepo.markAsPaid(
			input.invoiceId,
			input.paymentMethod as PaymentMethod,
			paidDate,
			recordedById,
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
		});

		const appUrl = process.env.APP_URL || "http://localhost:3000";
		const documentUrl =
			result.invoice.pdfUrl ||
			`${appUrl}/api/invoices/${result.invoice.id}/document`;

		if (tenantPhone) {
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
				});
				directWhatsAppUrl = getWhatsAppDirectUrl(tenantPhone, msg);
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
		const timestamp = Date.now().toString().slice(-4);
		const monthPadded = String(input.periodMonth).padStart(2, "0");
		const invoiceNumber = `INV-${input.periodYear}${monthPadded}-${timestamp}`;
		const dueDate = new Date(input.dueDate);

		const invoice = await this.invoiceRepo.createInvoice({
			contractId: input.contractId,
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
			});
		}

		if (type === "REMINDER") {
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
			documentUrl,
		});
	}

	async deleteInvoice(id: string, _user?: SessionUser) {
		await this.invoiceRepo.deleteInvoice(id);
		return { success: true, id };
	}
}

export const paymentService = new PaymentService();
