import { describe, expect, it } from "vitest";
import { monthlyPITI, type PitiInput } from "@/lib/budget";
import {
  EXPORT_DISCLAIMER,
  buildBudgetWorkbook,
  budgetToCsv,
} from "./budget-export";

const PITI: PitiInput = {
  price: 400_000,
  downPct: 10,
  ratePct: 6.5,
  termYears: 30,
  propTaxYr: 4_400,
  insuranceYr: 1_500,
  hoaMo: 50,
  pmiRatePct: 0.5,
};

/** Pull the raw formula string off a cell (ExcelJS stores it on cell.formula). */
function formulaOf(ws: import("exceljs").Worksheet, ref: string): string {
  const cell = ws.getCell(ref);
  // ExcelJS exposes the formula on .formula for formula cells.
  return (cell.formula ?? "") as string;
}

describe("buildBudgetWorkbook", () => {
  it("places the editable input values in their own cells", () => {
    const wb = buildBudgetWorkbook(PITI);
    const ws = wb.getWorksheet("Monthly Payment");
    expect(ws).toBeDefined();
    if (!ws) return;

    expect(ws.getCell("B3").value).toBe(PITI.price);
    expect(ws.getCell("B4").value).toBe(PITI.downPct);
    expect(ws.getCell("B5").value).toBe(PITI.ratePct);
    expect(ws.getCell("B6").value).toBe(PITI.termYears);
    expect(ws.getCell("B7").value).toBe(PITI.propTaxYr);
    expect(ws.getCell("B8").value).toBe(PITI.insuranceYr);
    expect(ws.getCell("B9").value).toBe(PITI.hoaMo);
    expect(ws.getCell("B10").value).toBe(PITI.pmiRatePct);
  });

  it("uses LIVE FORMULAS (not flat numbers) for the monthly figures", () => {
    const wb = buildBudgetWorkbook(PITI);
    const ws = wb.getWorksheet("Monthly Payment")!;

    // Loan amount references the price + down-payment input cells.
    expect(formulaOf(ws, "B12")).toBe("B3*(1-B4/100)");

    // P&I is a live PMT formula referencing the rate/term/loan input cells.
    const pi = formulaOf(ws, "B14");
    expect(pi).toContain("PMT");
    expect(pi).toContain("B5"); // rate cell
    expect(pi).toContain("B6"); // term cell
    expect(pi).toContain("B12"); // loan-amount cell
    expect(pi.startsWith("-PMT")).toBe(true); // PMT negated

    // Tax / insurance / HOA / PMI are formulas referencing their input cells.
    expect(formulaOf(ws, "B15")).toBe("B7/12");
    expect(formulaOf(ws, "B16")).toBe("B8/12");
    expect(formulaOf(ws, "B17")).toBe("B9");
    expect(formulaOf(ws, "B18")).toContain("IF(B4<20");
    expect(formulaOf(ws, "B18")).toContain("B12"); // loan cell
    expect(formulaOf(ws, "B18")).toContain("B10"); // pmi rate cell

    // Total sums the breakdown formula cells.
    expect(formulaOf(ws, "B19")).toBe("SUM(B14:B18)");
  });

  it("includes the not-financial-advice disclaimer in the sheet", () => {
    const wb = buildBudgetWorkbook(PITI);
    const ws = wb.getWorksheet("Monthly Payment")!;

    const texts: string[] = [];
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === "string") texts.push(cell.value);
      });
    });
    const joined = texts.join(" ");
    expect(joined).toContain(EXPORT_DISCLAIMER);
    expect(joined.toLowerCase()).toContain("not financial advice");
  });
});

describe("budgetToCsv", () => {
  const breakdown = monthlyPITI(PITI);
  const csv = budgetToCsv(PITI, breakdown);

  it("contains the input labels and values", () => {
    expect(csv).toContain("Home price ($)");
    expect(csv).toContain(String(PITI.price));
    expect(csv).toContain("Down payment (%)");
    expect(csv).toContain(String(PITI.downPct));
    expect(csv).toContain("Interest rate (%)");
    expect(csv).toContain("PMI rate (% of loan / yr)");
  });

  it("contains the computed monthly breakdown from the passed-in breakdown", () => {
    expect(csv).toContain("Principal & interest");
    expect(csv).toContain("Total monthly (PITI)");
    // Total rounded to 2dp should appear verbatim.
    const total = Math.round(breakdown.total * 100) / 100;
    expect(csv).toContain(String(total));
  });

  it("contains the not-financial-advice disclaimer line", () => {
    expect(csv).toContain(EXPORT_DISCLAIMER);
    expect(csv.toLowerCase()).toContain("not financial advice");
  });

  it("is deterministic for the same inputs", () => {
    expect(budgetToCsv(PITI, monthlyPITI(PITI))).toBe(csv);
  });
});
