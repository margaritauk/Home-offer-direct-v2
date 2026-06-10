import type { Metadata } from "next";
import { ClosingDayTool } from "@/components/tools/closing-day";

export const metadata: Metadata = {
  title: "Closing day",
  description:
    "A closing-day checklist and cash-to-close estimate, with a wire-fraud re-verify reminder. Education and an estimate, not legal or financial advice.",
};

export default function ClosingDayPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Closing day</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Arrive prepared: work the closing-day checklist, estimate the cash
          you&apos;ll bring to the table, and — most importantly — re-verify any
          wiring instructions by phone before you send funds.
        </p>
      </div>
      <div className="mt-8">
        <ClosingDayTool />
      </div>
    </div>
  );
}
