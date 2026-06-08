import type { Metadata } from "next";
import { LenderCompare } from "@/components/tools/lender-compare";

export const metadata: Metadata = {
  title: "Lender comparison",
  description:
    "Compare your own lender Loan Estimates side by side by total cost over a horizon — not just the lowest rate. Education, not a rate offer.",
};

export default function LenderComparePage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Lender comparison</h1>
        <p className="mt-4 text-lg text-ink-soft">
          The lowest rate isn&apos;t always the best deal once points and fees
          are in the picture. Transcribe the numbers from your own Loan Estimates
          to compare lenders by total cost over the time you expect to keep the
          loan.
        </p>
      </div>
      <div className="mt-8">
        <LenderCompare />
      </div>
    </div>
  );
}
