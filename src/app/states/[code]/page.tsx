import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStateProfiles, getStateProfile } from "@/lib/states";
import { StateGuide } from "@/components/state-guide";
import { SetStateOnVisit } from "@/components/set-state-on-visit";

export function generateStaticParams() {
  return getAllStateProfiles().map((s) => ({ code: s.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const profile = getStateProfile(code);
  if (!profile) return { title: "State not found" };
  return {
    title: `Buying a home in ${profile.name}`,
    description: `Closing process, seller disclosures, transfer tax, and official resources for buying a home without an agent in ${profile.name}.`,
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const profile = getStateProfile(code);
  if (!profile) notFound();

  return (
    <div className="container-page py-12 lg:py-16">
      <SetStateOnVisit code={profile.code} />
      <nav className="text-sm text-ink-muted">
        <Link href="/states" className="hover:text-brand-700">
          State guide
        </Link>
        {" / "}
        <span>{profile.name}</span>
      </nav>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Buying a home in {profile.name}
        </h1>
        <p className="mt-3 text-lg text-ink-soft">
          What&apos;s different here when you buy without a buyer&apos;s agent.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <StateGuide profile={profile} />
      </div>

      <div className="mt-10">
        <Link href="/journey" className="btn-primary">
          Continue your journey →
        </Link>
      </div>
    </div>
  );
}
