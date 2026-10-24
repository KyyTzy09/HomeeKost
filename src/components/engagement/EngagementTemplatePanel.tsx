import { FileText, Pencil, Plus } from "lucide-react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import {
	type EngagementTemplateItem,
	isCoreEngagementTemplate,
} from "../../common/types/index.ts";

interface EngagementTemplatePanelProps {
	templates: EngagementTemplateItem[];
	selectedTemplate: EngagementTemplateItem | null;
	onSelectTemplate: (template: EngagementTemplateItem) => void;
	onOpenAddTemplate: () => void;
}

export function EngagementTemplatePanel({
	templates,
	selectedTemplate,
	onSelectTemplate,
	onOpenAddTemplate,
}: EngagementTemplatePanelProps) {
	return (
		<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)] flex flex-col justify-between">
			<div>
				<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
					<div>
						<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
							<FileText className="w-4 h-4 text-[#4f6958]" />
							Template Pesan WhatsApp
						</h2>
						<p className="text-[11px] text-[#737873]">
							Pesan siap kirim untuk momen penting penghuni
						</p>
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] font-semibold"
						onClick={onOpenAddTemplate}
					>
						<Plus className="w-3 h-3 mr-1" />
						Buat Template
					</Button>
				</div>

				<div className="space-y-2.5 mt-3">
					{templates.map((tpl) => {
						const isSelected = selectedTemplate?.id === tpl.id;
						const isCore = isCoreEngagementTemplate(tpl);

						return (
							<button
								type="button"
								key={tpl.id}
								onClick={() => onSelectTemplate(tpl)}
								className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
									isSelected
										? "bg-[#f3f7f3] border-[#8fa594] shadow-sm"
										: "bg-[#fbfcfb] border-[#e4e9e4] hover:border-[#cbd7ce] hover:bg-[#f7faf7]"
								}`}
							>
								<div className="w-8 h-8 rounded-lg bg-white border border-[#e4e9e4] flex items-center justify-center text-sm shrink-0">
									{tpl.icon || "💬"}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 min-w-0">
											<strong className="text-xs font-bold text-[#252925] truncate">
												{tpl.name}
											</strong>
											{isCore && (
												<span className="text-[9px] font-semibold text-[#4f6958] bg-[#eef4ef] px-1.5 py-0.5 rounded border border-[#d8e4da] shrink-0">
													Utama
												</span>
											)}
										</div>
										<div className="flex items-center gap-1.5 shrink-0">
											{isSelected && (
												<span className="text-[10px] font-semibold text-[#4f6958] bg-[#e8f0ea] px-2 py-0.5 rounded">
													Aktif
												</span>
											)}
											{onOpenDetail && (
												<span
													role="button"
													tabIndex={0}
													onClick={(e) => {
														e.stopPropagation();
														onOpenDetail(tpl);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.stopPropagation();
															onOpenDetail(tpl);
														}
													}}
													className="p-1 rounded-md text-[#737873] hover:text-[#252925] hover:bg-[#e4ece5] transition-colors cursor-pointer"
													title="Lihat / Edit Template"
												>
													<Pencil className="w-3.5 h-3.5" />
												</span>
											)}
										</div>
									</div>
									<p className="text-[11px] text-[#737873] mt-0.5 line-clamp-2">
										{tpl.content}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			<div className="mt-4 pt-3 border-t border-[#e4e9e4] text-[11px] text-[#737873]">
				Klik kartu template di atas untuk melihat pratinjau pesan atau mengubah
				isi teks.
			</div>
		</Card>
	);
}
