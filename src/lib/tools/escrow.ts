/**
 * Wire-fraud checklist + escrow tracker math (issue #107, trust-critical).
 *
 * Wire fraud is the single highest-dollar risk a self-serve buyer faces: a
 * scammer spoofs the title/escrow company's email and sends fake wiring
 * instructions right before closing. The ONLY reliable defense is a forced
 * verbal verification on an independently-obtained phone number. This module
 * models the verification checklist and a simple escrow-deposit tracker.
 *
 * IMPORTANT (guardrail, #107): this is a safety checklist, not a guarantee.
 * The UI keeps the wire-fraud warning prominent and never lets the "verified by
 * phone" step be implied — the buyer must actively confirm it.
 */

/** A single forced-verification checklist item. */
export interface ChecklistItem {
  id: string;
  /** What the buyer must do (facts only). */
  label: string;
  /** True once the buyer confirms they've done it. */
  done: boolean;
  /**
   * When true this is the load-bearing "verified by phone on an independently
   * verified number" step — the deal-saver. Surfaced separately in the UI.
   */
  critical?: boolean;
}

/** The canonical wire-fraud verification checklist. */
export const WIRE_FRAUD_CHECKLIST: ReadonlyArray<Omit<ChecklistItem, "done">> = [
  {
    id: "independent-number",
    label:
      "Look up the escrow/title company's phone number independently (from the signed contract or the company's official website) — NOT from any email or text.",
  },
  {
    id: "call-verbally",
    label:
      "Call that number and verbally confirm the wiring instructions (routing number, account number, and recipient) before sending anything.",
    critical: true,
  },
  {
    id: "ignore-emailed-changes",
    label:
      "Treat any emailed or texted change to wiring instructions as fraud until you re-verify it by phone on the independent number.",
  },
  {
    id: "confirm-receipt",
    label:
      "After wiring, call the escrow company again to confirm they received the exact amount.",
  },
];

export interface ChecklistStatus {
  total: number;
  completed: number;
  /** completed === total. */
  allComplete: boolean;
  /** The critical "verified by phone" step(s) are all checked. */
  criticalComplete: boolean;
  /** 0–100, rounded. */
  percent: number;
}

/**
 * Roll up checklist completion. The critical step is tracked separately so the
 * UI can keep warning the buyer until they've verbally verified, even if every
 * other box is ticked.
 */
export function checklistStatus(items: ChecklistItem[]): ChecklistStatus {
  const total = items.length;
  const completed = items.filter((i) => i.done).length;
  const criticalItems = items.filter((i) => i.critical);
  const criticalComplete =
    criticalItems.length > 0 && criticalItems.every((i) => i.done);
  return {
    total,
    completed,
    allComplete: total > 0 && completed === total,
    criticalComplete,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export type EscrowStatus = "not-sent" | "sent" | "confirmed";

export interface EscrowTracker {
  /** Earnest-money / wire amount in dollars. */
  amount: number;
  /** Escrow / title holder name (facts only). */
  holder: string;
  /** ISO date string the funds were sent, or "" if not sent. */
  dateSent: string;
  /** True once the holder verbally confirmed receipt. */
  confirmationReceived: boolean;
}

/**
 * Derive the escrow deposit's status from the tracker. "confirmed" requires the
 * holder to have verbally confirmed receipt; "sent" means a date was recorded
 * but receipt isn't yet confirmed; otherwise "not-sent".
 */
export function escrowStatus(tracker: EscrowTracker): EscrowStatus {
  if (tracker.confirmationReceived) return "confirmed";
  if (tracker.dateSent.trim() !== "") return "sent";
  return "not-sent";
}
