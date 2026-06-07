"use client";

import Link from "next/link";
import { getStateProfile, dualAgencyLabels } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { StatePicker } from "@/components/state-picker";

/**
 * Agency explainer + "what not to disclose" coaching (issue #19).
 *
 * Explains that the listing agent represents the SELLER, lists what an
 * unrepresented buyer should keep to themselves, and shows a state-aware
 * dual-agency note read from the legal engine (`dualAgency`, issue #27) —
 * flagging states where dual agency is banned.
 *
 * GUARDRAIL (Fair Housing, #22): this is purely educational and steers buyers
 * toward transaction facts. It never asks for or volunteers protected-class
 * information.
 */

/** What an unrepresented buyer should keep to themselves. */
const KEEP_TO_YOURSELF: { label: string; why: string }[] = [
  {
    label: "Your maximum budget / true price ceiling",
    why: "The listing agent must relay it to the seller — it becomes a negotiating target.",
  },
  {
    label: "Your urgency or timeline",
    why: "\"We need to move by August\" tells the seller you'll concede to close fast.",
  },
  {
    label: "The most you'd actually pay",
    why: "Naming a stretch number undercuts any offer below it.",
  },
  {
    label: "Your financial strength",
    why: "\"We just got an inheritance\" or income details signal you can pay more.",
  },
];

/** Safe to share — signals seriousness without revealing your ceiling. */
const SAFE_TO_SHARE = [
  "A pre-approval letter (or proof of funds for cash) — shows you're serious",
  "Factual questions about the property and what conveys",
  "A request for the seller's disclosures",
];

export function AgencyExplainer() {
  const { stateCode, hydrated } = useStateSelection();

  const profile = hydrated && stateCode ? getStateProfile(stateCode) : undefined;
  const dualAgency = profile ? dualAgencyLabels[profile.dualAgency] : undefined;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-ink">
        Who the listing agent works for
      </h3>
      <p className="mt-2 text-sm text-ink-soft">
        The listing agent represents the <strong>seller</strong> — not you. As an
        unrepresented buyer you&apos;re a &ldquo;customer,&rdquo; not a client.
        The agent owes you <strong>honesty, fair dealing, and disclosure of
        material facts</strong>, and can answer factual questions, but they
        cannot advise you and must pass what you say along to the seller.
      </p>

      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          🤐 Keep these to yourself
        </p>
        <ul className="mt-2 space-y-2">
          {KEEP_TO_YOURSELF.map((item) => (
            <li key={item.label} className="text-sm text-amber-900">
              <span className="font-medium">{item.label}.</span>{" "}
              <span className="text-amber-800">{item.why}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-900">
          ✅ Safe to share
        </p>
        <ul className="mt-2 space-y-1">
          {SAFE_TO_SHARE.map((item) => (
            <li key={item} className="text-sm text-emerald-900">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
        {!hydrated ? (
          <div aria-hidden className="h-5" />
        ) : !profile ? (
          <>
            <p className="text-sm font-semibold text-brand-800">
              📍 Dual-agency rules vary by state
            </p>
            <p className="mt-1 text-sm text-brand-900">
              Pick your state to see whether one agent can represent both you and
              the seller where you&apos;re buying.
            </p>
            <StatePicker className="mt-3 max-w-xs" label="" />
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-brand-800">
              📍 Agency in {profile.name}: {dualAgency!.label}
            </p>
            {profile.dualAgency === "banned" ? (
              <p className="mt-1 text-sm font-medium text-brand-900">
                🚫 Dual agency is <strong>banned</strong> in {profile.name}. One
                agent cannot represent both sides — the listing agent is the
                seller&apos;s, full stop.
              </p>
            ) : null}
            <p className="mt-1 text-sm text-brand-900">
              {profile.dualAgencyNote ?? dualAgency!.short}
            </p>
            <p className="mt-2 text-sm text-brand-900">
              Some brokerages use <strong>designated agency</strong> (a separate
              agent in the same firm for each side) or{" "}
              <strong>transaction brokerage</strong> (a neutral facilitator who
              represents neither). Either way, don&apos;t assume anyone at the
              listing brokerage is advocating for you.
            </p>
            <Link
              href={`/states/${profile.code.toLowerCase()}`}
              className="mt-2 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
            >
              Full {profile.name} guide →
            </Link>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Educational only, not legal advice. Agency rules vary by state and change
        — confirm specifics with your state&apos;s real estate commission or a
        local attorney.
      </p>
    </div>
  );
}
