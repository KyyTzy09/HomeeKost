import type { FinancialContextPayload } from "../types.ts";

/**
 * Feature Prompt & RAG Context Serializer untuk Analisis Finansial Bulanan
 */
export function buildFinancialFeaturePrompt(
	payload: FinancialContextPayload,
): string {
	const jsonPayload = JSON.stringify(payload, null, 2);

	const timeContext = payload.period.asOfDate
		? `WAKTU ANALISIS: ${payload.period.asOfDate} (Hari ke-${payload.period.dayOfMonth || 1} dari ${payload.period.totalDaysInMonth || 30} hari · Progres Bulan: ${payload.period.monthProgressPercentage || 0}%).`
		: "WAKTU ANALISIS: Akhir Periode.";

	const statusRule = payload.period.isClosedPeriod
		? "STATUS PERIODE: SUDAH TUTUP BUKU (Data Keuangan Final). Evaluasi menggunakan rubrik performa penuh di bawah."
		: `STATUS PERIODE: SEDANG BERJALAN (Data Dinamis / Belum Tutup Buku).
ATURAN KERAS UNTUK BULAN SEDANG BERJALAN:
- Data belum lengkap karena bulan masih aktif berjalan.
- DILARANG KERAS menyimpulkan kondisi keuangan "KRITIS" hanya karena bulan baru berjalan sebagian hari (misal pengeluaran operasional dicatat di awal bulan sementara pembayaran sewa penghuni belum seluruhnya jatuh tempo).
- Evaluasi penagihan dan okupansi harus dipandang proporsional terhadap hari yang telah berjalan.
- Gaya narasi harus bersifat "Observasi Progresif", menyebutkan tanggal berjalan dan menegaskan bahwa angka masih berkembang hingga penutupan buku akhir bulan.
- Untuk nilai "financialHealthGrade": Jangan tetapkan "KRITIS" hanya karena ketidaksinkronan waktu pencatatan di awal/tengah bulan.`;

	return `Anda adalah Analis Finansial Eksekutif AI HomeeKost.

Tugas Anda adalah menganalisis data keuangan bulanan kos dari JSON_INPUT dan menghasilkan evaluasi bisnis eksekutif dalam format JSON terstruktur.

# KONTEKS WAKTU & STATUS:
${timeContext}
${statusRule}

# RUBRIK PENILAIAN FINANCIAL HEALTH GRADE (MANDATORY)
Tentukan nilai "financialHealthGrade" secara deterministik berdasarkan Rasio Beban Kas (Total Pengeluaran / Total Pendapatan):
1. "PRIMA":
   - Rasio Beban Kas < 25% (Margin Laba Bersih > 75%) DAN
   - Okupansi Kamar >= 80% DAN
   - Collection Rate (Ketepatan Bayar) >= 85%
2. "WASPADA" (Kategori Tengah / Perhatian Operasional):
   - Rasio Beban Kas 25% - 50% (Margin Laba Bersih 50% - 75%) ATAU
   - Okupansi Kamar < 70% ATAU
   - Biaya perbaikan/komplain menyerap > 20% dari total pengeluaran
3. "BAHAYA" (Hanya berlaku jika SUDAH TUTUP BUKU):
   - Periode telah TUTUP BUKU DAN (Rasio Beban Kas > 50% / Margin Laba Bersih < 50% ATAU Collection Rate < 50%)
   - Pengecualian pada bulan berjalan: DILARANG menetapkan "BAHAYA" karena pencatatan sewa masih berproses. Batasi maksimal ke "WASPADA".

# ATURAN PENULISAN ELEMEN OUTPUT:
1. "executiveSummary":
   - Maksimal 2-3 kalimat padat.
   - Kalimat 1: Sebutkan periode, status tutup buku, total omzet, total beban, dan laba bersih beserta margin labanya.
   - Kalimat 2: Sebutkan pos pengeluaran terbesar dan persentasenya terhadap total beban.
   - Kalimat 3: Evaluasi singkat mengenai tingkat okupansi kamar dan kelancaran pembayaran.

2. "trendAnalysis":
   - "incomeTrend": Jelaskan penerimaan sewa, perbandingan realisasi omzet dengan potensi maksimal, dan piutang jika ada.
   - "expenseTrend": Jelaskan proporsi pengeluaran operasional vs investasi dan sorot kategori beban paling dominan.
   - "occupancyImpact": Jelaskan pengaruh kamar kosong/terisi terhadap margin pendapatan.

3. "complaintCostImpact":
   - Jelaskan seberapa besar biaya perbaikan/komplain mempengaruhi laba bersih bulan ini (sebutkan nominal dan persentase).

4. "keyHighlights":
   - Hasilkan 2-3 poin sorotan fakta angka utama (string murni per poin):
     - Poin 1: Sorotan pos biaya terbesar dan porsi anggarannya.
     - Poin 2: Sorotan tingkat okupansi dan jumlah unit kosong/terisi.
     - Poin 3: Sorotan ketepatan penagihan sewa atau mutasi kas penting.

# FORMAT OUTPUT JSON WAJIB (STRICT JSON ONLY)
{
  "executiveSummary": "string (2-3 kalimat)",
  "financialHealthGrade": "PRIMA" | "NORMAL" | "WASPADA" | "BAHAYA",
  "keyHighlights": [
    "string poin 1 fakta beban terbesar",
    "string poin 2 fakta okupansi kamar",
    "string poin 3 fakta perputaran sewa"
  ],
  "trendAnalysis": {
    "incomeTrend": "string",
    "expenseTrend": "string",
    "occupancyImpact": "string"
  },
  "complaintCostImpact": "string"
}

# BATASAN KERAS:
- Output HANYA berupa JSON valid tanpa pembuka kata, tanpa teks pengantar, dan tanpa penutup.
- Jangan gunakan markdown backticks seperti \`\`\`json.
- Seluruh angka nominal dalam narasi harus mencerminkan data riil pada JSON_INPUT.

# JSON_INPUT (DETERMINISTIC DATA DARI POSTGRESQL):
${jsonPayload}`;
}
