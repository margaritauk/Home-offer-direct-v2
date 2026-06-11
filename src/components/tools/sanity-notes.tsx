import type { SanityNote, SanityTone } from "@/lib/tools/sanity";

/**
 * Thin presentational wrapper for {@link SanityNote}s (issue #151). Reuses the
 * exact tone palette the budget explainer's INSIGHT_TONES uses so sanity nudges
 * are visually identical to existing insights — no new visual language.
 *
 * Renders nothing when there are no notes. These are EDUCATION, never advice.
 */
const SANITY_TONES: Record<SanityTone, string> = {
  info: "border-slate-200 bg-slate-50 text-ink-soft",
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
};

export function SanityNotes({ notes }: { notes: SanityNote[] }) {
  if (notes.length === 0) return null;
  return (
    <section aria-label="Worth a double-check" className="space-y-2">
      {notes.map((n) => (
        <div
          key={n.id}
          data-testid="sanity-note"
          className={`rounded-lg border p-3 text-sm ${SANITY_TONES[n.tone]}`}
        >
          <p className="mt-0.5">{n.message}</p>
        </div>
      ))}
    </section>
  );
}
