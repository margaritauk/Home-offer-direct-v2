/**
 * AI auto-find comps route (issue #104). POST { subject } → { comps } | message.
 *
 * Gating + anti-fabrication live here so the client can never bypass them:
 *   - If the feature isn't configured server-side, respond 503 (no key, or no
 *     real data source). The UI falls back to its "Coming soon" note.
 *   - Otherwise pull REAL candidate sales from the data source. If there are
 *     none, return an empty result with a clear message — NEVER fabricate comps.
 *   - Only with real candidates do we call the model to rank/adjust them.
 *
 * Everything is wrapped so the route never throws raw: failures become a 502.
 */

import { NextResponse } from "next/server";
import { isAiCompsConfigured } from "@/lib/ai/config";
import { selectCompsWithAI } from "@/lib/ai/comps-ai";
import { getCompsDataSource, type CompsSubject } from "@/lib/tools/comps-source";

interface AutoFindBody {
  subject?: CompsSubject;
}

export async function POST(request: Request) {
  if (!isAiCompsConfigured()) {
    return NextResponse.json(
      { available: false, reason: "AI comps is not configured" },
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

    // isAiCompsConfigured() guarantees the key is present.
    const apiKey = process.env.ANTHROPIC_API_KEY as string;
    const comps = await selectCompsWithAI(subject, candidates, { apiKey });

    return NextResponse.json({ comps });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
