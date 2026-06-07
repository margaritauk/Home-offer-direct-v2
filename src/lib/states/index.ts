import { getAllStateProfiles, getStateProfile, stateProfiles } from "./data";
import type { StateProfile } from "./types";

export { stateProfiles, getStateProfile, getAllStateProfiles };
export type {
  StateProfile,
  StateResource,
  ClosingPath,
  DisclosureRegime,
  DualAgencyStatus,
} from "./types";
export {
  closingPathLabels,
  disclosureRegimeLabels,
  dualAgencyLabels,
} from "./labels";

/** Lightweight option shape for select inputs (avoids shipping full profiles). */
export interface StateOption {
  code: string;
  name: string;
}

export function getStateOptions(): StateOption[] {
  return getAllStateProfiles().map((s) => ({ code: s.code, name: s.name }));
}

/** Profiles where an attorney is legally required at closing. */
export function attorneyStates(): StateProfile[] {
  return getAllStateProfiles().filter((s) => s.attorneyRequiredAtClosing);
}
