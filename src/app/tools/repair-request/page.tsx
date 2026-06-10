import type { Metadata } from "next";
import { RepairRequestBuilder } from "@/components/tools/repair-request-builder";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Repair-request builder",
  description:
    "Turn inspection findings into a neutral repair-or-credit request you can share with the seller. A worksheet, not a legal notice.",
};

export default function RepairRequestPage() {
  return (
    <ToolPageHeader
      title="Repair-request builder"
      intro={
        <>
          Import your inspection findings or add items by hand, choose repair or
          credit for each, and generate a neutral, factual request summary you
          can copy and share.
        </>
      }
    >
      <RepairRequestBuilder />
    </ToolPageHeader>
  );
}
