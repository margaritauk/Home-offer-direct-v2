import type { Metadata } from "next";
import { TourScorecard } from "@/components/tools/tour-scorecard";

export const metadata: Metadata = {
  title: "Tour scorecard",
  description:
    "Score each home you tour on a consistent weighted rubric so you can compare them objectively later. An estimate aid, not advice.",
};

export default function TourScorecardPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Tour scorecard</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Touring several homes blurs together fast. Score each one on the same
          rubric — location, condition, layout, price-vs-value, light, outdoor
          space, commute — and compare the weighted totals side by side.
        </p>
      </div>
      <div className="mt-8">
        <TourScorecard />
      </div>
    </div>
  );
}
