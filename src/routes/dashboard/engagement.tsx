import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageSquare, Plus, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "../../common/shadcn/button.tsx";
import { Card } from "../../common/shadcn/card.tsx";
import type {
	AnnouncementItem,
	EngagementTemplateItem,
	UpcomingBirthdayItem,
} from "../../common/types/index.ts";
import type {
	EngagementEventFormValues,
	EngagementTemplateFormValues,
} from "../../common/validations/index.ts";
import {
	EngagementAnnouncementSection,
	EngagementBirthdayPanel,
	EngagementEventDialog,
	EngagementTemplateDetailDialog,
	EngagementTemplateDialog,
	EngagementTemplatePanel,
} from "../../components/engagement/index.ts";

export const Route = createFileRoute("/dashboard/engagement")({
	head: () => ({
		meta: [
			{
				title:
					"WhatsApp Engagement & Pengumuman Penghuni — HomeeKost Management",
			},
		],
	}),
	component: EngagementPage,
});

// ─── Initial Mock Data ────────────────────────────────────────────────────────
const INITIAL_BIRTHDAYS: UpcomingBirthdayItem[] = [
	{
		id: 1,
		name: "Sarah Anindita",
		room: "C-01",
		property: "Kos A",
		birthDate: "10 Agustus",
		daysRemaining: 1,
		relativeLabel: "Besok",
		phone: "081234567890",
	},
	{
		id: 2,
		name: "Dinda Maharani",
		room: "B-01",
		property: "Kos B",
		birthDate: "20 Agustus",
		daysRemaining: 11,
		relativeLabel: "20 Agustus",
		phone: "081987654321",
	},
	{
		id: 3,
		name: "Nabila Putri",
		room: "B-02",
		property: "Kos B",
		birthDate: "27 Agustus",
		daysRemaining: 18,
		relativeLabel: "27 Agustus",
		phone: "081345678901",
	},
];

const INITIAL_TEMPLATES: EngagementTemplateItem[] = [
	{
		id: 1,
		name: "Welcome Tenant",
		content:
			"Halo! Selamat datang di HomeeKost. Semoga nyaman tinggal bersama kami. Jika butuh bantuan fasilitas kamar atau info lainnya, silakan hubungi pengelola ya! 😊",
		category: "Sambutan",
		icon: "👋",
	},
	{
		id: 2,
		name: "Payment Appreciation",
		content:
			"Terima kasih banyak sudah melakukan pembayaran sewa kos tepat waktu. Pembayaran telah kami verifikasi lunas. Semoga harimu menyenangkan! ✨",
		category: "Pembayaran",
		icon: "💳",
	},
	{
		id: 3,
		name: "Birthday Greeting",
		content:
			"Selamat ulang tahun! 🎉 Semoga hari ini menyenangkan, sehat selalu, dan semua cita-citanya tercapai. Terima kasih sudah menjadi bagian dari keluarga besar HomeeKost! 🎂",
		category: "Ulang Tahun",
		icon: "🎂",
	},
	{
		id: 4,
		name: "Tenant Anniversary",
		content:
			"Wah, tidak terasa sudah 1 tahun kamu tinggal di HomeeKost! 🏠 Terima kasih atas kepercayaanmu. Kami terus berusaha memberikan hunian terbaik untukmu.",
		category: "Anniversary",
		icon: "🏠",
	},
];

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
	{
		id: 1,
		propertyId: "Kos A",
		propertyName: "Kos A",
		title: "Kerja Bakti & Fogging Nyamuk",
		content:
			"Diberitahukan kepada seluruh penghuni Kos A, pada hari Minggu pagi pukul 08.00 WIB akan dilaksanakan kerja bakti lingkungan & pengasapan fogging.",
		category: "KERJA_BAKTI",
		isBroadcast: true,
		sentAt: "08 Agu 2026",
	},
	{
		id: 2,
		propertyId: "Semua Kost",
		propertyName: "Semua Kost",
		title: "Pembersihan Toren & Pengecekan Filter Air",
		content:
			"Akan dilakukan pembersihan tandon air rutin pada hari Selasa pukul 10.00-12.00 WIB. Mohon tampung air secukupnya.",
		category: "MAINTENANCE",
		isBroadcast: true,
		sentAt: "05 Agu 2026",
	},
	{
		id: 3,
		propertyId: "Kos B",
		propertyName: "Kos B",
		title: "Iuran Kebersihan & Jadwal Angkut Sampah",
		content:
			"Sampah di depan kamar akan diangkut setiap pagi pukul 07.30 WIB. Pastikan kantong sampah tertutup rapat.",
		category: "UMUM",
		isBroadcast: false,
		sentAt: null,
	},
];

