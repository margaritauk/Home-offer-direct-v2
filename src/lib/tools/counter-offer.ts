/**
 * Counter-offer tracker math (issue #108).
 *
 * During negotiation the buyer logs each round of the back-and-forth (who, the
 * price, key term changes, the date, and the round's status). This module
 * derives the current "live" terms from the rounds so the buyer doesn't lose
 * the thread, and keeps the buyer's private walk-away max separate.
 *
 * IMPORTANT (guardrail, #108): facts only — no scripts that pressure the other
 * side. The walk-away max is a PRIVATE planning field; the UI reminds the buyer
 * to keep it to themselves and never share it.
 */

export type Party = "buyer" | "seller";

export type RoundStatus =
  | "sent"
  | "received"
  | "accepted"
  | "rejected"
  | "countered";

export const ROUND_STATUSES: readonly RoundStatus[] = [
  "sent",
  "received",
  "accepted",
  "rejected",
  "countered",
] as const;

export interface Round {
  id: string;
  /** Who made this round's move. */
  who: Party;
  /** The price on the table in this round, in dollars. */
  price: number;
  /** Key term / contingency / credit changes (facts only; screened in UI). */
  termChanges?: string;
  /** ISO date string for the round. */
  date: string;
  status: RoundStatus;
}

export interface CurrentTerms {
  /** The most recently logged round (chronologically last in the list), or null. */
  latest: Round | null;
  /** The live price = the price from the latest round, or null when none. */
  livePrice: number | null;
  /** The party who has the ball after the latest round, or null. */
  ballWith: Party | null;
  /** True when any round is accepted — the negotiation has landed. */
  accepted: boolean;
  /** True when any round is rejected and nothing later supersedes it. */
  rejected: boolean;
  /** Number of rounds logged. */
  roundCount: number;
}

/**
 * Derive the current state of the negotiation from the ordered list of rounds.
 * Rounds are taken in array order (the UI appends newest last). The "latest"
 * round drives the live price and whose turn it is:
 *  - accepted   → deal landed, nobody's turn
 *  - countered/sent by a party → the OTHER party has the ball
 *  - received   → the receiving party still owns the response
 *
 * Pure; returns nulls for an empty list so the UI can show an awaiting state.
 */
export function currentTerms(rounds: Round[]): CurrentTerms {
  if (rounds.length === 0) {
    return {
      latest: null,
      livePrice: null,
      ballWith: null,
      accepted: false,
      rejected: false,
      roundCount: 0,
    };
  }

  const latest = rounds[rounds.length - 1];
  const accepted = rounds.some((r) => r.status === "accepted");
  // Rejected only "sticks" if the final round is a rejection (a later counter
  // reopens the negotiation).
  const rejected = latest.status === "rejected";

  const livePrice = Number.isFinite(latest.price) && latest.price > 0 ? latest.price : null;

  let ballWith: Party | null;
  if (accepted || rejected) {
    ballWith = null;
  } else if (latest.status === "received") {
    // The party that received the move still owes a response.
    ballWith = latest.who;
  } else {
    // sent / countered by a party → the other party responds.
    ballWith = latest.who === "buyer" ? "seller" : "buyer";
  }

  return {
    latest,
    livePrice,
    ballWith,
    accepted,
    rejected,
    roundCount: rounds.length,
  };
}
