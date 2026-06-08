import type { Metadata } from "next";
import { GetReady } from "@/components/tools/get-ready";

export const metadata: Metadata = {
  title: "Get ready: credit & savings",
  description:
    "Track educational credit-readiness steps and a down-payment / closing-cost savings goal with progress. Education, not financial or credit advice.",
};

export default function GetReadyPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Get ready: credit & savings</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Two things set you up to buy: a healthy credit profile and enough cash
          for the down payment and closing costs. Work the educational checklist
          and track your savings goal as you go.
        </p>
      </div>
      <div className="mt-8">
        <GetReady />
      </div>
    </div>
  );
}
