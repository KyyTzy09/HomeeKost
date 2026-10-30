import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronDown, ChevronUp, Home, RefreshCw, RotateCcw } from "lucide-react";
import { useState } from "react";

export interface Error500PageProps {
	error: unknown;
	reset?: () => void;
	info?: {
		componentStack?: string;
	};
}

export function Error500Page({ error, reset, info }: Error500PageProps) {
	const [showDetails, setShowDetails] = useState(false);

	const errorMessage =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "Terjadi kesalahan yang tidak terduga pada sistem.";

	const errorStack =
		error instanceof Error && error.stack ? error.stack : null;

	const componentStack = info?.componentStack || null;

	const handleReload = () => {
		if (typeof window !== "undefined") {
			window.location.reload();
		}
	};

	return (
		<div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6 text-center">
			<div className="w-full max-w-[540px] bg-white border border-[#ebd8d5] rounded-[24px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(75,30,25,0.07)] text-left">
				<div className="flex flex-col items-center text-center">
					<img
						src="/logo.png"
						alt="HomeeKost Logo"
						className="w-36 max-h-16 object-contain mx-auto mb-6 opacity-90"
					/>

					<div className="inline-flex items-center gap-1.5 bg-[#fef3f2] border border-[#fecdca] text-[#b42318] text-[11px] font-bold px-3 py-1 rounded-full mb-3.5">
						<AlertTriangle className="w-3.5 h-3.5 text-[#b42318]" />
						<span>500 · Terjadi Gangguan Sistem</span>
					</div>

					<h1 className="text-[22px] font-bold text-[#26372c] m-0 mb-2">
						Terjadi Kesalahan Server
					</h1>

					<p className="text-[#687a6e] text-[13px] m-0 mb-6 leading-relaxed max-w-[420px]">
						Sistem mendeteksi kendala saat memproses permintaan atau memuat data. Silakan coba muat ulang atau kembali ke halaman utama.
					</p>

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-2.5 justify-center w-full mb-6">
						{reset && (
							<button
								type="button"
								onClick={() => reset()}
								className="inline-flex items-center justify-center gap-1.5 h-[40px] px-4 rounded-[12px] bg-[#6f8976] hover:bg-[#4f6958] text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-sm"
							>
								<RotateCcw className="w-3.5 h-3.5" />
								Coba Lagi
							</button>
						)}

						<button
							type="button"
							onClick={handleReload}
							className="inline-flex items-center justify-center gap-1.5 h-[40px] px-4 rounded-[12px] bg-white border border-[#dfe7e0] hover:bg-[#f6faf6] text-[#34463a] text-[12px] font-semibold transition-colors cursor-pointer"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Muat Ulang Halaman
						</button>

						<Link
							to="/dashboard"
							className="inline-flex items-center justify-center gap-1.5 h-[40px] px-4 rounded-[12px] bg-[#f2f6f3] border border-[#d6e3d9] hover:bg-[#e4ede7] text-[#293d30] text-[12px] font-semibold transition-colors no-underline"
						>
							<Home className="w-3.5 h-3.5" />
							Dashboard
						</Link>
					</div>
				</div>

				{/* Technical Details Toggle (Dev / Troubleshooting) */}
				<div className="border-t border-[#f0f3f0] pt-4">
					<button
						type="button"
						onClick={() => setShowDetails(!showDetails)}
						className="w-full flex items-center justify-between text-[11px] font-medium text-[#7d8b81] hover:text-[#252925] p-1.5 rounded-lg transition-colors cursor-pointer"
					>
						<span>Informasi Teknis (Untuk Developer / Administrator)</span>
						{showDetails ? (
							<ChevronUp className="w-3.5 h-3.5" />
						) : (
							<ChevronDown className="w-3.5 h-3.5" />
						)}
					</button>

					{showDetails && (
						<div className="mt-3 p-3.5 bg-[#1e2420] text-[#e8f0ea] rounded-xl text-left font-mono text-[11px] space-y-2.5 overflow-x-auto shadow-inner">
							<div>
								<span className="text-[#a3b8aa] block font-semibold text-[10px] uppercase tracking-wider mb-0.5">
									Pesan Kesalahan:
								</span>
								<p className="text-[#fecaca] break-words whitespace-pre-wrap m-0 font-medium">
									{errorMessage}
								</p>
							</div>

							{errorStack && (
								<div>
									<span className="text-[#a3b8aa] block font-semibold text-[10px] uppercase tracking-wider mb-0.5">
										Stack Trace:
									</span>
									<pre className="text-[10px] leading-relaxed text-[#cad8cf] whitespace-pre-wrap max-h-48 overflow-y-auto">
										{errorStack}
									</pre>
								</div>
							)}

							{componentStack && (
								<div>
									<span className="text-[#a3b8aa] block font-semibold text-[10px] uppercase tracking-wider mb-0.5">
										Component Stack:
									</span>
									<pre className="text-[10px] leading-relaxed text-[#cad8cf] whitespace-pre-wrap max-h-36 overflow-y-auto">
										{componentStack}
									</pre>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
