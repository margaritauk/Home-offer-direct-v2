import { describe, expect, it } from "vitest";
import {
  EMPTY_FINANCING_DATES,
  FINANCING_MILESTONE_IDS,
  FINANCING_STEPS,
  clearToCloseByDate,
  computeFinancingMilestones,
  daysToClearToClose,
  financingAppraisalGap,
  hasFinancingMilestones,
  type FinancingDates,
  type FinancingInput,
} from "./milestones";
import { computeReminders } from "@/lib/reminders/schedule";
import { dueReminders, diffReminders } from "@/lib/reminders/due";
import { computeNextActions } from "@/lib/cockpit/next-actions";
import { allDealMilestones } from "@/lib/milestones/all-milestones";
import { defaultOffsets } from "@/lib/deadlines";
import { buildHomeRollups } from "@/lib/homes/rollup";

function dates(over: Partial<FinancingDates> = {}): FinancingDates {
  return { ...EMPTY_FINANCING_DATES, ...over };
}

// --- financing-milestone computation ----------------------------------------

describe("computeFinancingMilestones", () => {
  it("emits one Milestone per entered date, sorted by date", () => {
    const ms = computeFinancingMilestones({
      dates: dates({
        loanApplicationDate: "2026-06-10",
        appraisalDate: "2026-06-20",
        underwritingConditionsDate: "2026-06-25",
        clearToCloseByDate: "2026-06-30",
      }),
    });
    expect(ms.map((m) => m.date)).toEqual([
      "2026-06-10",
      "2026-06-20",
      "2026-06-25",
      "2026-06-30",
    ]);
    expect(ms.map((m) => m.id)).toEqual([
      FINANCING_MILESTONE_IDS.loanApplication,
      FINANCING_MILESTONE_IDS.appraisal,
      FINANCING_MILESTONE_IDS.underwritingConditions,
      FINANCING_MILESTONE_IDS.clearToClose,
    ]);
  });

  it("returns an empty array when no dates are set (graceful empty)", () => {
    expect(computeFinancingMilestones({ dates: dates() })).toEqual([]);
    expect(hasFinancingMilestones({ dates: dates() })).toBe(false);
  });

  it("skips invalid/missing dates gracefully without crashing", () => {
    const ms = computeFinancingMilestones({
      dates: dates({
        loanApplicationDate: "2026-06-10",
        appraisalDate: "not-a-date",
        underwritingConditionsDate: "2026-02-30", // impossible calendar date
      }),
    });
    expect(ms).toHaveLength(1);
    expect(ms[0].id).toBe(FINANCING_MILESTONE_IDS.loanApplication);
  });

  it("uses financing-milestone ids that never collide with deadline-engine ids", () => {
    const ms = computeFinancingMilestones({
      dates: dates({ loanApplicationDate: "2026-06-10" }),
    });
    expect(ms[0].id.startsWith("financing-")).toBe(true);
    // None of the canonical deadline ids are reused.
    const deadlineIds = ["earnest-money", "inspection", "appraisal", "financing", "closing"];
    expect(deadlineIds).not.toContain(ms[0].id);
  });

  it("marks appraisal and clear-to-close as critical", () => {
    const appraisal = FINANCING_STEPS.find(
      (s) => s.id === FINANCING_MILESTONE_IDS.appraisal,
    );
    const ctc = FINANCING_STEPS.find(
      (s) => s.id === FINANCING_MILESTONE_IDS.clearToClose,
    );
    expect(appraisal?.critical).toBe(true);
    expect(ctc?.critical).toBe(true);
  });
});

// --- CTC-by-date arithmetic (anchored off financingContingencyDays) ---------

