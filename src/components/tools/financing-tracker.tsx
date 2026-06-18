"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useFinancing } from "@/hooks/use-financing";
import { useTracker } from "@/hooks/use-tracker";
import { useAuth } from "@/hooks/use-auth";
import { statusFor, isValidDate, type MilestoneStatus } from "@/lib/deadlines";
import {
  computeFinancingMilestones,
  clearToCloseByDate,
  financingToday,
  FINANCING_MILESTONE_IDS,
  FINANCING_STEPS,
  type FinancingDates,
  type FinancingMilestoneId,
} from "@/lib/financing/milestones";
import { PropertyField } from "@/components/homes/property-field";
import { ToolDisclaimer } from "./tool-disclaimer";

/**
 * Financing-milestone tracker (S5-F1). A stage-scoped tool (registered in
 * STAGE_TOOLS under the under-contract / financing stages, not the top bar) that
 * captures the loan-process dates — application, appraisal, underwriting
 * conditions, clear-to-close-by — and turns them into the same `Milestone[]` the
 * cockpit (R3) and reminder banner (R1) consume. Persists via
 * `useStageTool("financing")`.
 *
 * States: loading (until hydrated) · empty (no dates → prompt) · default
 * (checklist + status chips) · inline date-validation error.
 *
 * SAFE-Act: PROCESS only. Copy says "ask your lender"; never a rate-as-offer,
 * never a lender recommendation or name as advice.
 */

const SR_FOOTER =
  "We surface your loan-process dates so you can ask your lender the right questions — we never quote a rate or recommend a lender.";

/** Which financing-date field each step edits. Clear-to-close is derived (read-only). */
const FIELD_BY_ID: Record<
  FinancingMilestoneId,
  keyof FinancingDates | "derived"
> = {
  [FINANCING_MILESTONE_IDS.loanApplication]: "loanApplicationDate",
  [FINANCING_MILESTONE_IDS.appraisal]: "appraisalDate",
  [FINANCING_MILESTONE_IDS.underwritingConditions]:
    "underwritingConditionsDate",
  [FINANCING_MILESTONE_IDS.clearToClose]: "derived",
};

const STATUS_CHIP: Record<
  MilestoneStatus,
  { label: string; icon: string; box: string }
> = {
  overdue: { label: "Overdue", icon: "⚠", box: "border-red-300 bg-red-50 text-red-900" },
  today: { label: "Due today", icon: "●", box: "border-amber-300 bg-amber-50 text-amber-900" },
  soon: { label: "Soon", icon: "›", box: "border-amber-200 bg-amber-50 text-amber-800" },
  upcoming: { label: "Upcoming", icon: "○", box: "border-slate-200 bg-slate-50 text-ink-soft" },
};

