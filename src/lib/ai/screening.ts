/**
 * Fair-Housing-safe boundary around any AI offer feature (issue #35).
 *
 * This is the FHA guardrail FOUNDATION for the future AI offer-strength
 * explainer (#36). It contains NO AI calls — only:
 *
 *   (a) ALLOWLIST — the explicit, hard-coded set of {@link Offer} fields the AI
 *       is ever allowed to see, plus `buildSafeAiInput` which projects an offer
 *       down to exactly those fields and nothing else. We never collect, infer,
 *       or pass through demographic / personal information.
 *   (b) screenText — scrubs free-text inputs of protected-class signals before
 *       any text reaches the model.
 *   (c) screenOutput — a final gate that rejects model responses that reference
 *       protected classes or read like a "love letter" personal appeal.
 *
 * Fair Housing liability stays with us (HUD), so the screens are intentionally
 * conservative: when in doubt, strip or reject. Per epic #33 every AI story must
 * "never collect/infer protected class; screen inputs and outputs; no love
 * letters."
 */

import type { ContingencyId } from "@/lib/offer/contingencies";
import type {
  ClosingCostPreference,
  ConcessionType,
  FinancingType,
  Offer,
} from "@/lib/offer/types";

/**
 * The HARD ALLOWLIST of {@link Offer} keys the AI may ever read. This is an
 * allowlist (not a denylist) on purpose: any field added to the offer model in
 * the future is excluded by default until someone deliberately adds it here and
 * confirms it carries no protected-class signal.
 *
 * These are all transaction terms / market facts:
 *   - price, earnest money, financing type & down payment
 *   - closing timeline / possession
 *   - contingencies and the commission-savings ask
 *
 * Deliberately EXCLUDED (and there are none in the current model, but this keeps
 * the intent explicit): anything naming or implying a buyer's race, color,
 * religion, national origin, sex, familial status, disability, age, marital
 * status, source of income, or similar.
 */
export const AI_INPUT_ALLOWLIST = [
  "price",
  "earnestMoney",
  "isPercent",
  "financingType",
  "downPaymentPercent",
  "closingDate",
  "possession",
  "closingCostPreference",
  "contingencies",
  "concession",
] as const satisfies readonly (keyof Offer)[];

export type AiInputAllowedKey = (typeof AI_INPUT_ALLOWLIST)[number];

/**
 * A market/state fact the AI may be grounded with. Kept separate from the offer
 * so the calling code (#36) supplies only neutral, public facts (e.g. "CA",
 * median days on market) — never anything tied to the buyer as a person.
 */
export interface MarketFacts {
  /** Two-letter US state code for the transaction. */
  state?: string;
  /** Free-text neutral market context (e.g. "low inventory"). Screened. */
  marketNotes?: string;
}

/**
 * The exact, allowlisted shape handed to the model. Anything not on this type
 * literally cannot reach the AI because {@link buildSafeAiInput} only ever
 * constructs this object.
 */
export interface SafeAiInput {
  price: number;
  earnestMoney: number;
  isPercent: boolean;
  financingType: FinancingType;
  downPaymentPercent: number;
  closingDate: string;
  possession: string;
  closingCostPreference: ClosingCostPreference;
  contingencies: Record<ContingencyId, { included: boolean; days: number }>;
  concession: { type: ConcessionType; percent: number };
  market?: MarketFacts;
}

/**
 * Project an {@link Offer} down to ONLY the allowlisted fields, screening every
 * free-text field on the way through. Anything off-allowlist (e.g. `updatedAt`,
 * or any future demographic field) is dropped — it never appears on the result.
 *
 * Free-text fields (`possession`, market notes) are passed through
 * {@link screenText} so protected-class signals are stripped before the model
 * sees them. Note `fixturesIncluded` / `fixturesExcluded` are intentionally NOT
 * on the allowlist: they are free text that could smuggle in personal signals
 * and the AI explainer does not need them.
 */
