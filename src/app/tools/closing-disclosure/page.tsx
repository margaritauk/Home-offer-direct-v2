import type { Metadata } from "next";
import { ClosingDisclosureTool } from "@/components/tools/closing-disclosure";

export const metadata: Metadata = {
  title: "Closing Disclosure check",
  description:
    "Compare your Closing Disclosure against your Loan Estimate line by line, flag increases beyond CFPB tolerance limits, and confirm the 3-business-day rule date. Education, not legal or financial advice.",
};

export default function ClosingDisclosurePage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Closing Disclosure check
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Your Closing Disclosure (CD) should match the Loan Estimate (LE) you
          got when you applied. Enter both sets of figures to see what changed,
          catch any increase beyond the CFPB tolerance limits, and confirm the
          3-business-day review window before you sign.
        </p>
      </div>
      <div className="mt-8">
        <ClosingDisclosureTool />
      </div>
    </div>
  );
}
