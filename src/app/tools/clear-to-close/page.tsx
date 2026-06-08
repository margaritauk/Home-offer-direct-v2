import type { Metadata } from "next";
import { ClearToClose } from "@/components/tools/clear-to-close";

export const metadata: Metadata = {
  title: "Clear-to-close tracker & low-appraisal calculator",
  description:
    "Track your path to clear-to-close and run the numbers if the appraisal comes in low. Estimates, not lending advice.",
};

export default function ClearToClosePage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Clear-to-close tracker &amp; low-appraisal calculator
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Follow your loan from appraisal to final approval, and if the
          appraisal comes in low, see the gap and the cash impact of each option
          framed neutrally.
        </p>
      </div>
      <div className="mt-8">
        <ClearToClose />
      </div>
    </div>
  );
}
