/**
 * Negotiation playbook (I2).
 *
 * Education-only content + one pure helper, surfaced beside the Counter-offer
 * Tracker and on /tools/offer-help. It teaches how to READ a counter, anchoring
 * and concession concepts, the menu of non-price levers, repair-negotiation
 * leverage from the inspection summary, and walk-away discipline.
 *
 * HARD UPL RULE: principles + trade-offs, NEVER "counter at $X" or "ask for the
 * roof instead of a credit." Anything contractual routes to an attorney.
 * FHA: no personal-appeal / "love letter" tactics anywhere here.
 *
 * The walk-away discipline entry ties to the PRIVATE walk-away max the
 * Counter-offer Tracker already stores. That number is never exposed to outputs,
 * templates, or the seller side — this module only references the CONCEPT; the
 * helper here reads the inspection summary, not the walk-away value.
 *
 * Sources (Researcher brief, 2026-06-12): offer-process research §1.1,
 * market-research §1 step 6 (anchoring/concessions/repair leverage/walk-away;
 * longer-DOM/buyer's-market homes carry more buyer leverage — ties to A1).
 */

import type { FindingsSummary } from "./inspection";
import { formatUSD } from "@/lib/savings";

export interface PlaybookEntry {
  id: string;
  /** Short title of the move/principle. */
  title: string;
  /** What it is, in plain language. */
  body: string;
  /** The trade-off / caution that keeps it non-directive. */
  tradeoff: string;
}

/** How to read a counter + the timing/legal mechanics buyers miss. */
export const READING_A_COUNTER: PlaybookEntry[] = [
  {
    id: "read-the-counter",
    title: "Read a counter on price AND terms",
    body: "A counter rarely moves only the price. Compare it to your last offer line by line — price, contingencies, credits, dates, included items — so you see everything that changed, not just the number.",
    tradeoff:
      "A seller can give on price while taking back on terms (shorter contingencies, fewer credits). Map the whole picture before you react to the headline figure.",
  },
  {
    id: "counter-is-a-rejection",
    title: "A counter is a rejection of the prior offer",
    body: "Under most contract forms, countering rejects the offer it replies to. The earlier offer generally isn't yours to \"go back to\" once it's been countered — each counter starts a fresh round.",
    tradeoff:
      "Don't assume you can revive a number you've already countered away. Exactly how this works is form- and state-specific — confirm with your attorney before you rely on it.",
  },
  {
    id: "time-is-of-the-essence",
    title: "Mind the clock — counters expire",
    body: "Counters usually carry an expiration, and \"time is of the essence\" language makes deadlines binding. A counter can simply lapse if you don't respond in time.",
    tradeoff:
      "Letting a counter expire can end the negotiation, not pause it. Track the deadline and respond (or ask for an extension) before it runs.",
  },
];

/** Anchoring & concession concepts. */
export const ANCHORING_AND_CONCESSIONS: PlaybookEntry[] = [
  {
    id: "anchoring",
    title: "Anchoring",
    body: "The first number sets the reference point the rest of the negotiation moves around. An offer grounded in your comps and market read (not the asking price) anchors the conversation to value.",
    tradeoff:
      "Anchor too far from supportable value and you can stall the talks or signal you're not serious; anchor close and you keep less room to trade. Ground your anchor in facts, then decide your own number.",
  },
  {
    id: "concession-planning",
    title: "Plan concessions in advance",
    body: "Decide before you negotiate what you can give and what you need, and trade in steps rather than all at once. Giving a little, in exchange for something, reads better than a single large jump.",
    tradeoff:
      "Conceding fast or without a trade trains the other side to keep pushing. Trade deliberately — but never past your private walk-away number.",
  },
];

