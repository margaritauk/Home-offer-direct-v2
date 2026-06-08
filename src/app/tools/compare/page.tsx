import type { Metadata } from "next";
import { CompareHomes } from "@/components/tools/compare-homes";

export const metadata: Metadata = {
  title: "Compare homes",
  description:
    "Compare 2–4 homes side by side on the facts that matter — price, $/sqft, beds/baths, days on market, and your own tour scores. Facts only, no steering.",
};

export default function ComparePage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Compare homes</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Pick a few homes from listings or your tracked showings and line up the
          facts: price, price per square foot, beds and baths, square footage,
          days on market, and your own tour score when you have one.
        </p>
      </div>
      <div className="mt-8">
        <CompareHomes />
      </div>
    </div>
  );
}
