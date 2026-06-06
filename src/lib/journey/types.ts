/**
 * Domain model for the home-buying journey.
 *
 * A {@link JourneyStage} is a major phase of buying a home (e.g. "Get
 * mortgage-ready"). Each stage groups an ordered list of {@link JourneyStep}s,
 * and each step carries actionable guidance: what to do, why it matters, what a
 * buyer must handle themselves when going without a buyer's agent, and a
 * checklist of concrete {@link JourneyTask}s.
 */

export interface JourneyTask {
  /** Stable id, unique within its step. Used to persist completion state. */
  id: string;
  label: string;
  /** Optional longer explanation shown beneath the task label. */
  detail?: string;
  /** When true the task is informational and not strictly required. */
  optional?: boolean;
}

export interface JourneyResource {
  label: string;
  href: string;
  /** Short note on what the resource is / why it's useful. */
  description?: string;
}

export interface JourneyStep {
  /** URL-safe slug, unique within its stage. */
  slug: string;
  title: string;
  /** One-sentence summary used in lists and cards. */
  summary: string;
  /** Typical time this step takes, human readable (e.g. "1–2 weeks"). */
  timeline?: string;
  /** Markdown-ish body paragraphs explaining the step. */
  body: string[];
  /**
   * The key reason this step exists and what's at stake — surfaced
   * prominently so self-serve buyers don't skip it.
   */
  whyItMatters?: string;
  /**
   * What a buyer normally relies on an agent for here, and how to cover it
   * yourself. This is the heart of the no-realtor value prop.
   */
  withoutAnAgent?: string;
  /** Concrete checklist items the buyer can tick off. */
  tasks: JourneyTask[];
  /** Glossary term slugs relevant to this step. */
  terms?: string[];
  resources?: JourneyResource[];
}

export interface JourneyStage {
  /** URL-safe slug, unique across stages. */
  slug: string;
  /** 1-based display order. */
  order: number;
  title: string;
  /** Short tagline shown under the title. */
  tagline: string;
  /** Longer description of the phase. */
  description: string;
  /** Lucide-style icon name or emoji used in the UI. */
  icon: string;
  timeline?: string;
  steps: JourneyStep[];
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  /** Optional related term slugs. */
  related?: string[];
}
