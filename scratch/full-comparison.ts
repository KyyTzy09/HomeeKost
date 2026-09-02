import ExcelJS from "exceljs";
import { prisma } from "../src/db.ts";
import { reportRepository } from "../src/data/repositories/report.repository.ts";

async function run() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("../documents/Laporan_Keuangan_Kost(1).xlsx");
  
  // 1. Read Laba Rugi Sheet directly
  const lrSheet = wb.getWorksheet("Laba Rugi")!;
  const months = ["April", "Mei", "Juni", "Juli", "Agustus"];
  const excelLabaRugiSummary: Record<string, any> = {};

  const getRowCells = (rowNum: number) => {
    const row = lrSheet.getRow(rowNum);
    return [2, 3, 4, 5, 6].map(c => {
      let v: any = row.getCell(c).value;
      if (typeof v === "object" && v !== null && v.result !== undefined) v = v.result;
      return Number(v) || 0;
    });
  };

  const lrTotIncome = getRowCells(2);
  const lrBahariInc = getRowCells(3);
  const lrHomeeInc = getRowCells(4);
  const lrTotExpense = getRowCells(5);
  const lrInvExpense = getRowCells(6);
  const lrOpExpense = getRowCells(7);
  const lrNetProfit = getRowCells(10);

  months.forEach((mName, i) => {
    excelLabaRugiSummary[mName] = {
      income: { bahari: lrBahariInc[i], homee: lrHomeeInc[i], total: lrTotIncome[i] },
      expense: { op: lrOpExpense[i], inv: lrInvExpense[i], total: lrTotExpense[i] },
      netProfit: lrNetProfit[i],
    };
  });

  // 2. Read raw rows in Pendapatan & Biaya sheets
  const rawExcelData: Record<string, any> = {
    "04": { inc: 0, bahariInc: 0, homeeInc: 0, exp: 0, opExp: 0, invExp: 0 },
    "05": { inc: 0, bahariInc: 0, homeeInc: 0, exp: 0, opExp: 0, invExp: 0 },
    "06": { inc: 0, bahariInc: 0, homeeInc: 0, exp: 0, opExp: 0, invExp: 0 },
    "07": { inc: 0, bahariInc: 0, homeeInc: 0, exp: 0, opExp: 0, invExp: 0 },
    "08": { inc: 0, bahariInc: 0, homeeInc: 0, exp: 0, opExp: 0, invExp: 0 },
  };

  const pendSheet = wb.getWorksheet("Pendapatan")!;
  pendSheet.eachRow((row, r) => {
    if (r === 1) return;
    const prop = (row.getCell(2).value || "").toString().trim();
    const dateVal = row.getCell(3).value;
    let amt: any = row.getCell(7).value;
    if (typeof amt === "object" && amt !== null) amt = amt.result || 0;
    amt = Number(amt) || 0;

    if (dateVal) {
      const d = new Date(dateVal as string);
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      if (rawExcelData[mm]) {
        rawExcelData[mm].inc += amt;
        if (prop.toLowerCase().includes("bahari")) rawExcelData[mm].bahariInc += amt;
        else rawExcelData[mm].homeeInc += amt;
      }
    }
  });

  const biayaSheet = wb.getWorksheet("Biaya ")!;
  biayaSheet.eachRow((row, r) => {
    if (r === 1 || r >= 52) return;
    const dateVal = row.getCell(1).value;
    const cat = (row.getCell(2).value || "").toString().trim().toLowerCase();
    let amt: any = row.getCell(4).value;
    if (typeof amt === "object" && amt !== null) amt = amt.result || 0;
    amt = Number(amt) || 0;

    if (dateVal) {
      const d = new Date(dateVal as string);
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      if (rawExcelData[mm]) {
        rawExcelData[mm].exp += amt;
        if (cat.startsWith("investasi")) rawExcelData[mm].invExp += amt;
        else rawExcelData[mm].opExp += amt;
      }
    }
  });

  // 3. System Matrix from reportRepository
  const matrix = await reportRepository.getAnnualFinancialMatrix(2026);

  console.log("=========================================================================================");
  console.log("PERBANDINGAN RINCI DATA KEUANGAN BULANAN (2026)");
  console.log("=========================================================================================");

  const monthKeys = [
    { name: "April", num: "04", idx: 3 },
    { name: "Mei", num: "05", idx: 4 },
    { name: "Juni", num: "06", idx: 5 },
    { name: "Juli", num: "07", idx: 6 },
    { name: "Agustus", num: "08", idx: 7 },
  ];

  for (const m of monthKeys) {
    const lr = excelLabaRugiSummary[m.name];
    const raw = rawExcelData[m.num];
    const sysInc = matrix.monthlyTotalIncome[m.idx];
    const sysOp = matrix.monthlyOperationalExpense[m.idx];
    const sysInv = matrix.monthlyInvestmentExpense[m.idx];
    const sysExp = matrix.monthlyTotalExpense[m.idx];
    const sysNet = matrix.monthlyNetProfit[m.idx];

    console.log(`\n📌 BULAN: ${m.name.toUpperCase()} 2026`);
    console.log("-----------------------------------------------------------------------------------------");
    console.log("METRIK                 | EXCEL TAB 'LABA RUGI' | EXCEL RAW (BARIS NYATA) | SISTEM APP (DASHBOARD)");
    console.log("-----------------------|-----------------------|-------------------------|-----------------------");
    console.log(`Pendapatan Total       | Rp ${lr.income.total.toLocaleString("id-ID").padEnd(16)} | Rp ${raw.inc.toLocaleString("id-ID").padEnd(19)} | Rp ${sysInc.toLocaleString("id-ID")}`);
    console.log(`- Bahari               | Rp ${lr.income.bahari.toLocaleString("id-ID").padEnd(16)} | Rp ${raw.bahariInc.toLocaleString("id-ID").padEnd(19)} | Rp ${(matrix.propertyIncomes.find(p => p.propertyName === "Kost Bahari")?.monthlyIncome[m.idx] || 0).toLocaleString("id-ID")}`);
    console.log(`- HomeeKost            | Rp ${lr.income.homee.toLocaleString("id-ID").padEnd(16)} | Rp ${raw.homeeInc.toLocaleString("id-ID").padEnd(19)} | Rp ${(matrix.propertyIncomes.find(p => p.propertyName === "HomeeKost")?.monthlyIncome[m.idx] || 0).toLocaleString("id-ID")}`);
    console.log("-----------------------|-----------------------|-------------------------|-----------------------");
    console.log(`Biaya Operasional      | Rp ${lr.expense.op.toLocaleString("id-ID").padEnd(16)} | Rp ${raw.opExp.toLocaleString("id-ID").padEnd(19)} | Rp ${sysOp.toLocaleString("id-ID")}`);
    console.log(`Biaya Investasi        | Rp ${lr.expense.inv.toLocaleString("id-ID").padEnd(16)} | Rp ${raw.invExp.toLocaleString("id-ID").padEnd(19)} | Rp ${sysInv.toLocaleString("id-ID")}`);
    console.log(`Total Pengeluaran      | Rp ${lr.expense.total.toLocaleString("id-ID").padEnd(16)} | Rp ${raw.exp.toLocaleString("id-ID").padEnd(19)} | Rp ${sysExp.toLocaleString("id-ID")}`);
    console.log("-----------------------|-----------------------|-------------------------|-----------------------");
    console.log(`LABA BERSIH            | Rp ${lr.netProfit.toLocaleString("id-ID").padEnd(16)} | Rp ${(raw.inc - raw.exp).toLocaleString("id-ID").padEnd(19)} | Rp ${sysNet.toLocaleString("id-ID")}`);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
