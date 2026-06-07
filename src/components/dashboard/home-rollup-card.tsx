import Link from "next/link";
import { showingStatusLabels } from "@/lib/showings/types";
import { OfferStatusBadge } from "@/components/offer-status/offer-status-badge";
import type { HomeRollup } from "@/lib/homes/rollup";

const DEADLINE_CLASSES: Record<string, string> = {
  overdue: "text-rose-700",
  today: "text-rose-600",
  soon: "text-amber-600",
  upcoming: "text-ink-muted",
};

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-ink">{children}</p>
    </div>
  );
}

/** One per-home rollup card for the dashboard (#38). */
export function HomeRollupCard({ rollup }: { rollup: HomeRollup }) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/listings/${rollup.listingId}`}
            className="font-semibold text-brand-700 hover:underline"
          >
            {rollup.title}
          </Link>
          {rollup.city ? (
            <p className="text-sm text-ink-muted">
              {rollup.city}
              {rollup.state ? `, ${rollup.state}` : ""}
            </p>
          ) : null}
        </div>
        {rollup.offerStatus ? (
          <OfferStatusBadge status={rollup.offerStatus} />
        ) : null}
      </div>

      {/* Journey progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Journey progress</span>
          <span>
            {rollup.journeyPct}% ({rollup.journeyDone}/{rollup.journeyTotal})
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${rollup.journeyPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Showing">
          {rollup.showingStatus
            ? showingStatusLabels[rollup.showingStatus]
            : "—"}
        </Stat>
        <Stat label="Offer">
          {rollup.offerStatus ? (
            rollup.expiration?.hasExpiration ? (
              <span
                className={
                  rollup.expiration.urgency === "expired" ||
                  rollup.expiration.urgency === "today"
                    ? "text-rose-600"
                    : rollup.expiration.urgency === "soon"
                      ? "text-amber-600"
                      : ""
                }
              >
                {rollup.expiration.label}
              </span>
            ) : (
              "Tracked"
            )
          ) : (
            "Not started"
          )}
        </Stat>
        <Stat label="Next deadline">
          {rollup.nextDeadline ? (
            <span className={DEADLINE_CLASSES[rollup.nextDeadline.status]}>
              {rollup.nextDeadline.label} · {rollup.nextDeadline.date}
            </span>
          ) : (
            "Set deal dates"
          )}
        </Stat>
        <Stat label="Outstanding docs">
          {rollup.outstandingDocs > 0
            ? `${rollup.outstandingDocs} to gather`
            : "All gathered"}
        </Stat>
      </div>

      <div className="rounded-lg bg-brand-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Next action
        </p>
        <p className="mt-0.5 text-sm text-ink">{rollup.nextAction}</p>
        <Link
          href={rollup.nextHref}
          className="mt-2 inline-flex text-sm font-medium text-brand-700 hover:underline"
        >
          Go &rarr;
        </Link>
      </div>
    </div>
  );
}
