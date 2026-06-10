import type { Metadata } from "next";
import { FinalWalkthrough } from "@/components/tools/final-walkthrough";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Final-walkthrough checklist",
  description:
    "Verify the home's condition and confirm your negotiated repairs were completed before closing. An education checklist, not a substitute for your own walkthrough.",
};

export default function FinalWalkthroughPage() {
  return (
    <ToolPageHeader
      title="Final-walkthrough checklist"
      intro={
        <>
          24–48 hours before closing, walk the home and confirm nothing changed.
          Work the standard checks and verify each repair you negotiated — pulled
          in automatically from your Repair request tool — was actually done.
        </>
      }
    >
      <FinalWalkthrough />
    </ToolPageHeader>
  );
}
