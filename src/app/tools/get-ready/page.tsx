import type { Metadata } from "next";
import { GetReady } from "@/components/tools/get-ready";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Get ready: credit & savings",
  description:
    "Track educational credit-readiness steps and a down-payment / closing-cost savings goal with progress. Education, not financial or credit advice.",
};

export default function GetReadyPage() {
  return (
    <ToolPageHeader
      title="Get ready: credit & savings"
      intro={
        <>
          Two things set you up to buy: a healthy credit profile and enough cash
          for the down payment and closing costs. Work the educational checklist
          and track your savings goal as you go.
        </>
      }
    >
      <GetReady />
    </ToolPageHeader>
  );
}
