import { type ReactNode } from "react";

type Tone = "warning" | "info" | "danger";

const toneStyles: Record<Tone, { box: string; icon: string; label: string }> = {
  danger: {
    box: "border-red-300 bg-red-50 text-red-900",
    icon: "🚨",
    label: "Watch out",
  },
  warning: {
    box: "border-amber-300 bg-amber-50 text-amber-900",
    icon: "⚠️",
    label: "Important",
  },
  info: {
    box: "border-brand-200 bg-brand-50 text-brand-900",
    icon: "💡",
    label: "Good to know",
  },
};

/**
 * Prominent callout for trust-critical moments (wire fraud, the Closing
 * Disclosure 3-day rule, the final walkthrough) that self-serve buyers must not
 * miss. Deliberately high-visibility.
 */
export function TrustCallout({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const styles = toneStyles[tone];
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-lg border p-4 text-sm ${styles.box}`}
    >
      <span aria-hidden className="text-lg leading-none">
        {styles.icon}
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title ?? styles.label}</p>
        <div className="leading-relaxed [&_a]:underline">{children}</div>
      </div>
    </div>
  );
}
