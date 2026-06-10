"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import {
  DOC_VAULT_ITEMS,
  MOVE_IN_ITEMS,
  groupByCategory,
} from "@/lib/tools/move-in";
import { ToolDisclaimer } from "./tool-disclaimer";

interface MoveInState {
  /** Item id → done. */
  checked: Record<string, boolean>;
}

const INITIAL: MoveInState = { checked: {} };

function normalize(raw: MoveInState): MoveInState {
  return {
    checked:
      raw && raw.checked && typeof raw.checked === "object" ? raw.checked : {},
  };
}

export function MoveInTracker() {
  const { value, hydrated, save, reset } = useStageTool<MoveInState>(
    "move-in",
    INITIAL,
  );

  const state = useMemo(() => normalize(value), [value]);
  const groups = useMemo(() => groupByCategory(MOVE_IN_ITEMS), []);

  const allItems = [...MOVE_IN_ITEMS, ...DOC_VAULT_ITEMS];
  const doneCount = allItems.filter((i) => state.checked[i.id]).length;

  const toggle = (id: string) =>
    save((prev) => {
      const cur = normalize(prev);
      return { ...cur, checked: { ...cur.checked, [id]: !cur.checked[id] } };
    });

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {doneCount}/{allItems.length} done
        </p>
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset
        </button>
      </div>

      {groups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-lg font-semibold">{group.category}</h2>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <CheckItem
                key={item.id}
                label={item.label}
                done={Boolean(state.checked[item.id])}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <div>
          <h2 className="text-lg font-semibold">Document vault</h2>
          <p className="text-sm text-ink-soft">
            Confirm you&apos;ve stored these somewhere safe (and backed up) —
            you&apos;ll need them for taxes, refinancing, or selling later.
          </p>
        </div>
        <ul className="space-y-2">
          {DOC_VAULT_ITEMS.map((item) => (
            <CheckItem
              key={item.id}
              label={item.label}
              done={Boolean(state.checked[item.id])}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </ul>
      </section>

      <ToolDisclaimer>
        A <strong>checklist for education</strong>, not tax or legal advice.
        Homestead exemptions, deadlines, and required documents vary by state and
        county — confirm the specifics with your local assessor or attorney.
      </ToolDisclaimer>
    </div>
  );
}

function CheckItem({
  label,
  done,
  onToggle,
}: {
  label: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-300">
        <input
          type="checkbox"
          className="mt-0.5 accent-brand-600"
          checked={done}
          onChange={onToggle}
        />
        <span
          className={`text-sm ${done ? "text-ink-muted line-through" : "text-ink"}`}
        >
          {label}
        </span>
      </label>
    </li>
  );
}
