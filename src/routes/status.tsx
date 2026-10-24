import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	Box,
	Clock,
	Cpu,
	Database,
	HardDrive,
	Layers,
	RefreshCw,
	Server,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
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

function getBadgeStyle(level: HealthLevel) {
	if (level === "critical") {
		return {
			container: "bg-rose-50 text-rose-700 border-rose-200",
			dot: "bg-rose-500",
			bar: "bg-rose-500",
		};
	}
	if (level === "warning") {
		return {
			container: "bg-amber-50 text-amber-700 border-amber-200",
			dot: "bg-amber-500",
			bar: "bg-amber-500",
		};
	}
	return {
		container: "bg-emerald-50 text-emerald-700 border-emerald-200",
		dot: "bg-emerald-500",
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
	const databaseBadge = getBadgeStyle(statusData.database.statusLevel);

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

						<Link
							to="/dashboard"
							className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4f6958] hover:bg-[#3f5446] text-white text-xs font-semibold transition-all shadow-xs"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							<span>Dashboard</span>
						</Link>
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
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span
									className={`w-2.5 h-2.5 rounded-full ${overallBadge.dot} animate-pulse`}
								/>
								<span className="text-xs font-bold uppercase tracking-wider">
									Kondisi Operasional
								</span>
							</div>
							<h2 className="text-lg sm:text-xl font-bold tracking-tight">
								{statusData.recommendation.headline}
							</h2>
							<p className="text-xs sm:text-sm text-[#4b554d] leading-relaxed max-w-3xl">
								{statusData.recommendation.description}
							</p>
						</div>

						<div className="shrink-0 text-left sm:text-right text-[11px] text-[#6b756d] border-t sm:border-t-0 pt-2 sm:pt-0 border-current/10">
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
										Memori Server (RAM)
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

						{/* Penyimpanan Server (Disk Storage) */}
						<div className="p-5 rounded-2xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<HardDrive className="w-4 h-4 text-[#4f6958]" />
									<span className="text-xs font-bold text-[#252925]">
										Ruang Penyimpanan Server
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
									Informasi ruang penyimpanan tidak tersedia pada sistem
									operasi saat ini.
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
										Pemrosesan Server
									</h4>
									<p className="text-[11px] text-[#737873]">
										{statusData.server.cpu.model}
									</p>
								</div>
							</div>
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
								Beban {statusData.server.cpu.loadStatus}
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
										Waktu Aktif Server
									</h4>
									<p className="text-[11px] text-[#737873]">
										Berjalan tanpa jeda sejak dinyalakan
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
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-bold text-[#252925] flex items-center gap-2">
								<Box className="w-4 h-4 text-[#4f6958]" />
								Rincian Penggunaan Layanan Aplikasi & Basis Data
							</h3>
							<p className="text-xs text-[#737873]">
								Beban memori tiap komponen aplikasi dan basis data terhadap batas alokasi aman
							</p>
						</div>
						<span className="text-[11px] font-medium text-[#737873] bg-[#f0f4f1] px-2.5 py-1 rounded-lg border border-[#e2eae3]">
							{statusData.containers.summary}
						</span>
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
											<span className="text-[10.5px]">
												{item.role === "database"
													? `Data: ${statusData.database.sizeFormatted}`
													: `Aktif: ${statusData.app.uptimeFormatted}`}
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

				{/* Level 3: Panduan & Rekomendasi Kapasitas untuk Pemilik Kos */}
				<section className="p-6 rounded-2xl bg-white border border-[#e4e9e4] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
					<div>
						<h3 className="text-sm font-bold text-[#252925]">
							Panduan Kapasitas & Rekomendasi Peningkatan Server
						</h3>
						<p className="text-xs text-[#737873] mt-0.5">
							Informasi transparan agar pemilik kos dapat mengetahui kapan
							saatnya meningkatkan spesifikasi server
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						{/* Hijau */}
						<div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
							<div className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-emerald-500" />
								<strong className="text-xs font-bold text-emerald-800">
									Kondisi Normal (&lt; 75%)
								</strong>
							</div>
							<p className="text-[11px] text-emerald-700 leading-relaxed">
								Server bekerja dengan sangat longgar. Belum ada kebutuhan
								tindakan atau peningkatan kapasitas dalam waktu dekat.
							</p>
						</div>

						{/* Kuning */}
						<div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
							<div className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-amber-500" />
								<strong className="text-xs font-bold text-amber-800">
									Batas Perhatian (75% - 85%)
								</strong>
							</div>
							<p className="text-[11px] text-amber-700 leading-relaxed">
								Penggunaan server mulai meningkat. Pantau jika ada penambahan
								kamar atau transaksi dalam jumlah besar.
							</p>
						</div>

						{/* Merah */}
						<div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5">
							<div className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-rose-500" />
								<strong className="text-xs font-bold text-rose-800">
									Waktunya Peningkatan (&gt; 85%)
								</strong>
							</div>
							<p className="text-[11px] text-rose-700 leading-relaxed">
								Penggunaan memori bertahan tinggi selama beberapa hari.
								Disarankan melakukan peningkatan paket server agar operasional
								tetap lancar.
							</p>
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
