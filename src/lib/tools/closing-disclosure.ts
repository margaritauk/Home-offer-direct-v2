/**
 * Closing Disclosure (CD) vs. Loan Estimate (LE) comparison math (issue #119,
 * Wave C / C1).
 *
 * Before closing, the buyer compares the figures on their final Closing
 * Disclosure against the Loan Estimate they got when they applied. This module
 * models the standard fee lines, computes the per-line delta (CD − LE), and
 * flags increases that exceed the CFPB / TRID **tolerance buckets** so the buyer
 * knows which discrepancies to raise with their lender or closing agent.
 *
 * It also computes the **3-business-day rule** date math: the CD must be
 * RECEIVED at least three business days before consummation (closing).
 *
 * ── TOLERANCE BUCKETS (CFPB Reg. Z, 12 CFR §1026.19(e)(3)) ──────────────────
 *
 *  - "zero"  — ZERO tolerance: the charge cannot increase at all from LE to CD.
 *      Lender/origination charges, transfer taxes, and fees for services the
 *      buyer could NOT shop for. Any increase is a tolerance violation.
 *
 *  - "ten"   — 10% CUMULATIVE tolerance: recording fees, plus charges for
 *      services the buyer COULD shop for but where they chose a provider from
 *      the lender's written list. These are tested TOGETHER as a bucket: a
 *      violation occurs only when the bucket's TOTAL increased by more than 10%
 *      (an individual line may rise without a violation as long as the bucket
 *      total stays within 10%).
 *
 *  - "none"  — NO tolerance (may legitimately change): prepaids (prepaid
 *      interest, property-insurance premiums), escrow/impound deposits, and
 *      services the buyer shopped for OFF the lender's written list. These are
 *      INFORMATIONAL — they can change without being a violation.
 *
 * GUARDRAIL (SAFE Act / financial, #119): this is EDUCATION and an ESTIMATE,
 * not legal or financial advice. It flags discrepancies for the buyer to raise;
 * the lender / closing agent is the authority on whether a "tolerance cure" is
 * owed. All numbers are user-entered from their own LE and CD. Pure arithmetic,
 * no I/O, defensive — mirrors the style of `comps.ts` / `lender-compare.ts`.
 *
 * ── 3-BUSINESS-DAY RULE / business-day definition ──────────────────────────
 * The Wave C research brief (`docs/research/interactive-stages-research.md`,
 * stage 11) requires confirming "the CD must be received at least 3 business
 * days before closing" but is SILENT on whether Saturdays/holidays count. Per
 * the task instruction, when the doc is silent we use TRID's *specific* business
 * day definition for the CD waiting period: a business day is every calendar day
 * EXCEPT Sundays and the legal federal public holidays in 5 U.S.C. §6103(a)
 * (so Saturdays DO count). See `isBusinessDay` below.
 *
 * NOTE: this DIFFERS from `deadlines.ts` `businessDaysBefore`, which uses the
 * simpler Mon–Fri "general" business-day definition for its timeline display.
 * The CD waiting period is governed by the stricter "specific" definition, so
 * this tool implements that here rather than reusing the Mon–Fri helper.
 */

export type ToleranceBucket = "zero" | "ten" | "none";

/** Human label for each bucket, for UI grouping/headers. */
export const BUCKET_LABELS: Record<ToleranceBucket, string> = {
  zero: "Zero tolerance — cannot increase",
  ten: "10% cumulative tolerance",
  none: "No tolerance — may change",
};

/** One standard fee line the buyer compares between LE and CD. */
export interface FeeLine {
  id: string;
  /** Line label (e.g. "Origination charges"). Facts only; not used in math. */
  label: string;
  /** Amount on the Loan Estimate, in dollars. */
  le: number;
  /** Amount on the Closing Disclosure, in dollars. */
  cd: number;
  /** Which CFPB tolerance bucket this line belongs to. */
  bucket: ToleranceBucket;
}

