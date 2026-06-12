/**
 * "Should I go solo?" decision aid (J1).
 *
 * A balanced, non-scored reflection tool. The buyer checks the stake-factors
 * that apply to their purchase; we tally how many higher-stakes factors are in
 * play and surface a TWO-SIDED read — never a verdict. The product champions
 * buying unrepresented AND is honest about when many buyers choose to bring in a
 * flat-fee/hourly attorney or agent.
 *
 * Compliance (UPL): this is education, not legal advice. The output is framed as
 * "many buyers in your situation choose to…", never "you must hire a lawyer" or a
 * directive to waive anything. Pure functions only — fully unit-testable.
 */

export interface SoloFactor {
  id: string;
  /** Plain-English label for the checklist. */
  label: string;
  /** Why this raises the stakes — a neutral trade-off, not a directive. */
  why: string;
}

/**
 * Stake-factors where many self-representing buyers bring in targeted help.
 * Checking a factor never produces a directive; it raises the "consider help"
 * count and surfaces the trade-off.
 */
export const SOLO_FACTORS: readonly SoloFactor[] = [
  {
    id: "complex-title",
    label: "Complex or clouded title (liens, easements, boundary questions)",
    why: "Title problems can be expensive to unwind; many buyers have an attorney review the commitment.",
  },
  {
    id: "unusual-financing",
    label: "Unusual financing (seller financing, assumptions, contingencies)",
    why: "Non-standard financing terms add contract complexity others often run past a professional.",
  },
  {
    id: "hot-multiple-offer",
    label: "Hot, multiple-offer market",
    why: "Fast-moving bidding can pressure you into terms; some buyers want a second set of eyes.",
  },
  {
    id: "new-construction",
    label: "New construction with a builder contract",
    why: "Builder contracts are drafted in the builder's favor and are long; many buyers have them reviewed.",
  },
  {
    id: "probate-short-sale-reo",
    label: "Probate, short-sale, REO, or auction purchase",
    why: "These come with extra parties, timelines, and as-is terms that many buyers get help navigating.",
  },
  {
    id: "inherited-trust",
    label: "Inherited or trust-held property",
    why: "Ownership and signing authority can be complicated; an attorney often confirms the chain.",
  },
  {
    id: "major-rehab-as-is",
    label: "Major rehab / as-is purchase",
    why: '"As-is" doesn\'t necessarily waive your right to inspect; the scope is worth understanding fully.',
  },
  {
    id: "low-time-confidence",
    label: "Limited time or confidence to manage the details yourself",
    why: "Self-representation is a real time commitment; some buyers prefer hourly help to stay on top of it.",
  },
] as const;

const FACTOR_IDS = new Set(SOLO_FACTORS.map((f) => f.id));

export type SoloBand = "solo-reasonable" | "consider-help";

export interface GoSoloSummary {
  /** Count of recognized higher-stakes factors selected. */
  elevated: number;
  /** The two-sided read band (never a hard verdict). */
  band: SoloBand;
  /** Plain-English notes for each selected factor (the trade-offs). */
  notes: string[];
  /** Headline two-sided read string. */
  headline: string;
}

/**
 * Tally selected factors into a neutral, two-sided read. Tally only — no
 * recommendation. Unknown ids are ignored. With nothing selected the band is the
 * neutral "solo reasonable" default; any selected factor moves it to
 * "consider-help" framing (still phrased as a choice many buyers make).
 */
export function summarizeGoSolo(selected: string[]): GoSoloSummary {
  const valid = selected.filter((id) => FACTOR_IDS.has(id));
  const elevated = new Set(valid).size;
  const notes = SOLO_FACTORS.filter((f) => valid.includes(f.id)).map(
    (f) => f.why,
  );

  if (elevated === 0) {
    return {
      elevated,
      band: "solo-reasonable",
      notes,
      headline:
        "Going solo is reasonable for many straightforward purchases. Here's how to tell when bringing in targeted help is worth it.",
    };
  }

  return {
    elevated,
    band: "consider-help",
    notes,
    headline:
      elevated === 1
        ? "One higher-stakes factor applies. Many buyers in your situation still self-represent, while bringing in a flat-fee or hourly attorney for the parts that matter."
        : `Several higher-stakes factors apply (${elevated}). Many buyers in your situation bring in a flat-fee or hourly attorney for the contract while still self-representing elsewhere — it's a choice, not a requirement.`,
  };
}
