import type { Metadata } from "next";
import { getAllTerms } from "@/lib/glossary";
import { GlossaryList } from "@/components/glossary-list";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Plain-English definitions of the home-buying terms you'll meet along the way — earnest money, escrow, contingencies, closing disclosure and more.",
};

export default function GlossaryPage() {
  const terms = getAllTerms();
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Glossary</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Home buying comes with a lot of jargon. Here&apos;s what it all means,
          in plain English.
        </p>
      </div>
      <div className="mt-8 max-w-3xl">
        <GlossaryList terms={terms} />
      </div>
    </div>
  );
}