/**
 * The canonical set of standard lines, grouped by bucket. The UI seeds a fresh
 * worksheet from this; `id`s are stable so persisted blobs stay aligned even if
 * labels are reworded.
 */
export const STANDARD_LINES: ReadonlyArray<Omit<FeeLine, "le" | "cd">> = [
  // Zero tolerance.
  { id: "origination", label: "Origination / lender charges", bucket: "zero" },
  {
    id: "unshoppable-services",
    label: "Services you could not shop for (appraisal, credit report, flood, tax service)",
    bucket: "zero",
  },
  { id: "transfer-taxes", label: "Transfer taxes", bucket: "zero" },
  // 10% cumulative tolerance.
  { id: "recording-fees", label: "Recording fees", bucket: "ten" },
  {
    id: "shoppable-on-list",
    label: "Services you shopped for from the lender's written list",
    bucket: "ten",
  },
  // No tolerance (may change).
  { id: "prepaid-interest", label: "Prepaid interest", bucket: "none" },
  {
    id: "insurance-premiums",
    label: "Property / homeowner's insurance premiums",
    bucket: "none",
  },
  { id: "escrow-deposit", label: "Initial escrow / impound deposit", bucket: "none" },
  {
    id: "shoppable-off-list",
    label: "Services you shopped for off the lender's list",
    bucket: "none",
  },
];

