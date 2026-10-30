import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	Box,
	Clock,
	Cpu,
	Database,
	HardDrive,
	RefreshCw,
	Server,
	ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
	HealthLevel,
	SystemStatusData,
} from "../common/types/system.types.ts";
import { getSystemStatusServerFn } from "../data/servers/system.fn.ts";

export const Route = createFileRoute("/status")({
	loader: async () => {
		const initialData = await getSystemStatusServerFn();
		return { initialData };
	},
	head: () => ({
		meta: [
			{
				title: "Status & Kapasitas Server — HomeeKost",
			},
			{
				name: "description",
				content:
					"Informasi kesehatan dan kapasitas server sistem pengelolaan kos.",
			},
		],
	}),
	component: StatusPage,
});

function getBadgeStyle(level: HealthLevel | string) {
	if (level === "critical" || level === "Kritis") {
		return {
			container: "bg-[#fceeed] text-[#b66b68] border-[#f0c3c1]",
			dot: "bg-[#b66b68]",
			bar: "bg-[#b66b68]",
		};
	}
	if (level === "warning" || level === "Waspada") {
		return {
			container: "bg-[#fbf4e6] text-[#b18a4b] border-[#eed7b0]",
			dot: "bg-[#b18a4b]",
			bar: "bg-[#b18a4b]",
		};
	}
	if (level === "prima" || level === "Prima") {
		return {
			container: "bg-[#e8f2ea] text-[#3e724d] border-[#b9dbbf]",
			dot: "bg-[#3e724d]",
			bar: "bg-[#4f6958]",
		};
	}
	return {
		container: "bg-[#edf5ee] text-[#4f6958] border-[#cde0d1]",
		dot: "bg-[#4f6958]",
		bar: "bg-[#4f6958]",
	};
}

