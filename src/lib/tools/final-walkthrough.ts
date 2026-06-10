/**
 * Final-walkthrough checklist data + helpers (issue #120, Wave C / C2).
 *
 * The final walkthrough is the buyer's last check 24–48 hours before closing.
 * This module supplies the STANDARD things every buyer should verify, plus a
 * pure helper that auto-lists the buyer's NEGOTIATED REPAIRS from the
 * repair-request tool so they can confirm each one was actually completed.
 *
 * IMPORTANT (guardrail, #120): this is an education/checklist aid, NOT a
 * substitute for your own walkthrough or your agent's. It does not screen text
 * (repair labels are already screened upstream in the repair-request tool).
 */

/** A single thing to verify at the walkthrough. Stable `id`, plain `label`. */
export interface WalkthroughItem {
  id: string;
  label: string;
}

/** Per-item status the buyer records during the walkthrough. */
export type WalkthroughStatus = "pass" | "fail" | "n-a";

/**
 * The standard things to verify at any final walkthrough. Ids are stable so
 * persisted statuses survive label edits. Education/checklist framing only.
 */
export const STANDARD_WALKTHROUGH_ITEMS: readonly WalkthroughItem[] = [
  {
    id: "systems-hvac",
    label: "Systems and HVAC turn on and are working (heat and A/C)",
  },
  {
    id: "water-runs",
    label: "Water runs at every faucet, toilets flush, and there are no leaks",
  },
  {
    id: "appliances",
    label: "All appliances that convey are present and working",
  },
  {
    id: "no-new-damage",
    label: "No new damage since the inspection (walls, floors, ceilings)",
  },
  {
    id: "agreed-repairs",
    label: "Agreed-upon repairs were completed (see auto-listed items below)",
  },
  {
    id: "nothing-removed",
    label: "Nothing that should stay was removed (fixtures, hardware, blinds)",
  },
  {
    id: "debris-removed",
    label: "Debris and the seller's belongings have been removed",
  },
  {
    id: "keys-remotes-codes",
    label: "Garage, keys, remotes, and codes all accounted for",
  },
  {
    id: "outlets-lights",
    label: "Outlets and lights work throughout the home",
  },
  {
    id: "windows-doors-lock",
    label: "Windows and doors open, close, and lock",
  },
] as const;

/** Loosely-typed shape of the repair-request tool's persisted value. */
interface RepairLike {
  id?: unknown;
  item?: unknown;
  resolution?: unknown;
}

interface RepairStateLike {
  items?: unknown;
}

/** Prefix used for walkthrough ids derived from a negotiated repair item. */
export const REPAIR_ITEM_PREFIX = "repair:";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Given the repair-request tool's persisted value, return the items the buyer
 * negotiated as REPAIRS (resolution === "repair") to verify at the walkthrough.
 *
 * Credits are excluded — they appear on the Closing Disclosure as money, not as
 * physical work, so there's nothing to "verify" at a walkthrough.
 *
 * Each returned item gets a `repair:<repairItemId>` id and a `label` taken from
 * the repair item's text. Pure and defensive: any missing/garbage shape yields
 * `[]`. Repair items without an id or with empty text are skipped.
 */
export function negotiatedRepairItems(repairState: unknown): WalkthroughItem[] {
  const state = repairState as RepairStateLike | null | undefined;
  const items = state?.items;
  if (!Array.isArray(items)) return [];

  const out: WalkthroughItem[] = [];
  for (const raw of items as RepairLike[]) {
    if (!raw || typeof raw !== "object") continue;
    if (raw.resolution !== "repair") continue;
    if (!isNonEmptyString(raw.id)) continue;
    if (!isNonEmptyString(raw.item)) continue;
    out.push({
      id: `${REPAIR_ITEM_PREFIX}${raw.id}`,
      label: raw.item.trim(),
    });
  }
  return out;
}
