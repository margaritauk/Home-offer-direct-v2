import {
  type OfferStatus,
  offerStatusLabels,
} from "@/lib/offer-status/types";

const STATUS_CLASSES: Record<OfferStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-sky-100 text-sky-800",
  submitted: "bg-indigo-100 text-indigo-800",
  countered: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  expired: "bg-slate-200 text-slate-600",
};

/** Small coloured pill for an offer status. Shared by #39 + #38 UIs. */
export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      {offerStatusLabels[status]}
    </span>
  );
}
