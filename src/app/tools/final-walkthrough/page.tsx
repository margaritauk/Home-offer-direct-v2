import type { Metadata } from "next";
import { FinalWalkthrough } from "@/components/tools/final-walkthrough";

export const metadata: Metadata = {
  title: "Final-walkthrough checklist",
  description:
    "Verify the home's condition and confirm your negotiated repairs were completed before closing. An education checklist, not a substitute for your own walkthrough.",
};

export default function FinalWalkthroughPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Final-walkthrough checklist
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          24–48 hours before closing, walk the home and confirm nothing changed.
          Work the standard checks and verify each repair you negotiated — pulled
          in automatically from your Repair request tool — was actually done.
        </p>
      </div>
      <div className="mt-8">
        <FinalWalkthrough />
      </div>
    </div>
  );
}
