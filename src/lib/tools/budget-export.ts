/**
 * Excel (.xlsx) + CSV export for the Budget Wizard's monthly-payment (PITI) mode.
 *
 * The Excel workbook is the "editable" deliverable (#55): the buyer's inputs land
 * in their own cells and every monthly figure is a LIVE FORMULA referencing those
 * input cells, so edits in Excel/Sheets recalculate the payment automatically —
 * including the amortized P&I via Excel's native PMT function.
 *
 * The CSV is a plain, deterministic fallback that snapshots the inputs plus the
 * already-computed monthly breakdown (it cannot recalc — it's a flat export).
 *
 * GUARDRAIL: every export carries an "estimates only — not financial advice"
 * disclaimer row/line. The math here mirrors src/lib/budget.ts but is expressed
 * as spreadsheet formulas; the CSV uses the passed-in {@link PitiBreakdown} so the
 * numbers match the on-screen calculator exactly.
 *
 * Bundle note: this module imports ExcelJS (large). Callers MUST dynamically
 * import it (e.g. inside a click handler) so exceljs stays out of initial bundles.
 */

import ExcelJS from "exceljs";
import type { PitiInput, PitiBreakdown } from "@/lib/budget";

/** Disclaimer string shared by both exports (single source of truth). */
export const EXPORT_DISCLAIMER =
  "Estimates only — not financial advice. A lender or underwriter determines what you actually qualify for; your real rate, taxes, insurance, and PMI will vary.";

// ---------------------------------------------------------------------------
// Excel workbook (live formulas)
// ---------------------------------------------------------------------------

/**
 * Build an editable workbook whose monthly figures are live formulas referencing
 * the input cells. The layout (1-based rows; values in column B):
 *
 *   Inputs:
 *     B3  price
 *     B4  down payment %
 *     B5  interest rate %
 *     B6  term (years)
 *     B7  property tax (annual $)
 *     B8  insurance (annual $)
 *     B9  HOA (monthly $)
 *     B10 PMI rate (% of loan / yr)
 *
 *   Derived:
 *     B12 loan amount   = B3*(1-B4/100)
 *
 *   Monthly breakdown (live formulas):
 *     B14 P&I           = -PMT(B5/12/100, B6*12, B12)
 *     B15 property tax  = B7/12
 *     B16 insurance     = B8/12
 *     B17 HOA           = B9
 *     B18 PMI           = IF(B4<20, B12*B10/100/12, 0)
 *     B19 total PITI    = SUM(B14:B18)
 */
export function buildBudgetWorkbook(piti: PitiInput): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "HomeOffer Direct";
  wb.created = new Date(0); // deterministic timestamp for reproducible output
  const ws = wb.addWorksheet("Monthly Payment");

  ws.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 18 },
    { key: "note", width: 40 },
  ];

  // Title row.
  ws.getCell("A1").value = "HomeOffer Direct — Monthly Payment (PITI)";
  ws.getCell("A1").font = { bold: true, size: 14 };

  // Inputs header.
  ws.getCell("A2").value = "Inputs (edit these)";
  ws.getCell("A2").font = { bold: true };

  // Input cells — labels in A, editable values in B.
  const setInput = (
    row: number,
    label: string,
    value: number,
    fmt?: string,
  ) => {
    ws.getCell(`A${row}`).value = label;
    const cell = ws.getCell(`B${row}`);
    cell.value = value;
    if (fmt) cell.numFmt = fmt;
  };

  setInput(3, "Home price ($)", piti.price, "$#,##0");
  setInput(4, "Down payment (%)", piti.downPct, "0.00");
  setInput(5, "Interest rate (%)", piti.ratePct, "0.000");
  setInput(6, "Loan term (years)", piti.termYears, "0");
  setInput(7, "Property tax (annual $)", piti.propTaxYr, "$#,##0");
  setInput(8, "Insurance (annual $)", piti.insuranceYr, "$#,##0");
  setInput(9, "HOA (monthly $)", piti.hoaMo, "$#,##0");
  setInput(10, "PMI rate (% of loan / yr)", piti.pmiRatePct, "0.000");

  // Derived loan amount (live formula).
  ws.getCell("A12").value = "Loan amount ($)";
  const loanCell = ws.getCell("B12");
  loanCell.value = { formula: "B3*(1-B4/100)" };
  loanCell.numFmt = "$#,##0";
  ws.getCell("C12").value = "= price × (1 − down%/100)";

  // Monthly breakdown header.
  ws.getCell("A13").value = "Monthly breakdown (live formulas)";
  ws.getCell("A13").font = { bold: true };

  const setFormula = (
    row: number,
    label: string,
    formula: string,
    note: string,
  ) => {
    ws.getCell(`A${row}`).value = label;
    const cell = ws.getCell(`B${row}`);
    cell.value = { formula };
    cell.numFmt = "$#,##0.00";
    ws.getCell(`C${row}`).value = note;
  };

  // P&I via Excel PMT (PMT returns a negative; negate it).
  setFormula(
    14,
    "Principal & interest",
    "-PMT(B5/12/100,B6*12,B12)",
    "= -PMT(rate/12/100, term×12, loan)",
  );
  setFormula(15, "Property tax", "B7/12", "= annual tax / 12");
  setFormula(16, "Insurance", "B8/12", "= annual insurance / 12");
  setFormula(17, "HOA", "B9", "= monthly HOA (pass-through)");
  setFormula(
    18,
    "PMI",
    "IF(B4<20,B12*B10/100/12,0)",
    "= 0 when down ≥ 20%",
  );

  // Total PITI — sum of the formula cells above.
  ws.getCell("A19").value = "Total monthly (PITI)";
  ws.getCell("A19").font = { bold: true };
  const totalCell = ws.getCell("B19");
  totalCell.value = { formula: "SUM(B14:B18)" };
  totalCell.numFmt = "$#,##0.00";
  totalCell.font = { bold: true };
  ws.getCell("C19").value = "= P&I + tax + insurance + HOA + PMI";

  // Disclaimer row.
  const disclaimerCell = ws.getCell("A21");
  disclaimerCell.value = EXPORT_DISCLAIMER;
  disclaimerCell.font = { italic: true, color: { argb: "FF6B7280" } };
  ws.mergeCells("A21:C21");

  return wb;
}

