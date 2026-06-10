import type { Metadata } from "next";
import { BudgetCalculator } from "@/components/tools/budget-calculator";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Budget calculator",
  description:
    "Estimate your monthly mortgage payment (PITI) or how much house you can afford. Estimates only — not financial advice.",
};

export default function BudgetPage() {
  return (
    <ToolPageHeader
      title="Budget calculator"
      intro={
        <>
          Know your numbers before you fall in love with a house. Estimate a
          full monthly payment (principal, interest, taxes, insurance, PMI, and
          HOA), or work backwards from your income to see how much house you can
          comfortably afford.
        </>
      }
    >
      <BudgetCalculator />
    </ToolPageHeader>
  );
}
