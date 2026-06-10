import type { Metadata } from "next";
import { EscrowTracker } from "@/components/tools/escrow-tracker";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Wire-fraud checklist & escrow tracker",
  description:
    "Verify wiring instructions by phone before you send earnest money or closing funds, and track your escrow deposit. A safety checklist, not a guarantee.",
};

export default function EscrowPage() {
  return (
    <ToolPageHeader
      title="Wire-fraud checklist & escrow tracker"
      intro={
        <>
          Wiring money is the riskiest moment of your purchase. Work the forced
          verification checklist before you send a cent, then track your escrow
          deposit through to confirmed receipt.
        </>
      }
    >
      <EscrowTracker />
    </ToolPageHeader>
  );
}
