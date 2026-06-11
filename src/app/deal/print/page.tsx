import type { Metadata } from "next";
import { DealBinder } from "@/components/deal/deal-binder";

export const metadata: Metadata = {
  title: "Buyer binder",
  description:
    "A printable, single-page summary of your whole deal — budget, savings, comps, offer, deadlines, and journey progress. Assembled on your device only; estimates, not advice.",
};

export default function DealPrintPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <DealBinder />
      </div>
    </div>
  );
}
