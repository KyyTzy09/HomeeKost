import { AlertTriangle, ChevronsRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import { Label } from "../../common/shadcn/label.tsx";

interface ResetDataDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
	isSubmitting: boolean;
}

export function ResetDataDialog({
	open,
	onOpenChange,
	onConfirm,
	isSubmitting,
}: ResetDataDialogProps) {
	const [sliderPos, setSliderPos] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [hasConfirmed, setHasConfirmed] = useState(false);
	const trackRef = useRef<HTMLDivElement>(null);
	const dragStartXRef = useRef(0);
	const currentPosRef = useRef(0);

	useEffect(() => {
		if (open) {
			setSliderPos(0);
			setIsDragging(false);
			setHasConfirmed(false);
			currentPosRef.current = 0;
		}
	}, [open]);

	const triggerReset = async () => {
		setHasConfirmed(true);
		await onConfirm();
	};

	const startDrag = (clientX: number) => {
		if (isSubmitting || hasConfirmed) return;
		setIsDragging(true);
		dragStartXRef.current = clientX - currentPosRef.current;
	};

	const onDrag = (clientX: number) => {
		if (!isDragging || !trackRef.current || isSubmitting || hasConfirmed) return;
		const trackWidth = trackRef.current.clientWidth;
		const handleWidth = 42;
		const maxDrag = Math.max(0, trackWidth - handleWidth - 8);
		const newPos = Math.min(maxDrag, Math.max(0, clientX - dragStartXRef.current));
		currentPosRef.current = newPos;
		setSliderPos(newPos);
	};

	const stopDrag = () => {
		if (!isDragging || !trackRef.current) return;
		setIsDragging(false);
		const trackWidth = trackRef.current.clientWidth;
		const handleWidth = 42;
		const maxDrag = Math.max(0, trackWidth - handleWidth - 8);

		if (currentPosRef.current >= maxDrag * 0.85) {
			setSliderPos(maxDrag);
			currentPosRef.current = maxDrag;
			triggerReset();
		} else {
			setSliderPos(0);
			currentPosRef.current = 0;
		}
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => onDrag(e.clientX);
		const handleMouseUp = () => stopDrag();
		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches[0]) onDrag(e.touches[0].clientX);
		};
		const handleTouchEnd = () => stopDrag();

		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
			window.addEventListener("touchmove", handleTouchMove);
			window.addEventListener("touchend", handleTouchEnd);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
		};
	}, [isDragging]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[460px] p-6 bg-white rounded-[20px] border-[#efd4d0] shadow-[0_20px_50px_rgba(182,107,104,0.15)]">
				<DialogHeader className="text-left space-y-2">
					<div className="w-11 h-11 rounded-xl bg-[#fdf3f2] border border-[#f5cfcc] text-[#b66b68] flex items-center justify-center mb-1 shadow-xs">
						<AlertTriangle className="w-5 h-5" />
					</div>
					<DialogTitle className="text-[18px] font-bold text-[#252925] tracking-tight">
						Reset Data
					</DialogTitle>
					<DialogDescription className="text-[12.5px] text-[#737873] leading-relaxed">
						Tindakan ini akan mengosongkan seluruh riwayat transaksi kas,
						invoice, tagihan sewa, dan data penghuni kos.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 my-2">
					<div className="bg-[#fff7f6] border border-[#f5cfcc] rounded-[12px] p-3 text-[11.5px] text-[#a45149] space-y-1.5 leading-relaxed">
						<p className="font-semibold flex items-center gap-1.5">
							<span>⚠️</span> Perhatian Tindakan Permanen:
						</p>
						<ul className="list-disc list-inside space-y-0.5 text-[#8c3c35] pl-1">
							<li>Seluruh catatan pemasukan & pengeluaran kas dihapus.</li>
							<li>Seluruh data penyewa dan invoice tagihan dihapus.</li>
							<li>
								Status semua kamar dikembalikan ke <b>Kosong (VACANT)</b>.
							</li>
							<li>
								<b>Akun SuperAdmin</b> dan <b>cabang properti kos</b> tetap
								aman.
							</li>
						</ul>
					</div>

					{/* Slide to Confirm Interactive Slider */}
					<div className="space-y-2 pt-2">
						<Label className="text-[11.5px] font-bold text-[#506257]">
							Konfirmasi Geser (Slide to Confirm):
						</Label>
						<div
							ref={trackRef}
							className="relative w-full h-[48px] bg-[#fdf3f2] border border-[#f5cfcc] rounded-[13px] flex items-center p-1 select-none overflow-hidden shadow-inner"
						>
							{/* Track Text */}
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-[#b66b68] tracking-wide">
								{isSubmitting || hasConfirmed ? (
									<span className="flex items-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin" />
										Mereset Data...
									</span>
								) : (
									<span className="flex items-center gap-1.5 opacity-80 pl-8">
										Geser ke kanan untuk konfirmasi ➔
									</span>
								)}
							</div>

							{/* Draggable Slider Thumb */}
							<div
								style={{
									transform: `translateX(${sliderPos}px)`,
									transition: isDragging
										? "none"
										: "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
								}}
								onMouseDown={(e) => startDrag(e.clientX)}
								onTouchStart={(e) => {
									if (e.touches[0]) startDrag(e.touches[0].clientX);
								}}
								className={`w-[40px] h-[40px] rounded-[10px] bg-[#b66b68] text-white flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-colors ${
									isSubmitting || hasConfirmed
										? "pointer-events-none opacity-80"
										: "hover:bg-[#a25956]"
								}`}
							>
								{isSubmitting || hasConfirmed ? (
									<Loader2 className="w-4 h-4 animate-spin text-white" />
								) : (
									<ChevronsRight className="w-5 h-5 text-white" />
								)}
							</div>
						</div>
					</div>

					<DialogFooter className="pt-3 flex justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting || hasConfirmed}
							className="h-[38px] px-5 rounded-[9px] border-[#e4e9e4] text-[#737873] hover:bg-[#f3f7f3] text-xs font-semibold cursor-pointer"
						>
							Batal
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
