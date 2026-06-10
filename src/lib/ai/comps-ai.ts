/**
 * Grounded AI comps selection (issue #104) — PURE prompt builder + parser plus a
 * thin server-only fetch wrapper.
 *
 * CORE GUARDRAIL (UPL/FHA): the AI may only rank/adjust REAL candidate sales we
 * hand it. It must NEVER invent a sale. Two layers enforce this:
 *   1. The prompt instructs Claude to pick only from the provided candidates and
 *      to frame the result as an ESTIMATE, not an appraisal.
 *   2. {@link parseCompsResponse} drops any returned comp whose id/address is not
 *      present in the candidate list — an anti-fabrication safety net that holds
 *      even if the model ignores the instruction.
 *
 * Free-text labels in the model's output are run through {@link screenText} so no
 * protected-class signal can reach the buyer (epic #33).
 *
 * No SDK dependency: {@link selectCompsWithAI} calls the Anthropic Messages REST
 * API directly via `fetch`. It only runs server-side when a key exists.
 */

import { screenText } from "@/lib/ai/screening";
import type { Comp } from "@/lib/tools/comps";
import type { CandidateSale, CompsSubject } from "@/lib/tools/comps-source";

/** Small, fast model — we only ask it to rank/adjust a short candidate list. */
const COMPS_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export interface CompsPrompt {
  system: string;
  user: string;
}

/**
 * Build the grounded prompt. The candidates are embedded as structured JSON so
 * the model can reference them by exact `id`. The system prompt nails down the
 * three non-negotiables: pick only from the list, never invent a sale, and frame
 * everything as an estimate (not an appraisal).
 *
 * PURE — no network, no env. Fully unit-testable.
 */
export function buildCompsPrompt(
  subject: CompsSubject,
  candidates: CandidateSale[],
): CompsPrompt {
  const system = [
    "You are a real-estate comps assistant for an unrepresented home buyer.",
    "You help select and adjust comparable recent sales to ESTIMATE a fair value.",
    "",
    "HARD RULES — you must follow every one:",
    "1. Select comps ONLY from the provided candidate sales. You may pick a",
    "   subset and rank them, but you must NOT invent, fabricate, or add any sale",
    "   that is not in the candidate list. Reference each chosen comp by its exact",
    '   "id" from the list.',
    "2. For each chosen comp, suggest a net dollar adjustment (positive if the",
    "   comp is superior to the subject, negative if inferior) and a one-line",
    "   reason grounded in the provided facts (size, distance, recency).",
    "3. This is an ESTIMATE to support the buyer's own judgment. It is",
    "   not an appraisal, and not financial or legal advice. Never claim otherwise.",
    "4. Never reference or infer any protected class (race, religion, national",
    "   origin, familial status, disability, sex, age, source of income) or write",
    "   a personal appeal. Stick to neutral transaction and property facts.",
    "5. If none of the candidates are reasonably comparable, return an empty",
    '   "comps" array.',
    "",
    "Respond with ONLY a JSON object of this exact shape, no prose, no markdown:",
    '{ "comps": [ { "id": "<candidate id>", "label": "<address>",',
    '  "salePrice": <number>, "sqft": <number>, "adjustment": <number>,',
    '  "reason": "<one line>" } ] }',
  ].join("\n");

  const user = [
    "Subject home:",
    JSON.stringify(
      {
        label: subject.label ?? "",
        sqft: subject.sqft ?? null,
        city: subject.city ?? "",
        state: subject.state ?? "",
      },
      null,
      2,
    ),
    "",
    "Candidate recent sales (choose only from these):",
    JSON.stringify(candidates, null, 2),
  ].join("\n");

  return { system, user };
}

interface RawComp {
  id?: unknown;
  label?: unknown;
  salePrice?: unknown;
  sqft?: unknown;
  adjustment?: unknown;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Tolerantly parse the model's JSON response into `Comp[]`.
 *
 * Anti-fabrication safety net: each returned comp is matched against the
 * `candidates` by `id` (preferred) or, failing that, by normalized address. Any
 * comp that does not correspond to a real candidate is DROPPED — the model
 * cannot smuggle in a sale we never provided.
 *
 * Each surviving comp's facts are anchored to the matched candidate (label,
 * salePrice, sqft come from OUR data, not the model's), so the model can only
 * influence the *selection* and the *adjustment*, never the underlying numbers.
 * The label is screened for protected-class signals.
 *
 * Malformed / empty / non-JSON input → `[]` (never throws).
 */
export function parseCompsResponse(
  text: string,
  candidates: CandidateSale[],
): Comp[] {
  const byId = new Map(candidates.map((c) => [normalize(c.id), c]));
  const byAddress = new Map(candidates.map((c) => [normalize(c.address), c]));

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    return [];
  }

  const rawComps = isRecord(parsed) && Array.isArray(parsed.comps)
    ? parsed.comps
    : [];

  const out: Comp[] = [];
  const seen = new Set<string>();

  for (const raw of rawComps) {
    if (!isRecord(raw)) continue;
    const r = raw as RawComp;

    // Match to a REAL candidate; drop anything that isn't one (anti-fabrication).
    const idKey = typeof r.id === "string" ? normalize(r.id) : "";
    const addrKey = typeof r.label === "string" ? normalize(r.label) : "";
    const candidate = byId.get(idKey) ?? byAddress.get(addrKey);
    if (!candidate) continue;

    // De-dupe if the model lists the same candidate twice.
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);

    out.push({
      id: candidate.id,
      // Facts come from OUR candidate data; label is screened.
      label: screenText(candidate.address).text,
      salePrice: candidate.salePrice,
      sqft: candidate.sqft,
      // Only the adjustment is taken from the model.
      adjustment: num(r.adjustment, 0),
    });
  }

  return out;
}

/**
 * Pull a JSON object out of the model text. Handles a bare JSON object as well
 * as one wrapped in ```json fences or surrounded by stray prose, by slicing from
 * the first `{` to the last `}`.
 */
function extractJson(text: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return "";
  return trimmed.slice(start, end + 1);
}

export interface SelectCompsOptions {
  apiKey: string;
}

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

/**
 * Server-only: build the grounded prompt, POST it to the Anthropic Messages REST
 * API via `fetch`, and run the response through {@link parseCompsResponse}. Only
 * called when an API key exists. Returns `[]` for an empty candidate list without
 * making a network call (no candidates == nothing to rank, never fabricate).
 */
export async function selectCompsWithAI(
  subject: CompsSubject,
  candidates: CandidateSale[],
  { apiKey }: SelectCompsOptions,
): Promise<Comp[]> {
  if (candidates.length === 0) return [];

  const { system, user } = buildCompsPrompt(subject, candidates);

  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: COMPS_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic request failed: ${res.status}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");

  return parseCompsResponse(text, candidates);
}
