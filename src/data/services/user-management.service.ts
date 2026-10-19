import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type {
	AppUserRole,
	AuditLogItem,
	UserItem,
	UserProfileDetail,
} from "../../common/types/index.ts";
import type {
	ChangePasswordFormValues,
	ProfileUpdateFormValues,
	UserFormValues,
} from "../../common/validations/index.ts";
import { prisma } from "../../db.ts";
import type { PrismaClient, RoleName } from "../../generated/prisma/client.js";
import { formatRupiah } from "../../lib/currency.ts";
import { emailService } from "../../lib/email.service.ts";
import { propertyRepository } from "../repositories/property.repository.ts";
import { userRepository } from "../repositories/user.repository.ts";

export const ROLE_HIERARCHY: Record<AppUserRole, number> = {
	ADMIN: 1,
	SUPER_ADMIN: 2,
};

function formatRelativeLogTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	if (diffMinutes < 5) return "Baru saja";
	if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
	if (diffHours < 24 && date.getDate() === now.getDate()) {
		return `Hari ini ${hours}:${minutes}`;
	}
	if (
		diffDays === 1 ||
		(diffHours < 48 && date.getDate() === now.getDate() - 1)
	) {
		return `Kemarin ${hours}:${minutes}`;
	}
	return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} ${hours}:${minutes}`;
}

export class UserManagementService {
	constructor(
		private readonly userRepo = userRepository,
		private readonly propertyRepo = propertyRepository,
		private readonly db: PrismaClient = prisma,
	) {}

	private async getRequesterRole(
		requesterUserId?: string,
	): Promise<AppUserRole> {
		if (!requesterUserId) return "ADMIN";
		const user = await this.userRepo.findById(requesterUserId);
		return (user?.role?.name || "ADMIN") as AppUserRole;
	}

	async getUsers(): Promise<UserItem[]> {
		const rawUsers = await this.userRepo.findAll();

		return rawUsers.map((u) => {
			const roleName = (u.role?.name || "ADMIN") as AppUserRole;
			const propertyName = u.assignedProperty?.name || "Semua Kost";

			return {
				id: u.id,
				name: u.name,
				email: u.email,
				role: roleName,
				assignedProperty: propertyName,
				assignedPropertyId: u.assignedProperty?.id || null,
				status: "ACTIVE",
				createdAt: u.createdAt.toISOString().slice(0, 10),
			};
		});
	}

	async createUser(
		input: UserFormValues,
		requesterUserId?: string,
	): Promise<UserItem> {
		const requesterRole = await this.getRequesterRole(requesterUserId);
		const requesterLevel = ROLE_HIERARCHY[requesterRole] ?? 1;
		const targetLevel = ROLE_HIERARCHY[input.role as AppUserRole] ?? 1;

		// Role hierarchy guard: User cannot create account with same or higher role
		if (requesterRole !== "SUPER_ADMIN" && targetLevel >= requesterLevel) {
			throw new Error(
				"Anda tidak memiliki hak akses untuk membuat akun dengan role yang setara atau lebih tinggi dari Anda.",
			);
		}

		const existingUser = await this.userRepo.findByEmail(input.email);
		if (existingUser) {
			throw new Error(`Email ${input.email} sudah terdaftar di sistem.`);
		}

		// Resolve roleId
		const role = await this.userRepo.findRoleByName(
			input.role as unknown as RoleName,
		);
		if (!role) {
			throw new Error(`Role ${input.role} tidak ditemukan dalam database.`);
		}

		// Resolve assignedPropertyId
		let propertyId: string | null = null;
		if (input.assignedProperty && input.assignedProperty !== "Semua Kost") {
			const properties = await this.propertyRepo.findAll();
			const matched = properties.find(
				(p) =>
					p.name.toLowerCase() === input.assignedProperty.toLowerCase() ||
					p.id === input.assignedProperty,
			);
			if (matched) {
				propertyId = matched.id;
			}
		}

		if (!input.password || input.password.trim().length < 8) {
			throw new Error(
				"Password wajib diisi minimal 8 karakter untuk akun pengguna baru.",
			);
		}

		const passwordHash = await hashPassword(input.password.trim());

		const created = await this.userRepo.createUser({
			name: input.name,
			email: input.email,
			roleId: role.id,
			assignedPropertyId: propertyId,
			passwordHash,
		});

		return {
			id: created.id,
			name: created.name,
			email: created.email,
			role: (created.role?.name || "ADMIN") as AppUserRole,
			assignedProperty: created.assignedProperty?.name || "Semua Kost",
			assignedPropertyId: created.assignedProperty?.id || null,
			status: "ACTIVE",
			createdAt: created.createdAt.toISOString().slice(0, 10),
		};
	}

	async updateUser(
		id: string,
		input: UserFormValues,
		requesterUserId?: string,
	): Promise<UserItem> {
		// Self-modification guard: user cannot modify themselves from this management table
		if (requesterUserId && id === requesterUserId) {
			throw new Error(
				"Anda tidak dapat mengubah data akun Anda sendiri melalui tabel manajemen pengguna.",
			);
		}

		const existing = await this.userRepo.findById(id);
		if (!existing) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		const requesterRole = await this.getRequesterRole(requesterUserId);
		const requesterLevel = ROLE_HIERARCHY[requesterRole] ?? 1;
		const targetExistingRole = (existing.role?.name || "ADMIN") as AppUserRole;
		const targetExistingLevel = ROLE_HIERARCHY[targetExistingRole] ?? 1;
		const newRoleLevel = ROLE_HIERARCHY[input.role as AppUserRole] ?? 1;

		// Hierarchy guard: Cannot modify a user with equal or higher role
		if (
			requesterRole !== "SUPER_ADMIN" &&
			targetExistingLevel >= requesterLevel
		) {
			throw new Error(
				"Anda tidak memiliki wewenang untuk mengubah data pengguna dengan tingkat role yang sama atau lebih tinggi.",
			);
		}

		// Hierarchy guard: Cannot assign a role equal to or higher than requester's own role
		if (requesterRole !== "SUPER_ADMIN" && newRoleLevel >= requesterLevel) {
			throw new Error(
				"Anda tidak dapat menetapkan role yang sama atau lebih tinggi dari role Anda.",
			);
		}

		if (input.email !== existing.email) {
			const emailCheck = await this.userRepo.findByEmail(input.email);
			if (emailCheck && emailCheck.id !== id) {
				throw new Error(`Email ${input.email} sudah digunakan oleh akun lain.`);
			}
		}

		// Resolve role
		let roleId = existing.roleId;
		if (input.role && input.role !== existing.role?.name) {
			// Cegah penurunan role jika ini adalah SuperAdmin terakhir
			if (
				existing.role?.name === "SUPER_ADMIN" &&
				input.role !== "SUPER_ADMIN"
			) {
				const superAdminCount = await this.userRepo.countSuperAdmins();
				if (superAdminCount <= 1) {
					throw new Error(
						"Tidak dapat mengubah role. Sistem harus memiliki minimal satu SuperAdmin.",
					);
				}
			}

			const newRole = await this.userRepo.findRoleByName(
				input.role as unknown as RoleName,
			);
			if (newRole) {
				roleId = newRole.id;
			}
		}

		// Resolve assignedPropertyId
		let propertyId: string | null = null;
		if (input.assignedProperty && input.assignedProperty !== "Semua Kost") {
			const properties = await this.propertyRepo.findAll();
			const matched = properties.find(
				(p) =>
					p.name.toLowerCase() === input.assignedProperty.toLowerCase() ||
					p.id === input.assignedProperty,
			);
			if (matched) {
				propertyId = matched.id;
			}
		}

		let passwordHash: string | undefined;
		if (input.password && input.password.trim().length > 0) {
			if (input.password.trim().length < 8) {
				throw new Error("Password baru minimal 8 karakter.");
			}
			passwordHash = await hashPassword(input.password.trim());
		}

		const updated = await this.userRepo.updateUser(id, {
			name: input.name,
			email: input.email,
			roleId,
			assignedPropertyId: propertyId,
			passwordHash,
		});

		return {
			id: updated.id,
			name: updated.name,
			email: updated.email,
			role: (updated.role?.name || "ADMIN") as AppUserRole,
			assignedProperty: updated.assignedProperty?.name || "Semua Kost",
			assignedPropertyId: updated.assignedProperty?.id || null,
			status: input.status,
			createdAt: updated.createdAt.toISOString().slice(0, 10),
		};
	}

	async deleteUser(
		id: string,
		requesterUserId?: string,
	): Promise<{ success: boolean; id: string }> {
		if (requesterUserId && id === requesterUserId) {
			throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
		}

		const existing = await this.userRepo.findById(id);
		if (!existing) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		const requesterRole = await this.getRequesterRole(requesterUserId);
		const requesterLevel = ROLE_HIERARCHY[requesterRole] ?? 1;
		const targetRole = (existing.role?.name || "ADMIN") as AppUserRole;
		const targetLevel = ROLE_HIERARCHY[targetRole] ?? 1;

		// Hierarchy guard: Cannot delete equal or higher role
		if (requesterRole !== "SUPER_ADMIN" && targetLevel >= requesterLevel) {
			throw new Error(
				"Anda tidak memiliki hak akses untuk menghapus pengguna dengan role yang sama atau lebih tinggi.",
			);
		}

		if (existing.role?.name === "SUPER_ADMIN") {
			const superAdminCount = await this.userRepo.countSuperAdmins();
			if (superAdminCount <= 1) {
				throw new Error(
					"Tidak dapat menghapus satu-satunya akun SuperAdmin pada sistem.",
				);
			}
		}

		await this.userRepo.deleteUser(id);
		return { success: true, id };
	}

	/**
	 * Ambil Data Profil Pengguna Saat Ini
	 */
	async getMyProfile(userId: string): Promise<UserProfileDetail> {
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		const isSuperAdmin = user.role?.name === "SUPER_ADMIN";
		let accessibleProperties: Array<{
			id: string;
			name: string;
			address: string;
			totalRooms: number;
		}> = [];

		if (isSuperAdmin) {
			const allProps = await this.propertyRepo.findAll();
			accessibleProperties = allProps.map((p) => ({
				id: p.id,
				name: p.name,
				address: p.address,
				totalRooms: p.rooms ? p.rooms.length : 0,
			}));
		} else if (user.assignedPropertyId) {
			const prop = await this.propertyRepo.findById(user.assignedPropertyId);
			if (prop) {
				accessibleProperties = [
					{
						id: prop.id,
						name: prop.name,
						address: prop.address,
						totalRooms: prop.rooms ? prop.rooms.length : 0,
					},
				];
			}
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			phoneNumber: "",
			role: (user.role?.name || "ADMIN") as AppUserRole,
			assignedProperty: user.assignedProperty?.name || "Semua Kost",
			assignedPropertyId: user.assignedProperty?.id || null,
			accessibleProperties,
			createdAt: user.createdAt.toISOString().slice(0, 10),
		};
	}

	/**
	 * Perbarui Data Profil Pengguna Saat Ini
	 */
	async updateMyProfile(
		userId: string,
		input: ProfileUpdateFormValues,
	): Promise<UserProfileDetail> {
		const existing = await this.userRepo.findById(userId);
		if (!existing) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		if (input.email !== existing.email) {
			const emailCheck = await this.userRepo.findByEmail(input.email);
			if (emailCheck && emailCheck.id !== userId) {
				throw new Error(`Email ${input.email} sudah digunakan oleh akun lain.`);
			}
		}

		let passwordHash: string | undefined;
		if (input.newPassword && input.newPassword.trim().length > 0) {
			if (input.newPassword.trim().length < 8) {
				throw new Error("Password baru minimal 8 karakter.");
			}
			passwordHash = await hashPassword(input.newPassword.trim());
		}

		await this.userRepo.updateUser(userId, {
			name: input.name,
			email: input.email,
			passwordHash,
		});

		return this.getMyProfile(userId);
	}

	/**
	 * Ganti Password Akun Pengguna Saat Ini
	 */
	async changeMyPassword(
		userId: string,
		input: ChangePasswordFormValues,
	): Promise<{ success: boolean; message: string }> {
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		if (input.newPassword !== input.confirmNewPassword) {
			throw new Error("Konfirmasi password baru tidak cocok.");
		}
		if (input.newPassword.length < 8) {
			throw new Error("Password baru minimal 8 karakter.");
		}

		const passwordHash = await hashPassword(input.newPassword);
		await this.userRepo.updateUser(userId, {
			passwordHash,
		});

		return {
			success: true,
			message: "Kata sandi akun Anda berhasil diperbarui.",
		};
	}

	async getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
		const logs: Array<AuditLogItem & { rawDate: Date }> = [];

		try {
			// 1. Ambil transaksi keuangan riil dari tabel transactions
			const txs = await this.db.transaction.findMany({
				take: limit,
				orderBy: { createdAt: "desc" },
				include: {
					creator: {
						include: {
							role: true,
						},
					},
					property: true,
				},
			});

			for (const tx of txs) {
				const roleName = (tx.creator?.role?.name || "ADMIN") as AppUserRole;
				const userName = tx.creator?.name || "Pengelola Kos";
				const propName = tx.property?.name || "Semua Kost";
				const amountFormatted = formatRupiah(Number(tx.amount));
				const isIncome = tx.type === "INCOME";

				let activity = isIncome ? "Pemasukan Kas" : "Pengeluaran Kas";
				if (tx.category === "RENT") {
					activity = "Verifikasi Pembayaran Sewa";
				} else if (tx.category === "MAINTENANCE") {
					activity = "Biaya Perbaikan Fasilitas";
				} else if (tx.category === "UTILITIES") {
					activity = "Pembayaran Listrik/Air";
				} else if (tx.category === "INTERNET") {
					activity = "Pembayaran Wi-Fi Kos";
				} else if (tx.category === "SALARY") {
					activity = "Gaji Karyawan/Penjaga";
				}

				logs.push({
					id: `tx-${tx.id}`,
					time: formatRelativeLogTime(tx.createdAt),
					userName,
					userRole: roleName,
					activity,
					detail: `${amountFormatted} · ${propName} (${tx.description || tx.category})`,
					rawDate: tx.createdAt,
				});
			}

			// 2. Ambil log notifikasi riil dari tabel notification_logs
			const notifs = await this.db.notificationLog.findMany({
				take: limit,
				orderBy: { sentAt: "desc" },
			});

			for (const n of notifs) {
				let activity = "Kirim Notifikasi";
				if (n.messageType === "DUE_DATE_REMINDER") {
					activity = "Pengingat Tagihan (WA)";
				} else if (n.messageType === "BIRTHDAY_WISH") {
					activity = "Ucapan Ulang Tahun (WA)";
				} else if (n.messageType === "INVOICE") {
					activity = "Dokumen Invoice PDF (WA)";
				} else if (n.messageType === "ANNOUNCEMENT") {
					activity = "Broadcast Agenda Kos";
				}

				logs.push({
					id: `notif-${n.id}`,
					time: formatRelativeLogTime(n.sentAt),
					userName: "Sistem Otomasi",
					userRole: "ADMIN",
					activity,
					detail: `${n.recipientNumber} · Status: ${n.status === "SENT" ? "Terkirim" : "Gagal"} ${n.notes ? `(${n.notes})` : ""}`,
					rawDate: n.sentAt,
				});
			}

			// 3. Urutkan berdasarkan waktu transaksi/aktivitas terbaru
			logs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

			return logs.slice(0, limit).map(({ rawDate, ...item }) => item);
		} catch (err) {
			console.error("Gagal mengambil data audit logs riil:", err);
			return [];
		}
	}

	async handleForgotPasswordRequest(email: string): Promise<{
		success: boolean;
		role: AppUserRole;
		email: string;
		name: string;
		message: string;
		ownerPhone?: string;
	}> {
		const cleanEmail = email.trim().toLowerCase();
		const user = await this.userRepo.findByEmail(cleanEmail);
		if (!user) {
			throw new Error("Email tidak terdaftar dalam sistem akun pengelola kos.");
		}

		const roleName = (user.role?.name || "ADMIN") as AppUserRole;
		const roleLabel =
			roleName === "SUPER_ADMIN"
				? "SuperAdmin (Pemilik Kos)"
				: "Admin Cabang Kos";

		const token = `${crypto.randomUUID()}-${crypto.randomBytes(16).toString("hex")}`;
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

		// Hapus token lama jika ada
		await this.db.verification.deleteMany({
			where: { identifier: user.email },
		});

		await this.db.verification.create({
			data: {
				identifier: user.email,
				value: token,
				expiresAt,
			},
		});

		const baseUrl = process.env.APP_URL || "http://localhost:3000";
		const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

		const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
		const requestedAt = `${nowWib.getUTCDate()} ${
			[
				"Januari",
				"Februari",
				"Maret",
				"April",
				"Mei",
				"Juni",
				"Juli",
				"Agustus",
				"September",
				"Oktober",
				"November",
				"Desember",
			][nowWib.getUTCMonth()]
		} ${nowWib.getUTCFullYear()}, ${String(nowWib.getUTCHours()).padStart(2, "0")}:${String(nowWib.getUTCMinutes()).padStart(2, "0")} WIB`;

		await emailService.sendPasswordResetEmail({
			to: user.email,
			name: user.name,
			resetUrl,
			roleName: roleLabel,
			expiresInMinutes: 60,
			requestedAt,
		});

		return {
			success: true,
			role: roleName,
			email: user.email,
			name: user.name,
			message: `Tautan verifikasi pemulihan kata sandi telah dikirimkan ke alamat email ${roleLabel} Anda (${user.email}). Silakan periksa kotak masuk atau folder spam email Anda.`,
		};
	}

	/**
	 * Reset Kata Sandi Menggunakan Token Verifikasi Email
	 */
	async resetPasswordWithToken(
		email: string,
		token: string,
		newPassword: string,
	): Promise<{ success: boolean; message: string }> {
		const cleanEmail = email.trim().toLowerCase();
		const verification = await this.db.verification.findFirst({
			where: {
				identifier: cleanEmail,
				value: token,
				expiresAt: {
					gte: new Date(),
				},
			},
		});

		if (!verification) {
			throw new Error(
				"Tautan pemulihan kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permintaan baru.",
			);
		}

		const user = await this.userRepo.findByEmail(cleanEmail);
		if (!user) {
			throw new Error("Pengguna tidak ditemukan.");
		}

		if (newPassword.length < 8) {
			throw new Error("Kata sandi baru minimal 8 karakter.");
		}

		const passwordHash = await hashPassword(newPassword);

		// Perbarui password di tabel User dan Account Better-Auth
		await this.userRepo.updateUser(user.id, {
			passwordHash,
		});

		// Hapus token verifikasi setelah berhasil digunakan
		await this.db.verification.delete({
			where: { id: verification.id },
		});

		return {
			success: true,
			message:
				"Kata sandi akun SuperAdmin berhasil diperbarui. Silakan masuk kembali dengan kata sandi baru Anda.",
		};
	}
}

export const userManagementService = new UserManagementService();