// ---------------------------------------------------------------------------
// CSV fallback (flat snapshot)
// ---------------------------------------------------------------------------

/** Escape a CSV field: wrap in quotes and double any embedded quotes. */
function csvField(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Render one CSV row from an array of fields. */
function csvRow(fields: Array<string | number>): string {
  return fields.map(csvField).join(",");
}

/**
 * Plain, deterministic CSV: the inputs, the computed monthly breakdown (from the
 * passed-in {@link PitiBreakdown} so it matches the calculator exactly), and the
 * disclaimer line. Unlike the workbook this is a flat snapshot — no live formulas.
 */
export function budgetToCsv(
  piti: PitiInput,
  breakdown: PitiBreakdown,
): string {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const rows: string[] = [
    csvRow(["HomeOffer Direct — Monthly Payment (PITI)"]),
    "",
    csvRow(["Input", "Value"]),
    csvRow(["Home price ($)", piti.price]),
    csvRow(["Down payment (%)", piti.downPct]),
    csvRow(["Interest rate (%)", piti.ratePct]),
    csvRow(["Loan term (years)", piti.termYears]),
    csvRow(["Property tax (annual $)", piti.propTaxYr]),
    csvRow(["Insurance (annual $)", piti.insuranceYr]),
    csvRow(["HOA (monthly $)", piti.hoaMo]),
    csvRow(["PMI rate (% of loan / yr)", piti.pmiRatePct]),
    "",
    csvRow(["Loan amount ($)", round2(breakdown.loanAmount)]),
    csvRow(["LTV (%)", round2(breakdown.ltv)]),
    "",
    csvRow(["Monthly breakdown", "Amount ($)"]),
    csvRow(["Principal & interest", round2(breakdown.pi)]),
    csvRow(["Property tax", round2(breakdown.tax)]),
    csvRow(["Insurance", round2(breakdown.insurance)]),
    csvRow(["HOA", round2(breakdown.hoa)]),
    csvRow(["PMI", round2(breakdown.pmi)]),
    csvRow(["Total monthly (PITI)", round2(breakdown.total)]),
    "",
    csvRow([EXPORT_DISCLAIMER]),
  ];

  return rows.join("\n");
}

// ---------------------------------------------------------------------------
// Browser download helpers (NOT unit-tested — touch document/Blob)
// ---------------------------------------------------------------------------

/** Trigger an anchor download for a Blob in the browser. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Write the workbook to an .xlsx Blob and trigger a download. Browser-only. */
export async function downloadWorkbook(
  wb: ExcelJS.Workbook,
  filename: string,
): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

/** Wrap a CSV string in a Blob and trigger a download. Browser-only. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}