function num(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export interface LineDelta extends FeeLine {
  /** cd − le, in dollars (positive = increased). */
  delta: number;
  /**
   * True only for a ZERO-tolerance line that increased (delta > 0) — an
   * individual tolerance violation. Always false for "ten"/"none" lines (the
   * 10% bucket is judged cumulatively; "none" never violates).
   */
  flagged: boolean;
}

/**
 * Per-line delta (cd − le) plus a per-line flag for ZERO-tolerance lines that
 * increased. Pure; preserves input order.
 */
export function bucketDeltas(lines: FeeLine[]): LineDelta[] {
  return lines.map((line) => {
    const le = num(line.le);
    const cd = num(line.cd);
    const delta = cd - le;
    const flagged = line.bucket === "zero" && delta > 0;
    return { ...line, le, cd, delta, flagged };
  });
}

export interface TenPercentResult {
  /** Sum of LE amounts across the 10% bucket. */
  totalLE: number;
  /** Sum of CD amounts across the 10% bucket. */
  totalCD: number;
  /** Dollar increase (totalCD − totalLE); can be negative. */
  increase: number;
  /**
   * Percent increase of the bucket (increase / totalLE × 100), or 0 when the
   * bucket has no LE basis. Capped only by the inputs.
   */
  percentIncrease: number;
  /** True when the cumulative increase exceeds 10%. */
  exceeds: boolean;
}

/**
 * Whether the 10%-bucket CUMULATIVE increase exceeds 10%. Returns the bucket's
 * total LE, total CD, the dollar increase, the percent increase, and a boolean.
 *
 * Per TRID, the 10% bucket is judged on the SUM, not line by line. When the
 * bucket has no positive LE basis we report a 0% increase and no violation
 * (you can't exceed a tolerance on a $0 baseline via this educational tool).
 */
export function cumulativeTenPercentFlag(lines: FeeLine[]): TenPercentResult {
  const bucket = lines.filter((l) => l.bucket === "ten");
  const totalLE = bucket.reduce((s, l) => s + num(l.le), 0);
  const totalCD = bucket.reduce((s, l) => s + num(l.cd), 0);
  const increase = totalCD - totalLE;
  const percentIncrease = totalLE > 0 ? (increase / totalLE) * 100 : 0;
  // Use a tiny epsilon so floating-point noise at exactly 10% doesn't flag.
  const exceeds = totalLE > 0 && percentIncrease > 10 + 1e-9;
  return { totalLE, totalCD, increase, percentIncrease, exceeds };
}

export interface ToleranceViolation {
  /** Kind of violation, for UI copy. */
  kind: "zero-tolerance" | "ten-percent-cumulative";
  /** The offending line (for zero) or a synthetic bucket id (for the 10%). */
  lineId: string;
  label: string;
  /** Dollar amount over tolerance. */
  amountOver: number;
}

export interface ClosingDisclosureSummary {
  /** Every line with its delta + per-line flag, in input order. */
  lines: LineDelta[];
  /** Total of all LE amounts. */
  totalLE: number;
  /** Total of all CD amounts. */
  totalCD: number;
  /** totalCD − totalLE across all lines. */
  totalDelta: number;
  /** The 10%-bucket cumulative result (always present). */
  tenPercent: TenPercentResult;
  /** Ordered list of tolerance violations (zero-tolerance lines, then the 10% bucket). */
  violations: ToleranceViolation[];
  /** Convenience: any violation at all. */
  hasViolations: boolean;
}

/**
 * Roll the lines up into a full summary: totals, the 10%-bucket status, and the
 * list of tolerance violations (each zero-tolerance line that increased, plus
 * the 10% bucket when its cumulative increase exceeds 10%). "None"-bucket lines
 * never produce a violation. Pure.
 */
export function closingDisclosureSummary(
  lines: FeeLine[],
): ClosingDisclosureSummary {
  const deltas = bucketDeltas(lines);
  const totalLE = deltas.reduce((s, l) => s + l.le, 0);
  const totalCD = deltas.reduce((s, l) => s + l.cd, 0);
  const totalDelta = totalCD - totalLE;
  const tenPercent = cumulativeTenPercentFlag(lines);

  const violations: ToleranceViolation[] = [];
  for (const line of deltas) {
    if (line.flagged) {
      violations.push({
        kind: "zero-tolerance",
        lineId: line.id,
        label: line.label,
        amountOver: line.delta,
      });
    }
  }
  if (tenPercent.exceeds) {
    // The cure amount is the increase beyond the allowed 10% of the LE basis.
    const allowed = tenPercent.totalLE * 0.1;
    violations.push({
      kind: "ten-percent-cumulative",
      lineId: "ten-percent-bucket",
      label: "10% cumulative tolerance bucket",
      amountOver: tenPercent.increase - allowed,
    });
  }

  return {
    lines: deltas,
    totalLE,
    totalCD,
    totalDelta,
    tenPercent,
    violations,
    hasViolations: violations.length > 0,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3-business-day rule date math.
 * ────────────────────────────────────────────────────────────────────────── */

const MS_PER_DAY = 86_400_000;

/** Parse a YYYY-MM-DD string to a UTC midnight timestamp. NaN if invalid. */
function parseISO(iso: string | Date): number {
  if (iso instanceof Date) {
    const ts = Date.UTC(
      iso.getUTCFullYear(),
      iso.getUTCMonth(),
      iso.getUTCDate(),
    );
    return Number.isNaN(ts) ? Number.NaN : ts;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return Number.NaN;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(ts);
  if (
    d.getUTCFullYear() !== Number(m[1]) ||
    d.getUTCMonth() !== Number(m[2]) - 1 ||
    d.getUTCDate() !== Number(m[3])
  ) {
    return Number.NaN;
  }
  return ts;
}

function formatISO(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * Fixed-date U.S. federal holidays observed for the CD "specific business day"
 * rule. For holidays that fall on a weekend, the federal observance shifts
 * (Saturday → preceding Friday, Sunday → following Monday); we apply that shift.
 * Nth-weekday holidays (MLK, Presidents', Memorial, Labor, Columbus,
 * Thanksgiving) and Juneteenth are computed in `federalHolidaysFor`.
 */
function nthWeekdayOfMonth(
  year: number,
  month0: number,
  weekday: number,
  n: number,
): number {
  // month0 0-based; weekday 0=Sun..6=Sat; n = 1..5
  const first = Date.UTC(year, month0, 1);
  const firstDow = new Date(first).getUTCDay();
  const offset = (weekday - firstDow + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return Date.UTC(year, month0, day);
}

function lastWeekdayOfMonth(
  year: number,
  month0: number,
  weekday: number,
): number {
  // Last day of month, walk back to the target weekday.
  const last = Date.UTC(year, month0 + 1, 0);
  const lastDow = new Date(last).getUTCDay();
  const offset = (lastDow - weekday + 7) % 7;
  return last - offset * MS_PER_DAY;
}

/** Shift a fixed-date holiday to its observed date when it lands on a weekend. */
function observed(ts: number): number {
  const dow = new Date(ts).getUTCDay();
  if (dow === 6) return ts - MS_PER_DAY; // Sat → Fri
  if (dow === 0) return ts + MS_PER_DAY; // Sun → Mon
  return ts;
}

/** The set of federal-holiday timestamps (observed) for a given year. */
function federalHolidaysFor(year: number): Set<number> {
  const fixed = [
    Date.UTC(year, 0, 1), // New Year's Day
    Date.UTC(year, 5, 19), // Juneteenth
    Date.UTC(year, 6, 4), // Independence Day
    Date.UTC(year, 10, 11), // Veterans Day
    Date.UTC(year, 11, 25), // Christmas Day
  ].map(observed);

  const floating = [
    nthWeekdayOfMonth(year, 0, 1, 3), // MLK — 3rd Mon Jan
    nthWeekdayOfMonth(year, 1, 1, 3), // Presidents' — 3rd Mon Feb
    lastWeekdayOfMonth(year, 4, 1), // Memorial — last Mon May
    nthWeekdayOfMonth(year, 8, 1, 1), // Labor — 1st Mon Sep
    nthWeekdayOfMonth(year, 9, 1, 2), // Columbus — 2nd Mon Oct
    nthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving — 4th Thu Nov
  ];

  return new Set([...fixed, ...floating]);
}

/**
 * Whether `iso` is a CD "specific business day": every calendar day EXCEPT
 * Sundays and federal public holidays (Saturdays DO count). See the module
 * header for the source of this definition.
 */
export function isBusinessDay(iso: string | Date): boolean {
  const ts = parseISO(iso);
  if (Number.isNaN(ts)) return false;
  const dow = new Date(ts).getUTCDay();
  if (dow === 0) return false; // Sunday
  const year = new Date(ts).getUTCFullYear();
  return !federalHolidaysFor(year).has(ts);
}

/**
 * The earliest date the buyer can sign / consummate given the date the CD was
 * RECEIVED. Counting starts the day AFTER receipt; three full business days
 * must pass, so the earliest signing date is the 3rd business day after the
 * receipt date (receipt day not counted). Returns "" for an invalid input.
 *
 * Example (no holidays): CD received Mon → +3 business days (Tue, Wed, Thu) →
 * earliest signing is Fri.
 */
export function earliestSigningDate(cdReceivedDate: string | Date): string {
  let ts = parseISO(cdReceivedDate);
  if (Number.isNaN(ts)) return "";
  let counted = 0;
  while (counted < 3) {
    ts += MS_PER_DAY;
    if (isBusinessDay(new Date(ts))) counted += 1;
  }
  return formatISO(ts);
}

/**
 * The LATEST date the CD must be RECEIVED by to keep a given closing date — i.e.
 * the date that is three business days before `closingDate` (closing day not
 * counted). The buyer must receive the CD on or before this date. Returns "" for
 * an invalid input.
 *
 * Example (no holidays): closing Fri → CD must be received on or before Mon
 * (Tue, Wed, Thu are the three intervening business days).
 */
export function cdDeadline(closingDate: string | Date): string {
  let ts = parseISO(closingDate);
  if (Number.isNaN(ts)) return "";
  let counted = 0;
  while (counted < 3) {
    ts -= MS_PER_DAY;
    if (isBusinessDay(new Date(ts))) counted += 1;
  }
  return formatISO(ts);
}
