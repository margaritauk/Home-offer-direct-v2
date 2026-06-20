/**
 * AI price-band explainer route (S7-AI2). POST { band inputs } → an envelope.
 *
 * Reuses the EXACT seam, gating, connector, and screening built for #36/#57.
 * This is the MOST conservatively grounded surface: the model narrates a RANGE —
 * "comps + the market suggest a range; you decide" — and NEVER "offer $X". The
 * server RE-RUNS the deterministic `suggestPriceBand` so the model is grounded
 * in OUR numbers, then projects to an FHA-safe, demographic-free input.
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
import { buildPriceBandExplainerInput } from "@/lib/ai/explainer/grounding-input";
import { suggestPriceBand } from "@/lib/offer/suggested-price";
import { classifyMarket } from "@/lib/market/classify";
import { compsEstimate, type CompsState } from "@/lib/tools/comps";
import type { MarketStats } from "@/lib/market/types";

interface PriceBandBody {
  /** The buyer's comps state (the SAME shape the A2 step persists). */
  comps?: CompsState;
  /** The buyer's manual market-read inputs. */
  market?: {
    daysOnMarket?: number;
    listToSaleRatio?: number;
    monthsOfSupply?: number;
    priceTrendPct?: number;
  };
  listPrice?: number;
}

function present(n: unknown): number | undefined {
  return typeof n === "number" && n > 0 ? n : undefined;
}

export async function POST(request: Request) {
  // Server gate is independent of the client surface flag.
  if (!isAiExplainerActive()) {
    return NextResponse.json({ available: false });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as PriceBandBody;

    // RE-RUN our deterministic estimate + market read server-side so the model
    // narrates OUR numbers (never the raw client claims).
    let estimate = null;
    const homes = body.comps?.homes ?? [];
    for (const home of homes) {
      const est = compsEstimate({ sqft: home.sqft }, home.comps ?? []);
      if (est.usableCount > 0 && est.estimatedLow !== null) {
        estimate = est;
        break;
      }
    }

    const stats: MarketStats = {
      daysOnMarket: present(body.market?.daysOnMarket),
      listToSaleRatio: present(body.market?.listToSaleRatio),
      monthsOfSupply: present(body.market?.monthsOfSupply),
      priceTrendPct:
        typeof body.market?.priceTrendPct === "number" &&
        body.market.priceTrendPct !== 0
          ? body.market.priceTrendPct
          : undefined,
      source: "manual",
    };
    const marketRead = classifyMarket(stats);

    const band = suggestPriceBand({
      compsEstimate: estimate,
      marketRead,
      listPrice: present(body.listPrice) ?? null,
    });

    const explanation = await getAiExplainerSource().explainPriceBand(
      buildPriceBandExplainerInput(band),
    );

    // null = provider failed OR its output was blocked by the FHA/UPL screen.
    return NextResponse.json({ available: true, explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ available: false, error: message });
  }
}