describe("clearToCloseByDate", () => {
  it("derives the CTC-by date from the under-contract anchor + contingency days", () => {
    const input: FinancingInput = {
      dates: dates(),
      underContractDate: "2026-06-01",
      financingContingencyDays: defaultOffsets.financingContingencyDays, // 21
    };
    expect(clearToCloseByDate(input)).toBe("2026-06-22");
  });

  it("prefers an explicit CTC-by date over the derived one", () => {
    const input: FinancingInput = {
      dates: dates({ clearToCloseByDate: "2026-07-15" }),
      underContractDate: "2026-06-01",
      financingContingencyDays: 21,
    };
    expect(clearToCloseByDate(input)).toBe("2026-07-15");
  });

  it("returns empty when neither explicit nor derivable", () => {
    expect(clearToCloseByDate({ dates: dates() })).toBe("");
  });

  it("does NOT auto-emit a derived CTC milestone from the anchor alone", () => {
    // The tool is only in use once a buyer enters an explicit date, so the
    // derived CTC never auto-populates (and never duplicates the deadline
    // engine's own `financing` milestone).
    const ms = computeFinancingMilestones({
      dates: dates(),
      underContractDate: "2026-06-01",
      financingContingencyDays: 21,
    });
    expect(ms).toHaveLength(0);
  });

  it("emits the derived CTC milestone once any explicit date is entered", () => {
    const ms = computeFinancingMilestones({
      dates: dates({ loanApplicationDate: "2026-06-05" }),
      underContractDate: "2026-06-01",
      financingContingencyDays: 21,
    });
    const ctc = ms.find((m) => m.id === FINANCING_MILESTONE_IDS.clearToClose);
    expect(ctc?.date).toBe("2026-06-22");
  });

  it("daysToClearToClose reflects the derived date relative to today", () => {
    const input: FinancingInput = {
      dates: dates(),
      underContractDate: "2026-06-01",
      financingContingencyDays: 21,
    };
    expect(daysToClearToClose(input, "2026-06-20")).toBe(2);
    expect(daysToClearToClose(input, "2026-06-22")).toBe(0);
    expect(daysToClearToClose({ dates: dates() }, "2026-06-20")).toBeNull();
  });
});

// --- appraisal arithmetic (reused from clear-to-close, neutral framing) -----

describe("financingAppraisalGap (reused low-appraisal math)", () => {
  it("computes the gap and the more-cash option identically to clear-to-close", () => {
    const r = financingAppraisalGap({
      contractPrice: 500_000,
      appraisedValue: 480_000,
      plannedDownPayment: 100_000,
    });
    expect(r.gap).toBe(20_000);
    expect(r.isLow).toBe(true);
    expect(r.optionMoreCash.extraCash).toBe(20_000);
    expect(r.optionMoreCash.totalCashNeeded).toBe(120_000);
  });

  it("reports no gap when the appraisal meets or exceeds contract", () => {
    const r = financingAppraisalGap({
      contractPrice: 500_000,
      appraisedValue: 500_000,
      plannedDownPayment: 100_000,
    });
    expect(r.gap).toBe(0);
    expect(r.isLow).toBe(false);
  });
});

// --- SAFE-Act content boundary (assert in a test) ---------------------------

describe("SAFE-Act content boundary", () => {
  const allText = FINANCING_STEPS.map((s) => `${s.label} ${s.description}`)
    .join(" ")
    .toLowerCase();

  it("frames every step as process — 'ask your lender' present", () => {
    expect(allText).toContain("ask your lender");
  });

  it("never quotes a rate-as-offer or a percentage rate", () => {
    // No "%", no "X% rate", no "interest rate of N".
    expect(/\d+(\.\d+)?\s*%/.test(allText)).toBe(false);
    expect(allText).not.toMatch(/rate of \d/);
    expect(allText).not.toMatch(/at \d+(\.\d+)?\s*percent/);
  });

  it("never recommends or names a specific lender as advice", () => {
    // No directive recommendation language and no brand-name lenders.
    expect(allText).not.toMatch(/we recommend/);
    expect(allText).not.toMatch(/you should use/);
    expect(allText).not.toMatch(/rocket mortgage|wells fargo|chase|quicken/);
  });
});

// --- reminder composition (R1) ----------------------------------------------

describe("financing milestones compose into R1 reminders", () => {
  it("computeReminders arms reminders for financing milestones", () => {
    const ms = computeFinancingMilestones({
      dates: dates({
        loanApplicationDate: "2026-06-10",
        clearToCloseByDate: "2026-06-30",
      }),
    });
    const reminders = computeReminders(ms, {
      dealId: "deal-1",
      leadDays: [3, 1, 0],
    });
    // Each milestone arms one reminder per lead-day.
    const ctcReminders = reminders.filter(
      (r) => r.milestoneId === FINANCING_MILESTONE_IDS.clearToClose,
    );
    expect(ctcReminders).toHaveLength(3);
    expect(ctcReminders.map((r) => r.fireAtISO).sort()).toEqual([
      "2026-06-27",
      "2026-06-29",
      "2026-06-30",
    ]);
  });

  it("a financing reminder surfaces as due once its fire date passes the watermark", () => {
    const ms = computeFinancingMilestones({
      dates: dates({ clearToCloseByDate: "2026-06-30" }),
    });
    const reminders = computeReminders(ms, { dealId: "deal-1", leadDays: [3] });
    // Fire date is 2026-06-27. Before that: not due. On/after: due.
    expect(dueReminders(reminders, "2026-06-20", "2026-06-26")).toHaveLength(0);
    expect(dueReminders(reminders, "2026-06-20", "2026-06-27")).toHaveLength(1);
  });
});

