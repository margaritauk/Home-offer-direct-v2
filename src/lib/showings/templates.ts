/**
 * Fair-Housing-safe message templates for an unrepresented buyer contacting a
 * listing agent (issue #18).
 *
 * GUARDRAIL (Fair Housing, issue #22): these templates deal ONLY in property
 * and transaction facts. They intentionally do NOT contain — and the
 * placeholder set is asserted in tests to never contain — any field that would
 * solicit or volunteer protected-class information (race, color, religion, sex,
 * national origin, familial status, disability, age, etc.). There is no buyer
 * "love letter" template here, by design (a documented FHA liability).
 *
 * They also avoid negotiation tells: templates nudge the buyer to attach a
 * pre-approval / proof of funds (signals seriousness) but never reveal a budget
 * ceiling, urgency, or financial strength.
 */

/**
 * The complete, closed set of fill-in fields a template may use. Every entry is
 * a neutral property/transaction fact. Adding a new placeholder requires a
 * deliberate edit here — keep it Fair-Housing-safe.
 */
export const TEMPLATE_PLACEHOLDERS = [
  "agentName",
  "address",
  "mlsNumber",
  "dateOptions",
  "timeOptions",
  "buyerName",
] as const;

export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

export type TemplateValues = Partial<Record<TemplatePlaceholder, string>>;

export interface MessageTemplate {
  id: string;
  /** Short label for the picker UI. */
  label: string;
  /** One-line description of when to use it. */
  description: string;
  /** Body with `{placeholder}` tokens drawn from {@link TEMPLATE_PLACEHOLDERS}. */
  body: string;
}

export const messageTemplates: MessageTemplate[] = [
  {
    id: "request-showing",
    label: "Request a showing",
    description:
      "Ask the listing agent to schedule a tour. Mentions pre-approval / proof of funds to show you're serious.",
    body: [
      "Hi {agentName},",
      "",
      "I'm an unrepresented buyer interested in {address} (MLS #{mlsNumber}). I'm pre-approved for financing (letter attached) / have proof of funds available.",
      "",
      "Could we schedule a showing? I'm available {dateOptions} around {timeOptions}. I'd also appreciate a copy of the seller's disclosures.",
      "",
      "Thank you,",
      "{buyerName}",
    ].join("\n"),
  },
  {
    id: "ask-about-property",
    label: "Ask about the property",
    description:
      "Factual questions a listing agent can answer for a customer (days on market, what conveys, known issues).",
    body: [
      "Hi {agentName},",
      "",
      "I'm interested in {address} (MLS #{mlsNumber}) and had a few factual questions before a showing:",
      "",
      "- How long has it been on the market?",
      "- What fixtures and appliances convey with the sale?",
      "- Are there any known issues or recent repairs/upgrades?",
      "- Roughly what are the typical utility costs?",
      "",
      "Thanks for your help,",
      "{buyerName}",
    ].join("\n"),
  },
  {
    id: "follow-up",
    label: "Follow up",
    description:
      "Polite nudge after an earlier message went unanswered. No urgency tells.",
    body: [
      "Hi {agentName},",
      "",
      "Following up on my note about {address} (MLS #{mlsNumber}). I'm still interested and would like to arrange a showing when convenient — I can do {dateOptions}.",
      "",
      "Happy to share my pre-approval letter / proof of funds. Thanks again,",
      "{buyerName}",
    ].join("\n"),
  },
  {
    id: "open-house-intro",
    label: "Open-house intro",
    description:
      "A short, factual introduction to use when you arrive at an open house.",
    body: [
      "Hi {agentName}, I'm {buyerName} — an unrepresented buyer here to see {address}. I'm pre-approved / have proof of funds. Could you point me to the seller's disclosures and let me know what conveys with the home? Thank you.",
    ].join("\n"),
  },
];

/** Look up a template by id. */
export function getTemplate(id: string): MessageTemplate | undefined {
  return messageTemplates.find((t) => t.id === id);
}

/**
 * Pure interpolation: replaces every `{placeholder}` token in `body` with the
 * matching value. Unknown/empty values fall back to a bracketed prompt so the
 * buyer can see exactly what is left to fill in (e.g. `[address]`). Unknown
 * tokens are left untouched.
 */
export function interpolate(body: string, values: TemplateValues): string {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => {
    if ((TEMPLATE_PLACEHOLDERS as readonly string[]).includes(key)) {
      const value = values[key as TemplatePlaceholder];
      return value && value.trim() ? value : `[${key}]`;
    }
    return match;
  });
}

/** Convenience: render a whole template in one call. */
export function renderTemplate(
  template: MessageTemplate,
  values: TemplateValues,
): string {
  return interpolate(template.body, values);
}
