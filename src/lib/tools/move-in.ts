/**
 * Move-in & post-purchase tracker data + helpers (issue #122, Wave C / C4).
 *
 * After closing, a new owner has a flurry of first-weeks tasks: turn on
 * utilities, file a homestead exemption, change the locks, set up the mortgage
 * payment and maintenance reminders, and make sure the key closing documents are
 * stored somewhere safe. This module supplies the standard task list (grouped by
 * category) plus the "doc vault" items to confirm.
 *
 * GUARDRAIL (#122): education/checklist only. Homestead/tax items vary by state
 * and are flagged as "if your state offers it" — not tax or legal advice.
 * Pure data + a tiny grouping helper; no I/O.
 */

export type MoveInCategory =
  | "Utilities & services"
  | "Money & address"
  | "Security & safety"
  | "Maintenance";

/** A single post-purchase task. Stable `id` so checked state survives edits. */
export interface MoveInItem {
  id: string;
  category: MoveInCategory;
  label: string;
}

/** The standard move-in / post-purchase task list. */
export const MOVE_IN_ITEMS: readonly MoveInItem[] = [
  // Utilities & services
  {
    id: "utilities-transfer",
    category: "Utilities & services",
    label:
      "Transfer or start utilities in your name (electric, gas, water/sewer, trash)",
  },
  {
    id: "internet",
    category: "Utilities & services",
    label: "Set up internet / cable and schedule any install",
  },
  {
    id: "insurance-active",
    category: "Money & address",
    label: "Confirm your homeowner's insurance policy is active as of closing",
  },
  // Money & address
  {
    id: "homestead",
    category: "Money & address",
    label:
      "File a homestead exemption if your state offers one (can lower property tax) — check your county/assessor",
  },
  {
    id: "mortgage-autopay",
    category: "Money & address",
    label:
      "Set up your mortgage payment / autopay (first payment is usually due ~30–60 days after closing)",
  },
  {
    id: "update-address",
    category: "Money & address",
    label:
      "Update your address: USPS forwarding, driver's license, voter registration, banks, employer",
  },
  // Security & safety
  {
    id: "change-locks",
    category: "Security & safety",
    label: "Change the locks or rekey, and reset garage/keypad codes",
  },
  {
    id: "shutoffs",
    category: "Security & safety",
    label: "Locate the water shutoff, electrical panel, and gas shutoff",
  },
  {
    id: "detectors",
    category: "Security & safety",
    label: "Test smoke and carbon-monoxide detectors; replace batteries",
  },
  // Maintenance
  {
    id: "maintenance-reminders",
    category: "Maintenance",
    label:
      "Set seasonal maintenance reminders (HVAC filters, gutters, water heater, detectors)",
  },
] as const;

/** Documents to confirm are stored safely in the buyer's records ("doc vault"). */
export const DOC_VAULT_ITEMS: readonly MoveInItem[] = [
  { id: "doc-deed", category: "Money & address", label: "Recorded deed" },
  { id: "doc-cd", category: "Money & address", label: "Closing Disclosure" },
  {
    id: "doc-title",
    category: "Money & address",
    label: "Owner's title insurance policy",
  },
  {
    id: "doc-insurance",
    category: "Money & address",
    label: "Homeowner's insurance policy + declarations page",
  },
  {
    id: "doc-inspection",
    category: "Money & address",
    label: "Inspection report and any repair agreements",
  },
] as const;

/** The category order used for grouping in the UI. */
export const MOVE_IN_CATEGORY_ORDER: readonly MoveInCategory[] = [
  "Utilities & services",
  "Money & address",
  "Security & safety",
  "Maintenance",
];

/** Group the move-in items by category, preserving {@link MOVE_IN_CATEGORY_ORDER}. */
export function groupByCategory(
  items: readonly MoveInItem[],
): { category: MoveInCategory; items: MoveInItem[] }[] {
  return MOVE_IN_CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);
}
