/**
 * Privacy-first analytics seam (cross-cutting §7).
 *
 * A tiny event bus with a NO-OP default sink. NO third-party vendor is wired —
 * the default sink does nothing, so the app ships measurable-by-design without
 * shipping any data anywhere. A future sink (first-party endpoint) can be set via
 * {@link setAnalyticsSink} without touching call sites.
 *
 * HARD PRIVACY RULE (enforced at this seam):
 *   - Only the closed set of {@link AnalyticsEventName}s is accepted.
 *   - {@link sanitizeProps} drops any non-(string|number|boolean) value and any
 *     suspiciously PII-looking key, so a careless caller can't leak free text,
 *     names, emails, or protected-class data.
 *
 * PURE-ish: `track` is side-effect-only through the sink; `sanitizeProps` is a
 * pure, fully unit-tested function.
 */

import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsEventPayloads,
  AnalyticsProps,
  AnalyticsPropValue,
} from "./events";

/** A sink receives sanitized events. The default does nothing (no vendor). */
export type AnalyticsSink = (event: AnalyticsEvent) => void;

/** The no-op default — intentionally sends nothing anywhere. */
export const noopSink: AnalyticsSink = () => {};

let currentSink: AnalyticsSink = noopSink;

/** Swap the sink (e.g. a first-party collector). Pass nothing to reset to no-op. */
export function setAnalyticsSink(sink: AnalyticsSink = noopSink): void {
  currentSink = sink;
}

/** Keys that smell like PII — rejected outright even if the value is a primitive. */
const PII_KEY_PATTERN =
  /name|email|phone|address|street|zip|postal|lat|lng|ssn|dob|birth|gender|race|ethnic|religion|disab|family|marital|income/i;

const ALLOWED_NAMES: ReadonlySet<AnalyticsEventName> = new Set<AnalyticsEventName>([
  "savings_calc_completed",
  "offer_builder_started",
  "suggested_range_viewed",
  "offer_builder_completed",
  "market_read_viewed",
]);

/**
 * Strip any property that isn't a plain primitive or whose key looks like PII.
 * PURE. This is the privacy backstop: even if a caller passes junk, only safe,
 * coarse facts survive.
 */
export function sanitizeProps(props: AnalyticsProps | undefined): AnalyticsProps {
  const out: AnalyticsProps = {};
  if (!props) return out;
  for (const [key, value] of Object.entries(props)) {
    if (PII_KEY_PATTERN.test(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      // Cap string length so no free-text payload sneaks through as a "label".
      if (typeof value === "string" && value.length > 64) continue;
      out[key] = value as AnalyticsPropValue;
    }
  }
  return out;
}

/**
 * Emit a funnel event. Unknown event names are dropped (closed vocabulary);
 * props are sanitized first. Never throws — analytics must never break the app.
 */
export function track<K extends AnalyticsEventName>(
  name: K,
  props: K extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[K]
    : AnalyticsProps = {} as never,
): void {
  if (!ALLOWED_NAMES.has(name)) return;
  const safe = sanitizeProps(props as AnalyticsProps);
  try {
    currentSink({ name, props: safe });
  } catch {
    /* analytics must never throw into the app */
  }
}
