import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../../../db.ts";
import { formatRupiah } from "../../../../lib/currency.ts";
import { formatDate, formatRentalPeriod } from "../../../../lib/date-utils.ts";

export const Route = createFileRoute("/api/invoices/$invoiceId/document")({
	server: {
		handlers: {
			GET: async ({ params }: { params: { invoiceId: string } }) => {
				const { invoiceId } = params;

				const invoice = await prisma.invoice.findUnique({
					where: { id: invoiceId },
					include: {
						contract: {
							include: {
								tenant: true,
								room: {
									include: {
										property: true,
									},
								},
							},
						},
					},
				});

				if (!invoice) {
					return new Response(
						`<!DOCTYPE html><html><head><title>Invoice Tidak Ditemukan</title></head><body style="font-family: sans-serif; text-align: center; padding: 50px;"><h2>Invoice Tidak Ditemukan</h2><p>Dokumen invoice yang Anda cari tidak tersedia atau telah dihapus.</p></body></html>`,
						{
							status: 404,
							headers: { "Content-Type": "text/html; charset=utf-8" },
						},
					);
				}

				const isPaid = invoice.status === "PAID";
				const isOverdue =
					invoice.status === "OVERDUE" ||
					(!isPaid && new Date(invoice.dueDate) < new Date());
				const statusLabel = isPaid
					? "LUNAS"
					: isOverdue
						? "TERLAMBAT"
						: "BELUM LUNAS";
				const statusColor = isPaid
					? "#568062"
					: isOverdue
						? "#b8382e"
						: "#b18a4b";
				const propertyName = invoice.contract.room.property.name;
				const bankAccountInfo =
					invoice.contract.room.property.bankAccountInfo?.trim();
				const tenantName = invoice.contract.tenant.name;
				const roomNumber = invoice.contract.room.roomNumber;
				const tenantPhone =
					invoice.contract.tenant.whatsappNumber ||
					invoice.contract.tenant.phoneNumber ||
					"-";
				const amount = Number(invoice.amount);
				const invoiceNumber = invoice.invoiceNumber;
				const dueDate = formatDate(invoice.dueDate);
				const createdDate = formatDate(invoice.createdAt);
				const paidDate = invoice.paidAt ? formatDate(invoice.paidAt) : "-";
				const period = formatRentalPeriod({
					periodMonth: invoice.periodMonth,
					periodYear: invoice.periodYear,
					startDate: invoice.contract.startDate,
					endDate: invoice.contract.endDate,
					billingCycle: invoice.contract.billingCycle,
					dueDate: invoice.dueDate,
				});

				const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isPaid ? "Kwitansi" : "Invoice"} ${invoiceNumber} — ${propertyName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #faf9f5;
      color: #252925;
      padding: 32px 16px;
      font-size: 13px;
      line-height: 1.5;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e4e9e4;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 24px rgba(48,65,53,0.07);
      position: relative;
    }
    .action-bar {
      max-width: 720px;
      margin: 0 auto 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
    }
    .btn-primary {
      background: #4f6958;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #425949;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid rgba(79,105,88,0.2);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #252925;
    }
    .brand-sub {
      font-size: 11px;
      color: #737873;
      margin-top: 2px;
    }
    .doc-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
      border-radius: 6px;
      background: #e8f0ea;
      color: #4f6958;
      text-align: right;
    }
    .doc-number {
      font-size: 16px;
      font-weight: 800;
      color: #252925;
      margin-top: 6px;
      text-align: right;
    }
    .doc-date {
      font-size: 11px;
      color: #737873;
      text-align: right;
      margin-top: 2px;
    }
    .stamp {
      position: absolute;
      right: 36px;
      top: 120px;
      border: 3px dashed ${isPaid ? "rgba(86,128,98,0.4)" : "rgba(177,138,75,0.4)"};
      border-radius: 10px;
      padding: 6px 14px;
      transform: rotate(-10deg);
      text-align: center;
      pointer-events: none;
    }
    .stamp-text {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 2px;
      color: ${isPaid ? "#568062" : "#b18a4b"};
    }
    .stamp-sub {
      font-size: 9px;
      font-weight: 700;
      color: ${isPaid ? "#568062" : "#b18a4b"};
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 16px;
      background: #fafbfa;
      border: 1px solid #e4e9e4;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #737873;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 700;
      color: #252925;
    }
    .meta-desc {
      font-size: 11px;
      color: #737873;
      margin-top: 2px;
    }
    .table-wrap {
      border: 1px solid #e4e9e4;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f5f8f5;
      color: #4f6958;
      font-size: 11px;
      font-weight: 700;
      padding: 10px 14px;
      border-bottom: 1px solid #e4e9e4;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #e4e9e4;
      font-size: 12px;
    }
    .total-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f3f7f3;
      border: 1px solid #dce7de;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .total-title {
      font-size: 12px;
      font-weight: 700;
      color: #4f6958;
    }
    .total-amount {
      font-size: 20px;
      font-weight: 900;
      color: #4f6958;
    }
    .bank-box {
      background: #fafbfa;
      border: 1px solid #e4e9e4;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .bank-title {
      font-size: 12px;
      font-weight: 700;
      color: #252925;
      margin-bottom: 8px;
    }
    .bank-card {
      background: #ffffff;
      border: 1px solid #e4e9e4;
      border-radius: 8px;
      padding: 12px;
    }
    .footer {
      border-top: 1px solid #e4e9e4;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #737873;
      font-size: 11px;
    }
    .sig-box {
      text-align: center;
      min-width: 140px;
    }
    .sig-line {
      border-top: 1px solid #252925;
      padding-top: 4px;
      font-weight: 700;
      color: #252925;
      margin-top: 36px;
    }
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .action-bar { display: none !important; }
      .container { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div style="font-weight: 700; font-size: 13px; color: #4f6958;">HomeeKost Digital Document</div>
    <button class="btn btn-primary" onclick="window.print()">🖨️ Cetak / Unduh PDF</button>
  </div>

  <div class="container">
    <div class="stamp">
      <div class="stamp-text">${isPaid ? "LUNAS" : "TAGIHAN"}</div>
      <div class="stamp-sub">${isPaid ? "VERIFIKASI RESMI" : "SEWA BULANAN"}</div>
    </div>

    <div class="header">
      <div>
        <div class="brand-title">${propertyName}</div>
        <div class="brand-sub">Sistem Manajemen Pengelolaan Hunian Kos</div>
      </div>
      <div>
        <div class="doc-badge">${isPaid ? "KWITANSI PEMBAYARAN RESMI" : "INVOICE SEWA DIGITAL"}</div>
        <div class="doc-number">${invoiceNumber}</div>
        <div class="doc-date">Terbit: ${createdDate}</div>
      </div>
    </div>

    <div class="meta-box">
      <div>
        <div class="meta-label">Ditagihkan Kepada:</div>
        <div class="meta-value">${tenantName}</div>
        <div class="meta-desc">Kamar: <b>${roomNumber}</b> | Telp: ${tenantPhone}</div>
        <div class="meta-desc" style="margin-top: 4px;">Periode Sewa: <b>${period}</b></div>
      </div>
      <div style="text-align: right;">
        <div class="meta-label">Status Pembayaran:</div>
        <div class="meta-value" style="color: ${statusColor}; font-weight: 800;">
          ${statusLabel}
        </div>
        <div class="meta-desc">${isPaid ? `Lunas pada: ${paidDate}` : `Jatuh Tempo: ${dueDate}`}</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Rincian Deskripsi</th>
            <th style="text-align: right;">Jumlah Nominal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 700;">Biaya Sewa Kamar ${roomNumber} (${period})</div>
              <div style="font-size: 11px; color: #737873; margin-top: 2px;">Fasilitas: Wi-Fi, Air Bersih, Listrik & Keamanan 24 Jam</div>
            </td>
            <td style="text-align: right; font-weight: 700; font-size: 14px;">${formatRupiah(amount)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-banner">
      <div>
        <div class="total-title">Total ${isPaid ? "Diterima" : "Tagihan"}</div>
        <div style="font-size: 11px; color: #737873;">${isPaid ? "Pembayaran telah tervalidasi" : "Termasuk seluruh fasilitas sewa"}</div>
      </div>
      <div class="total-amount">${formatRupiah(amount)}</div>
    </div>

    ${
			!isPaid
				? `
    <div class="bank-box">
      <div class="bank-title">💳 Petunjuk Pembayaran Transfer:</div>
      <div class="bank-card">
        ${
					bankAccountInfo
						? `
        <div style="font-size: 14px; font-weight: 800; color: #252925; line-height: 1.4;">${bankAccountInfo}</div>
        <div style="font-size: 11px; color: #737873; margin-top: 4px;">Rekening Resmi Pembayaran Kos</div>
        `
						: `
        <div style="font-size: 11px; color: #737873;">Bank Central Asia (BCA)</div>
        <div style="font-size: 16px; font-weight: 800; letter-spacing: 1px; margin: 4px 0; color: #252925;">8735081290</div>
        <div style="font-size: 11px; color: #737873;">Atas Nama: <b>Bude Frisda / Pengelola Kos</b></div>
        `
				}
      </div>
    </div>
    `
				: ""
		}

    <div class="footer">
      <div style="max-width: 360px;">
        Dokumen ini diterbitkan secara sah dan resmi melalui sistem manajemen operasional kos <b>HomeeKost</b>.
      </div>
      <div class="sig-box">
        <div>Pengelola Kos,</div>
        <div class="sig-line">${propertyName}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

				return new Response(html, {
					status: 200,
					headers: {
						"Content-Type": "text/html; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
