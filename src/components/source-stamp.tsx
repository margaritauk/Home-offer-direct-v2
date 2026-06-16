/**
 * SourceStamp — the one shared primitive for citing a dated fact (S1-H2).
 *
 * Renders the `source` and `as-of` date of any market / legal / tax fact as real,
 * screen-reader-legible `ink-soft` text directly under the fact — NOT a tooltip,
 * so the provenance is always visible and never hidden behind a hover. Introduced
 * in S1's freshness sweep and reused verbatim by later sprints (S6/F3, S7) — do
 * not re-author.
 *
 * UDAP: neutral data presentation. We cite the source + date and editorialize
 * nothing; the stamp is just "as of <date> · <source>".
 *
 * Server component — pure render, no client state.
 */
export function SourceStamp({
  asOf,
  source,
  className = "",
}: {
  /** As-of date (YYYY-MM-DD) the fact was last verified/published. */
  asOf: string;
  /** Human-readable source name (e.g. "U.S. Census Bureau"). */
  source: string;
  className?: string;
}) {
  return (
    <p className={`text-xs text-ink-soft ${className}`.trim()}>
      <span className="sr-only">Source and as-of date: </span>
      As of {asOf} · {source}
    </p>
  );
}
