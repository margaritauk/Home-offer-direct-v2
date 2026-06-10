/**
 * Deterministic budget explainer (issue #125 — no-AI workaround for #57).
 *
 * Plain-English narration of the numbers `lib/budget.ts` ALREADY computed. This
 * is rule-based and pure: it NEVER computes a payment or recommends a loan or
 * lender — it only describes the existing breakdown (what's driving the payment,
 * PMI status and how to shed it, where there's headroom). When a Claude key
 * lands (#57), this stays the deterministic grounding/fallback.
 *
 * GUARDRAIL: estimate + education, not financial advice.
 */

import {
  DEFAULT_FRONT_CAP_PCT,
  PMI_LTV_THRESHOLD_PCT,
  frontEndRatio,
  type PitiBreakdown,
} from "./budget";

export type InsightTone = "info" | "good" | "watch";

export interface BudgetInsight {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function dollars(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export interface ExplainOptions {
  /** Gross monthly income, if known (affordability mode) — enables DTI headroom. */
  grossMonthlyIncome?: number;
}

/**
 * Narrate a {@link PitiBreakdown} into a short list of plain-English insights.
 * Pure + deterministic. Order: payment composition → PMI status → (optional) DTI
 * headroom → what moves the number.
 */
export function explainBudget(
  breakdown: PitiBreakdown,
  opts: ExplainOptions = {},
): BudgetInsight[] {
  const insights: BudgetInsight[] = [];
  const { total, pi, tax, insurance, hoa, pmi, ltv } = breakdown;

  if (total <= 0) {
    return [
      {
        id: "empty",
        title: "Enter your numbers",
        body: "Add a price, rate, and term to see what's driving your monthly payment.",
        tone: "info",
      },
    ];
  }

  // 1) Payment composition — what share is principal & interest vs the rest.
  const piShare = pct(pi, total);
  const escrow = tax + insurance + hoa;
  insights.push({
    id: "composition",
    title: "What's driving your payment",
    body: `Principal & interest is ${piShare}% of your ${dollars(total)}/mo payment (${dollars(pi)}). Taxes, insurance${hoa > 0 ? ", and HOA" : ""} add about ${dollars(escrow)}/mo on top${pmi > 0 ? `, plus ${dollars(pmi)}/mo of PMI` : ""}.`,
    tone: "info",
  });

  // 2) PMI status + how to shed it.
  if (pmi > 0) {
    insights.push({
      id: "pmi",
      title: "You're paying PMI",
      body: `Your loan-to-value is about ${Math.round(ltv)}%, so you're paying roughly ${dollars(pmi)}/mo (${dollars(pmi * 12)}/yr) in private mortgage insurance. PMI generally falls off once you reach 20% equity (an 80% LTV) — through payments or appreciation — so it isn't forever.`,
      tone: "watch",
    });
  } else {
    insights.push({
      id: "no-pmi",
      title: "No PMI",
      body: `With a down payment of at least 20% (an ${Math.round(ltv)}% loan-to-value), you're not paying private mortgage insurance — that keeps the payment leaner.`,
      tone: "good",
    });
  }

  // 3) DTI headroom (only when income is known).
  const income = opts.grossMonthlyIncome ?? 0;
  if (income > 0) {
    const ratio = Math.round(frontEndRatio(total, income) * 100);
    const tone: InsightTone = ratio <= DEFAULT_FRONT_CAP_PCT ? "good" : "watch";
    insights.push({
      id: "dti",
      title: "Housing-cost ratio",
      body:
        ratio <= DEFAULT_FRONT_CAP_PCT
          ? `This payment is about ${ratio}% of your gross monthly income — within the ${DEFAULT_FRONT_CAP_PCT}% guideline lenders often use, so you likely have some headroom.`
          : `This payment is about ${ratio}% of your gross monthly income, above the ${DEFAULT_FRONT_CAP_PCT}% guideline lenders often use. A lower price, more down, or a lower rate would bring it down.`,
      tone,
    });
  }

  // 4) What moves the number.
  insights.push({
    id: "levers",
    title: "What moves the number",
    body: "The biggest levers are the price, your interest rate, and your down payment. A lower rate or more money down shrinks principal & interest; reaching 20% down also removes PMI.",
    tone: "info",
  });

  return insights;
}
