import { describe, expect, it } from "vitest";
import {
  GEMINI_BUDGET_SYSTEM_INSTRUCTION,
  buildBudgetPrompt,
  buildBudgetRequestBody,
} from "./source-gemini";
import type { BudgetExplainerInput } from "./types";
import type { PitiBreakdown } from "@/lib/budget";
import type { BudgetInsight } from "@/lib/budget-explainer";

function breakdown(overrides: Partial<PitiBreakdown> = {}): PitiBreakdown {
  return {
    pi: 2_023,
    tax: 366,
    insurance: 125,
    hoa: 0,
    pmi: 150,
    total: 2_664,
    loanAmount: 360_000,
    ltv: 90,
    ...overrides,
  };
}

function insights(): BudgetInsight[] {
  return [
    {
      id: "composition",
      title: "What's driving your payment",
      body: "Principal & interest is 76% of your payment.",
      tone: "info",
    },
    {
      id: "pmi",
      title: "You're paying PMI",
      body: "Your loan-to-value is about 90%.",
      tone: "watch",
    },
  ];
}

function input(): BudgetExplainerInput {
  return {
    safeInput: {
      mode: "payment",
      price: 400_000,
      downPaymentPercent: 10,
      ratePct: 6.5,
      termYears: 30,
    },
    breakdown: breakdown(),
    insights: insights(),
  };
}

describe("GEMINI_BUDGET_SYSTEM_INSTRUCTION (UPL / SAFE-Act / FHA / labeling)", () => {
  const sys = GEMINI_BUDGET_SYSTEM_INSTRUCTION.toLowerCase();

  it("requires the AI-generated estimate / not-financial-advice / lender label", () => {
    expect(sys).toContain("educational estimate");
    expect(sys).toContain("not financial advice");
    expect(sys).toContain("licensed lender");
  });

  it("forbids advice and directive steering (UPL)", () => {
    expect(sys).toContain("education only");
    expect(sys).toContain("you should");
    expect(sys).toContain("recommend");
    expect(sys).toContain("afford");
  });

  it("forbids recommending a loan or lender and quoting a rate as an offer (SAFE-Act)", () => {
    expect(sys).toContain("lender");
    expect(sys).toMatch(/loan (product|program)/);
    expect(sys).toContain("rate");
    expect(sys).toContain("steer");
  });

  it("grounds narration only and forbids computing/inventing numbers", () => {
    expect(sys).toContain("narrate only");
    expect(sys).toContain("do not compute");
    expect(sys).toContain("invent");
  });

  it("keeps FHA guardrails — no protected class, no love letter", () => {
    expect(sys).toContain("protected class");
    expect(sys).toContain("love letter");
  });
});

describe("buildBudgetPrompt / buildBudgetRequestBody (grounding)", () => {
  it("embeds OUR computed numbers and insights, never recomputing", () => {
    const prompt = buildBudgetPrompt(input());
    expect(prompt).toContain("2664"); // total monthly
    expect(prompt).toContain("2023"); // principal & interest
    expect(prompt).toContain("150"); // pmi
    expect(prompt).toContain("composition");
    expect(prompt).toContain("You're paying PMI");
  });

  it("includes the affordability summary only when present", () => {
    const withAfford = buildBudgetPrompt({
      ...input(),
      affordability: { maxPrice: 480_000, maxLoan: 440_000, bindingConstraint: "back" },
    });
    expect(withAfford).toContain("480000");
    expect(withAfford).toContain("bindingConstraint");

    const without = buildBudgetPrompt(input());
    expect(without).not.toContain("bindingConstraint");
  });

  it("wraps the budget system instruction + grounded user content", () => {
    const body = buildBudgetRequestBody(input());
    expect(body.systemInstruction.parts[0].text).toBe(
      GEMINI_BUDGET_SYSTEM_INSTRUCTION,
    );
    expect(body.contents[0].role).toBe("user");
    expect(body.contents[0].parts[0].text).toContain("payment breakdown");
  });
});
