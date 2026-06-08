import type { Metadata } from "next";
import { InspectionFindings } from "@/components/tools/inspection-findings";

export const metadata: Metadata = {
  title: "Inspection findings logger",
  description:
    "Log home-inspection findings by severity and cost, decide which to act on, and see a fact-based summary. Not a substitute for a licensed inspector.",
};

export default function InspectionPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Inspection findings logger
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          After your inspection, log each finding with a severity and estimated
          cost, decide how to handle it, and get a clear summary to negotiate
          from facts.
        </p>
      </div>
      <div className="mt-8">
        <InspectionFindings />
      </div>
    </div>
  );
}
