/**
 * Auto-find comps route (issues #104 / #169). POST { subject } → { comps } | message.
 *
 * Gating + anti-fabrication live here so the client can never bypass them:
 *   - Configured when a REAL data source is selected ({@link isCompsSourceConfigured},
 *     e.g. RentCast) OR the existing AI config ({@link isAiCompsConfigured}). When
 *     neither is configured, respond 503; the UI falls back to "Coming soon".
 *   - Otherwise pull REAL candidate sales from the data source. If there are
 *     none, return an empty result with a clear message — NEVER fabricate comps.
 *   - With real candidates: if a Claude key is present, rank/adjust them with the
 *     AI ({@link selectCompsWithAI}). Otherwise rank them DETERMINISTICALLY with
 *     {@link rankComps} — so real comps work without an Anthropic key.
 *
 * Everything is wrapped so the route never throws raw: failures become a 502.
 */

import { NextResponse } from "next/server";
import { isAiCompsConfigured, isCompsSourceConfigured } from "@/lib/ai/config";
import { selectCompsWithAI } from "@/lib/ai/comps-ai";
import { getCompsDataSource, type CompsSubject } from "@/lib/tools/comps-source";
import { rankComps } from "@/lib/tools/comps-rank";

interface AutoFindBody {
  subject?: CompsSubject;
}

export async function POST(request: Request) {
  if (!isCompsSourceConfigured() && !isAiCompsConfigured()) {
    return NextResponse.json(
      { available: false, reason: "Auto-find comps is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as AutoFindBody;
    const subject: CompsSubject = body.subject ?? {};

    const candidates = await getCompsDataSource().fetchRecentSales(subject);

    if (candidates.length === 0) {
      return NextResponse.json({
        comps: [],
        message: "No comparable sales found for this home.",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const comps = apiKey
      ? // AI rank/adjust when a Claude key is available.
        await selectCompsWithAI(subject, candidates, { apiKey })
      : // No Claude key: deterministic ranking over the same real candidates.
        rankComps(subject, candidates);

    return NextResponse.json({ comps });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
