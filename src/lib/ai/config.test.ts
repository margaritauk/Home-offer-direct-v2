import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isAiCompsConfigured,
  isAiCompsEnabled,
  isCompsDemoEnabled,
} from "./config";

const KEYS = [
  "ANTHROPIC_API_KEY",
  "COMPS_DATA_SOURCE",
  "NEXT_PUBLIC_AI_COMPS_ENABLED",
  "NEXT_PUBLIC_COMPS_DEMO",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("isAiCompsConfigured (server gate)", () => {
  it("is false by default (no env set)", () => {
    expect(isAiCompsConfigured()).toBe(false);
  });

  it("is false with only an API key (no data source)", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(isAiCompsConfigured()).toBe(false);
  });

  it("is false with only a data source (no API key)", () => {
    process.env.COMPS_DATA_SOURCE = "attom";
    expect(isAiCompsConfigured()).toBe(false);
  });

  it("is false when the data source is blank/whitespace", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.COMPS_DATA_SOURCE = "   ";
    expect(isAiCompsConfigured()).toBe(false);
  });

  it("is true only with BOTH an API key and a real data source", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.COMPS_DATA_SOURCE = "attom";
    expect(isAiCompsConfigured()).toBe(true);
  });
});

describe("isAiCompsEnabled (client surface gate)", () => {
  it("is false by default (unset)", () => {
    expect(isAiCompsEnabled()).toBe(false);
  });

  it('is false for any value other than exactly "true"', () => {
    process.env.NEXT_PUBLIC_AI_COMPS_ENABLED = "1";
    expect(isAiCompsEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_AI_COMPS_ENABLED = "TRUE";
    expect(isAiCompsEnabled()).toBe(false);
  });

  it('is true only when set to exactly "true"', () => {
    process.env.NEXT_PUBLIC_AI_COMPS_ENABLED = "true";
    expect(isAiCompsEnabled()).toBe(true);
  });
});

describe("isCompsDemoEnabled (demo sample-comps gate)", () => {
  it("is false by default (unset)", () => {
    expect(isCompsDemoEnabled()).toBe(false);
  });

  it('is false for any value other than exactly "true"', () => {
    process.env.NEXT_PUBLIC_COMPS_DEMO = "1";
    expect(isCompsDemoEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_COMPS_DEMO = "TRUE";
    expect(isCompsDemoEnabled()).toBe(false);
  });

  it('is true only when set to exactly "true"', () => {
    process.env.NEXT_PUBLIC_COMPS_DEMO = "true";
    expect(isCompsDemoEnabled()).toBe(true);
  });

  it("is independent of the real AI path flags", () => {
    process.env.NEXT_PUBLIC_COMPS_DEMO = "true";
    expect(isCompsDemoEnabled()).toBe(true);
    expect(isAiCompsEnabled()).toBe(false);
    expect(isAiCompsConfigured()).toBe(false);
  });
});
