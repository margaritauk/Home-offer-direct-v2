import {
  closingPathLabels,
  disclosureRegimeLabels,
  dualAgencyLabels,
  eSignLabels,
} from "@/lib/states";
import type { StateProfile } from "@/lib/states";

function InfoCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </h3>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {badge}
        </span>
      </div>
      <div className="mt-2 text-sm text-ink-soft">{children}</div>
    </div>
  );
}

/** Full presentational summary of a state's home-buying profile. */
export function StateGuide({ profile }: { profile: StateProfile }) {
  const closing = closingPathLabels[profile.closingPath];
  const disclosure = disclosureRegimeLabels[profile.disclosureRegime];
  const dualAgency = dualAgencyLabels[profile.dualAgency];
  const eSign = eSignLabels[profile.eSignForRealEstate];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="Closing process" badge={closing.label}>
          <p>{profile.closingNote}</p>
          {profile.attorneyRequiredAtClosing ? (
            <p className="mt-2 font-medium text-ink">
              ⚖️ A real estate attorney is required at closing in this state.
            </p>
          ) : null}
        </InfoCard>

        <InfoCard title="Seller disclosures" badge={disclosure.label}>
          <p>{profile.disclosureNote}</p>
          {profile.disclosureFormName ? (
            <p className="mt-2 text-ink">
              Standard form: <strong>{profile.disclosureFormName}</strong>
            </p>
          ) : null}
        </InfoCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Transfer tax
          </h3>
          <p className="mt-2 text-sm text-ink-soft">{profile.transferTaxNote}</p>
        </div>

        <InfoCard title="Agency representation" badge={dualAgency.label}>
          {profile.dualAgency === "banned" ? (
            <p className="font-medium text-ink">
              🚫 Dual agency is banned in {profile.name} — one agent cannot
              represent both you and the seller.
            </p>
          ) : null}
          <p className={profile.dualAgency === "banned" ? "mt-2" : undefined}>
            {profile.dualAgencyNote ?? dualAgency.short}
          </p>
          <p className="mt-2 text-ink">
            The listing agent works for the <strong>seller</strong> — keep your
            budget ceiling, timeline, and financial strength to yourself.
          </p>
        </InfoCard>
      </div>

      <InfoCard title="E-signature & online notarization" badge={eSign.label}>
        <p>{profile.eSignNote ?? eSign.short}</p>
        <p className="mt-2 text-ink">
          {profile.ronAllowed ? (
            <>
              ✓ {profile.name} has a permanent remote online notarization (RON)
              law, so notarized closing documents can be executed online.
            </>
          ) : (
            <>
              ⚠️ {profile.name} does not yet have a permanent RON law — notarized
              closing documents may need to be notarized in person.
            </>
          )}
        </p>
      </InfoCard>

      {profile.highlights.length > 0 ? (
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            What to know buying agent-free in {profile.name}
          </h3>
          <ul className="mt-3 space-y-2">
            {profile.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-soft">
                <span className="text-brand-600" aria-hidden>
                  ✓
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {profile.resources.length > 0 ? (
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Official {profile.name} resources
          </h3>
          <ul className="mt-3 space-y-2">
            {profile.resources.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-700 hover:underline"
                >
                  {r.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-ink-muted">
        State guidance is for general education only and is not legal advice.
        Rules change and vary by locality — confirm specifics with a licensed{" "}
        {profile.name} real estate attorney or your state&apos;s real estate
        commission.
      </p>
    </div>
  );
}
