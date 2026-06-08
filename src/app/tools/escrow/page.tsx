import type { Metadata } from "next";
import { EscrowTracker } from "@/components/tools/escrow-tracker";

export const metadata: Metadata = {
  title: "Wire-fraud checklist & escrow tracker",
  description:
    "Verify wiring instructions by phone before you send earnest money or closing funds, and track your escrow deposit. A safety checklist, not a guarantee.",
};

export default function EscrowPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Wire-fraud checklist &amp; escrow tracker
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Wiring money is the riskiest moment of your purchase. Work the forced
          verification checklist before you send a cent, then track your escrow
          deposit through to confirmed receipt.
        </p>
      </div>
      <div className="mt-8">
        <EscrowTracker />
      </div>
    </div>
  );
}
