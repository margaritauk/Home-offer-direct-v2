/**
 * AI disclosure-review explainer route (S7-AI2). POST { state, builtPre1978 } →
 * an envelope.
 *
 * Reuses the EXACT seam, gating, connector, and screening built for #36/#57. The
 * server RE-BUILDS the deterministic state-aware disclosure checklist so the
 * model narrates OUR categories (property condition only — never the people),
 * and never adjudicates legal sufficiency.
 *
 * Response shapes (all 200; the route NEVER 500s at the user):
 *   { available:false }                  — feature not configured / off.
 *   { available:false, error }           — unexpected failure (degraded, no 500).
 *   { available:true, explanation }       — grounded, screened explanation.
 *   { available:true, explanation:null }  — provider failed / nothing / blocked.
 */

import { NextResponse } from "next/server";
import {
  getAiExplainerSource,
  isAiExplainerActive,
} from "@/lib/ai/explainer/source";
import { buildDisclosureExplainerInput } from "@/lib/ai/explainer/grounding-input";
import { buildDisclosureChecklist } from "@/lib/tools/disclosure-review";
import { getStateProfile } from "@/lib/states";

interface DisclosureBody {
  /** Two-letter state code (any case). */
  state?: string;
  /** Whether the home was built before 1978 (federal lead overlay). */
  builtPre1978?: boolean;
}

export async function POST(request: Request) {
  if (!isAiExplainerActive()) {
    return NextResponse.json({ available: false });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as DisclosureBody;
    const profile = body.state ? getStateProfile(body.state) : undefined;
    if (!profile) {
      // No state → nothing to ground the model in.
      return NextResponse.json({ available: true, explanation: null });
    }

    const checklist = buildDisclosureChecklist(profile, {
      builtPre1978: body.builtPre1978 ?? true,
    });

    const explanation = await getAiExplainerSource().explainDisclosure(
      buildDisclosureExplainerInput(checklist),
    );

    return NextResponse.json({ available: true, explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ available: false, error: message });
  }
}
