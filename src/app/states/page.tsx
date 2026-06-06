import type { Metadata } from "next";
import Link from "next/link";
import { getAllStateProfiles, closingPathLabels } from "@/lib/states";
import { SelectedStateGuide } from "@/components/selected-state-guide";

export const metadata: Metadata = {
  title: "State-by-state buying guide",
  description:
    "How buying a home without an agent works in your state — closing process (attorney vs escrow), required seller disclosures, transfer tax, and official resources for all 50 states + DC.",
};

export default function StatesPage() {
  const profiles = getAllStateProfiles();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          The state layer
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          How home buying works in your state
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          The biggest differences in buying agent-free are state-specific: who
          closes your deal, what the seller must disclose, and who pays transfer
          tax. Pick your state to personalize the entire journey.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SelectedStateGuide />
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold">All states &amp; DC</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <li key={p.code}>
              <Link
                href={`/states/${p.code.toLowerCase()}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-brand-300 hover:shadow-sm"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span className="text-xs text-ink-muted">
                  {closingPathLabels[p.closingPath].label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
