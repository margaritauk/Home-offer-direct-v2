import type { Metadata } from "next";
import { BudgetCalculator } from "@/components/tools/budget-calculator";

export const metadata: Metadata = {
  title: "Budget calculator",
  description:
    "Estimate your monthly mortgage payment (PITI) or how much house you can afford. Estimates only — not financial advice.",
};

export default function BudgetPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Budget calculator</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Know your numbers before you fall in love with a house. Estimate a
          full monthly payment (principal, interest, taxes, insurance, PMI, and
          HOA), or work backwards from your income to see how much house you can
          comfortably afford.
        </p>
      </div>
      <div className="mt-8">
        <BudgetCalculator />
      </div>
    </div>
  );
}
