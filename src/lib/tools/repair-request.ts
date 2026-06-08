/**
 * Repair-request builder math + summary (issue #106, depends on #105).
 *
 * Turns inspection findings into a neutral worksheet: for each item the buyer
 * picks "repair" or "credit", optionally with a requested dollar amount, and we
 * total the requested credit and assemble a plain, factual request summary the
 * buyer can copy and share with the seller.
 *
 * IMPORTANT (guardrail, #106, UPL/FHA): this is a WORKSHEET, not a legal notice.
 * The summary is deliberately neutral — it states facts and a request, with NO
 * demands, deadlines, threats, or legal language. Free text is screened in the
 * UI before it ever reaches this builder.
 */

export type RepairResolution = "repair" | "credit";

export interface RepairItem {
  id: string;
  /** The item/issue (e.g. "Roof — missing shingles"). Facts only. */
  item: string;
  resolution: RepairResolution;
  /** Requested credit amount in dollars (used when resolution === "credit"). */
  requestedAmount: number;
  /** Optional screened note. */
  notes?: string;
}

export interface RepairTotals {
  /** Number of items requesting a repair. */
  repairCount: number;
  /** Number of items requesting a credit. */
  creditCount: number;
  /** Sum of requested credit amounts (repairs contribute 0). */
  totalCredit: number;
  /** Total item count. */
  total: number;
}

function safeAmount(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Total the requested credits and count repair-vs-credit items. Repairs do not
 * contribute to the credit total (the ask is the work, not money). Pure.
 */
export function repairTotals(items: RepairItem[]): RepairTotals {
  let repairCount = 0;
  let creditCount = 0;
  let totalCredit = 0;

  for (const item of items) {
    if (item.resolution === "credit") {
      creditCount += 1;
      totalCredit += safeAmount(item.requestedAmount);
    } else {
      repairCount += 1;
    }
  }

  return { repairCount, creditCount, totalCredit, total: items.length };
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Build a neutral, factual, copyable request summary from the items. No
 * demands, deadlines, or legal language — just the inspection-based items and
 * the requested resolution. Returns an empty string when there are no items.
 *
 * Callers should pass already-screened text (item labels / notes). This builder
 * does not screen; it only formats.
 */
export function buildRequestSummary(items: RepairItem[]): string {
  const usable = items.filter((i) => i.item.trim() !== "");
  if (usable.length === 0) return "";

  const totals = repairTotals(usable);

  const lines: string[] = [];
  lines.push(
    "Based on the home inspection, I'd like to discuss the following items:",
  );
  lines.push("");

  usable.forEach((item, index) => {
    const label = item.item.trim();
    if (item.resolution === "credit") {
      const amount = safeAmount(item.requestedAmount);
      const amountText = amount > 0 ? ` — requested credit ${formatAmount(amount)}` : "";
      lines.push(`${index + 1}. ${label}: requesting a closing-cost credit${amountText}.`);
    } else {
      lines.push(`${index + 1}. ${label}: requesting repair prior to closing.`);
    }
    if (item.notes && item.notes.trim() !== "") {
      lines.push(`   Note: ${item.notes.trim()}`);
    }
  });

  if (totals.totalCredit > 0) {
    lines.push("");
    lines.push(`Total requested credit: ${formatAmount(totals.totalCredit)}.`);
  }

  lines.push("");
  lines.push("I'm happy to share the relevant inspection findings. Thank you for considering this.");

  return lines.join("\n");
}
