import Link from "next/link";

/** Shown on the dashboard when the buyer isn't tracking any home yet (#38). */
export function DashboardEmptyState() {
  return (
    <div className="card text-center">
      <p className="text-lg font-semibold">Nothing tracked yet</p>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Once you start tracking homes — requesting showings or logging an offer —
        each one shows up here with its journey progress, showing status, offer
        stage, next deadline, and what to do next.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/listings" className="btn-primary">
          Browse listings
        </Link>
        <Link href="/showings" className="btn-secondary">
          Open showings tracker
        </Link>
      </div>
    </div>
  );
}
