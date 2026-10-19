import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageSquare, Play, Plus, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type {
	AnnouncementItem,
	EngagementRecipient,
	EngagementTemplateItem,
} from "../../common/types/index.ts";
import type {
	BroadcastAnnouncementInput,
	EngagementTemplateFormValues,
} from "../../common/validations/index.ts";
import {
	EngagementAnnouncementSection,
	EngagementDynamicRecipientPanel,
	EngagementEventDialog,
	EngagementNotificationLogSection,
	EngagementTemplateDetailDialog,
	EngagementTemplateDialog,
	EngagementTemplatePanel,
} from "../../components/engagement/index.ts";
import {
	engagementDashboardQueryOptions,
	propertiesQueryOptions,
	useBroadcastAnnouncement,
	useBroadcastToSelectedRecipients,
	useDashboardContext,
	useDeleteAnnouncement,
	useEngagementDashboard,
	useProperties,
	useRunDailyCronTasks,
	useSendSingleTemplateMessage,
} from "../../hooks/index.ts";

export const Route = createFileRoute("/dashboard/engagement")({
	head: () => ({
		meta: [
			{
				title:
					"WhatsApp Engagement & Pengumuman Penghuni — HomeeKost Management",
			},
		],
	}),
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(engagementDashboardQueryOptions()),
			context.queryClient.ensureQueryData(propertiesQueryOptions()),
		]);
	},
	component: EngagementPage,
});

// ─── Default Templates ───────────────────────────────────────────────────────
const DEFAULT_TEMPLATES: EngagementTemplateItem[] = [
	{
		id: "tpl-1",
		name: "Sambutan Anak Kos Baru",
		content:
			"Halo Kak! Selamat datang di HomeeKost. Semoga betah dan nyaman tinggal bersama kami. Jika butuh bantuan fasilitas kamar atau info lainnya, silakan hubungi pengelola ya! 😊🌿",
		category: "Sambutan",
		icon: "👋",
	},
	{
		id: "tpl-2",
		name: "Apresiasi Pembayaran Tepat Waktu",
		content:
			"Terima kasih banyak sudah melakukan pembayaran sewa kos tepat waktu. Pembayaran telah kami verifikasi lunas. Semoga harimu menyenangkan dan berkah! ✨🙏",
		category: "Pembayaran",
		icon: "💳",
	},
	{
		id: "tpl-3",
		name: "Ucapan Selamat Ulang Tahun",
		content:
			"Selamat ulang tahun! 🎉🎂 Semoga senantiasa sehat, bahagia, dan sukses selalu dalam studi maupun pekerjaan. Terima kasih telah menjadi bagian berharga dari keluarga besar kami!",
		category: "Ulang Tahun",
		icon: "🎂",
	},
	{
		id: "tpl-4",
		name: "Pemberitahuan Kerja Bakti",
		content:
			"Diberitahukan kepada seluruh penghuni, pada hari Minggu pagi pukul 08.00 WIB akan diadakan kerja bakti & pembersihan area bersama. Mohon partisipasi dan kerja samanya. Terima kasih! 🧹",
		category: "Kerja Bakti",
		icon: "🧹",
	},
];

const TEMPLATE_STORAGE_KEY = "homeekost_engagement_templates";

const CATEGORY_ICONS: Record<string, string> = {
	Sambutan: "👋",
	Pembayaran: "💳",
	"Ulang Tahun": "🎂",
	"Kerja Bakti": "🧹",
	Umum: "💬",
};

const getCategoryIcon = (category?: string): string => {
	if (!category) return "💬";
	return CATEGORY_ICONS[category] || "💬";
};

const loadStoredTemplates = (): EngagementTemplateItem[] => {
	if (typeof window === "undefined") return DEFAULT_TEMPLATES;
	try {
		const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
		if (!stored) return DEFAULT_TEMPLATES;
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) && parsed.length > 0
			? parsed
			: DEFAULT_TEMPLATES;
	} catch {
		return DEFAULT_TEMPLATES;
	}
};

