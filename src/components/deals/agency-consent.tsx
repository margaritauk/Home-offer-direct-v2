"use client";

import { useEffect, useState } from "react";
import type { AgencyRelationship, DealAgency } from "@/lib/deals/types";
import {
  AGENCY_RELATIONSHIP_HELP,
  AGENCY_RELATIONSHIP_LABELS,
  FINANCIAL_CONSENT_PRIVACY_NOTE,
  FINANCIAL_CONSENT_PROMPT,
} from "@/lib/deals/agency-copy";
import { LegalDraftBanner } from "./legal-draft-banner";

const RELATIONSHIP_OPTIONS: readonly AgencyRelationship[] = [
  "represents_buyer",
  "listing_side",
  "unrepresented",
  "unknown",
];

/**
 * Agency-relationship + financial-consent capture (#76). Owner-editable; other
 * members see the captured state read-only. All wording is centralized in
 * `agency-copy.ts` and sits behind the legal-draft banner until counsel signs
 * off. Persists a dated record (capture timestamps shown).
 */
export function AgencyConsent({
  agency,
  isOwner,
  save,
}: {
  agency: DealAgency | null;
  isOwner: boolean;
  save: (input: {
    agencyRelationship: AgencyRelationship;
    financialConsent: boolean;
  }) => Promise<{ error?: string }>;
}) {
  const [relationship, setRelationship] = useState<AgencyRelationship>(
    agency?.agencyRelationship ?? "unknown",
  );
  const [consent, setConsent] = useState<boolean>(agency?.financialConsent ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setRelationship(agency?.agencyRelationship ?? "unknown");
    setConsent(agency?.financialConsent ?? false);
  }, [agency]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const res = await save({ agencyRelationship: relationship, financialConsent: consent });
    setBusy(false);
    if (res.error) setError(res.error);
    else setInfo("Saved. A dated record of this agreement has been stored.");
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-base font-semibold">Representation &amp; data sharing</h3>
      <LegalDraftBanner />

      {agency ? (
        <p className="text-xs text-ink-muted">
          Last captured{" "}
          {agency.agencyCapturedAt
            ? new Date(agency.agencyCapturedAt).toLocaleString()
            : "—"}
          {agency.financialConsent && agency.consentCapturedAt
            ? ` · financial consent given ${new Date(agency.consentCapturedAt).toLocaleString()}`
            : ""}
        </p>
      ) : null}

      {isOwner ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-ink-soft">
              Agency relationship
            </legend>
            <div className="mt-2 space-y-2">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="agency-relationship"
                    className="mt-1"
                    checked={relationship === opt}
                    onChange={() => setRelationship(opt)}
                  />
                  <span>
                    <span className="font-medium">
                      {AGENCY_RELATIONSHIP_LABELS[opt]}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {AGENCY_RELATIONSHIP_HELP[opt]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              <span className="font-medium">{FINANCIAL_CONSENT_PROMPT}</span>
              <span className="block text-xs text-ink-muted">
                {FINANCIAL_CONSENT_PRIVACY_NOTE}
              </span>
            </span>
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {info ? <p className="text-sm text-brand-700">{info}</p> : null}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save representation & consent"}
          </button>
        </form>
      ) : (
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Relationship:</span>{" "}
            {AGENCY_RELATIONSHIP_LABELS[relationship]}
          </p>
          <p>
            <span className="font-medium">Financial data shared:</span>{" "}
            {consent ? "Yes (buyer consented)" : "No (default — not shared)"}
          </p>
        </div>
      )}
    </div>
  );
}