export function FinancingTracker() {
  const { value, hydrated, save, reset } = useFinancing();
  const { state: tracker } = useTracker();
  const { enabled: authEnabled, user } = useAuth();
  const today = financingToday();

  const input = useMemo(
    () => ({
      dates: value.dates,
      underContractDate: tracker.underContractDate,
      financingContingencyDays: tracker.offsets.financingContingencyDays,
    }),
    [value.dates, tracker.underContractDate, tracker.offsets.financingContingencyDays],
  );

  const milestones = useMemo(
    () => computeFinancingMilestones(input),
    [input],
  );
  const derivedCtc = useMemo(() => clearToCloseByDate(input), [input]);

  const setDate = (field: keyof FinancingDates, date: string) =>
    save((prev) => ({ ...prev, dates: { ...prev.dates, [field]: date } }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const hasAny = milestones.length > 0;
  const signedOut = authEnabled && !user;

  return (
    <div className="space-y-8">
      <PropertyField
        value={value.property ?? ""}
        onChange={(property) => save((prev) => ({ ...prev, property }))}
      />

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Financing milestones</h2>
          <span className="text-sm text-ink-soft">
            {milestones.length} tracked
          </span>
        </div>

        {!hasAny ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4">
            <p className="text-sm font-medium text-brand-900">
              Enter your financing dates to track the loan process
            </p>
            <p className="mt-1 text-sm text-brand-900">
              Between offer-accepted and closing, your loan is the thing most
              likely to slip. Add the dates below and we&apos;ll surface them on
              your dashboard so you can ask your lender the right questions.
            </p>
          </div>
        ) : null}

        <ol className="space-y-3">
          {FINANCING_STEPS.map((step) => {
            const field = FIELD_BY_ID[step.id];
            const derived = field === "derived";
            const dateValue = derived
              ? derivedCtc
              : value.dates[field as keyof FinancingDates];
            const valid = isValidDate(dateValue);
            const status = valid ? statusFor(dateValue, today) : null;
            const chip = status ? STATUS_CHIP[status] : null;
            const invalid = !derived && dateValue !== "" && !valid;

            return (
              <li
                key={step.id}
                className="grid items-start gap-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{step.label}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {step.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {derived ? (
                      <p className="text-sm text-ink-soft">
                        {valid ? (
                          <>
                            Derived from your financing contingency:{" "}
                            <span className="font-medium text-ink">
                              {derivedCtc}
                            </span>
                          </>
                        ) : (
                          <>
                            Set your under-contract date in the{" "}
                            <Link
                              href="/tracker"
                              className="font-medium text-brand-700 hover:underline"
                            >
                              deadline tracker
                            </Link>{" "}
                            to derive this date.
                          </>
                        )}
                      </p>
                    ) : (
                      <label className="block">
                        <span className="sr-only">
                          Date for {step.label}
                        </span>
                        <input
                          type="date"
                          className="field min-h-[44px]"
                          value={
                            value.dates[field as keyof FinancingDates]
                          }
                          aria-invalid={invalid ? true : undefined}
                          aria-describedby={
                            invalid ? `${step.id}-error` : undefined
                          }
                          onChange={(e) =>
                            setDate(
                              field as keyof FinancingDates,
                              e.target.value,
                            )
                          }
                        />
                      </label>
                    )}
                  </div>

                  {invalid ? (
                    <span
                      id={`${step.id}-error`}
                      role="alert"
                      className="mt-1 block text-xs text-red-600"
                    >
                      Enter a valid date (YYYY-MM-DD).
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {chip ? (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${chip.box}`}
                    >
                      <span aria-hidden>{chip.icon}</span>
                      {/* text label so status is never color-alone */}
                      {chip.label}
                      <span className="sr-only"> — due {dateValue}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted">No date yet</span>
                  )}
                  <SetReminderAffordance
                    armed={valid}
                    signedOut={signedOut}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        <p className="text-xs text-ink-muted">{SR_FOOTER}</p>
      </section>

      <div className="flex justify-end">
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset tool
        </button>
      </div>

      <ToolDisclaimer>
        This tracks the <strong>loan process</strong>, not your loan terms. It is
        educational, not lending advice. Ask your lender about your rate, your
        rate-lock, and your conditions — your lender and your purchase contract
        determine your actual timeline and numbers.
      </ToolDisclaimer>
    </div>
  );
}

/**
 * Per-milestone "Set a reminder" affordance. Reminders are gated on sign-in per
 * R1 (no new vendor gate): signed-out users see an explanatory disabled control,
 * not a dead button. With a date set + signed in, the reminder is already armed
 * by the shared milestone stream (the banner derives it), so this confirms it.
 */
function SetReminderAffordance({
  armed,
  signedOut,
}: {
  armed: boolean;
  signedOut: boolean;
}) {
  if (!armed) return null;
  if (signedOut) {
    return (
      <Link
        href="/account"
        className="text-xs font-medium text-brand-700 hover:underline"
        title="Reminders that follow you across devices need an account."
      >
        Sign in to arm a reminder
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
      <span aria-hidden>✓</span> Reminder armed
    </span>
  );
}