function EngagementPage() {
	const dashboardContext = useDashboardContext();
	const currentUser = dashboardContext.user;
	const userRole = dashboardContext.userRole || "ADMIN";
	const isSuperAdmin = dashboardContext.isSuperAdmin;
	const userPropertyId = currentUser?.assignedPropertyId;

	// Queries
	const { data: properties = [] } = useProperties();
	const { data: engagementData } = useEngagementDashboard();

	// Mutations
	const broadcastAnnouncementMutation = useBroadcastAnnouncement();
	const deleteAnnouncementMutation = useDeleteAnnouncement();
	const runCronMutation = useRunDailyCronTasks();
	const sendSingleTemplateMutation = useSendSingleTemplateMessage();
	const broadcastSelectedMutation = useBroadcastToSelectedRecipients();

	// State
	const [templates, setTemplates] =
		useState<EngagementTemplateItem[]>(DEFAULT_TEMPLATES);
	const [selectedTemplate, setSelectedTemplate] =
		useState<EngagementTemplateItem | null>(DEFAULT_TEMPLATES[2] ?? null);

	useEffect(() => {
		const loaded = loadStoredTemplates();
		setTemplates(loaded);
		setSelectedTemplate((current) => {
			if (!current) return loaded[0] ?? null;
			const found = loaded.find((t) => t.id === current.id);
			return found ?? loaded[0] ?? null;
		});
	}, []);

	// Dialog & Toast states
	const [isEventDialogOpen, setIsEventDialogOpen] = useState<boolean>(false);
	const [isTemplateDialogOpen, setIsTemplateDialogOpen] =
		useState<boolean>(false);
	const [editingTemplate, setEditingTemplate] =
		useState<EngagementTemplateItem | null>(null);

	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
	const [detailTemplate, setDetailTemplate] =
		useState<EngagementTemplateItem | null>(null);

	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => {
			setToastMessage(null);
		}, 4000);
	};

	// Map backend announcements to UI format
	const announcements: AnnouncementItem[] = useMemo(() => {
		if (!engagementData?.recentAnnouncements) return [];
		return engagementData.recentAnnouncements.map((a) => ({
			id: a.id,
			propertyId: a.propertyId,
			propertyName: a.property?.name || "Semua Cabang Kos",
			title: a.title,
			content: a.content,
			category: a.category,
			isBroadcast: a.isBroadcast,
			sentAt: a.sentAt ? new Date(a.sentAt).toLocaleDateString("id-ID") : null,
		}));
	}, [engagementData]);

	// Single Template Send Handler
	const handleSendSingleTemplate = async (recipient: EngagementRecipient) => {
		if (!selectedTemplate) {
			showToast("Silakan pilih template pesan terlebih dahulu.");
			return;
		}

		try {
			const res = await sendSingleTemplateMutation.mutateAsync({
				tenantId: recipient.tenantId,
				templateContent: selectedTemplate.content,
			});

			if (res.success) {
				showToast(
					`Pesan "${selectedTemplate.name}" berhasil dikirim ke WhatsApp ${recipient.name} (${recipient.phone})!`,
				);
			} else {
				showToast(
					`Fonnte: ${res.detail || "Gagal mengirim via WhatsApp API."}`,
				);
			}
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal mengirimkan pesan template.");
		}
	};

	// Multi-Select Batch Broadcast Handler
	const handleBroadcastSelectedRecipients = async (
		selectedRecipients: EngagementRecipient[],
	) => {
		if (!selectedTemplate) {
			showToast("Silakan pilih template pesan terlebih dahulu.");
			return;
		}
		if (selectedRecipients.length === 0) {
			showToast("Pilih minimal satu penghuni untuk broadcast.");
			return;
		}

		try {
			const res = await broadcastSelectedMutation.mutateAsync({
				tenantIds: selectedRecipients.map((r) => r.tenantId),
				templateContent: selectedTemplate.content,
				title: selectedTemplate.name,
			});

			showToast(
				`Broadcast selesai: ${res.sentCount} pesan berhasil dikirim${res.failedCount > 0 ? `, ${res.failedCount} gagal` : ""}.`,
			);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(
				error.message || "Gagal melakukan broadcast ke penghuni terpilih.",
			);
		}
	};

	// Template Action Handlers
	const handleSaveTemplate = (values: EngagementTemplateFormValues) => {
		const icon = getCategoryIcon(values.category);
		let nextTemplates: EngagementTemplateItem[];

		if (editingTemplate) {
			nextTemplates = templates.map((t) =>
				t.id === editingTemplate.id
					? {
							...t,
							name: values.name,
							category: values.category,
							content: values.content,
							icon,
						}
					: t,
			);
			showToast(`Template "${values.name}" berhasil diperbarui`);
		} else {
			const newTpl: EngagementTemplateItem = {
				id: `tpl-${Date.now()}`,
				name: values.name,
				content: values.content,
				category: values.category || "Umum",
				icon,
			};
			nextTemplates = [...templates, newTpl];
			showToast(`Template "${values.name}" berhasil dibuat`);
		}

		setTemplates(nextTemplates);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(
					TEMPLATE_STORAGE_KEY,
					JSON.stringify(nextTemplates),
				);
			} catch {
				// Ignore write errors
			}
		}

		if (
			selectedTemplate &&
			editingTemplate &&
			selectedTemplate.id === editingTemplate.id
		) {
			setSelectedTemplate({
				...selectedTemplate,
				name: values.name,
				category: values.category,
				content: values.content,
				icon,
			});
		}

		setEditingTemplate(null);
	};

	const handleDeleteTemplate = (tpl: EngagementTemplateItem) => {
		const nextTemplates = templates.filter((t) => t.id !== tpl.id);
		setTemplates(nextTemplates);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(
					TEMPLATE_STORAGE_KEY,
					JSON.stringify(nextTemplates),
				);
			} catch {
				// Ignore write errors
			}
		}
		if (selectedTemplate?.id === tpl.id) {
			setSelectedTemplate(nextTemplates[0] ?? null);
		}
		showToast(`Template "${tpl.name}" berhasil dihapus`);
	};

	// Announcement Action Handlers
	const handleSaveEvent = async (values: BroadcastAnnouncementInput) => {
		try {
			const res = await broadcastAnnouncementMutation.mutateAsync(values);
			if (values.isBroadcast) {
				showToast(
					`Pengumuman "${values.title}" berhasil disimpan dan dibroadcast ke ${res.sentCount} nomor WhatsApp penghuni!`,
				);
			} else {
				showToast(`Pengumuman "${values.title}" berhasil disimpan.`);
			}
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menyimpan pengumuman.");
		}
	};

	const handleBroadcastAnnouncement = async (ann: AnnouncementItem) => {
		try {
			const res = await broadcastAnnouncementMutation.mutateAsync({
				title: ann.title,
				content: ann.content,
				category: ann.category,
				propertyId: ann.propertyId,
				isBroadcast: true,
			});
			showToast(
				`Broadcast pengumuman "${ann.title}" berhasil dikirim ke ${res.sentCount} nomor WhatsApp via Fonnte Gateway!`,
			);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal mengirimkan broadcast.");
		}
	};

	const handleDeleteAnnouncement = async (ann: AnnouncementItem) => {
		try {
			await deleteAnnouncementMutation.mutateAsync(String(ann.id));
			showToast(`Pengumuman "${ann.title}" berhasil dihapus.`);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menghapus pengumuman.");
		}
	};

	// Manual Trigger Cron Task
	const handleTriggerCron = async () => {
		try {
			const res = await runCronMutation.mutateAsync();
			const totalSkipped =
				(res.dueRemindersSkipped || 0) + (res.birthdaysSkipped || 0);
			const skippedNote =
				totalSkipped > 0
					? ` (${totalSkipped} dilewati karena sudah terkirim hari ini)`
					: "";
			showToast(
				`Cron Selesai: ${res.dueRemindersSent} pengingat & ${res.birthdayWishesSent} ucapan ultah dikirim${skippedNote}`,
			);
		} catch (err: unknown) {
			const error = err as Error;
			showToast(error.message || "Gagal menjalankan cron harian.");
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<CheckCircle2 className="w-4 h-4 text-[#5f896d] shrink-0" />
					<span>{toastMessage}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
							Engagement Hub & Pengumuman
						</h1>
					</div>
					<p className="text-xs text-[#737873] mt-1">
						Otomasi pesan WhatsApp ramah, ucapan ulang tahun anak kos, dan
						broadcast agenda kos terpusat.
					</p>
				</div>
				<div className="flex items-center gap-2.5 flex-wrap">
					{/* Tombol Run Cron Manual (Berguna untuk Testing & Operasional) */}
					<Button
						type="button"
						variant="outline"
						className="border-[#e4e9e4] text-[#4f6958] hover:bg-[#f3f7f3] text-xs font-semibold px-3 h-9 shadow-sm"
						onClick={handleTriggerCron}
						disabled={runCronMutation.isPending}
					>
						<Play className="w-3.5 h-3.5 mr-1 text-[#4f6958]" />
						{runCronMutation.isPending
							? "Menjalankan..."
							: "Jalankan Cron Pagi"}
					</Button>

					{isSuperAdmin && (
						<Button
							type="button"
							variant="outline"
							className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 shadow-sm"
							onClick={() => setIsEventDialogOpen(true)}
						>
							<Plus className="w-3.5 h-3.5 mr-1.5" />
							Buat Broadcast
						</Button>
					)}
					<Button
						type="button"
						className="bg-[#4f6958] hover:bg-[#425949] text-white text-xs font-semibold px-4 h-9 shadow-sm"
						onClick={() => {
							setEditingTemplate(null);
							setIsTemplateDialogOpen(true);
						}}
					>
						<Plus className="w-4 h-4 mr-1.5" />
						Buat Template
					</Button>
				</div>
			</div>

			{/* Top Grid (2 Columns: Dynamic Recipients & Message Templates) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<EngagementDynamicRecipientPanel
					recipients={engagementData?.recipients || []}
					selectedTemplate={selectedTemplate}
					selectedPropertyId={
						userRole === "ADMIN" && userPropertyId ? userPropertyId : undefined
					}
					onSendSingle={handleSendSingleTemplate}
					onBroadcastSelected={handleBroadcastSelectedRecipients}
					isSending={
						sendSingleTemplateMutation.isPending ||
						broadcastSelectedMutation.isPending
					}
				/>

				<EngagementTemplatePanel
					templates={templates}
					selectedTemplate={selectedTemplate}
					onSelectTemplate={(tpl) => {
						setSelectedTemplate(tpl);
						setDetailTemplate(tpl);
					}}
					onOpenAddTemplate={() => {
						setEditingTemplate(null);
						setIsTemplateDialogOpen(true);
					}}
				/>
			</div>

			{/* Active Template Preview / Box */}
			{selectedTemplate && (
				<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
						<div>
							<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
								<MessageSquare className="w-4 h-4 text-[#4f6958]" />
								Pratinjau Format Pesan: {selectedTemplate.name}
							</h2>
							<p className="text-[11px] text-[#737873]">
								Template pesan terstruktur yang siap disesuaikan dan dikirim ke
								penghuni kos
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 text-xs border-[#e4e9e4] hover:bg-[#f3f7f3] text-[#252925]"
								onClick={() => {
									setDetailTemplate(selectedTemplate);
									setIsDetailDialogOpen(true);
								}}
							>
								Lihat / Edit Detail
							</Button>
							{isSuperAdmin && (
								<Button
									type="button"
									size="sm"
									className="h-8 text-xs bg-[#4f6958] hover:bg-[#425949] text-white font-semibold flex items-center gap-1.5 shadow-sm"
									onClick={() => {
										setIsEventDialogOpen(true);
									}}
								>
									<Send className="w-3 h-3" />
									Gunakan untuk Broadcast
								</Button>
							)}
						</div>
					</div>

					<div className="mt-4 p-4 bg-[#f8faf8] border-l-4 border-[#5d7865] border-y border-r border-[#e5ece5] rounded-r-xl">
						<h3 className="text-xs font-bold text-[#252925] mb-1">
							{selectedTemplate.name}
						</h3>
						<p className="text-xs text-[#4c524d] leading-relaxed italic whitespace-pre-wrap">
							“{selectedTemplate.content}”
						</p>
					</div>
				</Card>
			)}

			{/* Agenda & Pengumuman Kos Section */}
			<EngagementAnnouncementSection
				announcements={announcements}
				onOpenAddEvent={() => setIsEventDialogOpen(true)}
				onBroadcast={handleBroadcastAnnouncement}
				onDelete={handleDeleteAnnouncement}
			/>

			{/* Riwayat Log Notifikasi WhatsApp */}
			<EngagementNotificationLogSection
				logs={engagementData?.recentLogs || []}
			/>

			{/* Dialog Modals */}
			<EngagementEventDialog
				open={isEventDialogOpen}
				onOpenChange={setIsEventDialogOpen}
				onSubmit={handleSaveEvent}
				properties={properties}
				userRole={userRole}
				userPropertyId={userPropertyId}
				isLoading={broadcastAnnouncementMutation.isPending}
			/>

			<EngagementTemplateDialog
				open={isTemplateDialogOpen}
				onOpenChange={setIsTemplateDialogOpen}
				editingTemplate={editingTemplate}
				onSubmit={handleSaveTemplate}
			/>

			<EngagementTemplateDetailDialog
				open={isDetailDialogOpen}
				onOpenChange={setIsDetailDialogOpen}
				template={detailTemplate}
				onEdit={(tpl) => {
					setEditingTemplate(tpl);
					setIsTemplateDialogOpen(true);
				}}
				onDelete={handleDeleteTemplate}
			/>
		</div>
	);
}