export function buildSafeAiInput(offer: Offer, market?: MarketFacts): SafeAiInput {
  const safe: SafeAiInput = {
    price: offer.price,
    earnestMoney: offer.earnestMoney,
    isPercent: offer.isPercent,
    financingType: offer.financingType,
    downPaymentPercent: offer.downPaymentPercent,
    closingDate: offer.closingDate,
    possession: screenText(offer.possession).text,
    closingCostPreference: offer.closingCostPreference,
    contingencies: Object.fromEntries(
      Object.entries(offer.contingencies).map(([id, sel]) => [
        id,
        { included: sel.included, days: sel.days },
      ]),
    ) as SafeAiInput["contingencies"],
    concession: { type: offer.concession.type, percent: offer.concession.percent },
  };

  if (market) {
    safe.market = {
      ...(market.state ? { state: market.state } : {}),
      ...(market.marketNotes
        ? { marketNotes: screenText(market.marketNotes).text }
        : {}),
    };
  }

  return safe;
}

/**
 * Patterns that signal a protected class under the Fair Housing Act (and common
 * extensions). Grouped by class for auditability. These are deliberately broad —
 * for an FHA guardrail, false positives (over-stripping) are far safer than a
 * missed signal. `\b` word boundaries keep us from matching inside unrelated
 * words.
 */
const PROTECTED_CLASS_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "race/color",
    pattern:
      /\b(race|racial|black|white|caucasian|african[\s-]?american|asian|hispanic|latino|latina|latinx|indigenous|native[\s-]?american|skin[\s-]?colou?r|interracial|ethnic(?:ity)?|biracial)\b/i,
  },
  {
    label: "religion",
    pattern:
      /\b(religion|religious|christian|catholic|protestant|baptist|evangelical|jewish|jew|judaism|muslim|islam(?:ic)?|hindu|buddhist|sikh|atheist|church|mosque|synagogue|temple|faith[\s-]?based|god[\s-]?fearing)\b/i,
  },
  {
    label: "national origin",
    pattern:
      /\b(national[\s-]?origin|nationality|immigrant|foreign(?:er)?|citizenship|undocumented|country[\s-]?of[\s-]?origin|accent|english[\s-]?as[\s-]?a[\s-]?second[\s-]?language|esl)\b/i,
  },
  {
    label: "familial status",
    pattern:
      /\b(famil(?:y|ial)[\s-]?status|kids?|children|childless|pregnan(?:t|cy)|expecting[\s-]?a[\s-]?baby|newborn|toddler|single[\s-]?(?:mom|mother|dad|father|parent)|household[\s-]?of)\b/i,
  },
  {
    label: "disability",
    pattern:
      /\b(disabilit(?:y|ies)|disabled|handicap(?:ped)?|wheelchair|mobility[\s-]?impair(?:ed|ment)|service[\s-]?animal|emotional[\s-]?support[\s-]?animal|blind|deaf|mental[\s-]?(?:illness|health[\s-]?condition)|special[\s-]?needs)\b/i,
  },
  {
    label: "sex/gender/sexual orientation",
    pattern:
      /\b(gender|transgender|trans|nonbinary|non[\s-]?binary|sexual[\s-]?orientation|gay|lesbian|bisexual|lgbtq?\+?|homosexual|heterosexual|man|woman|male|female)\b/i,
  },
  {
    label: "marital status",
    pattern: /\b(marital[\s-]?status|married|unmarried|divorced|widow(?:ed|er)?|spouse|newlywed)\b/i,
  },
  {
    label: "age",
    pattern: /\b(\d{1,3}[\s-]?years?[\s-]?old|elderly|senior[\s-]?citizen|retiree|young[\s-]?couple|age[\s-]?\d{1,3})\b/i,
  },
  {
    label: "source of income",
    pattern:
      /\b(section[\s-]?8|housing[\s-]?(?:voucher|choice)|welfare|public[\s-]?assistance|snap[\s-]?benefits|food[\s-]?stamps|disability[\s-]?income|ssi|ssdi)\b/i,
  },
];

/**
 * Cues that an output reads like a "love letter" — a personal appeal to the
 * seller. Even with no protected-class word, love letters invite Fair Housing
 * liability (the seller may infer protected class), so we block them outright.
 */
const LOVE_LETTER_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "love-letter appeal",
    pattern:
      /\b(dear[\s-]?seller|we[\s-]?(?:fell|are[\s-]?)?in[\s-]?love[\s-]?with|love[\s-]?letter|our[\s-]?(?:dream[\s-]?home|forever[\s-]?home)|raise[\s-]?(?:our|a)[\s-]?family|grow[\s-]?our[\s-]?family|imagine[\s-]?(?:our|my)[\s-]?(?:kids|children|family)|make[\s-]?(?:lifelong[\s-]?)?memories|perfect[\s-]?for[\s-]?(?:our|my)[\s-]?family|please[\s-]?(?:choose|pick|select)[\s-]?us|from[\s-]?the[\s-]?bottom[\s-]?of[\s-]?(?:our|my)[\s-]?heart)\b/i,
  },
];

