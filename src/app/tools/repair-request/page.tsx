import type { Metadata } from "next";
import { RepairRequestBuilder } from "@/components/tools/repair-request-builder";

export const metadata: Metadata = {
  title: "Repair-request builder",
  description:
    "Turn inspection findings into a neutral repair-or-credit request you can share with the seller. A worksheet, not a legal notice.",
};

export default function RepairRequestPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Repair-request builder</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Import your inspection findings or add items by hand, choose repair or
          credit for each, and generate a neutral, factual request summary you
          can copy and share.
        </p>
      </div>
      <div className="mt-8">
        <RepairRequestBuilder />
      </div>
    </div>
  );
}
