import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../common/shadcn/dialog.tsx";
import type { EngagementTemplateItem } from "../../common/types/index.ts";

interface EngagementTemplateDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	template: EngagementTemplateItem | null;
	onEdit: (template: EngagementTemplateItem) => void;
	onDelete: (template: EngagementTemplateItem) => void;
}

export function EngagementTemplateDetailDialog({
	open,
	onOpenChange,
	template,
	onEdit,
	onDelete,
}: EngagementTemplateDetailDialogProps) {
	if (!template) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[540px] p-6 bg-white rounded-2xl border-[#e4e9e4] shadow-[0_25px_80px_rgba(25,40,30,0.18)]"
				aria-describedby="template-detail-description"
			>
				<DialogHeader className="pb-4 border-b border-[#e4e9e4]">
					<DialogTitle className="text-lg font-bold text-[#252925] flex items-center gap-2">
						<FileText className="w-5 h-5 text-[#4f6958]" />
						{template.name}
					</DialogTitle>
					<DialogDescription
						id="template-detail-description"
						className="text-xs text-[#737873] mt-1"
					>
						Template Pesan WhatsApp Engagement
					</DialogDescription>
				</DialogHeader>

				<div className="py-4 space-y-3">
					<div className="p-4 bg-[#fbfcfb] border border-[#e4e9e4] rounded-xl">
						<span className="text-[11px] text-[#737873] block mb-1.5 font-semibold">
							Isi Pesan Template:
						</span>
						<p className="text-xs text-[#252925] whitespace-pre-wrap leading-relaxed">
							{template.content}
						</p>
					</div>
					<p className="text-[11px] text-[#737873]">
						Template ini dapat disisipkan variabel nama penghuni dan dikirimkan
						melalui WhatsApp Gateway Fonnte.
					</p>
				</div>

				<DialogFooter className="pt-3 border-t border-[#e4e9e4] flex items-center justify-between gap-2">
					<Button
						type="button"
						variant="outline"
						className="border-[#efd4d0] text-[#a45149] hover:bg-[#fff5f3] text-xs font-semibold px-4 h-9"
						onClick={() => {
							onOpenChange(false);
							onDelete(template);
						}}
					>
						<Trash2 className="w-3.5 h-3.5 mr-1.5" />
						Hapus Template
					</Button>

					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9"
						onClick={() => {
							onOpenChange(false);
							onEdit(template);
						}}
					>
						<Pencil className="w-3.5 h-3.5 mr-1.5" />
						Edit Template
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
