import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Info,
	Loader2,
	Save,
	Send,
	Server,
	ShieldAlert,
	Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import { Input } from "../../common/shadcn/input.tsx";
import { Label } from "../../common/shadcn/label.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../common/shadcn/select.tsx";
import { serverAlertSettingsSchema } from "../../common/validations/system-alert.schema.ts";
import {
	useSendTestServerAlert,
	useServerAlertSettings,
	useUpdateServerAlertSettings,
} from "../../hooks/use-system.ts";

interface ProfileServerAlertCardProps {
	onShowToast?: (text: string, type?: "success" | "error") => void;
}

export function ProfileServerAlertCard({
	onShowToast,
}: ProfileServerAlertCardProps) {
	const { data: settings, isLoading } = useServerAlertSettings();
	const updateMutation = useUpdateServerAlertSettings();
	const testMutation = useSendTestServerAlert();

	const [enabled, setEnabled] = useState(false);
	const [targetPhone, setTargetPhone] = useState("");
	const [triggerCondition, setTriggerCondition] = useState<
		"NEAR_CRITICAL_AND_CRITICAL" | "CRITICAL_ONLY"
	>("NEAR_CRITICAL_AND_CRITICAL");
	const [cooldownHours, setCooldownHours] = useState<number>(6);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [hasInitialized, setHasInitialized] = useState(false);

	// Sinkronisasi data saat pertama kali dimuat dari database
	useEffect(() => {
		if (settings && !hasInitialized) {
			setEnabled(Boolean(settings.enabled));
			setTargetPhone(settings.targetPhone || "");
			setTriggerCondition(
				settings.triggerCondition || "NEAR_CRITICAL_AND_CRITICAL",
			);
			setCooldownHours(settings.cooldownHours ? Number(settings.cooldownHours) : 6);
			setHasInitialized(true);
		}
	}, [settings, hasInitialized]);

	const formatErrorMessage = (err: unknown): string => {
		if (err instanceof Error) {
			try {
				const parsed = JSON.parse(err.message);
				if (Array.isArray(parsed) && parsed[0]?.message) {
					return parsed[0].message;
				}
			} catch {}
			return err.message;
		}
		return "Terjadi kesalahan.";
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError(null);

		const result = serverAlertSettingsSchema.safeParse({
			enabled,
			targetPhone,
			triggerCondition,
			cooldownHours,
		});

		if (!result.success) {
			const firstError = result.error.issues[0]?.message || "Input tidak valid";
			setValidationError(firstError);
			onShowToast?.(firstError, "error");
			return;
		}

		try {
			const saved = await updateMutation.mutateAsync(result.data);
			setEnabled(Boolean(saved.enabled));
			setTargetPhone(saved.targetPhone || "");
			setTriggerCondition(saved.triggerCondition);
			setCooldownHours(saved.cooldownHours);
			onShowToast?.(
				"Pengaturan notifikasi WhatsApp peringatan server berhasil disimpan ke database!",
				"success",
			);
		} catch (err) {
			const errMsg = formatErrorMessage(err);
			setValidationError(errMsg);
			onShowToast?.(errMsg, "error");
		}
	};

	const handleSendTest = async () => {
		const phoneToTest = targetPhone.trim() || settings?.targetPhone?.trim() || "";
		if (!phoneToTest || phoneToTest.length < 8) {
			const msg =
				"Masukkan nomor WhatsApp yang valid terlebih dahulu sebelum mengirim tes.";
			setValidationError(msg);
			onShowToast?.(msg, "error");
			return;
		}

		setValidationError(null);
		try {
			const res = await testMutation.mutateAsync({
				targetPhone: phoneToTest,
			});
			onShowToast?.(
				res.message || "Pesan uji coba WhatsApp berhasil dikirim!",
				"success",
			);
		} catch (err) {
			const errMsg = formatErrorMessage(err);
			setValidationError(errMsg);
			onShowToast?.(errMsg, "error");
		}
	};

	return (
		<Card className="p-5 sm:p-6 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] rounded-2xl">
			{/* Header Card */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e4e9e4]">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 rounded-xl bg-[#eef3ee] text-[#4f6958] flex items-center justify-center shrink-0 border border-[#d6dfd7] shadow-2xs">
						<Server className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-sm font-bold text-[#252925] tracking-tight">
								Peringatan WhatsApp Server
							</h2>
							<span
								className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
									enabled
										? "bg-[#eef5ef] text-[#366844] border-[#c2ddc7]"
										: "bg-[#f4f5f4] text-[#737873] border-[#e0e3e0]"
								}`}
							>
								{enabled ? "Aktif" : "Nonaktif"}
							</span>
						</div>
						<p className="text-[11px] text-[#737873] mt-0.5">
							Kirim pesan darurat langsung ke WhatsApp pengelola saat kapasitas
							server mendekati batas kritis.
						</p>
					</div>
				</div>

				{/* Tombol Test WhatsApp */}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleSendTest}
					disabled={testMutation.isPending || isLoading}
					className="h-8 text-xs font-semibold border-[#d6dfd7] text-[#324537] hover:bg-[#eef3ee] hover:text-[#252925] self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
				>
					{testMutation.isPending ? (
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
					) : (
						<Send className="w-3.5 h-3.5 text-[#4f6958]" />
					)}
					<span>Kirim Tes WhatsApp</span>
				</Button>
			</div>

			{/* Form Konten */}
			<form onSubmit={handleSave} className="pt-4 space-y-4">
				{/* Sakelar Utama (Toggle Notifikasi) */}
				<div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#fbfcfb] border border-[#e4e9e4]">
					<div className="space-y-1">
						<label
							htmlFor="enable-server-alerts"
							className="text-xs font-bold text-[#252925] cursor-pointer flex items-center gap-1.5"
						>
							<ShieldAlert className="w-3.5 h-3.5 text-[#4f6958]" />
							Aktifkan Pengingat WhatsApp
						</label>
						<p className="text-[11px] text-[#737873] leading-relaxed">
							Hanya mengirim pemberitahuan jika server berada pada status{" "}
							<span className="font-semibold text-[#8f5e15]">Waspada</span> atau{" "}
							<span className="font-semibold text-[#a03835]">Kritis</span>. Tidak
							akan mengirim saat status Prima atau Normal guna menjaga kuota
							WhatsApp.
						</p>
					</div>
					<input
						type="checkbox"
						id="enable-server-alerts"
						checked={enabled}
						onChange={(e) => setEnabled(e.target.checked)}
						className="w-4 h-4 mt-1 accent-[#4f6958] rounded cursor-pointer"
					/>
				</div>

				{/* Field Nomor WhatsApp */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<Label
							htmlFor="target-phone-input"
							className="text-xs font-semibold text-[#252925] flex items-center gap-1.5"
						>
							<Smartphone className="w-3.5 h-3.5 text-[#4f6958]" />
							Nomor WhatsApp Penerima
						</Label>
						<span className="text-[10px] text-[#737873]">
							Bisa diubah sewaktu-waktu
						</span>
					</div>
					<Input
						id="target-phone-input"
						type="text"
						value={targetPhone}
						onChange={(e) => setTargetPhone(e.target.value)}
						placeholder="Contoh: 081234567890 atau 6281234567890"
						className="h-10 text-xs border-[#dfe7e0] bg-[#fbfcfb] focus:ring-[#8fa594]"
					/>
					<p className="text-[11px] text-[#737873]">
						Pesan darurat akan dialamatkan ke nomor ini. Format dapat menggunakan{" "}
						<code className="text-[10px] bg-[#f1f4f1] px-1 py-0.5 rounded text-[#375240]">
							08...
						</code>{" "}
						atau{" "}
						<code className="text-[10px] bg-[#f1f4f1] px-1 py-0.5 rounded text-[#375240]">
							628...
						</code>
						.
					</p>
				</div>

				{/* Pilihan Ambang Pemicu (Trigger Condition) */}
				<div className="space-y-2">
					<Label className="text-xs font-semibold text-[#252925]">
						Kondisi Pemicu Pesan
					</Label>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						<button
							type="button"
							onClick={() =>
								setTriggerCondition("NEAR_CRITICAL_AND_CRITICAL")
							}
							className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
								triggerCondition === "NEAR_CRITICAL_AND_CRITICAL"
									? "bg-[#f5faf6] border-[#7da788] shadow-2xs"
									: "bg-white border-[#e4e9e4] hover:bg-[#fafbfa]"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-bold text-[#252925]">
									Mendekati Kritis & Kritis
								</span>
							</div>
							<p className="text-[11px] text-[#737873] leading-snug">
								Memberitahu saat kapasitas server sudah hampir mencapai batas
								darurat (sekitar 80–85%, 5–10% sebelum kritis).
							</p>
						</button>

						<button
							type="button"
							onClick={() => setTriggerCondition("CRITICAL_ONLY")}
							className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
								triggerCondition === "CRITICAL_ONLY"
									? "bg-[#fdf8f4] border-[#d8aa86] shadow-2xs"
									: "bg-white border-[#e4e9e4] hover:bg-[#fafbfa]"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-bold text-[#252925]">
									Hanya Saat Kritis
								</span>
							</div>
							<p className="text-[11px] text-[#737873] leading-snug">
								Hanya mengirim saat server dalam kondisi bahaya darurat
								(penyimpanan sisa sedikit atau beban ekstrem).
							</p>
						</button>
					</div>
				</div>

				{/* Batas Jeda Waktu Pengiriman (Cooldown) - Custom Select */}
				<div className="space-y-1.5">
					<Label
						htmlFor="cooldown-hours-select"
						className="text-xs font-semibold text-[#252925] flex items-center gap-1.5"
					>
						<Clock className="w-3.5 h-3.5 text-[#4f6958]" />
						Jeda Minimal Antar Pesan (Anti-Spam)
					</Label>
					<div className="flex flex-col sm:flex-row sm:items-center gap-2">
						<Select
							value={String(cooldownHours)}
							onValueChange={(val) => {
								if (val) setCooldownHours(Number(val));
							}}
						>
							<SelectTrigger className="w-full sm:w-[220px] h-10 border-[#dfe7e0] rounded-lg px-3 text-xs bg-[#fbfcfb] text-[#252925] font-medium focus:ring-1 focus:ring-[#4f6958]">
								<SelectValue placeholder="Pilih Jeda Waktu">
									{cooldownHours === 3
										? "Setiap 3 Jam"
										: cooldownHours === 6
											? "Setiap 6 Jam (Standar)"
											: cooldownHours === 12
												? "Setiap 12 Jam"
												: "Setiap 24 Jam (1 Kali Sehari)"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-white border-[#e4e9e4] shadow-md rounded-lg text-xs">
								<SelectItem value="3">Setiap 3 Jam</SelectItem>
								<SelectItem value="6">Setiap 6 Jam (Standar)</SelectItem>
								<SelectItem value="12">Setiap 12 Jam</SelectItem>
								<SelectItem value="24">Setiap 24 Jam (1 Kali Sehari)</SelectItem>
							</SelectContent>
						</Select>
						<span className="text-[11px] text-[#737873]">
							Mencegah kuota terbuang jika server masih dalam kondisi yang sama.
						</span>
					</div>
				</div>

				{/* Pesan Kesalahan Validasi */}
				{validationError && (
					<div className="p-2.5 rounded-lg bg-[#fdf3f2] border border-[#f5cfcc] text-[#a03835] text-xs flex items-center gap-2">
						<AlertTriangle className="w-4 h-4 shrink-0" />
						<span>{validationError}</span>
					</div>
				)}

				{/* Banner Petunjuk Client & Non-Teknis */}
				<div className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e8e4d8] text-xs space-y-1.5 text-[#444641]">
					<div className="flex items-center gap-1.5 font-bold text-[#2d312e]">
						<Info className="w-4 h-4 text-[#8f7743]" />
						<span>Petunjuk Perhitungan Adil untuk Pemilik Kost</span>
					</div>
					<p className="text-[11px] text-[#636863] leading-relaxed">
						Sistem ini menggunakan perhitungan yang adil: Penggunaan RAM yang
						bertambah saat aplikasi aktif bekerja adalah hal yang normal dan tidak
						langsung memicu pesan darurat. Peringatan hanya dikirim jika kapasitas
						benar-benar hampir habis dan berisiko mengganggu operasional kos.
					</p>
					{settings?.lastNotifiedAt && (
						<div className="pt-1.5 mt-1 border-t border-[#e8e4d8] text-[10px] text-[#7b807a] flex items-center gap-1">
							<CheckCircle2 className="w-3 h-3 text-[#4f6958]" />
							<span>
								Pesan darurat terakhir dikirim pada:{" "}
								{new Date(settings.lastNotifiedAt).toLocaleString("id-ID", {
									dateStyle: "medium",
									timeStyle: "short",
								})}{" "}
								(Status: {settings.lastNotifiedStatus || "Waspada"})
							</span>
						</div>
					)}
				</div>

				{/* Tombol Simpan */}
				<div className="flex items-center justify-end pt-2">
					<Button
						type="submit"
						disabled={updateMutation.isPending || isLoading}
						className="bg-[#4f6958] hover:bg-[#3d5244] text-white text-xs font-semibold px-5 h-9 shadow-2xs flex items-center gap-2 cursor-pointer"
					>
						{updateMutation.isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Save className="w-3.5 h-3.5" />
						)}
						<span>Simpan Pengaturan WhatsApp</span>
					</Button>
				</div>
			</form>
		</Card>
	);
}