/**
 * UPL DIRECTIVE-PRICE patterns (S7-AI2). The A2 price-band + offer explainers
 * narrate a RANGE the buyer decides from — they must NEVER emit a directive to
 * offer/bid/pay a specific number ("offer $X", "you should offer 400k", "bid
 * $410,000", "I'd offer $X"). These match a directive VERB immediately tied to a
 * dollar figure, which is the unauthorized-practice line. They deliberately do
 * NOT match neutral narration of a range ("comps suggest $380,000–$420,000") or
 * a fact ("the asking price is $400,000"), because no offer/bid/pay directive
 * precedes the number there.
 */
const DIRECTIVE_PRICE_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "directive price ('offer $X')",
    // <directive verb> ... <money>  — verb and the number within a few words.
    pattern:
      /\b(offer|bid|pay|propose|counter|come\s+in\s+at|go\s+(?:up\s+)?to|put\s+in)\b[^.$\n]{0,40}\$?\s?\d{1,3}(?:[,\d]{2,}|(?:\.\d+)?\s?[km])\b/i,
  },
  {
    label: "directive price ('offer $X')",
    // "offer/bid/pay a price of $X", "should offer $X"
    pattern:
      /\b(should|recommend|suggest\s+you|advise\s+you\s+to|i['’]?d|we['’]?d|you\s+must|you\s+ought\s+to)\b[^.$\n]{0,30}\b(offer|bid|pay|propose|counter)\b/i,
  },
];

/** What we replace a stripped protected-class match with. */
const REDACTION = "[removed]";

export interface ScreenTextResult {
  /** The input with any protected-class signals replaced by {@link REDACTION}. */
  text: string;
  /** True when at least one signal was found and stripped. */
  flagged: boolean;
  /** The protected-class labels that matched, for logging/audit (deduped). */
  matchedClasses: string[];
}

/**
 * Screen a free-text INPUT: strip any protected-class signal so it can never
 * reach the model. Returns the scrubbed text plus an audit of what matched.
 * Safe on empty/whitespace input.
 */
export function screenText(input: string): ScreenTextResult {
  if (!input || input.trim() === "") {
    return { text: input ?? "", flagged: false, matchedClasses: [] };
  }

  let text = input;
  const matched = new Set<string>();

  for (const { label, pattern } of PROTECTED_CLASS_PATTERNS) {
    // Global, case-insensitive clone so we can replace every occurrence.
    const global = new RegExp(pattern.source, "gi");
    if (global.test(text)) {
      matched.add(label);
      text = text.replace(new RegExp(pattern.source, "gi"), REDACTION);
    }
  }

  return { text, flagged: matched.size > 0, matchedClasses: [...matched] };
}

export interface ScreenOutputResult {
  /** True when the output is clear to show to the user. */
  safe: boolean;
  /** Human-readable reason when `safe` is false. */
  reason?: string;
  /** The matched class/love-letter labels, for audit. */
  matchedClasses?: string[];
}

/**
 * Final OUTPUT gate (#35 AC3). Unlike {@link screenText}, this does NOT redact —
 * a model response that references a protected class or makes a love-letter-style
 * personal appeal is rejected wholesale so it never reaches the buyer. The
 * caller (#36) is expected to drop or regenerate a rejected response.
 */
export function screenOutput(text: string): ScreenOutputResult {
  if (!text || text.trim() === "") {
    return { safe: true };
  }

  const matched = new Set<string>();
  for (const { label, pattern } of PROTECTED_CLASS_PATTERNS) {
    if (pattern.test(text)) matched.add(label);
  }
  for (const { label, pattern } of LOVE_LETTER_PATTERNS) {
    if (pattern.test(text)) matched.add(label);
  }
  // UPL: reject any directive to offer/bid/pay a specific price (S7-AI2).
  for (const { label, pattern } of DIRECTIVE_PRICE_PATTERNS) {
    if (pattern.test(text)) matched.add(label);
  }

  if (matched.size > 0) {
    return {
      safe: false,
      reason: `Blocked: response referenced protected-class, personal-appeal, or directive-price content (${[...matched].join(", ")}).`,
      matchedClasses: [...matched],
    };
  }

  return { safe: true };
}
