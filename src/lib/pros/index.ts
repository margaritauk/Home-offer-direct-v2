import {
  finderServices,
  samplePros,
  getFinderServices,
  getSamplePros,
} from "./data";
import type { ProRole } from "./types";

export { finderServices, samplePros, getFinderServices, getSamplePros };
export { proRoleLabels } from "./types";
export type { ProProfile, FinderService, ProRole } from "./types";

export const PRO_ROLES: ProRole[] = ["attorney", "inspector", "title-escrow"];

/** Distinct state codes that appear in the sample listings, sorted. */
export function sampleProStates(): string[] {
  const set = new Set<string>();
  for (const p of samplePros) for (const s of p.states) set.add(s);
  return [...set].sort();
}
