/**
 * Deterministic offer-strength explainer (issue #126 — no-AI workaround for #36).
 *
 * Narrates the buyer's OWN offer terms into plain-English "what makes this
 * stronger / what to weigh" notes. Rule-based and pure — it describes trade-offs
 * from the terms the buyer already entered. It does NOT tell the buyer what to
 * offer, what to waive, or what price to pick (UPL guardrail, #17). When a Claude
 * key lands (#36), this stays the deterministic grounding/fallback.
 *
 * GUARDRAIL: education only, not legal or financial advice; route drafting and
 * strategy to a licensed attorney.
 */

import type { Offer } from "./types";

export type StrengthTone = "strength" | "watch" | "info";

export interface OfferInsight {
  id: string;
  title: string;
  body: string;
  tone: StrengthTone;
}

/** Earnest money as a percent of price, however it was entered. */
export function earnestPercent(offer: Offer): number {
  if (offer.isPercent) return Number.isFinite(offer.earnestMoney) ? offer.earnestMoney : 0;
  const price = offer.price > 0 ? offer.price : 0;
  return price > 0 ? (offer.earnestMoney / price) * 100 : 0;
}

/** Count of contingencies the buyer is keeping in the offer. */
export function includedContingencyCount(offer: Offer): number {
  return Object.values(offer.contingencies ?? {}).filter((c) => c?.included).length;
}

/**
 * Narrate offer strength from the terms. Pure + deterministic. Each note frames
 * a trade-off; none recommends a specific term, waiver, or price.
 */
export function explainOfferStrength(offer: Offer): OfferInsight[] {
  const insights: OfferInsight[] = [];

  if (!offer || offer.price <= 0) {
    return [
      {
        id: "empty",
        title: "Add your offer terms",
        body: "Enter a price and the rest of your terms to see what a seller tends to read as stronger or weaker.",
        tone: "info",
      },
    ];
  }

  // Earnest money — a bigger deposit signals commitment.
  const em = earnestPercent(offer);
  insights.push({
    id: "earnest",
    title: "Earnest money",
    body:
      em >= 2
        ? `Your earnest deposit is about ${em.toFixed(1)}% of the price — a solid show of commitment that sellers tend to read as serious.`
        : em >= 1
          ? `Your earnest deposit is about ${em.toFixed(1)}% of the price — within the common 1–3% range.`
          : `Your earnest deposit is about ${em.toFixed(1)}% of the price, on the light side of the common 1–3% range; a larger deposit can read as more committed (it's also more at risk if you default).`,
    tone: em >= 2 ? "strength" : em >= 1 ? "info" : "watch",
  });

  // Financing type — cash removes financing/appraisal risk for the seller.
  if (offer.financingType === "cash") {
    insights.push({
      id: "financing",
      title: "Cash offer",
      body: "A cash purchase removes financing and (often) appraisal risk for the seller, which is usually read as very strong — though you'll want proof of funds ready.",
      tone: "strength",
    });
  } else if (offer.financingType === "fha" || offer.financingType === "va") {
    insights.push({
      id: "financing",
      title: `${offer.financingType.toUpperCase()} financing`,
      body: `${offer.financingType.toUpperCase()} loans carry specific appraisal/condition standards that some sellers weigh against a conventional offer. You can still be competitive — strong earnest money and a clean timeline help. (Note: a seller can't lawfully reject you for your loan type in a way that violates fair-lending/financing rules.)`,
      tone: "info",
    });
  } else {
    insights.push({
      id: "financing",
      title: "Conventional financing",
      body: `With ${offer.downPaymentPercent}% down, conventional financing is familiar to most sellers. A higher down payment and a pre-approval letter strengthen how your financing reads.`,
      tone: offer.downPaymentPercent >= 20 ? "strength" : "info",
    });
  }

  // Contingencies — protection for you, but each is a way out the seller sees.
  const kept = includedContingencyCount(offer);
  insights.push({
    id: "contingencies",
    title: "Contingencies",
    body: `You're keeping ${kept} contingenc${kept === 1 ? "y" : "ies"}. Contingencies protect you (they're your off-ramps if something goes wrong), but a seller weighing competing offers sees each one as a way the deal could fall through. Whether to keep or shorten any of them is a decision for you and your attorney — there are real risks to waiving protections.`,
    tone: "info",
  });

  // Concession ask — normal, but a large ask can affect competitiveness.
  if (offer.concession?.type && offer.concession.type !== "none") {
    const p = offer.concession.percent || 0;
    insights.push({
      id: "concession",
      title: "Commission-savings / concession ask",
      body: `You're asking for about ${p}% as a ${offer.concession.type === "price-reduction" ? "price reduction" : "closing-cost credit"}. Post-NAR this is a legitimate ask, but a larger one can make a competitive offer read as lower net to the seller — weigh it against how hot the market is.`,
      tone: p > 3 ? "watch" : "info",
    });
  }

  return insights;
}
