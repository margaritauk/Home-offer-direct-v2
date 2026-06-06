import type { ClosingPath, DisclosureRegime } from "./types";

/** Human-readable label + short description for each closing path. */
export const closingPathLabels: Record<
  ClosingPath,
  { label: string; short: string }
> = {
  attorney: {
    label: "Attorney state",
    short: "A real estate attorney must conduct or oversee your closing.",
  },
  escrow: {
    label: "Escrow / title-company state",
    short: "A title or escrow company handles closing — no attorney required.",
  },
  either: {
    label: "Attorney or escrow",
    short: "Both models are common here; it can vary by region or deal.",
  },
};

export const disclosureRegimeLabels: Record<
  DisclosureRegime,
  { label: string; short: string }
> = {
  "statutory-form": {
    label: "Mandatory disclosure form",
    short: "The seller must complete a specific state-mandated disclosure form.",
  },
  "written-disclosure": {
    label: "Written disclosure required",
    short: "The seller must disclose known defects in writing.",
  },
  limited: {
    label: "Limited disclosure",
    short:
      "Disclosure duties are limited (caveat emptor leaning) — inspect carefully.",
  },
};
