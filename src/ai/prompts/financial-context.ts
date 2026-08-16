import type { FinancialContextPayload } from "../types.ts";

/**
 * Feature Prompt & RAG Context Serializer untuk Analisis Finansial Bulanan
 */
export function buildFinancialFeaturePrompt(
	payload: FinancialContextPayload,
): string {
	const jsonPayload = JSON.stringify(payload, null, 2);

	return `Anda adalah Analis Finansial Eksekutif AI HomeeKost.

Tugas Anda adalah menganalisis data keuangan bulanan kos dari JSON_INPUT dan menghasilkan evaluasi bisnis eksekutif dalam format JSON terstruktur.

# RUBRIK PENILAIAN FINANCIAL HEALTH GRADE (MANDATORY)
Tentukan nilai "financialHealthGrade" secara deterministik berdasarkan kriteria berikut:
1. "PRIMA":
   - Margin Laba Bersih >= 60% DAN
   - Okupansi Kamar >= 85% DAN
   - Collection Rate (Ketepatan Bayar) >= 90%
2. "SEHAT":
   - Margin Laba Bersih 40% - 59.9% DAN
   - Okupansi Kamar >= 70%
3. "WASPADA":
   - Margin Laba Bersih 15% - 39.9% ATAU
   - Okupansi Kamar < 70% ATAU
   - Biaya perbaikan/komplain menyerap > 20% dari total pengeluaran
4. "KRITIS":
   - Margin Laba Bersih < 15% (atau defisit/rugi) ATAU
   - Collection Rate < 50% (tunggakan sewa parah)

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

4. "strategicRecommendations":
   - WAJIB menghasilkan TEPAT 3 butir rekomendasi yang realistis, terukur, dan taktis:
     - Rekomendasi 1 (code "01"): Fokus pada Efisiensi Pos Pengeluaran Terbesar.
     - Rekomendasi 2 (code "02"): Fokus pada Okupansi & Penjualan Kamar Kosong (atau retensi penyewa jika penuh).
     - Rekomendasi 3 (code "03"): Fokus pada Operasional, Preventif Maintenance, atau Ketepatan Penagihan WA.
   - Tentukan priority ("HIGH", "MEDIUM", "LOW") yang proporsional.

# FORMAT OUTPUT JSON WAJIB (STRICT JSON ONLY)
{
  "executiveSummary": "string (2-3 kalimat)",
  "financialHealthGrade": "PRIMA" | "SEHAT" | "WASPADA" | "KRITIS",
  "trendAnalysis": {
    "incomeTrend": "string",
    "expenseTrend": "string",
    "occupancyImpact": "string"
  },
  "complaintCostImpact": "string",
  "strategicRecommendations": [
    {
      "code": "01",
      "title": "string",
      "description": "string",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    },
    {
      "code": "02",
      "title": "string",
      "description": "string",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    },
    {
      "code": "03",
      "title": "string",
      "description": "string",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}

# BATASAN KERAS:
- Output HANYA berupa JSON valid tanpa pembuka kata, tanpa teks pengantar, dan tanpa penutup.
- Jangan gunakan markdown backticks seperti \`\`\`json.
- Seluruh angka nominal dalam narasi harus mencerminkan data riil pada JSON_INPUT.

# JSON_INPUT (DETERMINISTIC DATA DARI POSTGRESQL):
${jsonPayload}`;
}