function StatusPage() {
	const { initialData } = Route.useLoaderData();
	const [statusData, setStatusData] = useState<SystemStatusData>(initialData);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(
		new Date(initialData.timestamp),
	);
	const router = useRouter();

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			const updated = await getSystemStatusServerFn();
			setStatusData(updated);
			setLastRefreshedAt(new Date(updated.timestamp));
			await router.invalidate();
		} catch (err) {
			console.error("Gagal memuat status sistem:", err);
		} finally {
			setIsRefreshing(false);
		}
	};

	const overallBadge = getBadgeStyle(statusData.overallStatus);
	const memoryBadge = getBadgeStyle(statusData.server.memory.statusLevel);
	const storageBadge = statusData.server.storage
		? getBadgeStyle(statusData.server.storage.statusLevel)
		: null;

	const mainDashboardUrl = useMemo(() => {
		if (typeof window === "undefined") return "/dashboard";
		const host = window.location.hostname;
		const port = window.location.port ? `:${window.location.port}` : "";
		if (host.startsWith("status.")) {
			const mainHost = host.replace(/^status\./, "");
			return `${window.location.protocol}//${mainHost}${port}/dashboard`;
		}
		return "/dashboard";
	}, []);

	return (
		<div className="min-h-screen bg-[#faf9f5] text-[#252925] flex flex-col font-sans">
			{/* Top Navbar */}
			<header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e4e9e4]">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-[#edf5ee] border border-[#d2e2d5] text-[#4f6958] flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(79,105,88,0.08)]">
							HK
						</div>
						<div>
							<h1 className="text-sm font-bold text-[#252925] leading-tight">
								Status & Kapasitas Server
							</h1>
							<p className="text-[11px] text-[#737873]">
								HomeeKost Management System
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e4e9e4] bg-white hover:bg-[#f7faf7] text-xs font-semibold text-[#252925] transition-all disabled:opacity-50 cursor-pointer shadow-xs active:translate-y-px"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 text-[#4f6958] ${isRefreshing ? "animate-spin" : ""}`}
							/>
							<span>{isRefreshing ? "Memperbarui..." : "Perbarui Data"}</span>
						</button>

						<a
							href={mainDashboardUrl}
							className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4f6958] hover:bg-[#3f5446] text-white text-xs font-semibold transition-all shadow-xs"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							<span>Dashboard</span>
						</a>
					</div>
				</div>
			</header>

			{/* Main Content Area */}
			<main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
				{/* Overall Status Banner */}
				<section
					className={`p-5 sm:p-6 rounded-2xl border ${overallBadge.container} transition-all`}
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2">
								<span
									className={`w-2 h-2 rounded-full ${overallBadge.dot} animate-pulse`}
								/>
								<span className="text-xs font-bold tracking-wide">
									Status Sistem: {statusData.overallStatusLabel}
								</span>
							</div>
							<h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#252925]">
								{statusData.recommendation.headline}
							</h2>
							<p className="text-xs sm:text-sm text-[#4b554d] leading-relaxed max-w-3xl">
								{statusData.recommendation.description}
							</p>
						</div>

						<div className="shrink-0 text-left sm:text-right text-[11px] text-[#737873] border-t sm:border-t-0 pt-2 sm:pt-0 border-current/10">
							<p className="font-medium">Pembaruan Terakhir</p>
							<p className="font-semibold text-[#252925]">
								{lastRefreshedAt.toLocaleTimeString("id-ID", {
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
								})}{" "}
								WIB
							</p>
						</div>
					</div>
				</section>

				{/* Level 1: Server Utama (Host Hardware) */}
				<section className="space-y-3">
					<div>
						<h3 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<Server className="w-4 h-4 text-[#4f6958]" />
							Server Utama
						</h3>
						<p className="text-xs text-[#737873]">
							Kapasitas perangkat keras server tempat sistem operasional bekerja
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Memori Server (RAM) */}
						<div className="p-5 rounded-2xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Activity className="w-4 h-4 text-[#4f6958]" />
									<span className="text-xs font-bold text-[#252925]">
										Memori (RAM)
									</span>
								</div>
								<span
									className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${memoryBadge.container}`}
								>
									<span
										className={`w-1.5 h-1.5 rounded-full ${memoryBadge.dot}`}
									/>
									{statusData.server.memory.statusLabel}
								</span>
							</div>

							<div>
								<div className="flex items-baseline justify-between">
									<span className="text-2xl font-bold text-[#252925]">
										{statusData.server.memory.usedFormatted}
									</span>
									<span className="text-xs text-[#737873]">
										dari kapasitas total{" "}
										<strong className="text-[#252925]">
											{statusData.server.memory.totalFormatted}
										</strong>
									</span>
								</div>

								{/* Progress Bar */}
								<div className="w-full h-2 rounded-full bg-[#f0f3f0] mt-2 overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-500 ${memoryBadge.bar}`}
										style={{
											width: `${statusData.server.memory.usedPercent}%`,
										}}
									/>
								</div>

								<div className="flex items-center justify-between text-[11px] text-[#737873] mt-2">
									<span>
										Terpakai:{" "}
										<strong className="text-[#252925]">
											{statusData.server.memory.usedPercent}%
										</strong>
									</span>
									<span>
										Tersedia:{" "}
										<strong className="text-[#252925]">
											{statusData.server.memory.freeFormatted}
										</strong>
									</span>
								</div>
							</div>
						</div>

						{/* Penyimpanan Server (Storage) */}
						<div className="p-5 rounded-2xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<HardDrive className="w-4 h-4 text-[#4f6958]" />
									<span className="text-xs font-bold text-[#252925]">
										Penyimpanan (Storage)
									</span>
								</div>
								{storageBadge && (
									<span
										className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${storageBadge.container}`}
									>
										<span
											className={`w-1.5 h-1.5 rounded-full ${storageBadge.dot}`}
										/>
										{statusData.server.storage?.statusLabel}
									</span>
								)}
							</div>

							{statusData.server.storage ? (
								<div>
									<div className="flex items-baseline justify-between">
										<span className="text-2xl font-bold text-[#252925]">
											{statusData.server.storage.usedFormatted}
										</span>
										<span className="text-xs text-[#737873]">
											dari kapasitas total{" "}
											<strong className="text-[#252925]">
												{statusData.server.storage.totalFormatted}
											</strong>
										</span>
									</div>

									{/* Progress Bar */}
									<div className="w-full h-2 rounded-full bg-[#f0f3f0] mt-2 overflow-hidden">
										<div
											className={`h-full rounded-full transition-all duration-500 ${storageBadge?.bar || "bg-[#4f6958]"}`}
											style={{
												width: `${statusData.server.storage.usedPercent}%`,
											}}
										/>
									</div>

									<div className="flex items-center justify-between text-[11px] text-[#737873] mt-2">
										<span>
											Terpakai:{" "}
											<strong className="text-[#252925]">
												{statusData.server.storage.usedPercent}%
											</strong>
										</span>
										<span>
											Sisa Ruang:{" "}
											<strong className="text-[#252925]">
												{statusData.server.storage.freeFormatted}
											</strong>
										</span>
									</div>
								</div>
							) : (
								<p className="text-xs text-[#737873] py-4">
									Informasi ruang penyimpanan dikelola secara otomatis oleh cloud.
								</p>
							)}
						</div>

						{/* Pemrosesan (CPU) */}
						<div className="p-4 rounded-xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-[#edf5ee] border border-[#dce6df] text-[#4f6958] flex items-center justify-center">
									<Cpu className="w-4 h-4" />
								</div>
								<div>
									<h4 className="text-xs font-bold text-[#252925]">
										Pemrosesan (CPU)
									</h4>
									<p className="text-[11px] text-[#737873]">
										{statusData.server.cpu.model} · Beban {statusData.server.cpu.loadAvg1m}
									</p>
								</div>
							</div>
							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getBadgeStyle(statusData.server.cpu.statusLevel).container}`}
							>
								<span
									className={`w-1.5 h-1.5 rounded-full ${getBadgeStyle(statusData.server.cpu.statusLevel).dot}`}
								/>
								{statusData.server.cpu.statusLabel}
							</span>
						</div>

						{/* Durasi Operasional Server (Host Uptime) */}
						<div className="p-4 rounded-xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-[#edf5ee] border border-[#dce6df] text-[#4f6958] flex items-center justify-center">
									<Clock className="w-4 h-4" />
								</div>
								<div>
									<h4 className="text-xs font-bold text-[#252925]">
										Waktu Aktif Sistem
									</h4>
									<p className="text-[11px] text-[#737873]">
										Sistem beroperasi stabil
									</p>
								</div>
							</div>
							<span className="text-xs font-bold text-[#252925]">
								{statusData.server.uptimeFormatted}
							</span>
						</div>
					</div>
				</section>

				{/* Level 2: Rincian Penggunaan Kontainer & Layanan */}
				<section className="space-y-3">
					<div>
						<h3 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<Box className="w-4 h-4 text-[#4f6958]" />
							Rincian Penggunaan Layanan Aplikasi & Basis Data
						</h3>
						<p className="text-xs text-[#737873]">
							Beban alokasi memori tiap komponen aplikasi dan basis data terhadap batas aman
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{statusData.containers.items.map((item) => {
							const badge = getBadgeStyle(item.statusLevel);
							return (
								<div
									key={item.id}
									className="p-5 rounded-2xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											{item.role === "database" ? (
												<Database className="w-4 h-4 text-[#4f6958]" />
											) : (
												<ShieldCheck className="w-4 h-4 text-[#4f6958]" />
											)}
											<span className="text-xs font-bold text-[#252925]">
												{item.name}
											</span>
										</div>
										<span
											className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.container}`}
										>
											<span
												className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
											/>
											{item.statusLabel}
										</span>
									</div>

									<div>
										<div className="flex items-baseline justify-between">
											<span className="text-2xl font-bold text-[#252925]">
												{item.memoryUsedFormatted}
											</span>
											<span className="text-xs text-[#737873]">
												dari alokasi aman{" "}
												<strong className="text-[#252925]">
													{item.memoryLimitFormatted}
												</strong>
											</span>
										</div>

										{/* Progress Bar */}
										<div className="w-full h-2 rounded-full bg-[#f0f3f0] mt-2 overflow-hidden">
											<div
												className={`h-full rounded-full transition-all duration-500 ${badge.bar}`}
												style={{
													width: `${item.memoryPercentOfLimit}%`,
												}}
											/>
										</div>

										<div className="flex items-center justify-between text-[11px] text-[#737873] mt-2">
											<span>
												Beban Alokasi:{" "}
												<strong className="text-[#252925]">
													{item.memoryPercentOfLimit}%
												</strong>
											</span>
											<span>
												{item.role === "database"
													? `Ukuran Data: ${statusData.database.sizeFormatted}`
													: `Durasi Aktif: ${statusData.app.uptimeFormatted}`}
											</span>
										</div>
									</div>

									<p className="text-[11.5px] text-[#737873] pt-1 leading-relaxed border-t border-[#f2f4f2]">
										{item.description}
									</p>
								</div>
							);
						})}
					</div>
				</section>

				{/* Level 3: Panduan Status & Indikator Sistem untuk Pemilik Kos */}
				<section className="p-6 rounded-2xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
					<div>
						<h3 className="text-sm font-bold text-[#252925]">
							Panduan Status & Indikator Sistem
						</h3>
						<p className="text-xs text-[#737873] mt-0.5">
							Petunjuk mandiri untuk memahami arti status server kos Anda tanpa perlu akses terminal atau teknis
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
						{/* 1. Prima */}
						<div className="p-4 rounded-xl border border-[#b9dbbf] bg-[#e8f2ea]/40 space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#b9dbbf] bg-[#e8f2ea] text-[#3e724d]">
									<span className="w-1.5 h-1.5 rounded-full bg-[#3e724d]" />
									Prima
								</span>
								<span className="text-[11px] font-bold text-[#3e724d]">Sangat Sehat</span>
							</div>
							<div className="space-y-1 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">Syarat Terpenuhi:</p>
								<ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-[#556358]">
									<li>RAM &lt; 60%</li>
									<li>Penyimpanan &lt; 60%</li>
									<li>Beban CPU Ringan</li>
									<li>Database Lancar (&lt; 300ms)</li>
								</ul>
								<p className="pt-1.5 text-[10.5px]">
									<strong>Tindakan:</strong> Tidak perlu tindakan apa pun. Sistem bekerja sangat longgar.
								</p>
							</div>
						</div>

						{/* 2. Normal */}
						<div className="p-4 rounded-xl border border-[#cde0d1] bg-[#edf5ee]/40 space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#cde0d1] bg-[#edf5ee] text-[#4f6958]">
									<span className="w-1.5 h-1.5 rounded-full bg-[#4f6958]" />
									Normal
								</span>
								<span className="text-[11px] font-bold text-[#4f6958]">Standar Harian</span>
							</div>
							<div className="space-y-1 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">Syarat Terpenuhi:</p>
								<ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-[#556358]">
									<li>RAM 60% – 75%</li>
									<li>Penyimpanan 60% – 80%</li>
									<li>Beban CPU Ringan / Sedang</li>
									<li>Database Terhubung Lancar</li>
								</ul>
								<p className="pt-1.5 text-[10.5px]">
									<strong>Tindakan:</strong> Tidak perlu tindakan. Beban operasional kos berjalan stabil.
								</p>
							</div>
						</div>

						{/* 3. Waspada */}
						<div className="p-4 rounded-xl border border-[#eed7b0] bg-[#fbf4e6]/40 space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#eed7b0] bg-[#fbf4e6] text-[#b18a4b]">
									<span className="w-1.5 h-1.5 rounded-full bg-[#b18a4b]" />
									Waspada
								</span>
								<span className="text-[11px] font-bold text-[#b18a4b]">Perlu Pemantauan</span>
							</div>
							<div className="space-y-1 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">Syarat Terpenuhi:</p>
								<ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-[#7d6537]">
									<li>RAM 75% – 90% (cache aktif) ATAU</li>
									<li>Penyimpanan 80% – 90% ATAU</li>
									<li>Beban CPU Sedang / Tinggi sesaat</li>
								</ul>
								<p className="pt-1.5 text-[10.5px]">
									<strong>Tindakan:</strong> Jika RAM tinggi, biarkan saja (sistem merapikan otomatis). Jika penyimpanan tinggi, cukup bersihkan berkas sampah / bukti lama. <em>Tidak perlu upgrade VPS.</em>
								</p>
							</div>
						</div>

						{/* 4. Kritis */}
						<div className="p-4 rounded-xl border border-[#f0c3c1] bg-[#fceeed]/40 space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#f0c3c1] bg-[#fceeed] text-[#b66b68]">
									<span className="w-1.5 h-1.5 rounded-full bg-[#b66b68]" />
									Kritis
								</span>
								<span className="text-[11px] font-bold text-[#b66b68]">Tindakan Segera</span>
							</div>
							<div className="space-y-1 text-[11px] text-[#37443c] leading-relaxed">
								<p className="font-semibold text-[#252925]">Syarat Terpenuhi:</p>
								<ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-[#8c4b48]">
									<li>Database Terputus ATAU</li>
									<li>Penyimpanan &gt; 92% ATAU</li>
									<li>RAM &gt; 90% + CPU Tinggi + Kamar Ratusan</li>
								</ul>
								<p className="pt-1.5 text-[10.5px]">
									<strong>Tindakan:</strong> Periksa koneksi basis data. Jika kos sudah berkembang ratusan kamar, baru saatnya meningkatkan paket spesifikasi VPS.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Minimalist Footer */}
			<footer className="border-t border-[#e4e9e4] py-6 bg-white/50 text-center text-xs text-[#737873]">
				<p className="font-medium text-[#252925]">
					HomeeKost Management System
				</p>
				<p className="text-[11px] text-[#8e948e] mt-1">
					Status server diperbarui secara otomatis dan langsung dari sistem.
				</p>
			</footer>
		</div>
	);
}
