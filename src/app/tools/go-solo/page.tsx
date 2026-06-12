import type { Metadata } from "next";
import { GoSolo } from "@/components/tools/go-solo";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Should I go solo?",
  description:
    "An honest, balanced decision aid for buying without an agent — when self-representation is reasonable, when many buyers bring in a flat-fee attorney, and what the 2024 NAR settlement actually changed.",
};

export default function GoSoloPage() {
  return (
    <ToolPageHeader
      title="Should I go solo?"
      intro={
        <>
          Buying unrepresented is legal everywhere and right for many purchases —
          but not every one. Check what applies to your deal for a balanced read
          on when bringing in targeted help is worth it, plus the post-2024-NAR
          reality so nothing catches you off guard.
        </>
      }
    >
      <GoSolo />
    </ToolPageHeader>
  );
}
