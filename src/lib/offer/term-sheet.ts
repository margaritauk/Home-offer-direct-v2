/**
 * Pure helpers that turn an {@link Offer} into a structured / plain-text
 * term-sheet summary (issues #12 and #14).
 *
 * UPL guardrail (#17): the output is a WORKSHEET — a neutral summary of the
 * values the buyer entered, to hand to their own attorney. It is never a
 * ready-to-sign contract and it never advises which terms to choose. The
 * disclaimer below is part of every structured summary.
 */

import { calculateSavings, formatUSD } from "@/lib/savings";
import { CONTINGENCIES, getContingency } from "./contingencies";
import type { ConcessionType, FinancingType, Offer } from "./types";

/** The persistent disclaimer that accompanies every term-sheet output (#17). */
export const TERM_SHEET_DISCLAIMER =
  "This is a worksheet to review with your attorney — not a binding contract. It is educational only, not legal advice, and is subject to attorney review.";

const FINANCING_LABELS: Record<FinancingType, string> = {
  conventional: "Conventional loan",
  fha: "FHA loan",
  va: "VA loan",
  cash: "Cash (no financing)",
};

const CONCESSION_LABELS: Record<ConcessionType, string> = {
  "price-reduction": "Price reduction",
  "closing-credit": "Closing-cost credit",
  none: "No concession requested",
};

/** Resolve the earnest money to a concrete dollar figure. */
export function earnestMoneyDollars(offer: Offer): number {
  const price = Number.isFinite(offer.price) && offer.price > 0 ? offer.price : 0;
  if (offer.isPercent) {
    return price * (offer.earnestMoney / 100);
  }
  return Number.isFinite(offer.earnestMoney) ? offer.earnestMoney : 0;
}

/**
 * The dollars at stake in the commission-savings / seller-concession ask
 * (issue #14). Reuses {@link calculateSavings} so the math matches the savings
 * calculator: the concession percent is treated as the buyer-side commission on
 * the table, captured in full.
 */
export function concessionAtStake(offer: Offer): number {
  if (offer.concession.type === "none") return 0;
  const { capturedSavings } = calculateSavings({
    homePrice: offer.price,
    downPaymentPercent: offer.downPaymentPercent,
    buyerCommissionPercent: offer.concession.percent,
    captureRatePercent: 100,
    closingCostPercent: 0,
  });
  return capturedSavings;
}

/**
 * Adaptable, non-personalized script language for the concession ask (#14).
 * Templated/educational wording only — "subject to attorney review".
 */
export function concessionScript(offer: Offer): string {
  if (offer.concession.type === "none") return "";
  const amount = formatUSD(concessionAtStake(offer));
  const framing =
    offer.concession.type === "price-reduction"
      ? `a ${offer.concession.percent}% reduction in the purchase price (about ${amount})`
      : `a closing-cost credit of about ${amount} (${offer.concession.percent}% of the price)`;
  return (
    `Because I'm an unrepresented buyer, there is no buyer-side commission to ` +
    `pay on this purchase. I'd like to put that savings toward the deal in the ` +
    `form of ${framing}. I'm happy to have my attorney put this in writing for ` +
    `your review.`
  );
}

export interface TermSheetLine {
  label: string;
  value: string;
}

export interface TermSheetSection {
  heading: string;
  lines: TermSheetLine[];
}

export interface TermSheet {
  sections: TermSheetSection[];
  disclaimer: string;
}

function dash(value: string): string {
  return value.trim() === "" ? "—" : value;
}

/** Build the structured term-sheet summary used by the on-screen view. */
export function buildTermSheet(offer: Offer): TermSheet {
  const downPaymentDollars = offer.price * (offer.downPaymentPercent / 100);

  const priceSection: TermSheetSection = {
    heading: "Price & deposit",
    lines: [
      { label: "Purchase price", value: formatUSD(offer.price) },
      {
        label: "Earnest money deposit",
        value: offer.isPercent
          ? `${formatUSD(earnestMoneyDollars(offer))} (${offer.earnestMoney}% of price)`
          : formatUSD(earnestMoneyDollars(offer)),
      },
    ],
  };

  const financingSection: TermSheetSection = {
    heading: "Financing",
    lines: [
      { label: "Financing type", value: FINANCING_LABELS[offer.financingType] },
      ...(offer.financingType === "cash"
        ? []
        : [
            {
              label: "Down payment",
              value: `${offer.downPaymentPercent}% (${formatUSD(downPaymentDollars)})`,
            },
          ]),
    ],
  };

  const datesSection: TermSheetSection = {
    heading: "Dates & possession",
    lines: [
      { label: "Closing date", value: dash(offer.closingDate) },
      { label: "Possession", value: dash(offer.possession) },
    ],
  };

  const propertySection: TermSheetSection = {
    heading: "Fixtures & cost allocation",
    lines: [
      { label: "Fixtures included", value: dash(offer.fixturesIncluded) },
      { label: "Fixtures excluded", value: dash(offer.fixturesExcluded) },
      {
        label: "Closing costs",
        value:
          offer.closingCostPreference === "buyer-pays"
            ? "Buyer pays their own"
            : offer.closingCostPreference === "seller-credit"
              ? "Asking for a seller credit"
              : "Split per local custom",
      },
    ],
  };

  const contingencySection: TermSheetSection = {
    heading: "Contingencies",
    lines: CONTINGENCIES.map((c) => {
      const sel = offer.contingencies[c.id];
      return {
        label: c.label,
        value:
          sel && sel.included
            ? `Included — ${sel.days} day window`
            : "Not included (waived)",
      };
    }),
  };

  const sections: TermSheetSection[] = [
    priceSection,
    financingSection,
    datesSection,
    propertySection,
    contingencySection,
  ];

  if (offer.concession.type !== "none") {
    sections.push({
      heading: "Commission-savings ask",
      lines: [
        {
          label: "Ask type",
          value: CONCESSION_LABELS[offer.concession.type],
        },
        {
          label: "Amount at stake",
          value: `${formatUSD(concessionAtStake(offer))} (${offer.concession.percent}% of price)`,
        },
      ],
    });
  }

  return { sections, disclaimer: TERM_SHEET_DISCLAIMER };
}

/** Render the structured term-sheet as plain text (for copy / attorney handoff). */
export function termSheetToText(offer: Offer): string {
  const sheet = buildTermSheet(offer);
  const body = sheet.sections
    .map((section) => {
      const lines = section.lines
        .map((l) => `  ${l.label}: ${l.value}`)
        .join("\n");
      return `${section.heading}\n${lines}`;
    })
    .join("\n\n");

  const concession = concessionScript(offer);
  const scriptBlock = concession ? `\n\nSuggested ask (adapt with your attorney):\n  ${concession}` : "";

  return `OFFER WORKSHEET\n\n${sheet.disclaimer}\n\n${body}${scriptBlock}`;
}

// Re-export so the wizard can show the at-stake amount without a second import.
export { getContingency };
