/**
 * AI offer-strength explainer route (issue #36). POST { offer } → an envelope.
 *
 * Gating + guardrails live here so the client can never bypass them:
 *   - If the server feature is not active ({@link isAiExplainerActive}: source +
 *     key + kill switch off), respond `{ available:false }`. The client flag
 *     alone never turns it on, so the UI stays "Coming soon".
 *   - Otherwise build the FHA-safe, allowlisted input ({@link buildSafeAiInput})
 *     plus OUR deterministic strength factors ({@link explainOfferStrength}),
 *     and call the provider through the seam.
 *
 * Response shapes (all 200; the route NEVER 500s at the user):
 *   { available:false }                 — feature not configured / off.
 *   { available:false, error }          — unexpected failure (degraded, no 500).
 *   { available:true, explanation }      — grounded, screened explanation.
 *   { available:true, blocked:true }     — provider produced output the FHA gate
 *                                          rejected (screening blocked it).
 *   { available:true, explanation:null } — provider failed/returned nothing.
 *
 * NOTE: a provider returns `null` BOTH when it fails AND when its output is
 * blocked by screening. The route can't tell those apart from `null` alone, so a
 * `null` is reported as `explanation:null` (provider unavailable). The screening
 * rejection is enforced inside the provider; surfacing the precise `blocked`
 * state would require the provider to distinguish them — kept simple here and
 * covered by the provider's own screening test.
 */

import { NextResponse } from "next/server";
import { buildSafeAiInput } from "@/lib/ai/screening";
import { explainOfferStrength } from "@/lib/offer/strength";
import {
  getAiExplainerSource,
  isAiExplainerActive,
} from "@/lib/ai/explainer/source";
import type { Offer } from "@/lib/offer/types";

interface ExplainBody {
  offer?: Offer;
}

export async function POST(request: Request) {
  // Server gate is independent of the client surface flag.
  if (!isAiExplainerActive()) {
    return NextResponse.json({ available: false });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ExplainBody;
    const offer = body.offer;
    if (!offer) {
      return NextResponse.json({ available: true, explanation: null });
    }

    // FHA-safe allowlisted projection + OUR deterministic factors. The model is
    // grounded in these and only restates them.
    const safeInput = buildSafeAiInput(offer);
    const factors = explainOfferStrength(offer);

    const explanation = await getAiExplainerSource().explainOfferStrength({
      safeInput,
      factors,
    });

    // null = provider failed OR its output was blocked by the FHA screen.
    return NextResponse.json({ available: true, explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Never surface a 500: degrade to an unavailable envelope.
    return NextResponse.json({ available: false, error: message });
  }
}
