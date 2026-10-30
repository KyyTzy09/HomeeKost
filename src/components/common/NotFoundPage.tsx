import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Compass, Home } from "lucide-react";

export interface NotFoundPageProps {
	path?: string;
}

export function NotFoundPage({ path }: NotFoundPageProps = {}) {
	const router = useRouter();

	const handleGoBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.history.back();
		} else {
			router.navigate({ to: "/dashboard" });
		}
	};

	return (
		<div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6 text-center">
			<div className="w-full max-w-[480px] bg-white border border-[#e2e9e3] rounded-[24px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(47,69,55,0.08)]">
				<img
					src="/logo.png"
					alt="HomeeKost Logo"
					className="w-36 max-h-16 object-contain mx-auto mb-6 opacity-90"
				/>

				<div className="inline-flex items-center gap-1.5 bg-[#f3f7f3] border border-[#dce7de] text-[#4f6958] text-[11px] font-bold px-3 py-1 rounded-full mb-3.5">
					<Compass className="w-3.5 h-3.5 text-[#4f6958]" />
					<span>404 · Halaman Tidak Ditemukan</span>
				</div>

				<h1 className="text-[22px] font-bold text-[#26372c] m-0 mb-2">
					Halaman Belum Tersedia
				</h1>

				<p className="text-[#687a6e] text-[13px] m-0 mb-4 leading-relaxed">
					Halaman yang Anda tuju sedang dalam tahap integrasi operasional atau URL yang Anda masukkan tidak sesuai.
				</p>

				{path && (
					<div className="mb-6 p-2.5 bg-[#f6f9f6] border border-[#e4ebe5] rounded-xl text-left">
						<span className="text-[11px] text-[#788a7e] block mb-0.5">URL yang dicoba diakses:</span>
						<code className="text-[12px] font-mono text-[#2f4335] break-all">
							{path}
						</code>
					</div>
				)}

				<div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-2">
					<button
						type="button"
						onClick={handleGoBack}
						className="inline-flex items-center justify-center gap-1.5 h-[40px] px-4 rounded-[12px] bg-white border border-[#dfe7e0] hover:bg-[#f6faf6] text-[#34463a] text-[12px] font-semibold transition-colors cursor-pointer"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						Kembali
					</button>

					<Link
						to="/dashboard"
						className="inline-flex items-center justify-center gap-1.5 h-[40px] px-5 rounded-[12px] bg-[#6f8976] hover:bg-[#4f6958] text-white text-[12px] font-semibold transition-colors no-underline shadow-sm"
					>
						<Home className="w-3.5 h-3.5" />
						Ke Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}
