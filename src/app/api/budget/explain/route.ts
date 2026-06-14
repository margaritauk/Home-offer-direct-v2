/**
 * AI budget explainer route (issue #57). POST { budget inputs } → an envelope.
 *
 * Reuses the EXACT seam, gating, connector, and screening built for the AI
 * offer-strength explainer (#36). Gating + guardrails live here so the client can
 * never bypass them:
 *   - If the server feature is not active ({@link isAiExplainerActive}: same
 *     source + key + kill switch as #36), respond `{ available:false }`. The
 *     client flag alone never turns it on, so the UI stays in its default state.
 *   - Otherwise build the FINANCIAL-ONLY safe projection ({@link buildSafeBudgetInput}),
 *     RE-RUN the deterministic budget engine server-side so the model is grounded
 *     in the same numbers the calculator shows, and call the provider through the
 *     seam. The AI only NARRATES — it never computes, recommends a loan/lender,
 *     quotes a rate-as-offer, or steers.
 *
 * Response shapes (all 200; the route NEVER 500s at the user):
 *   { available:false }                  — feature not configured / off.
 *   { available:false, error }           — unexpected failure (degraded, no 500).
 *   { available:true, explanation }       — grounded, screened explanation.
 *   { available:true, explanation:null }  — provider failed / returned nothing /
 *                                           output blocked by the FHA screen.
 */

import { NextResponse } from "next/server";
import {
  maxAffordablePrice,
  monthlyPITI,
  type PitiBreakdown,
} from "@/lib/budget";
import { explainBudget as explainBudgetDeterministic } from "@/lib/budget-explainer";
import {
  buildSafeBudgetInput,
  type RawBudgetInput,
} from "@/lib/ai/explainer/budget-input";
import {
  getAiExplainerSource,
  isAiExplainerActive,
} from "@/lib/ai/explainer/source";
import type { BudgetAffordabilitySummary } from "@/lib/ai/explainer/types";

interface ExplainBudgetBody {
  /** Monthly-payment (PITI) mode inputs — required to ground the model. */
  piti?: {
    price?: number;
    downPct?: number;
    ratePct?: number;
    termYears?: number;
    propTaxYr?: number;
    insuranceYr?: number;
    hoaMo?: number;
    pmiRatePct?: number;
  };
  /** Affordability mode inputs (when mode === "affordability"). */
  affordability?: {
    grossMonthlyIncome?: number;
    monthlyDebts?: number;
    downPayment?: number;
    ratePct?: number;
    termYears?: number;
    propTaxRatePct?: number;
    insuranceYr?: number;
    hoaMo?: number;
    pmiRatePct?: number;
    frontCapPct?: number;
    backCapPct?: number;
  };
  mode?: "payment" | "affordability";
  /** Optional neutral free-text note (screened). */
  note?: string;
}

function num(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function POST(request: Request) {
  // Server gate is independent of the client surface flag (same as #36).
  if (!isAiExplainerActive()) {
    return NextResponse.json({ available: false });
  }

  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as ExplainBudgetBody;

    const mode = body.mode === "affordability" ? "affordability" : "payment";

    let breakdown: PitiBreakdown;
    let affordability: BudgetAffordabilitySummary | undefined;
    let raw: RawBudgetInput;

    if (mode === "affordability" && body.affordability) {
      const a = body.affordability;
      // RE-RUN our deterministic solver so the model narrates OUR numbers.
      const result = maxAffordablePrice({
        grossMonthlyIncome: num(a.grossMonthlyIncome),
        monthlyDebts: num(a.monthlyDebts),
        downPayment: num(a.downPayment),
        ratePct: num(a.ratePct),
        termYears: num(a.termYears),
        propTaxRatePct: num(a.propTaxRatePct),
        insuranceYr: num(a.insuranceYr),
        hoaMo: num(a.hoaMo),
        pmiRatePct: num(a.pmiRatePct),
        frontCapPct: a.frontCapPct,
        backCapPct: a.backCapPct,
      });
      breakdown = result.piti;
      affordability = {
        maxPrice: result.maxPrice,
        maxLoan: result.maxLoan,
        bindingConstraint: result.bindingConstraint,
      };
      // Down payment as a percent of the solved price, for the safe projection.
      const downPaymentPercent =
        result.maxPrice > 0
          ? Math.min(100, (num(a.downPayment) / result.maxPrice) * 100)
          : 0;
      raw = {
        mode,
        price: result.maxPrice,
        downPaymentPercent,
        ratePct: num(a.ratePct),
        termYears: num(a.termYears),
        grossMonthlyIncome: num(a.grossMonthlyIncome),
        monthlyDebts: num(a.monthlyDebts),
        note: body.note,
      };
    } else {
      const p = body.piti;
      if (!p) {
        // Nothing to ground the model in.
        return NextResponse.json({ available: true, explanation: null });
      }
      // RE-RUN our deterministic PITI engine so the model narrates OUR numbers.
      breakdown = monthlyPITI({
        price: num(p.price),
        downPct: num(p.downPct),
        ratePct: num(p.ratePct),
        termYears: num(p.termYears),
        propTaxYr: num(p.propTaxYr),
        insuranceYr: num(p.insuranceYr),
        hoaMo: num(p.hoaMo),
        pmiRatePct: num(p.pmiRatePct),
      });
      raw = {
        mode,
        price: num(p.price),
        downPaymentPercent: num(p.downPct),
        ratePct: num(p.ratePct),
        termYears: num(p.termYears),
        note: body.note,
      };
    }

    // FINANCIAL-ONLY safe projection + OUR deterministic insights. The model is
    // grounded in these and only restates them.
    const safeInput = buildSafeBudgetInput(raw);
    const insights = explainBudgetDeterministic(breakdown, {
      grossMonthlyIncome: raw.grossMonthlyIncome,
    });

    const explanation = await getAiExplainerSource().explainBudget({
      safeInput,
      breakdown,
      insights,
      affordability,
    });

    // null = provider failed OR its output was blocked by the FHA screen.
    return NextResponse.json({ available: true, explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Never surface a 500: degrade to an unavailable envelope.
    return NextResponse.json({ available: false, error: message });
  }
}
