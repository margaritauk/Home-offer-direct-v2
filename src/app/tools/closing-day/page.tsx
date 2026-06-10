import type { Metadata } from "next";
import { ClosingDayTool } from "@/components/tools/closing-day";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Closing day",
  description:
    "A closing-day checklist and cash-to-close estimate, with a wire-fraud re-verify reminder. Education and an estimate, not legal or financial advice.",
};

export default function ClosingDayPage() {
  return (
    <ToolPageHeader
      title="Closing day"
      intro={
        <>
          Arrive prepared: work the closing-day checklist, estimate the cash
          you&apos;ll bring to the table, and — most importantly — re-verify any
          wiring instructions by phone before you send funds.
        </>
      }
    >
      <ClosingDayTool />
    </ToolPageHeader>
  );
}
