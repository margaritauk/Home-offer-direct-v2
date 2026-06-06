"use client";

import { useEffect } from "react";
import { useStateSelection } from "@/hooks/use-state-selection";

/**
 * When a buyer lands on a specific state's guide page, adopt it as their
 * selected state so the rest of the journey personalizes to match. Renders
 * nothing.
 */
export function SetStateOnVisit({ code }: { code: string }) {
  const { stateCode, hydrated, selectState } = useStateSelection();

  useEffect(() => {
    if (hydrated && stateCode !== code) selectState(code);
    // Only re-run when the page's state code changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, hydrated]);

  return null;
}
