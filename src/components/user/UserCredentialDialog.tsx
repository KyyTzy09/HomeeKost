import {
	Check,
	CheckCircle2,
	Copy,
	Eye,
	EyeOff,
	KeyRound,
	Mail,
	MessageCircle,
	ShieldCheck,
	User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import { Label } from "../../common/shadcn/label.tsx";
import type { UserItem } from "../../common/types/index.ts";

export interface NewUserCredentialData {
	user: UserItem;
	rawPassword: string;
}

interface UserCredentialDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	credential: NewUserCredentialData | null;
}

export function UserCredentialDialog({
	open,
	onOpenChange,
	credential,
}: UserCredentialDialogProps) {
	const [showPassword, setShowPassword] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);

	if (!credential) return null;

	const { user, rawPassword } = credential;

	const roleLabel =
		user.role === "SUPER_ADMIN"
			? "SuperAdmin (Owner Kos)"
			: "Admin (Cabang Kos)";

	const handleCopy = async (text: string, fieldKey: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldKey);
			setTimeout(() => {
				setCopiedField(null);
			}, 2000);
		} catch {
			// Fallback copy
			const textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopiedField(fieldKey);
			setTimeout(() => {
				setCopiedField(null);
			}, 2000);
		}
	};

	const loginUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/login`
			: "http://localhost:3000/login";

	const allCredentialText = `*Informasi Akun HomeeKost*
Halo ${user.name}, berikut adalah rincian akun Anda:

• Email: ${user.email}
• Password: ${rawPassword}
• Role: ${roleLabel}
• Penugasan: ${user.assignedProperty}
• Tautan Login: ${loginUrl}

Silakan segera masuk dan jaga kerahasiaan kata sandi Anda.`;

	const handleCopyAll = async () => {
		try {
			await navigator.clipboard.writeText(allCredentialText);
			setCopiedAll(true);
			setTimeout(() => {
				setCopiedAll(false);
			}, 2500);
		} catch {
			const textArea = document.createElement("textarea");
			textArea.value = allCredentialText;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopiedAll(true);
			setTimeout(() => {
				setCopiedAll(false);
			}, 2500);
		}
	};

	const waShareUrl = `https://wa.me/?text=${encodeURIComponent(allCredentialText)}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[500px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="credential-dialog-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-[#e8f2ea] text-[#4f6958] flex items-center justify-center border border-[#cfe2d3] shrink-0">
							<CheckCircle2 className="w-5 h-5 text-[#4f6958]" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-[#252925]">
								Akun Pengguna Berhasil Dibuat
							</DialogTitle>
							<DialogDescription
								id="credential-dialog-description"
								className="text-xs text-[#737873] mt-0.5"
							>
								Simpan atau salin kredensial berikut untuk dikirimkan kepada
								staf/pengguna baru.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 pt-2">
					{/* Ringkasan Profil Singkat */}
					<div className="p-3 bg-[#f7faf7] border border-[#e5ece5] rounded-xl space-y-2.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-[#737873] flex items-center gap-1.5 font-medium">
								<User className="w-3.5 h-3.5 text-[#4f6958]" /> Nama Lengkap:
							</span>
							<span className="font-semibold text-[#252925]">{user.name}</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-[#737873] flex items-center gap-1.5 font-medium">
								<ShieldCheck className="w-3.5 h-3.5 text-[#4f6958]" /> Role &
								Akses:
							</span>
							<span className="px-2 py-0.5 bg-[#e8f2ea] text-[#4f6958] text-[11px] font-bold rounded-md">
								{roleLabel}
							</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-[#737873] flex items-center gap-1.5 font-medium">
								Cabang Properti:
							</span>
							<span className="font-semibold text-[#252925] truncate max-w-[240px]">
								{user.assignedProperty}
							</span>
						</div>
					</div>

					{/* Email Input Field */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-[#252925] flex items-center gap-1.5">
							<Mail className="w-3.5 h-3.5 text-[#4f6958]" />
							Email Akun Login
						</Label>
						<div className="relative">
							<Input
								readOnly
								value={user.email}
								className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] text-[#252925] font-medium pr-10 cursor-text select-all"
							/>
							<button
								type="button"
								onClick={() => handleCopy(user.email, "email")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737873] hover:text-[#4f6958] p-1 rounded transition-colors"
								title="Salin email"
							>
								{copiedField === "email" ? (
									<Check className="w-4 h-4 text-[#4f6958]" />
								) : (
									<Copy className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					{/* Password Field: Readonly with Show/Hide Toggle & Copy Button */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-[#252925] flex items-center gap-1.5">
								<KeyRound className="w-3.5 h-3.5 text-[#4f6958]" />
								Password Akun
							</Label>
							<span className="text-[10.5px] text-[#737873]">
								Read-only (Dapat disalin)
							</span>
						</div>
						<div className="relative">
							<Input
								readOnly
								type={showPassword ? "text" : "password"}
								value={rawPassword}
								className="border-[#e4e9e4] text-xs h-10 bg-[#fbfcfb] text-[#252925] font-mono font-bold pr-20 cursor-text select-all"
							/>
							<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="p-1.5 text-[#737873] hover:text-[#252925] rounded transition-colors"
									title={
										showPassword ? "Sembunyikan password" : "Lihat password"
									}
									aria-label={
										showPassword ? "Sembunyikan password" : "Lihat password"
									}
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
								<button
									type="button"
									onClick={() => handleCopy(rawPassword, "password")}
									className="p-1.5 text-[#737873] hover:text-[#4f6958] rounded transition-colors"
									title="Salin password"
									aria-label="Salin password"
								>
									{copiedField === "password" ? (
										<Check className="w-4 h-4 text-[#4f6958]" />
									) : (
										<Copy className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>
						<p className="text-[10.5px] text-[#737873]">
							Gunakan password ini untuk masuk pertama kali ke sistem HomeeKost.
						</p>
					</div>
				</div>

				<DialogFooter className="pt-4 border-t border-[#e4e9e4] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
					<div className="flex items-center gap-2">
						<a
							href={waShareUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#25d366]/10 text-[#128c7e] hover:bg-[#25d366]/20 transition-colors border border-[#25d366]/30 cursor-pointer"
						>
							<MessageCircle className="w-3.5 h-3.5" />
							Kirim via WA
						</a>
						<Button
							type="button"
							variant="outline"
							className="border-[#cfdfd1] text-[#4f6958] hover:bg-[#e8f2ea] text-xs font-semibold px-3 h-9 flex items-center gap-1.5 cursor-pointer"
							onClick={handleCopyAll}
						>
							{copiedAll ? (
								<>
									<Check className="w-3.5 h-3.5 text-[#4f6958]" />
									Tersalin!
								</>
							) : (
								<>
									<Copy className="w-3.5 h-3.5" />
									Salin Semua Info
								</>
							)}
						</Button>
					</div>

					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-5 h-9 cursor-pointer"
						onClick={() => onOpenChange(false)}
					>
						Selesai
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
