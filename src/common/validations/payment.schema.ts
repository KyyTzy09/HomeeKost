import { z } from "zod";

export const PAYMENT_STATUS = {
	PAID: "PAID",
	PENDING: "PENDING",
	OVERDUE: "OVERDUE",
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;

export const paymentSchema = z
	.object({
		tenantName: z
			.string()
			.min(1, "Nama penghuni wajib diisi")
			.min(2, "Nama penghuni minimal 2 karakter"),
		roomNumber: z.string().min(1, "Nomor kamar wajib diisi"),
		period: z
			.string()
			.min(1, "Periode wajib diisi")
			.regex(
				/^[A-Za-z]+ \d{4}$/,
				"Format periode: Nama Bulan Tahun (contoh: Agustus 2026)",
			),
		dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
		amount: z
			.number({ message: "Nominal harus berupa angka" })
			.min(1, "Nominal minimal Rp 1")
			.max(100_000_000, "Nominal terlalu besar"),
		status: z.enum(["PAID", "PENDING", "OVERDUE"], {
			message: "Status wajib dipilih",
		}),
		paidAt: z.string().nullable().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.status === "PAID" && !data.paidAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Tanggal bayar wajib diisi jika status Sudah Bayar",
				path: ["paidAt"],
			});
		}
	});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

// ─── Display Helpers ────────────────────────────────────────────────────────
export const STATUS_LABEL: Record<PaymentStatus, string> = {
	PAID: "Sudah bayar",
	PENDING: "Jatuh tempo",
	OVERDUE: "Terlambat",
};

export const STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
	PAID: "badge green",
	PENDING: "badge amber",
	OVERDUE: "badge red",
};

export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
	}).format(amount);
}
