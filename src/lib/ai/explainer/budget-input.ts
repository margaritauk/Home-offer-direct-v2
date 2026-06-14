/**
 * FINANCIAL-ONLY safe projection for the AI budget explainer (issue #57).
 *
 * This is the budget analogue of `buildSafeAiInput` in `src/lib/ai/screening.ts`.
 * The budget explainer's inputs are FINANCIAL ONLY — price, down payment, rate,
 * term, income, debts — so the projection is FHA-neutral BY CONSTRUCTION: there
 * is no demographic field to strip. The single piece of free text the UI may
 * supply (a neutral budget note) is still passed through {@link screenText} as a
 * belt-and-suspenders guard before anything reaches the model.
 *
 * PURE — no network, no env, no React. Fully unit-testable.
 */

import { screenText } from "@/lib/ai/screening";
import type { BudgetMode, SafeBudgetInput } from "./types";

/**
 * The raw financial inputs the route accepts. Everything is optional/defensive so
 * a malformed body never throws — missing/garbage numbers project to safe zeros.
 */
export interface RawBudgetInput {
  mode?: BudgetMode;
  price?: number;
  downPaymentPercent?: number;
  ratePct?: number;
  termYears?: number;
  grossMonthlyIncome?: number;
  monthlyDebts?: number;
  /** Optional neutral free-text note. Screened on the way through. */
  note?: string;
}

/** A finite, non-negative number or 0. Mirrors the budget engine's guard. */
function safeNumber(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Project raw budget inputs down to ONLY the financial-only safe fields, screening
 * the free-text note on the way through. Anything not on {@link SafeBudgetInput}
 * cannot reach the model because this function only ever constructs that shape.
 */
export function buildSafeBudgetInput(raw: RawBudgetInput): SafeBudgetInput {
  const mode: BudgetMode = raw.mode === "affordability" ? "affordability" : "payment";

  const safe: SafeBudgetInput = {
    mode,
    price: safeNumber(raw.price),
    downPaymentPercent: safeNumber(raw.downPaymentPercent),
    ratePct: safeNumber(raw.ratePct),
    termYears: safeNumber(raw.termYears),
  };

  // Income / debts only carry meaning in the affordability flow; include them
  // whenever supplied so DTI headroom can be narrated.
  if (raw.grossMonthlyIncome !== undefined) {
    safe.grossMonthlyIncome = safeNumber(raw.grossMonthlyIncome);
  }
  if (raw.monthlyDebts !== undefined) {
    safe.monthlyDebts = safeNumber(raw.monthlyDebts);
  }

  // Belt-and-suspenders: screen any free-text note before the model can see it.
  if (typeof raw.note === "string" && raw.note.trim() !== "") {
    safe.note = screenText(raw.note).text;
  }

  return safe;
}
