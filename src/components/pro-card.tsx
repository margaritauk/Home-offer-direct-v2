import { proRoleLabels, type ProProfile } from "@/lib/pros";

export function ProCard({ pro }: { pro: ProProfile }) {
  const role = proRoleLabels[pro.role];
  return (
    <div className="card flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">{role.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {role.label}
          </span>
        </div>
        {pro.isSample ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Sample
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-lg font-semibold">{pro.name}</h3>
      <p className="mt-1 flex-1 text-sm text-ink-soft">{pro.description}</p>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink-muted">Serves:</dt>
          <dd className="font-medium text-ink">
            {pro.states.length === 0 ? "Nationwide" : pro.states.join(", ")}
          </dd>
        </div>
        {pro.location ? (
          <div className="flex gap-2">
            <dt className="text-ink-muted">Location:</dt>
            <dd className="text-ink">{pro.location}</dd>
          </div>
        ) : null}
        {pro.pricingNote ? (
          <div className="flex gap-2">
            <dt className="text-ink-muted">Pricing:</dt>
            <dd className="text-ink">{pro.pricingNote}</dd>
          </div>
        ) : null}
      </dl>

      {pro.website ? (
        <a
          href={pro.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-sm font-medium text-brand-700 hover:underline"
        >
          Visit website ↗
        </a>
      ) : null}
    </div>
  );
}
