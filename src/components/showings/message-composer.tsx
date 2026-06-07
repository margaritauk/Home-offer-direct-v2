"use client";

import { useMemo, useState } from "react";
import {
  messageTemplates,
  renderTemplate,
  type TemplateValues,
} from "@/lib/showings/templates";

/**
 * Fair-Housing-safe message composer (issue #18): pick a template, fill in the
 * property/transaction blanks, copy to clipboard. Includes an inline reminder of
 * what NOT to disclose (links to the agency coaching, #19).
 *
 * GUARDRAIL (#22): only property/transaction fields are offered. No
 * protected-class inputs; no "love letter" template.
 */
export function MessageComposer({
  initialValues,
  initialTemplateId,
}: {
  initialValues?: TemplateValues;
  initialTemplateId?: string;
}) {
  const [templateId, setTemplateId] = useState(
    initialTemplateId ?? messageTemplates[0].id,
  );
  const [values, setValues] = useState<TemplateValues>(initialValues ?? {});
  const [copied, setCopied] = useState(false);

  const template = useMemo(
    () => messageTemplates.find((t) => t.id === templateId) ?? messageTemplates[0],
    [templateId],
  );

  const rendered = useMemo(
    () => renderTemplate(template, values),
    [template, values],
  );

  const set = (key: keyof TemplateValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const fields: { key: keyof TemplateValues; label: string; placeholder: string }[] = [
    { key: "agentName", label: "Listing agent name", placeholder: "e.g. Jordan Lee" },
    { key: "address", label: "Property address", placeholder: "e.g. 123 Maple St" },
    { key: "mlsNumber", label: "MLS #", placeholder: "e.g. 1234567" },
    { key: "dateOptions", label: "Date options", placeholder: "e.g. this Sat or Sun" },
    { key: "timeOptions", label: "Time options", placeholder: "e.g. late morning" },
    { key: "buyerName", label: "Your name", placeholder: "e.g. Alex Rivera" },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-ink">Message a listing agent</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Ready-made, factual messages. Fill in the blanks and copy. These stick to
        property and transaction facts only.
      </p>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">
          Template
        </span>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setCopied(false);
          }}
        >
          {messageTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 text-xs text-ink-muted">{template.description}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">
              {f.label}
            </span>
            <input
              type="text"
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">
          Preview
        </span>
        <textarea
          readOnly
          value={rendered}
          rows={10}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-ink"
          aria-label="Message preview"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={copy} className="btn-primary">
          {copied ? "Copied ✓" : "Copy message"}
        </button>
        <span className="text-xs text-ink-muted" aria-live="polite">
          {copied ? "Paste it into your email or text to the agent." : null}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Before you send:</strong> mention your pre-approval / proof of
        funds, but don&apos;t reveal your budget ceiling, timeline, or how much
        you&apos;d really pay. Keep it to property and transaction facts — no
        personal or family details.
      </div>
    </div>
  );
}
