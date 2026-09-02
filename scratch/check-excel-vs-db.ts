import ExcelJS from "exceljs";
import { prisma } from "../src/db.ts";

async function run() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("../documents/Laporan_Keuangan_Kost(1).xlsx");
  
  console.log("=== 1. EXCEL LABA RUGI SHEET VALUES ===");
  const lrSheet = wb.getWorksheet("Laba Rugi");
  if (lrSheet) {
    for (let r = 1; r <= 10; r++) {
      const row = lrSheet.getRow(r);
      const rowValues: any[] = [];
      for (let c = 1; c <= 12; c++) {
        const cell = row.getCell(c);
        let v: any = cell.value;
        if (typeof v === "object" && v !== null && v.result !== undefined) v = v.result;
        rowValues.push(v);
      }
      console.log(`Row ${r}: ` + rowValues.join(" | "));
    }
  }

  console.log("\n=== 2. EXCEL PENDAPATAN SHEET ROW BY ROW ===");
  const pendSheet = wb.getWorksheet("Pendapatan");
  const excelPendByMonth: Record<string, any> = {};
  if (pendSheet) {
    pendSheet.eachRow((row, r) => {
      if (r === 1) return;
      const prop = row.getCell(2).value;
      const dateVal = row.getCell(3).value;
      const room = row.getCell(4).value;
      const tenant = row.getCell(5).value;
      const desc = row.getCell(6).value;
      let amt: any = row.getCell(7).value;
      if (typeof amt === "object" && amt !== null) amt = amt.result || 0;
      amt = Number(amt) || 0;

      if (dateVal) {
        const d = new Date(dateVal as string);
        const m = d.toISOString().slice(0, 7);
        if (!excelPendByMonth[m]) excelPendByMonth[m] = { total: 0, byProp: {}, count: 0 };
        excelPendByMonth[m].total += amt;
        excelPendByMonth[m].byProp[prop as string] = (excelPendByMonth[m].byProp[prop as string] || 0) + amt;
        excelPendByMonth[m].count++;
      }
    });
  }
  console.log("Excel Pendapatan grouped by Month:", JSON.stringify(excelPendByMonth, null, 2));

  console.log("\n=== 3. EXCEL BIAYA SHEET ROW BY ROW ===");
  const biayaSheet = wb.getWorksheet("Biaya ");
  const excelBiayaByMonth: Record<string, any> = {};
  if (biayaSheet) {
    biayaSheet.eachRow((row, r) => {
      if (r === 1 || r >= 52) return;
      const dateVal = row.getCell(1).value;
      const cat = row.getCell(2).value;
      const desc = row.getCell(3).value;
      let amt: any = row.getCell(4).value;
      if (typeof amt === "object" && amt !== null) amt = amt.result || 0;
      amt = Number(amt) || 0;
      const jenis = row.getCell(5).value;
      const kost = row.getCell(6).value;

      if (dateVal) {
        const d = new Date(dateVal as string);
        const m = d.toISOString().slice(0, 7);
        if (!excelBiayaByMonth[m]) excelBiayaByMonth[m] = { total: 0, op: 0, inv: 0, byKost: {}, rows: [] };
        excelBiayaByMonth[m].total += amt;
        if (cat && cat.toString().trim().toLowerCase().startsWith("investasi")) {
          excelBiayaByMonth[m].inv += amt;
        } else {
          excelBiayaByMonth[m].op += amt;
        }
        excelBiayaByMonth[m].byKost[kost as string] = (excelBiayaByMonth[m].byKost[kost as string] || 0) + amt;
        excelBiayaByMonth[m].rows.push({ r, cat, desc, amt, kost });
      }
    });
  }
  console.log("Excel Biaya grouped by Month:", JSON.stringify(excelBiayaByMonth, null, 2));

  console.log("\n=== 4. DATABASE TRANSACTIONS ===");
  const txs = await prisma.transaction.findMany({
    include: { property: true },
    orderBy: { transactionDate: "asc" }
  });
  
  const dbByMonth: Record<string, any> = {};
  for (const t of txs) {
    const d = new Date(t.transactionDate);
    const m = d.toISOString().slice(0, 7);
    if (!dbByMonth[m]) dbByMonth[m] = { income: 0, expense: 0, incCount: 0, expCount: 0, propIncome: {}, propExpense: {} };
    const pName = t.property?.name || "All";
    const amt = Number(t.amount);
    if (t.type === "INCOME") {
      dbByMonth[m].income += amt;
      dbByMonth[m].incCount++;
      dbByMonth[m].propIncome[pName] = (dbByMonth[m].propIncome[pName] || 0) + amt;
    } else {
      dbByMonth[m].expense += amt;
      dbByMonth[m].expCount++;
      dbByMonth[m].propExpense[pName] = (dbByMonth[m].propExpense[pName] || 0) + amt;
    }
  }
  console.log("DB Transactions grouped by Month:", JSON.stringify(dbByMonth, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