/** The menu of non-price levers, each with its trade-off. */
export const NON_PRICE_LEVERS: PlaybookEntry[] = [
  {
    id: "closing-possession-date",
    title: "Closing & possession date",
    body: "Matching the seller's preferred close or move-out date can be worth real money to them at no cash cost to you.",
    tradeoff:
      "A date that suits the seller may not suit your lease, loan lock, or move — make sure the timeline actually works for you before you offer it.",
  },
  {
    id: "rent-back",
    title: "Rent-back (post-closing occupancy)",
    body: "Letting the seller stay a short while after closing, usually for a fee, can make your offer the easy choice for a seller who hasn't lined up their next home.",
    tradeoff:
      "Rent-backs beyond roughly 60 days can raise loan/occupancy issues, and you take on landlord-style risk (damage, holdover, insurance). Put the terms in writing with your attorney and lender.",
  },
  {
    id: "as-is",
    title: "As-is terms",
    body: "An as-is offer tells the seller you won't ask them to make repairs. It can simplify their decision and speed the deal.",
    tradeoff:
      "As-is gives up repair leverage, but it does not necessarily waive your right to inspect or to withdraw — those are separate, form- and state-specific decisions to make carefully with your attorney. Don't conflate \"as-is\" with \"no inspection.\"",
  },
  {
    id: "earnest-money-size",
    title: "Earnest-money size",
    body: "A larger good-faith deposit signals commitment and can reassure a seller weighing similar offers.",
    tradeoff:
      "Earnest money is at risk if you default or step outside your contingencies — a bigger or non-refundable deposit raises what you could lose. Size it with your attorney, not by reflex.",
  },
  {
    id: "contingency-timelines",
    title: "Contingency timelines",
    body: "Shorter inspection, appraisal, or financing windows make your offer look lower-risk to a seller who wants certainty.",
    tradeoff:
      "Every day you trim is a day less to discover a problem and act on it. Keep enough runway to actually exercise the contingency — and remember each contingency is an exit you'd be shortening.",
  },
];

/** Walk-away discipline — tied to the tracker's private walk-away max. */
export const WALK_AWAY_DISCIPLINE: PlaybookEntry[] = [
  {
    id: "set-your-max-first",
    title: "Set your walk-away max before you negotiate",
    body: "Decide the most you'll pay — and the terms you won't cross — before the back-and-forth starts, while you're calm. The Counter-offer Tracker stores this as your private walk-away max.",
    tradeoff:
      "A number set mid-negotiation drifts with the adrenaline. Set it first, keep it to yourself, and let it govern your responses.",
  },
  {
    id: "keep-it-private",
    title: "Keep your walk-away number private",
    body: "Your walk-away max is a planning anchor for you alone. It is never shared with the seller or their agent, and it never goes into a counter, a script, or any document.",
    tradeoff:
      "The moment the other side learns your ceiling, you lose the room between the live price and your max. Once you'd have to cross it to keep the home, walking is a discipline, not a failure.",
  },
];

/**
 * Derive a NEUTRAL repair-negotiation note from the inspection summary. PURE.
 *
 * This explains the buyer's *leverage* in factual terms (how many flagged items,
 * the buyer's own estimated total) and contrasts the three mechanics — repair vs
 * closing-credit vs price-reduction — WITHOUT recommending one or naming a figure
 * to ask for. Returns a stable shape so the UI can render an empty state.
 *
 * Mechanics distinction (ties to J2): a closing CREDIT is capped by lender
 * seller-credit limits and helps cash-to-close; a PRICE REDUCTION lowers the
 * loan basis but still needs appraisal support; an actual REPAIR fixes the issue
 * but adds timeline/quality risk. We never say which to choose.
 */
export interface RepairLeverageNote {
  /** True when there is anything to negotiate from. */
  hasLeverage: boolean;
  /** Plain-English lines — facts + mechanics, never a directive or a figure-to-ask. */
  lines: string[];
}

export function summarizeRepairLeverage(
  summary: FindingsSummary | null | undefined,
): RepairLeverageNote {
  if (!summary || summary.total === 0) {
    return {
      hasLeverage: false,
      lines: [
        "Log your inspection findings first — your repair-negotiation leverage comes from documented issues, not opinions.",
      ],
    };
  }

  const lines: string[] = [];
  lines.push(
    `You've logged ${summary.total} finding${summary.total === 1 ? "" : "s"}` +
      (summary.flaggedCount > 0
        ? `, ${summary.flaggedCount} of them major or safety items.`
        : "."),
  );

  if (summary.totalEstCost > 0) {
    lines.push(
      `Your own estimated total to address them is ${formatUSD(
        summary.totalEstCost,
      )} — documented findings (and your estimates) are the factual basis a seller weighs, far stronger than a round number.`,
    );
  }

  if (summary.hasMajorOrSafety) {
    lines.push(
      "Major and safety items carry the most weight, because they affect financing, insurability, and the next buyer too if this deal falls through.",
    );
  }

  lines.push(
    "Three mechanics do different things: a repair fixes the issue but adds timeline and workmanship risk; a closing credit frees up your cash-to-close but is capped by your lender's seller-credit limit; a price reduction lowers your loan basis but still has to appraise. Which to seek — and how much — is your call to make with your attorney; we never put a number in your mouth.",
  );

  return { hasLeverage: true, lines };
}
