import type { Metadata } from "next";
import { ProDirectory } from "@/components/pro-directory";
import { PRO_ROLES, type ProRole } from "@/lib/pros";

export const metadata: Metadata = {
  title: "Find a pro — attorneys, inspectors & title companies",
  description:
    "Buying without an agent doesn't mean going it alone. Find the real estate attorneys, home inspectors, and title/escrow companies you'll hand off to — filterable by state and role.",
};

export default async function ProsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole = PRO_ROLES.includes(role as ProRole)
    ? (role as ProRole)
    : undefined;

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Bring in the right help
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Find a pro</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Going agent-free doesn&apos;t mean doing everything yourself. The right
          professional at the right moment — especially a flat-fee real estate
          attorney — neutralizes most of the risk and still saves you the
          commission. Filter by what you need and where you&apos;re buying.
        </p>
      </div>

      <div className="mt-8">
        <ProDirectory initialRole={initialRole} />
      </div>
    </div>
  );
}