function EngagementPage() {
	const [birthdays] = useState<UpcomingBirthdayItem[]>(INITIAL_BIRTHDAYS);
	const [templates, setTemplates] =
		useState<EngagementTemplateItem[]>(INITIAL_TEMPLATES);
	const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
		INITIAL_ANNOUNCEMENTS,
	);

	const [selectedTemplate, setSelectedTemplate] =
		useState<EngagementTemplateItem | null>(INITIAL_TEMPLATES[2] ?? null);

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
		}, 3000);
	};

	// Birthday Action Handlers
	const handleSendWish = (item: UpcomingBirthdayItem) => {
		showToast(
			`Ucapan ulang tahun WhatsApp siap dikirimkan ke ${item.name} (${item.phone})`,
		);
	};

	const handleSetReminder = (item: UpcomingBirthdayItem) => {
		showToast(`Pengingat ulang tahun untuk ${item.name} berhasil diaktifkan`);
	};

	// Template Action Handlers
	const handleSaveTemplate = (values: EngagementTemplateFormValues) => {
		if (editingTemplate) {
			setTemplates((prev) =>
				prev.map((t) =>
					t.id === editingTemplate.id
						? { ...t, name: values.name, content: values.content }
						: t,
				),
			);
			showToast(`Template "${values.name}" berhasil diperbarui`);
		} else {
			const newTpl: EngagementTemplateItem = {
				id: Date.now(),
				name: values.name,
				content: values.content,
				category: "Kustom",
				icon: "💬",
			};
			setTemplates((prev) => [...prev, newTpl]);
			showToast(`Template "${values.name}" berhasil dibuat`);
		}
		setEditingTemplate(null);
	};

	const handleDeleteTemplate = (tpl: EngagementTemplateItem) => {
		setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
		if (selectedTemplate?.id === tpl.id) {
			setSelectedTemplate(templates[0] ?? null);
		}
		showToast(`Template "${tpl.name}" berhasil dihapus`);
	};

	// Announcement Action Handlers
	const handleSaveEvent = (values: EngagementEventFormValues) => {
		const newAnn: AnnouncementItem = {
			id: Date.now(),
			propertyId: values.property,
			propertyName: values.property,
			title: values.title,
			content: values.content,
			category: values.category,
			isBroadcast: values.isBroadcast,
			sentAt: values.isBroadcast ? "Hari ini" : null,
		};
		setAnnouncements((prev) => [newAnn, ...prev]);

		if (values.isBroadcast) {
			showToast(
				`Pengumuman "${values.title}" berhasil disimpan dan dibroadcast ke WhatsApp penghuni ${values.property}`,
			);
		} else {
			showToast(`Pengumuman "${values.title}" berhasil disimpan`);
		}
	};

	const handleBroadcastAnnouncement = (ann: AnnouncementItem) => {
		showToast(
			`Broadcast pengumuman "${ann.title}" berhasil dikirimkan ke WhatsApp seluruh penghuni ${ann.propertyName} via Fonnte Gateway`,
		);
	};

	return (
		<div className="space-y-6">
			{/* Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-[#253129] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
					<CheckCircle2 className="w-4 h-4 text-[#5f896d]" />
					<span>{toastMessage}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-[#252925] tracking-tight">
						Engagement
					</h1>
					<p className="text-xs text-[#737873] mt-1">
						Bangun hubungan baik dengan penghuni tanpa terasa seperti CRM yang
						rumit.
					</p>
				</div>
				<div className="flex items-center gap-2.5">
					<Button
						type="button"
						variant="outline"
						className="border-[#e4e9e4] text-[#252925] hover:bg-[#f3f7f3] text-xs font-semibold px-4 h-9 shadow-sm"
						onClick={() => setIsEventDialogOpen(true)}
					>
						<Plus className="w-3.5 h-3.5 mr-1.5" />
						Tambah Acara
					</Button>
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

			{/* Top Grid (2 Columns: Upcoming Birthdays & Message Templates) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<EngagementBirthdayPanel
					birthdays={birthdays}
					onSendWish={handleSendWish}
					onSetReminder={handleSetReminder}
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

			{/* Active Template Preview / Contoh Ucapan Box */}
			{selectedTemplate && (
				<Card className="p-5 bg-white border-[#e4e9e4] shadow-[0_2px_12px_rgba(48,65,53,0.055)]">
					<div className="flex items-center justify-between pb-3 border-b border-[#e4e9e4]">
						<div>
							<h2 className="text-sm font-bold text-[#252925] flex items-center gap-2">
								<MessageSquare className="w-4 h-4 text-[#4f6958]" />
								Pratinjau Pesan: {selectedTemplate.name}
							</h2>
							<p className="text-[11px] text-[#737873]">
								Template yang siap disesuaikan dan dikirim ke nomor WhatsApp
								penghuni
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
							<Button
								type="button"
								size="sm"
								className="h-8 text-xs bg-[#4f6958] hover:bg-[#425949] text-white font-semibold flex items-center gap-1.5 shadow-sm"
								onClick={() =>
									showToast(
										`Template "${selectedTemplate.name}" disalin ke draf pesan WhatsApp`,
									)
								}
							>
								<Send className="w-3 h-3" />
								Gunakan Template
							</Button>
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
			/>

			{/* Dialog Modals */}
			<EngagementEventDialog
				open={isEventDialogOpen}
				onOpenChange={setIsEventDialogOpen}
				onSubmit={handleSaveEvent}
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
