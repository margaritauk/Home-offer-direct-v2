/**
 * The single amber "note" banner primitive (UX audit finding 1.1).
 *
 * Several surfaces rendered the same `border-amber-300 bg-amber-50 ...`
 * `role="note"` box independently (the legal notice, the offer disclaimer, and
 * the sample-listings notice). This is the one source of truth so the box can't
 * drift visually. Server component — pure render.
 */
export function DisclaimerBanner({
  icon = "🛡️",
  children,
  className = "",
}: {
  /** Leading emoji icon, or `null` for none. */
  icon?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="note"
      className={`rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`.trim()}
    >
      {icon ? (
        <span aria-hidden className="mr-1">
          {icon}
        </span>
      ) : null}
      {children}
    </p>
  );
}
