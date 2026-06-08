/**
 * Shared "estimates only — not advice" disclaimer for the pre-offer interactive
 * tools (epic #64). Every tool renders one so the guardrail is consistent and
 * impossible to forget. Server component — pure render.
 */
export function ToolDisclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-xs text-ink-muted">{children}</p>
  );
}