// --- date-move re-fires (diffReminders) -------------------------------------

describe("moving a financing date re-fires the affected reminder", () => {
  it("diffReminders arms the new fire date and cancels the stale one", () => {
    const before = computeReminders(
      computeFinancingMilestones({
        dates: dates({ clearToCloseByDate: "2026-06-30" }),
      }),
      { dealId: "deal-1", leadDays: [3] },
    );
    const after = computeReminders(
      computeFinancingMilestones({
        dates: dates({ clearToCloseByDate: "2026-07-07" }), // moved a week later
      }),
      { dealId: "deal-1", leadDays: [3] },
    );

    const diff = diffReminders(before, after);
    expect(diff.toArm.map((r) => r.fireAtISO)).toEqual(["2026-07-04"]);
    expect(diff.toCancel.map((r) => r.fireAtISO)).toEqual(["2026-06-27"]);
  });

  it("re-entry with identical dates is a no-op (no double-arm)", () => {
    const set = () =>
      computeReminders(
        computeFinancingMilestones({
          dates: dates({ clearToCloseByDate: "2026-06-30" }),
        }),
        { dealId: "deal-1", leadDays: [3, 1, 0] },
      );
    const diff = diffReminders(set(), set());
    expect(diff.toArm).toHaveLength(0);
    expect(diff.toCancel).toHaveLength(0);
  });
});

// --- cockpit composition (R3) -----------------------------------------------

describe("financing milestones compose into R3 cockpit + the union source", () => {
  it("allDealMilestones unions tracker + financing milestones", () => {
    const ms = allDealMilestones({
      underContractDate: "2026-06-01",
      closingDate: "2026-08-01",
      offsets: defaultOffsets,
      financing: dates({ loanApplicationDate: "2026-06-05" }),
    });
    const ids = ms.map((m) => m.id);
    expect(ids).toContain("earnest-money"); // tracker milestone
    expect(ids).toContain(FINANCING_MILESTONE_IDS.loanApplication); // financing
  });

  it("a financing milestone surfaces as a cockpit next-action", () => {
    const rollups = buildHomeRollups({
      progress: {},
      totalJourneyTasks: 10,
      showings: {
        "home-1": {
          listingId: "home-1",
          status: "seen",
          address: "1 Main St",
          city: "Austin",
          state: "TX",
          createdAt: "2026-06-01T00:00:00Z",
          updatedAt: "2026-06-02T00:00:00Z",
        },
      },
      offers: {},
      tracker: {
        underContractDate: "2026-06-01",
        closingDate: "2026-08-01",
        offsets: defaultOffsets,
        docs: {},
        financing: dates({ loanApplicationDate: "2026-06-03" }),
      },
      today: "2026-06-02",
    });
    // The nearest deadline should be the financing loan-application milestone.
    expect(rollups[0].nextDeadline?.id).toBe(
      FINANCING_MILESTONE_IDS.loanApplication,
    );
    const actions = computeNextActions(rollups, "2026-06-02");
    expect(actions[0].dueISO).toBe("2026-06-03");
    expect(actions[0].hasDate).toBe(true);
  });

  it("with no explicit financing dates the cockpit is unchanged (graceful empty)", () => {
    const tracker = {
      underContractDate: "2026-06-01",
      closingDate: "2026-08-01",
      offsets: defaultOffsets,
    };
    const without = allDealMilestones(tracker);
    const withEmpty = allDealMilestones({ ...tracker, financing: dates() });
    // Empty financing dates add no milestones — the derived CTC does not
    // auto-populate, so the stream is identical to the tracker-only stream.
    expect(withEmpty.map((m) => m.id)).toEqual(without.map((m) => m.id));
  });
});
